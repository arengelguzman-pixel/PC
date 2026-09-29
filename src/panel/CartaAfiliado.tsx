import { useEffect, useMemo, useRef, useState } from 'react';
import type { Afiliado, Categoria, Item, Tamano } from '../afiliados/elGaraje';

// Menú definitivo de un afiliado (link secreto). Dos vistas:
//  · Cliente → su marca (negro + oro), minimalista y moderno: categorías,
//    tamaños + borde de queso, mesa por QR (?mesa=N), hoja de detalle, carrito.
//  · Cocina  → nuestra tipografía (Press Start 2P): comanda en vivo con alerta,
//    tiempos, filtros y disponibilidad por categoría.

type Linea = { key: string; slug: string; n: string; tamK: string; tamT: string; borde: boolean; p: number; q: number };
type Estado = 'nuevo' | 'preparando' | 'listo' | 'entregado';
type Ticket = { id: number; mesa: string; items: Linea[]; nota: string; total: number; estado: Estado; nacido: number; cambio: number };

const ET: Record<Estado, string> = { nuevo: 'NUEVA', preparando: 'EN HORNO', listo: 'LISTA', entregado: 'ENTREGADA' };
const SIG: Record<Estado, Estado> = { nuevo: 'preparando', preparando: 'listo', listo: 'entregado', entregado: 'entregado' };
const ACCION: Record<Estado, string> = { nuevo: 'Al horno ▸', preparando: 'Lista ▸', listo: 'Entregar ▸', entregado: '' };
const colorEstado = (e: Estado) => e === 'nuevo' ? 'bg-maiz text-negro' : e === 'preparando' ? 'bg-azul text-white' : e === 'listo' ? 'bg-lima text-negro' : 'bg-crema/25 text-crema';
const mmss = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const precioDe = (t: Tamano, borde: boolean) => (borde && t.borde ? t.borde : t.p);

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC(); const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); g.gain.value = 0.06; o.type = 'square';
    o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.24); setTimeout(() => ctx.close(), 400);
  } catch { /* sin audio */ }
}

