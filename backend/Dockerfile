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

# Expose port
EXPOSE 8001

# Pokreni server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
