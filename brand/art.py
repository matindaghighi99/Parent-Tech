#!/usr/bin/env python3
# Deep-Time Sovereign — generative plates for Laurentia
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FD = "/mnt/skills/examples/canvas-design/canvas-fonts/"
def F(name, size): return ImageFont.truetype(FD + name, size)

# ---------- palette ----------
BASE_TOP = np.array([5, 7, 12]) / 255
BASE_BOT = np.array([9, 14, 22]) / 255
TEAL   = np.array([47, 230, 192]) / 255
BLUE   = np.array([58, 150, 255]) / 255
VIOLET = np.array([124, 107, 240]) / 255
COPPER = (197, 138, 74)
COOL   = (214, 224, 232)
MUTE   = (110, 127, 140)
FAINT  = (150, 170, 182)

rng = np.random.default_rng(1867)  # Confederation, why not

def smooth_noise(h, w, scale, seed):
    """value noise: small random grid upscaled smoothly."""
    r = np.random.default_rng(seed)
    gh, gw = max(2, h // scale), max(2, w // scale)
    g = r.random((gh, gw)).astype(np.float32)
    img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0

def fbm(h, w, seed):
    f  = smooth_noise(h, w, 60, seed) * 0.55
    f += smooth_noise(h, w, 26, seed + 1) * 0.30
    f += smooth_noise(h, w, 12, seed + 2) * 0.15
    return f

def base_gradient(h, w, top, bot):
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    out = np.empty((h, w, 3), np.float32)
    for c in range(3):
        out[:, :, c] = top[c] * (1 - t) + bot[c] * t
    return out

def screen(a, b):  # additive light, clipped
    return 1 - (1 - a) * (1 - np.clip(b, 0, 1))

def blur_rgb(arr, radius):
    im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), "RGB")
    im = im.filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(im, np.float32) / 255.0

def contour_layer(field, levels, tol, grad_norm):
    """near-uniform-width iso-lines from a scalar field."""
    L = field * levels
    frac = np.abs(((L + 0.5) % 1.0) - 0.5)          # distance to nearest level
    gy, gx = np.gradient(L)
    g = np.sqrt(gx * gx + gy * gy) + 1e-4
    line = np.clip(1 - frac / (tol * g / grad_norm), 0, 1)
    return line ** 1.4

def spaced_text(draw, xy, text, font, fill, track=0, anchor_mid=False):
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + track * (len(text) - 1)
    x, y = xy
    if anchor_mid: x -= total / 2
    for ch, wch in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += wch + track
    return total

