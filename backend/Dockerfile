# Dockerfile

# Base image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy only requirements first to leverage Docker caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose required ports
EXPOSE 5000 5001

# Create and set up the start script
RUN echo '#!/bin/bash\n\
    uvicorn web_server.app:app --host 0.0.0.0 --port 5000 --reload &\n\
    uvicorn c2_server.app:sio_app --host 0.0.0.0 --port 5001 --reload &\n\
    tail -f /dev/null' > start_servers.sh && \
    chmod +x start_servers.sh

# Set entrypoint
CMD ["./start_servers.sh"]
