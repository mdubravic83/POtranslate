import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ===========================================
// TRANSLATIONS
// ===========================================
const translations = {
  hr: {
    // Header
    appTitle: "PO Prevoditelj",
    appSubtitle: "WPML automatsko prevođenje",
    history: "Povijest",
    
    // Upload section
    uploadTitle: "1. Uploadaj PO datoteku",
    dropFileHere: "Povuci PO datoteku ovdje",
    orClickToSelect: "ili klikni za odabir",
    clickToChange: "Klikni za promjenu datoteke",
    onlyPoFiles: "Molimo uploadajte samo .po datoteke",
    pleaseSelectFile: "Molimo odaberite datoteku",
    
    // Language section
    languageTitle: "2. Odaberi jezik",
    sourceLanguage: "Izvorni jezik",
    targetLanguage: "Ciljni jezik",
    autoDetect: "Automatski prepoznaj",
    
    // Buttons
    translate: "Prevedi",
    translating: "Prevodim...",
    download: "Preuzmi",
    downloadPO: "Preuzmi PO",
    newTranslation: "Novi prijevod",
    
    // Progress
    translationInProgress: "Prevođenje u tijeku...",
    currently: "Trenutno",
    progress: "Napredak",
    remainingTime: "Preostalo vrijeme",
    toTranslate: "Za prevesti",
    strings: "stringova",
    
    // Stats
    total: "Ukupno",
    translated: "Prevedeno",
    skipped: "Preskočeno",
    errors: "Greške",
    
    // Results
    translationResults: "Rezultati prijevoda",
    translatedStrings: "Prevedeni stringovi",
    status: "Status",
    sourceText: "Izvorni tekst",
    translation: "Prijevod",
    empty: "(prazno)",
    
    // History
    translationHistory: "Povijest prijevoda",
    
    // How to use
    howToUseTitle: "ℹ️ Kako koristiti",
    howToUse1: "Uploadajte .po datoteku iz WPML-a ili nekog drugog sustava za lokalizaciju",
    howToUse2: "Odaberite izvorni jezik (ili ostavite \"Automatski\") i ciljni jezik prijevoda",
    howToUse3: "Kliknite \"Prevedi\" i pričekajte dok se svi stringovi prevedu",
    howToUse4: "Preuzmite prevedenu .po datoteku i importirajte je natrag u WPML",
    howToUse5: "Stringovi koji već imaju prijevod bit će preskočeni",
    
    // Footer
    footer: "Koristi Google Translate besplatni API za prevođenje",
    
    // Time
    sec: "sek",
    min: "min",
    
    // Errors
    translationError: "Greška prilikom prevođenja",
    downloadError: "Greška prilikom preuzimanja",
  },
  en: {
    // Header
    appTitle: "PO Translator",
    appSubtitle: "WPML automatic translation",
    history: "History",
    
    // Upload section
    uploadTitle: "1. Upload PO file",
    dropFileHere: "Drop PO file here",
    orClickToSelect: "or click to select",
    clickToChange: "Click to change file",
    onlyPoFiles: "Please upload only .po files",
    pleaseSelectFile: "Please select a file",
    
    // Language section
    languageTitle: "2. Select language",
    sourceLanguage: "Source language",
    targetLanguage: "Target language",
    autoDetect: "Auto-detect",
    
    // Buttons
    translate: "Translate",
    translating: "Translating...",
    download: "Download",
    downloadPO: "Download PO",
    newTranslation: "New translation",
    
    // Progress
    translationInProgress: "Translation in progress...",
    currently: "Currently",
    progress: "Progress",
    remainingTime: "Remaining time",
    toTranslate: "To translate",
    strings: "strings",
    
    // Stats
    total: "Total",
    translated: "Translated",
    skipped: "Skipped",
    errors: "Errors",
    
    // Results
    translationResults: "Translation results",
    translatedStrings: "Translated strings",
    status: "Status",
    sourceText: "Source text",
    translation: "Translation",
    empty: "(empty)",
    
    // History
    translationHistory: "Translation history",
    
    // How to use
    howToUseTitle: "ℹ️ How to use",
    howToUse1: "Upload .po file from WPML or other localization system",
    howToUse2: "Select source language (or leave \"Auto-detect\") and target language",
    howToUse3: "Click \"Translate\" and wait for all strings to be translated",
    howToUse4: "Download translated .po file and import it back to WPML",
    howToUse5: "Strings that already have translation will be skipped",
    
    // Footer
    footer: "Uses Google Translate free API for translation",
    
    // Time
    sec: "sec",
    min: "min",
    
    // Errors
    translationError: "Translation error",
    downloadError: "Download error",
  }
};

