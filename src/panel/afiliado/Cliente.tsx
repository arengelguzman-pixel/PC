import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import LogoMeza from '../../components/LogoMeza';
import type { Afiliado, Item, Tamano } from '../../afiliados/elGaraje';
import {
  crearPedido, subirComprobante, misPedidos, recordarPedido, comprimirImagen,
  ETIQUETA_PAGO, ETIQUETA_COCINA, minutos, type Pedido, type Linea, type Metodo,
} from '../../lib/pedidos';
import { precioDe, Foto, Agotada, Hoja } from './comunes';

// Vista del CLIENTE (su marca: negro + oro). Menú, hoja de detalle, carrito con
// checkout (QR o caja), hoja de pago con comprobante y seguimiento en vivo.
// El estado en vivo (pedidos / agotados / qr) llega por props desde el shell.

const PASOS: { k: Pedido['cocina']; t: string }[] = [
  { k: 'nuevo', t: 'Recibido' }, { k: 'preparando', t: 'En el horno' }, { k: 'listo', t: 'Listo' }, { k: 'entregado', t: 'Entregado' },
];
const COLOR_PAGO: Record<Pedido['pago'], string> = { pendiente: 'text-white/60', por_confirmar: 'text-maiz', confirmado: 'text-lima', rechazado: 'text-brasa' };
const lineaTxt = (l: Linea) => `${l.q}× ${l.n}${l.tamT ? ` (${l.tamT}${l.borde ? ', borde de queso' : ''})` : ''}`;
const resumenDe = (p: Pedido) => p.items.map(lineaTxt).join(', ');
const textoWhatsApp = (data: Afiliado, p: Pedido) =>
  `🍕 Pedido ${p.id} · ${data.nombre}${p.mesa ? `\nMesa ${p.mesa}` : ''}\n\n${p.items.map((l) => `• ${lineaTxt(l)} — Bs ${l.p * l.q}`).join('\n')}\n\nTotal: Bs ${p.total}\nPago: ${ETIQUETA_PAGO[p.pago]}${p.nota ? `\nNota: ${p.nota}` : ''}`;

