import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ROOT / "previews" / "v15"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
IMG_W, IMG_H = 5120, 2880
IMG_SCALE = 0.42
LON_MIN, LON_MAX = 14.0, 35.2
LAT_MIN, LAT_MAX = 38.2, 51.4
CENTER = (W / 2, H / 2)
ACTION_CENTER = (W / 2, 500)
PLAN = {"FAR": 1.12, "MED": 1.75, "CLOSE": 2.45, "MACRO": 3.60}

COL = {
    "blue": (30, 91, 255, 255),
    "red": (213, 37, 26, 255),
    "gold": (226, 164, 55, 255),
    "cream": (243, 232, 201, 255),
    "black": (8, 8, 7, 230),
}

ROUTES = {
    "kishinev": [(28.835, 47.010), (28.32, 47.10), (27.795, 47.209)],
    "crossing": [(25.367, 43.656), (25.358, 43.638), (25.350, 43.620)],
    "nikopol": [(25.350, 43.620), (25.16, 43.67), (24.900, 43.700)],
    "shipka": [(25.350, 43.620), (25.55, 43.28), (25.636, 43.075), (25.47, 42.91), (25.320, 42.750)],
    "plevna": [(22.872, 43.996), (23.48, 43.78), (24.617, 43.417)],
}


def font(size):
    for p in [
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]:
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


F_TITLE = font(38)
F_BODY = font(22)
F_LABEL = font(18)


def merc_y(lat):
    r = math.radians(lat)
    return math.log(math.tan(math.pi / 4 + r / 2))


MERC_MIN = merc_y(LAT_MIN)
MERC_MAX = merc_y(LAT_MAX)


def xy(lon, lat):
    px = (lon - LON_MIN) / (LON_MAX - LON_MIN) * IMG_W
    py = (MERC_MAX - merc_y(lat)) / (MERC_MAX - MERC_MIN) * IMG_H
    return (px * IMG_SCALE, py * IMG_SCALE)


def route_focus(coords):
    lons = [p[0] for p in coords]
    lats = [p[1] for p in coords]
    return ((min(lons) + max(lons)) / 2, (min(lats) + max(lats)) / 2)


def camera_for(lon, lat, scale):
    p = xy(lon, lat)
    return (
        ACTION_CENTER[0] - (p[0] - CENTER[0]) * scale,
        ACTION_CENTER[1] - (p[1] - CENTER[1]) * scale,
    )


def local_to_screen(local, rig_pos, scale):
    return (
        rig_pos[0] + (local[0] - CENTER[0]) * scale,
        rig_pos[1] + (local[1] - CENTER[1]) * scale,
    )


def geo_to_screen(lon, lat, rig_pos, scale):
    return local_to_screen(xy(lon, lat), rig_pos, scale)


def draw_text(draw, xypos, text, fill, fnt, anchor="mm"):
    x, y = xypos
    draw.text((x + 2, y + 2), text, font=fnt, fill=(0, 0, 0, 180), anchor=anchor)
    draw.text((x, y), text, font=fnt, fill=fill, anchor=anchor)


def paste_asset(canvas, path, xypos, size):
    img = Image.open(path).convert("RGBA")
    img.thumbnail((size, size), Image.LANCZOS)
    x = int(xypos[0] - img.width / 2)
    y = int(xypos[1] - img.height / 2)
    canvas.alpha_composite(img, (x, y))


