// Fuente de verdad del contenido de MEZA.
// Copy, menú, comparadores y datos de la máquina de afiches viven aquí.

// Estudio IA (servicio externo de mejora de fotos, alojado en Vercel).
export const ESTUDIO_URL = 'https://plato-vivo.vercel.app/estudio/';
export const ESTUDIO_MEJORAR_URL = 'https://plato-vivo.vercel.app/estudio/?vista=mejorar';

export const MARCA = {
  nombre: 'MEZA',
  eslogan: 'La mesa que atiende.',
  whatsapp: '', // número destino; vacío = sólo demo
};

// Video de fondo del hero: el avatar (Visor Z) en tres estados. MP4 propios.
//   antes   → loop, Z apagada, confundido con el celular
//   cambio  → una sola vez: tira el celular, se cambia, se enchufa, la Z se enciende
//   despues → loop, Z encendida, seguro
export const VIDEO_HERO = {
  antes: '/video/avatar-antes.mp4',
  cambio: '/video/avatar-cambio.mp4',
  despues: '/video/avatar-despues.mp4',
};

// Frases del typewriter del hero (se escriben y borran)
export const HERO_FRASES = [
  '¿TU CARTA SIGUE EN PAPEL?',
  'TU COMIDA YA ES BUENA.',
  'AHORA QUE SE VEA ASÍ.',
];

// Manifiesto que sube con el scroll (estilo créditos). Corto: se lee entero.
export const MANIFIESTO = `TU CARTA
YA NO ES
UN PAPEL.

ESCANEAN.
PIDEN.
LLEGA A LA COCINA.
SE COBRA POR QR.

---

LA MISMA COMIDA.
OTRA FOTO.

---

MEZA.
LA MESA
QUE ATIENDE.`;

export const MARQUEE = [
  'PIDE DESDE LA MESA', 'COBRO POR QR', 'COCINA EN VIVO',
  'FOTOS QUE DAN HAMBRE', 'AFICHES CON TU MARCA', 'SIN APPS',
];

// Stickers de comida que siguen al cursor (SVG propios, die-cut brutalista).
export const TRAIL_STICKERS = [
  '/stickers/burger.svg',
  '/stickers/pollo.svg',
  '/stickers/papas.svg',
  '/stickers/fuego.svg',
  '/stickers/saltena.svg',
  '/stickers/rico.svg',
];

// Comparadores antes/después del hero y de la sección menú
export const BEFORE_AFTER: { antes: string; despues: string }[] = [
  { antes: '/fotos/l_ba1.jpg', despues: '/fotos/l_ba2.jpg' },
  { antes: '/fotos/l_ba3.jpg', despues: '/fotos/l_ba4.jpg' },
  { antes: '/fotos/l_ba5.jpg', despues: '/fotos/l_ba6.jpg' },
  { antes: '/fotos/l_ba7.jpg', despues: '/fotos/l_ba8.jpg' },
  { antes: '/fotos/l_ba9.jpg', despues: '/fotos/l_ba10.jpg' },
  { antes: '/fotos/l_ba11.jpg', despues: '/fotos/l_ba12.jpg' },
];

// ---- Menú (data recuperada del producto) ----
export const IMG: Record<string, string> = {
  burger: '/fotos/burger.jpg', pique: '/fotos/pique.jpg', majadito: '/fotos/majadito.jpg',
  salchipapa: '/fotos/salchipapa.jpg', broaster: '/fotos/broaster.jpg', milanesa: '/fotos/milanesa.jpg',
  mani: '/fotos/mani.jpg', cunape: '/fotos/cunape.jpg',
};
export const GLB: Record<string, string> = {
  burger: '/glb/burger.glb', pique: '/glb/pique.glb', majadito: '/glb/majadito.glb',
};

export type Plato = {
  id: number; cat: string; n: string; p: number;
  img: string; glb: string | null; no: boolean; d: string; t: string;
};

export const PLATOS: Plato[] = [
  { id: 1, cat: 'Rápidas', n: 'Hamburguesa doble', p: 35, img: 'burger', glb: 'burger', no: false,
    d: 'Doble carne, doble cheddar, tocino, lechuga y tomate. Viene con papas.',
    t: '2 carnes de res · cheddar · tocino · lechuga · tomate · papas fritas' },
  { id: 2, cat: 'Cruceñas', n: 'Pique macho', p: 55, img: 'pique', glb: 'pique', no: false,
    d: 'Carne y chorizo sobre papas fritas, con tomate, cebolla, huevo y locoto. Alcanza para dos.',
    t: 'Carne de res · chorizo · papas fritas · tomate · cebolla · huevo · locoto' },
  { id: 3, cat: 'Cruceñas', n: 'Majadito cruceño', p: 30, img: 'majadito', glb: 'majadito', no: false,
    d: 'Arroz con charque, huevo frito y plátano. El de toda la vida.',
    t: 'Arroz · charque de res · huevo frito · plátano frito' },
  { id: 4, cat: 'Rápidas', n: 'Salchipapa', p: 18, img: 'salchipapa', glb: null, no: false,
    d: 'Papas fritas con salchicha dorada, mayonesa y kétchup. La de siempre.',
    t: 'Papas fritas · salchicha · mayonesa · kétchup' },
  { id: 5, cat: 'Rápidas', n: 'Pollo broaster', p: 32, img: 'broaster', glb: null, no: false,
    d: 'Presas bien crocantes con papas fritas y salsa blanca de la casa.',
    t: '2 presas de pollo · papas fritas · salsa blanca' },
  { id: 6, cat: 'Cruceñas', n: 'Milanesa con arroz', p: 28, img: 'milanesa', glb: null, no: false,
    d: 'Milanesa de pollo dorada, con arroz graneado, plátano y ensalada del día.',
    t: 'Milanesa de pollo · arroz · plátano frito · ensalada' },
  { id: 7, cat: 'Sopas', n: 'Sopa de maní', p: 22, img: 'mani', glb: null, no: false,
    d: 'Bien espesa, con fideo, carne y papa. Con papitas crocantes encima.',
    t: 'Maní molido · fideo · carne · papa · perejil' },
  { id: 8, cat: 'Para picar', n: 'Cuñapés y mocochinchi', p: 15, img: 'cunape', glb: null, no: false,
    d: 'Cuñapés recién horneados y un vaso grande de mocochinchi bien helado.',
    t: '6 cuñapés · vaso de mocochinchi' },
];

export const BEBIDAS = [
  { cat: 'Para picar', n: 'Refresco 2 litros', s: 'Coca, Fanta o Sprite', p: 18 },
  { cat: 'Para picar', n: 'Jarra de mocochinchi', s: '1 litro, bien helado', p: 15 },
];

export const CATS = ['Todo', 'Rápidas', 'Cruceñas', 'Sopas', 'Para picar'];

// ---- Máquina de afiches ----
export const OBJETIVOS = [
  { k: 'promo', t: 'Una promo' },
  { k: 'nuevo', t: 'Un plato nuevo' },
  { k: 'hoy', t: 'Que abrimos hoy' },
  { k: 'delivery', t: 'Que hacemos delivery' },
];

export const AFICHE_PLATOS = [
  { k: 'burger', t: 'Hamburguesa doble', corto: 'BURGERS', art: 'la', p: 35, img: '/fotos/burger.jpg' },
  { k: 'pique', t: 'Pique macho', corto: 'PIQUE MACHO', art: 'el', p: 55, img: '/fotos/pique.jpg' },
  { k: 'broaster', t: 'Pollo broaster', corto: 'BROASTER', art: 'el', p: 32, img: '/fotos/broaster.jpg' },
];