// Language Context
const LanguageContext = createContext();

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('po-translator-lang');
    return saved || 'hr';
  });

  const t = useCallback((key) => {
    return translations[lang][key] || key;
  }, [lang]);

  const toggleLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('po-translator-lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ===========================================
// ICONS
// ===========================================
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TranslateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SkipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Flag icons as SVG components
const CroatianFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm">
    <g fillRule="evenodd">
      <path fill="#fff" d="M0 0h640v480H0z"/>
      <path fill="#171796" d="M0 319.997h640V480H0z"/>
      <path fill="#f00" d="M0 0h640v160.003H0z"/>
      <path fill="#fff" d="M277.332 55.465h85.332V250.13h-85.332z"/>
      <path fill="#f00" d="M277.332 55.465h21.333v38.933h-21.333zm42.667 0h21.333v38.933H320zm42.666 0h21.334v38.933h-21.334zM277.332 133.33h21.333v38.934h-21.333zm42.667 0h21.333v38.934H320zm42.666 0h21.334v38.934h-21.334zM277.332 211.197h21.333v38.933h-21.333zm42.667 0h21.333v38.933H320zm42.666 0h21.334v38.933h-21.334zM298.666 94.398h21.333v38.933h-21.333zm42.666 0h21.334v38.933h-21.334zM298.666 172.264h21.333v38.934h-21.333zm42.666 0h21.334v38.934h-21.334z"/>
    </g>
  </svg>
);

const UKFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-6 h-4 rounded-sm shadow-sm">
    <path fill="#012169" d="M0 0h640v480H0z"/>
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
  </svg>
);

// Language Switcher Component
const LanguageSwitcher = () => {
  const { lang, toggleLanguage } = useLanguage();
  
  return (
    <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1" data-testid="language-switcher">
      <button
        onClick={() => toggleLanguage('hr')}
        className={`p-1.5 rounded transition-all ${
          lang === 'hr' 
            ? 'bg-slate-600 ring-2 ring-purple-500' 
            : 'hover:bg-slate-600/50'
        }`}
        title="Hrvatski"
        data-testid="lang-hr-btn"
      >
        <CroatianFlag />
      </button>
      <button
        onClick={() => toggleLanguage('en')}
        className={`p-1.5 rounded transition-all ${
          lang === 'en' 
            ? 'bg-slate-600 ring-2 ring-purple-500' 
            : 'hover:bg-slate-600/50'
        }`}
        title="English"
        data-testid="lang-en-btn"
      >
        <UKFlag />
      </button>
    </div>
  );
};

