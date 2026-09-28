// Afiliado #1 — El Garaje (Pizzería al estilo Argentino, Montero).
// Menú personalizado. El token del link es secreto (acceso solo para ella).

export type Afiliado = {
  token: string;
  nombre: string;
  bajada: string;
  whatsapp: string;         // formato internacional para wa.me
  logo: string;
  oro: string;              // color de marca
  tamanos: { k: string; t: string; p: number; borde?: number }[];
  pizzas: { n: string; i: string; no?: boolean }[];
  especiales: { n: string; i: string; p: number; foto?: string; no?: boolean }[];
};

export const elGaraje: Afiliado = {
  token: 'elgaraje-a3f9k2m8x1',
  nombre: 'El Garaje',
  bajada: 'Pizzería · Al estilo Argentino · Montero',
  whatsapp: '59176013118',
  logo: '/afiliados/el-garaje/logo.jpg',
  oro: '#F5B301',
  tamanos: [
    { k: 'personal', t: 'Personal', p: 25 },
    { k: 'mediana', t: 'Mediana', p: 45 },
    { k: 'familiar', t: 'Familiar', p: 65, borde: 75 },
    { k: 'xl', t: 'XL', p: 85, borde: 100 },
  ],
  pizzas: [
    { n: 'Fugazeta', i: 'Muzzarela, cebolla y aceitunas' },
    { n: 'Suprema', i: 'Muzzarela, jamón, tocino y choclo' },
    { n: 'Carni-dulce', i: 'Muzzarela, carne y piña' },
    { n: 'Hawaiana', i: 'Muzzarela, jamón y piña' },
    { n: 'Pollo', i: 'Muzzarela, pollo, choclo y catupiry' },
    { n: 'Chesburguer', i: 'Muzzarela, carne, tocino y cheddar' },
    { n: 'Muzza', i: 'Muzzarela y aceitunas' },
    { n: 'Peperoni', i: 'Muzzarela y peperoni' },
    { n: 'Champiñón', i: 'Muzzarela, jamón y champiñón' },
    { n: 'Vegetariana', i: 'Muzzarela, choclo y champiñón' },
    { n: 'La Casera', i: 'Muzzarela, jamón, choclo y pimentón' },
    { n: 'Mexicana', i: 'Muzzarela, carne, pico de gallo y limón' },
    { n: 'Tóxica', i: 'Muzzarela, jamón, peperoni y tocino' },
    { n: 'Napolitana', i: 'Muzzarela, jamón, tomate y aceitunas' },
  ],
  especiales: [
    { n: 'Pizza Burguer', i: 'Una hamburguesa envuelta en masa de pizza, con papas fritas', p: 30, foto: '/afiliados/el-garaje/pizza-burguer.jpg' },
  ],
};

export const AFILIADOS: Afiliado[] = [elGaraje];
