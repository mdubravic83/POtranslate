from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import polib
from deep_translator import GoogleTranslator
import io
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json
import time


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Thread pool for translation (blocking operations)
executor = ThreadPoolExecutor(max_workers=4)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Supported languages for Google Translate
SUPPORTED_LANGUAGES = {
    'hr': 'Croatian',
    'en': 'English',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'pl': 'Polish',
    'cs': 'Czech',
    'sk': 'Slovak',
    'hu': 'Hungarian',
    'sl': 'Slovenian',
    'sr': 'Serbian',
    'bs': 'Bosnian',
    'mk': 'Macedonian',
    'bg': 'Bulgarian',
    'ro': 'Romanian',
    'ru': 'Russian',
    'uk': 'Ukrainian',
    'tr': 'Turkish',
    'el': 'Greek',
    'ar': 'Arabic',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'id': 'Indonesian',
    'ms': 'Malay',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'ta': 'Tamil',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish'
}

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class TranslationEntry(BaseModel):
    msgid: str
    msgstr: str
    translated: str
    status: str  # 'success', 'skipped', 'error'

class TranslationResult(BaseModel):
    id: str
    filename: str
    source_lang: str
    target_lang: str
    total_entries: int
    translated_entries: int
    skipped_entries: int
    error_entries: int
    entries: List[TranslationEntry]
    created_at: datetime

class TranslationHistoryItem(BaseModel):
    id: str
    filename: str
    source_lang: str
    target_lang: str
    total_entries: int
    translated_entries: int
    created_at: str


def translate_text_sync(text: str, source_lang: str, target_lang: str) -> str:
    """Synchronous translation function to run in thread pool"""
    try:
        if not text or text.strip() == '':
            return text
        
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        result = translator.translate(text)
        return result if result else text
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise e


async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Async wrapper for translation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor, 
        translate_text_sync, 
        text, 
        source_lang, 
        target_lang
    )


def parse_po_file(content: bytes) -> polib.POFile:
    """Parse PO file content"""
    try:
        # Try different encodings
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                text = content.decode(encoding)
                po = polib.pofile(text)
                return po
            except (UnicodeDecodeError, IOError):
                continue
        raise ValueError("Could not decode PO file with any supported encoding")
    except Exception as e:
        logger.error(f"Error parsing PO file: {e}")
        raise


def generate_translated_po(original_po: polib.POFile, translations: List[TranslationEntry], target_lang: str) -> str:
    """Generate translated PO file content"""
    # Create a new PO file
    new_po = polib.POFile()
    new_po.metadata = original_po.metadata.copy()
    new_po.metadata['Language'] = target_lang
    new_po.metadata['Content-Type'] = 'text/plain; charset=UTF-8'
    
    # Create a mapping of msgid to translated text
    translation_map = {entry.msgid: entry.translated for entry in translations}
    
    for entry in original_po:
        new_entry = polib.POEntry(
            msgid=entry.msgid,
            msgstr=translation_map.get(entry.msgid, entry.msgstr),
            msgctxt=entry.msgctxt,
            occurrences=entry.occurrences,
            flags=entry.flags,
            comment=entry.comment,
            tcomment=entry.tcomment
        )
        new_po.append(new_entry)
    
    return str(new_po)


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "PO Translation Tool API"}


@api_router.get("/languages")
async def get_languages():
    """Get list of supported languages"""
    return {"languages": SUPPORTED_LANGUAGES}


@api_router.post("/translate")
async def translate_po_file(
    file: UploadFile = File(...),
    source_lang: str = Form('auto'),
    target_lang: str = Form('hr')
):
    """Upload and translate a PO file"""
    
    if not file.filename.endswith('.po'):
        raise HTTPException(status_code=400, detail="Only .po files are supported")
    
    if target_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported target language: {target_lang}")
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse PO file
        po = parse_po_file(content)
        
        # Prepare entries for translation
        entries = []
        translated_count = 0
        skipped_count = 0
        error_count = 0
        
        logger.info(f"Processing {len(po)} entries from {file.filename}")
        
        for entry in po:
            if not entry.msgid or entry.msgid.strip() == '':
                # Skip empty entries
                skipped_count += 1
                entries.append(TranslationEntry(
                    msgid=entry.msgid,
                    msgstr=entry.msgstr,
                    translated=entry.msgstr,
                    status='skipped'
                ))
                continue
            
            # Check if already translated and we should keep it
            if entry.msgstr and entry.msgstr.strip() != '':
                # Already has translation, skip
                skipped_count += 1
                entries.append(TranslationEntry(
                    msgid=entry.msgid,
                    msgstr=entry.msgstr,
                    translated=entry.msgstr,
                    status='skipped'
                ))
                continue
            
            try:
                # Translate the msgid
                translated = await translate_text(entry.msgid, source_lang, target_lang)
                
                entries.append(TranslationEntry(
                    msgid=entry.msgid,
                    msgstr=entry.msgstr,
                    translated=translated,
                    status='success'
                ))
                translated_count += 1
                
                # Add small delay to avoid rate limiting
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error translating '{entry.msgid}': {e}")
                error_count += 1
                entries.append(TranslationEntry(
                    msgid=entry.msgid,
                    msgstr=entry.msgstr,
                    translated=entry.msgstr,  # Keep original on error
                    status='error'
                ))
        
        # Create result
        result_id = str(uuid.uuid4())
        result = TranslationResult(
            id=result_id,
            filename=file.filename,
            source_lang=source_lang,
            target_lang=target_lang,
            total_entries=len(po),
            translated_entries=translated_count,
            skipped_entries=skipped_count,
            error_entries=error_count,
            entries=entries,
            created_at=datetime.now(timezone.utc)
        )
        
        # Store in database
        doc = result.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.translations.insert_one(doc)
        
        # Generate translated PO content
        translated_po_content = generate_translated_po(po, entries, target_lang)
        
        return {
            "id": result_id,
            "filename": file.filename,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "total_entries": len(po),
            "translated_entries": translated_count,
            "skipped_entries": skipped_count,
            "error_entries": error_count,
            "entries": [e.model_dump() for e in entries],
            "po_content": translated_po_content
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@api_router.get("/translations/{translation_id}/download")
async def download_translation(translation_id: str):
    """Download translated PO file"""
    translation = await db.translations.find_one({"id": translation_id}, {"_id": 0})
    
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    # Parse original entries and create PO content
    entries = [TranslationEntry(**e) for e in translation['entries']]
    
    # Create a simple PO file from entries
    po = polib.POFile()
    po.metadata = {
        'Language': translation['target_lang'],
        'Content-Type': 'text/plain; charset=UTF-8',
    }
    
    for entry in entries:
        po_entry = polib.POEntry(
            msgid=entry.msgid,
            msgstr=entry.translated
        )
        po.append(po_entry)
    
    po_content = str(po)
    
    # Create filename
    original_name = translation['filename'].replace('.po', '')
    download_filename = f"{original_name}_{translation['target_lang']}.po"
    
    return StreamingResponse(
        io.BytesIO(po_content.encode('utf-8')),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={download_filename}"}
    )


@api_router.get("/translations", response_model=List[TranslationHistoryItem])
async def get_translations():
    """Get translation history"""
    translations = await db.translations.find(
        {}, 
        {"_id": 0, "id": 1, "filename": 1, "source_lang": 1, "target_lang": 1, 
         "total_entries": 1, "translated_entries": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(100)
    
    return translations


@api_router.get("/translations/{translation_id}")
async def get_translation(translation_id: str):
    """Get specific translation details"""
    translation = await db.translations.find_one({"id": translation_id}, {"_id": 0})
    
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    return translation


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
