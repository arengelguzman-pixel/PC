import { useEffect, useRef, useState } from 'react';
import { PLATOS, IMG, type Plato } from '../config';

// Sección separada del menú: 1) datos del negocio + logo procesado (perfil),
// 2) armar el pedido real de una mesa, 3) cómo lo ve la cocina y qué alerta
// le llega cuando una mesa ordena.

const TIPOS = ['Comida rápida', 'Comida cruceña', 'Pollos a la brasa', 'Almuerzos', 'Pizzería'];

// "Arreglo" del logo: recorte cuadrado, realce (contraste/saturación/brillo) y
// máscara circular → foto de perfil lista.
function arreglarLogo(im: HTMLImageElement): string {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const l = Math.min(im.naturalWidth, im.naturalHeight);
  x.save();
  x.beginPath();
  x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
  x.clip();
  x.imageSmoothingQuality = 'high';
  try { x.filter = 'contrast(1.14) saturate(1.25) brightness(1.06)'; } catch { /* sin filtro */ }
  x.drawImage(im, (im.naturalWidth - l) / 2, (im.naturalHeight - l) / 2, l, l, 0, 0, S, S);
  x.restore();
  return c.toDataURL('image/png');
}

type Estado = 'nuevo' | 'preparando' | 'listo' | 'entregado';
type Item = { id: number; n: string; p: number; q: number };
type Ticket = { id: number; mesa: number; items: Item[]; total: number; estado: Estado; nacido: number };

const ET: Record<Estado, string> = { nuevo: 'NUEVA', preparando: 'EN COCINA', listo: 'LISTO', entregado: 'ENTREGADO' };
const colorEstado = (e: Estado) => e === 'nuevo' ? 'bg-maiz text-negro' : e === 'preparando' ? 'bg-azul text-white' : e === 'listo' ? 'bg-lima text-negro' : 'bg-crema/30 text-crema';
const MESAS = [1, 2, 3, 4, 5, 6];

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    g.gain.value = 0.06; o.type = 'square';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.24);
    setTimeout(() => ctx.close(), 400);
  } catch { /* sin audio */ }
}