export default function CartaAfiliado({ data }: { data: Afiliado }) {
  const [vista, setVista] = useState<'cliente' | 'cocina'>('cliente');
  const [mesa] = useState(() => (new URLSearchParams(location.search).get('mesa') || '').replace(/[^0-9A-Za-z-]/g, '').slice(0, 6));
  const [carrito, setCarrito] = useState<Linea[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [noDisp, setNoDisp] = useState<string[]>([]);
  const [alerta, setAlerta] = useState('');
  const [toast, setToast] = useState('');
  const [sonido, setSonido] = useState(true);
  const [, setTick] = useState(0);
  const idRef = useRef(1);

  useEffect(() => {
    document.title = `${data.nombre} · Menú`;
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => { document.head.removeChild(m); clearInterval(t); };
  }, [data.nombre]);

  const agotado = (slug: string) => noDisp.includes(slug);
  const toggleDisp = (slug: string) => setNoDisp((s) => s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]);

  const agregar = (item: Item, tam: Tamano | null, borde: boolean, q: number) => {
    const p = tam ? precioDe(tam, borde) : (item.p ?? 0);
    if (!p) return;
    const key = `${item.slug}|${tam?.k ?? '-'}|${borde ? 'b' : ''}`;
    setCarrito((c) => {
      const i = c.findIndex((l) => l.key === key);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], q: n[i].q + q }; return n; }
      return [...c, { key, slug: item.slug, n: item.n, tamK: tam?.k ?? '', tamT: tam?.t ?? '', borde, p, q }];
    });
    setToast(`Agregado · ${item.n}${tam ? ` ${tam.t}` : ''}`);
    window.setTimeout(() => setToast(''), 1600);
  };
  const cambiarQ = (key: string, d: number) => setCarrito((c) => c.map((l) => l.key === key ? { ...l, q: l.q + d } : l).filter((l) => l.q > 0));
  const total = useMemo(() => carrito.reduce((a, l) => a + l.p * l.q, 0), [carrito]);
  const cantidad = useMemo(() => carrito.reduce((a, l) => a + l.q, 0), [carrito]);

  const pedir = (nota: string, mesaTxt: string) => {
    if (!carrito.length) return;
    const now = Date.now();
    const t: Ticket = { id: idRef.current++, mesa: mesaTxt, items: carrito, nota, total, estado: 'nuevo', nacido: now, cambio: now };
    setTickets((prev) => [...prev, t]);
    setAlerta(`🔔 ¡NUEVA COMANDA! #${t.id}${mesaTxt ? ` · Mesa ${mesaTxt}` : ''} · ${cantidad} ítem(s) · Bs ${total}`);
    if (sonido) beep();
    window.setTimeout(() => setAlerta(''), 4500);
    const lineas = carrito.map((l) => `• ${l.q}× ${l.n}${l.tamT ? ` (${l.tamT}${l.borde ? ', borde de queso' : ''})` : ''} — Bs ${l.p * l.q}`).join('\n');
    const msg = `🍕 PEDIDO · ${data.nombre}${mesaTxt ? `\nMesa ${mesaTxt}` : ''}\n\n${lineas}\n\nTOTAL: Bs ${total}${nota ? `\n\nNota: ${nota}` : ''}`;
    window.open(`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    setCarrito([]);
    setToast(`Pedido #${t.id} enviado ✓`);
    window.setTimeout(() => setToast(''), 2600);
  };
  const avanzar = (id: number) => setTickets((prev) => prev.map((k) => k.id === id ? { ...k, estado: SIG[k.estado], cambio: Date.now() } : k));

  const nuevas = tickets.filter((k) => k.estado === 'nuevo').length;

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {alerta && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[95] w-[94%] max-w-lg bg-maiz text-negro border-[3px] border-negro shadow-[6px_6px_0_var(--color-rojo)] px-4 py-3 font-press-start text-[10px] leading-relaxed tracking-wide animate-pulse">{alerta}</div>
      )}
      {toast && !alerta && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[95] px-4 py-2.5 rounded-full text-sm font-semibold text-black shadow-lg" style={{ background: data.oro }}>{toast}</div>
      )}

      {/* barra de vistas — nuestra tipografía, discreta */}
      <div className="sticky top-0 z-40 bg-carbon/95 backdrop-blur border-b-2 border-lima px-3 py-2 flex items-center justify-between gap-2">
        <span className="font-press-start text-[8px] text-lima">PLATO VIVO</span>
        <div className="flex gap-1">
          <button onClick={() => setVista('cliente')} className={`font-press-start text-[7px] px-2.5 py-1.5 border-2 tracking-wider ${vista === 'cliente' ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>Cliente</button>
          <button onClick={() => setVista('cocina')} className={`font-press-start text-[7px] px-2.5 py-1.5 border-2 tracking-wider ${vista === 'cocina' ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>Cocina{nuevas ? ` ·${nuevas}` : ''}</button>
        </div>
      </div>

      {vista === 'cliente'
        ? <Cliente data={data} mesa={mesa} carrito={carrito} total={total} cantidad={cantidad} agotado={agotado} agregar={agregar} cambiarQ={cambiarQ} pedir={pedir} />
        : <Cocina data={data} tickets={tickets} nuevas={nuevas} sonido={sonido} setSonido={setSonido} avanzar={avanzar} agotado={agotado} toggleDisp={toggleDisp} />}
    </div>
  );
}

