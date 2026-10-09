// Afiliado #1 — El Garaje (Pizzería al estilo Argentino, Montero).
// Menú personalizado. El token del link es secreto (acceso solo para ella).
// Las fotos de /pizzas se recrearon con Nano Banana 2 desde sus fotos reales:
// misma comida, fondo limpio y luz de estudio (regla de fidelidad).
// Cómo editar la carta (orden, precios, fotos): ver README → "Administrar la carta".

export type Tamano = { k: string; t: string; p: number; borde?: number };
export type Item = { slug: string; n: string; i: string; foto?: string; p?: number; opciones?: string[]; fotos?: Record<string, string> };   // fotos: una por opción   // opciones: "elige una" al agregar (Coca/Fanta/Sprite…)
export type Categoria = { k: string; t: string; desc?: string; porTamano: boolean; items: Item[] };
export type GrupoExtra = { t: string; items: string[]; precio: Record<string, number> };                   // precio por tamaño (k de Tamano)

export type Afiliado = {
  token: string;
  local: string;            // id estable (no secreto) de la sala en tiempo real
  nombre: string;
  bajada: string;
  ciudad: string;
  whatsapp: string;         // internacional para wa.me
  telefonoVisible: string;
  logo: string;
  icono?: string;           // ícono cuadrado 180×180 para "Agregar a inicio" (si falta, se usa el logo)
  oro: string;              // color de marca
  personalizar?: boolean;   // casilla "¿Algo en particular?" por pizza (la dueña decide)
  tamanos: Tamano[];
  extras?: GrupoExtra[];    // extras para la pizza, con precio por tamaño
  mitad?: string[];         // tamaños (k) en los que se puede pedir mitad y mitad
  categorias: Categoria[];
};

const F = '/afiliados/el-garaje/pizzas';

