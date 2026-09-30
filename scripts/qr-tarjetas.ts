// Tarjetas de mesa (PNG por mesa + un PDF con todas) a partir de los QR crudos de qr-mesas.mjs.
// Diseño MEZA, minimalista y oscuro: la tarjeta posiciona nuestra marca, no la del local.
//   npx tsx scripts/qr-tarjetas.ts <qrDir> <outDir> <cantidad>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COLOR, svgIsotipo } from '../src/marca/meza';

const [qrDir, outDir, nArg] = process.argv.slice(2);
if (!qrDir || !outDir || !nArg) { console.log('uso: npx tsx scripts/qr-tarjetas.ts <qrDir> <outDir> <cantidad>'); process.exit(1); }
const n = parseInt(nArg, 10);
const out = resolve(outDir); mkdirSync(out, { recursive: true });
const W = 1240, H = 1754; // A6 a 300 dpi (105 × 148 mm)
const ROJO = '#E11B14', MAIZ = '#F2B33D';

const tarjeta = (i: number) => `<div class="card">
  <div class="marca"><div class="iso">${svgIsotipo({ epoca: 'pixel', id: 'z' + i })}</div><div class="ps nombre">MEZA</div></div>
  <div class="qr"><img src="${pathToFileURL(resolve(qrDir, `qr-${i}.png`)).href}"></div>
  <div class="ps mesa">MESA ${i}</div>
  <div class="hint">Escanea y pide desde tu mesa</div>
  <div class="pie"><span>MEZA by ZETA</span><span>La mesa que atiende.</span></div>
</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=JetBrains+Mono:wght@500&family=Inter+Tight:wght@500&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:${COLOR.negro};overflow:hidden}
.card{width:${W}px;height:${H}px;background:${COLOR.negro};color:${COLOR.crema};position:relative;box-sizing:border-box;padding:96px 90px;display:flex;flex-direction:column;align-items:center}
.ps{font-family:'Press Start 2P';line-height:1}
.marca{align-self:flex-start;display:flex;align-items:center;gap:26px}
.iso{width:72px;height:96px}.iso svg{display:block;width:100%;height:100%}
.nombre{font-size:56px;color:${COLOR.lima};text-shadow:5px 5px 0 ${ROJO}}
.qr{margin-top:110px;background:#fff;border-radius:40px;padding:40px;line-height:0}
.qr img{width:820px;height:820px;image-rendering:pixelated;display:block}
.mesa{margin-top:100px;font-size:120px;color:${MAIZ};text-shadow:8px 8px 0 ${ROJO}}
.hint{margin-top:56px;font-family:'Inter Tight';font-weight:500;font-size:40px;color:${COLOR.crema};opacity:.75}
.pie{position:absolute;left:90px;right:90px;bottom:70px;border-top:6px solid ${COLOR.lima};padding-top:30px;display:flex;justify-content:space-between;font-family:'JetBrains Mono';font-size:26px;color:${COLOR.crema};opacity:.55}
</style></head><body><div id="w"></div>
<script>const T=${JSON.stringify(Array.from({ length: n }, (_, k) => tarjeta(k + 1)))};const p=+new URLSearchParams(location.search).get('p');document.getElementById('w').innerHTML=T[p-1]||'';</script>
</body></html>`;
const tmp = resolve(out, '.tmp'); mkdirSync(tmp, { recursive: true });
const hojaPath = resolve(tmp, 'tarjetas.html'); writeFileSync(hojaPath, html);

const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chrome) { console.log('Sin Chrome instalado.'); process.exit(1); }
for (let i = 1; i <= n; i++) {
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
    `--user-data-dir=${resolve(tmp, 'perfil')}`, '--force-device-scale-factor=1', `--window-size=${W},${H}`, '--virtual-time-budget=8000',
    `--screenshot=${resolve(out, `mesa-${i}.png`)}`, `${pathToFileURL(hojaPath).href}?p=${i}`,
  ], { stdio: 'ignore', timeout: 60000 });
  console.log('ok mesa', i);
}
// PDF con todas las tarjetas (300 dpi) vía PIL.
execFileSync('python', ['-c', `
from PIL import Image
p=[Image.open(r'${out.replace(/\\/g, '/')}/mesa-%d.png'%i).convert('RGB') for i in range(1,${n}+1)]
p[0].save(r'${out.replace(/\\/g, '/')}/mesas-imprimir.pdf','PDF',resolution=300,save_all=True,append_images=p[1:])
`], { stdio: 'inherit' });
console.log(`${n} tarjetas + PDF en ${out}`);
