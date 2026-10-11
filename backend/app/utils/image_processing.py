import io
from pathlib import Path
from PIL import Image
from app.config import ORIGINALS_DIR, THUMBNAILS_DIR

MAX_ORIGINAL_DIMENSION = 1920
THUMBNAIL_DIMENSION = 420
WEBP_QUALITY = 82

def process_and_save_image(image_bytes: bytes, image_id: str) -> dict:
    """
    Traite une image téléversée :
    - Convertit en WebP optimisé pour l'original (max 1920px)
    - Génère une miniature carrée recadrée / optimisée (420px)
    - Enregistre sur le disque et retourne les métadonnées.
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Gestion de l'orientation EXIF si présente
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Conversion en RGB si RGBA/palette
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # 1. Sauvegarde de l'original redimensionné
    orig = img.copy()
    orig.thumbnail((MAX_ORIGINAL_DIMENSION, MAX_ORIGINAL_DIMENSION), Image.Resampling.LANCZOS)
    
    file_name = f"{image_id}.webp"
    original_path = ORIGINALS_DIR / file_name
    orig.save(original_path, format="WEBP", quality=WEBP_QUALITY, method=6)
    file_size = original_path.stat().st_size

    # 2. Sauvegarde de la miniature
    thumb_name = f"{image_id}_thumb.webp"
    thumb_path = THUMBNAILS_DIR / thumb_name
    
    # Recadrage centré carré pour des cartes homogènes
    from PIL import ImageOps
    thumb = ImageOps.fit(img, (THUMBNAIL_DIMENSION, THUMBNAIL_DIMENSION), Image.Resampling.LANCZOS)
    thumb.save(thumb_path, format="WEBP", quality=WEBP_QUALITY, method=6)

    return {
        "file_name": file_name,
        "file_size": file_size,
        "mime_type": "image/webp"
    }

def delete_image_files(file_name: str):
    """Supprime l'original et la miniature correspondante."""
    orig_path = ORIGINALS_DIR / file_name
    if orig_path.exists():
        orig_path.unlink()
        
    thumb_name = file_name.replace(".webp", "_thumb.webp")
    thumb_path = THUMBNAILS_DIR / thumb_name
    if thumb_path.exists():
        thumb_path.unlink()
