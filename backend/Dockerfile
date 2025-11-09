FROM python:3.11-slim

# CRITICAL: Minimal system dependencies only!
# Removed LibreOffice (saves ~500MB), removed git (not needed in production)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Install MINIMAL Python dependencies (requirements-minimal.txt, NOT requirements.txt!)
COPY requirements-minimal.txt /app/backend/requirements-minimal.txt
RUN pip install --no-cache-dir -r requirements-minimal.txt

# Copy only backend code (not entire repo!)
COPY . /app/backend

# Expose port 5000 for Replit autoscale deployment
EXPOSE 5000

# Start uvicorn on port 5000 (Replit requirement)
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
