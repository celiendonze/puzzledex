from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PuzzleAssembly, PuzzleSession
from app.schemas import SessionCreate, SessionUpdate, SessionRead

router = APIRouter(tags=["Sessions de Chronomètre"])

@router.post("/api/assemblies/{assembly_id}/sessions", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(assembly_id: str, payload: SessionCreate, db: Session = Depends(get_db)):
    """Enregistre une nouvelle session de chronométrage dans la réalisation spécifiée."""
    assembly = db.query(PuzzleAssembly).filter(PuzzleAssembly.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Réalisation non trouvée")

    session = PuzzleSession(
        puzzle_id=assembly.puzzle_id,
        assembly_id=assembly.id,
        started_at=payload.started_at,
        ended_at=payload.ended_at or datetime.utcnow(),
        duration_seconds=payload.duration_seconds,
        notes=payload.notes,
    )
    db.add(session)

    assembly.updated_at = datetime.utcnow()
    assembly.puzzle.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session

@router.put("/api/sessions/{session_id}", response_model=SessionRead)
def update_session(session_id: str, payload: SessionUpdate, db: Session = Depends(get_db)):
    """Met à jour une session d'assemblage existante (durée, note ou dates)."""
    session = db.query(PuzzleSession).filter(PuzzleSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    if payload.duration_seconds is not None:
        session.duration_seconds = payload.duration_seconds
    if payload.notes is not None:
        session.notes = payload.notes
    if payload.started_at is not None:
        session.started_at = payload.started_at
    if payload.ended_at is not None:
        session.ended_at = payload.ended_at

    session.assembly.updated_at = datetime.utcnow()
    session.assembly.puzzle.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session

@router.delete("/api/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, db: Session = Depends(get_db)):
    """Supprime une session de chronométrage."""
    session = db.query(PuzzleSession).filter(PuzzleSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    db.delete(session)
    db.commit()
    return None
