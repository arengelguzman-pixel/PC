import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// worker/sala.js — Durable Object "Sala": una por local.
// Guarda pedidos, pagos (QR + comprobante), estado de cocina y disponibilidad,
// y los empuja en tiempo real por WebSocket (con hibernación) a cocina, caja y
// cliente. Storage transaccional y fuertemente consistente (SQLite).
//
// Rutas (el Worker reenvía /api/sala/<local>/... aquí):
//   GET  /ws                         WebSocket. Al conectar recibe {type:'estado', pedidos, agotados, qr}
//   GET  /pedidos                    {ok, pedidos, agotados, qr}
//   POST /pedidos                    {mesa, items, nota, total, metodo} → {ok, pedido}
//   GET  /pedidos/:id                {ok, pedido}
//   POST /pedidos/:id/comprobante    {comprobante: dataURL} → pago 'por_confirmar'
//   GET  /pedidos/:id/comprobante    ?clave= → {ok, comprobante}          (personal)
//   POST /pedidos/:id/pago           {clave, estado:'confirmado'|'rechazado'}  (caja)
//   POST /pedidos/:id/cocina         {clave, estado}                        (cocina)
//   GET  /qr                         {ok, qr}   POST /qr {clave, qr}        (caja)
//   POST /agotados                   {clave, slugs[]}                       (cocina)
//   POST /clave                      {clave} registra la 1ª vez; después valida
//   GET  /cierres                    ?clave= → {ok, cierres[], cierreDesde}  (últimos 30, el más nuevo primero)
//   POST /cierres                    {clave, efectivoContado?, nota?} → {ok, cierre}  (caja)
//        Un cierre suma los cobros CONFIRMADOS desde el cierre anterior hasta ahora
//        (total, por método, top de platos) y deja ese momento como inicio del turno.
//        Además ARCHIVA los comprobantes del turno (90 días), arma el PDF del cierre y lo
//        ENVÍA solo: por Telegram al dueño vinculado y/o a un webhook (n8n → WhatsApp).
//   GET  /cierres/:id/pdf            ?clave= → PDF (balance + comprobantes)
//   GET  /archivo/:cierre/:pedido    ?clave= → imagen del comprobante archivado
//   GET  /destino                    ?clave= → {ok, destino, bot, telegramListo, webhook}
//   POST /destino/codigo             {clave} → {ok, code, enlace}  (vincular Telegram, 15 min)
//   POST /destino/quitar             {clave}
//   POST /vincular                   {interno, code, chatId, nombre}  (lo llama el Worker desde /api/telegram)
//
// Los broadcasts nunca incluyen el comprobante (pesa); caja lo pide aparte.

const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const MAX_COMPROBANTE = 1_200_000;     // ~1.2 MB de data URL (el cliente comprime a ~300 KB)
const MAX_QR = 600_000;
const MAX_PEDIDOS = 150;               // los últimos que se mandan a cocina/caja
const ARCHIVO_MS = 90 * 24 * 3600 * 1000;   // comprobantes archivados: 90 días
const pad13 = (n) => String(n).padStart(13, '0');
const bs = (n) => `Bs ${Math.round(n * 100) / 100}`;
const fechaCorta = (ms) => new Date(ms + (-4 * 3600 * 1000)).toISOString().replace('T', ' ').slice(0, 16);   // hora Bolivia (UTC-4)
function bytesDeDataUrl(d) {
  const i = d.indexOf(','); const tipo = d.slice(5, d.indexOf(';'));
  const bin = atob(d.slice(i + 1)); const u = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
  return { tipo, bytes: u };
}
function codigoAzar() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789'; const a = new Uint8Array(6); crypto.getRandomValues(a);
  return [...a].map((x) => abc[x % abc.length]).join('');
}
const COCINA = ['nuevo', 'preparando', 'listo', 'entregado'];
const PAGO = ['pendiente', 'por_confirmar', 'confirmado', 'rechazado'];

function igual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const esDataImg = (s, max) => typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(s) && s.length <= max;