# =========================================================
#  PLATE 1 — wide hero
# =========================================================
def hero(W=2400, H=1500, path="hero.png", plate=True):
    img = base_gradient(H, W, BASE_TOP, BASE_BOT)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    # --- craton topography (contours) ---
    field = fbm(H, W, 7)
    # bias landform lower (sediment pooling)
    field += (yy / H) * 0.12
    landmask = np.clip((yy / H - 0.18) / 0.82, 0, 1)[:, :]   # contours read as land below
    minor = contour_layer(field, 44, 0.9, 28) * (0.4 + 0.6 * landmask)
    major = contour_layer(field, 11, 0.7, 7) * (0.4 + 0.6 * landmask)
    cl = np.array(FAINT) / 255
    for ch in range(3):
        img[:, :, ch] = screen(img[:, :, ch], minor * 0.13 * cl[ch])
        img[:, :, ch] = screen(img[:, :, ch], major * 0.30 * cl[ch])

    # --- aurora band (upper third), smoothed ---
    curve = H * 0.30 + np.sin(xx / W * np.pi * 1.6 + 0.6) * H * 0.05 \
                     + (fbm(H, W, 20)[0:1, :] - 0.5) * H * 0.05
    sigma = H * 0.115
    band = np.exp(-((yy - curve) ** 2) / (2 * sigma ** 2))
    flicker = 0.5 + 0.5 * smooth_noise(H, W, 120, 41)
    band = band * flicker
    tcol = xx / W  # teal -> blue -> violet across x
    aur = np.empty((H, W, 3), np.float32)
    for ch in range(3):
        c = np.where(tcol < 0.5,
                     TEAL[ch] * (1 - tcol * 2) + BLUE[ch] * (tcol * 2),
                     BLUE[ch] * (1 - (tcol - 0.5) * 2) + VIOLET[ch] * ((tcol - 0.5) * 2))
        aur[:, :, ch] = band * c
    aur = blur_rgb(aur, radius=max(3, W // 240))   # dissolve the noise grid into soft light
    img = screen(img, aur * 1.18)

    # faint vertical light shafts in the aurora
    for sx in rng.uniform(0.15, 0.9, 14):
        col = int(sx * W); wsh = rng.integers(2, 5)
        sh = np.exp(-((xx - col) ** 2) / (2 * (wsh * 6) ** 2))
        sh = sh * np.clip(1 - (yy - curve) / (H * 0.42), 0, 1) * (yy > curve - sigma)
        img = screen(img, sh[:, :, None] * (TEAL * 0.5)[None, None, :])

    # --- finish raster, move to PIL ---
    pim = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGB")

    # subtle grain
    grain = (rng.random((H, W)) * 255).astype(np.uint8)
    pim = Image.composite(pim, Image.fromarray(grain).convert("RGB"),
                          Image.new("L", (W, H), 250))
    draw = ImageDraw.Draw(pim, "RGBA")

    # --- node constellation (lower-right) ---
    N = 46
    nx = rng.uniform(W * 0.50, W * 0.96, N)
    ny = rng.uniform(H * 0.50, H * 0.92, N)
    pts = np.stack([nx, ny], 1)
    for i in range(N):
        d = np.hypot(pts[:, 0] - pts[i, 0], pts[:, 1] - pts[i, 1])
        for j in np.argsort(d)[1:4]:
            draw.line([tuple(pts[i]), tuple(pts[j])], fill=(90, 150, 160, 70), width=1)
    for i in range(N):
        r = 2.2
        draw.ellipse([nx[i]-r, ny[i]-r, nx[i]+r, ny[i]+r], fill=(150, 180, 190, 160))
    for i in rng.choice(N, 5, replace=False):
        r = 5
        draw.ellipse([nx[i]-r, ny[i]-r, nx[i]+r, ny[i]+r],
                     fill=(47, 230, 192, 230), outline=(47, 230, 192, 120))

    # --- survey frame + clinical typography (plate variant only) ---
    m = 70
    if plate:
        draw.rectangle([m, m, W-m, H-m], outline=(120, 140, 150, 90), width=1)
        for cx in (m, W-m):
            for cy in (m, H-m):
                draw.line([cx-14, cy, cx+14, cy], fill=(*hexish(COPPER), 200), width=1)
                draw.line([cx, cy-14, cx, cy+14], fill=(*hexish(COPPER), 200), width=1)
        fmono = F("GeistMono-Regular.ttf", 17)
        for k in range(13):
            tx = m + 36 + k * (W - 2*m - 72) / 12
            draw.line([tx, H-m, tx, H-m-(16 if k % 3 == 0 else 8)], fill=(120, 140, 150, 120), width=1)
        fpark = F("NationalPark-Regular.ttf", 22)
        labels = ["49°08′N  94°31′W", "CRATON · LAURENTIA", "PROTEROZOIC — 1.8 Ga", "STABILITY  0.998  NOMINAL"]
        for i, t in enumerate(labels):
            draw.text((m+30, m+26 + i*30), t, font=fmono if i in (0,3) else fpark,
                      fill=(*MUTE, 235) if i else (*FAINT, 235))
        idx = Image.new("RGBA", (520, 40), (0,0,0,0))
        d2 = ImageDraw.Draw(idx)
        spaced_text(d2, (0,6), "PLATE I — SOVEREIGN FOUNDATIONS", F("GeistMono-Regular.ttf", 18), (*MUTE, 220), track=3)
        idx = idx.rotate(90, expand=True)
        pim.paste(idx, (W-m+16, int(H*0.30)), idx)
        ftitle = F("Jura-Light.ttf", 150)
        spaced_text(draw, (m+28, H*0.60), "LAURENTIA", ftitle, (*COOL, 255), track=20)
        fsub = F("GeistMono-Regular.ttf", 26)
        spaced_text(draw, (m+34, H*0.60+178), "THE FOUNDATION BENEATH THE FRONTIER", fsub, (47,230,192,235), track=8)

    pim.convert("RGB").save(path)
    print("saved", path, pim.size)

def hexish(rgb): return tuple(rgb)

# =========================================================
#  PLATE 2 — square "core sample" (concentric strata)
# =========================================================
def core(W=1600, H=1600, path="core.png"):
    img = base_gradient(H, W, BASE_TOP, BASE_BOT)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W*0.5, H*0.52
    r = np.sqrt((xx-cx)**2 + (yy-cy)**2)
    ang = np.arctan2(yy-cy, xx-cx)

    # concentric strata rings (deep time layers)
    warp = (fbm(H, W, 9) - 0.5) * 60
    rr = r + warp + 30*np.sin(ang*6)
    rings = contour_layer(rr / 30.0, 30, 0.8, 9)
    cl = np.array(FAINT)/255
    for ch in range(3):
        img[:,:,ch] = screen(img[:,:,ch], rings * 0.22 * cl[ch])

    # luminous core: hot teal centre cooling to violet outward (deep time)
    rn = np.clip(r/(W*0.42), 0, 1)
    glow = np.exp(-(r**2)/(2*(W*0.13)**2))
    aur = np.empty((H,W,3), np.float32)
    for ch in range(3):
        c = TEAL[ch]*(1-rn) + VIOLET[ch]*rn
        aur[:,:,ch] = glow * c
    aur = blur_rgb(aur, radius=max(3, W//260))
    img = screen(img, aur*1.2)

    pim = Image.fromarray((np.clip(img,0,1)*255).astype(np.uint8), "RGB")
    draw = ImageDraw.Draw(pim, "RGBA")

    # radial survey spokes + ticks
    for a in np.linspace(0, 2*np.pi, 72, endpoint=False):
        r0, r1 = W*0.46, W*0.475
        draw.line([cx+np.cos(a)*r0, cy+np.sin(a)*r0, cx+np.cos(a)*r1, cy+np.sin(a)*r1],
                  fill=(120,140,150,120), width=1)
    draw.ellipse([cx-W*0.46, cy-W*0.46, cx+W*0.46, cy+W*0.46], outline=(120,140,150,90), width=1)

    m=70
    draw.rectangle([m,m,W-m,H-m], outline=(120,140,150,80), width=1)
    fmono = F("GeistMono-Regular.ttf", 18)
    spaced_text(draw, (m+24, m+22), "CORE SAMPLE · L-02", fmono, (*MUTE,220), track=2)
    spaced_text(draw, (W/2, H-m-44), "DEPTH 1.8 Ga  ·  STABLE", F("GeistMono-Regular.ttf",20),
                (*FAINT,220), track=3, anchor_mid=True)
    pim.convert("RGB").save(path)
    print("saved", path, pim.size)

if __name__ == "__main__":
    hero(path="hero.png", plate=True)
    hero(path="hero_bg.png", plate=False)
    core()