/* ================= CLIENTE (su marca) ================= */
function Cliente({ data, mesa, carrito, total, cantidad, agotado, agregar, cambiarQ, pedir }: {
  data: Afiliado; mesa: string; carrito: Linea[]; total: number; cantidad: number;
  agotado: (slug: string) => boolean;
  agregar: (item: Item, tam: Tamano | null, borde: boolean, q: number) => void;
  cambiarQ: (key: string, d: number) => void;
  pedir: (nota: string, mesa: string) => void;
}) {
  const [detalle, setDetalle] = useState<{ item: Item; cat: Categoria } | null>(null);
  const [verCarrito, setVerCarrito] = useState(false);
  const [activa, setActiva] = useState(data.categorias[0].k);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});
  const vars = { ['--oro' as string]: data.oro } as React.CSSProperties;

  // scrollspy de categorías
  useEffect(() => {
    const io = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActiva((vis.target as HTMLElement).dataset.cat || activa);
    }, { rootMargin: '-120px 0px -60% 0px', threshold: 0 });
    Object.values(secRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const irA = (k: string) => { setActiva(k); secRefs.current[k]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div style={vars} className="text-white pb-32">
      {/* cabecera */}
      <header className="max-w-lg mx-auto px-5 pt-7 pb-5 text-center">
        <img src={data.logo} alt={data.nombre} className="w-24 h-24 rounded-full object-cover mx-auto ring-4" style={{ ['--tw-ring-color' as string]: 'var(--oro)' }} />
        <h1 className="mt-4 text-[30px] font-extrabold tracking-tight leading-none">{data.nombre}</h1>
        <p className="mt-2 text-[11px] text-white/55 uppercase tracking-[0.2em]">{data.bajada} · {data.ciudad}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-black" style={{ background: 'var(--oro)' }}>
          {mesa ? `MESA ${mesa}` : 'PEDIDO POR WHATSAPP'}
        </div>
      </header>

      {/* chips de categoría (sticky) */}
      <nav className="sticky top-[41px] z-30 bg-[#0B0B0B]/92 backdrop-blur border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {data.categorias.map((c) => (
            <button key={c.k} onClick={() => irA(c.k)} className={`shrink-0 text-sm font-semibold px-3.5 py-2 rounded-full transition-colors ${activa === c.k ? 'text-black' : 'text-white/70 bg-white/5'}`} style={activa === c.k ? { background: 'var(--oro)' } : undefined}>{c.t}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4">
        {data.categorias.map((cat) => (
          <section key={cat.k} data-cat={cat.k} ref={(el) => { secRefs.current[cat.k] = el; }} className="pt-7 scroll-mt-24">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--oro)' }}>{cat.t}</h2>
              {cat.desc && <span className="text-xs text-white/45">{cat.desc}</span>}
            </div>

            {cat.porTamano && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-mono tabular-nums">
                {data.tamanos.map((t) => (
                  <span key={t.k}><b style={{ color: 'var(--oro)' }}>{t.t}</b> {t.p}{t.borde ? <span className="text-white/45"> · borde {t.borde}</span> : null}</span>
                ))}
              </div>
            )}

            {/* Especiales: tarjeta grande */}
            {cat.k === 'especiales' && cat.items.map((it) => {
              const no = agotado(it.slug);
              return (
                <article key={it.slug} className="rounded-2xl overflow-hidden bg-[#161616] border border-white/10 mb-3" style={{ opacity: no ? 0.5 : 1 }}>
                  {it.foto && (
                    <div className="relative aspect-[4/3] bg-[#111]">
                      <Foto src={it.foto} alt={it.n} />
                      <span className="absolute top-3 left-3 text-[11px] font-extrabold px-2.5 py-1 rounded-full text-black" style={{ background: 'var(--oro)' }}>ESPECIAL</span>
                      {no && <Agotada />}
                    </div>
                  )}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0"><h3 className="text-xl font-bold leading-tight">{it.n}</h3><p className="text-[13px] text-white/60 mt-1">{it.i}</p></div>
                    {!no && it.p ? <button onClick={() => agregar(it, null, false, 1)} className="shrink-0 font-bold text-sm px-4 py-2.5 rounded-full text-black active:scale-[.97] transition-transform" style={{ background: 'var(--oro)' }}>Bs {it.p} +</button> : null}
                  </div>
                </article>
              );
            })}

            {/* Pizzas: mosaico 2 columnas */}
            {cat.porTamano && (
              <div className="grid grid-cols-2 gap-3">
                {cat.items.map((it) => {
                  const no = agotado(it.slug);
                  return (
                    <article key={it.slug} onClick={() => !no && setDetalle({ item: it, cat })} className={`rounded-2xl overflow-hidden bg-[#161616] border border-white/10 ${no ? 'opacity-50' : 'cursor-pointer active:scale-[.98] transition-transform'}`}>
                      <div className="relative aspect-square bg-[#111]">
                        {it.foto && <Foto src={it.foto} alt={it.n} />}
                        {no && <Agotada />}
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold leading-tight text-[15px]">{it.n}</h3>
                        <p className="text-[12px] text-white/55 mt-1 leading-snug line-clamp-2">{it.i}</p>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[12px] font-mono tabular-nums" style={{ color: 'var(--oro)' }}>{no ? 'agotada' : `desde ${data.tamanos[0].p}`}</span>
                          {!no && <span className="w-8 h-8 rounded-full grid place-items-center text-black text-lg font-bold" style={{ background: 'var(--oro)' }}>+</span>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Resto: lista con miniatura */}
            {cat.k === 'resto' && cat.items.map((it) => {
              const no = agotado(it.slug);
              return (
                <article key={it.slug} className="flex items-center gap-3 rounded-2xl bg-[#161616] border border-white/10 p-3 mb-3" style={{ opacity: no ? 0.5 : 1 }}>
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#111] shrink-0">{it.foto && <Foto src={it.foto} alt={it.n} />}{no && <Agotada />}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold leading-tight">{it.n}</h3>
                    <p className="text-[12px] text-white/55 mt-1">{it.i}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono tabular-nums text-sm" style={{ color: 'var(--oro)' }}>{it.p ? `Bs ${it.p}` : 'Consultar'}</span>
                      {!no && it.p ? <button onClick={() => agregar(it, null, false, 1)} className="w-8 h-8 rounded-full text-black text-lg font-bold" style={{ background: 'var(--oro)' }}>+</button> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ))}

        <footer className="text-center text-[11px] text-white/35 mt-10 leading-relaxed">
          Pedidos · {data.telefonoVisible}<br />Menú digital por <b className="text-white/55">PLATO VIVO</b>
        </footer>
      </main>

      {/* píldora del carrito */}
      {cantidad > 0 && !verCarrito && (
        <button onClick={() => setVerCarrito(true)} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg flex items-center justify-between px-5 py-4 rounded-2xl text-black font-bold shadow-2xl active:scale-[.98] transition-transform" style={{ background: 'var(--oro)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <span className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-black/15 grid place-items-center text-sm">{cantidad}</span> Ver mi pedido</span>
          <span className="font-mono tabular-nums">Bs {total}</span>
        </button>
      )}

      {/* hoja: detalle de pizza (tamaño + borde + cantidad) */}
      {detalle && <HojaDetalle data={data} item={detalle.item} onClose={() => setDetalle(null)} onAdd={(t, b, q) => { agregar(detalle.item, t, b, q); setDetalle(null); }} />}

      {/* hoja: carrito */}
      {verCarrito && <HojaCarrito data={data} mesa={mesa} carrito={carrito} total={total} cambiarQ={cambiarQ} onClose={() => setVerCarrito(false)} onPedir={(nota, m) => { pedir(nota, m); setVerCarrito(false); }} />}
    </div>
  );
}

function Foto({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(false);
  return <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setOk(true)} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ok ? 'opacity-100' : 'opacity-0'}`} />;
}
function Agotada() {
  return <span className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-1 rounded-full bg-black/85 text-white tracking-wide">AGOTADA</span>;
}

function Hoja({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-lg bg-[#161616] rounded-t-3xl border-t border-white/10 max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="w-11 h-1.5 rounded-full bg-white/20 mx-auto mt-3 mb-1" />
        {children}
      </div>
    </div>
  );
}

function HojaDetalle({ data, item, onClose, onAdd }: { data: Afiliado; item: Item; onClose: () => void; onAdd: (t: Tamano, borde: boolean, q: number) => void }) {
  const [tam, setTam] = useState<Tamano>(data.tamanos[0]);
  const [borde, setBorde] = useState(false);
  const [q, setQ] = useState(1);
  const p = precioDe(tam, borde && !!tam.borde) * q;
  return (
    <Hoja onClose={onClose}>
      {item.foto && <div className="relative aspect-[16/10] mx-4 mt-2 rounded-2xl overflow-hidden bg-[#111]"><Foto src={item.foto} alt={item.n} /></div>}
      <div className="px-5 pt-4">
        <h3 className="text-2xl font-extrabold leading-tight">{item.n}</h3>
        <p className="text-sm text-white/60 mt-1">{item.i}</p>

        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 mt-5 mb-2">Tamaño</p>
        <div className="flex flex-col gap-2">
          {data.tamanos.map((t) => {
            const sel = t.k === tam.k;
            return (
              <button key={t.k} onClick={() => { setTam(t); if (!t.borde) setBorde(false); }} className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${sel ? 'border-transparent text-black' : 'border-white/15 text-white'}`} style={sel ? { background: 'var(--oro)' } : undefined}>
                <span className="font-semibold">{t.t}</span>
                <span className="font-mono tabular-nums font-bold">Bs {t.p}</span>
              </button>
            );
          })}
        </div>

        {tam.borde && (
          <button onClick={() => setBorde((b) => !b)} className={`mt-3 w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${borde ? 'border-transparent text-black' : 'border-white/15 text-white'}`} style={borde ? { background: 'var(--oro)' } : undefined}>
            <span className="font-semibold">Borde de queso</span>
            <span className="font-mono tabular-nums">+ Bs {tam.borde - tam.p}</span>
          </button>
        )}

        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setQ((x) => Math.max(1, x - 1))} className="w-10 h-10 rounded-full bg-white/10 text-xl">−</button>
            <span className="w-6 text-center font-bold text-lg tabular-nums">{q}</span>
            <button onClick={() => setQ((x) => Math.min(20, x + 1))} className="w-10 h-10 rounded-full bg-white/10 text-xl">+</button>
          </div>
          <span className="font-mono tabular-nums text-xl font-bold" style={{ color: 'var(--oro)' }}>Bs {p}</span>
        </div>

        <button onClick={() => onAdd(tam, borde && !!tam.borde, q)} className="mt-4 mb-5 w-full py-4 rounded-2xl font-bold text-lg text-black active:scale-[.98] transition-transform" style={{ background: 'var(--oro)' }}>Agregar · Bs {p}</button>
      </div>
    </Hoja>
  );
}

function HojaCarrito({ data, mesa, carrito, total, cambiarQ, onClose, onPedir }: {
  data: Afiliado; mesa: string; carrito: Linea[]; total: number;
  cambiarQ: (key: string, d: number) => void; onClose: () => void; onPedir: (nota: string, mesa: string) => void;
}) {
  const [nota, setNota] = useState('');
  const [m, setM] = useState(mesa);
  return (
    <Hoja onClose={onClose}>
      <div className="px-5 pt-3">
        <div className="flex items-baseline justify-between"><h3 className="text-2xl font-extrabold">Tu pedido</h3><span className="text-xs text-white/45">{data.nombre}</span></div>
        <div className="mt-3 divide-y divide-white/10">
          {carrito.map((l) => (
            <div key={l.key} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">{l.n}</div>
                <div className="text-xs text-white/50 mt-0.5">{l.tamT}{l.borde ? ' · borde de queso' : ''}{l.tamT ? ` · Bs ${l.p} c/u` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => cambiarQ(l.key, -1)} className="w-8 h-8 rounded-full bg-white/10">−</button>
                <span className="w-5 text-center font-bold tabular-nums">{l.q}</span>
                <button onClick={() => cambiarQ(l.key, 1)} className="w-8 h-8 rounded-full bg-white/10">+</button>
              </div>
              <span className="w-16 text-right font-mono tabular-nums font-bold" style={{ color: 'var(--oro)' }}>Bs {l.p * l.q}</span>
            </div>
          ))}
          {carrito.length === 0 && <p className="py-8 text-center text-white/40 text-sm">Tu pedido está vacío</p>}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 mt-4">
          <input value={nota} onChange={(e) => setNota(e.target.value.slice(0, 120))} placeholder="Nota para la cocina (opcional)" className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-sm outline-none focus:border-white/40" />
          <input value={m} onChange={(e) => setM(e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 6))} placeholder="Mesa" className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-center outline-none focus:border-white/40" />
        </div>

        <div className="flex items-baseline justify-between mt-5 pt-4 border-t border-white/10">
          <span className="text-white/60">Total</span>
          <span className="font-mono tabular-nums text-2xl font-extrabold" style={{ color: 'var(--oro)' }}>Bs {total}</span>
        </div>
        <button disabled={!carrito.length} onClick={() => onPedir(nota.trim(), m)} className="mt-4 mb-5 w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-40 active:scale-[.98] transition-transform flex items-center justify-center gap-2" style={{ background: '#25D366', color: '#04351A' }}>
          Hacer pedido por WhatsApp
        </button>
        <p className="text-center text-[11px] text-white/35 -mt-3 mb-5">Llega a la cocina y se abre WhatsApp con tu pedido armado.</p>
      </div>
    </Hoja>
  );
}

