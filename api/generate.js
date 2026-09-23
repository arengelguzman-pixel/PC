// Función serverless (Vercel) que conecta el Estudio con la API pública de Higgsfield
// (https://cloud.higgsfield.ai). Tus credenciales viven SOLO aquí, nunca en el navegador.
//
// Variables de entorno:
//   HF_KEY                  credenciales de Higgsfield Cloud en formato "API_KEY:API_SECRET"
//                           (o bien HF_API_KEY y HF_API_SECRET por separado)
//   HIGGSFIELD_EDIT_MODEL   modelo para mejorar fotos (por defecto bytedance/seedream/v4/edit)
//   HIGGSFIELD_T2I_MODEL    modelo para crear desde texto (por defecto bytedance/seedream/v4/text-to-image)
//   HIGGSFIELD_RESOLUTION   1K, 2K o 4K (por defecto 2K)
//   STUDIO_PASSWORD         opcional: código de acceso para que nadie más gaste tus créditos
//
// Flujo (la API de Higgsfield es asíncrona):
//   POST /api/generate                 → sube la foto, envía el trabajo y devuelve { id }
//   GET  /api/generate?id=...          → { status } mientras se genera
//   GET  /api/generate?id=...&file=1   → la imagen terminada

const BASE_URL = 'https://api.higgsfield.ai';
const EDIT_MODEL = process.env.HIGGSFIELD_EDIT_MODEL || 'bytedance/seedream/v4/edit';
const T2I_MODEL = process.env.HIGGSFIELD_T2I_MODEL || 'bytedance/seedream/v4/text-to-image';
const RESOLUTION = process.env.HIGGSFIELD_RESOLUTION || '2K';
const ASPECTS = new Set(['1:1', '4:5', '9:16', '16:9']);
const ID_RE = /^[a-zA-Z0-9-]{8,80}$/;
const MAX_PROMPT = 2000;

function credentials() {
  if (process.env.HF_KEY) return process.env.HF_KEY.trim();
  if (process.env.HF_API_KEY && process.env.HF_API_SECRET) {
    return `${process.env.HF_API_KEY.trim()}:${process.env.HF_API_SECRET.trim()}`;
  }
  return '';
}

class HiggsfieldError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function explain(status, json) {
  const detail = json?.detail;
  const msg = typeof detail === 'string' ? detail
    : Array.isArray(detail) ? detail.map((d) => `${(d.loc || []).slice(-1)[0] || ''} ${d.msg || ''}`.trim()).join('; ')
    : json?.message || json?.error || '';
  if (status === 401 || status === 403) return 'Higgsfield rechazó las credenciales (revisa HF_KEY).';
  if (status === 402) return 'No tienes saldo suficiente en Higgsfield Cloud.';
  if (status === 429) return 'Higgsfield está limitando las solicitudes, intenta en un momento.';
  return `Higgsfield respondió ${status}${msg ? `: ${msg}` : ''}`;
}

async function hf(path, init = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${credentials()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new HiggsfieldError(explain(res.status, json), res.status);
  return json;
}

// Sube la foto a Higgsfield y devuelve su URL pública (igual que higgsfield_client.upload).
async function uploadImage(dataUri) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(dataUri || '');
  if (!match) throw new HiggsfieldError('Sube una foto del platillo (JPG, PNG o WebP).', 400);
  const [, contentType, b64] = match;
  const slot = await hf('files/generate-upload-url', {
    method: 'POST',
    body: JSON.stringify({ content_type: contentType }),
  });
  const put = await fetch(slot.upload_url, {
    method: 'PUT',
    headers: slot.upload_headers || { 'Content-Type': contentType },
    body: Buffer.from(b64, 'base64'),
  });
  if (!put.ok) throw new HiggsfieldError(`No se pudo subir la foto a Higgsfield (${put.status}).`, 502);
  return slot.public_url;
}

async function submit({ mode, prompt, aspect, image }) {
  const args = { prompt, aspect_ratio: aspect, resolution: RESOLUTION };
  let model = T2I_MODEL;
  if (mode === 'edit') {
    model = EDIT_MODEL;
    const url = await uploadImage(image);
    // Los modelos de edición usan uno u otro nombre según el proveedor; se envían ambos.
    args.image_url = url;
    args.image_urls = [url];
  }
  const job = await hf(model, { method: 'POST', body: JSON.stringify(args) });
  if (!job.request_id) throw new HiggsfieldError('Higgsfield no devolvió un id de trabajo.', 502);
  return job.request_id;
}

function checkCode(req) {
  const code = process.env.STUDIO_PASSWORD;
  return !code || req.headers['x-studio-key'] === code;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const ready = Boolean(credentials());
  const { id, file } = req.query || {};

  // Estado del servidor (sin id): el estudio lo usa para saber si hay IA.
  if (req.method === 'GET' && !id) {
    return res.status(200).json({ ready, provider: 'higgsfield', needsCode: Boolean(process.env.STUDIO_PASSWORD) });
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }
  if (!ready) return res.status(503).json({ error: 'Falta configurar HF_KEY en el servidor.' });
  if (!checkCode(req)) return res.status(401).json({ error: 'Código de acceso incorrecto.' });

  try {
    // Consultar un trabajo en curso
    if (req.method === 'GET') {
      if (!ID_RE.test(String(id))) return res.status(400).json({ error: 'Id inválido' });
      const job = await hf(`requests/${id}/status`);
      const url = job.images?.[0]?.url;

      if (file) {
        if (job.status !== 'completed' || !url) return res.status(409).json({ error: 'La imagen aún no está lista' });
        // Se reenvía la imagen desde aquí para que el navegador pueda editarla sin problemas de CORS.
        const img = await fetch(url);
        if (!img.ok) throw new HiggsfieldError(`No se pudo descargar la imagen (${img.status}).`, 502);
        res.setHeader('Content-Type', img.headers.get('content-type') || 'image/jpeg');
        return res.status(200).send(Buffer.from(await img.arrayBuffer()));
      }

      const messages = {
        nsfw: 'Higgsfield rechazó la imagen por moderación (no se cobraron créditos).',
        failed: 'La generación falló en Higgsfield (no se cobraron créditos).',
        canceled: 'La generación fue cancelada.',
      };
      return res.status(200).json({
        status: job.status,
        ready: job.status === 'completed' && Boolean(url),
        url: job.status === 'completed' ? url : undefined,
        error: messages[job.status],
      });
    }

    // Crear un trabajo nuevo
    const { mode, prompt, aspect = '1:1', image } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Escribe qué quieres generar.' });
    }
    const requestId = await submit({
      mode: mode === 'edit' ? 'edit' : 'generate',
      prompt: prompt.trim().slice(0, MAX_PROMPT),
      aspect: ASPECTS.has(aspect) ? aspect : '1:1',
      image,
    });
    return res.status(202).json({ id: requestId });
  } catch (err) {
    console.error('[higgsfield]', err);
    const status = err instanceof HiggsfieldError && err.status >= 400 && err.status < 500 ? err.status : 502;
    return res.status(status === 401 ? 502 : status).json({ error: err.message || 'No se pudo generar la imagen.' });
  }
}