export default function DemoMenu() {
  // negocio
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [logo, setLogo] = useState('');
  const logoInput = useRef<HTMLInputElement>(null);

  // armado del pedido
  const [mesa, setMesa] = useState(1);
  const [carrito, setCarrito] = useState<Record<number, number>>({});

  // cocina
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [alerta, setAlerta] = useState<string>('');
  const [sonido, setSonido] = useState(true);
  const idRef = useRef(1);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      setTickets((prev) => prev
        .map((k) => {
          const dur = k.estado === 'nuevo' ? 6000 : k.estado === 'preparando' ? 10000 : k.estado === 'listo' ? 6000 : 0;
          if (dur && now - k.nacido >= dur) {
            const sig: Estado | null = k.estado === 'nuevo' ? 'preparando' : k.estado === 'preparando' ? 'listo' : k.estado === 'listo' ? 'entregado' : null;
            if (sig) return { ...k, estado: sig, nacido: now };
          }
          return k;
        })
        .filter((k) => k.estado !== 'entregado' || now - k.nacido < 5000),
      );
      setTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const subirLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f); const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); setLogo(arreglarLogo(im)); };
    im.src = url;
  };

  const add = (p: Plato) => setCarrito((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }));
  const quitar = (id: number) => setCarrito((c) => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const lineas = Object.entries(carrito).map(([id, q]) => { const p = PLATOS.find((x) => x.id === +id)!; return { p, q, sub: p.p * q }; });
  const total = lineas.reduce((a, l) => a + l.sub, 0);

  const enviarCocina = () => {
    if (!lineas.length) return;
    const t: Ticket = {
      id: idRef.current++, mesa,
      items: lineas.map((l) => ({ id: l.p.id, n: l.p.n, p: l.p.p, q: l.q })),
      total, estado: 'nuevo', nacido: Date.now(),
    };
    setTickets((prev) => [...prev, t]);
    setCarrito({});
    setAlerta(`🔔 ¡NUEVA COMANDA! Mesa ${t.mesa} · ${t.items.reduce((a, i) => a + i.q, 0)} platos · Bs ${t.total}`);
    if (sonido) beep();
    window.setTimeout(() => setAlerta(''), 4200);
  };

  const avanzar = (id: number) => setTickets((prev) => prev.map((k) => {
    if (k.id !== id) return k;
    const sig: Estado = k.estado === 'nuevo' ? 'preparando' : k.estado === 'preparando' ? 'listo' : 'entregado';
    return { ...k, estado: sig, nacido: Date.now() };
  }));

  const enCurso = tickets.filter((k) => k.estado !== 'entregado');
  const nuevas = tickets.filter((k) => k.estado === 'nuevo').length;

  return (
    <div className="min-h-screen bg-negro text-crema pb-24">
      {/* alerta flotante de cocina */}
      {alerta && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-lg bg-maiz text-negro border-[3px] border-negro shadow-[6px_6px_0_var(--color-rojo)] px-4 py-3 font-press-start text-[10px] tracking-wide animate-pulse">
          {alerta}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-carbon border-b-4 border-lima px-4 py-3 flex items-center justify-between gap-3">
        <a href="/" className="font-press-start text-[11px] text-lima">PLATO VIVO</a>
        <span className="font-press-start text-[8px] text-crema/60 tracking-widest uppercase">Menú · demo en vivo</span>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-12">
        {/* 1 · NEGOCIO */}
        <section>
          <span className="font-press-start text-[9px] bg-lima text-negro px-3 py-2 tracking-widest">✱ PASO 1 · TU NEGOCIO</span>
          <h1 className="font-press-start text-maiz text-lg sm:text-2xl mt-4 uppercase">Carga tus datos</h1>
          <div className="grid sm:grid-cols-[1fr_auto] gap-5 mt-5 items-start">
            <div className="space-y-3">
              <div>
                <label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Nombre del local</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Doña Elsa" className="w-full bg-carbon border-2 border-crema/30 focus:border-lima outline-none text-crema p-3.5" />
              </div>
              <div>
                <label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Qué vende</label>
                <div className="flex gap-2 flex-wrap">
                  {TIPOS.map((t) => (
                    <button key={t} onClick={() => setTipo(t)} className={`text-sm px-3 py-2.5 border-2 ${t === tipo ? 'bg-carbon text-lima border-lima' : 'bg-black/20 text-crema/70 border-crema/25'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            {/* logo procesado */}
            <div className="text-center">
              <label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Foto de perfil</label>
              <div className="w-28 h-28 rounded-full border-[3px] border-lima overflow-hidden grid place-items-center bg-carbon mx-auto">
                {logo ? <img src={logo} alt="logo" className="w-full h-full object-cover" /> : <span className="text-crema/40 text-3xl">◧</span>}
              </div>
              {logo && <p className="font-press-start text-[7px] text-lima mt-2 tracking-wider">✨ ARREGLADA</p>}
              <input ref={logoInput} type="file" accept="image/*" hidden onChange={subirLogo} />
              <button onClick={() => logoInput.current?.click()} className="mt-2 font-press-start text-[8px] text-carbon bg-maiz border-2 border-negro py-2.5 px-4 uppercase tracking-wider hover:bg-lima transition-colors">Subir logo ▸</button>
            </div>
          </div>
          <p className="text-sm text-crema/55 mt-3">La foto se recorta redonda y se le realza luz y color para que quede lista como perfil del negocio.</p>
        </section>

        {/* 2 · ARMAR PEDIDO */}
        <section>
          <span className="font-press-start text-[9px] bg-rojo text-crema px-3 py-2 tracking-widest">✱ PASO 2 · ARMA EL PEDIDO DE UNA MESA</span>
          <h2 className="font-press-start text-maiz text-lg sm:text-2xl mt-4 uppercase">Elige la mesa y sus platos</h2>
          <div className="flex gap-2 flex-wrap mt-4">
            {MESAS.map((m) => (
              <button key={m} onClick={() => setMesa(m)} className={`font-press-start text-[10px] w-14 h-14 border-2 ${m === mesa ? 'bg-lima text-negro border-lima' : 'bg-carbon text-crema/70 border-crema/25'}`}>M{m}</button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {/* platos */}
            <div className="border-[3px] border-carbon bg-carbon/80">
              {PLATOS.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 border-b border-crema/10 last:border-b-0">
                  <img src={IMG[p.img]} alt="" className="w-12 h-12 object-cover shrink-0" />
                  <div className="flex-1 min-w-0"><div className="text-sm text-crema truncate">{p.n}</div><div className="font-mono text-lima text-sm">Bs {p.p}</div></div>
                  <button onClick={() => add(p)} className="font-press-start text-[8px] text-carbon bg-lima border-2 border-negro py-2 px-3 uppercase">+ Agregar</button>
                </div>
              ))}
            </div>
            {/* carrito de la mesa */}
            <div className="border-[3px] border-lima bg-[#0A0605]/85 p-4 flex flex-col">
              <div className="font-press-start text-[10px] text-lima tracking-widest uppercase mb-3">Pedido · Mesa {mesa}</div>
              <div className="flex-1 min-h-[120px]">
                {lineas.length === 0 && <p className="text-crema/40 text-sm font-mono py-8 text-center">agrega platos ↑</p>}
                {lineas.map((l) => (
                  <div key={l.p.id} className="flex justify-between items-center py-1.5 text-sm">
                    <span className="text-crema/85">{l.q}× {l.p.n}</span>
                    <span className="flex items-center gap-2"><span className="font-mono text-crema/70">Bs {l.sub}</span><button onClick={() => quitar(l.p.id)} className="font-press-start text-[11px] text-rojo px-2">−</button></span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline mt-3 pt-3 border-t-2 border-crema/15">
                <span className="text-crema/70 text-sm">Total</span><span className="font-mono font-bold text-maiz text-2xl">Bs {total}</span>
              </div>
              <button onClick={enviarCocina} disabled={!lineas.length} className="mt-3 w-full font-press-start text-[10px] text-crema bg-rojo border-[3px] border-negro py-4 shadow-[4px_4px_0_var(--color-maiz)] active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-widest disabled:opacity-40">Enviar a la cocina ▸</button>
            </div>
          </div>
        </section>

        {/* 3 · COCINA */}
        <section>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-press-start text-[9px] bg-lima text-negro px-3 py-2 tracking-widest">✱ PASO 3 · LA COCINA</span>
            <button onClick={() => setSonido((s) => !s)} className="font-press-start text-[8px] text-crema/70 border-2 border-crema/25 px-3 py-2 uppercase tracking-wider">Sonido: {sonido ? 'ON' : 'OFF'}</button>
          </div>
          <h2 className="font-press-start text-maiz text-lg sm:text-2xl mt-4 uppercase">Lo que ve la cocina</h2>
          <p className="text-sm text-crema/70 mt-2 max-w-2xl">Cuando una mesa ordena, a la pantalla de cocina le llega la comanda al instante con <b className="text-crema">alerta visual</b> (banner amarillo parpadeando), <b className="text-crema">sonido</b> (bip) y un <b className="text-crema">contador de comandas nuevas</b>. El cocinero toca para avanzar: EN COCINA → LISTO.</p>

          <div className="mt-4 border-[3px] border-lima bg-[#0A0605]/85">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-crema/15">
              <span className="font-press-start text-[10px] text-lima tracking-widest">▸ PANTALLA DE COCINA</span>
              <span className={`font-press-start text-[8px] px-2 py-1.5 tracking-wider ${nuevas ? 'bg-maiz text-negro animate-pulse' : 'bg-crema/15 text-crema/60'}`}>{nuevas} NUEVA(S)</span>
            </div>
            <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {enCurso.length === 0 && <p className="text-crema/40 text-sm font-mono py-8 text-center col-span-full">sin comandas — arma un pedido arriba y envíalo ↑</p>}
              {enCurso.map((k) => (
                <div key={k.id} className={`border-2 p-3 ${k.estado === 'nuevo' ? 'border-maiz' : 'border-crema/15'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-press-start text-[10px] text-crema">MESA {k.mesa}</span>
                    <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${colorEstado(k.estado)}`}>{ET[k.estado]}</span>
                  </div>
                  <ul className="mt-2 font-mono text-xs text-crema/80 leading-relaxed">{k.items.map((it, i) => <li key={i}>{it.q}× {it.n}</li>)}</ul>
                  {k.estado !== 'listo' && k.estado !== 'entregado' && (
                    <button onClick={() => avanzar(k.id)} className="mt-2 w-full font-press-start text-[8px] text-negro bg-lima border-2 border-negro py-2 uppercase tracking-wider">{k.estado === 'nuevo' ? 'Empezar ▸' : 'Marcar listo ▸'}</button>
                  )}
                  {k.estado === 'listo' && <button onClick={() => avanzar(k.id)} className="mt-2 w-full font-press-start text-[8px] text-crema border-2 border-crema/30 py-2 uppercase tracking-wider">Entregar ▸</button>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
