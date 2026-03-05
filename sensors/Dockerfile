FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir httpx paho-mqtt
COPY simulator.py .
ENV API_URL=http://backend:8000
ENV INTERVAL=5
CMD ["sh", "-c", "python simulator.py --mode api --api_url $API_URL --interval $INTERVAL"]
