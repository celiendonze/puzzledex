# Spécifications UI / UX

## 1. Principes de Design & Charte Graphique
- **Direction Visuelle : « L'Atelier Chaleureux »** :
  - **Identité** : Ambiance feutrée, artisanale et cosy. Typographie avec empattements élégants (sérif) pour les titres et sans-serif aérée pour les données et boutons.
  - **Mode Jour (« Atelier de Jour »)** : Fond crème lin (`#F7F4EE`), surfaces blanches, accents terracotta doux (`#BC5A36`), vert sauge (`#3F6C51`), bordures chaudes (`#DFD7CA`).
  - **Mode Soir (« Atelier du Soir »)** : Même ADN chaleureux et boisé, adapté aux séances nocturnes. Fond espresso profond (`#181512`), surfaces bois sombre (`#231D19`), terracotta braisé (`#E06D44`), vert sauge lumineux (`#5CA077`), bordures douces (`#3A312A`). Évite tout éblouissement sans tomber dans un noir/bleu froid.
- **100% en Français** : Tous les textes, boutons, formulaires, filtres, infobulles et notifications sont nativement en français.
- **Optimisé tactile & Mobile/Tablette** : Boutons larges, zones tactiles généreuses et ergonomie pensée pour une utilisation sur smartphone ou tablette posée sur la table de puzzle.
- **Statut lisible en un coup d'œil** : Badges et repères visuels clairs selon le statut (En cours, Dans la réserve, Terminé, Liste d'envies).
- **Chronomètre fiable et central** : Affichage net du chronomètre, résistant aux mises en veille et aux rafraîchissements de page.

---

## 2. Vues Principales & Composants

### 2.1 Vue Catalogue (Accueil)
- **Barre supérieure (En-tête)** :
  - Titre de l'application / Logo `PuzzleDex`.
  - Indicateur de chronomètre actif (si un puzzle est en cours de minutage, un badge clignotant avec le temps écoulé s'affiche dans la barre de navigation).
  - Action rapide : "+ Nouveau puzzle".
  - Liens de navigation : "Catalogue", "Statistiques", "Sauvegarde".
- **Filtres et Recherche** :
  - Recherche textuelle par titre ou marque.
  - Filtres par statut : `Tous`, `En cours`, `Dans la réserve`, `Terminé`, `Liste d'envies`.
  - Filtre par nombre de pièces : `< 500`, `500 - 999`, `1000`, `1500+`.
  - Sélecteur de tri : Date d'ajout, Nombre de pièces, Temps total passé, Note.
- **Cartes de Puzzle (Grille & Liste)** :
  - Photo de couverture avec badge du nombre de pièces (ex. `1000 pièces`).
  - Titre et marque (ex. `Ravensburger`).
  - Badge de statut coloré (`En cours`, `Terminé`, etc.).
  - Temps total enregistré (ex. `⏱️ 4h 15m`).
  - Action rapide : Bouton "Chronomètre" ou "Voir la fiche".

### 2.2 Fiche Détaillée & Chronomètre d'Assemblage
- **En-tête de la fiche** :
  - Titre, marque, nombre de pièces, sélecteur de statut.
  - Badges de synthèse :
    - 🏆 **Meilleur temps (Record)** : ex. `3h 15m` (avec date).
    - 🔄 **Nombre d'assemblages** : ex. `Assemblé 2 fois`.
    - Bouton principal `+ Recommencer ce puzzle` (lance une nouvelle réalisation `#N+1`).
- **Section Réalisation Active & Chronomètre (Composant interactif clé)** :
  - Badge de la réalisation en cours (ex. `Réalisation #2 - En cours`).
  - Grand affichage digital : `00:00:00`.
  - Boutons d'action principaux :
    - `Démarrer` (Vert) / `Pause` (Orange).
    - `Enregistrer la session` (Bleu) : Ouvre une boîte de dialogue avec la durée écoulée, la date et un champ de note (ex. "Tri des bords terminé").
    - `Réinitialiser la session` : Abandonne l'intervalle courant (avec confirmation).
    - `Terminer l'assemblage` (Vert éclatant) : Marque la réalisation courante comme terminée et enregistre la date finale.
  - Interrupteur "Garder l'écran allumé" : Utilise l'API Web `navigator.wakeLock` pour empêcher la mise en veille de l'écran pendant le puzzle.
- **Historique des Réalisations & Sessions** :
  - Liste accordéon ou onglets de toutes les réalisations (`Réalisation #2 (Actuelle)`, `Réalisation #1 (12/01/2026 - 4h 30m)`).
  - Pour chaque réalisation : durée totale cumulée, date de fin, notes personnelles.
  - Liste chronologique détaillée des sessions de chaque réalisation (date, heure, durée, note).
  - Actions Modifier / Supprimer par session et bouton `+ Ajouter du temps manuellement`.
- **Métadonnées & Avis** :
  - Dimensions (ex. `70 x 50 cm`), difficulté (1 à 5 étoiles), note personnelle (1 à 5 étoiles), compteur de pièces manquantes.
  - Section notes & avis (support texte et Markdown).
- **Galerie Photos** :
  - Image de la boîte, photos intermédiaires d'assemblage, photo du puzzle complété.
  - Téléversement par glisser-déposer (drag-and-drop) ou sélection de fichier.

### 2.3 Tableau de Bord & Statistiques
- **Cartes de synthèse** :
  - Puzzles terminés.
  - Total de pièces assemblées.
  - Temps total cumulé (formaté en Jours, Heures, Minutes).
  - Vitesse moyenne d'assemblage (pièces par heure).
- **Records personnels** :
  - Puzzle 1000 pièces le plus rapide.
  - Plus longue session d'assemblage.
- **Graphiques & Répartitions** :
  - Répartition par tranche de pièces.
  - Répartition par marque.

### 2.4 Sauvegarde & Paramètres
- **Section Exportation** :
  - `Télécharger la base de données` (fichier `.db` SQLite).
  - `Exporter en JSON` (fichier `.json`).
  - `Télécharger l'archive complète` (archive `.zip` avec base SQLite et photos).
- **Section Restauration** :
  - Glisser-déposer pour restaurer depuis un fichier JSON ou ZIP.
