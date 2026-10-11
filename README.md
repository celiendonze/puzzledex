# 🧩 PuzzleDex

> **Carnet de bord & Chronomètre d'assemblage de puzzles en réseau local.**  
> Interface élégante inspirée de **L'Atelier** (Mode Jour lin/crème & Mode Soir boisé/espresso), 100% en français, sans compte ni inscription, avec base de données fichier ultra-facile à exporter et déployable en une commande Docker.

---

## ✨ Fonctionnalités Clés

- ⏱️ **Chronomètre d'assemblage interactif** :
  - Démarrage, pause, reprise et enregistrement des sessions.
  - Résistant aux fermetures d'onglets, rechargements et mises en veille (`localStorage` + synchronisation).
  - Mode **"Garder l'écran allumé"** (API Web Screen WakeLock) idéal sur tablette ou smartphone posé près de la table de puzzle.
- 🔄 **Assemblages Multiples (Réalisations / Runs)** :
  - Suivi des puzzles assemblés plusieurs fois dans le temps (`Réalisation #1`, `Réalisation #2`...).
  - Comparatif des temps et **Record personnel (🏆 Meilleur temps)** par puzzle.
  - Historique complet de chaque tentative avec le détail chronologique des sessions.
- 📸 **Galerie Photos & Métadonnées** :
  - Photo de la boîte, photos intermédiaires d'assemblage et du puzzle fini.
  - Compression et génération automatique de miniatures WebP légères.
  - Nombre de pièces, marque, dimensions, difficulté, avis personnel, pièces manquantes et étiquettes.
- 📊 **Tableau de bord & Statistiques** :
  - Total de pièces assemblées, temps global cumulé, vitesse moyenne en pièces par heure.
  - Record de vitesse sur 1 000 pièces et distribution par marque et taille.
- 💾 **Base de données fichier & Export 1 clic** :
  - Base SQLite autonome (`puzzledex.db`).
  - Téléchargement direct en **SQLite**, export **JSON structuré**, ou **Archive complète ZIP** (base + toutes vos photos).
  - Restauration en un clic par glisser-déposer.
- 🎨 **Design "L'Atelier" (Jour & Soir)** :
  - Ambiance chaleureuse, feutrée et artisanale avec bascule `☀️ Jour / 🌙 Soir`.

---

## 🚀 Démarrage Rapide avec Docker (Recommandé)

Le moyen le plus simple de déployer PuzzleDex sur votre machine ou serveur local (NAS, Raspberry Pi, etc.) :

```bash
docker compose up -d
```

Puis ouvrez votre navigateur sur :  
👉 **http://localhost:8080** (ou l'adresse IP locale de votre machine sur le réseau, ex. `http://192.168.1.50:8080`).

Toutes vos données (base SQLite et photos) sont stockées de façon persistante dans le volume Docker `puzzledex_data`.

Pour arrêter le conteneur :
```bash
docker compose down
```

---

## 💻 Développement Local (sans Docker)

### Prérequis
- **Python 3.11+** avec [`uv`](https://docs.astral.sh/uv/)
- **Node.js 18+** avec `npm`

### 1. Démarrer le Backend (FastAPI + uv)
```bash
cd backend
uv sync
uv run uvicorn app.main:app --port 8080 --reload
```
L'API est accessible sur `http://localhost:8080/api/health` et la documentation interactive sur `http://localhost:8080/docs`.

### 2. Démarrer le Frontend (React + Vite)
Dans un autre terminal :
```bash
cd frontend
npm install
npm run dev
```
L'interface de développement sera accessible sur `http://localhost:5173` (les requêtes `/api` sont automatiquement redirigées vers le backend).

### 3. Compiler le Frontend pour la Production
```bash
cd frontend
npm run build
```
Une fois compilé, le backend FastAPI sert automatiquement l'interface statique sur le port `8080` !

---

## 📂 Structure du Projet

```
puzzledex/
├── backend/
│   ├── app/
│   │   ├── routers/       # Endpoints API (puzzles, réalisations, sessions, photos, stats, backup)
│   │   ├── utils/         # Traitement d'images (Pillow) & Export/Import
│   │   ├── config.py      # Chemins et variables d'environnement
│   │   ├── database.py    # Moteur SQLite (WAL activé)
│   │   ├── models.py      # Modèles SQLAlchemy (Puzzles, Assemblies, Sessions, Images, Tags)
│   │   ├── schemas.py     # Schémas Pydantic v2
│   │   └── main.py        # Application FastAPI & distribution SPA
│   ├── pyproject.toml     # Dépendances Python gérées par uv
│   └── test_backend.py    # Suite de tests d'intégration automatisée
├── frontend/
│   ├── src/
│   │   ├── components/    # Header, PuzzleCard, TimerWidget, Modales
│   │   ├── context/       # ThemeContext (Jour/Soir) & TimerContext (anti-dérive, WakeLock)
│   │   ├── pages/         # CatalogPage, PuzzleDetailPage, StatsPage, BackupPage
│   │   ├── api.js         # Client API fetch
│   │   └── index.css      # Charte graphique L'Atelier (Jour & Soir)
│   └── package.json
├── docs/
│   ├── specs/             # Spécifications complètes (01 à 05)
│   └── design/            # Maquettes visuelles HTML/CSS exploratoires
├── Dockerfile             # Construction multi-stage (Node build -> Python runner)
├── docker-compose.yml     # Déploiement clé en main avec volume persistant
└── README.md
```

---

## 📄 Licence
Projet open-source pour les passionnés de puzzles.
