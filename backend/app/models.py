import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Table, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

# Table d'association many-to-many pour les tags
puzzle_tags = Table(
    "puzzle_tags",
    Base.metadata,
    Column("puzzle_id", String, ForeignKey("puzzles.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class Puzzle(Base):
    __tablename__ = "puzzles"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False, index=True)
    brand = Column(String, nullable=True, index=True)
    piece_count = Column(Integer, nullable=False, index=True)
    # Statuts: wishlist, in_stash, in_progress, completed, archived
    status = Column(String, nullable=False, default="in_stash", index=True)
    dimensions = Column(String, nullable=True)  # ex. "70 x 50 cm"
    difficulty = Column(Integer, nullable=True)  # 1 à 5
    rating = Column(Integer, nullable=True)  # 1 à 5
    missing_pieces = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)
    cover_image_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    assemblies = relationship("PuzzleAssembly", back_populates="puzzle", cascade="all, delete-orphan", order_by="PuzzleAssembly.run_number.asc()")
    images = relationship("PuzzleImage", back_populates="puzzle", cascade="all, delete-orphan", order_by="PuzzleImage.created_at.asc()")
    tags = relationship("Tag", secondary=puzzle_tags, back_populates="puzzles")


class PuzzleAssembly(Base):
    __tablename__ = "puzzle_assemblies"

    id = Column(String, primary_key=True, default=generate_uuid)
    puzzle_id = Column(String, ForeignKey("puzzles.id", ondelete="CASCADE"), nullable=False, index=True)
    run_number = Column(Integer, nullable=False, default=1)  # 1, 2, 3...
    # Statuts de réalisation : in_progress, completed, abandoned
    status = Column(String, nullable=False, default="in_progress")
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    puzzle = relationship("Puzzle", back_populates="assemblies")
    sessions = relationship("PuzzleSession", back_populates="assembly", cascade="all, delete-orphan", order_by="PuzzleSession.started_at.asc()")


class PuzzleSession(Base):
    __tablename__ = "puzzle_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    puzzle_id = Column(String, ForeignKey("puzzles.id", ondelete="CASCADE"), nullable=False, index=True)
    assembly_id = Column(String, ForeignKey("puzzle_assemblies.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=0)  # Durée en secondes
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    assembly = relationship("PuzzleAssembly", back_populates="sessions")


class PuzzleImage(Base):
    __tablename__ = "puzzle_images"

    id = Column(String, primary_key=True, default=generate_uuid)
    puzzle_id = Column(String, ForeignKey("puzzles.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    original_name = Column(String, nullable=True)
    mime_type = Column(String, nullable=False, default="image/webp")
    file_size = Column(Integer, nullable=False, default=0)
    is_cover = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    puzzle = relationship("Puzzle", back_populates="images")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    color = Column(String, nullable=True)

    # Relations
    puzzles = relationship("Puzzle", secondary=puzzle_tags, back_populates="tags")
