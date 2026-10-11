# ==========================================
# Étape 1 : Construction du Frontend (React / Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# Étape 2 : Image finale avec Python & uv
# ==========================================
FROM python:3.11-slim AS runner

# Installer uv directement depuis son image officielle
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

ENV PYTHONUNBUFFERED=1 \
    DATA_DIR=/data \
    PORT=8080 \
    HOST=0.0.0.0

WORKDIR /app

# Installer les dépendances Python via uv
COPY backend/pyproject.toml ./
RUN uv pip install --system --no-cache -r pyproject.toml

# Copier le code backend
COPY backend/app ./app

# Copier le bundle frontend statique construit à l'étape 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Créer le répertoire de données persistant
RUN mkdir -p /data/uploads/originals /data/uploads/thumbnails

VOLUME ["/data"]

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
