#!/usr/bin/env python3
"""Generate simple brand icon assets for 회비영."""

import os
import struct
import zlib

BLUE = (32, 80, 255, 255)
DEEP_BLUE = (32, 70, 220, 255)
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)
BLACK = (30, 30, 30, 255)

def make_canvas(width: int, height: int, color: tuple[int, int, int, int]) -> bytearray:
    r, g, b, a = color
    return bytearray([component for _ in range(width * height) for component in (r, g, b, a)])


def set_pixel(buf: bytearray, width: int, height: int, x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if not (0 <= x < width and 0 <= y < height):
        return
    idx = (y * width + x) * 4
    buf[idx:idx + 4] = bytes(color)


def fill_rect(buf: bytearray, width: int, height: int, x0: int, y0: int, x1: int, y1: int,
              color: tuple[int, int, int, int]) -> None:
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    x0 = max(0, min(width, x0))
    x1 = max(0, min(width, x1))
    y0 = max(0, min(height, y0))
    y1 = max(0, min(height, y1))
    r, g, b, a = color
    for y in range(y0, y1):
        row_idx = (y * width + x0) * 4
        for x in range(x0, x1):
            buf[row_idx:row_idx + 4] = bytes((r, g, b, a))
            row_idx += 4


def draw_ring(buf: bytearray, width: int, height: int, cx: int, cy: int, outer_r: int, inner_r: int,
              color: tuple[int, int, int, int]) -> None:
    outer_sq = outer_r * outer_r
    inner_sq = inner_r * inner_r
    for y in range(cy - outer_r, cy + outer_r + 1):
        for x in range(cx - outer_r, cx + outer_r + 1):
            dx = x - cx + 0.5
            dy = y - cy + 0.5
            dist_sq = dx * dx + dy * dy
            if inner_sq <= dist_sq <= outer_sq:
                set_pixel(buf, width, height, x, y, color)


def draw_mark(buf: bytearray, width: int, height: int, x: int, y: int, scale: float,
              color: tuple[int, int, int, int]) -> tuple[int, int]:
    mark_w = int(155 * scale)
    mark_h = int(180 * scale)
    thickness = max(6, int(18 * scale))
    radius = int(thickness * 2.2)

    # top left corner
    fill_rect(buf, width, height, x, y, x + mark_w // 3, y + thickness, color)
    fill_rect(buf, width, height, x, y, x + thickness, y + mark_h // 2, color)

    # top right corner
    tx = x + mark_w - mark_w // 3
    fill_rect(buf, width, height, tx, y, x + mark_w, y + thickness, color)
    fill_rect(buf, width, height, x + mark_w - thickness, y, x + mark_w, y + mark_h // 2, color)

    # bottom left corner
    fill_rect(buf, width, height, x, y + mark_h - thickness, x + mark_w // 3, y + mark_h, color)
    fill_rect(buf, width, height, x, y + mark_h // 2, x + thickness, y + mark_h, color)

    # bottom right corner
    fill_rect(buf, width, height, tx, y + mark_h - thickness, x + mark_w, y + mark_h, color)
    fill_rect(buf, width, height, x + mark_w - thickness, y + mark_h // 2, x + mark_w, y + mark_h, color)

    return mark_w, mark_h


def draw_hoe(buf: bytearray, width: int, height: int, x: int, y: int, scale: float,
             color: tuple[int, int, int, int]) -> int:
    char_w = int(150 * scale)
    char_h = int(170 * scale)
    stroke = max(6, int(18 * scale))

    fill_rect(buf, width, height, x, y, x + char_w, y + stroke, color)
    fill_rect(buf, width, height, x, y + char_h - stroke, x + char_w, y + char_h, color)
    fill_rect(buf, width, height, x, y, x + stroke, y + char_h, color)
    fill_rect(buf, width, height, x + char_w - stroke, y, x + char_w, y + char_h, color)

    inner_top = y + int(52 * scale)
    fill_rect(buf, width, height, x + stroke, inner_top, x + char_w - stroke, inner_top + stroke, color)

    center_x = x + char_w // 2 - stroke // 2
    fill_rect(buf, width, height, center_x, inner_top, center_x + stroke, y + char_h - stroke, color)

    inner_bottom = y + char_h - int(42 * scale)
    fill_rect(buf, width, height, x + stroke, inner_bottom, x + char_w - stroke, inner_bottom + stroke, color)

    return char_w


def draw_bi(buf: bytearray, width: int, height: int, x: int, y: int, scale: float,
            color: tuple[int, int, int, int]) -> int:
    char_w = int(130 * scale)
    char_h = int(170 * scale)
    stroke = max(6, int(18 * scale))

    body_w = int(char_w * 0.55)

    fill_rect(buf, width, height, x, y, x + body_w, y + stroke, color)
    mid_y = y + char_h // 2 - stroke // 2
    fill_rect(buf, width, height, x, mid_y, x + body_w, mid_y + stroke, color)
    fill_rect(buf, width, height, x, y + char_h - stroke, x + body_w, y + char_h, color)

    fill_rect(buf, width, height, x, y, x + stroke, y + char_h, color)
    fill_rect(buf, width, height, x + body_w - stroke, y, x + body_w, y + char_h, color)

    stem_x = x + char_w - stroke
    fill_rect(buf, width, height, stem_x, y, stem_x + stroke, y + char_h, color)

    return char_w


def draw_young(buf: bytearray, width: int, height: int, x: int, y: int, scale: float,
               color: tuple[int, int, int, int]) -> int:
    char_w = int(150 * scale)
    char_h = int(170 * scale)
    stroke = max(6, int(18 * scale))

    center_x = x + int(char_w * 0.35)
    center_y = y + int(char_h * 0.38)
    outer_r = int(48 * scale)
    inner_r = max(2, outer_r - stroke)
    draw_ring(buf, width, height, center_x, center_y, outer_r, inner_r, color)

    stem_x = x + char_w - stroke
    fill_rect(buf, width, height, stem_x, y, stem_x + stroke, y + char_h, color)

    upper = center_y - int(outer_r * 0.2)
    lower = center_y + int(outer_r * 0.7)
    fill_rect(buf, width, height, center_x - int(outer_r * 0.6), upper, stem_x + stroke, upper + stroke, color)
    fill_rect(buf, width, height, center_x - int(outer_r * 0.6), lower, stem_x + stroke, lower + stroke, color)

    tail_top = y + char_h - int(48 * scale)
    fill_rect(buf, width, height, x + int(char_w * 0.2), tail_top, stem_x + stroke, tail_top + stroke, color)

    return char_w


def draw_wordmark(buf: bytearray, width: int, height: int, x: int, y: int, scale: float,
                  color: tuple[int, int, int, int]) -> int:
    spacing = int(26 * scale)
    cursor = x
    cursor += draw_hoe(buf, width, height, cursor, y, scale, color)
    cursor += spacing
    cursor += draw_bi(buf, width, height, cursor, y, scale, color)
    cursor += spacing
    cursor += draw_young(buf, width, height, cursor, y, scale, color)
    return cursor - x


def write_png(path: str, width: int, height: int, buf: bytearray) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        row = buf[y * stride:(y + 1) * stride]
        raw.append(0)
        raw.extend(row)

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)))
    png.extend(chunk(b'IDAT', zlib.compress(bytes(raw), 9)))
    png.extend(chunk(b'IEND', b''))

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(png)


def draw_logo(buf: bytearray, width: int, height: int, scale: float, color: tuple[int, int, int, int]) -> None:
    mark_w = int(155 * scale)
    mark_h = int(180 * scale)
    spacing = int(40 * scale)
    text_height = int(170 * scale)

    total_w = mark_w + spacing + int(430 * scale)
    origin_x = (width - total_w) // 2
    origin_y = (height - mark_h) // 2

    draw_mark(buf, width, height, origin_x, origin_y, scale, color)
    text_x = origin_x + mark_w + spacing
    text_y = origin_y + (mark_h - text_height) // 2
    draw_wordmark(buf, width, height, text_x, text_y, scale, color)


def main() -> None:
    root = os.path.dirname(os.path.dirname(__file__))

    icon_size = 1024
    icon = make_canvas(icon_size, icon_size, WHITE)
    draw_logo(icon, icon_size, icon_size, scale=icon_size / 980, color=BLUE)
    write_png(os.path.join(root, 'assets/images/icon-heavy-young.png'), icon_size, icon_size, icon)

    foreground = make_canvas(icon_size, icon_size, TRANSPARENT)
    draw_logo(foreground, icon_size, icon_size, scale=icon_size / 980, color=BLUE)
    write_png(os.path.join(root, 'assets/images/android-icon-foreground-heavy-young.png'), icon_size, icon_size, foreground)

    monochrome = make_canvas(icon_size, icon_size, TRANSPARENT)
    draw_logo(monochrome, icon_size, icon_size, scale=icon_size / 980, color=BLACK)
    write_png(os.path.join(root, 'assets/images/android-icon-monochrome-heavy-young.png'), icon_size, icon_size, monochrome)

    splash_size = 1400
    splash = make_canvas(splash_size, splash_size, WHITE)
    draw_logo(splash, splash_size, splash_size, scale=splash_size / 1100, color=DEEP_BLUE)
    write_png(os.path.join(root, 'assets/images/splash-icon-heavy-young.png'), splash_size, splash_size, splash)

    favicon_size = 256
    favicon = make_canvas(favicon_size, favicon_size, WHITE)
    draw_logo(favicon, favicon_size, favicon_size, scale=favicon_size / 980, color=BLUE)
    write_png(os.path.join(root, 'assets/images/favicon-heavy-young.png'), favicon_size, favicon_size, favicon)

    print('Generated brand assets.')


if __name__ == '__main__':
    main()
