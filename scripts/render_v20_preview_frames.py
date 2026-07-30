import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ROOT / "previews" / "v20_story_first_third"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
IMG_W, IMG_H = 5120, 2880
IMG_SCALE = 0.42
LON_MIN, LON_MAX = 14.0, 35.2
LAT_MIN, LAT_MAX = 38.2, 51.4
CENTER = (W / 2, H / 2)
ACTION_CENTER = (W / 2, 500)
MAP_ORIGIN = (
    CENTER[0] - (IMG_W * IMG_SCALE) / 2,
    CENTER[1] - (IMG_H * IMG_SCALE) / 2,
)

PLAN = {"FAR": 1.12, "MED": 1.75, "CLOSE": 2.45, "MACRO": 3.60}

COL = {
    "blue": (18, 78, 230, 255),
    "red": (205, 45, 32, 255),
    "gold": (245, 174, 47, 255),
    "cream": (245, 237, 207, 255),
    "black": (9, 9, 8, 232),
    "panel": (8, 15, 18, 216),
    "white": (255, 255, 255, 255),
    "romania": (201, 184, 105, 255),
    "ottoman": (171, 92, 74, 255),
    "serbia": (122, 150, 102, 255),
    "russia": (150, 138, 174, 255),
    "austro": (143, 133, 105, 255),
}

ROUTES = {
    "nevesinje_bosnia": [(18.11, 43.26), (17.75, 43.38), (17.50, 43.75), (18.42, 43.86)],
    "serbia_nis": [(20.45, 44.79), (21.05, 44.30), (21.60, 43.78), (21.90, 43.32)],
    "serbia_novi_pazar": [(20.45, 44.79), (20.62, 44.05), (20.52, 43.14)],
    "montenegro_herz": [(19.26, 42.44), (18.95, 42.77), (18.35, 43.05)],
    "info_europe": [(23.3, 42.7), (18.4, 48.2), (25.0, 48.2), (29.0, 46.2)],
    "bessarabia_danube": [(28.835, 47.010), (27.59, 47.16), (26.10, 44.43), (25.36, 43.65)],
    "lower_danube_demo": [(28.05, 45.43), (27.97, 45.27), (28.80, 45.17), (29.65, 45.12)],
    "zimnitsa_svishtov": [(25.367, 43.656), (25.358, 43.638), (25.350, 43.620)],
}

ZONES = {
    "autonomy_romania": [(22.2, 45.9), (25.8, 45.8), (27.9, 44.5), (27.6, 43.6), (24.9, 43.8), (22.3, 44.1)],
    "autonomy_serbia": [(19.1, 44.8), (21.1, 44.7), (21.2, 43.2), (19.7, 42.6), (18.8, 43.8)],
    "autonomy_montenegro": [(18.45, 43.0), (19.25, 42.85), (19.45, 42.30), (18.75, 42.15)],
    "ottoman_balkans_context": [(18.8, 43.2), (21.6, 43.4), (23.3, 42.9), (27.8, 43.2), (29.0, 41.1), (26.0, 40.7), (21.4, 41.3), (18.4, 42.1)],
    "bosnia_unrest": [(17.2, 44.4), (19.2, 44.3), (19.0, 43.0), (17.4, 42.9)],
    "bulgarian_april": [(23.7, 42.9), (25.3, 42.8), (25.2, 41.8), (23.6, 41.8)],
    "reform_bulgaria": [(23.0, 43.2), (26.6, 43.2), (27.2, 41.4), (23.2, 41.4)],
    "bosnia_austro_hint": [(17.1, 44.4), (19.1, 44.3), (18.8, 43.0), (17.4, 43.0)],
    "svishtov_bridgehead": [(25.28, 43.67), (25.44, 43.67), (25.49, 43.59), (25.32, 43.56)],
}

