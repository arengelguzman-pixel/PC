import { useEffect, useRef, useState } from 'react';
import type { Afiliado } from '../afiliados/elGaraje';

// Menú personalizado de un afiliado (link secreto), con 2 vistas:
//  · Cliente  → su marca propia (negro + oro), pizzas por tamaño, pedido.
//  · Cocina   → nuestra tipografía (Press Start 2P), minimalista: la comanda
//               llega en vivo, con alerta, y se gestiona la disponibilidad.
type EnCarrito = { k: string; n: string; tam: string; p: number };
type Estado = 'nuevo' | 'preparando' | 'listo' | 'entregado';
type Ticket = { id: number; items: EnCarrito[]; total: number; estado: Estado; nacido: number };

const ET: Record<Estado, string> = { nuevo: 'NUEVA', preparando: 'EN HORNO', listo: 'LISTA', entregado: 'ENTREGADA' };
const colorEstado = (e: Estado) => e === 'nuevo' ? 'bg-maiz text-negro' : e === 'preparando' ? 'bg-azul text-white' : e === 'listo' ? 'bg-lima text-negro' : 'bg-crema/30 text-crema';

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC(); const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); g.gain.value = 0.06; o.type = 'square';
    o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.24); setTimeout(() => ctx.close(), 400);
  } catch { /* */ }
}