// ===========================================
// PROGRESS LOADER COMPONENT
// ===========================================
const ProgressLoader = ({ progress }) => {
  const { t, lang } = useLanguage();
  
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    if (seconds < 60) return `${seconds} ${t('sec')}`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} ${t('min')} ${secs} ${t('sec')}`;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700" data-testid="progress-loader">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-4">
          <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">{t('translationInProgress')}</h2>
        <p className="text-slate-400 text-sm">
          {progress.currentText && (
            <span className="block truncate max-w-md mx-auto">
              {t('currently')}: &quot;{progress.currentText}&quot;
            </span>
          )}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>{t('progress')}</span>
          <span data-testid="progress-percent">{progress.percent}%</span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress.percent}%` }}
            data-testid="progress-bar"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white" data-testid="progress-total">{progress.total}</p>
          <p className="text-xs text-slate-400">{t('total')}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400" data-testid="progress-translated">{progress.translated}</p>
          <p className="text-xs text-slate-400">{t('translated')}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400" data-testid="progress-skipped">{progress.skipped}</p>
          <p className="text-xs text-slate-400">{t('skipped')}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-400" data-testid="progress-errors">{progress.errors}</p>
          <p className="text-xs text-slate-400">{t('errors')}</p>
        </div>
      </div>

      {/* ETA */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-slate-700/50 rounded-full px-4 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-slate-300">
            {t('remainingTime')}: <span className="text-white font-medium" data-testid="progress-eta">{formatTime(progress.etaSeconds)}</span>
          </span>
        </div>
      </div>

      {/* Progress details */}
      <div className="mt-6 text-center text-sm text-slate-500">
        <p>{t('toTranslate')}: {progress.toTranslate} {t('strings')}</p>
      </div>
    </div>
  );
};