export const elGaraje: Afiliado = {
  token: 'elgaraje-a3f9k2m8x1',
  local: 'el-garaje',
  nombre: 'El Garaje',
  bajada: 'Pizzería · Al estilo Argentino',
  ciudad: 'Montero',
  whatsapp: '59176013118',
  telefonoVisible: '760 13 118',
  logo: '/afiliados/el-garaje/logo.jpg',
  icono: '/afiliados/el-garaje/icono-180.png',
  oro: '#F5B301',
  tamanos: [
    { k: 'personal', t: 'Personal', p: 25 },
    { k: 'mediana', t: 'Mediana', p: 45 },
    { k: 'familiar', t: 'Familiar', p: 65, borde: 75 },
    { k: 'xl', t: 'XL', p: 85, borde: 100 },
  ],
  mitad: ['mediana', 'familiar', 'xl'],
  extras: [
    { t: 'Quesos y carnes', items: ['Muzzarela', 'Cheddar', 'Catupiry', 'Jamón', 'Tocino', 'Peperoni', 'Carne'], precio: { personal: 6, mediana: 9, familiar: 12, xl: 14 } },
    { t: 'Vegetales y otros', items: ['Choclo', 'Champiñón', 'Piña', 'Tomate', 'Morrón', 'Cebolla'], precio: { personal: 5, mediana: 7, familiar: 10, xl: 12 } },
  ],
  categorias: [
    {
      k: 'especiales', t: 'Especiales', desc: 'Lo que solo hay acá', porTamano: false,
      items: [
        { slug: 'pizza-burguer', n: 'Pizza Burguer', i: 'Una hamburguesa envuelta en masa de pizza, con papas fritas', p: 30, foto: `${F}/pizza-burguer.jpg` },
      ],
    },
    {
      k: 'pizzas', t: 'Pizzas', desc: 'Elige el tamaño al agregar', porTamano: true,
      items: [
        { slug: 'muzza', n: 'Muzza', i: 'Muzzarela y aceitunas', foto: `${F}/muzza.jpg` },
        { slug: 'napolitana', n: 'Napolitana', i: 'Muzzarela, jamón, tomate y aceitunas', foto: `${F}/napolitana.jpg` },
        { slug: 'fugazeta', n: 'Fugazeta', i: 'Muzzarela, cebolla y aceitunas', foto: `${F}/fugazeta.jpg` },
        { slug: 'peperoni', n: 'Peperoni', i: 'Muzzarela y peperoni', foto: `${F}/peperoni.jpg` },
        { slug: 'suprema', n: 'Suprema', i: 'Muzzarela, jamón, tocino y choclo', foto: `${F}/suprema.jpg` },
        { slug: 'chesburguer', n: 'Chesburguer', i: 'Muzzarela, carne, tocino y cheddar', foto: `${F}/chesburguer.jpg` },
        { slug: 'toxica', n: 'Tóxica', i: 'Muzzarela, jamón, peperoni y tocino', foto: `${F}/toxica.jpg` },
        { slug: 'champinon', n: 'Champiñón', i: 'Muzzarela, jamón y champiñón', foto: `${F}/champinon.jpg` },
        { slug: 'pollo', n: 'Pollo', i: 'Muzzarela, pollo, choclo y catupiry', foto: `${F}/pollo.jpg` },
        { slug: 'la-casera', n: 'La Casera', i: 'Muzzarela, jamón, choclo y pimentón', foto: `${F}/la-casera.jpg` },
        { slug: 'hawaiana', n: 'Hawaiana', i: 'Muzzarela, jamón y piña', foto: `${F}/hawaiana.jpg` },
        { slug: 'carni-dulce', n: 'Carni-dulce', i: 'Muzzarela, carne y piña', foto: `${F}/carni-dulce.jpg` },
        { slug: 'mexicana', n: 'Mexicana', i: 'Muzzarela, carne, pico de gallo y limón', foto: `${F}/mexicana.jpg` },
        { slug: 'vegetariana', n: 'Vegetariana', i: 'Muzzarela, choclo y champiñón', foto: `${F}/vegetariana.jpg` },
        { slug: 'vistima', n: 'Vístima', i: 'Muzzarela, salchicha y papas fritas', foto: `${F}/vistima.jpg` },
        { slug: 'diabla', n: 'Diabla', i: 'Muzzarela, jamón y locoto/jalapeño', foto: `${F}/diabla.jpg` },
        { slug: 'tradicional', n: 'Tradicional', i: 'Muzzarela y jamón', foto: `${F}/tradicional.jpg` },
        { slug: 'margarita', n: 'Margarita', i: 'Muzzarela, jamón y champiñón', foto: `${F}/margarita.jpg` },
        { slug: '4-quesos', n: '4 Quesos', i: 'Muzzarela, cheddar, catupiry y tradicional', foto: `${F}/4-quesos.jpg` },
        { slug: 'verdulera', n: 'Verdulera', i: 'Muzzarela, tomate, choclo, cebolla y pimentón', foto: `${F}/verdulera.jpg` },
        { slug: '4-estaciones', n: '4 Estaciones', i: 'Muzzarela, jamón, peperoni, choclo y champiñón', foto: `${F}/4-estaciones.jpg` },
        { slug: 'carnivora', n: 'Carnívora', i: 'Muzzarela, carne, tocino y choclo', foto: `${F}/carnivora.jpg` },
        { slug: 'america', n: 'América', i: 'Muzzarela, jamón y choclo', foto: `${F}/america.jpg` },
      ],
    },
    {
      k: 'milanesas', t: 'Milanesas', desc: 'Todas con papas fritas', porTamano: false,
      items: [
        { slug: 'milanesa-picada', n: 'Milanesa picada', i: 'Res, pollo o mixta, con papas', p: 30, foto: `${F}/milanesa.jpg`, opciones: ['Res', 'Pollo', 'Mixta'] },
        { slug: 'milanesa-muzza', n: 'Milanesa Muzza', i: 'Salsa de tomate, muzzarela y aceitunas, con papas', p: 35, foto: `${F}/milanesa-muzza.jpg` },
        { slug: 'milanesa-napolitana', n: 'Milanesa Napolitana', i: 'Salsa de tomate, muzzarela y jamón, con papas', p: 35, foto: `${F}/milanesa-napolitana.jpg` },
        { slug: 'milanesa-parmesana', n: 'Milanesa Parmesana', i: 'Salsa de tomate, muzzarela y choclo, con papas', p: 35, foto: `${F}/milanesa-parmesana.jpg` },
        { slug: 'milanesa-peperoni', n: 'Milanesa Peperoni', i: 'Salsa de tomate, muzzarela y peperoni, con papas', p: 35, foto: `${F}/milanesa-peperoni.jpg` },
        { slug: 'milanesa-3-quesos', n: 'Milanesa 3 Quesos', i: 'Salsa de tomate, muzzarela, crema y cheddar, con papas', p: 35, foto: `${F}/milanesa-3-quesos.jpg` },
        { slug: 'milanesa-gringa', n: 'Milanesa Gringa', i: 'Salsa de tomate, cheddar y tocino, con papas', p: 35, foto: `${F}/milanesa-gringa.jpg` },
        { slug: 'milanesa-champi', n: 'Milanesa con Champi', i: 'Salsa de tomate, muzzarela y champiñón, con papas', p: 35, foto: `${F}/milanesa-champi.jpg` },
        { slug: 'milanesa-montero', n: 'Milanesa Montero', i: '2 huevos y tocino, con papas', p: 35, foto: `${F}/milanesa-montero.jpg` },
      ],
    },
    {
      k: 'hamburguesas', t: 'Hamburguesas', desc: 'Con papas fritas', porTamano: false,
      items: [
        { slug: 'hamburguesa-simple', n: 'Hamburguesa simple', i: 'Carne, queso, lechuga y tomate, con papas', p: 25, foto: `${F}/hamburguesa-simple.jpg` },
        { slug: 'hamburguesa-especial', n: 'Hamburguesa especial', i: 'Carne, queso, lechuga, tomate, tocino, huevo y pepinillo, con papas', p: 30, foto: `${F}/hamburguesa.jpg` },
        { slug: 'hamburguesa-doble', n: 'Hamburguesa VIP doble', i: 'Doble carne, queso, lechuga, tomate, tocino, huevo y pepinillo, con papas', p: 36, foto: `${F}/hamburguesa-doble.jpg` },
      ],
    },
    {
      k: 'salchipapas', t: 'Salchipapas y más', desc: 'Para picar', porTamano: false,
      items: [
        { slug: 'salchipapa-clasica', n: 'Salchipapa clásica', i: 'Salchicha y papas', p: 25, foto: `${F}/salchipapa-clasica.jpg` },
        { slug: 'salchipapa-especial', n: 'Salchipapa especial', i: 'Salchicha, queso muzzarela, choclo y papas', p: 30, foto: `${F}/salchipapa-especial.jpg` },
        { slug: 'pechuga-plancha', n: 'Pechuga a la plancha', i: 'Pechuga de pollo a la plancha con papas fritas', p: 25, foto: `${F}/pechuga.jpg` },
        { slug: 'papas-fritas', n: 'Plato de papas fritas', i: 'Para compartir', p: 12, foto: `${F}/papas-fritas.jpg` },
      ],
    },
    {
      k: 'bebidas', t: 'Bebidas', desc: 'Gaseosas, jugos y cervezas', porTamano: false,
      items: [
        { slug: 'gaseosa-2l', n: 'Gaseosa 2 litros', i: 'Coca Cola, Fanta o Sprite', p: 20, foto: `${F}/coca-2l.jpg`, fotos: { 'Coca Cola': `${F}/coca-2l.jpg`, Fanta: `${F}/fanta-2l.jpg`, Sprite: `${F}/sprite-2l.jpg` }, opciones: ['Coca Cola', 'Fanta', 'Sprite'] },
        { slug: 'gaseosa-popular', n: 'Gaseosa popular', i: 'Coca Cola, Fanta o Sprite', p: 9, foto: `${F}/coca-popular.jpg`, fotos: { 'Coca Cola': `${F}/coca-popular.jpg`, Fanta: `${F}/fanta-popular.jpg`, Sprite: `${F}/sprite-popular.jpg` }, opciones: ['Coca Cola', 'Fanta', 'Sprite'] },
        { slug: 'gaseosa-peque', n: 'Gaseosa peque', i: 'Coca Cola, Fanta o Sprite', p: 6, foto: `${F}/coca-peque.jpg`, fotos: { 'Coca Cola': `${F}/coca-peque.jpg`, Fanta: `${F}/fanta-peque.jpg`, Sprite: `${F}/sprite-peque.jpg` }, opciones: ['Coca Cola', 'Fanta', 'Sprite'] },
        { slug: 'gaseosa-mini', n: 'Gaseosa mini', i: 'Coca Cola, Fanta o Sprite', p: 4, foto: `${F}/coca-mini.jpg`, fotos: { 'Coca Cola': `${F}/coca-mini.jpg`, Fanta: `${F}/fanta-mini.jpg`, Sprite: `${F}/sprite-mini.jpg` }, opciones: ['Coca Cola', 'Fanta', 'Sprite'] },
        { slug: 'jarra-grande-jugo', n: 'Jarra grande de jugo', i: 'Limonada o maracuyá · 2 litros', p: 20, foto: `${F}/jarra-limonada.jpg`, opciones: ['Limonada', 'Maracuyá'] },
        { slug: 'jarra-pequena-jugo', n: 'Jarra pequeña de jugo', i: 'Limonada o maracuyá · 1 litro', p: 15, foto: `${F}/jarra-pequena-limonada.jpg`, opciones: ['Limonada', 'Maracuyá'] },
        { slug: 'vaso-jugo', n: 'Vaso de jugo', i: 'Limonada o maracuyá', p: 6, foto: `${F}/vaso-limonada.jpg`, opciones: ['Limonada', 'Maracuyá'] },
        { slug: 'jarra-grande-durazno', n: 'Jarra grande de durazno', i: '2 litros', p: 25, foto: `${F}/jarra-durazno.jpg` },
        { slug: 'jarra-pequena-durazno', n: 'Jarra pequeña de durazno', i: '1 litro', p: 20, foto: `${F}/jarra-pequena-durazno.jpg` },
        { slug: 'vaso-durazno', n: 'Vaso de durazno', i: 'Jugo de durazno', p: 9, foto: `${F}/vaso-durazno.jpg` },
        { slug: 'cerveza-huari', n: 'Cerveza Huari', i: 'Bien fría', p: 20, foto: `${F}/cerveza-huari.jpg` },
        { slug: 'cerveza-corona', n: 'Cerveza Corona', i: 'Bien fría', p: 20, foto: `${F}/cerveza-corona.jpg` },
      ],
    },
  ],
};

// Sandbox para demos y pruebas: misma carta, sala separada (no toca el piloto real).
export const elGarajePrueba: Afiliado = { ...elGaraje, token: 'elgaraje-prueba-x9q4', local: 'el-garaje-test', nombre: 'El Garaje · PRUEBA', personalizar: true };

export const AFILIADOS: Afiliado[] = [elGaraje, elGarajePrueba];
