#!/usr/bin/env python3
"""Demó 360°-os placeholder képeket generál a data/locations.json alapján.

Csak a beépített demó adatokhoz kell -- ha a felhasználó saját valódi 360°-os
képeket tesz a helyükre, ez a szkript többé nem szükséges.
"""
import json
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, "data", "locations.json")
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

SCENE_W, SCENE_H = 2048, 1024
REVEAL_W, REVEAL_H = 1600, 1000

# location id -> (sky_top, sky_bottom/horizon, ground_near, ground_far, silhouette)
PALETTES = {
    "loc01": ((60, 110, 170), (190, 215, 230), (235, 240, 245), (170, 185, 195), (90, 105, 120)),   # Bernina - havas Alpok
    "loc02": ((40, 80, 130), (150, 190, 210), (60, 95, 80), (40, 70, 60), (35, 55, 65)),             # Flåm - fjord
    "loc03": ((70, 120, 150), (200, 210, 190), (110, 140, 90), (70, 100, 65), (60, 80, 70)),         # Semmering - zöld hegyek
    "loc04": ((55, 100, 165), (200, 220, 235), (225, 230, 235), (160, 175, 190), (80, 95, 110)),     # Albula - havas
    "loc05": ((65, 115, 155), (205, 215, 200), (100, 130, 95), (65, 95, 70), (55, 75, 65)),          # Tauern
    "loc06": ((50, 95, 160), (210, 222, 232), (230, 233, 238), (165, 178, 192), (75, 90, 105)),      # Tátra - havas
    "loc07": ((90, 140, 190), (215, 225, 205), (95, 135, 80), (60, 95, 60), (70, 95, 70)),           # Gyermekvasút - erdő
    "loc08": ((60, 100, 130), (190, 205, 190), (60, 90, 60), (35, 60, 40), (30, 45, 35)),            # Fekete-erdő
    "loc09": ((95, 145, 195), (220, 225, 205), (150, 150, 120), (110, 105, 85), (90, 90, 80)),       # La Mure - sziklás
    "loc10": ((80, 150, 200), (225, 230, 215), (210, 190, 150), (170, 140, 110), (120, 110, 100)),   # Cinque Terre - part
}


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vertical_gradient(w, h, top, bottom):
    top_arr = np.array(top, dtype=np.float32)
    bottom_arr = np.array(bottom, dtype=np.float32)
    t = np.linspace(0, 1, h).reshape(h, 1, 1)
    row = top_arr.reshape(1, 1, 3) * (1 - t) + bottom_arr.reshape(1, 1, 3) * t
    arr = np.repeat(row, w, axis=1).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def draw_mountains(draw, w, horizon_y, height_ratio, color, seed_offset, layer_alpha_img=None):
    rng = np.random.default_rng(seed_offset)
    points = [(0, horizon_y)]
    n = 14
    for i in range(n + 1):
        x = w * i / n
        peak = horizon_y - height_ratio * (0.3 + 0.7 * rng.random())
        points.append((x, peak))
    points.append((w, horizon_y))
    draw.polygon(points, fill=color)


def draw_rail_track(draw, w, h, horizon_y, vanish_x_ratio, color=(40, 40, 40)):
    vanish_x = w * vanish_x_ratio
    vanish_y = horizon_y + 6
    left_bottom = (vanish_x - w * 0.42, h)
    right_bottom = (vanish_x + w * 0.42, h)
    draw.line([left_bottom, (vanish_x, vanish_y)], fill=color, width=6)
    draw.line([right_bottom, (vanish_x, vanish_y)], fill=color, width=6)
    # talpfák (sleepers)
    for i in range(1, 11):
        t = i / 11
        y = h - (h - vanish_y) * t
        span = (1 - t)
        lx = vanish_x - w * 0.42 * span
        rx = vanish_x + w * 0.42 * span
        draw.line([(lx, y), (rx, y)], fill=color, width=max(2, int(5 * (1 - t))))


def watermark(img, text, font_path=FONT_REG, size=26):
    draw = ImageDraw.Draw(img, "RGBA")
    font = ImageFont.truetype(font_path, size)
    w, h = img.size
    for x_ratio in (0.06, 0.56):
        x = int(w * x_ratio)
        y = h - 64
        draw.text((x, y), text, font=font, fill=(255, 255, 255, 170))
        draw.text((x, y + size + 6), "cseréld le saját 360°-os képre", font=font, fill=(255, 255, 255, 140))


