/* Estudio IA de Plato Vivo
 * - Mejorar: arregla la foto real del platillo (IA o ajuste local gratis)
 * - Crear: genera imágenes desde texto
 * - Marca: agrega texto, logo, precio y colores del restaurante (canvas, sin IA)
 * - Galería: todo se guarda en el celular (IndexedDB)
 */
(() => {
  'use strict';

  const API_URL = '/api/generate';
  const MAX_UPLOAD_SIDE = 1536;

  // ---------- Estilos de mejora (se pueden editar libremente) ----------
  const EDIT_PRESETS = [
    { id: 'pro', label: 'Foto profesional', hint: 'Luz de estudio', emoji: '✨', bg: 'linear-gradient(135deg,#3b2f1e,#b8862b)',
      prompt: 'Professional food photography retouch: soft diffused studio lighting, accurate appetizing colors, crisp detail, clean plate edges, gentle shallow depth of field.' },
    { id: 'delivery', label: 'Apps de delivery', hint: 'Fondo limpio', emoji: '🛵', bg: 'linear-gradient(135deg,#1e3b2c,#2bb86a)',
      prompt: 'Make it ready for a delivery app menu (Rappi, Uber Eats, DiDi Food): dish centered, clean seamless light neutral background, bright even lighting, no clutter, high clarity.' },
    { id: 'insta', label: 'Instagram', hint: 'Vibrante y moderno', emoji: '📸', bg: 'linear-gradient(135deg,#40163b,#e1306c)',
      prompt: 'Trendy Instagram food post look: vibrant but natural colors, warm highlights, subtle contrast, stylish modern table setting kept minimal.' },
    { id: 'steam', label: 'Recién hecho', hint: 'Vapor y brillo', emoji: '♨️', bg: 'linear-gradient(135deg,#402016,#e0662b)',
      prompt: 'Make the dish look freshly served and hot: add delicate realistic steam, glistening sauces and textures, warm golden light.' },
    { id: 'wood', label: 'Madera rústica', hint: 'Cálido, casero', emoji: '🪵', bg: 'linear-gradient(135deg,#2e1f12,#8a5a2b)',
      prompt: 'Place the dish on a rustic dark wooden table with warm cozy ambient light and a few tasteful natural props (herbs, linen napkin) that match the cuisine.' },
    { id: 'marble', label: 'Mármol elegante', hint: 'Restaurante fino', emoji: '🍽️', bg: 'linear-gradient(135deg,#2b2b30,#b9b9c4)',
      prompt: 'Fine dining presentation on a white marble surface, elegant minimalist styling, soft window light, refined high-end restaurant mood.' },
    { id: 'dark', label: 'Dark & moody', hint: 'Dramático', emoji: '🌑', bg: 'linear-gradient(135deg,#0e0e10,#3a3a44)',
      prompt: 'Dark and moody food photography: deep dark background, single dramatic side light, rich shadows, colors of the food glowing.' },
    { id: 'top', label: 'Vista cenital', hint: 'Desde arriba', emoji: '⬇️', bg: 'linear-gradient(135deg,#16303f,#2b8ab8)',
      prompt: 'Re-frame as a clean top-down flat lay shot of the same dish, perfectly centered, balanced composition, even soft light.' },
  ];

  const EDIT_BASE =
    'Edit this photo of a real restaurant dish. Keep exactly the same food: same ingredients, portions, plating and dish identity — do not invent or remove food items. ' +
    'Fix bad phone-photo issues (dim or yellow light, blur, noise, messy background, crooked angle) so it looks appetizing and professional. ';

  const CREATE_PRESETS = [
    { label: 'Tacos al pastor', emoji: '🌮', bg: 'linear-gradient(135deg,#40210f,#d9822b)',
      prompt: 'Tacos al pastor with pineapple, cilantro and onion on a rustic clay plate, lime wedges, warm street-food evening light, close-up, appetizing' },
    { label: 'Hamburguesa', emoji: '🍔', bg: 'linear-gradient(135deg,#3a1d10,#c2562b)',
      prompt: 'Juicy double smash burger with melted cheddar, glossy brioche bun, fries on the side, dark background, dramatic lighting, commercial food photography' },
    { label: 'Postre', emoji: '🍰', bg: 'linear-gradient(135deg,#3b1630,#d96aa7)',
      prompt: 'Elegant slice of chocolate cake with berries and a dusting of powdered sugar on a pastel plate, soft natural light, bakery aesthetic' },
    { label: 'Bebida', emoji: '🍹', bg: 'linear-gradient(135deg,#0f2f3b,#2bc2c2)',
      prompt: 'Refreshing tropical cocktail with ice, condensation drops and citrus garnish, bright summer background, high-speed splash, commercial beverage photo' },
    { label: 'Desayuno', emoji: '🍳', bg: 'linear-gradient(135deg,#3b3310,#e0c02b)',
      prompt: 'Complete breakfast table top-down: chilaquiles, eggs, fresh orange juice and coffee, morning sunlight, cozy cafe style' },
    { label: 'Fondo para menú', emoji: '🖼️', bg: 'linear-gradient(135deg,#1d1d20,#5a5a66)',
      prompt: 'Empty dark slate table surface with scattered fresh herbs and spices on the edges, lots of empty space in the center for text, top-down, restaurant menu background' },
  ];

  const CREATE_STYLE = ' Professional food photography, realistic, appetizing, high detail. No text, no watermarks, no logos.';

  const ASPECTS = [
    { id: '1:1', label: 'Cuadrado 1:1' },
    { id: '4:5', label: 'Post 4:5' },
    { id: '9:16', label: 'Historia 9:16' },
    { id: '16:9', label: 'Horizontal 16:9' },
  ];

  const FORMATS = {
    '1:1': { w: 1080, h: 1080, label: 'Post 1:1' },
    '4:5': { w: 1080, h: 1350, label: 'Post 4:5' },
    '9:16': { w: 1080, h: 1920, label: 'Historia 9:16' },
  };

  const TEMPLATES = [
    { id: 'promo', label: 'Promo', emoji: '🔥', bg: 'linear-gradient(160deg,#222,#000)' },
    { id: 'menu', label: 'Menú', emoji: '📋', bg: 'linear-gradient(160deg,#333,#111)' },
    { id: 'story', label: 'Historia', emoji: '📱', bg: 'linear-gradient(160deg,#2a2a2a,#090909)' },
    { id: 'minimal', label: 'Sello', emoji: '🏷️', bg: 'linear-gradient(160deg,#262626,#0d0d0d)' },
  ];

  const LOADING_LINES = [
    'Analizando tu platillo…', 'Ajustando la luz…', 'Cuidando cada ingrediente…',
    'Dándole color apetitoso…', 'Afinando detalles…', 'Casi listo para servir…',
  ];

  // ---------- Utilidades ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
    },
  };

  let toastTimer;
  function toast(msg, isError = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('is-error', isError);
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), isError ? 4200 : 2400);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = src;
    });
  }

  function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  async function dataUrlToBlob(dataUrl) {
    return (await fetch(dataUrl)).blob();
  }

  // Reduce la foto del celular (que puede pesar 5-10 MB) antes de enviarla.
  async function normalizeFile(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const scale = Math.min(1, MAX_UPLOAD_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return canvasToBlob(c, 'image/jpeg', 0.9);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function fileName(prefix) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function shareBlob(blob, name) {
    const ext = blob.type === 'image/png' ? 'png' : 'jpg';
    const file = new File([blob], `${name}.${ext}`, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Plato Vivo' });
      } catch (err) {
        if (err.name !== 'AbortError') toast('No se pudo compartir', true);
      }
    } else {
      downloadBlob(blob, file.name);
      toast('Tu navegador no permite compartir: se descargó la imagen');
    }
  }

  // ---------- Galería (IndexedDB con respaldo en memoria) ----------
  const gallery = (() => {
    const memory = [];
    let dbPromise;

    function open() {
      if (!dbPromise) {
        dbPromise = new Promise((resolve) => {
          try {
            const req = indexedDB.open('plato-vivo-estudio', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('images', { keyPath: 'id' });
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
          } catch { resolve(null); }
        });
      }
      return dbPromise;
    }

    async function tx(mode, fn) {
      const db = await open();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const t = db.transaction('images', mode);
          const result = fn(t.objectStore('images'));
          t.oncomplete = () => resolve(result && 'result' in result ? result.result : true);
          t.onerror = () => resolve(null);
        } catch { resolve(null); }
      });
    }

    return {
      async add(blob, kind, prompt = '') {
        const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, blob, kind, prompt, createdAt: Date.now() };
        const ok = await tx('readwrite', (s) => s.put(item));
        if (!ok) memory.push(item);
        return item;
      },
      async all() {
        const items = (await tx('readonly', (s) => s.getAll())) || [];
        return [...items, ...memory].sort((a, b) => b.createdAt - a.createdAt);
      },
      async remove(id) {
        const i = memory.findIndex((m) => m.id === id);
        if (i >= 0) memory.splice(i, 1);
        await tx('readwrite', (s) => s.delete(id));
      },
    };
  })();

  // ---------- Conexión con la IA ----------
  const api = { ready: false, needsCode: false, checked: false };

  async function checkApi() {
    const pill = $('#statusPill');
    try {
      const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      const info = await res.json();
      api.ready = Boolean(info.ready);
      api.needsCode = Boolean(info.needsCode);
    } catch {
      api.ready = false;
    }
    api.checked = true;
    pill.classList.toggle('is-live', api.ready);
    pill.classList.toggle('is-demo', !api.ready);
    $('#statusText').textContent = api.ready ? 'IA conectada' : 'Modo demo';
  }

  function explainStatus() {
    if (api.ready) {
      openSheet('IA conectada', `<p>El estudio está conectado al generador de imágenes. Cada imagen generada consume créditos de tu cuenta de IA.</p>
        ${api.needsCode ? '<button class="btn btn-ghost btn-block" type="button" id="resetCode">Cambiar código de acceso</button>' : ''}`);
      $('#resetCode')?.addEventListener('click', () => { store.set('pv-code', ''); closeSheet(); toast('Se pedirá el código otra vez'); });
    } else {
      openSheet('Modo demo', `<p>Todavía no hay una API key configurada en el servidor, así que:</p>
        <ul><li><strong>Mejorar</strong> usa un ajuste automático de luz y color (gratis, en tu celular).</li>
        <li><strong>Marca</strong> funciona completa.</li>
        <li><strong>Crear</strong> y <strong>Diseño con IA</strong> necesitan la API.</li></ul>
        <p class="muted">Para activar la IA revisa el archivo README.md del proyecto.</p>`);
    }
  }

  function askCode() {
    return new Promise((resolve) => {
      openSheet('Código de acceso', `<p class="muted">Este estudio está protegido. Escribe el código que configuraste en STUDIO_PASSWORD.</p>
        <label class="field"><span>Código</span><input id="codeInput" type="password" autocomplete="current-password"></label>
        <button class="btn btn-primary btn-block" type="button" id="codeOk">Entrar</button>`, () => resolve(null));
      const input = $('#codeInput');
      input.focus();
      const done = () => { const v = input.value.trim(); store.set('pv-code', v); resolve(v); closeSheet(true); };
      $('#codeOk').addEventListener('click', done);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
    });
  }

  async function callApi(body) {
    let code = store.get('pv-code', '');
    if (api.needsCode && !code) {
      code = await askCode();
      if (!code) throw new Error('Se necesita el código de acceso');
    }
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-studio-key': code || '' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) store.set('pv-code', '');
    if (!res.ok || !json.image) throw new Error(json.error || `Error ${res.status}`);
    return dataUrlToBlob(json.image);
  }

  // Muestra la capa de "generando…" con frases y segundos transcurridos.
  function startLoading(container) {
    const layer = $('.loading', container);
    const text = $('.loading-text', layer);
    const time = $('.loading-time', layer);
    const start = Date.now();
    let i = 0;
    text.textContent = LOADING_LINES[0];
    time.textContent = '0 s';
    layer.hidden = false;
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setInterval(() => {
      const s = Math.round((Date.now() - start) / 1000);
      time.textContent = `${s} s`;
      if (s % 4 === 0) text.textContent = LOADING_LINES[++i % LOADING_LINES.length];
    }, 1000);
    return () => { clearInterval(timer); layer.hidden = true; };
  }

  // ---------- Ajuste local gratis (sin IA) ----------
  // Auto-niveles + saturación + un toque cálido: funciona en cualquier celular.
  async function localEnhance(blob) {
    const url = URL.createObjectURL(blob);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const px = data.data;

    // Histograma de luminancia para estirar niveles (percentiles 1% y 99%).
    const hist = new Uint32Array(256);
    for (let i = 0; i < px.length; i += 4) hist[(px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0]++;
    const total = px.length / 4;
    let lo = 0, hi = 255, acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > total * 0.01) { lo = v; break; } }
    acc = 0;
    for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > total * 0.01) { hi = v; break; } }
    // Solo se estira la mitad del rango para no quemar ni oscurecer de más.
    lo = Math.round(lo * 0.5);
    hi = Math.round(255 - (255 - hi) * 0.5);
    const range = Math.max(60, hi - lo);

    const sat = 1.12, warmR = 1.03, warmB = 0.97, gamma = 0.88;
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      const n = Math.pow(Math.min(1, Math.max(0, (v - lo) / range)), gamma);
      // Mezcla 75% lineal + 25% curva en S: un poco más de contraste sin exagerar.
      const sCurve = n * n * (3 - 2 * n);
      lut[v] = 255 * (n * 0.75 + sCurve * 0.25);
    }
    for (let i = 0; i < px.length; i += 4) {
      let r = lut[px[i]], g = lut[px[i + 1]], b = lut[px[i + 2]];
      const l = r * 0.299 + g * 0.587 + b * 0.114;
      r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;
      px[i] = r * warmR; px[i + 1] = g; px[i + 2] = b * warmB;
    }
    ctx.putImageData(data, 0, 0);
    return canvasToBlob(c, 'image/jpeg', 0.92);
  }

  // ---------- UI: selectores ----------
  function renderPresetCards(container, items, { selectable = true, onPick } = {}) {
    container.innerHTML = '';
    items.forEach((p, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      if (selectable) { b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', idx === 0 ? 'true' : 'false'); }
      b.innerHTML = `<span class="preset-art" style="background:${p.bg}">${p.emoji}</span>
        ${p.isNew ? '<span class="preset-new">NUEVO</span>' : ''}
        <span class="preset-label">${p.label}${p.hint ? `<small>${p.hint}</small>` : ''}</span>`;
      b.addEventListener('click', () => {
        if (selectable) $$('.preset', container).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        onPick?.(p, idx);
      });
      container.appendChild(b);
    });
  }

  function renderChips(container, items, selectedId, onPick) {
    container.innerHTML = '';
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(it.id === selectedId));
      b.textContent = it.label;
      b.addEventListener('click', () => {
        $$('.chip', container).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        onPick(it.id);
      });
      container.appendChild(b);
    });
  }

  // ---------- Navegación ----------
  function go(view) {
    $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${view}`));
    $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === view));
    window.scrollTo({ top: 0 });
    if (view === 'galeria') renderGallery();
    if (view === 'marca') drawBrand();
    store.set('pv-view', view);
  }

  // ---------- Hoja inferior ----------
  let sheetOnClose = null;
  function openSheet(title, html, onClose) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheet').hidden = false;
    sheetOnClose = onClose || null;
  }
  function closeSheet(silent = false) {
    $('#sheet').hidden = true;
    $('#sheetBody').innerHTML = '';
    const cb = sheetOnClose;
    sheetOnClose = null;
    if (!silent) cb?.();
  }

  // ---------- MEJORAR ----------
  const edit = { source: null, result: null, preset: EDIT_PRESETS[0], aspect: '1:1' };

  function setEditSource(blob) {
    edit.source = blob;
    edit.result = null;
    const before = $('#editBefore');
    if (before.src) URL.revokeObjectURL(before.src);
    before.src = URL.createObjectURL(blob);
    $('.uploader-empty', $('#editUploader')).hidden = true;
    $('.uploader-preview', $('#editUploader')).hidden = false;
    showEditResult(null);
  }

  function showEditResult(blob) {
    const compare = $('#editCompare');
    const after = $('#editAfter');
    const parts = ['.compare-handle', '.compare-range', '.compare-tag-before', '.compare-tag-after'].map((s) => $(s, compare));
    if (after.src) URL.revokeObjectURL(after.src);
    if (!blob) {
      after.removeAttribute('src');
      after.hidden = true;
      parts.forEach((p) => { p.hidden = true; });
      $('#editResultActions').hidden = true;
      return;
    }
    edit.result = blob;
    after.src = URL.createObjectURL(blob);
    after.hidden = false;
    parts.forEach((p) => { p.hidden = false; });
    compare.style.setProperty('--split', '50%');
    $('.compare-range', compare).value = 50;
    $('#editResultActions').hidden = false;
  }

  async function runEdit({ local = false } = {}) {
    if (!edit.source) { toast('Primero sube la foto de tu platillo', true); return; }
    const useAi = !local && api.ready;
    const stop = startLoading($('#editCompare'));
    $('#editGo').disabled = true;
    try {
      let blob;
      if (useAi) {
        const extra = $('#editExtra').value.trim();
        const prompt = `${EDIT_BASE}${edit.preset.prompt}${extra ? ` Additional instructions from the restaurant: ${extra}` : ''}`;
        blob = await callApi({ mode: 'edit', prompt, aspect: edit.aspect, image: await blobToDataUrl(edit.source) });
      } else {
        blob = await localEnhance(edit.source);
        if (!local) toast('Modo demo: se aplicó el ajuste automático gratis');
      }
      showEditResult(blob);
      await gallery.add(blob, useAi ? 'IA' : 'Ajuste', useAi ? edit.preset.label : 'Ajuste rápido');
      if (useAi) toast('¡Listo! Desliza para comparar');
    } catch (err) {
      toast(err.message || 'Algo salió mal', true);
    } finally {
      stop();
      $('#editGo').disabled = false;
    }
  }

  // ---------- CREAR ----------
  const create = { aspect: '1:1', result: null };

  async function runCreate() {
    const text = $('#createPrompt').value.trim();
    if (!text) { toast('Describe la imagen que quieres', true); $('#createPrompt').focus(); return; }
    if (!api.ready) { explainStatus(); return; }
    const card = $('#createResult');
    card.hidden = false;
    const stop = startLoading(card);
    $('#createGo').disabled = true;
    try {
      const blob = await callApi({ mode: 'generate', prompt: text + CREATE_STYLE, aspect: create.aspect });
      create.result = blob;
      const img = $('#createImg');
      if (img.src) URL.revokeObjectURL(img.src);
      img.src = URL.createObjectURL(blob);
      $('#createResultActions').hidden = false;
      await gallery.add(blob, 'Creada', text);
      toast('¡Imagen lista!');
    } catch (err) {
      if (!create.result) card.hidden = true;
      toast(err.message || 'Algo salió mal', true);
    } finally {
      stop();
      $('#createGo').disabled = false;
    }
  }

  // ---------- MARCA (editor sobre canvas) ----------
  const brand = {
    image: null, // HTMLImageElement
    imageBlob: null,
    template: 'promo',
    format: '4:5',
    logo: null, // HTMLImageElement
  };

  const KIT_FIELDS = ['kitName', 'kitColor1', 'kitColor2', 'kitFont', 'kitHandle', 'kitPhone'];
  const TEXT_FIELDS = ['txtTitle', 'txtSubtitle', 'txtPrice', 'txtBadge', 'txtCta'];

  function readKit() {
    const v = (id) => $(`#${id}`).value.trim();
    return {
      name: v('kitName'), color: $('#kitColor1').value, ink: $('#kitColor2').value, font: $('#kitFont').value,
      handle: v('kitHandle'), phone: v('kitPhone'),
      title: v('txtTitle'), subtitle: v('txtSubtitle'), price: v('txtPrice'), badge: v('txtBadge'), cta: v('txtCta'),
    };
  }

  function saveKit() {
    const data = {};
    [...KIT_FIELDS, ...TEXT_FIELDS].forEach((id) => { data[id] = $(`#${id}`).value; });
    data.template = brand.template;
    data.format = brand.format;
    store.set('pv-kit', data);
  }

  function restoreKit() {
    const data = store.get('pv-kit', {});
    [...KIT_FIELDS, ...TEXT_FIELDS].forEach((id) => { if (data[id] != null) $(`#${id}`).value = data[id]; });
    if (data.template) brand.template = data.template;
    if (FORMATS[data.format]) brand.format = data.format;
    const logo = store.get('pv-logo', '');
    if (logo) setLogo(logo, false);
  }

  async function setLogo(dataUrl, persist = true) {
    try {
      brand.logo = await loadImage(dataUrl);
      const prev = $('#logoPreview');
      prev.style.backgroundImage = `url("${dataUrl}")`;
      prev.classList.add('has-logo');
      if (persist) store.set('pv-logo', dataUrl);
      drawBrand();
    } catch { toast('No se pudo cargar el logo', true); }
  }

  async function logoFromFile(file) {
    // PNG para conservar transparencia, reducido a 512px.
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const s = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    } finally { URL.revokeObjectURL(url); }
  }

  async function setBrandImage(blob) {
    brand.imageBlob = blob;
    const url = URL.createObjectURL(blob);
    brand.image = await loadImage(url);
    $('#canvasEmpty').hidden = true;
    drawBrand();
  }

  // Dibujo -------------------------------------------------------------
  function drawCover(ctx, img, x, y, w, h) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / s, sh = h / s;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
  }

  function drawContain(ctx, img, x, y, w, h) {
    const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return { w: dw, h: dh };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function font(k, size, weight = 700) {
    // Bebas Neue y Pacifico solo tienen un grosor.
    const w = k.font === 'Bebas Neue' || k.font === 'Pacifico' ? 400 : weight;
    return `${w} ${size}px "${k.font}", Poppins, sans-serif`;
  }

  // Parte el texto en líneas y reduce la letra si no cabe.
  function fitText(ctx, text, k, maxW, maxLines, size, minSize, weight) {
    let s = size;
    for (; s >= minSize; s -= 4) {
      ctx.font = font(k, s, weight);
      const lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines) return { lines, size: s };
    }
    ctx.font = font(k, minSize, weight);
    return { lines: wrap(ctx, text, maxW).slice(0, maxLines), size: minSize };
  }

  function wrap(ctx, text, maxW) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawLines(ctx, lines, x, y, lineH, align = 'left') {
    ctx.textAlign = align;
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
    return y + lines.length * lineH;
  }

  // Elige blanco o negro para que el texto se lea sobre el color de marca.
  function contrastInk(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#111111' : '#ffffff';
  }

  function drawPriceBadge(ctx, k, text, cx, cy, r) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = k.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = contrastInk(k.color);
    ctx.textBaseline = 'middle';
    const fitted = fitText(ctx, text, k, r * 1.6, 1, r * 0.62, 24, 800);
    ctx.font = font(k, fitted.size, 800);
    ctx.textAlign = 'center';
    ctx.fillText(fitted.lines[0] || '', cx, cy + 2);
    ctx.textBaseline = 'alphabetic';
  }

  function drawPill(ctx, k, text, x, y, size, fill, ink, align = 'left') {
    ctx.font = font(k, size, 700);
    const padX = size * 0.7, h = size * 1.9;
    const w = ctx.measureText(text).width + padX * 2;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = fill;
    roundRect(ctx, left, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + w / 2, y + h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    return { w, h };
  }

  // Dibuja el logo (o el nombre si no hay logo) y devuelve su tamaño. Con dry=true solo mide.
  function drawLogoOrName(ctx, k, x, y, maxW, maxH, color, align = 'left', dry = false) {
    if (brand.logo) {
      const s = Math.min(maxW / brand.logo.naturalWidth, maxH / brand.logo.naturalHeight);
      const w = brand.logo.naturalWidth * s, h = brand.logo.naturalHeight * s;
      const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      if (!dry) ctx.drawImage(brand.logo, left, y, w, h);
      return { w, h };
    }
    if (!k.name) return { w: 0, h: 0 };
    const fitted = fitText(ctx, k.name, k, maxW, 1, maxH * 0.6, 22, 800);
    const w = ctx.measureText(fitted.lines[0]).width;
    if (!dry) {
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      ctx.textAlign = align;
      ctx.fillText(fitted.lines[0], x, y);
      ctx.textBaseline = 'alphabetic';
    }
    return { w, h: fitted.size };
  }

  function footerLine(k) {
    return [k.handle, k.phone && `WhatsApp ${k.phone}`].filter(Boolean).join('  ·  ');
  }

  const DRAWERS = {
    promo(ctx, W, H, k) {
      drawCover(ctx, brand.image, 0, 0, W, H);
      const g = ctx.createLinearGradient(0, H * 0.38, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.88)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const top = ctx.createLinearGradient(0, 0, 0, 220);
      top.addColorStop(0, 'rgba(0,0,0,.45)');
      top.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, W, 220);

      const pad = 64;
      drawLogoOrName(ctx, k, pad, pad - 8, W - pad * 2 - 260, 110, k.ink);
      if (k.badge) drawPill(ctx, k, k.badge.toUpperCase(), W - pad, pad, 30, k.color, contrastInk(k.color), 'right');

      let y = H - pad;
      const foot = footerLine(k);
      if (foot) {
        ctx.font = font(k, 30, 500);
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.textAlign = 'left';
        ctx.fillText(foot, pad, y);
        y -= 64;
      }
      if (k.cta) { y -= 58; drawPill(ctx, k, k.cta, pad, y, 30, k.color, contrastInk(k.color)); y -= 34; }
      if (k.subtitle) {
        const s = fitText(ctx, k.subtitle, k, W - pad * 2 - (k.price ? 220 : 0), 2, 38, 26, 500);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.font = font(k, s.size, 500);
        y -= s.lines.length * s.size * 1.25;
        drawLines(ctx, s.lines, pad, y + s.size, s.size * 1.25);
        y -= 18;
      }
      if (k.title) {
        const t = fitText(ctx, k.title, k, W - pad * 2 - (k.price ? 220 : 0), 3, 104, 52, 800);
        ctx.fillStyle = k.ink;
        ctx.font = font(k, t.size, 800);
        y -= t.lines.length * t.size * 1.05;
        drawLines(ctx, t.lines, pad, y + t.size * 0.9, t.size * 1.05);
      }
      if (k.price) drawPriceBadge(ctx, k, k.price, W - pad - 100, Math.max(y + 60, H * 0.62), 100);
    },

    menu(ctx, W, H, k) {
      const panelH = Math.round(H * 0.36);
      drawCover(ctx, brand.image, 0, 0, W, H - panelH + 40);
      ctx.fillStyle = k.color;
      roundRect(ctx, 0, H - panelH, W, panelH + 40, 48);
      ctx.fill();
      const ink = contrastInk(k.color);
      const pad = 64;

      // Logo en esquina sobre la foto
      if (brand.logo || k.name) {
        const m = drawLogoOrName(ctx, k, pad, pad, 560, 90, '#ffffff', 'left', true);
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,.4)';
        roundRect(ctx, pad - 22, pad - 22, m.w + 44, m.h + 44, 24);
        ctx.fill();
        ctx.restore();
        drawLogoOrName(ctx, k, pad, pad, 560, 90, '#ffffff');
      }
      if (k.badge) drawPill(ctx, k, k.badge.toUpperCase(), pad, H - panelH - 30, 28, '#ffffff', '#111111');

      let y = H - panelH + 70;
      ctx.fillStyle = ink;
      if (k.title) {
        const t = fitText(ctx, k.title, k, W - pad * 2 - (k.price ? 240 : 0), 2, 84, 44, 800);
        ctx.font = font(k, t.size, 800);
        // y queda en la línea base del último renglón del título
        y = drawLines(ctx, t.lines, pad, y + t.size * 0.8, t.size * 1.05) - t.size * 1.05;
      }
      if (k.price) {
        const p = fitText(ctx, k.price, k, 230, 1, 84, 40, 800);
        ctx.font = font(k, p.size, 800);
        ctx.textAlign = 'right';
        ctx.fillText(p.lines[0], W - pad, H - panelH + 70 + p.size * 0.8);
      }
      if (k.subtitle) {
        ctx.globalAlpha = 0.8;
        const s = fitText(ctx, k.subtitle, k, W - pad * 2, 2, 36, 26, 500);
        ctx.font = font(k, s.size, 500);
        y = drawLines(ctx, s.lines, pad, y + s.size * 1.7, s.size * 1.3);
        ctx.globalAlpha = 1;
      }
      const foot = [k.cta, footerLine(k)].filter(Boolean).join('  ·  ');
      if (foot) {
        const f = fitText(ctx, foot, k, W - pad * 2, 1, 30, 20, 600);
        ctx.font = font(k, f.size, 600);
        ctx.textAlign = 'left';
        ctx.fillText(f.lines[0], pad, H - 56);
      }
    },

    story(ctx, W, H, k) {
      ctx.fillStyle = k.color;
      ctx.fillRect(0, 0, W, H);
      const ink = contrastInk(k.color);
      const pad = 72;
      let y = pad + 20;
      const logo = drawLogoOrName(ctx, k, W / 2, y, 620, 130, ink, 'center');
      y += logo.h + 40;

      if (k.title) {
        ctx.fillStyle = ink;
        const t = fitText(ctx, k.title, k, W - pad * 2, 2, 96, 50, 800);
        ctx.font = font(k, t.size, 800);
        y = drawLines(ctx, t.lines, W / 2, y + t.size * 0.85, t.size * 1.05, 'center');
      }
      const photoTop = y + 30;
      const bottomSpace = 330;
      const photoH = Math.max(300, H - photoTop - bottomSpace);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.35)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;
      roundRect(ctx, pad, photoTop, W - pad * 2, photoH, 40);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.restore();
      ctx.save();
      roundRect(ctx, pad, photoTop, W - pad * 2, photoH, 40);
      ctx.clip();
      drawCover(ctx, brand.image, pad, photoTop, W - pad * 2, photoH);
      ctx.restore();
      if (k.badge) drawPill(ctx, k, k.badge.toUpperCase(), pad + 28, photoTop + 28, 30, '#ffffff', '#111111');
      if (k.price) drawPriceBadge(ctx, { ...k, color: ink === '#111111' ? '#111111' : '#ffffff' }, k.price, W - pad - 125, photoTop + photoH - 125, 100);

      let by = photoTop + photoH + 70;
      if (k.subtitle) {
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.85;
        const s = fitText(ctx, k.subtitle, k, W - pad * 2, 2, 40, 28, 500);
        ctx.font = font(k, s.size, 500);
        by = drawLines(ctx, s.lines, W / 2, by, s.size * 1.3, 'center');
        ctx.globalAlpha = 1;
      }
      if (k.cta) drawPill(ctx, k, k.cta, W / 2, by + 10, 36, ink, k.color, 'center');
      const foot = footerLine(k);
      if (foot) {
        ctx.fillStyle = ink;
        ctx.font = font(k, 30, 500);
        ctx.textAlign = 'center';
        ctx.fillText(foot, W / 2, H - 60);
      }
    },

    minimal(ctx, W, H, k) {
      drawCover(ctx, brand.image, 0, 0, W, H);
      const pad = 48;
      const barH = 120;
      const g = ctx.createLinearGradient(0, H - barH * 2, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.7)');
      ctx.fillStyle = g;
      ctx.fillRect(0, H - barH * 2, W, barH * 2);
      if (brand.logo) {
        ctx.globalAlpha = 0.95;
        drawLogoOrName(ctx, k, W - pad, H - pad - 100, 220, 100, '#fff', 'right');
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      const main = k.title || k.name;
      if (main) {
        const t = fitText(ctx, main, k, W - pad * 2 - (brand.logo ? 240 : 0), 1, 56, 30, 800);
        ctx.font = font(k, t.size, 800);
        ctx.fillText(t.lines[0], pad, H - pad - 44);
      }
      const sub = [k.price, footerLine(k)].filter(Boolean).join('  ·  ');
      if (sub) {
        ctx.font = font(k, 30, 500);
        ctx.fillStyle = 'rgba(255,255,255,.88)';
        ctx.fillText(sub, pad, H - pad);
      }
      if (k.badge) drawPill(ctx, k, k.badge.toUpperCase(), pad, pad, 30, k.color, contrastInk(k.color));
    },
  };

  let drawQueued = false;
  function drawBrand() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(async () => {
      drawQueued = false;
      const k = readKit();
      try { await document.fonts.load(font(k, 40, 800)); await document.fonts.load(font(k, 40, 500)); } catch { /* sin fuentes web */ }
      const canvas = $('#brandCanvas');
      const f = FORMATS[brand.template === 'story' ? '9:16' : brand.format];
      canvas.width = f.w;
      canvas.height = f.h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, f.w, f.h);
      if (!brand.image) {
        ctx.fillStyle = '#151517';
        ctx.fillRect(0, 0, f.w, f.h);
        return;
      }
      DRAWERS[brand.template](ctx, f.w, f.h, k);
    });
  }

  async function exportBrand() {
    if (!brand.image) { toast('Primero elige una foto', true); return null; }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return canvasToBlob($('#brandCanvas'), 'image/png');
  }

  async function runAiPoster() {
    if (!brand.image) { toast('Primero elige una foto', true); return; }
    if (!api.ready) { explainStatus(); return; }
    const k = readKit();
    const texts = [
      k.name && `restaurant name "${k.name}"`,
      k.title && `headline "${k.title}"`,
      k.subtitle && `description "${k.subtitle}"`,
      k.price && `price "${k.price}"`,
      k.badge && `tag "${k.badge}"`,
      k.cta && `call to action "${k.cta}"`,
      k.handle && `social handle "${k.handle}"`,
      k.phone && `WhatsApp "${k.phone}"`,
    ].filter(Boolean);
    if (!texts.length) { toast('Escribe al menos un título o el nombre del restaurante', true); return; }
    const prompt =
      'Design a professional, eye-catching social media advertisement for a restaurant using this exact dish photo as the hero image. ' +
      'Keep the food identical and appetizing. Add clean modern graphic design and typography with exactly this text, spelled exactly as written (Spanish): ' +
      `${texts.join('; ')}. Brand primary color ${k.color}. Typography style similar to ${k.font}. ` +
      'Clear hierarchy, readable text, balanced layout, no extra words, no misspellings.';
    const stop = startLoading($('#canvasWrap'));
    $('#aiPosterBtn').disabled = true;
    try {
      const aspect = brand.template === 'story' ? '9:16' : brand.format;
      const blob = await callApi({ mode: 'edit', prompt, aspect, image: await blobToDataUrl(brand.imageBlob) });
      await gallery.add(blob, 'Diseño IA', k.title || k.name);
      const url = URL.createObjectURL(blob);
      openSheet('Diseño con IA', `<img src="${url}" alt="Diseño generado con IA">
        <p class="muted">Revisa que los textos estén bien escritos: la IA a veces se equivoca en letras. Si ves errores, usa las plantillas (son exactas).</p>
        <div class="sheet-actions">
          <button class="btn btn-ghost" type="button" data-s="download">Descargar</button>
          <button class="btn btn-ghost" type="button" data-s="share">Compartir</button>
        </div>`, () => URL.revokeObjectURL(url));
      $('[data-s="download"]').addEventListener('click', () => downloadBlob(blob, `${fileName('plato-vivo-ia')}.jpg`));
      $('[data-s="share"]').addEventListener('click', () => shareBlob(blob, fileName('plato-vivo-ia')));
    } catch (err) {
      toast(err.message || 'Algo salió mal', true);
    } finally {
      stop();
      $('#aiPosterBtn').disabled = false;
    }
  }

  // ---------- GALERÍA ----------
  let galleryUrls = [];
  function clearGalleryUrls() { galleryUrls.forEach((u) => URL.revokeObjectURL(u)); galleryUrls = []; }

  async function renderGallery() {
    const items = await gallery.all();
    const grid = $('#galleryGrid');
    clearGalleryUrls();
    grid.innerHTML = '';
    $('#galleryEmpty').hidden = items.length > 0;
    items.forEach((item) => {
      const url = URL.createObjectURL(item.blob);
      galleryUrls.push(url);
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<img src="${url}" alt="${item.kind}" loading="lazy"><span class="kind">${item.kind}</span>`;
      b.addEventListener('click', () => openGalleryItem(item, url));
      grid.appendChild(b);
    });
  }

  function openGalleryItem(item, url) {
    openSheet(item.kind, `<img src="${url}" alt="">
      <div class="sheet-actions">
        <button class="btn btn-primary" type="button" data-s="brand">Ponerle mi marca →</button>
        <button class="btn btn-ghost" type="button" data-s="improve">Mejorar esta foto</button>
        <button class="btn btn-ghost" type="button" data-s="download">Descargar</button>
        <button class="btn btn-ghost" type="button" data-s="share">Compartir</button>
        <button class="btn btn-danger" type="button" data-s="delete">Borrar</button>
      </div>`);
    const on = (s, fn) => $(`[data-s="${s}"]`).addEventListener('click', fn);
    on('brand', async () => { closeSheet(); await setBrandImage(item.blob); go('marca'); });
    on('improve', () => { closeSheet(); setEditSource(item.blob); go('mejorar'); });
    on('download', () => downloadBlob(item.blob, `${fileName('plato-vivo')}.jpg`));
    on('share', () => shareBlob(item.blob, fileName('plato-vivo')));
    on('delete', async () => { await gallery.remove(item.id); closeSheet(); renderGallery(); toast('Imagen borrada'); });
  }

  async function pickFromGallery() {
    const items = await gallery.all();
    if (!items.length) { toast('Tu galería está vacía: sube una foto'); return; }
    const urls = items.map((i) => URL.createObjectURL(i.blob));
    openSheet('Elige una imagen', `<div class="grid">${urls.map((u, i) => `<button type="button" data-i="${i}"><img src="${u}" alt=""><span class="kind">${items[i].kind}</span></button>`).join('')}</div>`,
      () => urls.forEach((u) => URL.revokeObjectURL(u)));
    $$('#sheetBody [data-i]').forEach((b) => b.addEventListener('click', async () => {
      await setBrandImage(items[+b.dataset.i].blob);
      closeSheet();
    }));
  }

  // ---------- Eventos ----------
  function bind() {
    $$('.tab').forEach((t) => t.addEventListener('click', () => go(t.dataset.view)));
    $$('[data-goto]').forEach((b) => b.addEventListener('click', () => go(b.dataset.goto)));
    $('#statusPill').addEventListener('click', explainStatus);
    $$('#sheet [data-close]').forEach((el) => el.addEventListener('click', () => closeSheet()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

    // Subida de fotos (cámara o galería)
    $$('input[type="file"][data-target]').forEach((input) => input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        const blob = await normalizeFile(file);
        if (input.dataset.target === 'edit') setEditSource(blob);
        else { await setBrandImage(blob); }
      } catch { toast('No se pudo abrir esa imagen', true); }
    }));

    // Comparador antes/después
    $('.compare-range').addEventListener('input', (e) => {
      $('#editCompare').style.setProperty('--split', `${e.target.value}%`);
    });

    $('#editGo').addEventListener('click', () => runEdit());
    $('#quickFixBtn').addEventListener('click', () => runEdit({ local: true }));
    $('#createGo').addEventListener('click', runCreate);

    // Acciones de resultados
    const resultActions = (container, getBlob, prefix) => {
      container.addEventListener('click', async (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const blob = getBlob();
        if (!action || !blob) return;
        if (action === 'download') downloadBlob(blob, `${fileName(prefix)}.jpg`);
        if (action === 'share') shareBlob(blob, fileName(prefix));
        if (action === 'brand') { await setBrandImage(blob); go('marca'); }
      });
    };
    resultActions($('#editResultActions'), () => edit.result, 'plato-vivo-mejorado');
    resultActions($('#createResultActions'), () => create.result, 'plato-vivo-creado');

    // Marca
    [...KIT_FIELDS, ...TEXT_FIELDS].forEach((id) => $(`#${id}`).addEventListener('input', () => { drawBrand(); saveKit(); }));
    $('#logoInput').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) setLogo(await logoFromFile(file));
    });
    $('#logoRemove').addEventListener('click', () => {
      brand.logo = null;
      store.set('pv-logo', '');
      const prev = $('#logoPreview');
      prev.style.backgroundImage = '';
      prev.classList.remove('has-logo');
      drawBrand();
    });
    $('#pickFromGallery').addEventListener('click', pickFromGallery);
    $('#changeBrandImg').addEventListener('click', pickFromGallery);
    $('#aiPosterBtn').addEventListener('click', runAiPoster);
    $('#brandDownload').addEventListener('click', async () => {
      const blob = await exportBrand();
      if (!blob) return;
      downloadBlob(blob, `${fileName('plato-vivo-marca')}.png`);
      gallery.add(blob, 'Marca', readKit().title);
    });
    $('#brandShare').addEventListener('click', async () => {
      const blob = await exportBrand();
      if (blob) shareBlob(blob, fileName('plato-vivo-marca'));
    });
  }

  function init() {
    renderPresetCards($('#editPresets'), EDIT_PRESETS, { onPick: (p) => { edit.preset = p; } });
    renderPresetCards($('#createPresets'), CREATE_PRESETS, {
      selectable: false,
      onPick: (p) => { $('#createPrompt').value = p.prompt; $('#createPrompt').focus(); },
    });
    renderChips($('#editAspect'), ASPECTS, edit.aspect, (id) => { edit.aspect = id; });
    renderChips($('#createAspect'), ASPECTS, create.aspect, (id) => { create.aspect = id; });

    restoreKit();
    renderPresetCards($('#brandTemplates'), TEMPLATES, {
      onPick: (t) => { brand.template = t.id; drawBrand(); saveKit(); },
    });
    $$('#brandTemplates .preset').forEach((b, i) => b.setAttribute('aria-checked', String(TEMPLATES[i].id === brand.template)));
    const formatItems = Object.entries(FORMATS).map(([id, f]) => ({ id, label: f.label }));
    renderChips($('#brandFormat'), formatItems, brand.format, (id) => { brand.format = id; drawBrand(); saveKit(); });

    bind();
    checkApi();

    const params = new URLSearchParams(location.search);
    const start = params.get('vista') || store.get('pv-view', 'mejorar');
    if ($(`#view-${start}`)) go(start);
  }

  init();
})();
