import { useEffect, useState } from 'react';
import type { Afiliado } from '../afiliados/elGaraje';

// Menú personalizado de un afiliado (link secreto). Marca propia (negro + oro),
// pizzas por tamaño, pedido directo a su WhatsApp. Minimalista y moderno.
type EnCarrito = { k: string; n: string; tam: string; p: number };

export default function CartaAfiliado({ data }: { data: Afiliado }) {
  const [carrito, setCarrito] = useState<EnCarrito[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${data.nombre} · Menú`;
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    return () => { document.head.removeChild(m); };
  }, [data.nombre]);

  const add = (n: string, tam: string, p: number) => setCarrito((c) => [...c, { k: `${n}-${tam}-${Date.now()}-${Math.random()}`, n, tam, p }]);
  const quitar = (k: string) => setCarrito((c) => c.filter((x) => x.k !== k));
  const total = carrito.reduce((a, x) => a + x.p, 0);
  const pedir = () => {
    if (!carrito.length) return;
    const lineas = carrito.map((x) => `• ${x.n}${x.tam ? ` (${x.tam})` : ''} — Bs ${x.p}`).join('\n');
    const msg = `🍕 PEDIDO · ${data.nombre}\n\n${lineas}\n\nTOTAL: Bs ${total}`;
    window.open(`https://wa.me/${data.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  const vars = { ['--oro' as string]: data.oro } as React.CSSProperties;

  return (
    <div style={vars} className="min-h-screen bg-[#0d0d0d] text-white pb-32" >
      <div className="max-w-lg mx-auto px-5">
        {/* cabecera */}
        <header className="pt-8 pb-6 text-center">
          <img src={data.logo} alt={data.nombre} className="w-28 h-28 rounded-full object-cover mx-auto border-4" style={{ borderColor: 'var(--oro)' }} />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{data.nombre}</h1>
          <p className="text-sm mt-1 text-white/60 uppercase tracking-widest">{data.bajada}</p>
        </header>

        {/* banner de tamaños */}
        <div className="border-y-2 py-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm" style={{ borderColor: 'var(--oro)' }}>
          {data.tamanos.map((t) => (
            <span key={t.k} className="font-mono"><b style={{ color: 'var(--oro)' }}>{t.t}</b> Bs {t.p}{t.borde ? ` · borde ${t.borde}` : ''}</span>
          ))}
        </div>

        {/* especiales */}
        {data.especiales.map((e) => (
          <div key={e.n} className="mt-6 rounded-2xl overflow-hidden bg-[#1a1a1a] border" style={{ borderColor: 'var(--oro)' }}>
            {e.foto && <div className="relative aspect-[4/3]"><img src={e.foto} alt={e.n} className="absolute inset-0 w-full h-full object-cover" />
              <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--oro)', color: '#000' }}>ESPECIAL</span></div>}
            <div className="p-4 flex items-center justify-between gap-3">
              <div><h3 className="text-xl font-bold">{e.n}</h3><p className="text-sm text-white/60 mt-0.5">{e.i}</p></div>
              <button onClick={() => add(e.n, '', e.p)} className="shrink-0 font-bold text-sm px-4 py-2.5 rounded-full" style={{ background: 'var(--oro)', color: '#000' }}>Bs {e.p} +</button>
            </div>
          </div>
        ))}

        {/* pizzas */}
        <h2 className="mt-8 mb-3 text-xl font-extrabold" style={{ color: 'var(--oro)' }}>Pizzas</h2>
        <div className="flex flex-col gap-2.5">
          {data.pizzas.map((p) => {
            const open = abierto === p.n;
            return (
              <div key={p.n} className="rounded-xl bg-[#1a1a1a] overflow-hidden">
                <button onClick={() => setAbierto(open ? null : p.n)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
                  <div className="min-w-0"><h3 className="font-bold leading-tight">{p.n}</h3><p className="text-xs text-white/55 mt-0.5">{p.i}</p></div>
                  <span className="shrink-0 text-sm font-mono" style={{ color: 'var(--oro)' }}>desde Bs {data.tamanos[0].p} {open ? '▲' : '▾'}</span>
                </button>
                {open && (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    {data.tamanos.map((t) => (
                      <button key={t.k} onClick={() => { add(p.n, t.t, t.p); }} className="flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: 'var(--oro)' }}>
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

      {/* carrito → WhatsApp */}
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
            <button onClick={pedir} className="mt-2 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2" style={{ background: '#25D366', color: '#04351A' }}>
              Pedir por WhatsApp · Bs {total}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
