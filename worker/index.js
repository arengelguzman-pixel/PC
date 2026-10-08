function __name(f){return f}
import { Sala } from './sala.js';
// src/mejorar.js
var REGLA = `Re-photograph this dish as a professional food photograph for a restaurant menu.

THE FOOD AND ITS CONTAINER ARE SACRED \u2014 copy them exactly:
The exact same items, the exact same count, the exact same size, shape, position and
angle inside the frame. The same plate, bowl, basket or container holding them, in the same material and the
same shape: if it is disposable foam, plastic or paper, it stays disposable foam,
plastic or paper \u2014 never upgrade it to ceramic. Do not add,
remove, resize, duplicate or replace a single item of food. Do not add garnish, herbs,
seeds, sauce or decoration that is not already there. Do not change the recipe, the
colour of the food, or how cooked it looks. Do not re-frame, zoom or move the camera.
A customer who orders this must receive exactly what they see.

KEEP THE FRAMING LOCKED:
The plate must occupy exactly the same area of the frame as in the input, at the same
scale, in the same position, seen from the same camera height and angle. Do not pull the
camera back, do not zoom in, do not re-centre. Overlay the result on the input and the
plate must land on top of itself.

EVERYTHING ELSE IN THE FRAME IS CLUTTER \u2014 delete it:
Serving trays, plastic, packaging, juice cartons, drinks, sachets, wrappers, cutlery,
napkins, hands, fingers, furniture, chairs, other tables, floors, logos and text.
Replace all of it with a clean, calm, softly out-of-focus surface \u2014 warm natural wood
or matte neutral stone \u2014 with nothing else on it. The plate must sit alone.

TIDY THE PLATING \u2014 arrange, never invent:
You may reposition items that are ALREADY there so the plate reads clean and balanced,
the way a cook straightens a dish before it leaves the kitchen. You may wipe sauce
smears, drips and stray crumbs off the rim of the plate and off the container. You may
straighten a piece sitting crooked and tuck a loose garnish back into place.
This is arranging what exists. It is NEVER creating: you still may not add a single
piece, restore a bite that was taken, close a cut, refill a sauce, or make the portion
look bigger than it is.

RE-SHOOT IT PROPERLY:
Light it with a large soft diffused key from the upper left and a gentle fill, as in a
food studio. Neutral white balance, no orange or green cast. Deep, rich, natural colour.
A soft realistic contact shadow under the plate. Shallow depth of field so the background
falls away. Tack-sharp focus on the food with visible surface texture and crumb detail.

CLEAN IT UP COMPLETELY:
Remove ALL sensor noise, grain, colour speckle, motion blur, haze and JPEG compression
artifacts. The result must be clean and crisp, like a raw file from a full-frame camera
with a 50mm macro lens \u2014 not like a phone snapshot with a filter on top.

Output only the final photograph.

This is a retouch, not a filter. If the output still shows the original background,
the original noise, or the original phone-camera look, you have failed the task.
The only thing that survives from the input is the food and the plate it sits on.`;
var REGLA_PLATO = `Re-photograph this dish as a professional food photograph for a restaurant menu.

THE FOOD AND ITS CONTAINER ARE SACRED \u2014 copy them exactly:
The exact same items, the exact same count, the exact same size, shape, position and
angle inside the frame. SERVE IT ON A PLATE: this food arrived in a disposable takeaway container (foam,
plastic, paper or cardboard). Move that exact same food, completely unchanged, onto a
plain simple white ceramic plate or bowl, arranged the way a cook would serve it at a
table. Plain white only: no slate board, no wooden platter, no rim pattern, no styling
props. The FOOD is untouched \u2014 the same pieces, the same count, the same portion, the
same sauces, the same amount of everything. Only the vessel changes. Do not add,
remove, resize, duplicate or replace a single item of food. Do not add garnish, herbs,
seeds, sauce or decoration that is not already there. Do not change the recipe, the
colour of the food, or how cooked it looks. Do not re-frame, zoom or move the camera.
A customer who orders this must receive exactly what they see.

KEEP THE FRAMING LOCKED:
The plate must occupy exactly the same area of the frame as in the input, at the same
scale, in the same position, seen from the same camera height and angle. Do not pull the
camera back, do not zoom in, do not re-centre. Overlay the result on the input and the
plate must land on top of itself.

EVERYTHING ELSE IN THE FRAME IS CLUTTER \u2014 delete it:
Serving trays, plastic, packaging, juice cartons, drinks, sachets, wrappers, cutlery,
napkins, hands, fingers, furniture, chairs, other tables, floors, logos and text.
Replace all of it with a clean, calm, softly out-of-focus surface \u2014 warm natural wood
or matte neutral stone \u2014 with nothing else on it. The plate must sit alone.

TIDY THE PLATING \u2014 arrange, never invent:
You may reposition items that are ALREADY there so the plate reads clean and balanced,
the way a cook straightens a dish before it leaves the kitchen. You may wipe sauce
smears, drips and stray crumbs off the rim of the plate and off the container. You may
straighten a piece sitting crooked and tuck a loose garnish back into place.
This is arranging what exists. It is NEVER creating: you still may not add a single
piece, restore a bite that was taken, close a cut, refill a sauce, or make the portion
look bigger than it is.

RE-SHOOT IT PROPERLY:
Light it with a large soft diffused key from the upper left and a gentle fill, as in a
food studio. Neutral white balance, no orange or green cast. Deep, rich, natural colour.
A soft realistic contact shadow under the plate. Shallow depth of field so the background
falls away. Tack-sharp focus on the food with visible surface texture and crumb detail.

CLEAN IT UP COMPLETELY:
Remove ALL sensor noise, grain, colour speckle, motion blur, haze and JPEG compression
artifacts. The result must be clean and crisp, like a raw file from a full-frame camera
with a 50mm macro lens \u2014 not like a phone snapshot with a filter on top.

Output only the final photograph.

This is a retouch, not a filter. If the output still shows the original background,
the original noise, or the original phone-camera look, you have failed the task.
The only thing that survives from the input is the food and the plate it sits on.`;
var REVISION = `Look at this photograph of food. Answer ONLY with a JSON object, no other text:
{"empezado": true|false, "envase": true|false, "motivo": "<max 8 words, Spanish>"}

"empezado" = true ONLY if there is clear, unambiguous evidence that someone already
started eating: a visible bite taken out of an item, a piece cut open and partly gone,
food smeared across a plate mid-meal, a half-empty plate, or dirty used cutlery resting
in the food. Deliberate chef's plating, an artistic or abstract presentation, a
deconstructed dish, a sliced or halved item presented on purpose, a sauce swoosh, or a
dish that simply looks unusual are all NORMAL - those are false.
When in doubt, answer false.

"envase" = true if the food is served in a disposable takeaway container (foam, plastic,
paper, cardboard box). False for plates, bowls, baskets, pans, boards.`;
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json = /* @__PURE__ */ __name((o, s) => new Response(JSON.stringify(o), {
  status: s || 200,
  headers: { "Content-Type": "application/json; charset=utf-8", ...CORS }
}), "json");
async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
async function onRequestPost({ request, env }) {
  const motor = (env.MOTOR || "gemini").toLowerCase();
  const listo = motor === "gemini" ? !!env.GEMINI_API_KEY : !!(env.HF_KEY_ID && env.HF_KEY_SECRET);
  if (!listo) {
    return json({
      ok: false,
      causa: "sin_motor",
      msg: "El motor todavia no esta conectado en este sitio."
    }, 501);
  }
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ ok: false, causa: "json", msg: "Peticion invalida." }, 400);
  }
  let b64 = String(cuerpo.foto || "");
  const m = b64.match(/^data:(image\/[a-z+]+);base64,(.*)$/i);
  const mime = m ? m[1] : "image/jpeg";
  if (m) b64 = m[2];
  if (!b64 || b64.length < 500) {
    return json({ ok: false, causa: "vacio", msg: "No llego ninguna foto." }, 400);
  }
  if (b64.length > 6e6) {
    return json({ ok: false, causa: "pesada", msg: "Esa foto es muy pesada." }, 413);
  }
  const ip = request.headers.get("CF-Connecting-IP") || "anon";
  const hoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let tope = { ok: true };
  try {
    tope = await revisarTope(env, ip, hoy);
  } catch (e) {
    console.log("contador fall\xF3, se deja pasar: " + e);
  }
  if (!tope.ok) {
    console.log("TOPE | " + tope.causa + " | ip=" + ip);
    return json({ ok: false, causa: tope.causa, msg: tope.msg }, 429);
  }
  const enPlato = cuerpo.plato === true;
  try {
    const [salida, aviso] = await Promise.all([
      motor === "gemini" ? conGemini(env, b64, mime, enPlato) : conHiggsfield(env, b64, mime, enPlato),
      revisarFoto(env, b64, mime).catch(() => null)
    ]);
    await sumarTope(env, ip, hoy);
    return json({ ok: true, motor, foto: salida, plato: enPlato, aviso });
  } catch (e) {
    const txt = String(e && e.message || e);
    if (/not_enough_credits|insufficient/i.test(txt)) {
      return json({
        ok: false,
        causa: "sin_creditos",
        msg: "La cuenta del motor se quedo sin creditos."
      }, 402);
    }
    if (/nsfw/i.test(txt)) {
      return json({
        ok: false,
        causa: "nsfw",
        msg: "El motor no quiso trabajar esa foto. Prueba con una donde se vea solo el plato."
      }, 422);
    }
    console.log("FALLO MOTOR | motor=" + motor + " | plato=" + enPlato + " | bytes=" + b64.length + " | " + txt.slice(0, 400));
    return json({
      ok: false,
      causa: "motor",
      msg: "El motor no pudo con esta foto. Prueba con otra.",
      codigo: codigoCorto(txt),
      detalle: txt.slice(0, 300)
    }, 502);
  }
}
async function conGemini(env, b64, mime, enPlato) {
  let ultimo = null;
  for (let intento = 0; intento < 3; intento++) {
    if (intento) await new Promise((r) => setTimeout(r, 1500 * intento));
    try {
      return await pedirGemini(env, b64, mime, enPlato);
    } catch (e) {
      ultimo = e;
      const m = String(e && e.message || e);
      const reintentable = /\b(429|500|502|503|504)\b|overload|high demand|unavailable|timeout/i.test(m);
      if (!reintentable) throw e;
      console.log("reintento " + (intento + 1) + " tras: " + m.slice(0, 200));
    }
  }
  throw ultimo;
}
async function pedirGemini(env, b64, mime, enPlato) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.GEMINI_MODELO || "gemini-3.1-flash-image",
      input: [
        { type: "text", text: enPlato ? REGLA_PLATO : REGLA },
        { type: "image", mime_type: mime, data: b64 }
      ],
      response_format: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: "1:1",
        image_size: env.RESOLUCION || "1K"
      }
    })
  });
  const t = await r.text();
  if (!r.ok) throw new Error("gemini " + r.status + " " + t.slice(0, 200));
  return sacarImagen(JSON.parse(t));
}
function codigoCorto(txt) {
  const t = String(txt);
  const n = t.match(/\b(4\d\d|5\d\d)\b/);
  if (/quota|exceeded|billing/i.test(t)) return "CUOTA" + (n ? "-" + n[1] : "");
  if (/high demand|overload|unavailable/i.test(t)) return "SATURADO" + (n ? "-" + n[1] : "");
  if (/safety|blocked|policy/i.test(t)) return "FILTRO";
  if (/no traia imagen/i.test(t)) return "SIN-IMAGEN";
  if (/api key|permission|denied|401|403/i.test(t)) return "LLAVE";
  return n ? "HTTP-" + n[1] : "DESCONOCIDO";
}
async function revisarFoto(env, b64, mime) {
  if (env.REVISAR === "no" || !env.GEMINI_API_KEY) return null;
  const ctrl = new AbortController();
  const corte = setTimeout(() => ctrl.abort(), 12e3);
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.MODELO_REVISION || "gemini-3.1-flash-lite",
        input: [
          { type: "text", text: REVISION },
          { type: "image", mime_type: mime, data: b64 }
        ]
      })
    });
    if (!r.ok) return null;
    const txt = sacarTexto(await r.json());
    const m = txt && txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const v = JSON.parse(m[0]);
    return {
      empezado: v.empezado === true,
      envase: v.envase === true,
      motivo: String(v.motivo || "").slice(0, 80)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(corte);
  }
}
function sacarTexto(o) {
  const trozos = [];
  (/* @__PURE__ */ __name((function hurgar(n, th) {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) {
      for (const x of n) hurgar(x, th);
      return;
    }
    const t2 = th || n.type === "thought" || n.thought === true;
    if (!t2 && n.type === "text" && typeof n.text === "string") trozos.push(n.text);
    if (!t2 && typeof n.text === "string" && !n.type) trozos.push(n.text);
    for (const k in n) hurgar(n[k], t2);
  }), "hurgar"))(o, false);
  return trozos.join(" ");
}
function sacarImagen(o) {
  let hallada = null;
  (/* @__PURE__ */ __name((function hurgar(n, dentroDePensamiento) {
    if (!n || hallada || typeof n !== "object") return;
    if (Array.isArray(n)) {
      for (const x of n) hurgar(x, dentroDePensamiento);
      return;
    }
    const esPensamiento = dentroDePensamiento || n.type === "thought" || n.thought === true;
    const datos = n.data || n.b64_json || n.inlineData && n.inlineData.data || n.inline_data && n.inline_data.data;
    const tipo = n.mime_type || n.mimeType || n.inlineData && n.inlineData.mimeType || n.inline_data && n.inline_data.mime_type || "";
    if (!esPensamiento && typeof datos === "string" && datos.length > 1e3 && (n.type === "image" || /^image\//.test(tipo))) {
      hallada = "data:" + (tipo || "image/jpeg") + ";base64," + datos;
      return;
    }
    for (const k in n) hurgar(n[k], esPensamiento);
  }), "hurgar"))(o, false);
  if (!hallada) throw new Error("la respuesta no traia imagen");
  return hallada;
}
async function conHiggsfield(env, b64, mime, enPlato) {
  const API = "https://api.higgsfield.ai";
  const llave = `Key ${env.HF_KEY_ID}:${env.HF_KEY_SECRET}`;
  const jsonH = { "Authorization": llave, "Content-Type": "application/json", "Accept": "application/json" };
  const tipo = /png|webp|gif/.test(mime) ? mime : "image/jpeg";
  const u = await fetch(`${API}/files/generate-upload-url`, {
    method: "POST",
    headers: jsonH,
    body: JSON.stringify({ content_type: tipo })
  });
  if (!u.ok) throw new Error("hf upload-url " + u.status + " " + (await u.text()).slice(0, 180));
  const { public_url, upload_url, upload_headers } = await u.json();
  if (!public_url || !upload_url) throw new Error("hf upload-url sin datos");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const put = await fetch(upload_url, {
    method: "PUT",
    headers: upload_headers || { "Content-Type": tipo },
    body: bytes
  });
  if (!put.ok) throw new Error("hf put " + put.status);
  const sub = await fetch(`${API}/${env.HF_RUTA || "nano-banana-2/image-to-image"}`, {
    method: "POST",
    headers: jsonH,
    body: JSON.stringify({
      prompt: enPlato ? REGLA_PLATO : REGLA,
      image_urls: [public_url],
      resolution: env.RESOLUCION || "1k",
      aspect_ratio: "1:1",
      output_format: "jpeg"
    })
  });
  if (!sub.ok) throw new Error("hf submit " + sub.status + " " + (await sub.text()).slice(0, 220));
  let est = await sub.json();
  const statusUrl = est.status_url;
  if (!statusUrl) throw new Error("hf sin status_url");
  const hasta = Date.now() + 7e4;
  while (est.status !== "completed") {
    if (est.status === "nsfw") throw new Error("nsfw");
    if (est.status === "failed" || est.status === "canceled") throw new Error("hf " + est.status);
    if (Date.now() > hasta) throw new Error("hf tardo demasiado");
    await new Promise((r) => setTimeout(r, 1600));
    const p = await fetch(statusUrl, { headers: { "Authorization": llave, "Accept": "application/json" } });
    if (!p.ok) throw new Error("hf poll " + p.status);
    est = await p.json();
  }
  const url = est.images && est.images[0] && est.images[0].url;
  if (!url) throw new Error("hf completado sin imagen");
  const im = await fetch(url);
  if (!im.ok) throw new Error("hf descarga " + im.status);
  return "data:image/jpeg;base64," + aB64(await im.arrayBuffer());
}
function aB64(ab) {
  const u = new Uint8Array(ab);
  let s = "";
  for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode(...u.subarray(i, i + 32768));
  return btoa(s);
}
async function contador(env) {
  if (env.LIMITES) return {
    get: /* @__PURE__ */ __name(async (k) => Number(await env.LIMITES.get(k) || 0), "get"),
    set: /* @__PURE__ */ __name(async (k, v) => env.LIMITES.put(k, String(v), { expirationTtl: 172800 }), "set")
  };
  const c = caches.default;
  const llave = /* @__PURE__ */ __name((k) => new Request("https://tope.plato-vivo/" + encodeURIComponent(k)), "llave");
  return {
    get: /* @__PURE__ */ __name(async (k) => {
      const r = await c.match(llave(k));
      return r ? Number(await r.text()) : 0;
    }, "get"),
    set: /* @__PURE__ */ __name(async (k, v) => c.put(llave(k), new Response(
      String(v),
      { headers: { "Cache-Control": "max-age=172800" } }
    )), "set")
  };
}
async function revisarTope(env, ip, hoy) {
  const dia = Number(env.LIMITE_DIA || 80), porIp = Number(env.LIMITE_IP || 3);
  const c = await contador(env);
  if (await c.get(`d:${hoy}`) >= dia)
    return {
      ok: false,
      causa: "tope_dia",
      msg: "Hoy ya se usaron todas las pruebas gratis. Vuelve manana o escribenos."
    };
  if (await c.get(`i:${hoy}:${ip}`) >= porIp)
    return {
      ok: false,
      causa: "tope_ip",
      msg: `Ya probaste ${porIp} fotos hoy. Escribenos y te arreglamos toda la carta.`
    };
  return { ok: true };
}
async function sumarTope(env, ip, hoy) {
  const c = await contador(env);
  await c.set(`d:${hoy}`, await c.get(`d:${hoy}`) + 1);
  await c.set(`i:${hoy}:${ip}`, await c.get(`i:${hoy}:${ip}`) + 1);
}

// src/carta.js
var CORS2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json2 = /* @__PURE__ */ __name((o, s) => new Response(JSON.stringify(o), {
  status: s || 200,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS2 }
}), "json");
var limpiarId = /* @__PURE__ */ __name((v) => String(v || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40), "limpiarId");
var TOPE = 4e5;
async function onRequestOptions2() {
  return new Response(null, { status: 204, headers: CORS2 });
}
async function onRequestGet({ request, env }) {
  if (!env.CARTAS) return json2({ ok: false, causa: "sin_deposito" }, 501);
  const r = limpiarId(new URL(request.url).searchParams.get("r"));
  if (!r) return json2({ ok: false, causa: "sin_local" }, 400);
  const crudo = await env.CARTAS.get("carta:" + r);
  if (!crudo) return json2({ ok: true, existe: false, datos: null });
  let g;
  try {
    g = JSON.parse(crudo);
  } catch {
    return json2({ ok: true, existe: false, datos: null });
  }
  return json2({ ok: true, existe: true, datos: g.datos, guardado: g.guardado || null });
}
async function onRequestPost2({ request, env }) {
  if (!env.CARTAS) {
    return json2({
      ok: false,
      causa: "sin_deposito",
      msg: "Este sitio todav\xEDa no tiene d\xF3nde guardar las cartas."
    }, 501);
  }
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return json2({ ok: false, causa: "json" }, 400);
  }
  const r = limpiarId(cuerpo.r);
  const clave = String(cuerpo.clave || "");
  if (!r) return json2({ ok: false, causa: "sin_local", msg: "Falta el nombre del local." }, 400);
  if (clave.length < 6) {
    return json2({
      ok: false,
      causa: "clave_corta",
      msg: "La clave de edici\xF3n es demasiado corta."
    }, 400);
  }
  if (!cuerpo.datos || typeof cuerpo.datos !== "object") {
    return json2({ ok: false, causa: "sin_datos" }, 400);
  }
  const texto = JSON.stringify(cuerpo.datos);
  if (texto.length > TOPE) {
    return json2({
      ok: false,
      causa: "pesada",
      msg: "La carta pesa demasiado. Prueba con un logo m\xE1s chico."
    }, 413);
  }
  const previo = await env.CARTAS.get("carta:" + r);
  if (previo) {
    let g = null;
    try {
      g = JSON.parse(previo);
    } catch {
    }
    if (g && g.clave && !igual(g.clave, clave)) {
      return json2({
        ok: false,
        causa: "clave_mala",
        msg: "Esa clave no corresponde a este local."
      }, 403);
    }
  }
  const guardado = (/* @__PURE__ */ new Date()).toISOString();
  await env.CARTAS.put("carta:" + r, JSON.stringify({ clave, guardado, datos: cuerpo.datos }));
  return json2({ ok: true, guardado, nuevo: !previo });
}
function igual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// src/index.js
var index_default = {
  async fetch(request, env, ctx) {
    const ALIAS = { garaje: "elgaraje-a3f9k2m8x1", "garaje-prueba": "elgaraje-prueba-x9q4" };
    const u = new URL(request.url);
    // webhook del bot de Telegram: "/start <local>-<codigo>" vincula al dueño con la sala de su local
    if (u.pathname === "/api/telegram" && request.method === "POST") {
      if (!env.TELEGRAM_WEBHOOK_SECRET || request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) return new Response("no", { status: 403 });
      let up = {}; try { up = await request.json(); } catch { /* */ }
      const msg = up.message || up.edited_message;
      const mm = String(msg && msg.text || "").match(/^\/start[ _]+([a-z0-9-]+?)-([a-z0-9]{6})$/i);
      if (msg && mm) {
        const local = mm[1].toLowerCase();
        const nombre = [msg.from && msg.from.first_name, msg.from && msg.from.last_name].filter(Boolean).join(" ") || (msg.chat && msg.chat.username) || "";
        ctx.waitUntil(env.SALA.get(env.SALA.idFromName(local)).fetch(new Request(`https://sala/api/sala/${local}/vincular`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interno: env.TELEGRAM_WEBHOOK_SECRET, code: mm[2], chatId: String(msg.chat.id), nombre }),
        })));
      }
      return new Response("ok");
    }
    // sala en tiempo real de un local (pedidos, pagos, cocina, caja)
    if (u.pathname.startsWith("/api/sala/")) {
      const local = String(u.pathname.split("/")[3] || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
      if (!local) return new Response(JSON.stringify({ ok: false, causa: "sin_local" }), { status: 400, headers: { "Content-Type": "application/json" } });
      return env.SALA.get(env.SALA.idFromName(local)).fetch(request);
    }
    if (u.pathname === "/api/mejorar") {
      if (request.method === "OPTIONS") return onRequestOptions();
      if (request.method === "POST") return onRequestPost({ request, env, ctx });
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (u.pathname === "/api/carta") {
      if (request.method === "OPTIONS") return onRequestOptions2();
      if (request.method === "GET") return onRequestGet({ request, env, ctx });
      if (request.method === "POST") return onRequestPost2({ request, env, ctx });
      return new Response("Method Not Allowed", { status: 405 });
    }
    // Links cortos por local (para el dominio propio): meza.link/garaje?mesa=3 → /m/<token>?mesa=3
    const alias = ALIAS[u.pathname.slice(1).toLowerCase()];
    if (alias) return Response.redirect(new URL(`/m/${alias}${u.search}`, u).toString(), 302);
    if (u.pathname === "/" || u.pathname.endsWith("/")) {
      return env.ASSETS.fetch(new Request(new URL(u.pathname + "index.html", u), request));
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  index_default as default,
  Sala
};