export default function Cliente({ data, mesa, agotados, qr, pedidos, conectado }: {
  data: Afiliado; mesa: string; agotados: string[]; qr: string | null; pedidos: Pedido[]; conectado: boolean;
}) {
  const [carrito, setCarrito] = useState<Linea[]>([]);
  const [detalle, setDetalle] = useState<Item | null>(null);
  const [verCarrito, setVerCarrito] = useState(false);
  const [pagoId, setPagoId] = useState<string | null>(null);
  const [mios, setMios] = useState<string[]>(() => misPedidos(data.local));
  const [locales, setLocales] = useState<Record<string, Pedido>>({});   // respuestas optimistas; las props mandan
  const [toast, setToast] = useState('');
  const [activa, setActiva] = useState(data.categorias[0].k);
  const [, setTick] = useState(0);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});
  const toastTimer = useRef(0);
  const firmas = useRef<Record<string, string>>({});
  const vars = { ['--oro' as string]: data.oro } as CSSProperties;

  const avisar = (msg: string, ms = 2600) => {
    setToast(msg); clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), ms);
  };

  // scrollspy de categorías
  useEffect(() => {
    const io = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActiva((a) => (vis.target as HTMLElement).dataset.cat || a);
    }, { rootMargin: '-120px 0px -60% 0px', threshold: 0 });
    Object.values(secRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [data]);

  // "hace N min" del seguimiento
  useEffect(() => {
    if (!mios.length) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, [mios.length]);

  const irA = (k: string) => { setActiva(k); secRefs.current[k]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const agotado = (slug: string) => agotados.includes(slug);

  // pedido por id: la prop manda; si la respuesta optimista es más nueva, esa
  const pedidoDe = (id: string): Pedido | undefined => {
    const a = pedidos.find((p) => p.id === id), b = locales[id];
    if (a && b) return a.actualizado >= b.actualizado ? a : b;
    return a ?? b;
  };
  const seguimiento = mios.map(pedidoDe).filter((p): p is Pedido => !!p).sort((a, b) => b.creado - a.creado);

  // avisos cuando caja confirma o cocina termina (aunque la hoja esté cerrada)
  useEffect(() => {
    for (const p of seguimiento) {
      const firma = `${p.pago}|${p.cocina}`, antes = firmas.current[p.id];
      firmas.current[p.id] = firma;
      if (!antes || antes === firma) continue;
      if (p.pago === 'confirmado' && !antes.startsWith('confirmado')) avisar(`✅ Pago confirmado · ${p.id}`, 3500);
      else if (p.pago === 'rechazado' && !antes.startsWith('rechazado')) avisar(`❌ Comprobante rechazado · ${p.id}. Vuelve a subirlo.`, 4000);
      else if (p.cocina === 'listo' && !antes.endsWith('listo')) avisar(`🍕 ${p.id} está listo`, 3500);
    }
  });

  const agregar = (item: Item, tam: Tamano | null, borde: boolean, q: number) => {
    const p = tam ? precioDe(tam, borde) : (item.p ?? 0);
    if (!p) return;
    const key = `${item.slug}|${tam?.k ?? '-'}|${borde ? 'b' : ''}`;
    setCarrito((c) => {
      const i = c.findIndex((l) => l.key === key);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], q: n[i].q + q }; return n; }
      return [...c, { key, slug: item.slug, n: item.n, tamK: tam?.k ?? '', tamT: tam?.t ?? '', borde, p, q }];
    });
    avisar(`Agregado · ${item.n}${tam ? ` ${tam.t}` : ''}`, 1600);
  };
  const cambiarQ = (key: string, d: number) => setCarrito((c) => c.map((l) => l.key === key ? { ...l, q: l.q + d } : l).filter((l) => l.q > 0));
  const total = useMemo(() => carrito.reduce((a, l) => a + l.p * l.q, 0), [carrito]);
  const cantidad = useMemo(() => carrito.reduce((a, l) => a + l.q, 0), [carrito]);

  const pedir = async (nota: string, mesaTxt: string, metodo: Metodo) => {
    if (!carrito.length) return;
    const r = await crearPedido(data.local, { mesa: mesaTxt, items: carrito, nota, total, metodo });
    if (!r.ok) { avisar(r.msg || 'No se pudo enviar el pedido. Intenta de nuevo.', 3500); return; }
    const p = r.pedido;
    recordarPedido(data.local, p.id);
    setMios((m) => [...new Set([...misPedidos(data.local), ...m, p.id])]);
    setLocales((m) => ({ ...m, [p.id]: p }));
    setCarrito([]); setVerCarrito(false);
    if (metodo === 'qr') setPagoId(p.id);
    else avisar(`Pedido ${p.id} enviado · paga en caja`, 3500);
  };

  return (
    <div style={vars} className="text-white pb-32">
      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[95] max-w-[92%] px-4 py-2.5 rounded-full text-sm font-semibold text-black text-center shadow-lg" style={{ background: 'var(--oro)' }}>{toast}</div>
      )}

      {/* cabecera */}
      <header className="max-w-lg mx-auto px-5 pt-7 pb-5 text-center">
        <img src={data.logo} alt={data.nombre} className="w-24 h-24 rounded-full object-cover mx-auto ring-4" style={{ ['--tw-ring-color' as string]: 'var(--oro)' }} />
        <h1 className="mt-4 text-[30px] font-extrabold tracking-tight leading-none">{data.nombre}</h1>
        <p className="mt-2 text-[11px] text-white/55 uppercase tracking-[0.2em]">{data.bajada} · {data.ciudad}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold text-black" style={{ background: 'var(--oro)' }}>
          {mesa ? `MESA ${mesa}` : 'PIDE DESDE TU CELULAR'}
        </div>
      </header>

      {/* seguimiento de mis pedidos */}
      {seguimiento.length > 0 && <Seguimiento data={data} pedidos={seguimiento} conectado={conectado} onPagar={setPagoId} />}

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
                      <Foto src={it.foto} alt={it.n} eager />
                      <span className="absolute top-3 left-3 text-[11px] font-extrabold px-2.5 py-1 rounded-full text-black" style={{ background: 'var(--oro)' }}>ESPECIAL</span>
                      {no && <Agotada />}
                    </div>
                  )}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0"><h3 className="text-xl font-bold leading-tight">{it.n}</h3><p className="text-[13px] text-white/60 mt-1">{it.i}</p></div>
                    {!no && it.p ? <button onClick={() => agregar(it, null, false, 1)} className="shrink-0 font-bold text-sm px-4 py-2.5 rounded-full text-black active:scale-[.97] transition-transform font-mono tabular-nums" style={{ background: 'var(--oro)' }}>Bs {it.p} +</button> : null}
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
                    <article key={it.slug} onClick={() => !no && setDetalle(it)} className={`rounded-2xl overflow-hidden bg-[#161616] border border-white/10 ${no ? 'opacity-50' : 'cursor-pointer active:scale-[.98] transition-transform'}`}>
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
          Pedidos · {data.telefonoVisible}<br />Menú digital por <LogoMeza alto={10} color="rgba(255,255,255,.6)" animado={false} sombra={false} className="align-middle ml-1" />
        </footer>
      </main>

      {/* píldora del carrito */}
      {cantidad > 0 && !verCarrito && !pagoId && (
        <button onClick={() => setVerCarrito(true)} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg flex items-center justify-between px-5 py-4 rounded-2xl text-black font-bold shadow-2xl active:scale-[.98] transition-transform" style={{ background: 'var(--oro)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <span className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-black/15 grid place-items-center text-sm">{cantidad}</span> Ver mi pedido</span>
          <span className="font-mono tabular-nums">Bs {total}</span>
        </button>
      )}

      {/* hoja: detalle de pizza (tamaño + borde + cantidad) */}
      {detalle && <HojaDetalle data={data} item={detalle} onClose={() => setDetalle(null)} onAdd={(t, b, q) => { agregar(detalle, t, b, q); setDetalle(null); }} />}

      {/* hoja: carrito + checkout */}
      {verCarrito && <HojaCarrito data={data} mesa={mesa} hayQr={!!qr} carrito={carrito} total={total} cambiarQ={cambiarQ} onClose={() => setVerCarrito(false)} onPedir={pedir} />}

      {/* hoja: pago por QR + comprobante */}
      {pagoId && <HojaPago data={data} qr={qr} pedido={pedidoDe(pagoId)} onClose={() => setPagoId(null)} onActualizado={(p) => setLocales((m) => ({ ...m, [p.id]: p }))} />}
    </div>
  );
}

