import express from 'express';
import path from 'path';
import fs from 'fs';
import { REGLA, REGLA_PLATO, REVISION } from './server/prompts';

/*
 * Servidor de PLATO VIVO.
 *  - dev: Vite en middleware (SPA) + API real
 *  - prod: sirve dist/ + API real
 *
 * La API porta el contrato del Worker de Cloudflare (/api/mejorar, /api/carta).
 * Los topes y las cartas viven en memoria (se reinician al reiniciar el server):
 * para producción real, el Worker + KV siguen siendo la fuente. La llave del
 * motor se lee de GEMINI_API_KEY y nunca baja al navegador.
 */

const PORT = Number(process.env.PORT || 3000);
const MOTOR = (process.env.MOTOR || 'gemini').toLowerCase();
const LIMITE_DIA = Number(process.env.LIMITE_DIA || 80);
const LIMITE_IP = Number(process.env.LIMITE_IP || 6);

const topes = new Map<string, number>();
const cartas = new Map<string, { clave: string; guardado: string; datos: unknown }>();

const limpiarId = (v: unknown) => String(v || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);

function igual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function codigoCorto(txt: string) {
  const t = String(txt);
  const n = t.match(/\b(4\d\d|5\d\d)\b/);
  if (/quota|exceeded|billing/i.test(t)) return 'CUOTA' + (n ? '-' + n[1] : '');
  if (/high demand|overload|unavailable/i.test(t)) return 'SATURADO' + (n ? '-' + n[1] : '');
  if (/safety|blocked|policy/i.test(t)) return 'FILTRO';
  if (/no traia imagen/i.test(t)) return 'SIN-IMAGEN';
  if (/api key|permission|denied|401|403/i.test(t)) return 'LLAVE';
  return n ? 'HTTP-' + n[1] : 'DESCONOCIDO';
}

// deep-search de imagen/texto en la respuesta de Gemini
function sacarImagen(o: unknown): string {
  let hallada: string | null = null;
  (function hurgar(n: any, pensamiento: boolean) {
    if (!n || hallada || typeof n !== 'object') return;
    if (Array.isArray(n)) { for (const x of n) hurgar(x, pensamiento); return; }
    const esP = pensamiento || n.type === 'thought' || n.thought === true;
    const datos = n.data || n.b64_json || n.inlineData?.data || n.inline_data?.data;
    const tipo = n.mime_type || n.mimeType || n.inlineData?.mimeType || n.inline_data?.mime_type || '';
    if (!esP && typeof datos === 'string' && datos.length > 1000 && (n.type === 'image' || /^image\//.test(tipo))) {
      hallada = 'data:' + (tipo || 'image/jpeg') + ';base64,' + datos;
      return;
    }
    for (const k in n) hurgar(n[k], esP);
  })(o, false);
  if (!hallada) throw new Error('la respuesta no traia imagen');
  return hallada;
}
function sacarTexto(o: unknown): string {
  const trozos: string[] = [];
  (function hurgar(n: any, th: boolean) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { for (const x of n) hurgar(x, th); return; }
    const t2 = th || n.type === 'thought' || n.thought === true;
    if (!t2 && n.type === 'text' && typeof n.text === 'string') trozos.push(n.text);
    if (!t2 && typeof n.text === 'string' && !n.type) trozos.push(n.text);
    for (const k in n) hurgar(n[k], t2);
  })(o, false);
  return trozos.join(' ');
}

async function pedirGemini(b64: string, mime: string, enPlato: boolean): Promise<string> {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GEMINI_MODELO || 'gemini-3.1-flash-image',
      input: [
        { type: 'text', text: enPlato ? REGLA_PLATO : REGLA },
        { type: 'image', mime_type: mime, data: b64 },
      ],
      response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '1:1', image_size: process.env.RESOLUCION || '1K' },
    }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error('gemini ' + r.status + ' ' + t.slice(0, 200));
  return sacarImagen(JSON.parse(t));
}

async function conGemini(b64: string, mime: string, enPlato: boolean): Promise<string> {
  let ultimo: unknown = null;
  for (let intento = 0; intento < 3; intento++) {
    if (intento) await new Promise((r) => setTimeout(r, 1500 * intento));
    try { return await pedirGemini(b64, mime, enPlato); }
    catch (e) {
      ultimo = e;
      const m = String((e as Error)?.message || e);
      if (!/\b(429|500|502|503|504)\b|overload|high demand|unavailable|timeout/i.test(m)) throw e;
    }
  }
  throw ultimo;
}

