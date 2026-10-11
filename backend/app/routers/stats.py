from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Puzzle, PuzzleAssembly, PuzzleSession
from app.schemas import StatsRead

router = APIRouter(prefix="/api/stats", tags=["Statistiques"])

@router.get("", response_model=StatsRead)
def get_global_statistics(db: Session = Depends(get_db)):
    puzzles = db.query(Puzzle).all()

    total_puzzles = len(puzzles)
    completed_puzzles = sum(1 for p in puzzles if p.status == "completed")
    in_progress_puzzles = sum(1 for p in puzzles if p.status == "in_progress")
    in_stash_puzzles = sum(1 for p in puzzles if p.status == "in_stash")
    wishlist_puzzles = sum(1 for p in puzzles if p.status == "wishlist")

    # Toutes les réalisations complétées
    completed_assemblies = db.query(PuzzleAssembly).filter(PuzzleAssembly.status == "completed").all()
    total_assemblies_count = len(completed_assemblies)

    # Calcul des pièces terminées : somme des piece_count de chaque réalisation complétée
    total_pieces_completed = sum(a.puzzle.piece_count for a in completed_assemblies if a.puzzle)

    # Temps total passé sur TOUTES les sessions (y compris celles en cours)
    all_sessions = db.query(PuzzleSession).all()
    total_time_spent_seconds = sum(s.duration_seconds for s in all_sessions)

    # Vitesse moyenne en pièces par heure sur les réalisations terminées
    total_completed_time_hours = sum(sum(s.duration_seconds for s in a.sessions) for a in completed_assemblies) / 3600.0
    average_pieces_per_hour = 0.0
    if total_completed_time_hours > 0 and total_pieces_completed > 0:
        average_pieces_per_hour = round(total_pieces_completed / total_completed_time_hours, 1)

    # Puzzle 1000 pièces le plus rapide
    fastest_1000 = None
    min_1000_time = None
    for a in completed_assemblies:
        if a.puzzle and a.puzzle.piece_count == 1000:
            dur = sum(s.duration_seconds for s in a.sessions)
            if dur > 0 and (min_1000_time is None or dur < min_1000_time):
                min_1000_time = dur
                fastest_1000 = {
                    "puzzle_id": a.puzzle.id,
                    "title": a.puzzle.title,
                    "brand": a.puzzle.brand,
                    "duration_seconds": dur,
                    "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                }

    # Top Marques
    brand_counts = {}
    for p in puzzles:
        if p.brand:
            brand_counts[p.brand] = brand_counts.get(p.brand, 0) + 1
    top_brands = [{"brand": b, "count": c} for b, c in sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

    # Distribution par tranche de pièces
    tiers = {
        "< 500 pcs": 0,
        "500 - 999 pcs": 0,
        "1 000 pcs": 0,
        "1 500 - 1 999 pcs": 0,
        "2 000+ pcs": 0,
    }
    for p in puzzles:
        count = p.piece_count
        if count < 500:
            tiers["< 500 pcs"] += 1
        elif 500 <= count < 1000:
            tiers["500 - 999 pcs"] += 1
        elif count == 1000:
            tiers["1 000 pcs"] += 1
        elif 1000 < count < 2000:
            tiers["1 500 - 1 999 pcs"] += 1
        else:
            tiers["2 000+ pcs"] += 1
    piece_count_distribution = [{"tier": t, "count": c} for t, c in tiers.items()]

    return {
        "total_puzzles": total_puzzles,
        "completed_puzzles": completed_puzzles,
        "in_progress_puzzles": in_progress_puzzles,
        "in_stash_puzzles": in_stash_puzzles,
        "wishlist_puzzles": wishlist_puzzles,
        "total_pieces_completed": total_pieces_completed,
        "total_time_spent_seconds": total_time_spent_seconds,
        "average_pieces_per_hour": average_pieces_per_hour,
        "total_assemblies_count": total_assemblies_count,
        "fastest_1000_puzzle": fastest_1000,
        "top_brands": top_brands,
        "piece_count_distribution": piece_count_distribution,
    }