// ===========================================
// MAIN APP CONTENT
// ===========================================
const AppContent = () => {
  const { t, lang } = useLanguage();
  
  const [file, setFile] = useState(null);
  const [languages, setLanguages] = useState({});
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hr');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Progress state
  const [progress, setProgress] = useState({
    percent: 0,
    translated: 0,
    total: 0,
    toTranslate: 0,
    skipped: 0,
    errors: 0,
    etaSeconds: null,
    currentText: "",
    status: "idle"
  });

  // Fetch supported languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API}/languages`);
        setLanguages(response.data.languages);
      } catch (e) {
        console.error('Error fetching languages:', e);
      }
    };
    fetchLanguages();
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/translations`);
      setHistory(response.data);
    } catch (e) {
      console.error('Error fetching history:', e);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.po')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError(t('onlyPoFiles'));
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.po')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError(t('onlyPoFiles'));
        setFile(null);
      }
    }
  };

  const handleTranslate = async () => {
    if (!file) {
      setError(t('pleaseSelectFile'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress({
      percent: 0,
      translated: 0,
      total: 0,
      toTranslate: 0,
      skipped: 0,
      errors: 0,
      etaSeconds: null,
      currentText: "",
      status: "starting"
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);

    try {
      // Use fetch with SSE
      const response = await fetch(`${API}/translate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('translationError'));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        let currentEvent = null;
        let currentData = '';
        
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            currentData = line.slice(5).trim();
            
            if (currentData) {
              try {
                const data = JSON.parse(currentData);
                
                if (currentEvent === 'progress') {
                  setProgress({
                    percent: data.percent || 0,
                    translated: data.translated || 0,
                    total: data.total || 0,
                    toTranslate: data.to_translate || 0,
                    skipped: data.skipped || 0,
                    errors: data.errors || 0,
                    etaSeconds: data.eta_seconds,
                    currentText: data.current_text || "",
                    status: data.status || "translating"
                  });
                } else if (currentEvent === 'complete') {
                  setResult(data);
                  setProgress(prev => ({ ...prev, status: "complete", percent: 100 }));
                  fetchHistory();
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Translation error:', e);
      setError(e.message || t('translationError'));
    } finally {
      setLoading(false);
    }
  };

  const downloadPO = () => {
    if (!result || !result.po_content) return;
    
    const blob = new Blob([result.po_content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const originalName = result.filename.replace('.po', '');
    a.download = `${originalName}_${result.target_lang}.po`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHistoryItem = async (id, filename, lang) => {
    try {
      const response = await axios.get(`${API}/translations/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      const originalName = filename.replace('.po', '');
      a.download = `${originalName}_${lang}.po`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
      setError(t('downloadError'));
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress({
      percent: 0,
      translated: 0,
      total: 0,
      toTranslate: 0,
      skipped: 0,
      errors: 0,
      etaSeconds: null,
      currentText: "",
      status: "idle"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <TranslateIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white" data-testid="app-title">{t('appTitle')}</h1>
              <p className="text-sm text-slate-400">{t('appSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              data-testid="history-toggle-btn"
            >
              <HistoryIcon />
              {t('history')} ({history.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* History Panel */}
        {showHistory && history.length > 0 && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700" data-testid="history-panel">
            <h2 className="text-lg font-semibold text-white mb-4">{t('translationHistory')}</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between bg-slate-700/50 rounded-lg p-4"
                  data-testid={`history-item-${item.id}`}
                >
                  <div>
                    <p className="text-white font-medium">{item.filename}</p>
                    <p className="text-sm text-slate-400">
                      {item.source_lang} → {languages[item.target_lang] || item.target_lang} | 
                      {item.translated_entries}/{item.total_entries} {t('translated').toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadHistoryItem(item.id, item.filename, item.target_lang)}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
                    data-testid={`download-history-${item.id}`}
                  >
                    <DownloadIcon />
                    {t('download')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <ProgressLoader progress={progress} />
        ) : !result ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">{t('uploadTitle')}</h2>
              
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : file 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                }`}
                data-testid="drop-zone"
              >
                <input
                  type="file"
                  accept=".po"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  data-testid="file-input"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`${file ? 'text-green-500' : 'text-slate-400'}`}>
                    <UploadIcon />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-green-400 font-medium">{file.name}</p>
                      <p className="text-sm text-slate-400">{t('clickToChange')}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white">{t('dropFileHere')}</p>
                      <p className="text-sm text-slate-400">{t('orClickToSelect')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">{t('languageTitle')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('sourceLanguage')}
                  </label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="source-lang-select"
                  >
                    <option value="auto">{t('autoDetect')}</option>
                    {Object.entries(languages).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('targetLanguage')}
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="target-lang-select"
                  >
                    {Object.entries(languages).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400" data-testid="error-message">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleTranslate}
                  disabled={!file || loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
                  data-testid="translate-btn"
                >
                  <TranslateIcon />
                  {t('translate')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6" data-testid="results-section">
            {/* Summary Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{t('translationResults')}</h2>
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    data-testid="new-translation-btn"
                  >
                    {t('newTranslation')}
                  </button>
                  <button
                    onClick={downloadPO}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                    data-testid="download-result-btn"
                  >
                    <DownloadIcon />
                    {t('downloadPO')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-white" data-testid="total-entries">{result.total_entries}</p>
                  <p className="text-sm text-slate-400">{t('total')}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-400" data-testid="translated-entries">{result.translated_entries}</p>
                  <p className="text-sm text-slate-400">{t('translated')}</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400" data-testid="skipped-entries">{result.skipped_entries}</p>
                  <p className="text-sm text-slate-400">{t('skipped')}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-400" data-testid="error-entries">{result.error_entries}</p>
                  <p className="text-sm text-slate-400">{t('errors')}</p>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-semibold">{t('translatedStrings')}</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">{t('status')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">{t('sourceText')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">{t('translation')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {result.entries.map((entry, index) => (
                      <tr key={index} className="hover:bg-slate-700/30" data-testid={`entry-row-${index}`}>
                        <td className="px-4 py-3">
                          {entry.status === 'success' && <CheckIcon />}
                          {entry.status === 'skipped' && <SkipIcon />}
                          {entry.status === 'error' && <ErrorIcon />}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate" title={entry.msgid}>
                          {entry.msgid || <span className="text-slate-500 italic">{t('empty')}</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-white max-w-xs truncate" title={entry.translated}>
                          {entry.translated || <span className="text-slate-500 italic">{t('empty')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        {!loading && !result && (
          <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-3">{t('howToUseTitle')}</h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li>• {t('howToUse1')}</li>
              <li>• {t('howToUse2')}</li>
              <li>• {t('howToUse3')}</li>
              <li>• {t('howToUse4')}</li>
              <li>• {t('howToUse5')}</li>
            </ul>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-slate-500 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

// ===========================================
// APP WRAPPER WITH LANGUAGE PROVIDER
// ===========================================
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
