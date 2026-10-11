from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# --- TAGS ---
class TagBase(BaseModel):
    name: str
    color: Optional[str] = None

class TagCreate(TagBase):
    pass

class TagRead(TagBase):
    id: str

    class Config:
        from_attributes = True

# --- SESSIONS ---
class SessionBase(BaseModel):
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int = Field(ge=0)
    notes: Optional[str] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None

class SessionRead(SessionBase):
    id: str
    puzzle_id: str
    assembly_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- IMAGES ---
class ImageRead(BaseModel):
    id: str
    puzzle_id: str
    file_name: str
    original_name: Optional[str] = None
    mime_type: str
    file_size: int
    is_cover: bool
    url: str
    thumbnail_url: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- ASSEMBLIES (RÉALISATIONS) ---
class AssemblyBase(BaseModel):
    notes: Optional[str] = None

class AssemblyCreate(AssemblyBase):
    pass

class AssemblyUpdate(BaseModel):
    status: Optional[str] = None  # in_progress, completed, abandoned
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

class AssemblyRead(AssemblyBase):
    id: str
    puzzle_id: str
    run_number: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_duration_seconds: int = 0
    sessions_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssemblyDetailRead(AssemblyRead):
    sessions: List[SessionRead] = []

# --- PUZZLES ---
class PuzzleBase(BaseModel):
    title: str
    brand: Optional[str] = None
    piece_count: int = Field(gt=0)
    status: str = "in_stash"  # wishlist, in_stash, in_progress, completed, archived
    dimensions: Optional[str] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    missing_pieces: int = 0
    notes: Optional[str] = None

class PuzzleCreate(PuzzleBase):
    tags: Optional[List[str]] = []  # Liste de noms de tags

class PuzzleUpdate(BaseModel):
    title: Optional[str] = None
    brand: Optional[str] = None
    piece_count: Optional[int] = Field(default=None, gt=0)
    status: Optional[str] = None
    dimensions: Optional[str] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    missing_pieces: Optional[int] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class PuzzleListItemRead(BaseModel):
    id: str
    title: str
    brand: Optional[str] = None
    piece_count: int
    status: str
    dimensions: Optional[str] = None
    difficulty: Optional[int] = None
    rating: Optional[int] = None
    missing_pieces: int
    cover_image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: List[TagRead] = []
    
    # Statistiques dérivées
    times_completed: int = 0
    best_time_seconds: Optional[int] = None
    last_completed_at: Optional[datetime] = None
    active_assembly_id: Optional[str] = None
    active_assembly_duration_seconds: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PuzzleDetailRead(PuzzleListItemRead):
    notes: Optional[str] = None
    images: List[ImageRead] = []
    assemblies: List[AssemblyDetailRead] = []

# --- STATS ---
class StatsRead(BaseModel):
    total_puzzles: int
    completed_puzzles: int
    in_progress_puzzles: int
    in_stash_puzzles: int
    wishlist_puzzles: int
    total_pieces_completed: int
    total_time_spent_seconds: int
    average_pieces_per_hour: float
    total_assemblies_count: int
    fastest_1000_puzzle: Optional[dict] = None
    top_brands: List[dict] = []
    piece_count_distribution: List[dict] = []
