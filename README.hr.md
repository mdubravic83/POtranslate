# PO Prevoditelj - WPML Automatsko Prevođenje

Jednostavna web aplikacija za automatsko prevođenje PO datoteka koristeći Google Translate (besplatnu verziju). Idealno za WPML i druge WordPress lokalizacijske sustave.

## 📋 Značajke

- ✅ Upload PO datoteka (drag & drop ili klasični upload)
- ✅ Automatsko prevođenje putem Google Translate
- ✅ Podrška za 35+ jezika
- ✅ Real-time progress bar s procijenjenim vremenom (ETA)
- ✅ Preuzimanje prevedenih PO datoteka
- ✅ Povijest svih prijevoda
- ✅ Preskakanje već prevedenih stringova

## 🛠️ Tehnologije

- **Backend**: Python 3.11+, FastAPI, Motor (MongoDB async driver)
- **Frontend**: React 19, Tailwind CSS
- **Baza podataka**: MongoDB
- **Prevođenje**: deep-translator (Google Translate wrapper)

---

## 📦 Zahtjevi

### Sistemski zahtjevi
- Python 3.11 ili noviji
- Node.js 18+ i Yarn
- MongoDB 6.0+
- Linux/macOS/Windows

### Python paketi (backend)
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

## 🚀 Lokalna instalacija

### 1. Kloniraj repozitorij
```bash
git clone <your-repo-url>
cd po-translate-tool
```

### 2. Postavi MongoDB
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

### 3. Postavi Backend

```bash
cd backend

# Kreiraj virtualno okruženje
python -m venv venv
source venv/bin/activate  # Linux/macOS
# ili: venv\Scripts\activate  # Windows

# Instaliraj pakete
pip install -r requirements.txt

# Kreiraj .env datoteku
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=po_translator
CORS_ORIGINS=http://localhost:3000
EOF

# Pokreni backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Postavi Frontend

```bash
cd frontend

# Instaliraj pakete
yarn install

# Kreiraj .env datoteku
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Pokreni frontend
yarn start
```

### 5. Otvori aplikaciju
Otvori browser na `http://localhost:3000`

---

## 🐳 Docker Deployment

### Docker Compose (preporučeno)

Kreiraj `docker-compose.yml` u root direktoriju:

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

Kreiraj `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instaliraj sistemske pakete
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Kopiraj requirements i instaliraj
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiraj aplikaciju
COPY . .

# Pokreni server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend Dockerfile

Kreiraj `frontend/Dockerfile`:

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

### Nginx konfiguracija za Frontend

Kreiraj `frontend/nginx.conf`:

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

### Pokretanje s Docker Compose

```bash
# Build i pokreni sve servise
docker-compose up -d --build

# Provjeri status
docker-compose ps

# Provjeri logove
docker-compose logs -f

# Zaustavi servise
docker-compose down
```

---

## ☁️ Cloud Deployment

### Option 1: DigitalOcean App Platform

1. Kreiraj App na DigitalOcean
2. Poveži GitHub repozitorij
3. Postavi environment varijable:
   - Backend: `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`
   - Frontend: `REACT_APP_BACKEND_URL`
4. Deploy

### Option 2: Railway

```bash
# Instaliraj Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicijaliziraj projekt
railway init

# Dodaj MongoDB
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
# 1. Ažuriraj sistem
sudo apt update && sudo apt upgrade -y

# 2. Instaliraj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Instaliraj Docker Compose
sudo apt install docker-compose-plugin

# 4. Kloniraj repozitorij
git clone <your-repo-url>
cd po-translate-tool

# 5. Konfiguriraj environment
# Uredi docker-compose.yml s pravim domenama

# 6. Pokreni
docker compose up -d

# 7. Postavi Nginx reverse proxy (opcionalno)
sudo apt install nginx certbot python3-certbot-nginx

# Kreiraj nginx config
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
        
        # SSE podrška
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

```bash
# Aktiviraj site
sudo ln -s /etc/nginx/sites-available/po-translator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL certifikat
sudo certbot --nginx -d your-domain.com
```

---

## 📖 Korištenje

### Prevođenje PO datoteke

1. **Upload datoteke**
   - Povuci .po datoteku na drop zonu
   - Ili klikni za odabir datoteke

2. **Odaberi jezike**
   - Izvorni jezik: Automatski ili odaberi specifični
   - Ciljni jezik: Odaberi jezik na koji želiš prevesti

3. **Prevedi**
   - Klikni "Prevedi" gumb
   - Prati napredak na progress baru
   - Procijenjeno vrijeme se prikazuje u stvarnom vremenu

4. **Preuzmi**
   - Nakon završetka, klikni "Preuzmi PO"
   - Datoteka će se preuzeti s imenom `original_hr.po`

### API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/languages` | Dohvati podržane jezike |
| POST | `/api/translate` | Prevedi PO datoteku (SSE streaming) |
| GET | `/api/translations` | Dohvati povijest prijevoda |
| GET | `/api/translations/{id}` | Dohvati specifični prijevod |
| GET | `/api/translations/{id}/download` | Preuzmi prevedenu datoteku |

### Primjer API poziva

```bash
# Prevedi datoteku
curl -X POST http://localhost:8001/api/translate \
  -F "file=@my-file.po" \
  -F "source_lang=en" \
  -F "target_lang=hr"

# Dohvati jezike
curl http://localhost:8001/api/languages
```

---

## ⚠️ Napomene

### Ograničenja Google Translate
- Besplatna verzija ima rate limiting
- Za velike datoteke (1000+ stringova) može trajati duže
- Preporučuje se chunk-anje velikih datoteka

### Sigurnost
- U produkciji koristi HTTPS
- Postavi pravilne CORS origin-e
- Koristi autentikaciju za osjetljive prijevode

### Backup
- Redovito backup-iraj MongoDB bazu
- Čuvaj izvorne PO datoteke

---

## 🤝 Doprinos

1. Fork repozitorij
2. Kreiraj feature branch (`git checkout -b feature/nova-funkcija`)
3. Commit promjene (`git commit -am 'Dodaj novu funkciju'`)
4. Push na branch (`git push origin feature/nova-funkcija`)
5. Otvori Pull Request

---

## 📄 Licenca

MIT License - slobodno koristi i modificiraj.

---

## 📞 Podrška

Ako imaš pitanja ili problema:
- Otvori GitHub Issue
- Kontaktiraj autora

---

**Napravljeno s ❤️ za WPML korisnike**
