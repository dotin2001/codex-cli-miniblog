FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api/app ./app
COPY apps/api/migrations ./migrations
COPY apps/api/start-api.sh ./start-api.sh

EXPOSE 8080

ENTRYPOINT ["sh", "./start-api.sh"]