async function revisarFoto(b64: string, mime: string) {
  if (process.env.REVISAR === 'no' || !process.env.GEMINI_API_KEY) return null;
  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.MODELO_REVISION || 'gemini-3.1-flash-lite',
        input: [{ type: 'text', text: REVISION }, { type: 'image', mime_type: mime, data: b64 }],
      }),
    });
    if (!r.ok) return null;
    const txt = sacarTexto(await r.json());
    const m = txt && txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const v = JSON.parse(m[0]);
    return { empezado: v.empezado === true, envase: v.envase === true, motivo: String(v.motivo || '').slice(0, 80) };
  } catch { return null; }
  finally { clearTimeout(corte); }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // ---- POST /api/mejorar ----
  app.post('/api/mejorar', async (req, res) => {
    const listo = MOTOR === 'gemini' && !!process.env.GEMINI_API_KEY;
    if (!listo) return res.status(501).json({ ok: false, causa: 'sin_motor', msg: 'El motor todavía no está conectado en este sitio.' });

    let b64 = String(req.body?.foto || '');
    const m = b64.match(/^data:(image\/[a-z+]+);base64,(.*)$/i);
    const mime = m ? m[1] : 'image/jpeg';
    if (m) b64 = m[2];
    if (!b64 || b64.length < 500) return res.status(400).json({ ok: false, causa: 'vacio', msg: 'No llegó ninguna foto.' });
    if (b64.length > 6e6) return res.status(413).json({ ok: false, causa: 'pesada', msg: 'Esa foto es muy pesada.' });

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'anon';
    const hoy = new Date().toISOString().slice(0, 10);
    if ((topes.get(`d:${hoy}`) || 0) >= LIMITE_DIA) return res.status(429).json({ ok: false, causa: 'tope_dia', msg: 'Hoy ya se usaron todas las pruebas gratis. Vuelve mañana o escríbenos.' });
    if ((topes.get(`i:${hoy}:${ip}`) || 0) >= LIMITE_IP) return res.status(429).json({ ok: false, causa: 'tope_ip', msg: `Ya probaste ${LIMITE_IP} fotos hoy. Escríbenos y te arreglamos toda la carta.` });

    const enPlato = req.body?.plato === true;
    try {
      const [foto, aviso] = await Promise.all([conGemini(b64, mime, enPlato), revisarFoto(b64, mime).catch(() => null)]);
      topes.set(`d:${hoy}`, (topes.get(`d:${hoy}`) || 0) + 1);
      topes.set(`i:${hoy}:${ip}`, (topes.get(`i:${hoy}:${ip}`) || 0) + 1);
      return res.json({ ok: true, motor: MOTOR, foto, plato: enPlato, aviso });
    } catch (e) {
      const txt = String((e as Error)?.message || e);
      if (/not_enough_credits|insufficient/i.test(txt)) return res.status(402).json({ ok: false, causa: 'sin_creditos', msg: 'La cuenta del motor se quedó sin créditos.' });
      if (/nsfw/i.test(txt)) return res.status(422).json({ ok: false, causa: 'nsfw', msg: 'El motor no quiso trabajar esa foto.' });
      console.log('FALLO MOTOR | ' + txt.slice(0, 300));
      return res.status(502).json({ ok: false, causa: 'motor', msg: 'El motor no pudo con esta foto. Prueba con otra.', codigo: codigoCorto(txt) });
    }
  });

  // ---- GET/POST /api/carta ----
  app.get('/api/carta', (req, res) => {
    const r = limpiarId(req.query.r);
    if (!r) return res.status(400).json({ ok: false, causa: 'sin_local' });
    const g = cartas.get(r);
    if (!g) return res.json({ ok: true, existe: false, datos: null });
    return res.json({ ok: true, existe: true, datos: g.datos, guardado: g.guardado });
  });
  app.post('/api/carta', (req, res) => {
    const r = limpiarId(req.body?.r);
    const clave = String(req.body?.clave || '');
    if (!r) return res.status(400).json({ ok: false, causa: 'sin_local', msg: 'Falta el nombre del local.' });
    if (clave.length < 6) return res.status(400).json({ ok: false, causa: 'clave_corta', msg: 'La clave de edición es demasiado corta.' });
    if (!req.body?.datos || typeof req.body.datos !== 'object') return res.status(400).json({ ok: false, causa: 'sin_datos' });
    if (JSON.stringify(req.body.datos).length > 4e5) return res.status(413).json({ ok: false, causa: 'pesada', msg: 'La carta pesa demasiado.' });
    const previo = cartas.get(r);
    if (previo && previo.clave && !igual(previo.clave, clave)) return res.status(403).json({ ok: false, causa: 'clave_mala', msg: 'Esa clave no corresponde a este local.' });
    const guardado = new Date().toISOString();
    cartas.set(r, { clave, guardado, datos: req.body.datos });
    return res.json({ ok: true, guardado, nuevo: !previo });
  });

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`PLATO VIVO en http://localhost:${PORT}${process.env.GEMINI_API_KEY ? '' : '  (sin GEMINI_API_KEY: el motor responde sin_motor)'}`));
}
startServer();
