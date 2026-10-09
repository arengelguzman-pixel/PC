// Cliente de la "sala" en tiempo real de un local (Durable Object en el Worker).
// Contrato compartido por Cliente, Cocina y Caja. Ver worker/sala.js.

export type Metodo = 'qr' | 'efectivo';
export type EstadoPago = 'pendiente' | 'por_confirmar' | 'confirmado' | 'rechazado';
export type EstadoCocina = 'nuevo' | 'preparando' | 'listo' | 'entregado';

export type Linea = { key: string; slug: string; n: string; tamK: string; tamT: string; borde: boolean; p: number; q: number; nota?: string; extras?: string[] };

export type Pedido = {
  id: string;            // "P-001", correlativo por local
  mesa: string;
  items: Linea[];
  nota: string;
  total: number;
  metodo: Metodo;
  pago: EstadoPago;
  tieneComprobante: boolean;
  cocina: EstadoCocina;
  recibido?: boolean;    // la cocina tocó "Recibido"
  creado: number;        // ms
  actualizado: number;   // ms
  confirmadoEn?: number;
};

// Cierre de caja: cobros confirmados entre el cierre anterior y el momento del cierre.
export type Cierre = {
  id: string;                       // "Z-001"
  desde: number; hasta: number;     // ms
  pedidos: number; total: number;
  qr: number; efectivo: number; qrN: number; efectivoN: number;
  top: { n: string; q: number; total: number }[];
  efectivoContado: number | null;   // lo que contó el personal (opcional)
  diferencia: number | null;        // contado − efectivo esperado
  nota: string;
  local?: string;
  comprobantes?: { pedido: string; mesa: string; total: number; en: number }[];   // archivados 90 días
  envio?: { telegram?: string; webhook?: string };                               // 'ok' | 'error: …'
};
export type Destino = { telegram: { nombre: string; desde: number } | null };

export type EventoSala =
  | { type: 'estado'; pedidos: Pedido[]; agotados: string[]; qr: string | null; cierreDesde?: number }
  | { type: 'pedido'; pedido: Pedido }
  | { type: 'agotados'; slugs: string[] }
  | { type: 'qr'; qr: string | null }
  | { type: 'cierre'; hasta: number };

type Resp<T = object> = ({ ok: true } & T) | { ok: false; causa?: string; msg?: string };

const base = (local: string) => `/api/sala/${encodeURIComponent(local)}`;

async function post<T = object>(url: string, body: unknown): Promise<Resp<T>> {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return (await r.json()) as Resp<T>;
  } catch { return { ok: false, causa: 'red', msg: 'Se cortó la conexión. Revisa tu wifi o datos.' }; }
}
async function get<T = object>(url: string): Promise<Resp<T>> {
  try { const r = await fetch(url, { cache: 'no-store' }); return (await r.json()) as Resp<T>; }
  catch { return { ok: false, causa: 'red', msg: 'Se cortó la conexión.' }; }
}

// ---- cliente (comensal) ----
export const crearPedido = (local: string, d: { mesa: string; items: Linea[]; nota: string; total: number; metodo: Metodo }) =>
  post<{ pedido: Pedido }>(`${base(local)}/pedidos`, d);
export const getPedido = (local: string, id: string) => get<{ pedido: Pedido }>(`${base(local)}/pedidos/${id}`);
export const subirComprobante = (local: string, id: string, comprobante: string) =>
  post<{ pedido: Pedido }>(`${base(local)}/pedidos/${id}/comprobante`, { comprobante });
export const getQr = (local: string) => get<{ qr: string | null }>(`${base(local)}/qr`);
export const getEstado = (local: string) => get<{ pedidos: Pedido[]; agotados: string[]; qr: string | null }>(`${base(local)}/pedidos`);

// ---- personal (cocina / caja) — requieren la clave del local ----
export const registrarClave = (local: string, clave: string) => post<{ nueva: boolean }>(`${base(local)}/clave`, { clave });
export const confirmarPago = (local: string, id: string, clave: string, estado: 'confirmado' | 'rechazado') =>
  post<{ pedido: Pedido }>(`${base(local)}/pedidos/${id}/pago`, { clave, estado });
export const avanzarCocina = (local: string, id: string, clave: string, estado: EstadoCocina) =>
  post<{ pedido: Pedido }>(`${base(local)}/pedidos/${id}/cocina`, { clave, estado });
export const verComprobante = (local: string, id: string, clave: string) =>
  get<{ comprobante: string }>(`${base(local)}/pedidos/${id}/comprobante?clave=${encodeURIComponent(clave)}`);
