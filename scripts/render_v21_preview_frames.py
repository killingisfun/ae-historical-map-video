import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ROOT / "previews" / "v21_reference_style"
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
    "blue": (25, 88, 235, 255),
    "red": (220, 48, 36, 255),
    "gold": (246, 177, 46, 255),
    "cream": (246, 238, 210, 255),
    "black": (8, 8, 7, 235),
    "panel": (8, 15, 18, 218),
    "romania": (201, 184, 105, 255),
    "ottoman": (171, 92, 74, 255),
    "serbia": (122, 150, 102, 255),
    "russia": (150, 138, 174, 255),
    "austro": (143, 133, 105, 255),
}

ROUTES = {
    "nevesinje_bosnia": [(18.11, 43.26), (17.95, 43.47), (18.42, 43.86)],
    "serbia_nis": [(20.45, 44.79), (21.05, 44.30), (21.60, 43.78), (21.90, 43.32)],
    "serbia_novi_pazar": [(20.45, 44.79), (20.62, 44.05), (20.52, 43.14)],
    "montenegro_herz": [(19.26, 42.44), (18.95, 42.77), (18.35, 43.05)],
    "osman_counter_serbia": [(21.90, 43.32), (21.55, 43.70), (21.05, 44.18)],
    "europe_reaction": [(24.22, 41.94), (22.5, 44.6), (18.4, 48.2), (16.37, 48.21)],
    "conference": [(16.37, 48.21), (22.0, 45.0), (28.978, 41.008)],
    "rejected_reforms": [(28.978, 41.008), (26.3, 42.0), (24.4, 42.3)],
    "bessarabia_danube": [(28.835, 47.010), (27.59, 47.16), (26.10, 44.43), (25.36, 43.65)],
    "lower_danube_demo": [(28.05, 45.43), (27.97, 45.27), (28.80, 45.17), (29.65, 45.12)],
    "zimnitsa_svishtov": [(25.367, 43.656), (25.358, 43.638), (25.350, 43.620)],
}

