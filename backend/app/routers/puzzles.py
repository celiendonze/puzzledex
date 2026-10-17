from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database import get_db
from app.models import Puzzle, PuzzleAssembly, PuzzleSession, PuzzleImage, Tag
from app.schemas import PuzzleCreate, PuzzleUpdate, PuzzleListItemRead, PuzzleDetailRead
from app.utils.image_processing import delete_image_files

router = APIRouter(prefix="/api/puzzles", tags=["Puzzles"])

def build_puzzle_list_item(p: Puzzle) -> dict:
    """Calcule les statistiques dérivées et prépare l'élément de liste."""
    # Couverture et miniature
    cover_image = None
    if p.cover_image_id:
        cover_image = next((img for img in p.images if img.id == p.cover_image_id), None)
    if not cover_image and p.images:
        cover_image = next((img for img in p.images if img.is_cover), p.images[0])

    cover_url = f"/api/images/{cover_image.file_name}" if cover_image else None
    thumb_url = f"/api/images/{cover_image.file_name.replace('.webp', '_thumb.webp')}" if cover_image else None

    # Réalisations
    completed_runs = [a for a in p.assemblies if a.status == "completed"]
    times_completed = len(completed_runs)

    # Meilleur temps (parmi les réalisations complétées)
    best_time = None
    last_completed = None
    for run in completed_runs:
        run_dur = sum(s.duration_seconds for s in run.sessions)
        if best_time is None or run_dur < best_time:
            best_time = run_dur
        if run.completed_at and (last_completed is None or run.completed_at > last_completed):
            last_completed = run.completed_at

    # Réalisation active en cours
    active_run = next((a for a in p.assemblies if a.status == "in_progress"), None)
    active_id = active_run.id if active_run else None
    active_dur = sum(s.duration_seconds for s in active_run.sessions) if active_run else 0

    return {
        "id": p.id,
        "title": p.title,
        "brand": p.brand,
        "piece_count": p.piece_count,
        "status": p.status,
        "dimensions": p.dimensions,
        "difficulty": p.difficulty,
        "rating": p.rating,
        "missing_pieces": p.missing_pieces,
        "cover_image_url": cover_url,
        "thumbnail_url": thumb_url,
        "tags": p.tags,
        "times_completed": times_completed,
        "best_time_seconds": best_time,
        "last_completed_at": last_completed,
        "active_assembly_id": active_id,
        "active_assembly_duration_seconds": active_dur,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }

@router.get("", response_model=List[PuzzleListItemRead])
def get_puzzles(
    status: Optional[str] = None,
    brand: Optional[str] = None,
    min_pieces: Optional[int] = None,
    max_pieces: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = Query(default="updated_at", pattern="^(created_at|updated_at|title|piece_count|rating)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    query = db.query(Puzzle)

    if status and status != "all":
        query = query.filter(Puzzle.status == status)

    if brand:
        query = query.filter(Puzzle.brand.ilike(f"%{brand}%"))

    if min_pieces is not None:
        query = query.filter(Puzzle.piece_count >= min_pieces)

    if max_pieces is not None:
        query = query.filter(Puzzle.piece_count <= max_pieces)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Puzzle.title.ilike(search_fmt),
                Puzzle.brand.ilike(search_fmt),
                Puzzle.notes.ilike(search_fmt),
            )
        )

    # Tri
    col = getattr(Puzzle, sort_by)
    query = query.order_by(desc(col) if sort_order == "desc" else asc(col))

    puzzles = query.all()
    return [build_puzzle_list_item(p) for p in puzzles]

@router.post("", response_model=PuzzleListItemRead, status_code=status.HTTP_201_CREATED)
def create_puzzle(payload: PuzzleCreate, db: Session = Depends(get_db)):
    puzzle = Puzzle(
        title=payload.title,
        brand=payload.brand,
        piece_count=payload.piece_count,
        status=payload.status,
        dimensions=payload.dimensions,
        difficulty=payload.difficulty,
        rating=payload.rating,
        missing_pieces=payload.missing_pieces,
        notes=payload.notes,
    )

    # Gestion des tags
    if payload.tags:
        for tag_name in payload.tags:
            tag_name_clean = tag_name.strip()
            if tag_name_clean:
                tag = db.query(Tag).filter(Tag.name == tag_name_clean).first()
                if not tag:
                    tag = Tag(name=tag_name_clean)
                    db.add(tag)
                puzzle.tags.append(tag)

    db.add(puzzle)
    db.flush()

    now = datetime.utcnow()
    # Si un temps initial est fourni, enregistrer la réalisation #1 avec ce temps
    if payload.initial_duration_seconds and payload.initial_duration_seconds > 0:
        is_completed = puzzle.status == "completed"
        assembly = PuzzleAssembly(
            puzzle_id=puzzle.id,
            run_number=1,
            status="completed" if is_completed else "in_progress",
            started_at=now,
            completed_at=now if is_completed else None,
            notes="Assemblage initial",
        )
        db.add(assembly)
        db.flush()
        session = PuzzleSession(
            puzzle_id=puzzle.id,
            assembly_id=assembly.id,
            started_at=now,
            ended_at=now,
            duration_seconds=payload.initial_duration_seconds,
            notes=None,
        )
        db.add(session)
    # Sinon, si le puzzle est créé directement en cours sans durée, créer le run #1 vide
    elif puzzle.status == "in_progress":
        assembly = PuzzleAssembly(
            puzzle_id=puzzle.id,
            run_number=1,
            status="in_progress",
            started_at=now
        )
        db.add(assembly)

    db.commit()
    db.refresh(puzzle)
    return build_puzzle_list_item(puzzle)

