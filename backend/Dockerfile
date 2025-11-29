FROM python:3.11-slim

# Prevent Python from writing .pyc files and force stdout flushing
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install system dependencies (for postgres, pillow, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . /app

# Expose app port
EXPOSE 8000

# Default command (docker-compose overrides with uvicorn --reload)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