/* ================= COCINA (nuestra tipografía) ================= */
function Cocina({ data, tickets, nuevas, sonido, setSonido, avanzar, agotado, toggleDisp }: {
  data: Afiliado; tickets: Ticket[]; nuevas: number; sonido: boolean; setSonido: (f: (s: boolean) => boolean) => void;
  avanzar: (id: number) => void; agotado: (slug: string) => boolean; toggleDisp: (slug: string) => void;
}) {
  const [filtro, setFiltro] = useState<'todas' | Estado>('todas');
  const now = Date.now();
  const lista = tickets.filter((k) => filtro === 'todas' ? k.estado !== 'entregado' : k.estado === filtro);
  const entregadas = tickets.filter((k) => k.estado === 'entregado').length;
  return (
    <div className="min-h-screen bg-negro text-crema">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-press-start text-[12px] text-maiz uppercase tracking-wide" style={{ textShadow: '2px 2px 0 var(--color-rojo)' }}>Cocina · {data.nombre}</h1>
          <div className="flex items-center gap-2">
            <span className={`font-press-start text-[8px] px-2 py-1.5 tracking-wider ${nuevas ? 'bg-maiz text-negro animate-pulse' : 'bg-crema/15 text-crema/60'}`}>{nuevas} NUEVA(S)</span>
            <button onClick={() => setSonido((s) => !s)} className="font-press-start text-[8px] text-crema/70 border-2 border-crema/25 px-2.5 py-1.5 uppercase tracking-wider">Sonido {sonido ? 'ON' : 'OFF'}</button>
          </div>
        </div>

        {/* filtros */}
        <div className="flex gap-1.5 flex-wrap mt-5">
          {([['todas', 'En curso'], ['nuevo', 'Nuevas'], ['preparando', 'En horno'], ['listo', 'Listas'], ['entregado', `Entregadas${entregadas ? ` ·${entregadas}` : ''}`]] as const).map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)} className={`font-press-start text-[8px] px-3 py-2 border-2 tracking-wider ${filtro === k ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>{t}</button>
          ))}
        </div>

        {/* comanda */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {lista.length === 0 && <p className="text-crema/40 text-sm font-mono py-10 text-center col-span-full">sin comandas — llegan aquí cuando un cliente pide</p>}
          {lista.map((k) => (
            <div key={k.id} className={`border-2 p-3 ${k.estado === 'nuevo' ? 'border-maiz animate-[pulse_2s_ease-in-out_2]' : 'border-crema/15'}`}>
              <div className="flex justify-between items-center gap-2">
                <span className="font-press-start text-[10px] text-crema">#{k.id}{k.mesa ? ` · MESA ${k.mesa}` : ''}</span>
                <span className="font-mono text-[11px] text-crema/60 tabular-nums">{mmss(now - k.nacido)}</span>
              </div>
              <span className={`inline-block mt-2 font-press-start text-[7px] px-2 py-1 tracking-wider ${colorEstado(k.estado)}`}>{ET[k.estado]}</span>
              <ul className="mt-2 font-mono text-xs text-crema/85 leading-relaxed">
                {k.items.map((l) => <li key={l.key}>{l.q}× {l.n}{l.tamT ? ` · ${l.tamT}` : ''}{l.borde ? ' · borde' : ''}</li>)}
              </ul>
              {k.nota && <p className="mt-2 text-xs text-maiz italic">“{k.nota}”</p>}
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-crema/10">
                <span className="font-mono text-maiz text-sm tabular-nums">Bs {k.total}</span>
                {k.estado !== 'entregado' && <button onClick={() => avanzar(k.id)} className={`font-press-start text-[8px] py-2 px-3 border-2 uppercase tracking-wider ${k.estado === 'listo' ? 'text-crema border-crema/30' : 'text-negro bg-lima border-negro'}`}>{ACCION[k.estado]}</button>}
              </div>
            </div>
          ))}
        </div>

        {/* disponibilidad por categoría */}
        <h2 className="font-press-start text-[9px] text-lima tracking-widest uppercase mt-10 mb-1">▸ Disponibilidad</h2>
        <p className="text-sm text-crema/55 mb-4">Marca lo agotado — el cliente lo ve al instante y no puede pedirlo.</p>
        {data.categorias.map((cat) => (
          <div key={cat.k} className="mb-5">
            <p className="font-press-start text-[8px] text-crema/50 tracking-widest uppercase mb-2">{cat.t}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {cat.items.map((it) => (
                <div key={it.slug} className="flex items-center gap-3 border-2 border-crema/15 bg-carbon p-2">
                  <div className="w-11 h-11 rounded overflow-hidden bg-negro shrink-0">{it.foto && <img src={it.foto} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
                  <span className="text-sm text-crema truncate flex-1">{it.n}</span>
                  <button onClick={() => toggleDisp(it.slug)} className={`font-press-start text-[8px] px-3 py-2 border-2 tracking-wider shrink-0 ${agotado(it.slug) ? 'text-brasa border-brasa' : 'text-lima border-lima'}`}>{agotado(it.slug) ? 'Agotada' : 'Hay'}</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
