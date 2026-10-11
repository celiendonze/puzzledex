import json
import zipfile
import io
import os
import shutil
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import Puzzle, PuzzleAssembly, PuzzleSession, PuzzleImage, Tag
from app.config import DATABASE_PATH, UPLOADS_DIR, DATA_DIR

def export_to_dict(db: Session) -> dict:
    """Exporte l'intégralité de la base de données sous forme de dictionnaire prêt pour le JSON."""
    puzzles = db.query(Puzzle).all()
    puzzles_data = []

    for p in puzzles:
        # Réalisations et leurs sessions
        assemblies_data = []
        for a in p.assemblies:
            sessions_data = []
            for s in a.sessions:
                sessions_data.append({
                    "id": s.id,
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "ended_at": s.ended_at.isoformat() if s.ended_at else None,
                    "duration_seconds": s.duration_seconds,
                    "notes": s.notes,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                })
            assemblies_data.append({
                "id": a.id,
                "run_number": a.run_number,
                "status": a.status,
                "started_at": a.started_at.isoformat() if a.started_at else None,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                "notes": a.notes,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "sessions": sessions_data,
            })

        # Images
        images_data = []
        for img in p.images:
            images_data.append({
                "id": img.id,
                "file_name": img.file_name,
                "original_name": img.original_name,
                "mime_type": img.mime_type,
                "file_size": img.file_size,
                "is_cover": img.is_cover,
                "created_at": img.created_at.isoformat() if img.created_at else None,
            })

        puzzles_data.append({
            "id": p.id,
            "title": p.title,
            "brand": p.brand,
            "piece_count": p.piece_count,
            "status": p.status,
            "dimensions": p.dimensions,
            "difficulty": p.difficulty,
            "rating": p.rating,
            "missing_pieces": p.missing_pieces,
            "notes": p.notes,
            "cover_image_id": p.cover_image_id,
            "tags": [t.name for t in p.tags],
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "assemblies": assemblies_data,
            "images": images_data,
        })

    return {
        "version": "1.0",
        "app": "PuzzleDex",
        "exported_at": datetime.utcnow().isoformat(),
        "puzzles": puzzles_data,
    }

def import_from_dict(db: Session, data: dict):
    """Importe et fusionne ou remplace les données depuis un export JSON."""
    puzzles_list = data.get("puzzles", [])
    
    for p_data in puzzles_list:
        puzzle = db.query(Puzzle).filter(Puzzle.id == p_data["id"]).first()
        if not puzzle:
            puzzle = Puzzle(id=p_data["id"])
            db.add(puzzle)

        puzzle.title = p_data.get("title", "Puzzle")
        puzzle.brand = p_data.get("brand")
        puzzle.piece_count = p_data.get("piece_count", 1000)
        puzzle.status = p_data.get("status", "in_stash")
        puzzle.dimensions = p_data.get("dimensions")
        puzzle.difficulty = p_data.get("difficulty")
        puzzle.rating = p_data.get("rating")
        puzzle.missing_pieces = p_data.get("missing_pieces", 0)
        puzzle.notes = p_data.get("notes")
        puzzle.cover_image_id = p_data.get("cover_image_id")

        if p_data.get("created_at"):
            puzzle.created_at = datetime.fromisoformat(p_data["created_at"])
        if p_data.get("updated_at"):
            puzzle.updated_at = datetime.fromisoformat(p_data["updated_at"])

        # Tags
        tag_names = p_data.get("tags", [])
        tags = []
        for name in tag_names:
            t = db.query(Tag).filter(Tag.name == name).first()
            if not t:
                t = Tag(name=name)
                db.add(t)
            tags.append(t)
        puzzle.tags = tags

        # Réalisations
        for a_data in p_data.get("assemblies", []):
            assembly = db.query(PuzzleAssembly).filter(PuzzleAssembly.id == a_data["id"]).first()
            if not assembly:
                assembly = PuzzleAssembly(id=a_data["id"], puzzle_id=puzzle.id)
                db.add(assembly)
            assembly.run_number = a_data.get("run_number", 1)
            assembly.status = a_data.get("status", "in_progress")
            if a_data.get("started_at"):
                assembly.started_at = datetime.fromisoformat(a_data["started_at"])
            if a_data.get("completed_at"):
                assembly.completed_at = datetime.fromisoformat(a_data["completed_at"])
            assembly.notes = a_data.get("notes")

            # Sessions
            for s_data in a_data.get("sessions", []):
                session = db.query(PuzzleSession).filter(PuzzleSession.id == s_data["id"]).first()
                if not session:
                    session = PuzzleSession(id=s_data["id"], puzzle_id=puzzle.id, assembly_id=assembly.id)
                    db.add(session)
                if s_data.get("started_at"):
                    session.started_at = datetime.fromisoformat(s_data["started_at"])
                if s_data.get("ended_at"):
                    session.ended_at = datetime.fromisoformat(s_data["ended_at"])
                session.duration_seconds = s_data.get("duration_seconds", 0)
                session.notes = s_data.get("notes")

    db.commit()

def create_full_zip_archive(db: Session) -> io.BytesIO:
    """Crée une archive ZIP contenant la base SQLite, l'export JSON et le dossier uploads/."""
    zip_buffer = io.BytesIO()

    # Sauvegarder les dernières transactions
    db.commit()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # 1. Base SQLite (si elle existe)
        if DATABASE_PATH.exists():
            zip_file.write(DATABASE_PATH, arcname="puzzledex.db")

        # 2. JSON d'export lisible
        json_content = json.dumps(export_to_dict(db), ensure_ascii=False, indent=2)
        zip_file.writestr("puzzledex_export.json", json_content.encode("utf-8"))

        # 3. Dossier uploads
        if UPLOADS_DIR.exists():
            for root, _, files in os.walk(UPLOADS_DIR):
                for f in files:
                    file_path = Path(root) / f
                    arcname = file_path.relative_to(DATA_DIR)
                    zip_file.write(file_path, arcname=str(arcname))

    zip_buffer.seek(0)
    return zip_buffer
