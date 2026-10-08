// Prototipos semi-personalizados para los próximos 4 locales (Montero).
// Cada uno es un menú completo y funcional (sala en tiempo real propia) con
// fotos genéricas de /public/fotos. Para convertirlo en el menú real de un local:
//   1) cambia nombre/bajada/whatsapp/telefonoVisible/logo/oro,
//   2) cambia los platos y precios (las fotos reales se recrean con el motor),
//   3) el token es el link secreto: cámbialo por uno nuevo al entregar.
// La clave de personal de cada sala se registra la primera vez que alguien entra a Cocina/Caja.
import type { Afiliado } from './elGaraje';

const F = '/fotos';
const LOGO = '/meza/icono-512.png';           // placeholder hasta tener el logo del local
const WSP = '59100000000';                     // placeholder: WhatsApp del local

export const polleria: Afiliado = {
  token: 'proto-polleria-k4m2', local: 'proto-polleria',
  nombre: 'Pollería Demo', bajada: 'Pollos a la brasa y broaster', ciudad: 'Montero',
  whatsapp: WSP, telefonoVisible: 'tu número', logo: LOGO, oro: '#F28C28', personalizar: true,
  tamanos: [{ k: 'cuarto', t: 'Cuarto', p: 20 }, { k: 'medio', t: 'Medio', p: 38 }, { k: 'entero', t: 'Entero', p: 70 }],
  categorias: [
    { k: 'especiales', t: 'Para compartir', desc: 'Lo más pedido', porTamano: false, items: [
      { slug: 'broaster-familiar', n: 'Broaster familiar', i: '8 presas, papas grandes y 2 salsas', p: 85, foto: `${F}/broaster.jpg` },
    ] },
    { k: 'pizzas', t: 'Pollos', desc: 'Elige la porción al agregar', porTamano: true, items: [
      { slug: 'brasa', n: 'Pollo a la brasa', i: 'Con arroz, papas y ensalada', foto: `${F}/fiel.jpg` },
      { slug: 'broaster', n: 'Pollo broaster', i: 'Crocante, con papas fritas y salsa', foto: `${F}/l_ba4.jpg` },
    ] },
    { k: 'resto', t: 'Acompañamientos', desc: 'Y algo más', porTamano: false, items: [
      { slug: 'salchipapa', n: 'Salchipapa', i: 'Papas, salchicha y salsas', p: 18, foto: `${F}/salchipapa.jpg` },
      { slug: 'majadito', n: 'Majadito de pollo', i: 'Con huevo y plátano frito', p: 25, foto: `${F}/majadito.jpg` },
      { slug: 'sopa-mani', n: 'Sopa de maní', i: 'Con papas fritas por encima', p: 15, foto: `${F}/mani.jpg` },
      { slug: 'gaseosa', n: 'Gaseosa 500 ml', i: 'Coca, Fanta o Sprite', p: 8 },
    ] },
  ],
};

export const hamburgueseria: Afiliado = {
  token: 'proto-burger-x7p9', local: 'proto-burger',
  nombre: 'Burger Demo', bajada: 'Hamburguesas y rápidas', ciudad: 'Montero',
  whatsapp: WSP, telefonoVisible: 'tu número', logo: LOGO, oro: '#C6FF3D', personalizar: true,
  tamanos: [{ k: 'simple', t: 'Simple', p: 20 }, { k: 'doble', t: 'Doble', p: 28 }, { k: 'triple', t: 'Triple', p: 35 }],
  categorias: [
    { k: 'especiales', t: 'Combos', desc: 'Para dos', porTamano: false, items: [
      { slug: 'combo-pareja', n: 'Combo pareja', i: '2 hamburguesas dobles, salchipapa y 2 gaseosas', p: 65, foto: `${F}/l_ba6.jpg` },
    ] },
    { k: 'pizzas', t: 'Hamburguesas', desc: 'Elige simple, doble o triple', porTamano: true, items: [
      { slug: 'clasica', n: 'Clásica', i: 'Carne, queso, lechuga, tomate y papas', foto: `${F}/burger.jpg` },
      { slug: 'tocino', n: 'Con tocino', i: 'Carne, tocino, cheddar y cebolla crocante', foto: `${F}/l_ba6.jpg` },
      { slug: 'pollo', n: 'De pollo', i: 'Pollo crispy, queso y salsa de la casa' },
    ] },
    { k: 'resto', t: 'Rápidas', desc: 'Para picar', porTamano: false, items: [
      { slug: 'salchipapa', n: 'Salchipapa', i: 'Papas, salchicha y salsas', p: 15, foto: `${F}/l_ba12.jpg` },
      { slug: 'pique', n: 'Pique macho', i: 'Carne, salchicha, papas, huevo y locoto', p: 45, foto: `${F}/pique.jpg` },
      { slug: 'gaseosa', n: 'Gaseosa 500 ml', i: 'Coca, Fanta o Sprite', p: 8 },
    ] },
  ],
};

