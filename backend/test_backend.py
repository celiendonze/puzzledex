import os
import sys
from fastapi.testclient import TestClient

# Assurer l'accès au module app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app

client = TestClient(app)

def test_full_workflow():
    print("1. Test Health Check...")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    assert r.json()["status"] == "ok"
    print("   -> OK")

    print("2. Test Création d'un puzzle...")
    payload = {
        "title": "La Nuit Étoilée (Test)",
        "brand": "Eurographics",
        "piece_count": 1000,
        "status": "in_progress",
        "dimensions": "48 x 68 cm",
        "difficulty": 4,
        "rating": 5,
        "notes": "Magnifique puzzle de test",
        "tags": ["Art", "Van Gogh"]
    }
    r = client.post("/api/puzzles", json=payload)
    assert r.status_code == 201, f"Création échouée: {r.text}"
    puzzle = r.json()
    puzzle_id = puzzle["id"]
    print(f"   -> Puzzle créé : {puzzle_id} (Statut: {puzzle['status']})")

    print("3. Test Récupération du détail et vérification de la réalisation #1...")
    r = client.get(f"/api/puzzles/{puzzle_id}")
    assert r.status_code == 200
    detail = r.json()
    assert len(detail["assemblies"]) == 1, "Devrait avoir 1 réalisation créée automatiquement"
    assembly_1 = detail["assemblies"][0]
    assert assembly_1["run_number"] == 1
    assert assembly_1["status"] == "in_progress"
    print(f"   -> Réalisation #1 trouvée : {assembly_1['id']}")

    print("4. Test Ajout d'une session de chronométrage (3600 secondes)...")
    sess_payload = {
        "started_at": "2026-10-11T10:00:00Z",
        "ended_at": "2026-10-11T11:00:00Z",
        "duration_seconds": 3600,
        "notes": "Tri des bordures"
    }
    r = client.post(f"/api/assemblies/{assembly_1['id']}/sessions", json=sess_payload)
    assert r.status_code == 201
    session_1 = r.json()
    print(f"   -> Session #1 ajoutée : {session_1['duration_seconds']}s")

    print("5. Test Clôture de la Réalisation #1 (Terminé)...")
    r = client.put(f"/api/assemblies/{assembly_1['id']}", json={"status": "completed", "notes": "Premier run fini !"})
    assert r.status_code == 200
    assert r.json()["status"] == "completed"

    r = client.get(f"/api/puzzles/{puzzle_id}")
    detail = r.json()
    assert detail["status"] == "completed", "Le puzzle doit être passé en completed"
    assert detail["times_completed"] == 1
    assert detail["best_time_seconds"] == 3600
    print("   -> Réalisation #1 complétée avec succès !")

    print("6. Test 'Recommencer ce puzzle' (Lancement Réalisation #2)...")
    r = client.post(f"/api/puzzles/{puzzle_id}/assemblies", json={"notes": "Deuxième tentative"})
    assert r.status_code == 201
    assembly_2 = r.json()
    assert assembly_2["run_number"] == 2
    assert assembly_2["status"] == "in_progress"
    print(f"   -> Réalisation #2 lancée avec succès : {assembly_2['id']}")

    print("7. Test Ajout session Réalisation #2 (2700 secondes = 45m)...")
    r = client.post(f"/api/assemblies/{assembly_2['id']}/sessions", json={
        "started_at": "2026-10-11T14:00:00Z",
        "duration_seconds": 2700,
        "notes": "Gain de temps sur le ciel"
    })
    assert r.status_code == 201

    r = client.put(f"/api/assemblies/{assembly_2['id']}", json={"status": "completed"})
    assert r.status_code == 200

    r = client.get(f"/api/puzzles/{puzzle_id}")
    detail = r.json()
    assert detail["times_completed"] == 2
    assert detail["best_time_seconds"] == 2700, f"Le meilleur temps doit être 2700s, obtenu: {detail['best_time_seconds']}"
    print(f"   -> Record battu : {detail['best_time_seconds']}s sur 2 assemblages !")

    print("8. Test Statistiques globales...")
    r = client.get("/api/stats")
    assert r.status_code == 200
    stats = r.json()
    assert stats["total_pieces_completed"] >= 2000
    assert stats["total_assemblies_count"] >= 2
    print(f"   -> Stats OK : {stats['total_pieces_completed']} pièces posées, {stats['average_pieces_per_hour']} pcs/h")

    print("9. Test Export JSON...")
    r = client.get("/api/backup/json")
    assert r.status_code == 200
    export_json = r.json()
    assert "puzzles" in export_json
    print(f"   -> Export JSON OK ({len(export_json['puzzles'])} puzzles exportés)")

    print("10. Test Suppression du puzzle de test...")
    r = client.delete(f"/api/puzzles/{puzzle_id}")
    assert r.status_code == 204
    print("   -> Nettoyage OK")

    print("\n[SUCCES] TOUS LES TESTS SONT PASSES AVEC SUCCES !")

if __name__ == "__main__":
    test_full_workflow()