FRAMES = [
    {
        "name": "001_intro_1850s_overview",
        "focus": (24.4, 43.7),
        "plan": "FAR",
        "year": "1850-е",
        "subtitle": "В середине XIX века Османская империя всё ещё удерживает большую часть Балкан.",
        "zones": [("autonomy_romania", "blue"), ("autonomy_serbia", "blue"), ("autonomy_montenegro", "blue"), ("ottoman_balkans_context", "red")],
        "markers": [("Бухарест", 26.102, 44.426, "gold"), ("Белград", 20.448, 44.787, "gold"), ("София", 23.321, 42.697, "red"), ("Сараево", 18.414, 43.857, "red"), ("Константинополь", 28.978, 41.008, "gold")],
        "routes": [],
    },
    {
        "name": "002_bosnia_1875_unrest",
        "focus": (17.81, 43.56),
        "plan": "MED",
        "year": "1875",
        "subtitle": "В 1875 году восстание начинается в Герцеговине и быстро переходит на Боснию.",
        "zones": [("bosnia_unrest", "gold")],
        "markers": [("Невесинье", 18.11, 43.26, "gold"), ("Сараево", 18.414, 43.857, "red")],
        "routes": [("nevesinje_bosnia", "gold")],
        "icons": [("crossed_swords_gold.png", "nevesinje_bosnia", 0.45)],
    },
    {
        "name": "003_serbia_montenegro_1876",
        "focus": (20.4, 43.7),
        "plan": "MED",
        "year": "1876",
        "subtitle": "Сербия и Черногория поддерживают восставших и вступают в войну с Османской империей.",
        "zones": [("autonomy_serbia", "blue"), ("autonomy_montenegro", "blue")],
        "markers": [("Белград", 20.448, 44.787, "gold"), ("Ниш", 21.895, 43.321, "blue"), ("Нови-Пазар", 20.515, 43.140, "blue")],
        "routes": [("serbia_nis", "blue"), ("serbia_novi_pazar", "blue"), ("montenegro_herz", "blue")],
        "icons": [("cavalry_blue.png", "serbia_nis", 0.56)],
    },
    {
        "name": "004_bulgaria_april_uprising",
        "focus": (24.4, 42.35),
        "plan": "CLOSE",
        "year": "1876",
        "subtitle": "Весной 1876 года вспыхивает Болгарское восстание.",
        "zones": [("bulgarian_april", "gold")],
        "markers": [("Панагюриште", 24.183, 42.500, "gold"), ("Копривштица", 24.358, 42.633, "gold"), ("Перуштица", 24.550, 42.050, "red"), ("Батак", 24.218, 41.943, "red")],
        "routes": [],
        "rings": [(24.218, 41.943, "red"), (24.550, 42.050, "red")],
        "icons": [("crossed_swords_gold.png", [(24.2, 42.42)], 0.0), ("camp_gold.png", [(24.45, 42.12)], 0.0)],
    },
    {
        "name": "005_constantinople_conference",
        "focus": (26.1, 42.2),
        "plan": "FAR",
        "year": "1876",
        "subtitle": "В Константинополе великие державы предлагают реформы для христианских областей Балкан.",
        "zones": [("reform_bulgaria", "gold")],
        "markers": [("Константинополь", 28.978, 41.008, "gold"), ("София", 23.321, 42.697, "red")],
        "routes": [("info_europe", "gold")],
    },
    {
        "name": "006_russian_army_through_romania",
        "focus": (27.05, 45.35),
        "plan": "MED",
        "year": "1877",
        "subtitle": "Русские войска проходят через Румынию к Дунаю, готовя главную переправу.",
        "zones": [("bosnia_austro_hint", "gold")],
        "markers": [("Яссы", 27.590, 47.158, "blue"), ("Плоешти", 26.017, 44.944, "blue"), ("Бухарест", 26.102, 44.426, "gold")],
        "routes": [("bessarabia_danube", "blue")],
        "portrait": ("nikolai_nikolaevich_medallion.png", "bessarabia_danube", 0.70, "Николай Николаевич"),
    },
    {
        "name": "007_lower_danube_demonstration",
        "focus": (28.85, 45.27),
        "plan": "CLOSE",
        "year": "1877",
        "subtitle": "На нижнем Дунае демонстрационные действия отвлекают османское внимание.",
        "zones": [],
        "markers": [("Галац", 28.050, 45.435, "blue"), ("Брэила", 27.970, 45.269, "blue"), ("Дунай", 28.80, 45.18, "cream")],
        "routes": [("lower_danube_demo", "blue")],
        "icons": [("objective_flag_blue.png", "lower_danube_demo", 0.60)],
    },
    {
        "name": "008_zimnitsa_svishtov_crossing",
        "focus": (25.358, 43.638),
        "plan": "MACRO",
        "year": "1877",
        "subtitle": "Ночью у Зимницы и Свиштова начинается переход через Дунай и появляется первый плацдарм.",
        "zones": [("svishtov_bridgehead", "blue")],
        "markers": [("Зимница", 25.367, 43.656, "blue", -108, -34), ("Свиштов", 25.350, 43.620, "blue", 42, 38), ("Дунай", 25.355, 43.648, "cream", -4, -52)],
        "routes": [("zimnitsa_svishtov", "blue")],
        "portrait": ("nikolai_nikolaevich_medallion.png", "zimnitsa_svishtov", 0.70, "передовые части"),
        "icons": [("objective_flag_blue.png", "zimnitsa_svishtov", 0.50)],
    },
]


