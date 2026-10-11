import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Puzzle, PuzzleImage
from app.schemas import ImageRead
from app.config import ORIGINALS_DIR, THUMBNAILS_DIR
from app.utils.image_processing import process_and_save_image, delete_image_files

router = APIRouter(tags=["Images"])

@router.post("/api/puzzles/{puzzle_id}/images", response_model=ImageRead, status_code=status.HTTP_201_CREATED)
async def upload_puzzle_image(
    puzzle_id: str,
    file: UploadFile = File(...),
    is_cover: bool = Form(default=False),
    db: Session = Depends(get_db)
):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    # Vérification du type MIME
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier envoyé doit être une image.")

    content = await file.read()
    image_id = str(uuid.uuid4())

    try:
        meta = process_and_save_image(content, image_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors du traitement de l'image : {str(e)}")

    # Si c'est la première image ou demandée en couverture
    make_cover = is_cover or (len(puzzle.images) == 0)

    if make_cover:
        for existing in puzzle.images:
            existing.is_cover = False

    new_img = PuzzleImage(
        id=image_id,
        puzzle_id=puzzle.id,
        file_name=meta["file_name"],
        original_name=file.filename,
        mime_type=meta["mime_type"],
        file_size=meta["file_size"],
        is_cover=make_cover,
    )
    db.add(new_img)

    if make_cover:
        puzzle.cover_image_id = image_id

    db.commit()
    db.refresh(new_img)

    return {
        "id": new_img.id,
        "puzzle_id": new_img.puzzle_id,
        "file_name": new_img.file_name,
        "original_name": new_img.original_name,
        "mime_type": new_img.mime_type,
        "file_size": new_img.file_size,
        "is_cover": new_img.is_cover,
        "url": f"/api/images/{new_img.file_name}",
        "thumbnail_url": f"/api/images/{new_img.file_name.replace('.webp', '_thumb.webp')}",
        "created_at": new_img.created_at,
    }

@router.get("/api/images/{file_name}")
def get_image_file(file_name: str):
    """Sert l'image originale ou la miniature."""
    if "_thumb.webp" in file_name:
        file_path = THUMBNAILS_DIR / file_name
    else:
        file_path = ORIGINALS_DIR / file_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier image introuvable")

    return FileResponse(file_path, media_type="image/webp")

@router.put("/api/puzzles/{puzzle_id}/cover/{image_id}", response_model=ImageRead)
def set_cover_image(puzzle_id: str, image_id: str, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    target_img = db.query(PuzzleImage).filter(PuzzleImage.id == image_id, PuzzleImage.puzzle_id == puzzle_id).first()
    if not target_img:
        raise HTTPException(status_code=404, detail="Image non trouvée")

    for img in puzzle.images:
        img.is_cover = (img.id == image_id)

    puzzle.cover_image_id = image_id
    db.commit()
    db.refresh(target_img)

    return {
        "id": target_img.id,
        "puzzle_id": target_img.puzzle_id,
        "file_name": target_img.file_name,
        "original_name": target_img.original_name,
        "mime_type": target_img.mime_type,
        "file_size": target_img.file_size,
        "is_cover": True,
        "url": f"/api/images/{target_img.file_name}",
        "thumbnail_url": f"/api/images/{target_img.file_name.replace('.webp', '_thumb.webp')}",
        "created_at": target_img.created_at,
    }

@router.delete("/api/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(image_id: str, db: Session = Depends(get_db)):
    img = db.query(PuzzleImage).filter(PuzzleImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image non trouvée")

    puzzle = img.puzzle
    if puzzle and puzzle.cover_image_id == image_id:
        puzzle.cover_image_id = None

    delete_image_files(img.file_name)
    db.delete(img)
    db.commit()
    return None
