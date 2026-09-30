// Sistema de logo MEZA — una sola fuente de verdad: la grilla de píxeles.
// La Z es una mesa (tapa arriba, pata en diagonal, base abajo) y tiene cuatro
// épocas que cuentan la historia del producto: píxel (menú digital) → LED
// (pedido desde la mesa) → holograma (cocina y caja en vivo) → 3D (la mesa que
// atiende). Todo se dibuja en unidades de celda para que el wordmark, el ícono
// y las animaciones compartan la misma geometría.
export const COLOR = { lima: '#C6FF3D', cian: '#38F2FF', negro: '#0B0B0B', crema: '#FFF3E4' };
export type EpocaZ = 'pixel' | 'led' | 'holo' | 'iso';
export const EPOCAS: EpocaZ[] = ['pixel', 'led', 'holo', 'iso'];
export const NOMBRE_EPOCA: Record<EpocaZ, string> = { pixel: 'Menú digital', led: 'Pedido desde la mesa', holo: 'Cocina y caja en vivo', iso: 'La mesa que atiende' };

const M = ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X', 'X...X', 'X...X'];
const E = ['XXXX', 'X...', 'X...', 'XXX.', 'X...', 'X...', 'XXXX'];
const Z = ['XXXXX', 'XXXXX', '...XX', '..XX.', '.XX..', 'XXXXX', 'XXXXX'];
const A = ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'];
export const ALTO = 7;
export const ANCHO = 22; // M(5)+1+E(4)+1+Z(5)+1+A(5)
export const X_Z = 11;
const LETRAS: [string[], number][] = [[M, 0], [E, 6], [A, 17]];

function rects(g: string[], x0: number): string {
  let s = '';
  g.forEach((fila, y) => { for (let x = 0; x < fila.length; x++) if (fila[x] === 'X') s += `<rect x="${x0 + x}" y="${y}" width="1" height="1"/>`; });
  return s;
}

// ---- las cuatro épocas de la Z (coordenadas locales 0..5 × 0..7) ----
export function zPixel(color = COLOR.lima): string {
  return `<g fill="${color}" shape-rendering="crispEdges">${rects(Z, 0)}</g>`;
}
export function zLed(color = COLOR.lima, margen = 0): string {
  let s = '';
  for (let y = -margen; y < ALTO + margen; y++) for (let x = -margen; x < 5 + margen; x++) {
    const on = y >= 0 && y < ALTO && x >= 0 && x < 5 && Z[y][x] === 'X';
    s += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="${on ? 0.37 : 0.28}" fill="${color}" opacity="${on ? 1 : 0.16}"/>`;
  }
  return `<g>${s}</g>`;
}
export function zHolo(id = 'mzh'): string {
  return `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${COLOR.lima}"/><stop offset="1" stop-color="${COLOR.cian}"/></linearGradient>` +
    `<mask id="${id}m"><rect x="-1" y="-1" width="7" height="9" fill="#fff"/><rect x="-1" y="1.1" width="7" height="0.18" fill="#000"/><rect x="-1" y="5.72" width="7" height="0.18" fill="#000"/><rect x="-1" y="3.55" width="7" height="0.18" fill="#000"/></mask></defs>` +
    `<g fill="url(#${id}g)" mask="url(#${id}m)" style="filter:drop-shadow(0 0 0.3px ${COLOR.cian})"><rect x="0" y="0" width="5" height="2"/><polygon points="3.4,2 5,2 1.6,5 0,5"/><rect x="0" y="5" width="5" height="2"/></g>`;
}
export function zIso(color = COLOR.lima): string {
  const cara = (pts: string, fill: string) => `<polygon points="${pts}" fill="${fill}" stroke="${color}" stroke-width="0.07" stroke-linejoin="round"/>`;
  return '<g>' +
    cara('0.2,5.75 2.5,5 4.8,5.75 2.5,6.5', '#1C1C1C') +      // base: cara superior
    cara('0.2,5.75 2.5,6.5 2.5,6.95 0.2,6.2', '#101010') +    // base: frente izq
    cara('2.5,6.5 4.8,5.75 4.8,6.2 2.5,6.95', '#161616') +    // base: frente der
    cara('4.4,1.0 4.9,1.2 2.2,5.8 1.7,5.6', '#262626') +      // pata: canto
    cara('3.5,1.3 4.4,1.0 1.7,5.6 0.8,5.9', '#1A1A1A') +      // pata: frente
    cara('0.2,0.75 2.5,1.5 2.5,1.95 0.2,1.2', '#141414') +    // tapa: frente izq
    cara('2.5,1.5 4.8,0.75 4.8,1.2 2.5,1.95', '#1E1E1E') +    // tapa: frente der
    cara('0.2,0.75 2.5,0 4.8,0.75 2.5,1.5', color) +          // tapa: cara superior (lima)
    '</g>';
}
export function epocaZ(epoca: EpocaZ, color = COLOR.lima, id = 'mz', margenLed = 0): string {
  if (epoca === 'led') return zLed(color, margenLed);
  if (epoca === 'holo') return zHolo(id);
  if (epoca === 'iso') return zIso(color);
  return zPixel(color);
}

// ---- isotipo: la Z-mesa sola, ajustada (media celda de aire: 6 × 8) ----
// Es la rúbrica de la marca. El nombre se escribe aparte, en Press Start 2P.
export function svgIsotipo({ color = COLOR.lima, epoca = 'pixel' as EpocaZ, id = 'mzs' } = {}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 6 8" role="img" aria-label="MEZA">${epocaZ(epoca, color, id)}</svg>`;
}

// ---- wordmark píxel MEZA (alternativo; viewBox con 1 celda de aire: 24 × 9) ----
export function svgWordmark({ color = COLOR.lima, epoca = 'pixel' as EpocaZ, fondo = null as string | null, id = 'mz' } = {}): string {
  const letras = LETRAS.map(([g, x]) => rects(g, x)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${ANCHO + 2} ${ALTO + 2}" role="img" aria-label="MEZA">` +
    (fondo ? `<rect x="-1" y="-1" width="${ANCHO + 2}" height="${ALTO + 2}" fill="${fondo}"/>` : '') +
    `<g fill="${color}" shape-rendering="crispEdges">${letras}</g><g transform="translate(${X_Z} 0)">${epocaZ(epoca, color, id)}</g></svg>`;
}

// ---- ícono: cuadrado redondeado con la Z-mesa centrada (100 × 100) ----
export function svgIcono({ color = COLOR.lima, epoca = 'pixel' as EpocaZ, fondo = COLOR.negro as string | null, id = 'mzi', radio = 22 } = {}): string {
  const c = 9, w = 5 * c, h = ALTO * c;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="MEZA">` +
    (fondo ? `<rect width="100" height="100" rx="${radio}" fill="${fondo}"/>` : '') +
    `<g transform="translate(${(100 - w) / 2} ${(100 - h) / 2}) scale(${c})">${epocaZ(epoca, color, id, epoca === 'led' ? 1 : 0)}</g></svg>`;
}
