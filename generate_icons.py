import os
from PIL import Image, ImageDraw

def create_puzzle_icon(size, is_maskable=False):
    # Dimensions et ratio
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Couleurs du thème L'Atelier
    # Terracotta: #BC5A36 -> (188, 90, 54)
    # Fond crème: #FBF7F0 -> (251, 247, 240)
    # Vert sauge: #3F6C51 -> (63, 108, 81)
    # Ambre chaud: #C97D29 -> (201, 125, 41)
    
    bg_color = (188, 90, 54, 255)
    
    if is_maskable:
        # Les icônes maskable doivent remplir tout le carré (zone de sécurité au centre à 80%)
        draw.rectangle([0, 0, size, size], fill=bg_color)
    else:
        # Coins arrondis doux (squircle moderne)
        corner_radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_radius, fill=bg_color)

    # Dessin d'une pièce de puzzle stylisée au centre
    # Echelle intérieure
    center = size / 2.0
    scale = (size * 0.52) if is_maskable else (size * 0.58)
    
    # Coordonnées relatives d'une pièce de puzzle classique
    # On va dessiner une pièce de puzzle élégante avec ses languettes (knobs) et creux (holes)
    # Couleur de la pièce principale: Crème chaud très lumineux
    piece_color = (251, 247, 240, 255)
    accent_color = (201, 125, 41, 255) # ambre
    sauge_color = (63, 108, 81, 255)

    # Corps carré central
    half = scale / 2.0
    left = center - half
    right = center + half
    top = center - half
    bottom = center + half

    # Tracé des éléments de puzzle combinés : corps + languette haut + languette droite + creux
    # Pour un rendu ultra propre et vectoriel avec Pillow, on trace des ellipses et rectangles
    knob_radius = scale * 0.22
    
    # Corps central arrondi
    draw.rounded_rectangle(
        [left, top, right, bottom],
        radius=int(scale * 0.12),
        fill=piece_color
    )
    
    # Languette supérieure (knob)
    draw.ellipse(
        [center - knob_radius, top - knob_radius * 0.8, center + knob_radius, top + knob_radius * 1.2],
        fill=piece_color
    )
    # Jonction haut
    neck_w = knob_radius * 1.2
    draw.rectangle(
        [center - neck_w/2, top - knob_radius * 0.3, center + neck_w/2, top + knob_radius * 0.4],
        fill=piece_color
    )

    # Languette droite (knob)
    draw.ellipse(
        [right - knob_radius * 1.2, center - knob_radius, right + knob_radius * 0.8, center + knob_radius],
        fill=piece_color
    )
    # Jonction droite
    draw.rectangle(
        [right - knob_radius * 0.4, center - neck_w/2, right + knob_radius * 0.3, center + neck_w/2],
        fill=piece_color
    )

    # Creux bas (hole) avec fond terracotta
    hole_radius = knob_radius * 0.95
    draw.ellipse(
        [center - hole_radius, bottom - hole_radius * 1.1, center + hole_radius, bottom + hole_radius * 0.9],
        fill=bg_color
    )

    # Creux gauche (hole) avec fond terracotta
    draw.ellipse(
        [left - hole_radius * 0.9, center - hole_radius, left + hole_radius * 1.1, center + hole_radius],
        fill=bg_color
    )

    # Petit détail intérieur horloge / chrono au cœur de la pièce de puzzle
    # Pour rappeler la fonction de chronométrage
    timer_radius = scale * 0.16
    draw.ellipse(
        [center - timer_radius, center - timer_radius, center + timer_radius, center + timer_radius],
        outline=bg_color,
        width=max(2, int(size * 0.022))
    )
    # Aiguilles du chrono (10h10)
    line_w = max(2, int(size * 0.022))
    draw.line([center, center, center, center - timer_radius * 0.65], fill=bg_color, width=line_w)
    draw.line([center, center, center + timer_radius * 0.5, center], fill=bg_color, width=line_w)

    return img

def main():
    public_dir = os.path.join(os.path.dirname(__file__), "frontend", "public")
    os.makedirs(public_dir, exist_ok=True)

    sizes = [
        ("pwa-192x192.png", 192, False),
        ("pwa-512x512.png", 512, False),
        ("pwa-512x512-maskable.png", 512, True),
        ("apple-touch-icon.png", 180, False),
        ("favicon-32x32.png", 32, False),
    ]

    for filename, s, maskable in sizes:
        icon = create_puzzle_icon(s, is_maskable=maskable)
        dest = os.path.join(public_dir, filename)
        icon.save(dest, "PNG")
        print(f"Généré: {dest} ({s}x{s})")

    # Favicon ICO avec 16, 32, 48
    icon_32 = create_puzzle_icon(32)
    icon_32.save(os.path.join(public_dir, "favicon.ico"), format="ICO")
    print("Généré: favicon.ico")

    # SVG Vector Icon
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#BC5A36"/>
  <!-- Pièce centrale -->
  <path d="M 170 170 
           H 220 C 220 130 292 130 292 170 
           H 342 V 220 C 382 220 382 292 342 292 
           V 342 H 292 C 292 312 220 312 220 342 
           H 170 V 292 C 200 292 200 220 170 220 Z" 
        fill="#FBF7F0"/>
  <!-- Cadran chrono au centre -->
  <circle cx="256" cy="256" r="42" stroke="#BC5A36" stroke-width="12" fill="none"/>
  <line x1="256" y1="256" x2="256" y2="230" stroke="#BC5A36" stroke-width="12" stroke-linecap="round"/>
  <line x1="256" y1="256" x2="278" y2="256" stroke="#BC5A36" stroke-width="12" stroke-linecap="round"/>
</svg>'''
    with open(os.path.join(public_dir, "pwa-icon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Généré: pwa-icon.svg")

if __name__ == "__main__":
    main()
