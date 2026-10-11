# Index des Spécifications PuzzleDex

Ce dossier contient l'ensemble des spécifications pour **PuzzleDex**, une application web auto-hébergée et légère pour cataloguer ses puzzles, chronométrer le temps passé et exporter facilement ses données. L'application est **100% en français**.

## Sommaire des Spécifications
1. [01 - Présentation générale & Périmètre](file:///e:/dev/puzzledex/docs/specs/01-overview.md)
   - Vision produit, persona utilisateur, fonctionnement réseau local sans compte, principes clés et application 100% en français.
2. [02 - Exigences Fonctionnelles](file:///e:/dev/puzzledex/docs/specs/02-functional-requirements.md)
   - Gestion du catalogue, assemblages multiples (réalisations/runs), chronomètre interactif, historique des sessions, galerie photos, statistiques et sauvegardes.
3. [03 - Modèle de Données & Stockage](file:///e:/dev/puzzledex/docs/specs/03-data-model.md)
   - Schéma relationnel SQLite (`puzzles`, `puzzle_assemblies`, `puzzle_sessions`), export JSON et arborescence des fichiers.
4. [04 - Architecture Technique & Déploiement](file:///e:/dev/puzzledex/docs/specs/04-technical-architecture.md)
   - Stack FastAPI + React/Tailwind, conception de l'API REST, configurations Dockerfile et Docker Compose.
5. [05 - Spécifications UI / UX](file:///e:/dev/puzzledex/docs/specs/05-ui-ux.md)
   - Principes ergonomiques tactiles/mobiles, interface du chronomètre avec réveil d'écran (wake-lock), tableau de bord et libellés français.