export class Sala {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }

  // ---------- helpers ----------
  async leer(id) { return (await this.ctx.storage.get('p:' + id)) || null; }
  async guardar(p) { p.actualizado = Date.now(); await this.ctx.storage.put('p:' + p.id, p); return p; }
  publico(p) { const { comprobante, ...resto } = p; return resto; }

  async estado() {
    const [mapa, agotados, qr, cierreDesde] = await Promise.all([
      this.ctx.storage.list({ prefix: 'p:' }),
      this.ctx.storage.get('agotados'),
      this.ctx.storage.get('qr'),
      this.ctx.storage.get('cierreDesde'),
    ]);
    const pedidos = [...mapa.values()].sort((a, b) => b.creado - a.creado).slice(0, MAX_PEDIDOS).map((p) => this.publico(p));
    return { pedidos, agotados: agotados || [], qr: qr || null, cierreDesde: cierreDesde || 0 };
  }

  broadcast(msg) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) { try { ws.send(s); } catch { /* socket muerto: se limpia solo */ } }
  }

  async verificarClave(c) {
    const guardada = await this.ctx.storage.get('clave');
    if (!guardada) return { ok: false, causa: 'sin_clave', msg: 'Este local aún no tiene clave de personal. Regístrala en Caja.' };
    if (!igual(String(c || ''), guardada)) return { ok: false, causa: 'clave_mala', msg: 'Clave de personal incorrecta.' };
    return { ok: true };
  }

  async siguienteId() {
    const seq = ((await this.ctx.storage.get('seq')) || 0) + 1;
    await this.ctx.storage.put('seq', seq);
    return 'P-' + String(seq).padStart(3, '0');
  }

  // borra entregados+cerrados de hace más de 36 h para mantener liviana la sala
  async podar() {
    const corte = Date.now() - 36 * 3600 * 1000;
    const [mapa, cierreDesde] = await Promise.all([this.ctx.storage.list({ prefix: 'p:' }), this.ctx.storage.get('cierreDesde')]);
    const viejos = [];
    for (const [k, p] of mapa) {
      // un cobro confirmado que todavía no entró en un cierre se conserva aunque sea viejo
      const cobradoSinCerrar = p.pago === 'confirmado' && (p.confirmadoEn || p.actualizado) > (cierreDesde || 0);
      if (p.cocina === 'entregado' && p.actualizado < corte && !cobradoSinCerrar) viejos.push(k, 'c:' + p.id);
    }
    // archivo de comprobantes: fuera los de cierres de hace más de 90 días (la clave empieza por la fecha)
    const viejosA = await this.ctx.storage.list({ prefix: 'a:', end: 'a:' + pad13(Date.now() - ARCHIVO_MS) });
    for (const k of viejosA.keys()) viejos.push(k);
    if (viejos.length) await this.ctx.storage.delete(viejos);
  }

  async buscarCierre(id) {
    const mapa = await this.ctx.storage.list({ prefix: 'z:' });
    for (const c of mapa.values()) if (c.id === id) return c;
    return null;
  }

  // PDF del cierre: balance en la primera página y un comprobante por página.
  async pdfCierre(c) {
    const doc = await PDFDocument.create();
    const f = await doc.embedFont(StandardFonts.Helvetica), fb = await doc.embedFont(StandardFonts.HelveticaBold);
    const lima = rgb(0.45, 0.72, 0.1), gris = rgb(0.4, 0.4, 0.4), negro = rgb(0.07, 0.07, 0.07);
    const limpiar = (t) => String(t).replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
    let pg = doc.addPage([595, 842]); let y = 790;
    const linea = (t, x, tam = 11, fuente = f, color = negro) => { pg.drawText(limpiar(t), { x, y, size: tam, font: fuente, color }); y -= tam + 6; };
    linea('CIERRE DE CAJA', 48, 20, fb); linea(c.local || '', 48, 14, fb, gris);
    linea(`${c.id} · ${fechaCorta(c.desde || c.hasta)} -> ${fechaCorta(c.hasta)}`, 48, 10, f, gris); y -= 8;
    linea(`Pedidos cobrados: ${c.pedidos}`, 48); linea(`Por QR: ${bs(c.qr)} (${c.qrN})`, 48); linea(`En efectivo: ${bs(c.efectivo)} (${c.efectivoN})`, 48);
    linea(`TOTAL: ${bs(c.total)}`, 48, 16, fb, lima);
    if (c.efectivoContado !== null && c.efectivoContado !== undefined) linea(`Efectivo contado: ${bs(c.efectivoContado)} · diferencia ${c.diferencia >= 0 ? '+' : ''}${c.diferencia}`, 48);
    if (c.nota) linea(`Nota: ${c.nota}`, 48, 10, f, gris);
    if (c.top && c.top.length) { y -= 8; linea('Mas vendidos', 48, 12, fb); for (const [i, t] of c.top.entries()) linea(`${i + 1}. ${t.n}  x${t.q}  ${bs(t.total)}`, 48, 10); }
    const comps = c.comprobantes || [];
    y -= 8; linea(`Comprobantes de QR archivados: ${comps.length}`, 48, 12, fb);
    for (const m of comps) linea(`${m.pedido} · Mesa ${m.mesa || '-'} · ${bs(m.total)} · ${fechaCorta(m.en)}`, 48, 10, f, gris);
    pg.drawText('MEZA · la mesa que atiende', { x: 48, y: 40, size: 9, font: f, color: gris });
    for (const m of comps) {
      const d = await this.ctx.storage.get(`a:${pad13(c.hasta)}:${c.id}:${m.pedido}`);
      if (!d) continue;
      pg = doc.addPage([595, 842]);
      pg.drawText(limpiar(`${m.pedido} · Mesa ${m.mesa || '-'} · ${bs(m.total)} · QR · ${fechaCorta(m.en)}`), { x: 48, y: 800, size: 12, font: fb, color: negro });
      pg.drawText(limpiar((m.items || []).map((l) => `${l.q}x ${l.n}${l.tamT ? ' ' + l.tamT : ''}`).join(' · ')).slice(0, 110), { x: 48, y: 782, size: 9, font: f, color: gris });
      try {
        const { tipo, bytes } = bytesDeDataUrl(d);
        const img = tipo === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const esc = Math.min(499 / img.width, 700 / img.height, 1);
        pg.drawImage(img, { x: 48, y: 770 - img.height * esc, width: img.width * esc, height: img.height * esc });
      } catch { pg.drawText('(no se pudo incrustar la imagen)', { x: 48, y: 740, size: 10, font: f, color: gris }); }
    }
    return await doc.save();
  }

  // Envío automático del cierre: Telegram (dueño vinculado) y/o webhook (n8n → WhatsApp, correo...).
  async enviarCierre(c) {
    const destino = (await this.ctx.storage.get('destino')) || {};
    const envio = {};
    let pdf = null;
    const conPdf = async () => { if (!pdf) pdf = await this.pdfCierre(c); return pdf; };
    const texto = [`Cierre de caja · ${c.local || ''}`, `${c.id} · ${fechaCorta(c.hasta)}`, `Pedidos: ${c.pedidos}`, `QR: ${bs(c.qr)} (${c.qrN})`, `Efectivo: ${bs(c.efectivo)} (${c.efectivoN})`, `TOTAL: ${bs(c.total)}`,
      c.efectivoContado !== null && c.efectivoContado !== undefined ? `Contado: ${bs(c.efectivoContado)} (dif. ${c.diferencia >= 0 ? '+' : ''}${c.diferencia})` : '', c.nota ? `Nota: ${c.nota}` : ''].filter(Boolean).join('\n');
    if (destino.telegram && this.env.TELEGRAM_TOKEN) {
      try {
        const fd = new FormData();
        fd.append('chat_id', destino.telegram.chatId); fd.append('caption', texto.slice(0, 1000));
        fd.append('document', new Blob([await conPdf()], { type: 'application/pdf' }), `cierre-${c.id}.pdf`);
        const r = await fetch(`https://api.telegram.org/bot${this.env.TELEGRAM_TOKEN}/sendDocument`, { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        envio.telegram = j.ok ? 'ok' : `error: ${j.description || r.status}`;
      } catch (e) { envio.telegram = `error: ${e.message || e}`; }
    }
    if (this.env.WEBHOOK_CIERRE) {
      try {
        const bytes = await conPdf(); let b64 = ''; const CH = 0x8000;
        for (let i = 0; i < bytes.length; i += CH) b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        const r = await fetch(this.env.WEBHOOK_CIERRE, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'cierre', local: c.local || '', cierre: c, resumen: texto, pdfBase64: btoa(b64), pdfNombre: `cierre-${c.id}.pdf` }) });
        envio.webhook = r.ok ? 'ok' : `error: ${r.status}`;
      } catch (e) { envio.webhook = `error: ${e.message || e}`; }
    }
    if (Object.keys(envio).length) {
      const mapa = await this.ctx.storage.list({ prefix: 'z:' });
      for (const [k, v] of mapa) if (v.id === c.id) { v.envio = envio; await this.ctx.storage.put(k, v); break; }
    }
  }

  async telegram(metodo, cuerpo) {
    if (!this.env.TELEGRAM_TOKEN) return;
    try { await fetch(`https://api.telegram.org/bot${this.env.TELEGRAM_TOKEN}/${metodo}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }); } catch { /* */ }
  }

  // Cobros confirmados en (desde, hasta] resumidos: total, por método y top de platos.
  async resumirCobros(desde, hasta) {
    const mapa = await this.ctx.storage.list({ prefix: 'p:' });
    const cobros = [...mapa.values()].filter((p) => { const t = p.confirmadoEn || p.actualizado; return p.pago === 'confirmado' && t > desde && t <= hasta; });
    const r = { pedidos: cobros.length, total: 0, qr: 0, efectivo: 0, qrN: 0, efectivoN: 0, top: [], cobros };
    const platos = new Map();
    for (const p of cobros) {
      r.total += p.total;
      if (p.metodo === 'qr') { r.qr += p.total; r.qrN++; } else { r.efectivo += p.total; r.efectivoN++; }
      for (const l of p.items) {
        const n = l.tamT ? `${l.n} · ${l.tamT}` : l.n;
        const a = platos.get(n) || { n, q: 0, total: 0 };
        a.q += l.q; a.total += l.p * l.q; platos.set(n, a);
      }
    }
    r.top = [...platos.values()].sort((a, b) => b.q - a.q || b.total - a.total).slice(0, 8);
    return r;
  }

  // ---------- HTTP ----------
  async fetch(req) {
    const url = new URL(req.url);
    const sub = url.pathname.replace(/^\/api\/sala\/[^/]+/, '') || '/';
    const m = (re) => sub.match(re);
    let body = {};
    if (req.method === 'POST') { try { body = await req.json(); } catch { return json({ ok: false, causa: 'json' }, 400); } }

    // --- websocket ---
    if (sub === '/ws') {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se esperaba WebSocket', { status: 426 });
      const pair = new WebSocketPair();
      const [cliente, servidor] = Object.values(pair);
      this.ctx.acceptWebSocket(servidor);
      servidor.send(JSON.stringify({ type: 'estado', ...(await this.estado()) }));
      return new Response(null, { status: 101, webSocket: cliente });
    }

    // --- reinicio total (pedidos, numeración, cierres y archivo); conserva clave, QR, agotados y Telegram ---
    if (sub === '/reiniciar' && req.method === 'POST') {
      if (!this.env.ADMIN_TOKEN || body.admin !== this.env.ADMIN_TOKEN) return json({ ok: false, causa: 'admin' }, 403);
      const keys = [];
      for (const pref of ['p:', 'z:', 'c:', 'a:']) for (const k of (await this.ctx.storage.list({ prefix: pref })).keys()) keys.push(k);
      keys.push('seq', 'seqZ', 'cierreDesde');
      for (let i = 0; i < keys.length; i += 128) await this.ctx.storage.delete(keys.slice(i, i + 128));
      this.broadcast({ type: 'estado', ...(await this.estado()) });
      return json({ ok: true, borrados: keys.length });
    }

    // --- estado completo ---
    if (sub === '/pedidos' && req.method === 'GET') return json({ ok: true, ...(await this.estado()) });

    // --- crear pedido (cliente) ---
    if (sub === '/pedidos' && req.method === 'POST') {
      const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
      if (!items.length) return json({ ok: false, causa: 'vacio', msg: 'El pedido no tiene platos.' }, 400);
      const total = Number(body.total) || 0;
      if (total <= 0 || total > 100000) return json({ ok: false, causa: 'total' }, 400);
      const metodo = body.metodo === 'qr' ? 'qr' : 'efectivo';
      const now = Date.now();
      const p = {
        id: await this.siguienteId(),
        mesa: String(body.mesa || '').replace(/[^0-9A-Za-z-]/g, '').slice(0, 6),
        items: items.map((l) => ({
          key: String(l.key || '').slice(0, 80), slug: String(l.slug || '').slice(0, 40), n: String(l.n || '').slice(0, 60),
          tamK: String(l.tamK || '').slice(0, 20), tamT: String(l.tamT || '').slice(0, 20),
          borde: !!l.borde, p: Number(l.p) || 0, q: Math.max(1, Math.min(20, Number(l.q) || 1)),
          ...(l.nota ? { nota: String(l.nota).slice(0, 80) } : {}),
          ...(Array.isArray(l.extras) && l.extras.length ? { extras: l.extras.slice(0, 12).map((x) => String(x).slice(0, 40)) } : {}),
        })),
        nota: String(body.nota || '').slice(0, 160),
        total, metodo,
        pago: 'pendiente', tieneComprobante: false,
        cocina: 'nuevo', creado: now, actualizado: now,
      };
      await this.guardar(p);
      this.ctx.waitUntil?.(this.podar());
      this.broadcast({ type: 'pedido', pedido: this.publico(p) });
      return json({ ok: true, pedido: this.publico(p) });
    }

    // --- un pedido ---
    let r;
    if ((r = m(/^\/pedidos\/([A-Z0-9-]+)$/)) && req.method === 'GET') {
      const p = await this.leer(r[1]);
      return p ? json({ ok: true, pedido: this.publico(p) }) : json({ ok: false, causa: 'no_existe' }, 404);
    }

    // --- comprobante: subir (cliente) / ver (personal) ---
    if ((r = m(/^\/pedidos\/([A-Z0-9-]+)\/comprobante$/))) {
      const p = await this.leer(r[1]);
      if (!p) return json({ ok: false, causa: 'no_existe' }, 404);
      if (req.method === 'POST') {
        if (!esDataImg(body.comprobante, MAX_COMPROBANTE)) return json({ ok: false, causa: 'comprobante', msg: 'Sube una imagen (foto o captura) de hasta 1 MB.' }, 400);
        if (p.pago === 'confirmado') return json({ ok: false, causa: 'ya_confirmado' }, 409);
        await this.ctx.storage.put('c:' + p.id, body.comprobante);
        p.tieneComprobante = true; p.pago = 'por_confirmar'; p.metodo = 'qr';
        await this.guardar(p);
        this.broadcast({ type: 'pedido', pedido: this.publico(p) });
        return json({ ok: true, pedido: this.publico(p) });
      }
      if (req.method === 'GET') {
        const v = await this.verificarClave(url.searchParams.get('clave'));
        if (!v.ok) return json(v, 403);
        const c = await this.ctx.storage.get('c:' + p.id);
        return c ? json({ ok: true, comprobante: c }) : json({ ok: false, causa: 'sin_comprobante' }, 404);
      }
    }

    // --- caja: confirmar / rechazar pago ---
    if ((r = m(/^\/pedidos\/([A-Z0-9-]+)\/pago$/)) && req.method === 'POST') {
      const v = await this.verificarClave(body.clave); if (!v.ok) return json(v, 403);
      const p = await this.leer(r[1]); if (!p) return json({ ok: false, causa: 'no_existe' }, 404);
      if (!['confirmado', 'rechazado'].includes(body.estado)) return json({ ok: false, causa: 'estado' }, 400);
      p.pago = body.estado; if (body.estado === 'confirmado') p.confirmadoEn = Date.now();
      await this.guardar(p);
      this.broadcast({ type: 'pedido', pedido: this.publico(p) });
      return json({ ok: true, pedido: this.publico(p) });
    }

    // --- cocina: avanzar estado ---
    if ((r = m(/^\/pedidos\/([A-Z0-9-]+)\/cocina$/)) && req.method === 'POST') {
      const v = await this.verificarClave(body.clave); if (!v.ok) return json(v, 403);
      const p = await this.leer(r[1]); if (!p) return json({ ok: false, causa: 'no_existe' }, 404);
      if (!COCINA.includes(body.estado)) return json({ ok: false, causa: 'estado' }, 400);
      p.cocina = body.estado; if (body.estado === 'nuevo') p.recibido = false; else p.recibido = true;
      await this.guardar(p);
      this.broadcast({ type: 'pedido', pedido: this.publico(p) });
      return json({ ok: true, pedido: this.publico(p) });
    }

    // --- QR de cobro del local ---
    if (sub === '/qr' && req.method === 'GET') return json({ ok: true, qr: (await this.ctx.storage.get('qr')) || null });
    if (sub === '/qr' && req.method === 'POST') {
      const v = await this.verificarClave(body.clave); if (!v.ok) return json(v, 403);
      if (body.qr === null) { await this.ctx.storage.delete('qr'); this.broadcast({ type: 'qr', qr: null }); return json({ ok: true }); }
      if (!esDataImg(body.qr, MAX_QR)) return json({ ok: false, causa: 'qr', msg: 'Sube la imagen del QR de cobro (hasta 500 KB).' }, 400);
      await this.ctx.storage.put('qr', body.qr);
      this.broadcast({ type: 'qr', qr: body.qr });
      return json({ ok: true });
    }

    // --- disponibilidad (cocina) ---
    if (sub === '/agotados' && req.method === 'POST') {
      const v = await this.verificarClave(body.clave); if (!v.ok) return json(v, 403);
      const slugs = Array.isArray(body.slugs) ? body.slugs.map((s) => String(s).slice(0, 40)).slice(0, 200) : [];
      await this.ctx.storage.put('agotados', slugs);
      this.broadcast({ type: 'agotados', slugs });
      return json({ ok: true, slugs });
    }

    // --- cierre de caja (caja) ---
    if (sub === '/cierres' && req.method === 'GET') {
      const v = await this.verificarClave(url.searchParams.get('clave')); if (!v.ok) return json(v, 403);
      const mapa = await this.ctx.storage.list({ prefix: 'z:' });
      const cierres = [...mapa.values()].sort((a, b) => b.hasta - a.hasta).slice(0, 30);
      return json({ ok: true, cierres, cierreDesde: (await this.ctx.storage.get('cierreDesde')) || 0 });
    }
    if (sub === '/cierres' && req.method === 'POST') {
      const v = await this.verificarClave(body.clave); if (!v.ok) return json(v, 403);
      const desde = (await this.ctx.storage.get('cierreDesde')) || 0;
      const hasta = Date.now();
      const r = await this.resumirCobros(desde, hasta);
      if (!r.pedidos) return json({ ok: false, causa: 'sin_cobros', msg: 'No hay cobros confirmados desde el último cierre.' }, 400);
      const seq = ((await this.ctx.storage.get('seqZ')) || 0) + 1;
      const crudo = body.efectivoContado;
      const contado = crudo === null || crudo === undefined || crudo === '' ? null : Number(crudo);
      const cierre = {
        id: 'Z-' + String(seq).padStart(3, '0'), desde, hasta,
        pedidos: r.pedidos, total: r.total, qr: r.qr, efectivo: r.efectivo, qrN: r.qrN, efectivoN: r.efectivoN, top: r.top,
        efectivoContado: Number.isFinite(contado) ? contado : null,
        diferencia: Number.isFinite(contado) ? Math.round((contado - r.efectivo) * 100) / 100 : null,
        nota: String(body.nota || '').slice(0, 200),
      };
      cierre.local = String(body.nombre || '').slice(0, 60);
      // archivo: copia de cada comprobante del turno (la clave empieza por la fecha del cierre → caducan solos a los 90 días)
      const comprobantes = [], copias = {};
      for (const p of r.cobros) {
        if (!p.tieneComprobante) continue;
        const d = await this.ctx.storage.get('c:' + p.id);
        if (!d) continue;
        copias[`a:${pad13(hasta)}:${cierre.id}:${p.id}`] = d;
        comprobantes.push({ pedido: p.id, mesa: p.mesa, total: p.total, en: p.confirmadoEn || p.actualizado, items: p.items.map((l) => ({ n: l.n, q: l.q, tamT: l.tamT })) });
      }
      cierre.comprobantes = comprobantes;
      cierre.envio = {};
      const k = 'z:' + String(seq).padStart(6, '0');
      await this.ctx.storage.put({ [k]: cierre, seqZ: seq, cierreDesde: hasta, ...copias });
      this.broadcast({ type: 'cierre', hasta });        // solo el instante: los montos se piden con clave
      this.ctx.waitUntil(this.enviarCierre(cierre));
      return json({ ok: true, cierre });
    }
    if ((r = m(/^\/cierres\/(Z-[0-9]+)\/pdf$/)) && req.method === 'GET') {
      const v = await this.verificarClave(url.searchParams.get('clave')); if (!v.ok) return json(v, 403);
      const c = await this.buscarCierre(r[1]); if (!c) return json({ ok: false, causa: 'no_existe' }, 404);
      const bytes = await this.pdfCierre(c);
      return new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="cierre-${c.id}.pdf"`, 'Cache-Control': 'no-store' } });
    }
    if ((r = m(/^\/archivo\/(Z-[0-9]+)\/([A-Z0-9-]+)$/)) && req.method === 'GET') {
      const v = await this.verificarClave(url.searchParams.get('clave')); if (!v.ok) return json(v, 403);
      const c = await this.buscarCierre(r[1]); if (!c) return json({ ok: false, causa: 'no_existe' }, 404);
      const d = await this.ctx.storage.get(`a:${pad13(c.hasta)}:${c.id}:${r[2]}`);
      if (!d) return json({ ok: false, causa: 'no_existe' }, 404);
      const { tipo, bytes } = bytesDeDataUrl(d);
      return new Response(bytes, { headers: { 'Content-Type': tipo, 'Cache-Control': 'private, max-age=3600' } });
    }

    // --- destino del envío automático (Telegram) ---
    const localId = url.pathname.split('/')[3] || '';
    if (sub === '/destino' && req.method === 'GET') {
      const v = await this.verificarClave(url.searchParams.get('clave')); if (!v.ok) return json(v, 403);
      const d = (await this.ctx.storage.get('destino')) || {};
      return json({ ok: true, destino: { telegram: d.telegram ? { nombre: d.telegram.nombre, desde: d.telegram.desde } : null }, bot: this.env.TELEGRAM_BOT || '', telegramListo: !!this.env.TELEGRAM_TOKEN && !!this.env.TELEGRAM_BOT, webhook: !!this.env.WEBHOOK_CIERRE });
    }
    if (sub === '/destino/codigo' && req.method === 'POST') {
      const v = await this.verificarClave(body.clave); if (!v.ok) return json(v, 403);
      const code = codigoAzar();
      await this.ctx.storage.put('vinculo', { code, exp: Date.now() + 15 * 60 * 1000 });
      const bot = this.env.TELEGRAM_BOT || '';
      return json({ ok: true, code, param: `${localId}-${code}`, enlace: bot ? `https://t.me/${bot}?start=${localId}-${code}` : '' });
    }
    if (sub === '/destino/quitar' && req.method === 'POST') {
      const v = await this.verificarClave(body.clave); if (!v.ok) return json(v, 403);
      await this.ctx.storage.delete('destino');
      return json({ ok: true });
    }
    if (sub === '/vincular' && req.method === 'POST') {
      if (!this.env.TELEGRAM_WEBHOOK_SECRET || body.interno !== this.env.TELEGRAM_WEBHOOK_SECRET) return json({ ok: false, causa: 'interno' }, 403);
      const vinc = await this.ctx.storage.get('vinculo');
      const chatId = String(body.chatId || '');
      if (!vinc || vinc.code !== String(body.code || '') || vinc.exp < Date.now()) {
        await this.telegram('sendMessage', { chat_id: chatId, text: 'Ese enlace ya no sirve. En Caja toca "Vincular Telegram" para generar uno nuevo (dura 15 minutos).' });
        return json({ ok: false, causa: 'codigo' }, 400);
      }
      await this.ctx.storage.put('destino', { telegram: { chatId, nombre: String(body.nombre || '').slice(0, 60), desde: Date.now() } });
      await this.ctx.storage.delete('vinculo');
      await this.telegram('sendMessage', { chat_id: chatId, text: `Listo. Cada vez que cierren caja en ${localId} vas a recibir aquí el balance y el PDF con los comprobantes.` });
      return json({ ok: true });
    }

    // --- clave de personal ---
    if (sub === '/clave' && req.method === 'POST') {
      const c = String(body.clave || '');
      if (c.length < 4) return json({ ok: false, causa: 'clave_corta', msg: 'La clave debe tener al menos 4 caracteres.' }, 400);
      const guardada = await this.ctx.storage.get('clave');
      if (!guardada) { await this.ctx.storage.put('clave', c); return json({ ok: true, nueva: true }); }
      return igual(c, guardada) ? json({ ok: true, nueva: false }) : json({ ok: false, causa: 'clave_mala', msg: 'Clave incorrecta.' }, 403);
    }

    return json({ ok: false, causa: 'ruta' }, 404);
  }

  // ---------- WebSocket (hibernación) ----------
  async webSocketMessage(ws, msg) {
    if (msg === 'ping') { try { ws.send('pong'); } catch { /* */ } }
  }
  async webSocketClose(ws) { try { ws.close(); } catch { /* */ } }
  async webSocketError(ws) { try { ws.close(); } catch { /* */ } }
}
