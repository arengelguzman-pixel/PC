// Genera los activos de marca MEZA desde src/marca/meza.ts (misma geometría que la app).
//   npx tsx scripts/marca-meza.ts
// SVG → public/meza/ y public/favicon.svg. PNG (transparentes) → public/meza/ vía Chrome headless.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COLOR, EPOCAS, NOMBRE_EPOCA, svgIcono, svgIsotipo, svgWordmark } from '../src/marca/meza';

const raiz = resolve(import.meta.dirname, '..');
const out = resolve(raiz, 'public/meza');
const tmp = resolve(raiz, '.marca-tmp');
mkdirSync(out, { recursive: true }); mkdirSync(tmp, { recursive: true });

const ROJO = '#E11B14', MAIZ = '#F2B33D';
const PS = "font-family:'Press Start 2P';line-height:1";
const nombre = (fs: number, color = COLOR.lima, sombra = true) => `<div style="${PS};font-size:${fs}px;color:${color};${sombra ? `text-shadow:${Math.round(fs * 0.08)}px ${Math.round(fs * 0.08)}px 0 ${ROJO}` : ''}">MEZA</div>`;
const iso = (alto: number, epoca = 'pixel' as typeof EPOCAS[number], color = COLOR.lima) => `<div style="height:${alto}px;width:${alto * 0.75}px;flex:none">${svgIsotipo({ epoca, color, id: 'i' + epoca })}</div>`;
const lockup = (alto: number, color = COLOR.lima, sombra = true) => `<div style="display:flex;align-items:center;gap:${alto * 0.28}px">${iso(alto, 'pixel', color)}${nombre(Math.round(alto * 0.6), color, sombra)}</div>`;

// ---- SVG ----
for (const e of EPOCAS) {
  writeFileSync(resolve(out, `isotipo-${e}.svg`), svgIsotipo({ epoca: e }));
  writeFileSync(resolve(out, `icono-${e}.svg`), svgIcono({ epoca: e }));
}
writeFileSync(resolve(out, 'isotipo-negro.svg'), svgIsotipo({ color: COLOR.negro }));
writeFileSync(resolve(out, 'wordmark-pixel.svg'), svgWordmark({}));
writeFileSync(resolve(raiz, 'public/favicon.svg'), svgIcono({ epoca: 'pixel', radio: 20 }));