def make_scene(loc_id, index, name_hint):
    sky_top, sky_bottom, ground_near, ground_far, silhouette = PALETTES[loc_id]
    horizon_y = int(SCENE_H * 0.5)

    img = vertical_gradient(SCENE_W, horizon_y + 1, sky_top, sky_bottom)
    ground = vertical_gradient(SCENE_W, SCENE_H - horizon_y, ground_far, ground_near)
    canvas = Image.new("RGB", (SCENE_W, SCENE_H))
    canvas.paste(img, (0, 0))
    canvas.paste(ground, (0, horizon_y))

    draw = ImageDraw.Draw(canvas)
    seed = abs(hash(loc_id)) % 1000
    draw_mountains(draw, SCENE_W, horizon_y, SCENE_H * 0.16, silhouette, seed + index)
    vanish_ratio = 0.5 + (index - 1) * 0.015
    draw_rail_track(draw, SCENE_W, SCENE_H, horizon_y, vanish_ratio)

    watermark(canvas, f"DEMÓ PANORÁMA {index}/3")
    return canvas


def make_reveal(loc_id, name, country):
    sky_top, sky_bottom, ground_near, ground_far, silhouette = PALETTES[loc_id]
    horizon_y = int(REVEAL_H * 0.55)
    img = vertical_gradient(REVEAL_W, horizon_y + 1, sky_top, sky_bottom)
    ground = vertical_gradient(REVEAL_W, REVEAL_H - horizon_y, ground_far, ground_near)
    canvas = Image.new("RGB", (REVEAL_W, REVEAL_H))
    canvas.paste(img, (0, 0))
    canvas.paste(ground, (0, horizon_y))

    draw = ImageDraw.Draw(canvas, "RGBA")
    draw_mountains(draw, REVEAL_W, horizon_y, REVEAL_H * 0.22, silhouette, abs(hash(loc_id)) % 1000)
    draw_rail_track(draw, REVEAL_W, REVEAL_H, horizon_y, 0.5, color=(50, 40, 35))

    # sötétítő sáv a szöveg alá
    overlay = Image.new("RGBA", (REVEAL_W, 230), (10, 12, 16, 150))
    canvas.paste(Image.alpha_composite(canvas.crop((0, REVEAL_H - 230, REVEAL_W, REVEAL_H)).convert("RGBA"), overlay).convert("RGB"), (0, REVEAL_H - 230))

    draw = ImageDraw.Draw(canvas, "RGBA")
    title_font = ImageFont.truetype(FONT_BOLD, 64)
    sub_font = ImageFont.truetype(FONT_REG, 38)
    cap_font = ImageFont.truetype(FONT_REG, 24)

    title = name
    tb = draw.textbbox((0, 0), title, font=title_font)
    draw.text(((REVEAL_W - (tb[2] - tb[0])) / 2, REVEAL_H - 210), title, font=title_font, fill=(255, 255, 255, 255))

    sub = country
    sb = draw.textbbox((0, 0), sub, font=sub_font)
    draw.text(((REVEAL_W - (sb[2] - sb[0])) / 2, REVEAL_H - 130), sub, font=sub_font, fill=(230, 200, 120, 255))

    cap = "Demó megoldás-kép — cseréld le a helyszínt bemutató valódi fotóra"
    cb = draw.textbbox((0, 0), cap, font=cap_font)
    draw.text(((REVEAL_W - (cb[2] - cb[0])) / 2, REVEAL_H - 58), cap, font=cap_font, fill=(255, 255, 255, 190))

    return canvas


def main():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        locations = json.load(f)

    for loc in locations:
        loc_id = loc["id"]
        out_dir = os.path.join(ROOT, "assets", "locations", loc_id)
        os.makedirs(out_dir, exist_ok=True)
        for i in range(1, 4):
            scene = make_scene(loc_id, i, loc["name"])
            scene.save(os.path.join(out_dir, f"scene{i}.jpg"), quality=82)
        reveal = make_reveal(loc_id, loc["name"], loc["country"])
        reveal.save(os.path.join(out_dir, "reveal.jpg"), quality=88)
        print(f"OK {loc_id} -> {out_dir}")


if __name__ == "__main__":
    main()
