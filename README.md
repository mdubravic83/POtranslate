# PO Translator - WPML Automatic Translation

A simple web application for automatic translation of PO files using Google Translate (free version). Ideal for WPML and other WordPress localization systems.

**[🇭🇷 Croatian version / Hrvatska verzija](README.hr.md)**

## 📋 Features

- ✅ Upload PO files (drag & drop or classic upload)
- ✅ Automatic translation via Google Translate
- ✅ Support for 35+ languages
- ✅ Real-time progress bar with estimated time (ETA)
- ✅ Download translated PO files
- ✅ Translation history
- ✅ Skip already translated strings

## 🛠️ Technologies

- **Backend**: Python 3.11+, FastAPI, Motor (MongoDB async driver)
- **Frontend**: React 19, Tailwind CSS
- **Database**: MongoDB
- **Translation**: deep-translator (Google Translate wrapper)

---

## 📦 Requirements

### System Requirements
- Python 3.11 or newer
- Node.js 18+ and Yarn
- MongoDB 6.0+
- Linux/macOS/Windows

### Python Packages (backend)
```
fastapi>=0.127.0
uvicorn>=0.25.0
motor>=3.3.1
pymongo>=4.5.0
python-dotenv>=1.0.1
python-multipart>=0.0.9
polib>=1.2.0
deep-translator>=1.11.4
sse-starlette>=3.0.4
pydantic>=2.6.4
```

---

## 🚀 Local Installation

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd po-translate-tool
```

### 2. Setup MongoDB
```bash
# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb

# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or: venv\Scripts\activate  # Windows

# Install packages
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=po_translator
CORS_ORIGINS=http://localhost:3000
EOF

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Setup Frontend

```bash
cd frontend

# Install packages
yarn install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Start frontend
yarn start
```

### 5. Open Application
Open browser at `http://localhost:3000`

---

## 🐳 Docker Deployment

### Docker Compose (recommended)

Create `docker-compose.yml` in root directory:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: po-translator-mongo
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: po-translator-backend
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=po_translator
      - CORS_ORIGINS=http://localhost:3000,https://your-domain.com
    ports:
      - "8001:8001"
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: po-translator-frontend
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Start server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration for Frontend

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Running with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## ☁️ Cloud Deployment

### Option 1: DigitalOcean App Platform

This project includes a pre-configured App Spec file (`.do/app.yaml`) for easy deployment.

**Method A: Automatic Detection**
1. Push this repo to GitHub
2. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
3. Click "Create App"
4. Select your GitHub repository
5. DigitalOcean will auto-detect the `.do/app.yaml` spec
6. Edit the spec and replace `<your-github-username>/<your-repo-name>` with your actual repo
7. Click "Create Resources"

**Method B: Manual Setup (if auto-detection fails)**
1. Go to DigitalOcean App Platform → Create App
2. Select GitHub and your repository
3. Click "Edit" next to "Resources Detected"
4. Add **Backend** component:
   - Source Directory: `/backend`
   - Type: Web Service
   - Dockerfile Path: `Dockerfile`
   - HTTP Port: `8001`
   - HTTP Route: `/api`
5. Add **Frontend** component:
   - Source Directory: `/frontend`  
   - Type: Web Service
   - Dockerfile Path: `Dockerfile`
   - HTTP Port: `80`
   - HTTP Route: `/`
6. Add **Database** component:
   - Type: MongoDB (Dev Database)
7. Set Environment Variables:
   - Backend:
     - `MONGO_URL`: `${db.DATABASE_URL}`
     - `DB_NAME`: `po_translator`
     - `CORS_ORIGINS`: `${APP_URL}`
   - Frontend (Build-time):
     - `REACT_APP_BACKEND_URL`: `${APP_URL}`
8. Deploy

**Troubleshooting "No components detected":**
- Make sure `.do/app.yaml` is in the repository
- Or manually specify source directories as shown in Method B
- Ensure Dockerfiles exist in `/backend/Dockerfile` and `/frontend/Dockerfile`

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add MongoDB
railway add -p mongodb

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

### Option 3: VPS (Ubuntu 22.04)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo apt install docker-compose-plugin

# 4. Clone repository
git clone <your-repo-url>
cd po-translate-tool

# 5. Configure environment
# Edit docker-compose.yml with proper domains

# 6. Start
docker compose up -d

# 7. Setup Nginx reverse proxy (optional)
sudo apt install nginx certbot python3-certbot-nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/po-translator
```

Nginx reverse proxy config:

```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

```bash
# Activate site
sudo ln -s /etc/nginx/sites-available/po-translator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

## 📖 Usage

### Translating a PO File

1. **Upload file**
   - Drag .po file to drop zone
   - Or click to select file

2. **Select languages**
   - Source language: Auto-detect or select specific
   - Target language: Select language to translate to

3. **Translate**
   - Click "Translate" button
   - Watch progress on progress bar
   - Estimated time updates in real-time

4. **Download**
   - After completion, click "Download PO"
   - File will download with name `original_hr.po`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/languages` | Get supported languages |
| POST | `/api/translate` | Translate PO file (SSE streaming) |
| GET | `/api/translations` | Get translation history |
| GET | `/api/translations/{id}` | Get specific translation |
| GET | `/api/translations/{id}/download` | Download translated file |

### API Example

```bash
# Translate file
curl -X POST http://localhost:8001/api/translate \
  -F "file=@my-file.po" \
  -F "source_lang=en" \
  -F "target_lang=hr"

# Get languages
curl http://localhost:8001/api/languages
```

---

## ⚠️ Notes

### Google Translate Limitations
- Free version has rate limiting
- Large files (1000+ strings) may take longer
- Consider chunking large files

### Security
- Use HTTPS in production
- Set proper CORS origins
- Use authentication for sensitive translations

### Backup
- Regularly backup MongoDB database
- Keep original PO files

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - free to use and modify.

---

## 📞 Support

If you have questions or issues:
- Open GitHub Issue
- Contact author

---

**Made with ❤️ for WPML users**
