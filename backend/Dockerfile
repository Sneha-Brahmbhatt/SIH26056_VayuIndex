FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements & install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Grant execution permissions to entrypoint script
RUN chmod +x entrypoint.sh

# Cloud Run dynamic PORT binding (defaults to 8000)
ENV PORT=8000

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