FRAMES = [
    {
        "name": "001_intro_clear_political_context",
        "focus": (24.4, 43.7),
        "plan": "FAR",
        "year": "1850-е",
        "subtitle": "В середине XIX века Османская империя всё ещё удерживает большую часть Балкан.",
        "markers": [("Бухарест", 26.102, 44.426, "gold"), ("Белград", 20.448, 44.787, "gold"), ("София", 23.321, 42.697, "red"), ("Сараево", 18.414, 43.857, "red"), ("Константинополь", 28.978, 41.008, "gold")],
        "callouts": [("АВТОНОМИИ", "Румыния, Сербия, Черногория", 22.8, 44.3, "blue", -10, -120)],
        "badges": [("середина XIX", 24.2, 42.7, 0, 72)],
    },
    {
        "name": "002_herzegovina_bosnia_uprising",
        "focus": (18.05, 43.56),
        "plan": "MED",
        "year": "1875",
        "subtitle": "В 1875 году восстание начинается в Герцеговине и быстро переходит на Боснию.",
        "clusters": [("Невесинье", 18.11, 43.26, "gold"), ("Босния", 18.42, 43.86, "gold")],
        "routes": [("nevesinje_bosnia", "gold", "распространение восстания", 0.56)],
        "icons": [("crossed_swords_gold.png", "nevesinje_bosnia", 0.28)],
        "badges": [("1875", 18.3, 43.65, -88, 70)],
    },
    {
        "name": "003_serbia_montenegro_enter_war",
        "focus": (20.4, 43.7),
        "plan": "MED",
        "year": "1876",
        "subtitle": "Сербия и Черногория поддерживают восставших и вступают в войну с Османской империей.",
        "markers": [("Белград", 20.448, 44.787, "gold"), ("Ниш", 21.895, 43.321, "blue"), ("Нови-Пазар", 20.515, 43.140, "blue")],
        "routes": [("serbia_nis", "blue", "сербское наступление", 0.55), ("serbia_novi_pazar", "blue", "на Нови-Пазар", 0.55), ("montenegro_herz", "blue", "поддержка Герцеговины", 0.55)],
        "icons": [("cavalry_blue.png", "serbia_nis", 0.56)],
    },
    {
        "name": "004_serbian_defeat_counterpressure",
        "focus": (21.1, 43.75),
        "plan": "MED",
        "year": "1876",
        "subtitle": "Сербская армия терпит поражение, и перемирие становится возможным только после ультиматума России.",
        "markers": [("Ниш", 21.895, 43.321, "blue"), ("Сербия", 20.9, 44.0, "cream")],
        "routes": [("osman_counter_serbia", "red", "османское давление", 0.45)],
        "icons": [("cannon_red.png", "osman_counter_serbia", 0.44)],
    },
    {
        "name": "005_bulgarian_april_uprising",
        "focus": (24.4, 42.35),
        "plan": "CLOSE",
        "year": "1876",
        "subtitle": "Весной 1876 года вспыхивает Болгарское восстание.",
        "clusters": [("Панагюриште", 24.183, 42.500, "gold"), ("Копривштица", 24.358, 42.633, "gold"), ("Перуштица", 24.550, 42.050, "red"), ("Батак", 24.218, 41.943, "red")],
        "callouts": [("АПРЕЛЬСКОЕ ВОССТАНИЕ", "очаги в Средногорье", 24.34, 42.28, "gold", 0, -118)],
        "rings": [(24.218, 41.943, "red"), (24.550, 42.050, "red")],
    },
    {
        "name": "006_europe_reaction",
        "focus": (21.2, 45.0),
        "plan": "FAR",
        "year": "1876",
        "subtitle": "Сообщения о карательных операциях расходятся по Европе и превращают кризис в международный.",
        "clusters": [("Батак", 24.218, 41.943, "red")],
        "routes": [("europe_reaction", "gold", "резонанс в Европе", 0.62)],
        "callouts": [("ЕВРОПЕЙСКАЯ ПРЕССА", "сообщения о репрессиях", 16.37, 48.21, "gold", 120, 50)],
    },
    {
        "name": "007_constantinople_conference",
        "focus": (26.1, 42.2),
        "plan": "FAR",
        "year": "1876",
        "subtitle": "В Константинополе великие державы предлагают реформы для христианских областей Балкан.",
        "markers": [("Константинополь", 28.978, 41.008, "gold"), ("София", 23.321, 42.697, "red")],
        "routes": [("conference", "gold", "дипломатическая линия", 0.68), ("rejected_reforms", "red", "отказ Порты", 0.45)],
        "callouts": [("КОНФЕРЕНЦИЯ", "проекты реформ", 28.978, 41.008, "gold", -170, -102)],
    },
    {
        "name": "008_russian_army_to_danube",
        "focus": (27.05, 45.35),
        "plan": "MED",
        "year": "1877",
        "subtitle": "Русские войска проходят через Румынию к Дунаю, готовя главную переправу.",
        "markers": [("Яссы", 27.590, 47.158, "blue"), ("Плоешти", 26.017, 44.944, "blue"), ("Бухарест", 26.102, 44.426, "gold")],
        "routes": [("bessarabia_danube", "blue", "проход через Румынию", 0.52)],
        "portrait": ("nikolai_nikolaevich_medallion.png", "bessarabia_danube", 0.70, "Николай Николаевич"),
    },
    {
        "name": "009_zimnitsa_svishtov_crossing",
        "focus": (25.358, 43.638),
        "plan": "MACRO",
        "year": "1877",
        "subtitle": "Ночью у Зимницы и Свиштова начинается переход через Дунай и появляется первый плацдарм.",
        "clusters": [("плацдарм", 25.350, 43.620, "blue")],
        "markers": [("Зимница", 25.367, 43.656, "blue", -108, -34), ("Свиштов", 25.350, 43.620, "blue", 42, 38), ("Дунай", 25.355, 43.648, "cream", -4, -52)],
        "routes": [("zimnitsa_svishtov", "blue", "ночная переправа", 0.45)],
        "portrait": ("nikolai_nikolaevich_medallion.png", "zimnitsa_svishtov", 0.70, "передовые части"),
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
F_CALLOUT = load_font(17)


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
    draw.text(xy, value, font=font, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(0, 0, 0, 175))


def paste_icon(img, path, center, size):
    if not path.exists():
        return
    icon = Image.open(path).convert("RGBA")
    icon.thumbnail((size, size), Image.Resampling.LANCZOS)
    img.alpha_composite(icon, (int(center[0] - icon.width / 2), int(center[1] - icon.height / 2)))


def draw_route(draw, pts, color, width=5):
    draw.line(pts, fill=COL["cream"][:3] + (105,), width=width + 5, joint="curve")
    draw.line(pts, fill=color, width=width, joint="curve")
    for x, y in pts:
        draw.ellipse((x - width, y - width, x + width, y + width), fill=color)


def draw_marker(draw, x, y, label, color, dx=20, dy=-18):
    c = COL[color]
    draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=c, outline=(10, 10, 10, 255), width=2)
    draw_text(draw, (x + dx, y + dy), label, F_LABEL, COL["cream"], anchor="lm", stroke=2)


def draw_cluster(draw, x, y, label, color_key, dx=26, dy=-22):
    c = COL[color_key]
    w, h = 92, 54
    poly = [(x - w / 2, y), (x - w / 4, y - h / 2), (x + w / 4, y - h / 2), (x + w / 2, y), (x + w / 4, y + h / 2), (x - w / 4, y + h / 2)]
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.polygon(poly, fill=c[:3] + (42,), outline=c[:3] + (230,))
    for i in range(-2, 3):
        od.line((x - 28 + i * 16, y + 22, x + 2 + i * 16, y - 22), fill=c[:3] + (210,), width=2)
    od.ellipse((x - 6, y - 6, x + 6, y + 6), fill=c, outline=COL["cream"], width=2)
    return overlay, (x + dx, y + dy, label)


def draw_callout(draw, x, y, title, body, color_key, dx, dy):
    cx, cy = x + dx, y + dy
    w, h = 300, 78
    draw.rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), fill=COL["panel"], outline=COL[color_key], width=2)
    draw_text(draw, (cx, cy - 10), title, F_CALLOUT, COL["gold"], anchor="mm", stroke=2)
    draw_text(draw, (cx, cy + 20), body, F_SMALL, COL["cream"], anchor="mm", stroke=1)


