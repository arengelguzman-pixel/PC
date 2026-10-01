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
//
// Los broadcasts nunca incluyen el comprobante (pesa); caja lo pide aparte.

const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const MAX_COMPROBANTE = 1_200_000;     // ~1.2 MB de data URL (el cliente comprime a ~300 KB)
const MAX_QR = 600_000;
const MAX_PEDIDOS = 150;               // los últimos que se mandan a cocina/caja
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
    if (viejos.length) await this.ctx.storage.delete(viejos);
  }

  // Cobros confirmados en (desde, hasta] resumidos: total, por método y top de platos.
  async resumirCobros(desde, hasta) {
    const mapa = await this.ctx.storage.list({ prefix: 'p:' });
    const cobros = [...mapa.values()].filter((p) => { const t = p.confirmadoEn || p.actualizado; return p.pago === 'confirmado' && t > desde && t <= hasta; });
    const r = { pedidos: cobros.length, total: 0, qr: 0, efectivo: 0, qrN: 0, efectivoN: 0, top: [] };
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
      const k = 'z:' + String(seq).padStart(6, '0');
      await this.ctx.storage.put({ [k]: cierre, seqZ: seq, cierreDesde: hasta });
      this.broadcast({ type: 'cierre', hasta });        // solo el instante: los montos se piden con clave
      return json({ ok: true, cierre });
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
