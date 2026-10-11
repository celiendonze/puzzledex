from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Données persistantes : par défaut ./data en local, /data dans Docker
DATA_DIR_PATH = os.getenv("DATA_DIR", str(BASE_DIR.parent / "data"))
DATA_DIR = Path(DATA_DIR_PATH)

DATABASE_PATH = DATA_DIR / "puzzledex.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

UPLOADS_DIR = DATA_DIR / "uploads"
ORIGINALS_DIR = UPLOADS_DIR / "originals"
THUMBNAILS_DIR = UPLOADS_DIR / "thumbnails"

PORT = int(os.getenv("PORT", "8080"))
HOST = os.getenv("HOST", "0.0.0.0")

def ensure_directories():
    """Crée les dossiers requis s'ils n'existent pas encore."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ORIGINALS_DIR.mkdir(parents=True, exist_ok=True)
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