export default function CartaAfiliado({ data }: { data: Afiliado }) {
  const [vista, setVista] = useState<'cliente' | 'cocina'>('cliente');
  const [carrito, setCarrito] = useState<EnCarrito[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [noDisp, setNoDisp] = useState<string[]>([]);
  const [alerta, setAlerta] = useState('');
  const [sonido, setSonido] = useState(true);
  const [, setTick] = useState(0);
  const idRef = useRef(1);

  useEffect(() => {
    document.title = `${data.nombre} · Menú`;
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => { document.head.removeChild(m); clearInterval(t); };
  }, [data.nombre]);

  const agotado = (n: string) => noDisp.includes(n);
  const toggleDisp = (n: string) => setNoDisp((s) => s.includes(n) ? s.filter((x) => x !== n) : [...s, n]);
  const add = (n: string, tam: string, p: number) => setCarrito((c) => [...c, { k: `${n}-${tam}-${Date.now()}-${Math.random()}`, n, tam, p }]);
  const quitar = (k: string) => setCarrito((c) => c.filter((x) => x.k !== k));
  const total = carrito.reduce((a, x) => a + x.p, 0);

  const pedir = () => {
    if (!carrito.length) return;
    // 1) entra a la comanda de cocina
    const t: Ticket = { id: idRef.current++, items: carrito, total, estado: 'nuevo', nacido: Date.now() };
    setTickets((prev) => [...prev, t]);
    setAlerta(`🔔 ¡NUEVA COMANDA! Pedido #${t.id} · ${carrito.length} ítem(s) · Bs ${total}`);
    if (sonido) beep();
    window.setTimeout(() => setAlerta(''), 4200);
    // 2) además abre WhatsApp con el pedido armado
    const lineas = carrito.map((x) => `• ${x.n}${x.tam ? ` (${x.tam})` : ''} — Bs ${x.p}`).join('\n');
    window.open(`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(`🍕 PEDIDO · ${data.nombre}\n\n${lineas}\n\nTOTAL: Bs ${total}`)}`, '_blank');
    setCarrito([]);
  };
  const avanzar = (id: number) => setTickets((prev) => prev.map((k) => k.id === id ? { ...k, estado: (k.estado === 'nuevo' ? 'preparando' : k.estado === 'preparando' ? 'listo' : 'entregado') as Estado, nacido: Date.now() } : k));

  const enCurso = tickets.filter((k) => k.estado !== 'entregado');
  const nuevas = tickets.filter((k) => k.estado === 'nuevo').length;
  const vars = { ['--oro' as string]: data.oro } as React.CSSProperties;

  return (
    <div>
      {alerta && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-lg bg-maiz text-negro border-[3px] border-negro shadow-[6px_6px_0_var(--color-rojo)] px-4 py-3 font-press-start text-[10px] tracking-wide animate-pulse">{alerta}</div>
      )}

      {/* barra de vistas — nuestra tipografía */}
      <div className="sticky top-0 z-40 bg-carbon border-b-2 border-lima px-4 py-2.5 flex items-center justify-between gap-3">
        <span className="font-press-start text-[9px] text-lima">PLATO VIVO</span>
        <div className="flex gap-1.5">
          <button onClick={() => setVista('cliente')} className={`font-press-start text-[8px] px-3 py-2 border-2 tracking-wider ${vista === 'cliente' ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>Cliente</button>
          <button onClick={() => setVista('cocina')} className={`font-press-start text-[8px] px-3 py-2 border-2 tracking-wider ${vista === 'cocina' ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>Cocina{nuevas ? ` ·${nuevas}` : ''}</button>
        </div>
      </div>

      {vista === 'cliente'
        ? <Cliente data={data} vars={vars} carrito={carrito} total={total} abierto={abierto} setAbierto={setAbierto} agotado={agotado} add={add} quitar={quitar} pedir={pedir} />
        : (
          <div className="min-h-screen bg-negro text-crema">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="font-press-start text-[12px] text-maiz uppercase tracking-wide" style={{ textShadow: '2px 2px 0 var(--color-rojo)' }}>Cocina · {data.nombre}</h1>
                <div className="flex items-center gap-2">
                  <span className={`font-press-start text-[8px] px-2 py-1.5 tracking-wider ${nuevas ? 'bg-maiz text-negro animate-pulse' : 'bg-crema/15 text-crema/60'}`}>{nuevas} NUEVA(S)</span>
                  <button onClick={() => setSonido((s) => !s)} className="font-press-start text-[8px] text-crema/70 border-2 border-crema/25 px-2.5 py-1.5 uppercase tracking-wider">Sonido {sonido ? 'ON' : 'OFF'}</button>
                </div>
              </div>

              {/* comanda */}
              <h2 className="font-press-start text-[9px] text-lima tracking-widest uppercase mt-6 mb-3">▸ Comanda</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enCurso.length === 0 && <p className="text-crema/40 text-sm font-mono py-8 text-center col-span-full">sin comandas — llegan aquí cuando un cliente pide</p>}
                {enCurso.map((k) => (
                  <div key={k.id} className={`border-2 p-3 ${k.estado === 'nuevo' ? 'border-maiz' : 'border-crema/15'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-press-start text-[10px] text-crema">PEDIDO #{k.id}</span>
                      <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${colorEstado(k.estado)}`}>{ET[k.estado]}</span>
                    </div>
                    <ul className="mt-2 font-mono text-xs text-crema/80 leading-relaxed">{k.items.map((it, i) => <li key={i}>{it.n}{it.tam ? ` · ${it.tam}` : ''} — Bs {it.p}</li>)}</ul>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-crema/10">
                      <span className="font-mono text-maiz text-sm">Bs {k.total}</span>
                      <button onClick={() => avanzar(k.id)} className={`font-press-start text-[8px] py-2 px-3 border-2 uppercase tracking-wider ${k.estado === 'listo' ? 'text-crema border-crema/30' : 'text-negro bg-lima border-negro'}`}>{k.estado === 'nuevo' ? 'Al horno ▸' : k.estado === 'preparando' ? 'Lista ▸' : 'Entregar ▸'}</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* disponibilidad */}
              <h2 className="font-press-start text-[9px] text-lima tracking-widest uppercase mt-10 mb-3">▸ Disponibilidad</h2>
              <p className="text-sm text-crema/55 mb-3">Marca lo agotado — el cliente lo ve al instante y no puede pedirlo.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[...data.especiales.map((e) => e.n), ...data.pizzas.map((p) => p.n)].map((n) => (
                  <div key={n} className="flex items-center justify-between gap-3 border-2 border-crema/15 bg-carbon px-3 py-2.5">
                    <span className="text-sm text-crema truncate">{n}</span>
                    <button onClick={() => toggleDisp(n)} className={`font-press-start text-[8px] px-3 py-2 border-2 tracking-wider shrink-0 ${agotado(n) ? 'text-brasa border-brasa' : 'text-lima border-lima'}`}>{agotado(n) ? 'Agotada' : 'Hay'}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// ---- Vista del cliente: su marca (negro + oro) ----
function Cliente({ data, vars, carrito, total, abierto, setAbierto, agotado, add, quitar, pedir }: {
  data: Afiliado; vars: React.CSSProperties; carrito: EnCarrito[]; total: number;
  abierto: string | null; setAbierto: (n: string | null) => void; agotado: (n: string) => boolean;
  add: (n: string, tam: string, p: number) => void; quitar: (k: string) => void; pedir: () => void;
}) {
  return (
    <div style={vars} className="min-h-screen bg-[#0d0d0d] text-white pb-32">
      <div className="max-w-lg mx-auto px-5">
        <header className="pt-6 pb-6 text-center">
          <img src={data.logo} alt={data.nombre} className="w-28 h-28 rounded-full object-cover mx-auto border-4" style={{ borderColor: 'var(--oro)' }} />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{data.nombre}</h1>
          <p className="text-sm mt-1 text-white/60 uppercase tracking-widest">{data.bajada}</p>
        </header>

        <div className="border-y-2 py-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm" style={{ borderColor: 'var(--oro)' }}>
          {data.tamanos.map((t) => (
            <span key={t.k} className="font-mono"><b style={{ color: 'var(--oro)' }}>{t.t}</b> Bs {t.p}{t.borde ? ` · borde ${t.borde}` : ''}</span>
          ))}
        </div>

        {/* ESPECIALES */}
        <h2 className="mt-7 mb-3 text-xl font-extrabold" style={{ color: 'var(--oro)' }}>Especiales</h2>
        {data.especiales.map((e) => {
          const no = agotado(e.n);
          return (
            <div key={e.n} className="mb-3 rounded-2xl overflow-hidden bg-[#1a1a1a] border" style={{ borderColor: 'var(--oro)', opacity: no ? 0.5 : 1 }}>
              {e.foto && <div className="relative aspect-[4/3]"><img src={e.foto} alt={e.n} className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--oro)', color: '#000' }}>ESPECIAL</span>
                {no && <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-black/80 text-white">AGOTADA</span>}</div>}
              <div className="p-4 flex items-center justify-between gap-3">
                <div><h3 className="text-xl font-bold">{e.n}</h3><p className="text-sm text-white/60 mt-0.5">{e.i}</p></div>
                {!no && <button onClick={() => add(e.n, '', e.p)} className="shrink-0 font-bold text-sm px-4 py-2.5 rounded-full" style={{ background: 'var(--oro)', color: '#000' }}>Bs {e.p} +</button>}
              </div>
            </div>
          );
        })}

        {/* PIZZAS */}
        <h2 className="mt-6 mb-3 text-xl font-extrabold" style={{ color: 'var(--oro)' }}>Pizzas</h2>
        <div className="flex flex-col gap-2.5">
          {data.pizzas.map((p) => {
            const open = abierto === p.n;
            const no = agotado(p.n);
            return (
              <div key={p.n} className="rounded-xl bg-[#1a1a1a] overflow-hidden" style={{ opacity: no ? 0.5 : 1 }}>
                <button onClick={() => !no && setAbierto(open ? null : p.n)} className="w-full flex items-center gap-3 p-4 text-left">
                  {p.foto && <img src={p.foto} alt={p.n} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0 flex-1"><h3 className="font-bold leading-tight">{p.n}</h3><p className="text-xs text-white/55 mt-0.5">{p.i}</p></div>
                  <span className="shrink-0 text-sm font-mono" style={{ color: 'var(--oro)' }}>{no ? 'AGOTADA' : `desde Bs ${data.tamanos[0].p} ${open ? '▲' : '▾'}`}</span>
                </button>
                {open && !no && (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {data.tamanos.map((t) => (
                      <button key={t.k} onClick={() => add(p.n, t.t, t.p)} className="flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: 'var(--oro)' }}>
                        <span>{t.t}</span><span className="font-bold" style={{ color: 'var(--oro)' }}>Bs {t.p} +</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-white/40 mt-8">Menú digital por <b className="text-white/60">PLATO VIVO</b> · Pedidos al {data.whatsapp.replace('591', '')}</p>
      </div>

      {carrito.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#111] border-t-2" style={{ borderColor: 'var(--oro)' }}>
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="max-h-28 overflow-y-auto">
              {carrito.map((x) => (
                <div key={x.k} className="flex justify-between items-center py-1 text-sm">
                  <span>{x.n}{x.tam ? ` · ${x.tam}` : ''}</span>
                  <span className="flex items-center gap-2"><span className="font-mono text-white/70">Bs {x.p}</span>
                    <button onClick={() => quitar(x.k)} className="w-6 h-6 rounded-full bg-white/10">−</button></span>
                </div>
              ))}
            </div>
            <button onClick={pedir} className="mt-2 w-full py-4 rounded-xl font-bold text-lg" style={{ background: '#25D366', color: '#04351A' }}>Pedir por WhatsApp · Bs {total}</button>
          </div>
        </div>
      )}
    </div>
  );
}
