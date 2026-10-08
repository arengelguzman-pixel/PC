// Afiliado #1 — El Garaje (Pizzería al estilo Argentino, Montero).
// Menú personalizado. El token del link es secreto (acceso solo para ella).
// Las fotos de /pizzas se recrearon con Nano Banana 2 desde sus fotos reales:
// misma comida, fondo limpio y luz de estudio (regla de fidelidad).

export type Tamano = { k: string; t: string; p: number; borde?: number };
export type Item = { slug: string; n: string; i: string; foto?: string; p?: number };
export type Categoria = { k: string; t: string; desc?: string; porTamano: boolean; items: Item[] };

export type Afiliado = {
  token: string;
  local: string;            // id estable (no secreto) de la sala en tiempo real
  nombre: string;
  bajada: string;
  ciudad: string;
  whatsapp: string;         // internacional para wa.me
  telefonoVisible: string;
  logo: string;
  oro: string;              // color de marca
  personalizar?: boolean;   // casilla "¿Algo en particular?" por pizza (la dueña decide)
  tamanos: Tamano[];
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
  oro: '#F5B301',
  tamanos: [
    { k: 'personal', t: 'Personal', p: 25 },
    { k: 'mediana', t: 'Mediana', p: 45 },
    { k: 'familiar', t: 'Familiar', p: 65, borde: 75 },
    { k: 'xl', t: 'XL', p: 85, borde: 100 },
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
      ],
    },
    {
      k: 'resto', t: 'Del resto', desc: 'Platos de la casa', porTamano: false,
      items: [
        // p sin definir = "consultar" (no se puede pedir hasta que nos pasen el precio)
        { slug: 'milanesa', n: 'Milanesa con papas', i: 'Milanesa dorada, papas fritas y limón', foto: `${F}/milanesa.jpg` },
      ],
    },
  ],
};

// Sandbox para demos y pruebas: misma carta, sala separada (no toca el piloto real).
export const elGarajePrueba: Afiliado = { ...elGaraje, token: 'elgaraje-prueba-x9q4', local: 'el-garaje-test', nombre: 'El Garaje · PRUEBA', personalizar: true };

export const AFILIADOS: Afiliado[] = [elGaraje, elGarajePrueba];
