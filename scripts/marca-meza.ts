// Genera los activos de marca MEZA desde src/marca/meza.ts (misma geometría que la app).
//   npx tsx scripts/marca-meza.ts [carpetaSalidaPng]
// SVG → public/meza/ y public/favicon.svg. PNG (transparentes) → public/meza/ vía Chrome headless.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COLOR, EPOCAS, NOMBRE_EPOCA, svgIcono, svgWordmark } from '../src/marca/meza';

const raiz = resolve(import.meta.dirname, '..');
const out = resolve(raiz, 'public/meza');
const tmp = resolve(process.argv[2] ?? resolve(raiz, '.marca-tmp'));
mkdirSync(out, { recursive: true }); mkdirSync(tmp, { recursive: true });

// ---- SVG ----
writeFileSync(resolve(out, 'logo.svg'), svgWordmark({}));
writeFileSync(resolve(out, 'logo-negro.svg'), svgWordmark({ color: COLOR.negro }));
writeFileSync(resolve(out, 'logo-crema.svg'), svgWordmark({ color: COLOR.crema }));
for (const e of EPOCAS) writeFileSync(resolve(out, `icono-${e}.svg`), svgIcono({ epoca: e }));
writeFileSync(resolve(raiz, 'public/favicon.svg'), svgIcono({ epoca: 'pixel', radio: 20 }));

// ---- hoja HTML: cada activo se muestra solo con ?a=<nombre> ----
const fuente = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">';
const activos: Record<string, [number, number, string]> = {
  'logo': [2400, 900, svgWordmark({})],
  'logo-negro': [2400, 900, svgWordmark({ color: COLOR.negro })],
  'logo-fondo': [2400, 900, svgWordmark({ fondo: COLOR.negro })],
  'lockup': [2400, 1160, `<div style="display:flex;flex-direction:column;align-items:flex-end;width:2400px">${svgWordmark({})}<div style="font-family:'Press Start 2P';font-size:96px;color:${COLOR.lima};margin:40px 100px 0 0">by ZETA</div></div>`],
  'lockup-negro': [2400, 1160, `<div style="display:flex;flex-direction:column;align-items:flex-end;width:2400px">${svgWordmark({ color: COLOR.negro })}<div style="font-family:'Press Start 2P';font-size:96px;color:${COLOR.negro};margin:40px 100px 0 0">by ZETA</div></div>`],
  'icono-180': [180, 180, svgIcono({ epoca: 'pixel' })],
  'icono-512': [512, 512, svgIcono({ epoca: 'pixel' })],
};
for (const e of EPOCAS) activos[`icono-${e}`] = [1024, 1024, svgIcono({ epoca: e })];
for (const e of EPOCAS) activos[`logo-${e}`] = [2400, 900, svgWordmark({ epoca: e })];
// Hoja de contacto (para revisar): las 4 épocas del wordmark y del ícono, sobre negro.
const hoja = `<div style="background:${COLOR.negro};width:1600px;height:1000px;padding:40px;box-sizing:border-box;font-family:'Press Start 2P';color:#888;font-size:14px">
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">
    ${EPOCAS.map((e, i) => `<div style="text-align:center"><div style="height:130px">${svgWordmark({ epoca: e })}</div><div style="margin-top:10px;color:${COLOR.lima}">${i + 1}. ${e.toUpperCase()}</div><div style="margin-top:6px;font-size:10px">${NOMBRE_EPOCA[e]}</div></div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:40px">
    ${EPOCAS.map((e) => `<div style="text-align:center"><div style="width:220px;height:220px;margin:0 auto">${svgIcono({ epoca: e })}</div></div>`).join('')}
  </div>
  <div style="display:flex;gap:40px;align-items:center;margin-top:50px;background:#fff;padding:30px;border-radius:12px">
    <div style="height:110px;flex:1">${svgWordmark({ color: COLOR.negro })}</div>
    <div style="height:110px;flex:1">${svgWordmark({ color: COLOR.negro, epoca: 'iso' })}</div>
    <div style="width:110px;height:110px">${svgIcono({ epoca: 'pixel', fondo: '#fff', color: COLOR.negro })}</div>
    <div style="font-size:22px;color:${COLOR.negro};white-space:nowrap">MEZA<br><span style="font-size:12px">by ZETA</span></div>
  </div>
</div>`;
activos['_hoja'] = [1600, 1000, hoja];

const html = `<!doctype html><html><head><meta charset="utf-8">${fuente}<style>html,body{margin:0;background:transparent}svg{display:block;width:100%;height:100%}#w>*{width:100%;height:100%}</style></head><body><div id="w"></div>
<script>const A=${JSON.stringify(Object.fromEntries(Object.entries(activos).map(([k, v]) => [k, v[2]])))};const a=new URLSearchParams(location.search).get('a');document.getElementById('w').innerHTML=A[a]||'';</script></body></html>`;
const hojaPath = resolve(tmp, 'marca.html');
writeFileSync(hojaPath, html);

// ---- PNG con Chrome headless ----
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chrome) { console.log('Sin Chrome: solo SVG generados.'); process.exit(0); }
for (const [nombre, [w, h]] of Object.entries(activos)) {
  const destino = resolve(nombre.startsWith('_') ? tmp : out, `${nombre}.png`);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${resolve(tmp, 'perfil')}`, '--default-background-color=00000000', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, '--virtual-time-budget=6000', `--screenshot=${destino}`,
    `${pathToFileURL(hojaPath).href}?a=${nombre}`,
  ], { stdio: 'ignore', timeout: 60000 });
  console.log('✓', nombre, `${w}×${h}`);
}
