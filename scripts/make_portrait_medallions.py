from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "portraits"
OUT = SRC / "medallions"
OUT.mkdir(parents=True, exist_ok=True)

PEOPLE = [
    ("nikolai_nikolaevich", "Николай Николаевич"),
    ("iosif_gurko", "Иосиф Гурко"),
    ("mikhail_skobelev", "Михаил Скобелев"),
    ("osman_pasha", "Осман-паша"),
    ("carol_i", "Кароль I"),
]

SIZE = 384
INNER = 322
GOLD = (225, 164, 55, 255)
DARK_GOLD = (97, 65, 22, 255)


def cover_square(img):
    img = ImageOps.exif_transpose(img).convert("RGBA")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    return img.resize((INNER, INNER), Image.LANCZOS)


def medallion(slug):
    src = SRC / f"{slug}.png"
    img = cover_square(Image.open(src))

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((31, 36, SIZE - 31, SIZE - 26), fill=(0, 0, 0, 95))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(shadow)

    outer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    od = ImageDraw.Draw(outer)
    od.ellipse((21, 21, SIZE - 21, SIZE - 21), fill=DARK_GOLD)
    od.ellipse((27, 27, SIZE - 27, SIZE - 27), fill=GOLD)
    od.ellipse((42, 42, SIZE - 42, SIZE - 42), fill=(26, 24, 20, 255))
    canvas.alpha_composite(outer)

    mask = Image.new("L", (INNER, INNER), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, INNER - 1, INNER - 1), fill=255)
    portrait_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    portrait_layer.paste(img, ((SIZE - INNER) // 2, (SIZE - INNER) // 2), mask)
    canvas.alpha_composite(portrait_layer)

    gloss = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.pieslice((48, 30, SIZE - 48, SIZE - 58), 200, 340, fill=(255, 255, 255, 34))
    gloss = gloss.filter(ImageFilter.GaussianBlur(8))
    canvas.alpha_composite(gloss)

    out = OUT / f"{slug}_medallion.png"
    canvas.save(out)
    return out


def make_contact_sheet(paths):
    tile_w, tile_h = SIZE, SIZE + 74
    sheet = Image.new("RGBA", (tile_w * len(paths), tile_h), (245, 241, 231, 255))
    draw = ImageDraw.Draw(sheet)
    for i, (slug, label, path) in enumerate(paths):
        x = i * tile_w
        sheet.alpha_composite(Image.open(path).convert("RGBA"), (x, 0))
        draw.text((x + 22, SIZE + 22), label, fill=(40, 34, 25))
    sheet.convert("RGB").save(SRC / "medallions_contact_sheet.jpg", quality=92)


def main():
    made = []
    for slug, label in PEOPLE:
        out = medallion(slug)
        made.append((slug, label, out))
        print(out)
    make_contact_sheet(made)


if __name__ == "__main__":
    main()