def draw_badge(draw, x, y, value, dx, dy):
    cx, cy = x + dx, y + dy
    draw.rectangle((cx - 56, cy - 18, cx + 56, cy + 18), fill=COL["panel"], outline=COL["gold"], width=2)
    draw_text(draw, (cx, cy + 1), value, F_SMALL, COL["gold"], anchor="mm", stroke=1)


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

    for route_name, color_key, label, frac in frame.get("routes", []):
        route = ROUTES[route_name]
        pts = [tx(base_xy(*p)) for p in route]
        draw_route(draw, pts, COL[color_key], max(4, int(4 * min(scale, 1.8))))
        lx, ly = tx(route_point(route, frac))
        draw_text(draw, (lx, ly - 34), label, F_SMALL, COL[color_key], anchor="mm", stroke=2)

    for label, lon, lat, color_key in frame.get("clusters", []):
        x, y = tx(base_xy(lon, lat))
        overlay, text_info = draw_cluster(draw, x, y, label, color_key)
        bg.alpha_composite(overlay)
        draw = ImageDraw.Draw(bg)
        txs, tys, txt = text_info
        draw_text(draw, (txs, tys), txt, F_LABEL, COL["cream"], anchor="lm", stroke=2)

    for lon, lat, color_key in frame.get("rings", []):
        x, y = tx(base_xy(lon, lat))
        r = 38
        draw.ellipse((x - r, y - r, x + r, y + r), outline=COL[color_key], width=4)

    for marker in frame.get("markers", []):
        label, lon, lat, color_key = marker[:4]
        dx, dy = marker[4:] if len(marker) > 4 else (20, -18)
        x, y = tx(base_xy(lon, lat))
        draw_marker(draw, x, y, label, color_key, dx, dy)

    for icon_name, route_name, frac in frame.get("icons", []):
        center = tx(route_point(ROUTES[route_name], frac))
        paste_icon(bg, ASSETS / "tactical_icons" / icon_name, center, 78)

    if "portrait" in frame:
        icon_name, route_name, frac, label = frame["portrait"]
        center = tx(route_point(ROUTES[route_name], frac))
        paste_icon(bg, ASSETS / "portraits" / "medallions" / icon_name, center, 112)
        draw = ImageDraw.Draw(bg)
        draw_text(draw, (center[0], center[1] + 70), label, F_SMALL, COL["cream"], anchor="mm", stroke=2)

    for title, body, lon, lat, color_key, dx, dy in frame.get("callouts", []):
        x, y = tx(base_xy(lon, lat))
        draw_callout(draw, x, y, title, body, color_key, dx, dy)

    for value, lon, lat, dx, dy in frame.get("badges", []):
        x, y = tx(base_xy(lon, lat))
        draw_badge(draw, x, y, value, dx, dy)

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
    sheet = Image.new("RGB", (1440, 810), (12, 12, 11))
    for idx, (p, im) in enumerate(thumbs):
        x = (idx % 3) * 480
        y = (idx // 3) * 270
        sheet.paste(im, (x, y))
    out = OUT / "v21_reference_style_contact_sheet.jpg"
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
