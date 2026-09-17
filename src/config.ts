// Fuente de verdad del contenido de PLATO VIVO.
// Copy, menú, comparadores y datos de la máquina de afiches viven aquí.

export const MARCA = {
  nombre: 'PLATO VIVO',
  ciudad: 'Montero · Santa Cruz · Bolivia',
  eslogan: '¿Quieres darle vida a tu comida?',
  whatsapp: '', // número destino; vacío = sólo demo
};

// Frases del typewriter del hero (se escriben y borran)
export const HERO_FRASES = [
  '¿PLATO SIN VIDA?',
  'TU COMIDA YA ES BUENA.',
  'AHORA QUE SE VEA ASÍ.',
];

// Manifiesto que sube con el scroll (estilo créditos)
export const MANIFIESTO = `NO CAMBIAMOS
TU COMIDA.
CAMBIAMOS
LA FOTO.

LA MISMA PRESA.
LA MISMA PORCIÓN.
EL MISMO PLATO.
OTRA LUZ.

---

¿POR QUÉ NOSOTROS?
1. SUBES UNA FOTO.
   NOSOTROS EL RESTO.
2. NO INVENTAMOS
   TU COMIDA.
3. TÚ CAMBIAS
   LOS PRECIOS.
4. SIRVE CUALQUIER
   FOTO DE CELULAR.

---

TU CARTA EN 3D.
TUS REDES RESUELTAS.
SIN APPS.
SIN DISEÑADOR.

DALE VIDA
A TU COMIDA.`;

export const MARQUEE = [
  'MENÚ EN 3D', 'FOTOS QUE DAN HAMBRE', 'AFICHES CON TU MARCA',
  'TÚ LO MANEJAS', 'SIN APPS', 'SIN DISEÑADOR',
];

// Stickers decorativos que siguen al cursor (CDN Figma del spec, sólo adorno)
const CDN = 'https://crow-peanut-06457083.figma.site/_components/v2/4c2b061456bbff22b92923348791b501874ded3f';
export const TRAIL_STICKERS = [
  `${CDN}/b77ef81dabfca9ce4a4d1af5d553e17019a0d229.b77ef81d.png`,
  `${CDN}/9ece3a6bf6c5cecf6c0078d022a171bc93baf9c5.9ece3a6b.png`,
  `${CDN}/41b9f0bffb2c0b2e1d3fbe26c124ed1378970c35.41b9f0bf.png`,
  `${CDN}/0edc0785a3e3bf26be7a494886999c4a6f1dc14c.0edc0785.png`,
  `${CDN}/d12ddf42fe4c8437df4414c883fe60fb77b20cbe.d12ddf42.png`,
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
