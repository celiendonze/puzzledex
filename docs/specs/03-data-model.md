# Data Model & Storage Specification

## 1. Storage Strategy

### 1.1 File-Based Database Architecture
To satisfy the requirements of single-user simplicity, zero external server dependencies, and easy portability, **SQLite** is specified as the primary database engine.
- Single database file: `/data/puzzledex.db`
- WAL (Write-Ahead Logging) enabled for performance and reliability: `PRAGMA journal_mode = WAL;`
- Foreign key constraints enforced: `PRAGMA foreign_keys = ON;`

### 1.2 File Storage Directory Structure
All user data and uploaded assets are strictly contained within a single `/data` mount root:
```
/data/
├── puzzledex.db           # SQLite database file
├── puzzledex.db-wal       # SQLite WAL file (when active)
├── puzzledex.db-shm       # SQLite Shared Memory file
└── uploads/
    ├── originals/         # Original uploaded images
    │   └── {puzzle_id}/
    │       └── {image_id}.webp
    └── thumbnails/        # Auto-generated lightweight thumbnails
        └── {puzzle_id}/
            └── {image_id}_thumb.webp
```

---

## 2. Relational Schema (SQLite DDL)

```sql
-- Puzzles Table
CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,                       -- UUID v4 or ULID
    title TEXT NOT NULL,                       -- Puzzle name
    brand TEXT,                                -- Manufacturer
    piece_count INTEGER NOT NULL,              -- Total pieces
    status TEXT NOT NULL DEFAULT 'in_stash',   -- wishlist, in_stash, in_progress, completed, archived
    dimensions TEXT,                           -- e.g. "70 x 50 cm"
    difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 5),
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    missing_pieces INTEGER NOT NULL DEFAULT 0,
    date_started TEXT,                         -- ISO8601 string
    date_completed TEXT,                       -- ISO8601 string
    notes TEXT,                                -- General remarks / review
    cover_image_id TEXT,                       -- Foreign key or reference to primary image
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Assembly Runs (Réalisations d'assemblage)
CREATE TABLE IF NOT EXISTS puzzle_assemblies (
    id TEXT PRIMARY KEY,                       -- UUID v4
    puzzle_id TEXT NOT NULL,
    run_number INTEGER NOT NULL DEFAULT 1,     -- 1, 2, 3...
    status TEXT NOT NULL DEFAULT 'in_progress',-- in_progress, completed, abandoned
    started_at TEXT,                           -- ISO8601 timestamp
    completed_at TEXT,                         -- ISO8601 timestamp
    notes TEXT,                                -- Notes / avis sur cette réalisation précise
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
);

-- Sessions / Timer Tracking Table
CREATE TABLE IF NOT EXISTS puzzle_sessions (
    id TEXT PRIMARY KEY,                       -- UUID v4
    puzzle_id TEXT NOT NULL,
    assembly_id TEXT NOT NULL,                 -- Lié à une réalisation précise
    started_at TEXT NOT NULL,                  -- ISO8601 timestamp
    ended_at TEXT,                             -- ISO8601 timestamp
    duration_seconds INTEGER NOT NULL,         -- Durée active en secondes
    notes TEXT,                                -- Notes sur cette session d'assemblage
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY (assembly_id) REFERENCES puzzle_assemblies(id) ON DELETE CASCADE
);

-- Media / Images Table
CREATE TABLE IF NOT EXISTS puzzle_images (
    id TEXT PRIMARY KEY,                       -- UUID v4
    puzzle_id TEXT NOT NULL,
    file_name TEXT NOT NULL,                   -- Stored filename (e.g. uuid.webp)
    original_name TEXT,                        -- Original upload filename
    mime_type TEXT NOT NULL,                   -- image/jpeg, image/png, image/webp
    file_size INTEGER NOT NULL,                -- bytes
    is_cover INTEGER NOT NULL DEFAULT 0,       -- 1 if primary image, 0 otherwise
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
);

-- Tags Definition Table
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT                                 -- Optional hex color code for UI badges
);

-- Puzzle-to-Tag Many-to-Many Association Table
CREATE TABLE IF NOT EXISTS puzzle_tags (
    puzzle_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (puzzle_id, tag_id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indices for Fast Querying
CREATE INDEX IF NOT EXISTS idx_puzzles_status ON puzzles(status);
CREATE INDEX IF NOT EXISTS idx_puzzles_piece_count ON puzzles(piece_count);
CREATE INDEX IF NOT EXISTS idx_assemblies_puzzle_id ON puzzle_assemblies(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_sessions_assembly_id ON puzzle_sessions(assembly_id);
CREATE INDEX IF NOT EXISTS idx_sessions_puzzle_id ON puzzle_sessions(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_images_puzzle_id ON puzzle_images(puzzle_id);
```

---

## 3. Data Export Schema (JSON Format)

For human-readable or cross-platform data export, a standardized JSON format is specified:

```json
{
  "version": "1.0",
  "exported_at": "2026-10-11T10:00:00Z",
  "puzzles": [
    {
      "id": "c1f7b029-...",
      "title": "Starry Night",
      "brand": "Eurographics",
      "piece_count": 1000,
      "status": "completed",
      "dimensions": "48 x 68 cm",
      "difficulty": 4,
      "rating": 5,
      "missing_pieces": 0,
      "notes": "Sky section was challenging but fun.",
      "tags": ["Art", "Van Gogh", "Challenging"],
      "times_completed": 2,
      "best_duration_seconds": 18200,
      "assemblies": [
        {
          "id": "run-001",
          "run_number": 1,
          "status": "completed",
          "started_at": "2026-01-10T14:00:00Z",
          "completed_at": "2026-01-14T18:30:00Z",
          "total_duration_seconds": 23450,
          "notes": "Premier assemblage, très plaisant.",
          "sessions": [
            {
              "id": "sess-1",
              "started_at": "2026-01-10T14:00:00Z",
              "ended_at": "2026-01-10T16:30:00Z",
              "duration_seconds": 9000,
              "notes": "Tri des bordures et étoiles"
            }
          ]
        },
        {
          "id": "run-002",
          "run_number": 2,
          "status": "completed",
          "started_at": "2026-10-01T10:00:00Z",
          "completed_at": "2026-10-03T16:00:00Z",
          "total_duration_seconds": 18200,
          "notes": "Deuxième assemblage, gain de plus d'une heure !",
          "sessions": [
            {
              "id": "sess-2",
              "started_at": "2026-10-01T10:00:00Z",
              "ended_at": "2026-10-01T13:00:00Z",
              "duration_seconds": 10800,
              "notes": "Technique plus rapide sur le ciel tourbillonnant"
            }
          ]
        }
      ],
      "images": [
        {
          "id": "img-...",
          "file_name": "cover.webp",
          "is_cover": true
        }
      ]
    }
  ]
}
```
