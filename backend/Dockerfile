FROM python:3.11-slim

# System deps (curl for healthcheck, build tools, and LibreOffice for PDF conversion)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential git libreoffice-writer libreoffice-core && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (better layer caching)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . /app

# Optional: download small spaCy model at build time (uncomment if needed)
# RUN python -m spacy download en_core_web_sm

EXPOSE 8000

# Direct command to avoid Windows line ending issues with startup.sh
CMD ["sh", "-c", "sleep 10 && python init_db.py && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]