/* ---------- seguimiento de mis pedidos ---------- */
function Seguimiento({ data, pedidos, conectado, onPagar }: { data: Afiliado; pedidos: Pedido[]; conectado: boolean; onPagar: (id: string) => void }) {
  const now = Date.now();
  return (
    <section className="max-w-lg mx-auto px-4 mb-2">
      <div className="rounded-2xl bg-[#161616] border border-white/10 px-4 pt-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-white/45">Seguimiento</h2>
          <span className={`inline-flex items-center gap-1.5 text-[10px] ${conectado ? 'text-white/40' : 'text-brasa'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conectado ? 'bg-lima' : 'bg-brasa animate-pulse'}`} />{conectado ? 'en vivo' : 'reconectando…'}
          </span>
        </div>
        {pedidos.map((p) => {
          const idx = Math.max(0, PASOS.findIndex((s) => s.k === p.cocina));
          const faltaPago = p.metodo === 'qr' && (p.pago === 'pendiente' || p.pago === 'rechazado');
          const sufijo = p.pago === 'pendiente' ? (p.metodo === 'qr' ? ' · QR' : ' · en caja') : '';
          return (
            <div key={p.id} className={`mt-3 pt-3 pb-2 border-t border-white/10 ${p.cocina === 'entregado' ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{p.id}{p.mesa ? ` · Mesa ${p.mesa}` : ''}</span>
                <span className="text-[11px] text-white/45">hace {minutos(now - p.creado)} min</span>
              </div>
              <p className="text-[12px] text-white/60 mt-1 leading-snug">{resumenDe(p)}</p>

              {/* pasos de cocina */}
              <div className="relative mt-3">
                <div className="absolute top-[5px] left-[12.5%] right-[12.5%] h-0.5 bg-white/10" />
                <div className="absolute top-[5px] left-[12.5%] h-0.5 transition-all duration-500" style={{ width: `${(idx / (PASOS.length - 1)) * 75}%`, background: 'var(--oro)' }} />
                <div className="relative grid grid-cols-4">
                  {PASOS.map((s, i) => (
                    <div key={s.k} className="flex flex-col items-center">
                      <span className={`w-3 h-3 rounded-full border-2 ${i <= idx ? 'border-transparent' : 'border-white/25 bg-[#161616]'}`} style={i <= idx ? { background: 'var(--oro)' } : undefined} />
                      <span className={`mt-1.5 text-[10px] text-center leading-tight ${i <= idx ? 'text-white font-semibold' : 'text-white/35'}`}>{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[12px] mt-2" style={{ color: 'var(--oro)' }}>{ETIQUETA_COCINA[p.cocina]}</p>

              {/* pago */}
              <div className="flex items-center justify-between gap-3 mt-2">
                <div className="min-w-0">
                  <span className={`block text-sm font-semibold ${COLOR_PAGO[p.pago]}`}>{ETIQUETA_PAGO[p.pago]}{sufijo}</span>
                  <span className="block font-mono tabular-nums text-sm text-white/80">Total Bs {p.total}</span>
                </div>
                {faltaPago && <button onClick={() => onPagar(p.id)} className="shrink-0 font-bold text-sm px-4 py-2.5 rounded-full text-black active:scale-[.97] transition-transform" style={{ background: 'var(--oro)' }}>Subir comprobante</button>}
              </div>
              <a href={`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(textoWhatsApp(data, p))}`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[11px] text-white/45 underline underline-offset-2">Compartir por WhatsApp</a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- hoja: detalle (tamaño + borde + cantidad) ---------- */
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

/* ---------- hoja: carrito + checkout (nota, mesa, método de pago) ---------- */
function HojaCarrito({ data, mesa, hayQr, carrito, total, cambiarQ, onClose, onPedir }: {
  data: Afiliado; mesa: string; hayQr: boolean; carrito: Linea[]; total: number;
  cambiarQ: (key: string, d: number) => void; onClose: () => void; onPedir: (nota: string, mesa: string, metodo: Metodo) => Promise<void>;
}) {
  const [nota, setNota] = useState('');
  const [m, setM] = useState(mesa);
  const [metodo, setMetodo] = useState<Metodo>(hayQr ? 'qr' : 'efectivo');
  const [enviando, setEnviando] = useState(false);
  const metodoReal: Metodo = hayQr ? metodo : 'efectivo';   // si caja quita el QR, cae a efectivo

  const enviar = async () => { setEnviando(true); await onPedir(nota.trim(), m, metodoReal); setEnviando(false); };

  const opcion = (k: Metodo, t: string, d: string) => {
    const sel = metodoReal === k;
    return (
      <button type="button" onClick={() => setMetodo(k)} className={`flex-1 text-left px-3.5 py-3 rounded-xl border transition-colors ${sel ? 'border-transparent text-black' : 'border-white/15 text-white'}`} style={sel ? { background: 'var(--oro)' } : undefined}>
        <span className="block font-semibold text-sm">{t}</span>
        <span className={`block text-[11px] mt-0.5 leading-snug ${sel ? 'text-black/70' : 'text-white/50'}`}>{d}</span>
      </button>
    );
  };

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

        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45 mt-5 mb-2">¿Cómo pagas?</p>
        <div className="flex gap-2">
          {hayQr && opcion('qr', 'Pagar con QR', 'Escaneas el QR del local y subes tu comprobante')}
          {opcion('efectivo', 'Pagar en caja', 'Efectivo al recibir o al pasar por caja')}
        </div>

        <div className="flex items-baseline justify-between mt-5 pt-4 border-t border-white/10">
          <span className="text-white/60">Total</span>
          <span className="font-mono tabular-nums text-2xl font-extrabold" style={{ color: 'var(--oro)' }}>Bs {total}</span>
        </div>
        <button disabled={!carrito.length || enviando} onClick={enviar} className="mt-4 w-full py-4 rounded-2xl font-bold text-lg text-black disabled:opacity-40 active:scale-[.98] transition-transform" style={{ background: 'var(--oro)' }}>
          {enviando ? 'Enviando…' : 'Hacer pedido'}
        </button>
        <p className="text-center text-[11px] text-white/35 mt-2 mb-5">
          {metodoReal === 'qr' ? 'Llega a la cocina al instante y te mostramos el QR para pagar.' : 'Llega a la cocina al instante. Pagas en caja.'}
        </p>
      </div>
    </Hoja>
  );
}

/* ---------- hoja: pago por QR + comprobante ---------- */
function HojaPago({ data, qr, pedido, onClose, onActualizado }: {
  data: Afiliado; qr: string | null; pedido: Pedido | undefined; onClose: () => void; onActualizado: (p: Pedido) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [err, setErr] = useState('');

  const subir = async (f: File | undefined) => {
    if (!f || !pedido) return;
    setSubiendo(true); setErr('');
    try {
      const dataUrl = await comprimirImagen(f, 1100, 0.72);   // legible y liviano: se archiva 90 días
      const r = await subirComprobante(data.local, pedido.id, dataUrl);
      if (!r.ok) setErr(r.msg || 'No se pudo subir el comprobante. Intenta de nuevo.');
      else onActualizado(r.pedido);
    } catch { setErr('No pudimos leer la imagen. Prueba con otra foto o captura.'); }
    setSubiendo(false);
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ''; subir(f); };

  const esperando = pedido?.pago === 'por_confirmar';
  const ext = qr && qr.startsWith('data:image/png') ? 'png' : 'jpg';

  return (
    <Hoja onClose={onClose}>
      <div className="px-5 pt-3 pb-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-extrabold">Pagar con QR</h3>
          {pedido && <span className="text-xs text-white/45">{pedido.id}{pedido.mesa ? ` · Mesa ${pedido.mesa}` : ''}</span>}
        </div>

        {!pedido ? (
          <p className="py-8 text-center text-white/50 text-sm">No encontramos este pedido. Espera un momento y vuelve a intentar.</p>
        ) : pedido.pago === 'confirmado' ? (
          <div className="py-8 text-center">
            <div className="text-5xl">✅</div>
            <p className="mt-3 text-xl font-extrabold">Pago confirmado</p>
            <p className="mt-1 text-sm text-white/60">Caja validó tu pago de <b className="font-mono tabular-nums text-white">Bs {pedido.total}</b>. Tu pedido sigue en la cocina.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-baseline justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <span className="text-white/60">Monto exacto</span>
              <span className="font-mono tabular-nums text-2xl font-extrabold" style={{ color: 'var(--oro)' }}>Bs {pedido.total}</span>
            </div>

            {pedido.pago === 'rechazado' && (
              <div className="mt-3 rounded-xl border border-brasa/50 bg-brasa/10 px-4 py-3 text-sm">
                <b className="text-brasa">❌ Rechazado.</b> <span className="text-white/75">Caja no pudo validar tu comprobante. Revisa que el pago haya salido y vuelve a subir la captura.</span>
              </div>
            )}

            {esperando ? (
              <div className="mt-3 rounded-xl border border-maiz/40 bg-maiz/10 px-4 py-4 text-center">
                <span className="inline-flex items-center gap-2 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-maiz animate-pulse" />Comprobante enviado, esperando a caja</span>
                <p className="mt-1 text-[12px] text-white/55">Te avisamos aquí mismo cuando lo confirmen. Puedes cerrar esta ventana.</p>
              </div>
            ) : (
              <>
                {qr ? (
                  <>
                    <div className="mt-3 rounded-2xl bg-white p-3"><img src={qr} alt="QR de cobro" className="w-full aspect-square object-contain" /></div>
                    <a href={qr} download={`qr-${data.local}.${ext}`} className="block text-center text-[12px] text-white/55 underline underline-offset-2 mt-2">Guardar imagen del QR</a>
                  </>
                ) : (
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">El local todavía no cargó su QR de cobro. Paga en caja o pregunta al personal.</p>
                )}
                <ol className="mt-4 text-sm text-white/75 space-y-1.5 list-decimal pl-5">
                  <li>Escanea el QR con tu app del banco o billetera. Si estás en el mismo celular, guarda la imagen y ábrela desde la app.</li>
                  <li>Paga el monto exacto: <b className="font-mono tabular-nums text-white">Bs {pedido.total}</b>.</li>
                  <li>Sube la captura del comprobante aquí abajo.</li>
                </ol>
              </>
            )}

            {err && <p className="mt-3 text-sm text-brasa">{err}</p>}

            <label className={`mt-4 block w-full py-4 rounded-2xl font-bold text-lg text-black text-center cursor-pointer active:scale-[.98] transition-transform ${subiendo ? 'opacity-60 pointer-events-none' : ''}`} style={{ background: 'var(--oro)' }}>
              {subiendo ? 'Subiendo…' : esperando ? 'Subir otro comprobante' : pedido.pago === 'rechazado' ? 'Volver a subir comprobante' : 'Subir comprobante'}
              <input type="file" accept="image/*" className="hidden" disabled={subiendo} onChange={onFile} />
            </label>
            <label className={`mt-2 block w-full py-3 rounded-2xl font-semibold text-sm text-white/80 bg-white/10 text-center cursor-pointer ${subiendo ? 'opacity-60 pointer-events-none' : ''}`}>
              Tomar foto del comprobante
              <input type="file" accept="image/*" capture="environment" className="hidden" disabled={subiendo} onChange={onFile} />
            </label>
          </>
        )}

        <button onClick={onClose} className="mt-3 w-full py-3 rounded-2xl font-semibold text-white/80 border border-white/15">Cerrar</button>
      </div>
    </Hoja>
  );
}
