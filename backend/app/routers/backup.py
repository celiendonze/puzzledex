import json
import zipfile
import io
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, Response, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import DATABASE_PATH, UPLOADS_DIR, DATA_DIR
from app.utils.exporter import export_to_dict, import_from_dict, create_full_zip_archive

router = APIRouter(prefix="/api/backup", tags=["Sauvegarde & Export"])

@router.get("/json")
def export_json(db: Session = Depends(get_db)):
    """Exporte l'ensemble des données au format JSON structuré."""
    data = export_to_dict(db)
    content = json.dumps(data, ensure_ascii=False, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="puzzledex_export.json"'}
    )

@router.get("/db")
def export_sqlite_db():
    """Télécharge directement le fichier de base de données SQLite."""
    if not DATABASE_PATH.exists():
        raise HTTPException(status_code=404, detail="Fichier de base de données introuvable")
    return FileResponse(
        DATABASE_PATH,
        media_type="application/x-sqlite3",
        filename="puzzledex.db"
    )

@router.get("/archive")
def export_full_archive(db: Session = Depends(get_db)):
    """Télécharge une archive ZIP complète (base SQLite + JSON + photos)."""
    zip_buffer = create_full_zip_archive(db)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="puzzledex_sauvegarde_complete.zip"'}
    )

@router.post("/import/json")
async def import_json(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Importe les données depuis un fichier JSON."""
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Le fichier doit être un fichier .json")

    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
        import_from_dict(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur d'import JSON : {str(e)}")

    return {"message": "Données importées avec succès"}

@router.post("/import/archive")
async def import_archive(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Restaure une archive ZIP (remplace les images et synchronise les données)."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une archive .zip")

    content = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(content), "r") as z:
            # 1. Vérifier si un export JSON est inclus
            if "puzzledex_export.json" in z.namelist():
                json_bytes = z.read("puzzledex_export.json")
                data = json.loads(json_bytes.decode("utf-8"))
                import_from_dict(db, data)

            # 2. Extraire les uploads
            for item in z.namelist():
                if item.startswith("uploads/"):
                    target_path = DATA_DIR / item
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(target_path, "wb") as f:
                        f.write(z.read(item))

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la restauration de l'archive : {str(e)}")

    return {"message": "Archive restaurée avec succès"}
