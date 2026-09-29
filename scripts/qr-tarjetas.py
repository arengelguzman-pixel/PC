# Compone tarjetas imprimibles (PNG por mesa + un PDF con todas) a partir de los QR crudos.
# python scripts/qr-tarjetas.py <qrDir> <logoLocal> <nombreLocal> <logoMarca|-> <outDir> <cantidad>
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageOps
qr_dir, logo_local, nombre, logo_marca, out, n = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], int(sys.argv[6])
os.makedirs(out, exist_ok=True)
W, H = 1240, 1754  # A6 a 300 dpi aprox (105x148 mm)
FONT = "C:/Windows/Fonts/arialbd.ttf"; FONT_R = "C:/Windows/Fonts/arial.ttf"
f = lambda s, bold=True: ImageFont.truetype(FONT if bold else FONT_R, s)
LIMA, NEGRO, GRIS = (198, 255, 61), (11, 11, 11), (120, 120, 120)
def circulo(im, size):
    im = ImageOps.fit(im.convert("RGB"), (size, size)); m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size, size), fill=255); im.putalpha(m); return im
logo = circulo(Image.open(logo_local), 260) if os.path.exists(logo_local) else None
marca = Image.open(logo_marca).convert("RGBA") if logo_marca != '-' and os.path.exists(logo_marca) else None
if marca: marca.thumbnail((360, 120))
paginas = []
for i in range(1, n + 1):
    card = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(card)
    d.rectangle((0, 0, W, 26), fill=NEGRO); d.rectangle((0, H - 26, W, H), fill=LIMA)
    y = 70
    if logo: card.paste(logo, ((W - 260) // 2, y), logo); y += 290
    d.text((W // 2, y), nombre, fill=NEGRO, font=f(64), anchor="mt"); y += 90
    d.text((W // 2, y), "Escanea para ver el menú y pedir desde tu mesa", fill=GRIS, font=f(34, False), anchor="mt"); y += 70
    qr = Image.open(f"{qr_dir}/qr-{i}.png").convert("RGB").resize((760, 760)); card.paste(qr, ((W - 760) // 2, y)); y += 790
    d.text((W // 2, y), f"MESA {i}", fill=NEGRO, font=f(150), anchor="mt"); y += 190
    if marca: card.paste(marca, ((W - marca.width) // 2, H - 60 - marca.height), marca)
    else: d.text((W // 2, H - 90), "MEZA by ZETA", fill=GRIS, font=f(30), anchor="mt")
    card.save(f"{out}/mesa-{i}.png", dpi=(300, 300)); paginas.append(card)
paginas[0].save(f"{out}/mesas-imprimir.pdf", "PDF", resolution=300, save_all=True, append_images=paginas[1:])
print(f"{n} tarjetas + PDF en {out}")
