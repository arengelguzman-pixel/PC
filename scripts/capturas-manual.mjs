// Capturas reales de la interfaz (sandbox El Garaje · PRUEBA) para el manual en PDF.
//   node scripts/capturas-manual.mjs [urlBase]
// Usa Chrome instalado vía puppeteer-core. Deja los PNG en entregas/manual/capturas/.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'https://meza.arengel-guzman.workers.dev';
const TOKEN = 'elgaraje-prueba-x9q4', LOCAL = 'el-garaje-test', CLAVE = 'test1234';
const OUT = path.resolve('entregas/manual/capturas');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) }).then(() => console.log('✓', name));
// clic por texto visible (botones / artículos), sin depender de clases
async function clickText(page, texto, selector = 'button') {
  const ok = await page.evaluate((t, sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => (e.innerText || '').replace(/\s+/g, ' ').toLowerCase().includes(t.toLowerCase()));
    if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true;
  }, texto, selector);
  if (!ok) throw new Error(`no encontré "${texto}" (${selector})`);
  await sleep(500);
}
const esperaTexto = (page, t) => page.waitForFunction((x) => document.body.innerText.toLowerCase().includes(x.toLowerCase()), { timeout: 20000 }, t);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const movil = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// ---------- CLIENTE (mesa 3) ----------
{
  const page = await browser.newPage();
  await page.setViewport(movil);
  await page.goto(`${BASE}/m/${TOKEN}?mesa=3`, { waitUntil: 'networkidle2' });
  await esperaTexto(page, 'Napolitana'); await sleep(1200);
  await shot(page, 'c1-menu');
  await page.evaluate(() => [...document.querySelectorAll('h3')].find((h) => h.innerText.includes('Napolitana'))?.scrollIntoView({ block: 'center' }));
  await sleep(600); await shot(page, 'c2-pizzas');
  await clickText(page, 'Napolitana', 'article');
  await esperaTexto(page, 'Tamaño'); await sleep(400);
  await shot(page, 'c3-detalle');
  await clickText(page, 'Familiar');
  const inp = await page.$('input[placeholder^="Ej: sin aceitunas"]');
  if (inp) { await inp.type('sin aceitunas, bien cocida'); }
  await sleep(300); await shot(page, 'c4-detalle-lleno');
  await clickText(page, 'Agregar ·');
  await sleep(600); await shot(page, 'c5-agregado');
  await clickText(page, 'Ver mi pedido');
  await esperaTexto(page, '¿Cómo pagas?'); await sleep(400);
  await shot(page, 'c6-carrito');
  await clickText(page, 'Hacer pedido');
  await esperaTexto(page, 'Seguimiento'); await sleep(1500);
  await shot(page, 'c7-seguimiento');
  // si hay QR en el local, la hoja de pago se abre sola: QR del local + subir comprobante
  if (await page.evaluate(() => document.body.innerText.toLowerCase().includes('subir comprobante'))) {
    await sleep(500); await shot(page, 'c8-pago-qr');
    const file = await page.$('input[type=file]');
    if (file) {
      await file.uploadFile(path.resolve(process.env.COMPROBANTE || 'entregas/manual/comprobante-prueba.jpg'));
      await sleep(5000); await shot(page, 'c9-comprobante-subido');
    }
  }
  await page.close();
}

// ---------- COCINA ----------
{
  const page = await browser.newPage();
  await page.setViewport(movil);
  await page.goto(`${BASE}/m/${TOKEN}?vista=cocina`, { waitUntil: 'networkidle2' });
  await esperaTexto(page, 'Personal del local'); await sleep(400);
  await shot(page, 'k0-clave');
  await page.type('input[type=password]', CLAVE);
  await clickText(page, 'Entrar');
  await esperaTexto(page, 'Cocina ·'); await sleep(1500);
  await shot(page, 'k1-comandas');
  if (await page.evaluate(() => document.body.innerText.toLowerCase().includes('recibido'))) {
    await clickText(page, 'Recibido'); await sleep(600); await shot(page, 'k2-recibido');
  }
  if (await page.evaluate(() => document.body.innerText.toLowerCase().includes('al horno'))) {
    await clickText(page, 'Al horno'); await sleep(900); await shot(page, 'k3-en-horno');
  }
  await page.evaluate(() => [...document.querySelectorAll('h2')].find((h) => h.innerText.includes('Disponibilidad'))?.scrollIntoView({ block: 'start' }));
  await sleep(600); await shot(page, 'k4-disponibilidad');
  // tablet / compu
  await page.setViewport({ width: 1180, height: 760, deviceScaleFactor: 1.5 });
  await page.reload({ waitUntil: 'networkidle2' }); await esperaTexto(page, 'Cocina ·'); await sleep(1200);
  await shot(page, 'k5-tablet');
  await page.close();
}

// ---------- CAJA ----------
{
  const page = await browser.newPage();
  await page.setViewport(movil);
  await page.evaluateOnNewDocument((k, v) => localStorage.setItem(k, v), `pv_clave_${LOCAL}`, CLAVE);
  await page.goto(`${BASE}/m/${TOKEN}?vista=caja`, { waitUntil: 'networkidle2' });
  await esperaTexto(page, 'Caja ·'); await sleep(1500);
  await shot(page, 'j1-caja');
  if (await page.evaluate(() => document.body.innerText.toLowerCase().includes('ver comprobante'))) {
    await clickText(page, 'Ver comprobante'); await sleep(1800); await shot(page, 'j2-comprobante');
    await clickText(page, '✕'); await sleep(500);
  }
  await page.evaluate(() => [...document.querySelectorAll('h2,p,span')].find((h) => /cierre de caja/i.test(h.innerText || ''))?.scrollIntoView({ block: 'start' }));
  await sleep(600); await shot(page, 'j3-cierre');
  if (await page.evaluate(() => document.body.innerText.toLowerCase().includes('cerrar caja'))) {
    await clickText(page, 'Cerrar caja'); await sleep(600); await shot(page, 'j4-cerrar-modal');
  }
  await page.close();
}

await browser.close();
console.log('listo →', OUT);
