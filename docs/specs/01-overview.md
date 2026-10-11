# PuzzleDex - Specification Overview

## 1. Project Vision
**PuzzleDex** is a lightweight, self-hosted web application designed to catalog and track jigsaw puzzles. It allows enthusiasts to log puzzle metadata (piece count, brand, images), accurately track time spent assembling puzzles via an interactive timer (start, pause, resume, save), and inspect assembly statistics.

The application is tailored for single-user home / local network (LAN) usage with zero authentication friction and minimal system overhead. Data portability is a first-class citizen through a file-based storage architecture that makes backups and exports trivial.

---

## 2. Target Persona & Usage Context
- **Target User**: A puzzle hobbyist tracking personal puzzle collections, works in progress, and completion times.
- **Environment**: Local network (desktop, tablet, or mobile phone placed near the puzzle board).
- **Access Model**: Single-user, no authentication/login barrier; accessible via LAN IP / local hostname (e.g., `http://puzzledex.local:8080`).

---

## 3. Core Principles
1. **Frictionless Timer**: Starting, pausing, resuming, and logging puzzle sessions must be seamless, resilient against accidental tab closes or device reloads, and usable on mobile/tablets.
2. **Effortless Export & Backup**: All application state resides in a file-based database (e.g., SQLite) and a local media directory. Backing up or migrating is as simple as copying a directory or clicking an "Export" button.
3. **Turnkey Docker Deployment**: A single `docker compose up -d` command spins up the complete service with persistent volume mappings.
4. **Clean, Responsive UI**: Optimized for both desktop browsing and bedside/puzzle-table tablet and smartphone use.
5. **French Language Native (100% en français)**: The entire user interface, labels, buttons, forms, tooltips, statuses, and feedback messages are natively in French.

---

## 4. Key Scope & Non-Goals
### In-Scope
- Puzzle cataloging (title, brand, piece count, status, dimensions, tags/categories, difficulty, notes).
- Photo management (box image, finished puzzle image, progress photos).
- Interactive assembly timer with pause/resume and automatic session history logging.
- Multi-run / Repeat assembly tracking (tracking multiple builds of the same puzzle over time, personal best records, and time evolution).
- Manual time entry/editing (for retroactively logging time or fixing accidental timer runs).
- Dashboard and statistics (total pieces completed, average speed / piece-per-hour, total puzzle time).
- Easy export/import (direct database download, JSON backup, and ZIP asset archive).
- Dockerized setup with minimal resource footprint.

### Non-Goals (v1)
- Multi-user authentication, accounts, roles, or permission management.
- External social network integration or cloud account sync.
- Complex online marketplace / price tracking integrations.