// ---- activos PNG: [ancho, alto, html] ----
const activos: Record<string, [number, number, string]> = {
  'lockup': [1800, 480, `<div style="display:flex;align-items:center;justify-content:center;height:100%">${lockup(360)}</div>`],
  'lockup-negro': [1800, 480, `<div style="display:flex;align-items:center;justify-content:center;height:100%">${lockup(360, COLOR.negro)}</div>`],
  'lockup-byzeta': [1800, 640, `<div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:center;height:100%;padding-right:120px;box-sizing:border-box">${lockup(360)}<div style="${PS};font-size:80px;color:${COLOR.lima};opacity:.85;margin-top:60px">by ZETA</div></div>`],
  'icono-180': [180, 180, svgIcono({ epoca: 'pixel' })],
  'icono-512': [512, 512, svgIcono({ epoca: 'pixel' })],
  // Redes: foto de perfil (1:1, fondo negro a sangre), portada y una historia de marca.
  'portada-facebook': [1640, 624, `<div style="background:${COLOR.negro};width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 120px;box-sizing:border-box">${lockup(260)}<div style="text-align:right"><div style="${PS};font-size:44px;color:${MAIZ};text-shadow:4px 4px 0 ${ROJO}">LA MESA<br>QUE ATIENDE.</div><div style="font-family:'JetBrains Mono';font-size:24px;color:${COLOR.crema};opacity:.6;margin-top:28px">Montero · Santa Cruz · Bolivia</div></div></div>`],
  'historia': [1080, 1920, `<div style="background:${COLOR.negro};width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:90px;box-sizing:border-box;padding:120px">${iso(420)}<div style="${PS};font-size:60px;color:${MAIZ};text-shadow:6px 6px 0 ${ROJO};text-align:center;line-height:1.35">TU CARTA<br>YA NO ES<br>UN PAPEL.</div><div style="${PS};font-size:30px;color:${COLOR.lima};text-align:center;line-height:1.6">LA MESA QUE ATIENDE.</div><div style="position:absolute;bottom:110px">${lockup(90)}</div></div>`],
};
for (const e of EPOCAS) {
  activos[`isotipo-${e}`] = [768, 1024, iso(1024, e)];
  activos[`icono-${e}`] = [1024, 1024, svgIcono({ epoca: e })];
  activos[`perfil-${e}`] = [1080, 1080, `<div style="background:${COLOR.negro};width:100%;height:100%;display:flex;align-items:center;justify-content:center">${iso(600, e)}</div>`];
}
// Hoja de contacto para revisar: firma, épocas del isotipo, perfiles y versión en claro.
activos['_hoja'] = [1600, 1000, `<div style="background:${COLOR.negro};width:1600px;height:1000px;padding:50px 60px;box-sizing:border-box;display:flex;flex-direction:column;gap:44px">
  <div style="display:flex;align-items:center;justify-content:space-between">${lockup(150)}<div style="display:flex;flex-direction:column;align-items:flex-end">${lockup(80)}<div style="${PS};font-size:20px;color:${COLOR.lima};opacity:.85;margin-top:14px">by ZETA</div></div></div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:30px;text-align:center">${EPOCAS.map((e, i) => `<div><div style="display:flex;justify-content:center">${iso(180, e)}</div><div style="${PS};font-size:13px;color:${COLOR.lima};margin-top:18px">${i + 1}. ${e.toUpperCase()}</div><div style="font-family:'JetBrains Mono';font-size:13px;color:#888;margin-top:8px">${NOMBRE_EPOCA[e]}</div></div>`).join('')}</div>
  <div style="display:flex;gap:30px;align-items:center">
    <div style="width:170px;height:170px;border-radius:50%;overflow:hidden;background:${COLOR.negro};border:3px solid #333;display:flex;align-items:center;justify-content:center">${iso(96)}</div>
    <div style="width:170px;height:170px;border-radius:38px;overflow:hidden">${svgIcono({ epoca: 'pixel' })}</div>
    <div style="flex:1;background:#fff;border-radius:16px;height:170px;display:flex;align-items:center;justify-content:space-around;padding:0 40px">${lockup(110, COLOR.negro)}<div style="width:110px;height:110px">${svgIcono({ epoca: 'iso', fondo: '#fff', color: COLOR.negro })}</div>${lockup(70, COLOR.negro, false)}</div>
  </div>
</div>`];

const fuente = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=JetBrains+Mono:wght@500;700&family=Inter+Tight:wght@400;600;700&display=swap" rel="stylesheet">';
const html = `<!doctype html><html><head><meta charset="utf-8">${fuente}<style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block;width:100%;height:100%}#w,#w>*{width:100%;height:100%;position:relative}</style></head><body><div id="w"></div>
<script>const A=${JSON.stringify(Object.fromEntries(Object.entries(activos).map(([k, v]) => [k, v[2]])))};const a=new URLSearchParams(location.search).get('a');document.getElementById('w').innerHTML=A[a]||'';</script></body></html>`;
const hojaPath = resolve(tmp, 'marca.html');
writeFileSync(hojaPath, html);

// ---- PNG con Chrome headless ----
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chrome) { console.log('Sin Chrome: solo SVG generados.'); process.exit(0); }
for (const [n, [w, h]] of Object.entries(activos)) {
  const destino = resolve(n.startsWith('_') ? tmp : out, `${n}.png`);
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${resolve(tmp, 'perfil')}`, '--default-background-color=00000000', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, '--virtual-time-budget=8000', `--screenshot=${destino}`,
    `${pathToFileURL(hojaPath).href}?a=${n}`,
  ], { stdio: 'ignore', timeout: 60000 });
  console.log('ok', n, `${w}x${h}`);
}
