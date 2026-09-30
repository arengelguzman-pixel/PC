// Clip de marca sin IA ni créditos: la Z recorre sus épocas con glitch (misma
// animación que la app) y cierra con el eslogan. Cuadros vía Chrome headless +
// ffmpeg (imageio_ffmpeg). Salida 9:16 (reels/stories) y 1:1 (perfil/feed).
//   npx tsx scripts/marca-clip.ts [outDir]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { COLOR, EPOCAS, svgIsotipo } from '../src/marca/meza';

const raiz = resolve(import.meta.dirname, '..');
const out = resolve(process.argv[2] ?? resolve(raiz, 'entregas/marca'));
const tmp = resolve(raiz, '.marca-tmp/clip'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true }); mkdirSync(out, { recursive: true });

const FPS = 24, W = 1080, H = 1920, POR_HOJA = 6;
const EPOCA_MS = 1400, GLITCH_MS = 360, CIERRE_MS = 2600;
const TOTAL_MS = EPOCAS.length * EPOCA_MS + CIERRE_MS;      // 8.2 s
const N = Math.round(TOTAL_MS / 1000 * FPS);

const ROJO = '#E11B14', MAIZ = '#F2B33D';
const capa = (ep: string, cls: string, fase: number) => `<div class="capa ${cls}" style="animation-delay:-${fase}ms">${svgIsotipo({ epoca: ep as typeof EPOCAS[number], id: 'z' + ep + cls })}</div>`;

// Un cuadro = estado de la animación en el instante t (ms).
function cuadro(t: number): string {
  const i = Math.min(EPOCAS.length - 1, Math.floor(t / EPOCA_MS));
  const fase = t - i * EPOCA_MS;
  const enCierre = t >= EPOCAS.length * EPOCA_MS;
  const ep = EPOCAS[i], prev = EPOCAS[(i + EPOCAS.length - 1) % EPOCAS.length];
  const glitch = !enCierre && i > 0 && fase < GLITCH_MS;
  const tc = enCierre ? (t - EPOCAS.length * EPOCA_MS) / CIERRE_MS : 0;      // 0..1 dentro del cierre
  const sub = enCierre ? Math.min(1, tc * 3) : 0;                            // el eslogan entra rápido
  const nombreOp = Math.min(1, t / 400);
  return `<div class="f">
    <div class="z">${glitch ? capa(prev, 'logo-gl-a', fase) + capa(ep, 'logo-gl-b', fase) : capa(ep, '', 0)}</div>
    <div class="nombre" style="opacity:${nombreOp}">MEZA</div>
    <div class="eslogan" style="opacity:${sub};transform:translateY(${(1 - sub) * 30}px)">LA MESA<br>QUE ATIENDE.</div>
    <div class="pie" style="opacity:${sub * 0.8}">by ZETA</div>
  </div>`;
}

const html = (t0: number, n: number) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:${COLOR.negro};overflow:hidden}
.f{width:${W}px;height:${H}px;background:${COLOR.negro};position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:70px;font-family:'Press Start 2P';line-height:1}
.z{position:relative;width:360px;height:480px}
.capa{position:absolute;inset:0}.capa svg{display:block;width:100%;height:100%}
.nombre{font-size:120px;color:${COLOR.lima};text-shadow:10px 10px 0 ${ROJO}}
.eslogan{position:absolute;top:1300px;font-size:38px;line-height:1.6;color:${MAIZ};text-shadow:4px 4px 0 ${ROJO};text-align:center}
.pie{position:absolute;bottom:120px;font-size:24px;color:${COLOR.lima}}
@keyframes logo-gl-a{0%{clip-path:inset(0 0 50% 0);transform:translateX(-4%)}25%{clip-path:inset(20% 0 40% 0);transform:translateX(3%)}50%{clip-path:inset(55% 0 10% 0);transform:translateX(-2%)}75%{clip-path:inset(35% 0 45% 0);transform:translateX(4%)}100%{clip-path:inset(0 0 100% 0);transform:none}}
@keyframes logo-gl-b{0%{clip-path:inset(50% 0 0 0);transform:translateX(4%)}25%{clip-path:inset(0 0 60% 0);transform:translateX(-3%)}50%{clip-path:inset(0 0 45% 0);transform:translateX(2%)}75%{clip-path:inset(10% 0 0 0);transform:translateX(-4%)}100%{clip-path:inset(0);transform:none}}
.logo-gl-a{animation:logo-gl-a ${GLITCH_MS}ms steps(1,end) both paused;filter:drop-shadow(8px 0 ${ROJO}) drop-shadow(-8px 0 #1B2FD8)}
.logo-gl-b{animation:logo-gl-b ${GLITCH_MS}ms steps(1,end) both paused;filter:drop-shadow(-8px 0 ${ROJO}) drop-shadow(8px 0 #1B2FD8)}
</style></head><body>${Array.from({ length: n }, (_, k) => cuadro(Math.round((t0 + k) * 1000 / FPS))).join('')}</body></html>`;

const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
if (!chrome) { console.log('Sin Chrome instalado.'); process.exit(1); }
// Hojas de POR_HOJA cuadros apilados → una captura por hoja → recorte con PIL.
for (let h = 0, k = 0; k < N; h++, k += POR_HOJA) {
  const n = Math.min(POR_HOJA, N - k);
  const hoja = resolve(tmp, `hoja-${h}.html`); writeFileSync(hoja, html(k, n));
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${resolve(tmp, 'perfil')}`,
    '--force-device-scale-factor=1', `--window-size=${W},${H * n}`, '--virtual-time-budget=6000', `--screenshot=${resolve(tmp, `hoja-${h}.png`)}`, pathToFileURL(hoja).href], { stdio: 'ignore', timeout: 90000 });
  process.stdout.write(`hoja ${h} (${k + n}/${N})\r`);
}
// Recorte + MP4 con ffmpeg (h264, yuv420p para redes).
execFileSync('python', ['-c', `
import os, glob, subprocess, imageio_ffmpeg
from PIL import Image
tmp=r'${tmp.replace(/\\/g, '/')}'; out=r'${out.replace(/\\/g, '/')}'; W,H,P,N=${W},${H},${POR_HOJA},${N}
k=0
for h in range((N+P-1)//P):
    im=Image.open(f'{tmp}/hoja-{h}.png')
    for j in range(min(P,N-k)):
        im.crop((0,j*H,W,(j+1)*H)).save(f'{tmp}/f{k:04d}.png'); k+=1
ff=imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([ff,'-y','-framerate','${FPS}','-i',f'{tmp}/f%04d.png','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',f'{out}/meza-logo-9x16.mp4'],check=True,capture_output=True)
subprocess.run([ff,'-y','-i',f'{out}/meza-logo-9x16.mp4','-vf',f'crop={W}:{W}:0:{(H-W)//2}','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',f'{out}/meza-logo-1x1.mp4'],check=True,capture_output=True)
subprocess.run([ff,'-y','-i',f'{out}/meza-logo-9x16.mp4','-vf','fps=12,scale=540:-1','-loop','0',f'{out}/meza-logo.gif'],check=True,capture_output=True)
print('listo', out)
`], { stdio: 'inherit' });