def load_font(size, bold=True):
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf") if bold else Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf") if bold else Path("C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


F_SUB = load_font(28)
F_YEAR = load_font(64)
F_LABEL = load_font(18)
F_SMALL = load_font(15)
F_LEGEND = load_font(19)


def merc_y(lat):
    r = math.radians(lat)
    return math.log(math.tan(math.pi / 4 + r / 2))


MERC_MIN = merc_y(LAT_MIN)
MERC_MAX = merc_y(LAT_MAX)


def base_xy(lon, lat):
    px = (lon - LON_MIN) / (LON_MAX - LON_MIN) * IMG_W
    py = (MERC_MAX - merc_y(lat)) / (MERC_MAX - MERC_MIN) * IMG_H
    return (MAP_ORIGIN[0] + px * IMG_SCALE, MAP_ORIGIN[1] + py * IMG_SCALE)


def route_point(route, frac):
    pts = [base_xy(*p) for p in route]
    lengths = []
    total = 0.0
    for a, b in zip(pts, pts[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        lengths.append(d)
        total += d
    if total <= 0:
        return pts[0]
    target = total * frac
    acc = 0.0
    for i, d in enumerate(lengths):
        if acc + d >= target:
            r = (target - acc) / d
            a, b = pts[i], pts[i + 1]
            return (a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r)
        acc += d
    return pts[-1]


def make_transform(focus_lon, focus_lat, plan):
    scale = PLAN[plan]
    focus = base_xy(focus_lon, focus_lat)
    rig_pos = (
        ACTION_CENTER[0] - (focus[0] - CENTER[0]) * scale,
        ACTION_CENTER[1] - (focus[1] - CENTER[1]) * scale,
    )
    map_left = rig_pos[0] + (MAP_ORIGIN[0] - CENTER[0]) * scale
    map_top = rig_pos[1] + (MAP_ORIGIN[1] - CENTER[1]) * scale
    map_right = map_left + IMG_W * IMG_SCALE * scale
    map_bottom = map_top + IMG_H * IMG_SCALE * scale
    if map_left > 0:
        rig_pos = (rig_pos[0] - map_left, rig_pos[1])
    if map_right < W:
        rig_pos = (rig_pos[0] + W - map_right, rig_pos[1])
    map_top = rig_pos[1] + (MAP_ORIGIN[1] - CENTER[1]) * scale
    map_bottom = map_top + IMG_H * IMG_SCALE * scale
    if map_top > 112:
        rig_pos = (rig_pos[0], rig_pos[1] - (map_top - 112))
    if map_bottom < H:
        rig_pos = (rig_pos[0], rig_pos[1] + H - map_bottom)

    def tx(point):
        return (
            rig_pos[0] + (point[0] - CENTER[0]) * scale,
            rig_pos[1] + (point[1] - CENTER[1]) * scale,
        )

    return scale, rig_pos, tx


def draw_text(draw, xy, value, font, fill, anchor="mm", stroke=3):
    draw.text(xy, value, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0, 160))


def alpha_poly(img, points, fill, outline=None, width=2):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.polygon(points, fill=fill)
    if outline:
        d.line(points + [points[0]], fill=outline, width=width, joint="curve")
    img.alpha_composite(overlay)


def paste_icon(img, path, center, size):
    if not path.exists():
        return
    icon = Image.open(path).convert("RGBA")
    icon.thumbnail((size, size), Image.Resampling.LANCZOS)
    x = int(center[0] - icon.width / 2)
    y = int(center[1] - icon.height / 2)
    img.alpha_composite(icon, (x, y))


def draw_route(draw, pts, color, width=5):
    draw.line(pts, fill=color, width=width, joint="curve")
    for x, y in pts:
        draw.ellipse((x - width, y - width, x + width, y + width), fill=color)


def draw_marker(draw, x, y, label, color, dx=20, dy=-18):
    c = COL[color]
    draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=c, outline=(10, 10, 10, 255), width=2)
    draw_text(draw, (x + dx, y + dy), label, F_LABEL, COL["cream"], anchor="lm", stroke=2)


def draw_legend(draw):
    x, y, w, h = 1586, 690, 290, 164
    draw.rectangle((x, y, x + w, y + h), fill=COL["panel"])
    rows = [
        ("romania", "Румыния"),
        ("ottoman", "Османская империя"),
        ("serbia", "Сербия / Черногория"),
        ("russia", "Российская империя"),
        ("austro", "Австро-Венгрия"),
    ]
    for i, (key, label) in enumerate(rows):
        yy = y + 24 + i * 27
        draw.rectangle((x + 18, yy - 10, x + 43, yy + 5), fill=COL[key])
        draw.text((x + 56, yy - 13), label, font=F_LEGEND, fill=COL["cream"])


def draw_ui(draw, frame):
    draw.rectangle((0, 0, W, 112), fill=COL["black"])
    draw_text(draw, (W / 2, 62), frame["subtitle"], F_SUB, COL["cream"], anchor="mm", stroke=2)
    draw.line((54, 124, 1866, 124), fill=COL["gold"], width=2)
    draw_text(draw, (72, 1008), frame["year"], F_YEAR, COL["gold"], anchor="lm", stroke=4)


def render_frame(frame):
    scale, rig_pos, tx = make_transform(*frame["focus"], frame["plan"])
    base = Image.open(ASSETS / "balkans_1880_real_boundaries_v9_overscan.png").convert("RGBA")
    scaled = base.resize((int(IMG_W * IMG_SCALE * scale), int(IMG_H * IMG_SCALE * scale)), Image.Resampling.LANCZOS)
    bg = Image.new("RGBA", (W, H), (6, 6, 5, 255))
    map_pos = (
        int(rig_pos[0] + (MAP_ORIGIN[0] - CENTER[0]) * scale),
        int(rig_pos[1] + (MAP_ORIGIN[1] - CENTER[1]) * scale),
    )
    bg.alpha_composite(scaled, map_pos)
    draw = ImageDraw.Draw(bg)

    for zone_name, color_key in frame.get("zones", []):
        pts = [tx(base_xy(*p)) for p in ZONES[zone_name]]
        fill = COL[color_key][:3] + (48,)
        outline = COL[color_key][:3] + (210,)
        alpha_poly(bg, pts, fill, outline, max(2, int(2 * scale)))
    draw = ImageDraw.Draw(bg)

    for route_name, color_key in frame.get("routes", []):
        pts = [tx(base_xy(*p)) for p in ROUTES[route_name]]
        draw_route(draw, pts, COL[color_key], max(4, int(4 * min(scale, 1.8))))

    for lon, lat, color_key in frame.get("rings", []):
        x, y = tx(base_xy(lon, lat))
        r = 38
        draw.ellipse((x - r, y - r, x + r, y + r), outline=COL[color_key], width=4)

    for marker in frame.get("markers", []):
        label, lon, lat, color_key = marker[:4]
        dx, dy = marker[4:] if len(marker) > 4 else (20, -18)
        x, y = tx(base_xy(lon, lat))
        draw_marker(draw, x, y, label, color_key, dx, dy)

    for icon_name, target, frac in frame.get("icons", []):
        if isinstance(target, str):
            center_base = route_point(ROUTES[target], frac)
        else:
            center_base = base_xy(*target[0])
        center = tx(center_base)
        paste_icon(bg, ASSETS / "tactical_icons" / icon_name, center, 70)

    if "portrait" in frame:
        icon_name, route_name, frac, label = frame["portrait"]
        center = tx(route_point(ROUTES[route_name], frac))
        paste_icon(bg, ASSETS / "portraits" / "medallions" / icon_name, center, 112)
        draw = ImageDraw.Draw(bg)
        draw_text(draw, (center[0], center[1] + 70), label, F_SMALL, COL["cream"], anchor="mm", stroke=2)

    draw = ImageDraw.Draw(bg)
    draw_legend(draw)
    draw_ui(draw, frame)

    out_path = OUT / f"{frame['name']}.png"
    bg.convert("RGB").save(out_path, quality=95)
    return out_path


def make_contact_sheet(paths):
    thumbs = []
    for p in paths:
        im = Image.open(p).convert("RGB")
        im.thumbnail((480, 270), Image.Resampling.LANCZOS)
        thumbs.append((p, im.copy()))
    sheet = Image.new("RGB", (960, 1080), (12, 12, 11))
    draw = ImageDraw.Draw(sheet)
    for idx, (p, im) in enumerate(thumbs):
        x = (idx % 2) * 480
        y = (idx // 2) * 270
        sheet.paste(im, (x, y))
        draw.text((x + 8, y + 8), p.stem, font=load_font(14, False), fill=(245, 237, 207))
    out = OUT / "v20_story_first_third_contact_sheet.jpg"
    sheet.save(out, quality=92)
    return out


def main():
    for old in OUT.glob("*.png"):
        old.unlink()
    paths = [render_frame(frame) for frame in FRAMES]
    contact = make_contact_sheet(paths)
    print("Rendered frames:")
    for p in paths:
        print(p)
    print("Contact sheet:")
    print(contact)


if __name__ == "__main__":
    main()
