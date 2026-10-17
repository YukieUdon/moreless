#!/usr/bin/env python3
"""生成 App 图标 / 启动图 / Android 自适应图标 / favicon —— 一只小天平。

只在换图标时手动跑一次：

    python scripts/make-icons.py

用 Pillow 画线条，4 倍超采样再缩小，避免锯齿；不依赖任何设计软件。
颜色跟 constants/theme.ts 的纸色 / 墨绿一致。
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images"

PAPER = (250, 248, 242, 255)   # #FAF8F2
INK = (62, 92, 75)             # #3E5C4B
INK_DARK = (143, 180, 156)     # #8FB49C，暗色启动图用
CLEAR = (0, 0, 0, 0)

# 设计坐标（1024 画布）。内容盒子：x 104..920，y 374..765
CX = 512
BEAM_Y = 430
BEAM_HALF = 300
PIVOT_Y = 400
PIVOT_R = 26
PILLAR_TOP = BEAM_Y + 17
PILLAR_BOTTOM = 750
BASE_TOP = 735
BASE_BOTTOM = 765
BASE_HALF = 160
STRING_TOP = BEAM_Y + 17
STRING_BOTTOM = 545
PAN_MOUTH = 545
PAN_RY = 40
PAN_RX = 95
BOUNDS = (104, 374, 920, 765)


def draw_scale(size: int, pad: float, bg, ink, *, bold: float = 1.0, mono: bool = False):
    """在 size×size 的方图里居中画天平；pad 是四周留白比例。"""
    ss = 4
    W = size * ss
    img = Image.new("RGBA", (W, W), bg)
    d = ImageDraw.Draw(img)

    cw = BOUNDS[2] - BOUNDS[0]
    ch = BOUNDS[3] - BOUNDS[1]
    avail = W * (1 - 2 * pad)
    k = min(avail / cw, avail / ch)
    ox = W / 2 - CX * k
    oy = W / 2 - (BOUNDS[1] + BOUNDS[3]) / 2 * k

    def X(v):
        return ox + v * k

    def Y(v):
        return oy + v * k

    def Wd(v):
        return max(1, int(round(v * k * bold)))

    def color(alpha):
        return (*ink, 255) if mono else (*ink, alpha)

    # 横梁
    d.rounded_rectangle(
        [X(CX - BEAM_HALF), Y(BEAM_Y - 17), X(CX + BEAM_HALF), Y(BEAM_Y + 17)],
        radius=Wd(17),
        fill=color(255),
    )

    # 支点圆环
    d.ellipse(
        [X(CX - PIVOT_R), Y(PIVOT_Y - PIVOT_R), X(CX + PIVOT_R), Y(PIVOT_Y + PIVOT_R)],
        outline=color(250),
        width=Wd(14),
    )

    # 立柱
    d.rounded_rectangle(
        [X(CX - 12), Y(PILLAR_TOP), X(CX + 12), Y(PILLAR_BOTTOM)],
        radius=Wd(12),
        fill=color(225),
    )

    # 底座
    d.rounded_rectangle(
        [X(CX - BASE_HALF), Y(BASE_TOP), X(CX + BASE_HALF), Y(BASE_BOTTOM)],
        radius=Wd(15),
        fill=color(210),
    )

    for side in (-1, 1):
        x = CX + side * BEAM_HALF

        # 吊绳
        d.line(
            [X(x), Y(STRING_TOP), X(x), Y(STRING_BOTTOM)],
            fill=color(200),
            width=Wd(12),
        )

        # 托盘：一段半圆，开口朝上
        d.arc(
            [
                X(x - PAN_RX),
                Y(PAN_MOUTH - PAN_RY),
                X(x + PAN_RX),
                Y(PAN_MOUTH + PAN_RY),
            ],
            start=0,
            end=180,
            fill=color(255),
            width=Wd(28),
        )

    return img.resize((size, size), Image.LANCZOS)


def main():
    # iOS / 通用图标：纸底 + 墨绿天平
    draw_scale(1024, 0.12, PAPER, INK).save(OUT / "icon.png")

    # Android 自适应图标：前景透明（缩进安全区），底色交给 app.json
    draw_scale(512, 0.22, CLEAR, INK).save(OUT / "android-icon-foreground.png")
    draw_scale(432, 0.22, CLEAR, INK, mono=True).save(OUT / "android-icon-monochrome.png")

    # 启动图：透明底，纸色 / 暗色背景由 app.json 给
    draw_scale(512, 0.06, CLEAR, INK).save(OUT / "splash-icon.png")
    draw_scale(512, 0.06, CLEAR, INK_DARK).save(OUT / "splash-icon-dark.png")

    # favicon：小尺寸加粗一点，别糊成一根线
    draw_scale(48, 0.02, PAPER, INK, bold=1.8).save(OUT / "favicon.png")

    for name in (
        "icon.png",
        "android-icon-foreground.png",
        "android-icon-monochrome.png",
        "splash-icon.png",
        "splash-icon-dark.png",
        "favicon.png",
    ):
        print(f"wrote {name}")


if __name__ == "__main__":
    main()
