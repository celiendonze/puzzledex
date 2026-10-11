# Functional Requirements

## 1. Puzzle Catalog & Management

### 1.1 Puzzle Attributes
Each puzzle in the system supports the following metadata fields:
- **Title / Name** (required): Name of the puzzle.
- **Brand / Manufacturer**: (e.g., Ravensburger, Buffalo Games, Clementoni, Galison).
- **Piece Count** (required): Number of pieces (e.g., 500, 1000, 2000).
- **Status / Statut**:
  - `wishlist` : **Liste d'envies** (souhaité / à acheter)
  - `in_stash` : **Dans la réserve** (possédé, non commencé)
  - `in_progress` : **En cours** (assemblage actif)
  - `completed` : **Terminé** (assemblé)
  - `archived` : **Archivé / Donné** (démonté, prêté ou donné)
- **Dimensions**: Largeur x Hauteur (ex. `70 x 50 cm`).
- **Difficulty / Difficulté**: Évaluation de 1 à 5 étoiles.
- **Rating / Note personnelle**: Évaluation de 1 à 5 étoiles.
- **Missing Pieces / Pièces manquantes**: Nombre entier (par défaut 0).
- **Date Started / Date de début**: Date / Heure.
- **Date Completed / Date d'achèvement**: Date / Heure.
- **Tags / Étiquettes**: Étiquettes personnalisées (ex. "Art", "Paysage", "Panoramique", "Bois", "Gradient").
- **Notes / Avis**: Texte libre ou Markdown pour avis et ressentis.
- **Cover Image / Image principale**: Photo de la boîte ou du puzzle terminé.
- **Gallery Images / Galerie photos**: Photos secondaires (étapes, progression, détails).

### 1.2 Puzzle CRUD Operations
- **List & Grid View**: Filterable by status, piece count, brand, tags; sortable by date added, piece count, total time, rating.
- **Create Puzzle**: Quick form with image upload (drag-and-drop or file picker) and auto-population of initial status.
- **Edit Puzzle**: Update any metadata at any time.
- **Delete Puzzle**: Confirmable deletion with option to retain or delete media files.

---

## 2. Assemblages Multiples (Réalisations) & Chronométrage

### 2.1 Concept de Réalisations Multiples (Runs d'assemblage)
Un puzzle peut être assemblé plusieurs fois au fil des mois ou des années. PuzzleDex gère ce cycle grâce à une entité dédiée : **La Réalisation (ou Run)**.
- Un puzzle contient une ou plusieurs **Réalisations** numérotées séquentiellement (`Réalisation #1`, `Réalisation #2`, etc.).
- Chaque réalisation possède :
  - Son statut propre : `En cours`, `Terminé`, `Abandonné`.
  - Sa date de début et sa date de complétion.
  - Sa durée totale propre (somme de ses sessions).
  - Sa liste de sessions de chronométrage.
  - Ses notes spécifiques (ex. "Deuxième fois, fait en duo avec un ami").
- **Action "Nouvel assemblage / Refaire le puzzle"** :
  - Dès qu'un puzzle a été terminé, l'utilisateur peut lancer un nouvel assemblage en un clic.
  - Une nouvelle réalisation (`#N+1`) est créée avec le statut `En cours`, prête pour de nouvelles sessions de chronomètre.
  - L'historique complet de toutes les réalisations passées reste consultable et intact.
- **Statistiques comparatives par puzzle** :
  - **Meilleur temps (Record personnel)** : La réalisation la plus rapide.
  - **Dernier temps réalisé**.
  - **Temps moyen** par réalisation.
  - **Évolution temporelle** : Gain ou perte de temps entre les réalisations successives.

### 2.2 Chronomètre Interactif de Session
Chaque réalisation active dispose de son interface de chronométrage :
- **Actions** :
  - `Démarrer` : Déclenche le chronomètre actif.
  - `Pause` : Suspend le décompte tout en conservant la durée en mémoire tampon.
  - `Enregistrer la session` : Valide la session avec sa durée, la date et une note facultative, puis l'ajoute au total de la réalisation active.
  - `Réinitialiser la session` : Abandonne la durée de la session en cours (avec confirmation).
  - `Terminer l'assemblage` : Clôture la réalisation en cours avec son statut `Terminé` et enregistre la date de complétion.
- **Résilience** :
  - L'état actif du chronomètre est persisté dans `localStorage` et synchronisé avec le serveur pour résister aux rechargements, fermetures d'onglets ou veilles d'appareils.
  - La durée calculée se base sur `(Date.now() - startTime) - pausedDuration` (anti-dérive).

### 2.3 Historique des Sessions et Ajustements Manuels
- Chaque réalisation se décompose en sessions de travail individuelles (jours/soirées).
- Chaque session enregistre : identifiant, date/heure de début, date/heure de fin, durée en secondes et note facultative.
- Possibilité d'`Ajouter une session manuelle` (pour rattraper du temps hors écran) ou de modifier/supprimer une session erronée.

---

## 3. Media & Image Management
- Single/multiple image upload per puzzle.
- Automatic image thumbnail creation and web-friendly optimization (JPEG/WebP).
- Primary / Cover image designation.
- Images stored in a dedicated local directory (`/data/uploads/`) mapped to a persistent Docker volume.

---

## 4. Dashboard & Statistics
- **High-Level Metrics**:
  - Total puzzles completed.
  - Total pieces assembled across all completed puzzles.
  - Total cumulative time spent assembling (formatted in days, hours, minutes).
  - Average assembly speed: `Pieces per Hour` (PPH) overall and per piece-count tier (e.g., 500 pcs vs. 1000 pcs).
- **Speed Records**:
  - Fastest completed puzzle (by total time and by PPH).
  - Longest / most challenging puzzle.
- **Visual Charts**:
  - Pieces completed over time (monthly / yearly).
  - Distribution by piece count and brand.

---

## 5. Data Portability, Backup & Export
- **File-Based Storage**: No standalone database server (e.g. Postgres or MySQL) required.
- **Direct File Backup**: Simply copying the `/data` directory backs up the entire state.
- **In-App Export**:
  - "Download Database" (`puzzledex.db`).
  - "Export JSON" (complete JSON dump of all puzzles, sessions, and tags).
  - "Full Archive Export" (.zip containing JSON/SQLite + all image uploads).
- **In-App Import**:
  - Restore from JSON or ZIP backup.

---

## 6. Language & Localization (100% Français)
L'ensemble de l'interface utilisateur, des libellés, des notifications, des métriques et des dialogues de confirmation est intégralement en français :
- **Navigation** : "Catalogue", "Statistiques", "Sauvegarde", "Nouveau puzzle"
- **Statuts** : "Liste d'envies", "Dans la réserve", "En cours", "Terminé", "Archivé / Donné"
- **Chronomètre** : "Démarrer", "Pause", "Enregistrer la session", "Ajouter du temps manuel", "Réinitialiser"
- **Métriques** : "Puzzles terminés", "Nombre total de pièces", "Temps total passé", "Vitesse moyenne (pièces / heure)"
- **Sauvegarde** : "Télécharger la base de données", "Exporter en JSON", "Télécharger l'archive complète", "Restaurer une sauvegarde"
