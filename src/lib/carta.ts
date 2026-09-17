// Panel del dueño: looks, plantillas, guardado de la carta.
// Modelo de dos links: el identificador del local va en ?r=, la clave de
// edición va después del # (el navegador no la manda al servidor al cargar).

export type LookKey = 'brasa' | 'cunape' | 'selva' | 'noche' | 'arcilla' | 'papel';
export type TplKey = 'vitrina' | 'lista' | 'mosaico' | 'panorama' | 'clasica';

export type Look = { k: LookKey; t: string; s: string; tpl: TplKey; c: [string, string, string] };

export const LOOKS: Look[] = [
  { k: 'brasa', t: 'Brasa', s: 'Pollería, parrilla, al paso', tpl: 'vitrina', c: ['#17120F', '#E8531F', '#F2B33D'] },
  { k: 'cunape', t: 'Cuñapé', s: 'Cafetería, panadería, desayuno', tpl: 'vitrina', c: ['#F3EADC', '#B4551E', '#C9922F'] },
  { k: 'selva', t: 'Selva', s: 'Almuerzo casero, cruceña', tpl: 'mosaico', c: ['#0C130D', '#8FBF6A', '#E8C45C'] },
  { k: 'noche', t: 'Noche', s: 'Hamburguesas, rápidas, delivery', tpl: 'panorama', c: ['#08080A', '#C6FF3D', '#FFE14D'] },
  { k: 'arcilla', t: 'Arcilla', s: 'Restaurante de mesa', tpl: 'lista', c: ['#1C110F', '#D4795F', '#E0A85C'] },
  { k: 'papel', t: 'Papel', s: 'Carta sobria, sin fotos', tpl: 'clasica', c: ['#F7F6F3', '#1A1A1A', '#8A7B54'] },
];

export const TPLS: { k: TplKey; t: string }[] = [
  { k: 'vitrina', t: 'Vitrina' }, { k: 'lista', t: 'Lista' }, { k: 'mosaico', t: 'Mosaico' },
  { k: 'panorama', t: 'Panorama' }, { k: 'clasica', t: 'Clásica' },
];

// '' = el acento del look; el resto son colores propios de la marca.
export const COLORES = ['', '#E8531F', '#C42B1C', '#F2B33D', '#4C7A3E', '#2F6FA8', '#8E4EC6'];

// Paletas completas por look (para pintar la vista previa del cliente).
export type Paleta = { fondo: string; carbon: string; humo: string; ceniza: string; brasa: string; maiz: string; cunape: string; txt2: string; tenue: string };
export const PALETAS: Record<LookKey, Paleta> = {
  brasa:   { fondo: '#0E0B09', carbon: '#17120F', humo: '#241C17', ceniza: '#3A2E26', brasa: '#E8531F', maiz: '#F2B33D', cunape: '#F4E9D8', txt2: '#B3A395', tenue: '#7D6E62' },
  cunape:  { fondo: '#F3EADC', carbon: '#FBF6EE', humo: '#FFFFFF', ceniza: '#E2D3BE', brasa: '#B4551E', maiz: '#C9922F', cunape: '#2E2118', txt2: '#6B5949', tenue: '#9A8877' },
  selva:   { fondo: '#0C130D', carbon: '#111A12', humo: '#1A251B', ceniza: '#2E4030', brasa: '#8FBF6A', maiz: '#E8C45C', cunape: '#F0EDE0', txt2: '#AEBBA6', tenue: '#7B8A76' },
  noche:   { fondo: '#08080A', carbon: '#0E0E11', humo: '#17171C', ceniza: '#2A2A33', brasa: '#C6FF3D', maiz: '#FFE14D', cunape: '#FFFFFF', txt2: '#A9A9B6', tenue: '#71717F' },
  arcilla: { fondo: '#1C110F', carbon: '#241615', humo: '#31201D', ceniza: '#4A312C', brasa: '#D4795F', maiz: '#E0A85C', cunape: '#F5E6DA', txt2: '#C0A797', tenue: '#8C7566' },
  papel:   { fondo: '#F7F6F3', carbon: '#FFFFFF', humo: '#FFFFFF', ceniza: '#E1DFDA', brasa: '#1A1A1A', maiz: '#8A7B54', cunape: '#171717', txt2: '#5A5A57', tenue: '#8E8E89' },
};

export function paletaVars(look: LookKey, color: string): React.CSSProperties {
  const p = PALETAS[look];
  return {
    ['--fondo' as string]: p.fondo, ['--carbon' as string]: p.carbon, ['--humo' as string]: p.humo,
    ['--ceniza' as string]: p.ceniza, ['--brasa' as string]: color || p.brasa, ['--maiz' as string]: p.maiz,
    ['--cunape' as string]: p.cunape, ['--txt2' as string]: p.txt2, ['--tenue' as string]: p.tenue,
  };
}

// ---- datos guardados ----
export type PlatoEstado = { id: number; p: number; no: boolean };
export type DatosCarta = {
  v: 1; nombre: string; bajada: string; logo: string;
  look: LookKey; color: string; platos: PlatoEstado[];
};

// ?r= y #k= del link
export function leerLocal(): string {
  return (new URLSearchParams(location.search).get('r') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
}
export function leerClave(): string {
  return new URLSearchParams(location.hash.slice(1)).get('k') || '';
}

export async function cartaGet(local: string): Promise<{ ok: boolean; existe?: boolean; datos?: DatosCarta; guardado?: string }> {
  try {
    const r = await fetch('/api/carta?r=' + encodeURIComponent(local));
    return await r.json();
  } catch { return { ok: false }; }
}

export async function cartaPost(local: string, clave: string, datos: DatosCarta): Promise<{ ok: boolean; causa?: string; msg?: string; guardado?: string }> {
  try {
    const r = await fetch('/api/carta', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ r: local, clave, datos }),
    });
    return await r.json();
  } catch { return { ok: false, causa: 'red' }; }
}

// El logo del celular pesa megas: lo dejamos en 256px cuadrado.
export function recortarLogo(im: HTMLImageElement): string {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.imageSmoothingQuality = 'high';
  const l = Math.min(im.naturalWidth, im.naturalHeight);
  x.drawImage(im, (im.naturalWidth - l) / 2, (im.naturalHeight - l) / 2, l, l, 0, 0, S, S);
  return c.toDataURL('image/jpeg', 0.86);
}
