# Technical Architecture & Deployment Specification

## 1. System Architecture

PuzzleDex is designed as a self-contained, low-resource web application deployed via Docker.

```
+-----------------------------------------------------------+
|                      Client Browser                       |
|   (Desktop / Tablet / Mobile - Local Network / WiFi)      |
+-----------------------------+-----------------------------+
                              | HTTP / REST / Assets
                              v
+-----------------------------------------------------------+
|               PuzzleDex Docker Container                  |
|                                                           |
|  +-----------------------------------------------------+  |
|  | Web Server & API Layer                              |  |
|  | - Serves static SPA / Frontend bundle               |  |
|  | - REST API Endpoints (/api/puzzles, /api/sessions)  |  |
|  | - Image processing & thumbnail generation           |  |
|  | - Backup / Export handlers                          |  |
|  +--------------------------+--------------------------+  |
|                             |                             |
|                             v                             |
|  +-----------------------------------------------------+  |
|  | Persistent Storage Mount: /data                     |  |
|  | - SQLite Database (puzzledex.db)                    |  |
|  | - Image Uploads (/data/uploads)                     |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

---

## 2. Selected Technology Stack

- **Backend**: **Python 3.11+ with FastAPI**
  - **ORM / Storage**: **SQLAlchemy** with **SQLite** (`/data/puzzledex.db`, WAL mode enabled)
  - **Data Validation & Serializers**: **Pydantic v2**
  - **Image Processing**: **Pillow** (auto-resizing, compression, WebP generation, thumbnail creation)
  - **Archive & Export**: Python built-in `zipfile` and `json` modules
- **Frontend**: **React 18+ with Vite & Tailwind CSS**
  - **Icons**: Lucide React
  - **HTTP Client**: Axios or native `fetch`
  - **State / Timer**: Custom hooks with `localStorage` persistence and Web `WakeLock` API support
  - **Bundled Deployment**: Production build output (`dist/`) served directly as static files by FastAPI
- **Containerization**:
  - Multi-stage Dockerfile: Node.js stage builds React frontend; Python stage runs FastAPI backend with Uvicorn.
  - Single container footprint (~120MB).

---

## 3. REST API Specification

### 3.1 Puzzles
- `GET /api/puzzles`: Query puzzles with optional filters (`status`, `brand`, `min_pieces`, `max_pieces`, `search`, `sort_by`, `sort_order`).
- `POST /api/puzzles`: Create a new puzzle.
- `GET /api/puzzles/{id}`: Retrieve puzzle details including its sessions and image URLs.
- `PUT /api/puzzles/{id}`: Update puzzle metadata.
- `DELETE /api/puzzles/{id}`: Delete puzzle and associated sessions/media.

### 3.2 Assemblages (Runs) & Sessions de Chronomètre
- `POST /api/puzzles/{id}/assemblies`: Démarrer une nouvelle réalisation pour ce puzzle (crée la réalisation `#N+1` avec statut `in_progress`).
- `GET /api/puzzles/{id}/assemblies`: Lister toutes les réalisations d'un puzzle (avec durée totale, statut, dates et nombre de sessions).
- `GET /api/assemblies/{assembly_id}`: Détail complet d'une réalisation avec ses sessions de chronomètre.
- `PUT /api/assemblies/{assembly_id}`: Mettre à jour une réalisation (marquer comme `completed` ou `abandoned`, ajuster notes ou dates).
- `POST /api/assemblies/{assembly_id}/sessions`: Enregistrer une session de chronométrage dans cette réalisation.
  - Body: `{ started_at, ended_at, duration_seconds, notes }`
- `PUT /api/sessions/{session_id}`: Modifier une session existante (durée, horodatages, note).
- `DELETE /api/sessions/{session_id}`: Supprimer une session erronée.

### 3.3 Media
- `POST /api/puzzles/{id}/images`: Upload an image file (multipart/form-data). Automatically generates thumbnail and stores metadata.
- `DELETE /api/images/{image_id}`: Delete an image.
- `PUT /api/puzzles/{id}/cover`: Set an image as the primary cover.

### 3.4 Statistics
- `GET /api/stats`: Return overall dashboard statistics (total puzzles, total pieces, total hours, pieces/hr breakdown, brand distribution).

### 3.5 Backup & Portability
- `GET /api/export/db`: Direct stream of `puzzledex.db` SQLite file.
- `GET /api/export/json`: JSON formatted export file containing all records.
- `GET /api/export/archive`: Full ZIP bundle containing `puzzledex.db`, `export.json`, and all `/data/uploads/` files.
- `POST /api/import`: Restore database from uploaded JSON or archive file.

---

## 4. Docker & Deployment Specification

### 4.1 `docker-compose.yml`
```yaml
version: '3.8'

services:
  puzzledex:
    build: .
    image: puzzledex:latest
    container_name: puzzledex
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DATA_DIR=/data
      - TZ=UTC
    volumes:
      - puzzledex-data:/data

volumes:
  puzzledex-data:
    driver: local
```

### 4.2 Multi-Stage Dockerfile Strategy
1. **Stage 1 (Frontend Build)**: Node/Vite build generates static distribution files (`/app/frontend/dist`).
2. **Stage 2 (Backend & Runner)**: Minimal base image (e.g. `python:3.11-slim`), copies frontend static files, installs backend dependencies, and launches the application on port 8080.
3. Health check configured via `GET /api/health`.
