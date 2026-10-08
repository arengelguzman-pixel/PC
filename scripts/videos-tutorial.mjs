// Videos tutoriales (vertical, para WhatsApp) grabados sobre el sandbox real con
// puppeteer + narración de ElevenLabs (entregas/manual/narracion/*.mp3, meta.json).
//   node scripts/capturas-manual.mjs   (no hace falta; los videos no dependen de las capturas)
//   node scripts/videos-tutorial.mjs [v1|v2|v3|v4]   → entregas/manual/videos/*.mp4
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const BASE = 'https://meza.arengel-guzman.workers.dev';
const TOKEN = 'elgaraje-prueba-x9q4', LOCAL = 'el-garaje-test', CLAVE = 'test1234';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FF = execFileSync('python', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const NAR = path.resolve('entregas/manual/narracion');
const META = JSON.parse(fs.readFileSync(path.join(NAR, 'meta.json'), 'utf8'));
const OUT = path.resolve('entregas/manual/videos'); fs.mkdirSync(OUT, { recursive: true });
const SOLO = process.argv[2];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = (p, body) => fetch(`${BASE}/api/sala/${LOCAL}${p}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (prueba MEZA)' }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());

// cursor falso + subtítulo arriba (se graban dentro de la página)
const OVERLAY = `(() => { if (document.getElementById('mz-cursor')) return;
  const c = document.createElement('div'); c.id = 'mz-cursor';
  c.style.cssText = 'position:fixed;z-index:2147483647;width:46px;height:46px;border-radius:50%;background:rgba(198,255,61,.55);border:3px solid #120A09;left:-100px;top:-100px;transform:translate(-50%,-50%);transition:left .5s ease,top .5s ease;pointer-events:none;box-shadow:0 0 0 4px rgba(18,10,9,.25)';
  const k = document.createElement('div'); k.id = 'mz-cap';
  k.style.cssText = 'position:fixed;z-index:2147483646;left:12px;right:12px;top:68px;background:rgba(18,10,9,.93);color:#FFF3E4;font:600 17px/1.35 "Inter Tight",system-ui,sans-serif;padding:11px 14px;border:3px solid #C6FF3D;border-radius:10px;opacity:0;transition:opacity .3s;pointer-events:none';
  document.body.append(c, k); })()`;
const prep = (page) => page.evaluate(OVERLAY);
const cap = (page, t) => page.evaluate((x) => { const k = document.getElementById('mz-cap'); if (!k) return; k.textContent = x; k.style.opacity = x ? 1 : 0; }, t);

async function tap(page, texto, selector = 'button') {
  await prep(page);
  const r = await page.evaluate((t, sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => (e.innerText || '').replace(/\s+/g, ' ').toLowerCase().includes(t.toLowerCase()));
    if (!el) return null; el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  }, texto, selector);
  if (!r) throw new Error(`no encontré "${texto}"`);
  await page.evaluate(({ x, y }) => { const c = document.getElementById('mz-cursor'); c.style.left = x + 'px'; c.style.top = y + 'px'; }, r);
  await sleep(650);
  await page.evaluate(() => document.getElementById('mz-cursor').animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(.55)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 320 }));
  await page.mouse.click(r.x, r.y);
  await sleep(500);
}
const esconderCursor = (page) => page.evaluate(() => { const c = document.getElementById('mz-cursor'); if (c) { c.style.left = '-100px'; c.style.top = '-100px'; } });

// una grabación: devuelve helpers que anotan en qué segundo arranca cada narración
async function grabar(page, nombre, fn) {
  const webm = path.join(OUT, `_${nombre}.webm`);
  const rec = await page.screencast({ path: webm, ffmpegPath: FF });
  const t0 = Date.now();
  const pistas = [];
  const narrar = async (clip) => {           // muestra el subtítulo y espera lo que dura el audio
    pistas.push({ clip, at: (Date.now() - t0) / 1000 });
    await cap(page, META[clip].texto);
    return sleep(META[clip].dur * 1000 + 350);
  };
  await sleep(800);
  await fn(narrar);
  await cap(page, ''); await esconderCursor(page); await sleep(1200);
  await rec.stop();
  const total = (Date.now() - t0) / 1000;
  // mezcla: cada narración entra en su segundo; video a 720 px de ancho, h264 + aac
  const args = ['-y', '-i', webm];
  pistas.forEach((p) => args.push('-i', path.join(NAR, `${p.clip}.mp3`)));
  const fil = pistas.map((p, i) => `[${i + 1}:a]adelay=${Math.round(p.at * 1000)}|${Math.round(p.at * 1000)}[a${i}]`).join(';')
    + `;${pistas.map((_, i) => `[a${i}]`).join('')}amix=inputs=${pistas.length}:normalize=0[a]`;
  args.push('-filter_complex', fil, '-map', '0:v', '-map', '[a]', '-vf', 'scale=720:-2,fps=30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-t', String(total.toFixed(2)), path.join(OUT, `${nombre}.mp4`));
  execFileSync(FF, args, { stdio: 'ignore' });
  fs.unlinkSync(webm);
  console.log('✓', nombre, total.toFixed(1) + 's');
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const movil = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// ---------- V1 · cómo pide el cliente ----------
if (!SOLO || SOLO === 'v1') {
  await api('/qr').then(async (r) => { if (!r.qr) console.log('aviso: el sandbox no tiene QR de cobro; sube uno antes para ver el flujo QR'); });
  const page = await browser.newPage(); await page.setViewport(movil);
  await page.goto(`${BASE}/m/${TOKEN}?mesa=3`, { waitUntil: 'networkidle2' }); await sleep(1500); await prep(page);
  await grabar(page, 'meza-1-cliente', async (narrar) => {
    let fin = narrar('v1-1');
    await sleep(2500); await page.evaluate(() => window.scrollBy({ top: 420, behavior: 'smooth' })); await fin;
    fin = narrar('v1-2');
    await tap(page, 'Napolitana', 'article'); await sleep(900); await tap(page, 'Familiar'); await sleep(500);
    const inp = await page.$('input[placeholder^="Ej: sin aceitunas"]'); if (inp) { await inp.click(); await inp.type('sin aceitunas', { delay: 70 }); }
    await fin;
    fin = narrar('v1-3');
    await tap(page, 'Agregar ·'); await sleep(1200); await tap(page, 'Ver mi pedido'); await fin;
    fin = narrar('v1-4');
    await sleep(1500); if (await page.evaluate(() => document.body.innerText.toLowerCase().includes('pagar con qr'))) await tap(page, 'Pagar con QR');
    await sleep(800); await tap(page, 'Hacer pedido'); await fin;
    fin = narrar('v1-5');
    await sleep(2500);
    const file = await page.$('input[type=file]');
    if (file) { await file.uploadFile(path.resolve('entregas/manual/comprobante-prueba.jpg')); await sleep(3500); await tap(page, 'Cerrar'); }
    await sleep(600); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await fin;
  });
  await page.close();
}

// ---------- V2 · cocina ----------
if (!SOLO || SOLO === 'v2') {
  const page = await browser.newPage(); await page.setViewport(movil);
  await page.goto(`${BASE}/m/${TOKEN}?vista=cocina`, { waitUntil: 'networkidle2' }); await sleep(1200); await prep(page);
  await grabar(page, 'meza-2-cocina', async (narrar) => {
    let fin = narrar('v2-1');
    await sleep(1500); const inp = await page.$('input[type=password]'); await inp.click(); await inp.type(CLAVE, { delay: 120 }); await tap(page, 'Entrar'); await sleep(1500); await prep(page); await fin;
    fin = narrar('v2-2');
    await api('/pedidos', { mesa: '5', items: [{ key: 'pep-f', slug: 'peperoni', n: 'Peperoni', tamK: 'familiar', tamT: 'Familiar', borde: true, p: 75, q: 1, nota: 'bien cocida' }], nota: '', total: 75, metodo: 'efectivo' });
    await fin;
    fin = narrar('v2-3'); await sleep(800); await tap(page, 'Recibido'); await fin;
    fin = narrar('v2-4'); await tap(page, 'Al horno'); await sleep(1300); await tap(page, 'Lista'); await sleep(1300); await tap(page, 'Entregar'); await fin;
    fin = narrar('v2-5');
    await page.evaluate(() => [...document.querySelectorAll('h2')].find((h) => /disponibilidad/i.test(h.innerText))?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    await sleep(1800); await tap(page, 'Hay'); await sleep(2200); await tap(page, 'Agotada'); await fin;
  });
  await page.close();
}

// ---------- V3 · caja ----------
if (!SOLO || SOLO === 'v3') {
  // deja un efectivo pendiente y un QR por confirmar
  await api('/pedidos', { mesa: '2', items: [{ key: 'muz-m', slug: 'muzza', n: 'Muzza', tamK: 'mediana', tamT: 'Mediana', borde: false, p: 45, q: 1 }], nota: '', total: 45, metodo: 'efectivo' });
  const q = await api('/pedidos', { mesa: '4', items: [{ key: 'sup-f', slug: 'suprema', n: 'Suprema', tamK: 'familiar', tamT: 'Familiar', borde: false, p: 65, q: 1 }], nota: '', total: 65, metodo: 'qr' });
  const b64 = fs.readFileSync(path.resolve('entregas/manual/comprobante-prueba.jpg')).toString('base64');
  await api(`/pedidos/${q.pedido.id}/comprobante`, { comprobante: 'data:image/jpeg;base64,' + b64 });
  const page = await browser.newPage(); await page.setViewport(movil);
  await page.evaluateOnNewDocument((k, v) => localStorage.setItem(k, v), `pv_clave_${LOCAL}`, CLAVE);
  await page.goto(`${BASE}/m/${TOKEN}?vista=caja`, { waitUntil: 'networkidle2' }); await sleep(1500); await prep(page);
  await grabar(page, 'meza-3-caja', async (narrar) => {
    let fin = narrar('v3-1'); await sleep(1000); await page.evaluate(() => window.scrollBy({ top: 120, behavior: 'smooth' })); await fin;
    fin = narrar('v3-2'); await sleep(600); await tap(page, 'Cobrado en efectivo'); await fin;
    fin = narrar('v3-3'); await tap(page, 'Ver comprobante'); await sleep(2500); await tap(page, 'Confirmar pago'); await fin;
    fin = narrar('v3-4');
    await page.evaluate(() => [...document.querySelectorAll('h2,p,div')].find((h) => /turno abierto/i.test(h.innerText || ''))?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    await sleep(2500); await tap(page, 'Cerrar caja'); await sleep(900);
    const c = await page.$('input[inputmode=decimal]'); if (c) { await c.click(); await c.type('110', { delay: 120 }); }
    await sleep(600); await tap(page, 'Confirmar cierre'); await fin;
    fin = narrar('v3-5'); await sleep(1500);
    await page.evaluate(() => [...document.querySelectorAll('*')].find((h) => /cierres anteriores/i.test(h.innerText || '') && h.children.length < 4)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    await fin;
  });
  await page.close();
}

// ---------- V4 · si algo falla (láminas) ----------
if (!SOLO || SOLO === 'v4') {
  const lam = [
    ['📶', 'Se cortó internet', 'Arriba dice <b style="color:#E11B14">● reconectando…</b><br>Revisa wifi o datos y espera.<br>Se reconecta solo. No se pierde nada.'],
    ['🔄', 'Pantalla pegada o rara', 'Desliza hacia abajo para recargar.<br>Si sigue igual: cierra Chrome<br>y vuelve a abrir el enlace.'],
    ['🔑', 'Pide la clave otra vez', 'Escríbela de nuevo.<br>Es la misma de siempre.'],
    ['🆘', 'Nada funciona', 'Caja vuelve a subir el QR de cobro.<br>Escríbele a Antonio por WhatsApp.<br>Mientras tanto: pedidos a mano.'],
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter+Tight:wght@500;700;800&display=swap');
    body{margin:0;background:#E11B14;color:#FFF3E4;font-family:'Inter Tight',system-ui,sans-serif;width:390px;height:844px;overflow:hidden}
    .s{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:28px;opacity:0;transition:opacity .5s}
    .s.on{opacity:1}.i{font-size:96px;line-height:1}.t{font-family:'Press Start 2P',monospace;font-size:15px;line-height:1.6;margin:28px 0 18px;text-shadow:3px 3px 0 #120A09}
    .d{font-size:21px;line-height:1.45;font-weight:600;background:#120A09;padding:18px 16px;border:3px solid #FFF3E4}
    .n{position:absolute;top:22px;left:22px;font-family:'Press Start 2P',monospace;font-size:10px;background:#120A09;color:#C6FF3D;padding:8px 10px}
    .f{position:absolute;bottom:22px;left:0;right:0;text-align:center;font-family:'Press Start 2P',monospace;font-size:9px;color:#FFF3E4;opacity:.85}
  </style></head><body>${lam.map(([i, t, d], n) => `<section class="s" id="s${n}"><div class="n">SI ALGO FALLA · ${n + 1}/4</div><div class="i">${i}</div><div class="t">${t}</div><div class="d">${d}</div><div class="f">MEZA · LA MESA QUE ATIENDE.</div></section>`).join('')}</body></html>`;
  const f = path.join(OUT, '_fallas.html'); fs.writeFileSync(f, html);
  const page = await browser.newPage(); await page.setViewport(movil);
  await page.goto('file:///' + f.replace(/\\/g, '/'), { waitUntil: 'networkidle0' }); await sleep(1500);
  await grabar(page, 'meza-4-si-algo-falla', async (narrar) => {
    for (let n = 0; n < 4; n++) {
      await page.evaluate((n) => { document.querySelectorAll('.s').forEach((s, i) => s.classList.toggle('on', i === n)); }, n);
      await narrar(`v4-${n + 1}`); await sleep(400);
    }
  });
  fs.unlinkSync(f);
  await page.close();
}

await browser.close();
console.log('listo →', OUT);
