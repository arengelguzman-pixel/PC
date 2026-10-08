# Manual de uso de MEZA para El Garaje (PDF), explicado paso a paso, con capturas reales.
#   node scripts/capturas-manual.mjs   (primero, para las capturas)
#   python scripts/manual-garaje.py
import subprocess, pathlib
R = pathlib.Path(r'C:\Users\chris\Desktop\PLATO VIVO')
C = R / 'entregas/manual/capturas'
u = lambda p: pathlib.Path(p).resolve().as_uri()
IMG = {k: C / f'{k}.png' for k in ['c1-menu', 'c2-pizzas', 'c3-detalle', 'c4-detalle-lleno', 'c5-agregado', 'c6-carrito', 'c7-seguimiento', 'c8-pago-qr', 'c9-comprobante-subido',
                                   'k0-clave', 'k1-comandas', 'k2-recibido', 'k3-en-horno', 'k4-disponibilidad', 'k5-tablet', 'j1-caja', 'j2-comprobante', 'j3-cierre', 'j4-cerrar-modal']}
IMG['lockup'] = R / 'public/meza/lockup-negro.png'
IMG['logo_garaje'] = R / 'public/afiliados/el-garaje/logo.jpg'
IMG['tarjeta'] = R / 'entregas/el-garaje/tarjetas/mesa-1.png'
for k, p in IMG.items(): assert p.exists(), (k, p)
I = {k: u(p) for k, p in IMG.items()}

