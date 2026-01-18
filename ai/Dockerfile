# Use stable Python version
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start Flask app with Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000"]
