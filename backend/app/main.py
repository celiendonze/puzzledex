from pathlib import Path
import mimetypes
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

mimetypes.add_type("application/manifest+json", ".webmanifest")

from app.config import ensure_directories, BASE_DIR
from app.database import engine, Base
from app.routers import puzzles, assemblies, sessions, images, stats, backup

# Créer les dossiers et les tables au démarrage
ensure_directories()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PuzzleDex API",
    description="API de suivi et chronométrage d'assemblage de puzzles",
    version="1.0.0"
)

# Configuration CORS pour réseau local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs
app.include_router(puzzles.router)
app.include_router(assemblies.router)
app.include_router(sessions.router)
app.include_router(images.router)
app.include_router(stats.router)
app.include_router(backup.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "PuzzleDex", "version": "1.0.0"}

# Recherche du dossier de build frontend (en local ou dans Docker)
candidates = [
    BASE_DIR / "frontend" / "dist",
    BASE_DIR.parent / "frontend" / "dist",
    BASE_DIR / "static",
]
FRONTEND_DIST = next((p for p in candidates if p.exists() and (p / "index.html").exists()), None)

if FRONTEND_DIST:
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api"):
            return None
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