URL = 'pidemeza.com'
L_CLIENTE = f'https://{URL}/garaje'
L_COCINA = L_CLIENTE + '?vista=cocina'
L_CAJA = L_CLIENTE + '?vista=caja'

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
@page { size: A4; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; background: #FFF3E4; color: #120A09; font-family: 'Inter Tight', system-ui, sans-serif; }
.pg { width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; position: relative; padding: 14mm 14mm 16mm; background: #FFF3E4; }
.pg:last-child { page-break-after: auto; }
.ps { font-family: 'Press Start 2P', monospace; }
.mono { font-family: 'JetBrains Mono', monospace; }
.kicker { font-family: 'Press Start 2P', monospace; font-size: 7pt; letter-spacing: .12em; color: #FFF3E4; background: #E11B14; display: inline-block; padding: 5px 9px; }
h1 { font-family: 'Press Start 2P', monospace; font-size: 14pt; line-height: 1.5; margin: 6mm 0 3mm; color: #120A09; text-shadow: 3px 3px 0 #F2B33D; text-transform: uppercase; }
h2 { font-family: 'Press Start 2P', monospace; font-size: 7.5pt; color: #1B2FD8; letter-spacing: .08em; margin: 5mm 0 2.5mm; text-transform: uppercase; }
p { font-size: 11pt; line-height: 1.5; margin: 0 0 2.6mm; }
ul { margin: 0 0 3mm; padding-left: 5mm; } li { font-size: 10.5pt; line-height: 1.45; margin-bottom: 1.6mm; }
b { color: #120A09; }
.pie { position: absolute; left: 14mm; right: 14mm; bottom: 8mm; display: flex; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: rgba(18,10,9,.5); border-top: 2px solid #120A09; padding-top: 2.5mm; }
.fila { display: flex; gap: 5mm; align-items: flex-start; }
.col { flex: 1; min-width: 0; }
.marco { border: 3px solid #120A09; box-shadow: 5px 5px 0 #F2B33D; background: #000; overflow: hidden; }
.marco img { display: block; width: 100%; }
.tel { width: 50mm; flex: none; } .tel .marco { height: 108mm; } .tel .marco img { height: 100%; object-fit: cover; object-position: top; }
.cap { font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: rgba(18,10,9,.6); margin-top: 2mm; }
.paso { display: flex; gap: 3.5mm; align-items: flex-start; margin-bottom: 3.2mm; }
.num { flex: none; width: 10mm; height: 10mm; border-radius: 50%; background: #120A09; color: #C6FF3D; font-family: 'Press Start 2P', monospace; font-size: 9pt; display: grid; place-items: center; box-shadow: 2px 2px 0 #E11B14; }
.paso h3 { margin: 0 0 1mm; font-size: 12pt; font-weight: 800; }
.paso p { margin: 0 0 1.2mm; font-size: 10.5pt; }
.ojo { background: #FFE7B3; border-left: 5px solid #F2B33D; padding: 2.5mm 3.5mm; margin: 2.5mm 0; font-size: 10pt; line-height: 1.45; }
.ok { background: #E6FFB3; border-left: 5px solid #7CB518; padding: 2.5mm 3.5mm; margin: 2.5mm 0; font-size: 10pt; line-height: 1.45; }
.no { background: #FFD6D3; border-left: 5px solid #E11B14; padding: 2.5mm 3.5mm; margin: 2.5mm 0; font-size: 10pt; line-height: 1.45; }
.chip { display: inline-block; font-family: 'Press Start 2P', monospace; font-size: 6pt; padding: 4px 7px; border: 2px solid #120A09; margin: 0 1.5mm 1.5mm 0; }
.btn { display: inline-block; font-family: 'Press Start 2P', monospace; font-size: 6.5pt; padding: 4px 8px; border: 2px solid #120A09; background: #C6FF3D; color: #120A09; white-space: nowrap; }
.btn.maiz { background: #F2B33D; } .btn.gris { background: #FFF3E4; } .btn.rojo { background: #FFD6D3; color: #E11B14; border-color: #E11B14; }
table { width: 100%; border-collapse: collapse; font-size: 9.6pt; }
th { text-align: left; font-family: 'Press Start 2P', monospace; font-size: 6pt; letter-spacing: .08em; color: #FFF3E4; background: #120A09; padding: 2.5mm 2.5mm; }
td { padding: 2.2mm 2.5mm; border-bottom: 2px solid rgba(18,10,9,.15); vertical-align: top; line-height: 1.4; }
td:first-child { font-weight: 700; width: 36mm; }
.check { display: flex; gap: 3mm; align-items: flex-start; margin-bottom: 3mm; font-size: 11.5pt; line-height: 1.4; }
.check i { flex: none; width: 7mm; height: 7mm; border: 3px solid #120A09; margin-top: 1mm; }
.link { font-family: 'JetBrains Mono', monospace; font-size: 9pt; background: #120A09; color: #C6FF3D; padding: 2.5mm 3mm; display: block; word-break: break-all; margin: 1.5mm 0 3mm; }
.grande { font-size: 13pt; line-height: 1.5; }
"""

def pie(n): return f'<div class="pie"><span>MEZA by ZETA · Manual de El Garaje · octubre 2026</span><span>página {n}</span></div>'
def tel(k, cap): return f'<div class="tel"><div class="marco"><img src="{I[k]}"></div><div class="cap">{cap}</div></div>'
def paso(n, t, txt): return f'<div class="paso"><div class="num">{n}</div><div><h3>{t}</h3>{txt}</div></div>'

pages = []
# ---------- 1 · Portada ----------
pages.append(f"""
<section class="pg" style="display:flex;flex-direction:column;justify-content:space-between;background:#E11B14;color:#FFF3E4">
  <div>
    <span class="kicker" style="background:#120A09;color:#C6FF3D">MANUAL DE USO · PILOTO #1</span>
    <h1 style="font-size:24pt;color:#FFF3E4;text-shadow:4px 4px 0 #120A09;margin-top:14mm">MEZA<br><span style="font-size:11pt;color:#F2B33D">en El Garaje</span></h1>
    <p class="grande" style="max-width:120mm;color:#FFF3E4">Cómo usar la carta digital, la cocina y la caja. Explicado paso a paso, con las pantallas reales, y qué hacer si algo sale mal.</p>
  </div>
  <div class="fila" style="align-items:flex-end">
    <div class="col">
      <div style="display:flex;gap:4mm;align-items:center;background:#120A09;padding:4mm 5mm;border:3px solid #FFF3E4">
        <img src="{I['logo_garaje']}" style="height:22mm;border-radius:3mm">
        <div><div class="ps" style="font-size:8pt;color:#F2B33D">EL GARAJE</div><div style="font-size:10pt;color:#FFF3E4;margin-top:1.5mm">Pizzería · Al estilo Argentino</div><div class="mono" style="font-size:8pt;color:rgba(255,243,228,.6);margin-top:1.5mm">Versión 1 · 8 de octubre de 2026</div></div>
      </div>
    </div>
    <img src="{I['lockup']}" style="height:20mm">
  </div>
</section>""")

# ---------- 2 · MEZA en un minuto ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">1 · LO PRIMERO</span>
  <h1>MEZA en un minuto</h1>
  <p class="grande">MEZA es una carta digital que <b>toma los pedidos sola</b>. El cliente escanea el QR de su mesa, elige, y el pedido aparece en la cocina al instante. No hay que instalar nada: son <b>tres enlaces</b> que se abren en Chrome, como una página web.</p>
  <div class="fila" style="margin-top:4mm">
    {tel('c1-menu', 'CLIENTE · lo ve el comensal en su celular')}
    {tel('k1-comandas', 'COCINA · el celular o tablet de la cocina')}
    {tel('j1-caja', 'CAJA · el celular de quien cobra')}
  </div>
  <div class="fila" style="margin-top:4mm">
    <div class="col"><h2>Cliente</h2><p>Ve las fotos, los precios y los tamaños. Arma su pedido, dice cómo paga y sigue el avance (“en horno”, “lista”).</p></div>
    <div class="col"><h2>Cocina</h2><p>Recibe cada comanda con alarma y <b>voz que dice la mesa</b>. Marca “Al horno”, “Lista”, “Entregar”, y marca lo agotado.</p></div>
    <div class="col"><h2>Caja</h2><p>Confirma los pagos (efectivo o QR con comprobante), guarda los comprobantes y hace el <b>cierre de caja</b> del día.</p></div>
  </div>
  <div class="ok"><b>Lo único que necesita el local:</b> un celular o tablet con internet en la cocina (con el volumen alto) y otro en caja. Pueden ser los que ya tienen.</div>
  {pie(2)}
</section>""")

# ---------- 3 · Antes de abrir ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">2 · CADA DÍA</span>
  <h1>Antes de abrir el local</h1>
  <p class="grande">Esta lista toma dos minutos. Si se cumple, todo lo demás funciona solo.</p>
  <div style="margin-top:5mm">
    <div class="check"><i></i><div><b>El celular de cocina está cargado</b> y conectado a internet (wifi o datos). Lo ideal: enchufado todo el turno.</div></div>
    <div class="check"><i></i><div><b>Volumen al máximo</b> en el celular de cocina. La voz dice “¡Nueva comanda! Mesa cinco”. Si está en silencio, no se escucha.</div></div>
    <div class="check"><i></i><div><b>Abrir el enlace de Cocina</b> en Chrome y dejarlo abierto. Tiene que decir <span class="chip" style="color:#5a8a00">● EN VIVO</span> arriba a la izquierda.</div></div>
    <div class="check"><i></i><div><b>Tocar el cartel verde “Toca aquí para activar el sonido y la voz”</b> que aparece abajo al abrir Cocina o Caja (el celular no deja sonar nada hasta que alguien toca la pantalla). “Sonido ON” debe quedar en verde.</div></div>
    <div class="check"><i></i><div><b>Abrir el enlace de Caja</b> en el celular de caja. También tiene que decir “en vivo”.</div></div>
    <div class="check"><i></i><div><b>Los 10 QR están en sus mesas</b> (mesa 1 en la mesa 1, mesa 2 en la mesa 2…). Cada tarjeta tiene su número.</div></div>
    <div class="check"><i></i><div><b>El QR de cobro del local está subido</b> en Caja → “Configuración · QR de cobro” (una sola vez; queda guardado). Si no está, los clientes solo podrán pagar en efectivo.</div></div>
  </div>
  <h2>Los tres enlaces (guárdalos en el celular)</h2>
  <p><b>Cliente</b> (este es el que está en los QR de las mesas; no hace falta escribirlo):</p>
  <span class="link">{L_CLIENTE}</span>
  <p><b>Cocina</b> (solo para el personal):</p>
  <span class="link">{L_COCINA}</span>
  <p><b>Caja</b> (solo para quien cobra):</p>
  <span class="link">{L_CAJA}</span>
  <div class="ojo"><b>Truco:</b> en Chrome, toca los tres puntos ⋮ → “Agregar a pantalla de inicio”. Así queda un ícono como una app y se abre con un toque.</div>
  {pie(3)}
</section>""")

# ---------- 4 · Cliente 1 ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">3 · EL CLIENTE</span>
  <h1>Cómo pide el cliente</h1>
  <div class="fila">
    <div class="col">
      {paso(1, 'Escanea el QR de su mesa', '<p>Abre la cámara del celular y apunta al QR de la tarjeta. Aparece un aviso para abrir el enlace; lo toca y se abre la carta de El Garaje.</p><p>El número de mesa ya va incluido en el QR: <b>no tiene que escribirlo</b>.</p>')}
      {paso(2, 'Mira la carta', '<p>Arriba están las categorías: <b>Especiales</b>, <b>Pizzas</b> y <b>Del resto</b>. Toca una para saltar ahí. Cada pizza muestra su foto, ingredientes y “desde 25”.</p><p>La cajita amarilla muestra los precios por tamaño y el borde de queso.</p>')}
      {paso(3, 'Toca la pizza que quiere', '<p>Se abre una ventana con la foto grande. Ahí elige el <b>tamaño</b> (Personal, Mediana, Familiar, XL), si lleva <b>borde de queso</b>, y la <b>cantidad</b>.</p>')}
      <div class="ojo"><b>“¿Algo en particular?”</b> es una casilla para escribir pedidos especiales: “sin aceitunas”, “bien cocida”, “mitad y mitad”. Lo que escriba ahí lo ve la cocina en amarillo. <b>Esta casilla se activa solo si la dueña la quiere.</b></div>
    </div>
    {tel('c2-pizzas', 'La carta: categorías arriba, precios por tamaño, fotos.')}
    {tel('c4-detalle-lleno', 'La ventana de la pizza: tamaño, borde, “algo en particular”, cantidad.')}
  </div>
  {pie(4)}
</section>""")

# ---------- 5 · Cliente 2 ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">3 · EL CLIENTE</span>
  <h1>Hacer el pedido</h1>
  <div class="fila">
    {tel('c6-carrito', '“Tu pedido”: lo que eligió, la nota, la mesa y cómo paga.')}
    {tel('c7-seguimiento', 'Pedido enviado. Abajo, en “Seguimiento”, ve cómo avanza.')}
    <div class="col">
      {paso(4, 'Toca “Agregar”', '<p>La pizza se guarda y abajo aparece una <b>barra amarilla</b>: “1 · Ver mi pedido · Bs 65”. Puede seguir agregando más cosas.</p>')}
      {paso(5, 'Toca “Ver mi pedido”', '<p>Revisa su pedido. Puede sumar o restar con + y −. Puede escribir una <b>nota para la cocina</b> y ver el número de <b>mesa</b> (ya viene puesto).</p><p>Elige <b>cómo paga</b>: “Pagar con QR” o “Pagar en efectivo”.</p>')}
      {paso(6, 'Toca “Hacer pedido”', '<p>¡Listo! En ese mismo segundo la comanda aparece en la cocina y suena la alarma.</p><p>El cliente ve un aviso: “Pedido P-009 enviado”. Y abajo, en <b>Seguimiento</b>, ve cuando pasa a “en horno”, “lista” y “entregada”.</p>')}
      <div class="ok">Si el cliente cierra la página sin querer, vuelve a escanear el QR: <b>su pedido sigue ahí</b>, en Seguimiento.</div>
    </div>
  </div>
  {pie(5)}
</section>""")

# ---------- 6 · Cliente pago QR ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">3 · EL CLIENTE</span>
  <h1>Si paga con QR</h1>
  <div class="fila">
    <div class="col">
      {paso(7, 'Ve el QR del local', '<p>Apenas hace el pedido se abre “Pagar con QR”: el <b>monto exacto</b> y el QR de cobro de El Garaje (el que subió Caja).</p><p>Lo escanea con la app de su banco o billetera. Si está en el mismo celular, toca “Guardar imagen del QR” y la abre desde la app del banco.</p>')}
      {paso(8, 'Sube la foto del comprobante', '<p>Toca <b>“Subir comprobante”</b> (elige la captura) o <b>“Tomar foto del comprobante”</b>. La foto viaja a Caja. Si prefiere, puede elegir “Pagar en efectivo” y pagar al recibir.</p><p>Ve “Comprobante enviado, esperando a caja”. Puede cerrar la ventana y seguir mirando la carta.</p>')}
      {paso(9, 'Caja confirma', '<p>Cuando Caja revisa la foto y toca “Confirmar pago”, el cliente recibe el aviso <b>“Pago confirmado”</b>. Si Caja lo rechaza (foto borrosa, monto distinto), le aparece <b>“Vuelve a subirlo”</b> y puede subir otra foto.</p>')}
      <div class="ojo"><b>Importante:</b> MEZA <b>no mueve dinero</b>. El pago lo hace el cliente con su banco, como siempre. MEZA solo lleva la foto del comprobante a Caja y la guarda 90 días.</div>
    </div>
    {tel('c8-pago-qr', 'Monto exacto + QR de cobro + botones para subir la foto.')}
    {tel('c9-comprobante-subido', 'Comprobante enviado. Espera a que Caja lo confirme.')}
  </div>
  {pie(6)}
</section>""")

# ---------- 7 · Cocina entrar ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">4 · LA COCINA</span>
  <h1>Entrar a Cocina</h1>
  <div class="fila">
    {tel('k0-clave', 'La primera vez pide la clave de personal.')}
    {tel('k1-comandas', 'La pantalla de Cocina con una comanda nueva.')}
    <div class="col">
      {paso(1, 'Abre el enlace de Cocina', '<p>En Chrome, abre el enlace de Cocina (página 3) o el ícono de la pantalla de inicio.</p>')}
      {paso(2, 'Escribe la clave de personal', '<p>Es un número de 6 cifras que tiene la dueña. Se escribe <b>una sola vez por celular</b>: después el celular la recuerda.</p><p>Si tocas “Salir”, la pedirá de nuevo. Es la misma de siempre.</p>')}
      {paso(3, 'Revisa que diga “en vivo”', '<p>Debajo del título tiene que aparecer <span class="chip" style="color:#5a8a00">● EN VIVO</span>. Si dice “reconectando…” en rojo, hay un problema de internet (ver página 13).</p>')}
      <h2>Qué hay en la pantalla</h2>
      <ul>
        <li><b>Banner amarillo arriba:</b> la última comanda sin atender, con mesa y total, y el botón <span class="btn maiz">RECIBIDO ✓</span>.</li>
        <li><b>9 NUEVA(S):</b> cuántas comandas todavía nadie tocó.</li>
        <li><b>Sonido ON/OFF:</b> alarma y voz. Déjalo en ON (verde).</li>
        <li><b>Filtros:</b> En curso · Nuevas · En horno · Listas · Entregadas.</li>
        <li><b>Tarjetas:</b> una por pedido: número (P-009), MESA, hora, qué pidió y la nota en amarillo.</li>
      </ul>
    </div>
  </div>
  {pie(7)}
</section>""")

# ---------- 8 · Cocina camino ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">4 · LA COCINA</span>
  <h1>El camino de una comanda</h1>
  <p class="grande">Cada pedido pasa por <b>cuatro toques</b>. Siempre en el mismo orden, siempre en la tarjeta del pedido.</p>
  <div class="fila">
    <div class="col">
      {paso(1, 'Llega: suena y habla', '<p>Suena un “bip-bip” cada 4 segundos, el celular vibra y una voz dice <b>“¡Nueva comanda! Mesa tres”</b>. La voz repite la mesa cada 20 segundos hasta que alguien toque Recibido.</p>')}
      {paso(2, 'Toca RECIBIDO ✓', '<p>Se apaga la alarma de esa comanda. Quiere decir “ya la vi”. El borde amarillo parpadeante desaparece.</p>')}
      {paso(3, 'Toca AL HORNO ▸', '<p>Cuando la pizza entra al horno. La tarjeta cambia a <span class="chip" style="background:#1B2FD8;color:#fff">EN HORNO</span>. El cliente lo ve en su celular.</p>')}
      {paso(4, 'Toca LISTA ▸ y luego ENTREGAR ▸', '<p>“Lista” cuando sale del horno. “Entregar” cuando se la llevan a la mesa. La tarjeta pasa a “Entregadas” y deja de estorbar.</p>')}
      <h2>Los colores del tiempo</h2>
      <ul>
        <li><b>Gris:</b> todo normal (menos de 8 minutos).</li>
        <li><b>Amarillo:</b> lleva entre 8 y 15 minutos. Ojo.</li>
        <li><b>Rojo:</b> más de 15 minutos. Esa mesa está esperando mucho.</li>
      </ul>
    </div>
    {tel('k2-recibido', 'Después de “Recibido”: sin alarma, lista para cocinar.')}
    {tel('k3-en-horno', 'Después de “Al horno”: azul. El cliente lo ve.')}
  </div>
  {pie(8)}
</section>""")

# ---------- 9 · Cocina disponibilidad ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">4 · LA COCINA</span>
  <h1>Agotados y tablet</h1>
  <div class="fila">
    {tel('k4-disponibilidad', 'Abajo de las comandas: “Disponibilidad”.')}
    <div class="col">
      <h2>Se acabó un ingrediente</h2>
      {paso(1, 'Baja hasta “Disponibilidad”', '<p>Está al final de la pantalla de Cocina. Hay una fila por cada pizza, con su foto.</p>')}
      {paso(2, 'Toca “Hay” → se vuelve “Agotada”', '<p>En ese mismo instante el cliente ve la pizza en gris con el cartel <b>AGOTADA</b> y <b>no puede pedirla</b>.</p>')}
      {paso(3, 'Cuando vuelva a haber, toca “Agotada” → “Hay”', '<p>Y vuelve a aparecer normal en la carta. No hay que avisar a nadie.</p>')}
      <div class="ojo">Si marcaste “Agotada” sin querer, tócala otra vez y listo. No se rompe nada.</div>
      <h2>En tablet o computadora</h2>
      <p>La misma pantalla se ve más grande: tres comandas por fila. Es la mejor opción para una cocina con movimiento. Se entra con el mismo enlace y la misma clave.</p>
      <div class="ok"><b>Consejo:</b> en la tablet, en Chrome, toca ⋮ → “Agregar a pantalla de inicio”. Y en los ajustes del aparato, pon que la pantalla <b>no se apague sola</b> (o ponlo a 30 minutos).</div>
    </div>
  </div>
  <div class="marco" style="margin-top:4mm;height:62mm"><img src="{I['k5-tablet']}" style="height:100%;object-fit:cover;object-position:top"></div>
  <div class="cap">Cocina en tablet: tres comandas por fila, todo a la vista.</div>
  {pie(9)}
</section>""")

# ---------- 10 · Caja pantalla ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">5 · LA CAJA</span>
  <h1>La pantalla de Caja</h1>
  <div class="fila">
    <div class="col">
      <p class="grande">Caja se abre igual que Cocina: su enlace + la misma clave de personal. Tiene <b>tres listas</b>:</p>
      <ul>
        <li><b>POR COBRAR:</b> pedidos que todavía no se pagaron. Es lo que hay que atender.</li>
        <li><b>COBRADOS:</b> lo que ya se pagó hoy, con la hora.</li>
        <li><b>RECHAZADOS:</b> comprobantes que no cuadraron (el cliente puede volver a subir).</li>
      </ul>
      <p>Arriba, <span class="chip">TURNO Bs 0</span> muestra cuánto se cobró desde el último cierre de caja.</p>
      <h2>Si el cliente paga en efectivo</h2>
      {paso(1, 'Cobra como siempre', '<p>El cliente paga en la mesa o pasa por caja. Tú recibes el dinero.</p>')}
      {paso(2, 'Toca “Cobrado en efectivo ✓”', '<p>En la tarjeta del pedido. Pasa a COBRADOS y se suma al turno. Al cliente le aparece “Pago confirmado”.</p>')}
      <div class="ojo">Cada tarjeta dice <b>EFECTIVO</b> o <b>QR</b> para que sepas cómo eligió pagar. Si eligió QR pero al final paga en efectivo, igual puedes tocar “Cobrado en efectivo”.</div>
    </div>
    {tel('j1-caja', 'Por cobrar: cada pedido con su botón para cobrar.')}
  </div>
  {pie(10)}
</section>""")

# ---------- 11 · Caja comprobantes ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">5 · LA CAJA</span>
  <h1>Comprobantes de QR</h1>
  <div class="fila">
    {tel('j2-comprobante', 'La foto del comprobante con “Confirmar pago” y “Rechazar”.')}
    <div class="col">
      {paso(1, 'Suena y habla', '<p>Cuando un cliente sube su comprobante, Caja hace “bip” y la voz dice <b>“Llegó un comprobante de pago. Mesa tres”</b>. La tarjeta se pone amarilla: <b>POR CONFIRMAR</b>.</p>')}
      {paso(2, 'Toca “Ver comprobante ▸”', '<p>Se abre la foto en grande. Revisa <b>el monto</b> (tiene que ser igual al del pedido) y que diga que la transferencia fue <b>exitosa</b>.</p>')}
      {paso(3, 'Toca “Confirmar pago ✓”', '<p>Si todo cuadra. El pedido pasa a COBRADOS y el cliente recibe “Pago confirmado”. La foto queda guardada 90 días.</p>')}
      {paso(4, 'O toca “Rechazar ✗”', '<p>Si la foto está borrosa, el monto no coincide o parece repetida. Al cliente le aparece “Vuelve a subirlo”. Nada se pierde.</p>')}
      <h2>El QR de cobro del local</h2>
      <p>Arriba de todo en Caja está <b>“Configuración · QR de cobro”</b>. Ahí la dueña sube <b>una sola vez</b> la imagen del QR de su banco o billetera (el mismo que tienen impreso). Desde ese momento, en el menú de cada mesa el cliente puede elegir <b>“Pagar con QR”</b> o <b>“Pagar en efectivo”</b>. Si se cambia de cuenta, se toca “Quitar” y se sube el nuevo.</p>
      <div class="no"><b>Nunca</b> confirmes un pago sin ver la foto. Si dudas, pide al cliente que te muestre la pantalla de su banco.</div>
    </div>
  </div>
  {pie(11)}
</section>""")

# ---------- 12 · Caja cierre ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">5 · LA CAJA</span>
  <h1>Cierre de caja</h1>
  <div class="fila">
    <div class="col">
      <p class="grande">Al terminar el día (o cada turno) se hace el cierre. Toma un minuto y deja el balance guardado.</p>
      {paso(1, 'Baja hasta “Cierre de caja”', '<p>Verás el <b>turno abierto</b>: cuántos pedidos se cobraron, el <b>total</b>, cuánto fue <b>por QR</b>, cuánto <b>en efectivo</b>, el ticket promedio y lo más vendido.</p>')}
      {paso(2, 'Cuenta el efectivo de la caja', '<p>Solo los billetes y monedas de hoy. Anota el número.</p>')}
      {paso(3, 'Toca “Cerrar caja ▸”', '<p>Escribe el <b>efectivo contado</b> y, si quieres, una nota (“faltó cambio”, “se invitó una pizza”). Toca guardar.</p>')}
      {paso(4, 'Mira el resultado', '<p>El cierre aparece en <b>“Cierres anteriores”</b> con su número (Z-001, Z-002…). Muestra si el efectivo contado <b>cuadra</b> con lo que se debía cobrar, o cuánto falta o sobra.</p>')}
      <h2>Qué pasa después del cierre</h2>
      <ul>
        <li>Se arma un <b>PDF</b> con el balance y todas las fotos de comprobantes del turno. Se puede descargar desde el historial.</li>
        <li>Puedes mandar el <b>resumen por WhatsApp</b> a la dueña con un toque.</li>
        <li>El contador “TURNO” vuelve a Bs 0 y arranca el turno siguiente.</li>
      </ul>
      <div class="ojo">El envío automático al Telegram de la dueña queda listo en una segunda etapa. Mientras tanto: WhatsApp.</div>
    </div>
    {tel('j3-cierre', 'Turno abierto: total, QR, efectivo, ticket promedio.')}
    {tel('j4-cerrar-modal', 'Al tocar “Cerrar caja”: efectivo contado y nota.')}
  </div>
  {pie(12)}
</section>""")

# ---------- 13 · Si algo sale mal ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">6 · SI ALGO SALE MAL</span>
  <h1>Qué hacer en cada caso</h1>
  <p class="grande">Casi todo se arregla con una de estas tres cosas: <b>esperar</b>, <b>recargar</b> o <b>volver a abrir el enlace</b>. Nada de lo que toques borra pedidos.</p>
  <table>
    <tr><th>Qué pasa</th><th>Qué ves</th><th>Qué hacer</th></tr>
    <tr><td>Se cortó internet</td><td>Arriba dice <b style="color:#E11B14">● reconectando…</b> en rojo.</td><td>Revisa el wifi o los datos del celular. Espera: la app se reconecta sola y trae los pedidos que llegaron mientras tanto. <b>No se pierde nada.</b></td></tr>
    <tr><td>La pantalla se quedó pegada o se ve rara</td><td>No cambia nada al tocar, o faltan botones.</td><td>Desliza hacia abajo para recargar (o toca ↻ en Chrome). Si sigue igual: cierra Chrome del todo y vuelve a abrir el enlace.</td></tr>
    <tr><td>Pide la clave otra vez</td><td>La pantalla “Personal del local”.</td><td>Escribe la misma clave de siempre. Pasa si alguien tocó “Salir” o se borraron datos de Chrome.</td></tr>
    <tr><td>No suena</td><td>Llega una comanda pero no hay alarma ni voz.</td><td>1) Si está el cartel verde “Toca aquí para activar el sonido”, tócalo. 2) Sube el volumen y quita el modo silencio del celular (en iPhone, la palanquita del costado). 3) Mira que “Sonido” esté en <b>ON</b>. 4) Recarga y vuelve a tocar el cartel.</td></tr>
    <tr><td>No llega una comanda que el cliente dice que envió</td><td>El cliente ve “Pedido P-0XX enviado” pero cocina no lo ve.</td><td>Mira que cocina diga “en vivo”. Recarga la pantalla de cocina. Pide al cliente el número del pedido (P-0XX) y búscalo en el filtro “Nuevas” o “En curso”.</td></tr>
    <tr><td>El cliente no puede escanear</td><td>El QR no abre nada.</td><td>Que use la cámara normal (no WhatsApp). Si el celular es viejo, que escriba el enlace del cliente (página 3) y ponga su mesa a mano en “Tu pedido”.</td></tr>
    <tr><td>El cliente no ve el QR de pago</td><td>Solo aparece “Pagar en caja”.</td><td>Caja no tiene subido el QR de cobro. Subirlo en Caja → “QR de cobro”. Mientras tanto cobra en efectivo o muestra el QR impreso.</td></tr>
    <tr><td>Toqué un botón sin querer</td><td>Marqué “Entregar” o “Agotada” antes de tiempo.</td><td>“Agotada”: tócala otra vez para volver a “Hay”. “Entregar”: el pedido va a “Entregadas”; sigue ahí, solo cocínalo igual. En Caja, “Cobrado” queda registrado; si fue error, anótalo en la nota del cierre.</td></tr>
  </table>
  {pie(13)}
</section>""")

# ---------- 14 · Plan B ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">6 · SI ALGO SALE MAL</span>
  <h1>Si MEZA no abre</h1>
  <div class="fila">
    <div class="col">
      <p class="grande">Muy rara vez, la página puede no abrir (se cayó el servidor o el internet del barrio). El local <b>no se detiene</b>:</p>
      {paso(1, 'Revisa que sea MEZA y no tu internet', '<p>Abre cualquier otra página (Google, Facebook). Si tampoco abre, es tu internet: usa los datos del celular o espera.</p>')}
      {paso(2, 'Avisa a Antonio por WhatsApp', '<p>Un mensaje corto: “MEZA no abre”. Él revisa el servidor. Casi siempre vuelve en minutos.</p>')}
      {paso(3, 'Plan B: toma pedidos a mano', '<p>Como siempre se hizo: libreta y voz. Los clientes pueden ver la carta impresa o las fotos del Facebook del local.</p>')}
      {paso(4, 'Cuando vuelva, sigue normal', '<p>Los pedidos que entraron por MEZA antes del corte siguen guardados. Los de la libreta se cobran en caja como siempre; si quieres que entren al cierre, no hace falta: anótalos en la nota del cierre.</p>')}
      <h2>Los datos no se pierden</h2>
      <p>Los pedidos, cobros, cierres y fotos de comprobantes viven en el servidor, no en el celular. Si se rompe, se pierde o se descarga el celular, se entra desde otro con el mismo enlace y la misma clave, y está todo.</p>
    </div>
    <div class="col">
      <h2>Lo que NO hay que hacer</h2>
      <div class="no"><b>No compartir</b> los enlaces de Cocina y Caja ni la clave con clientes. Solo personal.</div>
      <div class="no"><b>No borrar datos de Chrome</b> (“borrar historial / datos de sitios”): hace que pida la clave otra vez y desaparezcan los “Recibido” de ese celular.</div>
      <div class="no"><b>No cambiar precios ni platos</b> a mano: no se puede desde la app. Cualquier cambio de carta (precio, pizza nueva, foto) se le pide a Antonio y queda en minutos.</div>
      <div class="no"><b>No confirmar pagos QR sin ver la foto.</b></div>
      <div class="no"><b>No usar el navegador en modo incógnito:</b> cada vez pedirá la clave y no recordará nada.</div>
      <h2>Lo que SÍ se puede hacer sin miedo</h2>
      <div class="ok">Tocar cualquier botón de Cocina. Recargar la página mil veces. Cerrar y abrir Chrome. Cambiar de celular. Entrar desde la tablet y el celular a la vez. Nada de eso rompe nada.</div>
    </div>
  </div>
  {pie(14)}
</section>""")

# ---------- 15 · QR mesas ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">7 · LAS MESAS</span>
  <h1>Los QR de las 10 mesas</h1>
  <div class="fila">
    <div class="tel" style="width:58mm"><div class="marco" style="height:auto;box-shadow:5px 5px 0 #E11B14"><img src="{I['tarjeta']}"></div><div class="cap">Tarjeta de la mesa 1. Las diez son iguales, cambia el número.</div></div>
    <div class="col">
      <p class="grande">Cada tarjeta tiene un QR distinto que ya <b>trae el número de mesa adentro</b>. No hay que configurar nada en la app: solo poner cada tarjeta en su mesa.</p>
      {paso(1, 'Mesa 1 en la mesa 1, mesa 2 en la mesa 2…', '<p>El número está impreso grande en la tarjeta. Si se mezclan, la cocina recibe el pedido con la mesa equivocada.</p>')}
      {paso(2, 'Pruébalas una vez', '<p>Escanea el QR de la mesa 4 con tu celular: tiene que abrir la carta y, al tocar “Ver mi pedido”, mostrar <b>Mesa 4</b>. Hazlo con las 10 el primer día.</p>')}
      {paso(3, 'Si una se pierde o se mancha', '<p>Avisa a Antonio y te manda la misma tarjeta para reimprimir. El QR no cambia, así que una copia nueva funciona igual.</p>')}
      {paso(4, 'Si pones más mesas', '<p>Antonio genera las tarjetas 11, 12… en minutos. Funcionan al instante.</p>')}
      <div class="ojo"><b>Dónde ponerlas:</b> plastificadas o en un porta-menú acrílico, de pie, en la mitad de la mesa. Lejos del salero y de la grasa. Si está muy a la luz directa del sol, el reflejo molesta al escanear: mejor en sombra.</div>
      <div class="ok">El QR no tiene vencimiento. Solo cambia si algún día se cambia el enlace secreto del local (y eso lo haría Antonio avisando antes).</div>
    </div>
  </div>
  {pie(15)}
</section>""")

# ---------- 16 · FAQ + enlaces ----------
pages.append(f"""
<section class="pg">
  <span class="kicker">8 · PREGUNTAS Y CONTACTO</span>
  <h1>Preguntas frecuentes</h1>
  <table>
    <tr><td>¿El cliente tiene que bajar una app?</td><td>No. Escanea y se abre en el navegador. Funciona en cualquier celular con cámara e internet.</td></tr>
    <tr><td>¿Cuántos pedidos aguanta?</td><td>Todos los que entren. Cada pedido tiene su número (P-001, P-002…) y nunca se pisan entre sí.</td></tr>
    <tr><td>¿Se puede cambiar un precio o agregar una pizza?</td><td>Sí, pero lo hace Antonio. Se le manda un WhatsApp con el cambio y queda listo en minutos para todos los clientes.</td></tr>
    <tr><td>¿La Milanesa dice “Consultar”?</td><td>Falta el precio. Apenas la dueña lo pase, se pone y ya se podrá pedir desde la carta.</td></tr>
    <tr><td>¿Un cliente puede pedir algo que no está en la carta?</td><td>Puede escribirlo en “Nota para la cocina”. La cocina decide. El precio se cobra en caja.</td></tr>
    <tr><td>¿Y los pedidos por WhatsApp o para llevar?</td><td>Se siguen tomando como siempre. Si se quiere, la cocina los puede cargar desde el enlace de cliente dejando la mesa vacía o escribiendo “llevar”.</td></tr>
    <tr><td>¿Dónde están las fotos de los comprobantes?</td><td>En el PDF de cada cierre de caja y en el servidor por 90 días.</td></tr>
    <tr><td>¿Cuánto cuesta?</td><td>El piloto de El Garaje es gratis durante el primer mes. Después se conversa el plan.</td></tr>
    <tr><td>¿Quién ve los datos?</td><td>Solo el local (con la clave) y MEZA para dar soporte. Los clientes no dejan datos personales: solo su pedido y su mesa.</td></tr>
  </table>
  <div class="fila" style="margin-top:5mm">
    <div class="col">
      <h2>Contacto</h2>
      <p><b>Antonio Rengel · MEZA by ZETA</b><br>WhatsApp: ____________________<br>Horario de soporte: todos los días que el local esté abierto.</p>
      <p>Para pedir un cambio de carta, manda: <b>nombre del plato · precio · foto</b> (si es nuevo).</p>
    </div>
    <div class="col" style="border:3px solid #E11B14;padding:3.5mm 4mm;background:#FFE7B3">
      <div class="ps" style="font-size:7pt;color:#E11B14">SOLO PARA LA DUEÑA</div>
      <p style="margin-top:2mm;font-size:10pt">Clave de personal de Cocina y Caja. Si imprimes este manual para el personal, <b>recorta o tapa esta cajita</b>.</p>
      <div class="mono" style="font-size:18pt;font-weight:700;letter-spacing:.2em;margin:2mm 0">615395</div>
      <p style="font-size:9pt;margin:0">No se puede cambiar desde la app. Si hay que cambiarla, se le pide a Antonio.</p>
    </div>
  </div>
  <div style="position:absolute;left:14mm;right:14mm;bottom:18mm;display:flex;justify-content:space-between;align-items:center;border:3px solid #120A09;padding:3mm 5mm;background:#120A09;color:#FFF3E4">
    <div><div class="ps" style="font-size:7pt;color:#C6FF3D">LA MESA QUE ATIENDE.</div><div class="mono" style="font-size:8pt;margin-top:1.5mm;color:rgba(255,243,228,.7)">{URL}</div></div>
    <img src="{I['lockup']}" style="height:12mm;filter:invert(1) hue-rotate(180deg)">
  </div>
  {pie(16)}
</section>""")

HTML = f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>MEZA · Manual de El Garaje</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
out = R / 'entregas/manual'; out.mkdir(parents=True, exist_ok=True)
(out / 'manual.html').write_text(HTML, encoding='utf-8')
pdf = out / 'MEZA-manual-El-Garaje.pdf'
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
                f'--user-data-dir={R / ".marca-tmp/perfil4"}', '--no-pdf-header-footer', '--virtual-time-budget=20000', f'--print-to-pdf={pdf}', (out / 'manual.html').resolve().as_uri()],
               check=True, capture_output=True, timeout=240)
import fitz
d = fitz.open(pdf); print('paginas', len(d), 'KB', pdf.stat().st_size // 1024)
(R / '.marca-tmp').mkdir(exist_ok=True)
for i, p in enumerate(d): p.get_pixmap(dpi=50).save(str(R / f'.marca-tmp/man-{i + 1}.png'))
