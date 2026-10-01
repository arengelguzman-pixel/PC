# Informe de avance MEZA (PDF) a partir de HTML con la marca, impreso con Chrome headless.
#   python scripts/informe-avance.py
import os, subprocess, pathlib, html
R = pathlib.Path(r'C:\Users\chris\Desktop\PLATO VIVO')
T = pathlib.Path(r'C:\Users\chris\.claude\projects\C--Users-chris-Desktop-NEGOCIO-MULTIPLE-BUSINESS-MULTIPLE\302e8724-1dc3-44f1-a11a-220fd327d24d\tool-results')
u = lambda p: pathlib.Path(p).resolve().as_uri()
IMG = {
    'hoja': R / '.marca-tmp/_hoja.png', 'lockup': R / 'public/meza/lockup-byzeta.png',
    'iso_pixel': R / 'public/meza/isotipo-pixel.png', 'iso_led': R / 'public/meza/isotipo-led.png', 'iso_holo': R / 'public/meza/isotipo-holo.png', 'iso_iso': R / 'public/meza/isotipo-iso.png',
    'antes': R / 'entregas/marca/avatar/ka-antes.png', 'despues': R / 'entregas/marca/avatar/kc-despues.png', 'propuestas': R / 'entregas/marca/avatar/_propuestas.jpg',
    'escritorio': R / '.marca-tmp/landing-escritorio-v2.jpg',
    'm_hero': T / 'mcp-Claude_Browser-blob-1790882001245-1fnt0e.jpg', 'm_como': T / 'mcp-Claude_Browser-blob-1790882001245-32vnde.jpg', 'm_fotos': T / 'mcp-Claude_Browser-blob-1790882001245-ia9yha.jpg',
    'g_menu': T / 'mcp-Claude_Browser-blob-1790882001245-139zpd.jpg', 'g_pizzas': T / 'mcp-Claude_Browser-blob-1790882001245-abdao8.jpg',
    'g_cocina': T / 'mcp-Claude_Browser-blob-1790882001245-sgccqw.jpg', 'g_caja': T / 'mcp-Claude_Browser-blob-1790882001246-q8j4de.jpg',
    'qr': R / 'entregas/el-garaje/tarjetas/mesa-1.png', 'pdf1': R / '.marca-tmp/pdf-1-hd.png',
    'p1': R / 'public/afiliados/el-garaje/pizzas/muzza.jpg', 'p2': R / 'public/afiliados/el-garaje/pizzas/napolitana.jpg', 'p3': R / 'public/afiliados/el-garaje/pizzas/peperoni.jpg', 'p4': R / 'public/afiliados/el-garaje/pizzas/pizza-burguer.jpg',
    'reel': R / '.marca-tmp/fr/_final.jpg', 'k2': R / 'entregas/marca/cuadros/k2-pantalla.png', 'k3': R / 'entregas/marca/cuadros/k3-robot.png', 'robot': R / 'entregas/marca/cuadros/robot-z.png',
    'logo_garaje': R / 'public/afiliados/el-garaje/logo.jpg',
}
for k, p in IMG.items(): assert p.exists(), (k, p)
I = {k: u(p) for k, p in IMG.items()}

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
@page { size: A4; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; background: #0B0B0B; color: #FFF3E4; font-family: 'Inter Tight', system-ui, sans-serif; }
.pg { width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative; padding: 15mm 14mm 14mm; background: #0B0B0B; }
.pg:last-child { page-break-after: auto; }
.ps { font-family: 'Press Start 2P', monospace; }
.mono { font-family: 'JetBrains Mono', monospace; }
.lima { color: #C6FF3D; } .maiz { color: #F2B33D; } .rojo { color: #E11B14; } .tenue { color: rgba(255,243,228,.62); }
.kicker { font-family: 'Press Start 2P', monospace; font-size: 7pt; letter-spacing: .12em; color: #0B0B0B; background: #F2B33D; display: inline-block; padding: 5px 9px; }
h1 { font-family: 'Press Start 2P', monospace; font-size: 15pt; line-height: 1.45; margin: 9mm 0 4mm; color: #F2B33D; text-shadow: 3px 3px 0 #E11B14; text-transform: uppercase; }
h1 .b { color: #FFF3E4; }
h2 { font-family: 'Press Start 2P', monospace; font-size: 7.5pt; color: #C6FF3D; letter-spacing: .1em; margin: 6mm 0 2.5mm; text-transform: uppercase; }
p { font-size: 10pt; line-height: 1.5; margin: 0 0 2.6mm; }
ul { margin: 0 0 3mm; padding-left: 4.5mm; } li { font-size: 9.6pt; line-height: 1.45; margin-bottom: 1.4mm; }
li b, p b { color: #FFF3E4; }
.pie { position: absolute; left: 14mm; right: 14mm; bottom: 9mm; display: flex; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: rgba(255,243,228,.45); border-top: 2px solid rgba(198,255,61,.35); padding-top: 3mm; }
.fila { display: flex; gap: 4mm; align-items: flex-start; }
.col { flex: 1; min-width: 0; }
.marco { border: 3px solid #120A09; box-shadow: 5px 5px 0 #E11B14; background: #000; overflow: hidden; }
.marco img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; }
.chip { display: inline-block; font-family: 'Press Start 2P', monospace; font-size: 6pt; letter-spacing: .1em; padding: 4px 7px; border: 2px solid rgba(255,243,228,.3); color: rgba(255,243,228,.85); margin: 0 1.5mm 1.5mm 0; }
.dato { border: 2px solid rgba(255,243,228,.18); padding: 3mm; }
.dato .k { font-family: 'Press Start 2P', monospace; font-size: 6pt; color: rgba(255,243,228,.55); letter-spacing: .1em; }
.dato .v { font-family: 'JetBrains Mono', monospace; font-size: 13pt; color: #C6FF3D; margin-top: 1.5mm; }
.cap { font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: rgba(255,243,228,.5); margin-top: 1.5mm; }
.tel { width: 43mm; height: 93mm; flex: none; } .tels { display: flex; gap: 3mm; flex: none; }
.pal { display: flex; gap: 2mm; } .pal i { flex: 1; height: 9mm; display: block; border: 2px solid #120A09; }
"""

def pie(n):
    return f'<div class="pie"><span>MEZA by ZETA · Informe de avance · octubre 2026</span><span>La mesa que atiende. · {n}</span></div>'

pages = []
# ---------- 1 · Portada ----------
pages.append(f"""
<section class="pg" style="display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(160deg,#B3100D 0%,#6E0A08 55%,#0B0B0B 100%)">
  <div><span class="kicker">INFORME DE AVANCE · OCTUBRE 2026</span></div>
  <div style="display:flex;flex-direction:column;align-items:flex-start;gap:10mm">
    <img src="{I['iso_pixel']}" style="width:46mm;filter:drop-shadow(4px 4px 0 #E11B14)">
    <div>
      <div class="ps" style="font-size:40pt;color:#C6FF3D;text-shadow:5px 5px 0 #E11B14;line-height:1">MEZA</div>
      <div class="ps" style="font-size:9pt;color:#F2B33D;margin-top:6mm;line-height:1.7">LA MESA QUE ATIENDE.</div>
    </div>
    <p style="max-width:120mm;font-size:12pt;color:rgba(255,243,228,.9)">Construcción de la marca, el nombre y el concepto, y desarrollo de la primera prueba piloto en una pizzería.</p>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end">
    <div class="mono" style="font-size:8pt;color:rgba(255,243,228,.7);line-height:1.8">Menú digital para restaurantes<br>Pedido desde la mesa · pago por QR · cocina y caja en vivo<br>meza.arengel-guzman.workers.dev</div>
    <div class="ps" style="font-size:8pt;color:#FFF3E4">MEZA <span style="color:#C6FF3D">by ZETA</span></div>
  </div>
</section>""")

# ---------- 2 · Nombre y concepto ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">01 · EL NOMBRE Y EL CONCEPTO</span>
  <h1>MEZA: la Z<br><span class="b">es una mesa.</span></h1>
  <div class="fila">
    <div class="col">
      <p><b>MEZA</b> es "mesa" con la <b>Z de ZETA</b>, la agencia matriz. Corto, se dice como se escribe y se recuerda a la primera. La Z dibuja una mesa vista de lado: tapa, pata en diagonal y base.</p>
      <p>El concepto es <b>la mesa que evoluciona</b>. Cada época de la Z cuenta un paso del producto, y es la misma historia que ve el cliente en la landing y la que contaremos en los videos.</p>
      <ul>
        <li><b>Carta de papel</b> → de donde venimos.</li>
        <li><b>Píxel</b> → el menú se volvió digital.</li>
        <li><b>LED</b> → el cliente pide desde la mesa.</li>
        <li><b>Holograma</b> → cocina y caja en vivo.</li>
        <li><b>3D</b> → la mesa que atiende: sale de la pantalla, anota, organiza y lleva la comida.</li>
      </ul>
      <p><b>Eslogan:</b> <i>La mesa que atiende.</i><br><b>Promesa:</b> tu cliente escanea, pide desde la mesa y a la cocina le llega al instante.</p>
    </div>
    <div class="col" style="display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;align-content:start">
      {''.join(f'<div style="text-align:center"><img src="{I[k]}" style="width:100%;max-width:17mm"><div class="ps" style="font-size:5.5pt;color:#C6FF3D;margin-top:2mm">{t}</div></div>' for k, t in [('iso_pixel','PÍXEL'),('iso_led','LED'),('iso_holo','HOLO'),('iso_iso','3D')])}
      <div style="grid-column:1/-1" class="dato"><div class="k">LA RÚBRICA</div><div style="font-size:9.2pt;line-height:1.45;margin-top:1.5mm">El isotipo (la Z-mesa) es la firma de la marca. El nombre va en la tipografía arcade de la landing y <b>la Z del medio es el isotipo</b>, que cambia de época con un glitch. El nombre puede evolucionar; la Z se queda.</div></div>
    </div>
  </div>
  <h2>Sistema visual</h2>
  <div class="fila">
    <div class="col">
      <div class="pal"><i style="background:#C6FF3D"></i><i style="background:#E11B14"></i><i style="background:#F2B33D"></i><i style="background:#1B2FD8"></i><i style="background:#0B0B0B"></i></div>
      <div class="cap">Lima (marca) · Rojo (fondo, energía) · Maíz · Azul (bandas) · Negro</div>
      <p style="margin-top:3mm;font-size:9.4pt">Letra arcade (Press Start 2P) para títulos y logo, Inter Tight para leer, JetBrains Mono para datos. Rojo y amarillo llaman la atención y combinan con la comida; el lima fosforescente es nuestro sello.</p>
    </div>
    <div class="col marco" style="height:58mm"><img src="{I['hoja']}" style="object-position:center"></div>
  </div>
  {pie(2)}
</section>""")

# ---------- 3 · Avatar ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">02 · EL AVATAR</span>
  <h1>Visor Z:<br><span class="b">la cara es el logo.</span></h1>
  <div class="fila">
    <div class="col">
      <p>Un personaje <b>sin rostro</b> para conectar con la gente sin copiar a nadie: un casco-visor negro donde vive la Z lima. Apagada, es un negocio que todavía no tiene forma digital; encendida, es un negocio con MEZA.</p>
      <p>Es la <b>mascota de toda la franquicia ZETA</b>: el mismo personaje se vestirá de mesero para MEZA y de otros oficios para las próximas apps (facturación, abogados, asistente).</p>
      <h2>La historia que cuenta el hero</h2>
      <ul>
        <li><b>Antes:</b> Z apagada, delantal viejo, mirando el celular: reclamos, redes, menú en papel.</li>
        <li><b>Cambio:</b> tira el celular, se saca el delantal, se enchufa y la Z se enciende.</li>
        <li><b>Después:</b> delantal nuevo, bandeja en mano, seguro. Nada se pausa: el video corre continuo mientras el visitante baja.</li>
      </ul>
      <p class="tenue" style="font-size:9pt">Elegido entre tres conceptos (Visor Z, Maniquí, Cabeza de pantalla). Producido con imágenes y video generativos; clips en Kling 3.0, 1080p, 9:16 para celular.</p>
    </div>
    <div class="col" style="display:flex;gap:3mm">
      <div class="marco" style="flex:1;height:112mm"><img src="{I['antes']}"></div>
      <div class="marco" style="flex:1;height:112mm"><img src="{I['despues']}"></div>
    </div>
  </div>
  <div class="marco" style="height:48mm;margin-top:5mm"><img src="{I['propuestas']}" style="object-fit:contain;object-position:center;background:#0B0B0B"></div>
  <div class="cap">Las tres propuestas de avatar; se eligió la primera.</div>
  {pie(3)}
</section>""")

# ---------- 4 · Landing ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">03 · LA LANDING</span>
  <h1>Corta, vertical<br><span class="b">y en movimiento.</span></h1>
  <div class="fila" style="align-items:stretch">
    <div class="col" style="flex:1.15">
      <ul>
        <li><b>Hero con video continuo:</b> el avatar vive detrás del texto y se transforma al bajar.</li>
        <li><b>Cómo funciona:</b> la evolución de la Z y tres pasos: escanea, paga por QR o efectivo, la cocina lo ve al instante.</li>
        <li><b>Fotos con IA:</b> anillo 3D de antes/después que se gira con el dedo; la foto del frente tiene la ventanita deslizable y la última tarjeta deja subir tu propia foto.</li>
        <li><b>Demo real:</b> menú de muestra con cliente, cocina/admin y caja con cierre del día.</li>
        <li>Sin ubicación, sin precios: demostración gratis y contacto por WhatsApp.</li>
      </ul>
      <div class="marco" style="height:62mm;margin-top:3mm"><img src="{I['escritorio']}" style="object-position:center"></div>
      <div class="cap">Escritorio: el avatar a toda pantalla detrás del título.</div>
    </div>
    <div class="tels">
      <div class="marco tel"><img src="{I['m_hero']}"></div>
      <div class="marco tel"><img src="{I['m_fotos']}"></div>
    </div>
  </div>
  {pie(4)}
</section>""")

# ---------- 5 · Piloto ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">04 · PRIMERA PRUEBA PILOTO</span>
  <h1>El Garaje:<br><span class="b">su menú, su marca.</span></h1>
  <div class="fila">
    <div class="col" style="flex:1.2">
      <p>Pizzería al estilo argentino. Un mes gratis con el menú personalizado, para probar el sistema completo con clientes reales.</p>
      <ul>
        <li><b>Menú con su identidad:</b> logo, dorado y tipografía propios; MEZA solo firma abajo.</li>
        <li><b>14 pizzas recreadas con IA</b> a partir de sus fotos: la misma comida, limpia y apetecible, por categoría y tamaño (personal, mediana, familiar, XL, borde relleno).</li>
        <li><b>Link secreto por mesa</b> y tarjetas QR impresas con nuestra marca.</li>
        <li><b>Seguridad:</b> acceso solo con el enlace, vistas de personal con clave, sin indexar.</li>
      </ul>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2.5mm;margin-top:2mm">
        {''.join(f'<div class="marco" style="height:26mm;box-shadow:none;border-color:rgba(255,243,228,.2)"><img src="{I[k]}" style="object-position:center"></div>' for k in ['p1','p2','p3','p4'])}
      </div>
      <div class="cap">Muzza · Napolitana · Peperoni · Pizza Burguer (especial de la casa)</div>
      <div class="fila" style="margin-top:4mm">
        <div class="marco" style="width:40mm;height:56mm"><img src="{I['qr']}" style="object-position:top"></div>
        <div class="col">
          <h2 style="margin-top:0">Tarjeta de mesa</h2>
          <p style="font-size:9.2pt">Diez tarjetas (A6) listas para imprimir. Cada QR abre el menú con la mesa ya puesta: el cliente no escribe nada.</p>
          <div class="chip">MESA 1–10</div><div class="chip">PDF 300 DPI</div>
        </div>
      </div>
    </div>
    <div class="tels">
      <div class="marco tel" style="height:120mm;width:46mm"><img src="{I['g_menu']}"></div>
      <div class="marco tel" style="height:120mm;width:46mm"><img src="{I['g_pizzas']}"></div>
    </div>
  </div>
  {pie(5)}
</section>""")

# ---------- 6 · Operación ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">05 · OPERACIÓN EN VIVO</span>
  <h1>Pedido, cocina,<br><span class="b">caja y cierre.</span></h1>
  <div class="fila">
    <div class="col" style="flex:1.25">
      <ul>
        <li><b>Pedido desde la mesa:</b> tamaño, borde, cantidad, nota; seguimiento en vivo (recibido → en el horno → listo → entregado).</li>
        <li><b>Pago por QR:</b> el cliente ve el QR del local, paga y sube el comprobante; <b>Caja lo recibe al instante</b> (bip + aviso) y confirma o rechaza. Efectivo se marca cobrado en caja.</li>
        <li><b>Cocina:</b> comanda con alarma insistente hasta tocar "Recibido", tiempos por comanda, estado del pago y platos agotados que el cliente ve al momento.</li>
        <li><b>Cierre de caja:</b> turno abierto en vivo (total, QR y efectivo, ticket promedio, más vendidos), cierre con efectivo contado y nota, historial.</li>
        <li><b>Archivo y envío automático:</b> los comprobantes se guardan 90 días; cada cierre genera un PDF con el balance y todos los comprobantes, y se envía solo al dueño.</li>
      </ul>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm;margin-top:2mm">
        <div class="dato"><div class="k">TIEMPO REAL</div><div class="v" style="font-size:9pt">WebSocket por local</div></div>
        <div class="dato"><div class="k">INFRA</div><div class="v" style="font-size:9pt">Cloudflare, sin servidores</div></div>
        <div class="dato"><div class="k">COSTO FIJO HOY</div><div class="v" style="font-size:9pt">Bs 0</div></div>
      </div>
      <div class="marco" style="height:58mm;margin-top:4mm;background:#fff"><img src="{I['pdf1']}" style="object-position:top left"></div>
      <div class="cap">PDF que genera el cierre: balance y, en las páginas siguientes, cada comprobante.</div>
    </div>
    <div class="tels">
      <div class="marco tel" style="height:120mm;width:46mm"><img src="{I['g_cocina']}"></div>
      <div class="marco tel" style="height:120mm;width:46mm"><img src="{I['g_caja']}"></div>
    </div>
  </div>
  {pie(6)}
</section>""")

# ---------- 7 · Audiovisual y próximos pasos ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">06 · CONTENIDO Y PRÓXIMOS PASOS</span>
  <h1>Todo animado,<br><span class="b">poca imagen fija.</span></h1>
  <div class="marco" style="height:70mm"><img src="{I['reel']}" style="object-fit:contain;object-position:center;background:#0B0B0B"></div>
  <div class="cap">Reel "La mesa que atiende" (17 s): la mesa se dobla en pantalla → sale el robot Z con la pizza → LISTO → cierre con el logo. Más el clip del logo con las cuatro épocas de la Z.</div>
  <div class="fila" style="margin-top:5mm">
    <div class="col">
      <h2 style="margin-top:0">Hecho</h2>
      <ul>
        <li>Nombre, concepto, isotipo y sistema visual.</li>
        <li>Avatar Visor Z y hero en video.</li>
        <li>Landing publicada, demo real.</li>
        <li>Piloto El Garaje: menú, fotos, QR, cocina, caja, cierre.</li>
        <li>Reel y clip de marca; perfiles para redes.</li>
      </ul>
    </div>
    <div class="col">
      <h2 style="margin-top:0">Siguiente</h2>
      <ul>
        <li>Arrancar el piloto: clave de personal, QR de cobro y tarjetas en las mesas.</li>
        <li>Activar el envío automático del cierre (bot) y, si se quiere, por WhatsApp.</li>
        <li>Estudio de mercado y precios: plan gratis + premium (en curso).</li>
        <li>Calendario de contenido con el avatar; versión 4K del clip si hace falta.</li>
        <li>Segundo y tercer local; luego Santa Cruz y La Paz.</li>
      </ul>
    </div>
  </div>
  <div style="position:absolute;left:14mm;right:14mm;bottom:22mm;display:flex;justify-content:space-between;align-items:center;border:3px solid #C6FF3D;padding:4mm 5mm">
    <div><div class="ps" style="font-size:8pt;color:#C6FF3D">PRUÉBALO</div><div class="mono" style="font-size:8.5pt;color:#FFF3E4;margin-top:2mm">meza.arengel-guzman.workers.dev · /demo</div></div>
    <img src="{I['lockup']}" style="height:16mm">
  </div>
  {pie(7)}
</section>""")

HTML = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>MEZA · Informe de avance</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
out = R / 'entregas/informe'; out.mkdir(parents=True, exist_ok=True)
(out / 'informe.html').write_text(HTML, encoding='utf-8')
pdf = out / 'MEZA-informe-avance-oct-2026.pdf'
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
                f'--user-data-dir={R / ".marca-tmp/perfil3"}', '--no-pdf-header-footer', '--virtual-time-budget=15000', f'--print-to-pdf={pdf}', (out / 'informe.html').resolve().as_uri()],
               check=True, capture_output=True, timeout=180)
import fitz
d = fitz.open(pdf); print('paginas', len(d), 'KB', pdf.stat().st_size // 1024)
for i, p in enumerate(d): p.get_pixmap(dpi=55).save(str(R / f'.marca-tmp/inf-{i + 1}.png'))
