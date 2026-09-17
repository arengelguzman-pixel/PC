// Cliente del motor real de retoque. El navegador sólo recorta y manda;
// la llave vive en el servidor (/api/mejorar). Nunca baja al teléfono.

export type Aviso = { empezado: boolean; envase: boolean; motivo: string } | null;

export type MejorarResp = {
  ok: boolean;
  motor?: string;
  plato?: boolean;
  foto?: string;
  aviso?: Aviso;
  causa?: string;
  msg?: string;
  codigo?: string;
};

export async function mejorar(fotoDataUrl: string, plato = false): Promise<MejorarResp> {
  try {
    const r = await fetch('/api/mejorar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foto: fotoDataUrl, plato }),
    });
    const j: MejorarResp = await r.json().catch(() => ({ ok: false }));
    if (!r.ok || !j.ok) {
      if (!j.causa && [404, 405, 501, 502, 422, 402].includes(r.status)) {
        j.causa = r.status === 502 ? 'motor' : 'sin_motor';
      }
      j.ok = false;
      return j;
    }
    return j;
  } catch {
    return { ok: false, causa: 'red' };
  }
}

// Recorte cuadrado centrado: el motor trabaja en 1:1
export function recorte(im: HTMLImageElement, lado = 1024): HTMLCanvasElement {
  const L = Math.min(im.naturalWidth, im.naturalHeight);
  const sx = (im.naturalWidth - L) / 2;
  const sy = (im.naturalHeight - L) / 2;
  const c = document.createElement('canvas');
  c.width = c.height = lado;
  const x = c.getContext('2d')!;
  x.imageSmoothingQuality = 'high';
  x.drawImage(im, sx, sy, L, L, 0, 0, lado, lado);
  return c;
}

// ¿Parece comida? Heurística de color gratis en el celular:
// evita quemar créditos con autos, memes o capturas.
export function pareceComida(cv: HTMLCanvasElement): number {
  const S = 180;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const cx = c.getContext('2d')!;
  cx.drawImage(cv, 0, 0, S, S);
  const p = cx.getImageData(0, 0, S, S).data;
  const N = S * S;
  let calido = 0, verde = 0, azul = 0;
  for (let i = 0; i < N; i++) {
    const r = p[i * 4] / 255, g = p[i * 4 + 1] / 255, b = p[i * 4 + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    const v = mx, sat = mx ? d / mx : 0;
    if (sat < 0.12 || v < 0.14) continue;
    let hh = 0;
    if (mx === r) hh = 60 * (((g - b) / d) % 6);
    else if (mx === g) hh = 60 * (((b - r) / d) + 2);
    else hh = 60 * (((r - g) / d) + 4);
    if (hh < 0) hh += 360;
    if ((hh < 52 || hh > 334) && sat > 0.18) calido++;
    else if (hh >= 60 && hh <= 165 && sat > 0.22) verde++;
    else if (hh >= 185 && hh <= 265 && sat > 0.25) azul++;
  }
  return (calido + verde * 0.55 - azul * 0.5) / N;
}

// Mensajes de error en palabras normales (regla de producto: nunca códigos crudos)
export const FALLOS: Record<string, [string, string]> = {
  sin_motor: ['🔌 El motor no está conectado aquí',
    'Esta copia todavía no tiene el motor enchufado. En la versión que te entregamos sí funciona — escríbenos y te la mostramos en vivo.'],
  tope_dia: ['⏳ Se acabaron las pruebas de hoy',
    'Hoy ya se usaron todas las pruebas gratis. Vuelve mañana, o escríbenos y arreglamos tu carta completa.'],
  tope_ip: ['✋ Ya probaste varias', 'Escríbenos y te arreglamos toda la carta, no solo una foto.'],
  pesada: ['📦 Esa foto pesa demasiado', 'Prueba con una más chica o vuelve a sacarla.'],
  red: ['📶 Se cortó la conexión', 'Revisa tus datos o el wifi y vuelve a intentar.'],
  sin_creditos: ['💳 Se acabaron los créditos del motor', 'Ya lo estamos recargando. Escríbenos y te mostramos tu foto en minutos.'],
  nsfw: ['🙈 Esa foto no la puedo procesar', 'El motor la rechazó. Prueba con una donde se vea solo el plato.'],
  motor: ['😕 El motor no pudo con esta foto', 'A veces pasa con fotos muy oscuras o muy movidas. Prueba con otra.'],
};