def draw_scene(name, title, body, focus_route, scale_name, route_color, portraits, icons, active_route=None):
    base = Image.open(ASSETS / "balkans_1880_real_boundaries_v9_overscan.png").convert("RGB")
    focus = route_focus(focus_route)
    scale = PLAN[scale_name]
    rig = camera_for(focus[0], focus[1], scale)

    src_cx = (CENTER[0] + (W / 2 - rig[0]) / scale) / IMG_SCALE
    src_cy = (CENTER[1] + (H / 2 - rig[1]) / scale) / IMG_SCALE
    src_w = W / (scale * IMG_SCALE)
    src_h = H / (scale * IMG_SCALE)
    box = (
        int(src_cx - src_w / 2),
        int(src_cy - src_h / 2),
        int(src_cx + src_w / 2),
        int(src_cy + src_h / 2),
    )
    frame = base.crop(box).resize((W, H), Image.Resampling.BICUBIC).convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    d.rectangle((0, 0, W, 150), fill=(8, 8, 7, 215))
    d.rectangle((0, 930, W, H), fill=(8, 8, 7, 190))
    draw_text(d, (W / 2, 58), title, COL["gold"], F_TITLE)
    draw_text(d, (W / 2, 106), body, COL["cream"], F_BODY)

    if active_route:
        pts = [geo_to_screen(lon, lat, rig, scale) for lon, lat in active_route]
        d.line(pts, fill=route_color, width=8, joint="curve")
        for p in pts:
            d.ellipse((p[0] - 7, p[1] - 7, p[0] + 7, p[1] + 7), fill=route_color, outline=COL["cream"], width=2)

    for slug, lon, lat, dx, dy in portraits:
        pos = geo_to_screen(lon, lat, rig, scale)
        paste_asset(overlay, ASSETS / "portraits" / "medallions" / f"{slug}_medallion.png", (pos[0] + dx, pos[1] + dy), 118)

    for file_name, lon, lat, dx, dy in icons:
        pos = geo_to_screen(lon, lat, rig, scale)
        paste_asset(overlay, ASSETS / "tactical_icons" / file_name, (pos[0] + dx, pos[1] + dy), 58)

    # Compact legend outside the action center.
    d.rectangle((1395, 688, 1855, 930), fill=(9, 24, 29, 220), outline=COL["gold"], width=2)
    draw_text(d, (1422, 722), "ЛЕГЕНДА", COL["gold"], F_LABEL, anchor="lm")
    d.line((1420, 790, 1510, 790), fill=COL["blue"], width=5)
    draw_text(d, (1530, 790), "русское движение", COL["cream"], F_LABEL, anchor="lm")
    d.line((1420, 830, 1510, 830), fill=COL["red"], width=5)
    draw_text(d, (1530, 830), "османское движение", COL["cream"], F_LABEL, anchor="lm")
    paste_asset(overlay, ASSETS / "tactical_icons" / "cavalry_gold.png", (1448, 880), 42)
    draw_text(d, (1490, 880), "род войск / роль", COL["cream"], F_LABEL, anchor="lm")

    frame.alpha_composite(overlay)
    out = OUT / f"{name}.jpg"
    frame.convert("RGB").save(out, quality=92)
    print(out)


def main():
    draw_scene(
        "01_kishinev_ungheny",
        "КИШИНЁВ -> УНГЕНЫ",
        "24 апреля 1877: движение к переправам через Прут.",
        ROUTES["kishinev"],
        "CLOSE",
        COL["blue"],
        [("nikolai_nikolaevich", 28.32, 47.10, 0, -95)],
        [("cavalry_blue.png", 28.32, 47.10, -30, 42)],
        ROUTES["kishinev"],
    )
    draw_scene(
        "02_zimnitsa_svishtov",
        "ЗИМНИЦА -> СВИШТОВ",
        "27-28 июня 1877: короткая переправа через Дунай показана крупным планом.",
        ROUTES["crossing"],
        "MACRO",
        COL["blue"],
        [("carol_i", 25.362, 43.644, -95, -74)],
        [("objective_flag_blue.png", 25.358, 43.638, 56, -14)],
        ROUTES["crossing"],
    )
    draw_scene(
        "03_shipka_gurko",
        "СВИШТОВ -> ТЫРНОВО -> ШИПКА",
        "Июль 1877: передовой отряд выходит к Балканским проходам.",
        ROUTES["shipka"],
        "CLOSE",
        COL["blue"],
        [("iosif_gurko", 25.50, 43.02, 90, -86)],
        [("cavalry_blue.png", 25.47, 42.91, -64, -38), ("hill_fort_gold.png", 25.32, 42.75, 52, 18)],
        ROUTES["shipka"],
    )
    draw_scene(
        "04_vidin_plevna",
        "ВИДИН -> ПЛЕВНА",
        "Июль 1877: Осман-паша занимает Плевну.",
        ROUTES["plevna"],
        "MED",
        COL["red"],
        [("osman_pasha", 23.48, 43.78, 18, -104)],
        [("cannon_red.png", 23.48, 43.78, -52, 42)],
        ROUTES["plevna"],
    )
    draw_scene(
        "05_plevna_siege",
        "ПЛЕВНА: ОСАДА",
        "Июль-декабрь 1877: стрелки убраны; остаётся ключевой узел кампании.",
        [(24.617, 43.417)],
        "CLOSE",
        COL["gold"],
        [("osman_pasha", 24.617, 43.417, -118, -92), ("mikhail_skobelev", 24.617, 43.417, 124, -92)],
        [("fort_gold.png", 24.617, 43.417, 0, 58), ("crossed_swords_gold.png", 24.617, 43.417, 0, -58)],
        None,
    )


if __name__ == "__main__":
    main()
