// Función serverless (Vercel) que conecta el Estudio con el modelo de imágenes.
// La API key vive SOLO aquí (variables de entorno), nunca en el navegador.
//
// Variables de entorno:
//   IMAGE_PROVIDER      "openai" (por defecto) o "fal"
//   OPENAI_API_KEY      clave de OpenAI (si usas openai)
//   OPENAI_IMAGE_MODEL  modelo de imagen, por defecto "gpt-image-1"
//   FAL_KEY             clave de fal.ai (si usas fal)
//   STUDIO_PASSWORD     opcional: código de acceso para que nadie más gaste tus créditos

const PROVIDER = (process.env.IMAGE_PROVIDER || 'openai').toLowerCase();
const OPENAI_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const MAX_PROMPT = 2000;

const OPENAI_SIZES = {
  '1:1': '1024x1024',
  '4:5': '1024x1536',
  '9:16': '1024x1536',
  '16:9': '1536x1024',
};

const FAL_SIZES = {
  '1:1': 'square_hd',
  '4:5': 'portrait_4_3',
  '9:16': 'portrait_16_9',
  '16:9': 'landscape_16_9',
};

const FAL_RATIOS = { '1:1': '1:1', '4:5': '3:4', '9:16': '9:16', '16:9': '16:9' };

function isReady() {
  if (PROVIDER === 'fal') return Boolean(process.env.FAL_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}

function dataUriToBuffer(dataUri) {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUri || '');
  if (!match) return null;
  return { type: match[1], buffer: Buffer.from(match[2], 'base64') };
}

async function openaiRequest(path, init) {
  const res = await fetch(`https://api.openai.com/v1/images/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message || `OpenAI respondió ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return `data:image/jpeg;base64,${json.data[0].b64_json}`;
}

async function openaiGenerate({ prompt, aspect }) {
  return openaiRequest('generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      prompt,
      size: OPENAI_SIZES[aspect] || '1024x1024',
      quality: 'high',
      output_format: 'jpeg',
      output_compression: 88,
    }),
  });
}

async function openaiEdit({ prompt, aspect, image }, highFidelity = true) {
  const form = new FormData();
  form.append('model', OPENAI_MODEL);
  form.append('prompt', prompt);
  form.append('size', OPENAI_SIZES[aspect] || 'auto');
  form.append('quality', 'high');
  form.append('output_format', 'jpeg');
  form.append('output_compression', '88');
  // Mantiene el platillo lo más parecido posible al original.
  if (highFidelity) form.append('input_fidelity', 'high');
  form.append('image', new Blob([image.buffer], { type: image.type }), 'plato.jpg');
  try {
    return await openaiRequest('edits', { method: 'POST', body: form });
  } catch (err) {
    // Algunos modelos no aceptan input_fidelity: reintenta sin él.
    if (highFidelity && err.status === 400 && /fidelity/i.test(err.message)) {
      return openaiEdit({ prompt, aspect, image }, false);
    }
    throw err;
  }
}

async function falRequest(model, body) {
  const res = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${process.env.FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail?.[0]?.msg || json?.detail || `fal.ai respondió ${res.status}`);
  const url = json?.images?.[0]?.url;
  if (!url) throw new Error('fal.ai no devolvió ninguna imagen');
  // Se descarga aquí para que el navegador reciba la imagen sin problemas de CORS.
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  return `data:${img.headers.get('content-type') || 'image/jpeg'};base64,${buf.toString('base64')}`;
}

function falGenerate({ prompt, aspect }) {
  return falRequest('fal-ai/flux-pro/v1.1', {
    prompt,
    image_size: FAL_SIZES[aspect] || 'square_hd',
    output_format: 'jpeg',
  });
}

function falEdit({ prompt, aspect, imageDataUri }) {
  return falRequest('fal-ai/flux-pro/kontext', {
    prompt,
    image_url: imageDataUri,
    aspect_ratio: FAL_RATIOS[aspect] || '1:1',
    output_format: 'jpeg',
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json({
      ready: isReady(),
      provider: PROVIDER,
      needsCode: Boolean(process.env.STUDIO_PASSWORD),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!isReady()) {
    return res.status(503).json({ error: 'Falta configurar la API key en el servidor.' });
  }

  if (process.env.STUDIO_PASSWORD && req.headers['x-studio-key'] !== process.env.STUDIO_PASSWORD) {
    return res.status(401).json({ error: 'Código de acceso incorrecto.' });
  }

  const { mode, prompt, aspect = '1:1', image } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Escribe qué quieres generar.' });
  }
  const cleanPrompt = prompt.trim().slice(0, MAX_PROMPT);

  try {
    let result;
    if (mode === 'edit') {
      const parsed = dataUriToBuffer(image);
      if (!parsed) return res.status(400).json({ error: 'Sube una foto del platillo.' });
      result = PROVIDER === 'fal'
        ? await falEdit({ prompt: cleanPrompt, aspect, imageDataUri: image })
        : await openaiEdit({ prompt: cleanPrompt, aspect, image: parsed });
    } else {
      result = PROVIDER === 'fal'
        ? await falGenerate({ prompt: cleanPrompt, aspect })
        : await openaiGenerate({ prompt: cleanPrompt, aspect });
    }
    return res.status(200).json({ image: result });
  } catch (err) {
    console.error('[generate]', err);
    return res.status(502).json({ error: err.message || 'No se pudo generar la imagen.' });
  }
}