@router.get("/{puzzle_id}", response_model=PuzzleDetailRead)
def get_puzzle_detail(puzzle_id: str, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    base_data = build_puzzle_list_item(puzzle)
    base_data["notes"] = puzzle.notes

    # Images avec URLs
    images_list = []
    for img in puzzle.images:
        images_list.append({
            "id": img.id,
            "puzzle_id": img.puzzle_id,
            "file_name": img.file_name,
            "original_name": img.original_name,
            "mime_type": img.mime_type,
            "file_size": img.file_size,
            "is_cover": img.is_cover or (img.id == puzzle.cover_image_id),
            "url": f"/api/images/{img.file_name}",
            "thumbnail_url": f"/api/images/{img.file_name.replace('.webp', '_thumb.webp')}",
            "created_at": img.created_at,
        })
    base_data["images"] = images_list

    # Réalisations avec calcul des durées
    assemblies_list = []
    for a in sorted(puzzle.assemblies, key=lambda x: x.run_number, reverse=True):
        total_sec = sum(s.duration_seconds for s in a.sessions)
        assemblies_list.append({
            "id": a.id,
            "puzzle_id": a.puzzle_id,
            "run_number": a.run_number,
            "status": a.status,
            "started_at": a.started_at,
            "completed_at": a.completed_at,
            "notes": a.notes,
            "total_duration_seconds": total_sec,
            "sessions_count": len(a.sessions),
            "created_at": a.created_at,
            "updated_at": a.updated_at,
            "sessions": sorted(a.sessions, key=lambda s: s.started_at, reverse=True),
        })
    base_data["assemblies"] = assemblies_list

    return base_data

@router.put("/{puzzle_id}", response_model=PuzzleListItemRead)
def update_puzzle(puzzle_id: str, payload: PuzzleUpdate, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    update_dict = payload.model_dump(exclude_unset=True)

    # Gestion des tags
    if "tags" in update_dict and update_dict["tags"] is not None:
        tag_names = update_dict.pop("tags")
        tags = []
        for name in tag_names:
            name_clean = name.strip()
            if name_clean:
                tag = db.query(Tag).filter(Tag.name == name_clean).first()
                if not tag:
                    tag = Tag(name=name_clean)
                    db.add(tag)
                tags.append(tag)
        puzzle.tags = tags

    # Statut
    old_status = puzzle.status
    for key, value in update_dict.items():
        setattr(puzzle, key, value)

    # Si le statut passe à "in_progress" et qu'aucune réalisation n'est en cours, en créer une
    if puzzle.status == "in_progress" and old_status != "in_progress":
        active_run = next((a for a in puzzle.assemblies if a.status == "in_progress"), None)
        if not active_run:
            next_run_number = len(puzzle.assemblies) + 1
            new_assembly = PuzzleAssembly(
                puzzle_id=puzzle.id,
                run_number=next_run_number,
                status="in_progress",
                started_at=datetime.utcnow()
            )
            db.add(new_assembly)

    puzzle.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(puzzle)
    return build_puzzle_list_item(puzzle)

@router.delete("/{puzzle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_puzzle(puzzle_id: str, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    # Supprimer les images physiques associées
    for img in puzzle.images:
        delete_image_files(img.file_name)

    db.delete(puzzle)
    db.commit()
    return None

@router.get("/meta/brands", response_model=List[str])
def get_brands(db: Session = Depends(get_db)):
    """Retourne la liste des marques distinctes."""
    brands = db.query(Puzzle.brand).filter(Puzzle.brand != None, Puzzle.brand != "").distinct().all()
    return sorted([b[0] for b in brands if b[0]])
