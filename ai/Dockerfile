# Use stable Python version
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Copy requirements first (better caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy rest of the AI code
COPY . .

# Expose port (Render uses 10000 internally)
EXPOSE 10000

# Start FastAPI app with Gunicorn
CMD ["gunicorn", "app:app", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:10000"]