export const crucena: Afiliado = {
  token: 'proto-crucena-m3t8', local: 'proto-crucena',
  nombre: 'Comida Cruceña Demo', bajada: 'Almuerzos y platos típicos', ciudad: 'Montero',
  whatsapp: WSP, telefonoVisible: 'tu número', logo: LOGO, oro: '#8FBF6A', personalizar: true,
  tamanos: [],
  categorias: [
    { k: 'especiales', t: 'El plato de la casa', desc: 'Para compartir', porTamano: false, items: [
      { slug: 'pique', n: 'Pique macho', i: 'Carne, salchicha, papas, huevo, tomate y locoto', p: 48, foto: `${F}/pique.jpg` },
    ] },
    { k: 'resto', t: 'Platos', desc: 'Todo con arroz y ensalada', porTamano: false, items: [
      { slug: 'majadito', n: 'Majadito de charque', i: 'Con huevo frito y plátano', p: 25, foto: `${F}/l_ba8.jpg` },
      { slug: 'silpancho', n: 'Silpancho', i: 'Carne apanada, arroz, papa, huevo y sarza', p: 25, foto: `${F}/l_ba2.jpg` },
      { slug: 'milanesa', n: 'Milanesa con papas', i: 'Milanesa dorada, papas fritas y limón', p: 30, foto: `${F}/milanesa.jpg` },
      { slug: 'brasa', n: 'Cuarto de pollo a la brasa', i: 'Con arroz y papas', p: 22, foto: `${F}/l_ba10.jpg` },
      { slug: 'sopa-mani', n: 'Sopa de maní', i: 'Con papas fritas por encima', p: 15, foto: `${F}/mani.jpg` },
      { slug: 'mocochinchi', n: 'Mocochinchi', i: 'Vaso grande', p: 5 },
    ] },
  ],
};

export const cafeteria: Afiliado = {
  token: 'proto-cafe-r2v6', local: 'proto-cafe',
  nombre: 'Cafetería Demo', bajada: 'Salteñas, cuñapés y café', ciudad: 'Montero',
  whatsapp: WSP, telefonoVisible: 'tu número', logo: LOGO, oro: '#C9922F', personalizar: true,
  tamanos: [],
  categorias: [
    { k: 'especiales', t: 'Recién horneado', desc: 'De la mañana', porTamano: false, items: [
      { slug: 'cunapes', n: 'Cuñapés (3)', i: 'Calientitos, con queso menonita', p: 10, foto: `${F}/cunape.jpg` },
    ] },
    { k: 'resto', t: 'Para el desayuno', desc: 'Y la media tarde', porTamano: false, items: [
      { slug: 'saltena-pollo', n: 'Salteña de pollo', i: 'Jugosa, con su toque picante', p: 8 },
      { slug: 'saltena-carne', n: 'Salteña de carne', i: 'La clásica', p: 8 },
      { slug: 'cafe-leche', n: 'Café con leche', i: 'Taza grande', p: 10 },
      { slug: 'api', n: 'Api con pastel', i: 'Api morado y pastel de queso', p: 12 },
      { slug: 'jugo', n: 'Jugo natural', i: 'Naranja, papaya o piña', p: 10 },
      { slug: 'sandwich', n: 'Sándwich de pollo', i: 'Con lechuga, tomate y mayonesa', p: 15 },
    ] },
  ],
};

export const PROTOTIPOS: Afiliado[] = [polleria, hamburgueseria, crucena, cafeteria];
