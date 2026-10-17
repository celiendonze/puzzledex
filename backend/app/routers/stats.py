from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Puzzle, PuzzleAssembly, PuzzleSession
from app.schemas import StatsRead

router = APIRouter(prefix="/api/stats", tags=["Statistiques"])

def get_tier_name(count: int) -> str:
    if count < 500:
        return "< 500 pcs"
    elif count == 500:
        return "500 pcs"
    elif 500 < count < 1000:
        return "501 - 999 pcs"
    elif count == 1000:
        return "1 000 pcs"
    else:
        return "1 500+ pcs"

@router.get("", response_model=StatsRead)
def get_global_statistics(db: Session = Depends(get_db)):
    puzzles = db.query(Puzzle).all()

    total_puzzles = len(puzzles)
    completed_puzzles = sum(1 for p in puzzles if p.status == "completed")
    in_progress_puzzles = sum(1 for p in puzzles if p.status == "in_progress")
    in_stash_puzzles = sum(1 for p in puzzles if p.status == "in_stash")
    wishlist_puzzles = sum(1 for p in puzzles if p.status == "wishlist")
    borrowed_puzzles = sum(1 for p in puzzles if p.status == "borrowed")

    # Collection possédée (hors empruntés, archivés, wishlist)
    collection_puzzles = [p for p in puzzles if p.status not in ("borrowed", "archived", "wishlist")]
    total_pieces_in_collection = sum(p.piece_count for p in collection_puzzles)
    collection_puzzles_count = len(collection_puzzles)

    # Toutes les réalisations complétées
    completed_assemblies = db.query(PuzzleAssembly).filter(PuzzleAssembly.status == "completed").all()
    total_assemblies_count = len(completed_assemblies)

    # Calcul des pièces terminées : somme des piece_count de chaque réalisation complétée
    total_pieces_completed = sum(a.puzzle.piece_count for a in completed_assemblies if a.puzzle)

    # Temps total passé sur TOUTES les sessions (y compris celles en cours)
    all_sessions = db.query(PuzzleSession).all()
    total_time_spent_seconds = sum(s.duration_seconds for s in all_sessions)

    # Vitesse globale en pièces par minute et par heure sur les réalisations terminées
    total_completed_time_seconds = sum(sum(s.duration_seconds for s in a.sessions) for a in completed_assemblies)
    average_pieces_per_minute = 0.0
    average_pieces_per_hour = 0.0
    if total_completed_time_seconds > 0 and total_pieces_completed > 0:
        total_completed_minutes = total_completed_time_seconds / 60.0
        average_pieces_per_minute = round(total_pieces_completed / total_completed_minutes, 2)
        average_pieces_per_hour = round(average_pieces_per_minute * 60.0, 1)

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

    # Détails d'allure en pièces par minute par catégorie de pièces
    tier_order = ["< 500 pcs", "500 pcs", "501 - 999 pcs", "1 000 pcs", "1 500+ pcs"]
    pace_tiers = {
        t: {
            "tier": t,
            "completed_count": 0,
            "total_pieces": 0,
            "total_duration_seconds": 0,
            "fastest_run": None,
        }
        for t in tier_order
    }

    for a in completed_assemblies:
        if not a.puzzle:
            continue
        dur = sum(s.duration_seconds for s in a.sessions)
        if dur <= 0:
            continue

        tier_name = get_tier_name(a.puzzle.piece_count)
        pt = pace_tiers[tier_name]
        pt["completed_count"] += 1
        pt["total_pieces"] += a.puzzle.piece_count
        pt["total_duration_seconds"] += dur

        run_ppm = round((a.puzzle.piece_count * 60.0) / dur, 2)
        if pt["fastest_run"] is None or run_ppm > pt["fastest_run"]["pieces_per_minute"]:
            pt["fastest_run"] = {
                "puzzle_id": a.puzzle.id,
                "puzzle_title": a.puzzle.title,
                "duration_seconds": dur,
                "pieces_per_minute": run_ppm,
                "pieces_per_hour": round(run_ppm * 60.0, 1),
            }

    pace_by_piece_count = []
    for t in tier_order:
        data = pace_tiers[t]
        c_count = data["completed_count"]
        t_pieces = data["total_pieces"]
        t_dur = data["total_duration_seconds"]

        avg_ppm = 0.0
        avg_pph = 0.0
        avg_dur = 0
        if t_dur > 0 and t_pieces > 0 and c_count > 0:
            avg_ppm = round(t_pieces / (t_dur / 60.0), 2)
            avg_pph = round(avg_ppm * 60.0, 1)
            avg_dur = int(t_dur / c_count)

        pace_by_piece_count.append({
            "tier": t,
            "completed_count": c_count,
            "total_pieces": t_pieces,
            "total_duration_seconds": t_dur,
            "average_pieces_per_minute": avg_ppm,
            "average_pieces_per_hour": avg_pph,
            "average_duration_seconds": avg_dur,
            "fastest_run": data["fastest_run"],
        })

    # Top Marques
    brand_counts = {}
    for p in puzzles:
        if p.brand:
            brand_counts[p.brand] = brand_counts.get(p.brand, 0) + 1
    top_brands = [{"brand": b, "count": c} for b, c in sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

    # Distribution par tranche de pièces
    tiers = {
        "< 500 pcs": 0,
        "500 pcs": 0,
        "501 - 999 pcs": 0,
        "1 000 pcs": 0,
        "1 500+ pcs": 0,
    }
    for p in puzzles:
        tier_name = get_tier_name(p.piece_count)
        tiers[tier_name] += 1
    piece_count_distribution = [{"tier": t, "count": c} for t, c in tiers.items()]

    return {
        "total_puzzles": total_puzzles,
        "completed_puzzles": completed_puzzles,
        "in_progress_puzzles": in_progress_puzzles,
        "in_stash_puzzles": in_stash_puzzles,
        "wishlist_puzzles": wishlist_puzzles,
        "borrowed_puzzles": borrowed_puzzles,
        "total_pieces_in_collection": total_pieces_in_collection,
        "collection_puzzles_count": collection_puzzles_count,
        "total_pieces_completed": total_pieces_completed,
        "total_time_spent_seconds": total_time_spent_seconds,
        "average_pieces_per_minute": average_pieces_per_minute,
        "average_pieces_per_hour": average_pieces_per_hour,
        "total_assemblies_count": total_assemblies_count,
        "fastest_1000_puzzle": fastest_1000,
        "top_brands": top_brands,
        "piece_count_distribution": piece_count_distribution,
        "pace_by_piece_count": pace_by_piece_count,
    }
