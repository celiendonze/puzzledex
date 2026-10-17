from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Puzzle, PuzzleAssembly, PuzzleSession
from app.schemas import AssemblyCreate, AssemblyUpdate, AssemblyRead, AssemblyDetailRead, ManualTimeCreate

router = APIRouter(tags=["Assemblages"])

def format_assembly(a: PuzzleAssembly) -> dict:
    total_sec = sum(s.duration_seconds for s in a.sessions)
    return {
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
    }

@router.post("/api/puzzles/{puzzle_id}/assemblies", response_model=AssemblyDetailRead, status_code=status.HTTP_201_CREATED)
def start_new_assembly(puzzle_id: str, payload: AssemblyCreate, db: Session = Depends(get_db)):
    """Crée une nouvelle réalisation (#N+1) pour ce puzzle et passe son statut à 'en cours'."""
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    # Clôturer automatiquement toute réalisation active antérieure si nécessaire
    for run in puzzle.assemblies:
        if run.status == "in_progress":
            run.status = "completed"
            if not run.completed_at:
                run.completed_at = datetime.utcnow()

    next_run_number = len(puzzle.assemblies) + 1
    new_assembly = PuzzleAssembly(
        puzzle_id=puzzle.id,
        run_number=next_run_number,
        status="in_progress",
        started_at=datetime.utcnow(),
        notes=payload.notes,
    )
    db.add(new_assembly)

    # Mettre à jour le statut du puzzle
    puzzle.status = "in_progress"
    puzzle.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(new_assembly)
    return format_assembly(new_assembly)

@router.post("/api/puzzles/{puzzle_id}/manual-time", response_model=AssemblyDetailRead, status_code=status.HTTP_201_CREATED)
def add_manual_time(puzzle_id: str, payload: ManualTimeCreate, db: Session = Depends(get_db)):
    """Ajoute manuellement un temps à un puzzle (soit comme nouvel assemblage terminé, soit à un run existant)."""
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    now = datetime.utcnow()
    started = payload.started_at or now

    if payload.assembly_id:
        target_assembly = db.query(PuzzleAssembly).filter(
            PuzzleAssembly.id == payload.assembly_id,
            PuzzleAssembly.puzzle_id == puzzle_id
        ).first()
        if not target_assembly:
            raise HTTPException(status_code=404, detail="Réalisation spécifiée non trouvée")
    else:
        # Créer un nouvel assemblage
        next_run_number = len(puzzle.assemblies) + 1
        target_assembly = PuzzleAssembly(
            puzzle_id=puzzle.id,
            run_number=next_run_number,
            status="completed" if payload.completed else "in_progress",
            started_at=started,
            completed_at=started if payload.completed else None,
            notes=payload.notes,
        )
        db.add(target_assembly)
        db.flush()

    # Créer la session pour cette durée
    session = PuzzleSession(
        puzzle_id=puzzle.id,
        assembly_id=target_assembly.id,
        started_at=started,
        ended_at=started,
        duration_seconds=payload.duration_seconds,
        notes=payload.notes,
    )
    db.add(session)

    if payload.completed:
        target_assembly.status = "completed"
        if not target_assembly.completed_at:
            target_assembly.completed_at = started
        other_active = any(a.id != target_assembly.id and a.status == "in_progress" for a in puzzle.assemblies)
        if not other_active:
            puzzle.status = "completed"
    else:
        target_assembly.status = "in_progress"
        puzzle.status = "in_progress"

    target_assembly.updated_at = now
    puzzle.updated_at = now

    db.commit()
    db.refresh(target_assembly)
    return format_assembly(target_assembly)

@router.get("/api/puzzles/{puzzle_id}/assemblies", response_model=List[AssemblyRead])
def get_puzzle_assemblies(puzzle_id: str, db: Session = Depends(get_db)):
    puzzle = db.query(Puzzle).filter(Puzzle.id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle non trouvé")

    return [format_assembly(a) for a in sorted(puzzle.assemblies, key=lambda x: x.run_number, reverse=True)]

@router.get("/api/assemblies/{assembly_id}", response_model=AssemblyDetailRead)
def get_assembly(assembly_id: str, db: Session = Depends(get_db)):
    assembly = db.query(PuzzleAssembly).filter(PuzzleAssembly.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Réalisation non trouvée")
    return format_assembly(assembly)

@router.put("/api/assemblies/{assembly_id}", response_model=AssemblyDetailRead)
def update_assembly(assembly_id: str, payload: AssemblyUpdate, db: Session = Depends(get_db)):
    assembly = db.query(PuzzleAssembly).filter(PuzzleAssembly.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Réalisation non trouvée")

    if payload.notes is not None:
        assembly.notes = payload.notes

    if payload.status is not None:
        assembly.status = payload.status
        if payload.status == "completed":
            assembly.completed_at = payload.completed_at or datetime.utcnow()
            # Si le puzzle n'a plus d'autre réalisation en cours, passer son statut à completed
            puzzle = assembly.puzzle
            other_active = any(a.id != assembly.id and a.status == "in_progress" for a in puzzle.assemblies)
            if not other_active:
                puzzle.status = "completed"
                puzzle.updated_at = datetime.utcnow()
        elif payload.status == "in_progress":
            assembly.completed_at = None
            assembly.puzzle.status = "in_progress"
            assembly.puzzle.updated_at = datetime.utcnow()

    assembly.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assembly)
    return format_assembly(assembly)

@router.delete("/api/assemblies/{assembly_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assembly(assembly_id: str, db: Session = Depends(get_db)):
    assembly = db.query(PuzzleAssembly).filter(PuzzleAssembly.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Réalisation non trouvée")

    db.delete(assembly)
    db.commit()
    return None