export const guardarQr = (local: string, clave: string, qr: string | null) => post(`${base(local)}/qr`, { clave, qr });
export const setAgotados = (local: string, clave: string, slugs: string[]) => post<{ slugs: string[] }>(`${base(local)}/agotados`, { clave, slugs });
export const getCierres = (local: string, clave: string) => get<{ cierres: Cierre[]; cierreDesde: number }>(`${base(local)}/cierres?clave=${encodeURIComponent(clave)}`);
export const cerrarCaja = (local: string, clave: string, efectivoContado: number | null, nota: string, nombre: string) =>
  post<{ cierre: Cierre }>(`${base(local)}/cierres`, { clave, efectivoContado, nota, nombre });
export const urlPdfCierre = (local: string, id: string, clave: string) => `${base(local)}/cierres/${id}/pdf?clave=${encodeURIComponent(clave)}`;
export const urlArchivo = (local: string, cierreId: string, pedidoId: string, clave: string) => `${base(local)}/archivo/${cierreId}/${pedidoId}?clave=${encodeURIComponent(clave)}`;
export const getDestino = (local: string, clave: string) => get<{ destino: Destino; bot: string; telegramListo: boolean; webhook: boolean }>(`${base(local)}/destino?clave=${encodeURIComponent(clave)}`);
export const codigoVinculo = (local: string, clave: string) => post<{ code: string; param: string; enlace: string }>(`${base(local)}/destino/codigo`, { clave });
export const quitarDestino = (local: string, clave: string) => post(`${base(local)}/destino/quitar`, { clave });

// ---- clave de personal guardada en este dispositivo ----
const kClave = (local: string) => `pv_clave_${local}`;
export const claveGuardada = (local: string) => { try { return localStorage.getItem(kClave(local)) || ''; } catch { return ''; } };
export const guardarClave = (local: string, clave: string) => { try { clave ? localStorage.setItem(kClave(local), clave) : localStorage.removeItem(kClave(local)); } catch { /* */ } };

// ---- pedidos propios de este comensal (para seguirlos) ----
const kMios = (local: string) => `pv_pedidos_${local}`;
export const misPedidos = (local: string): string[] => { try { return JSON.parse(sessionStorage.getItem(kMios(local)) || '[]'); } catch { return []; } };
export const recordarPedido = (local: string, id: string) => { try { sessionStorage.setItem(kMios(local), JSON.stringify([...new Set([...misPedidos(local), id])].slice(-10))); } catch { /* */ } };

// ---- tiempo real: WebSocket con reconexión ----
export function conectarSala(local: string, onEvento: (e: EventoSala) => void, onConexion?: (ok: boolean) => void): () => void {
  let ws: WebSocket | null = null, vivo = true, intento = 0, ping = 0;
  const abrir = () => {
    if (!vivo) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    try { ws = new WebSocket(`${proto}://${location.host}${base(local)}/ws`); } catch { reintentar(); return; }
    ws.onopen = () => { intento = 0; onConexion?.(true); ping = window.setInterval(() => { try { ws?.send('ping'); } catch { /* */ } }, 25000); };
    ws.onmessage = (m) => { if (m.data === 'pong') return; try { onEvento(JSON.parse(m.data)); } catch { /* */ } };
    ws.onclose = () => { onConexion?.(false); clearInterval(ping); reintentar(); };
    ws.onerror = () => { try { ws?.close(); } catch { /* */ } };
  };
  const reintentar = () => { if (!vivo) return; const espera = Math.min(15000, 800 * 2 ** intento++); window.setTimeout(abrir, espera); };
  abrir();
  return () => { vivo = false; clearInterval(ping); try { ws?.close(); } catch { /* */ } };
}

// ---- comprimir una foto/captura en el celular antes de subirla ----
export function comprimirImagen(file: File, max = 1280, calidad = 0.82): Promise<string> {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const esc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * esc); c.height = Math.round(im.naturalHeight * esc);
      const x = c.getContext('2d'); if (!x) return mal(new Error('canvas'));
      x.drawImage(im, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', calidad));
    };
    im.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen')); };
    im.src = url;
  });
}

// ---- utilidades de presentación ----
export const ETIQUETA_PAGO: Record<EstadoPago, string> = { pendiente: 'Pago pendiente', por_confirmar: 'Comprobante enviado', confirmado: 'Pago confirmado', rechazado: 'Pago rechazado' };
export const ETIQUETA_COCINA: Record<EstadoCocina, string> = { nuevo: 'Enviado', preparando: 'En preparación', listo: 'En preparación', entregado: 'Entregado' };
export const mmss = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
export const minutos = (ms: number) => Math.floor(Math.max(0, ms) / 60000);
