import { useMemo, useRef, useState } from 'react';
import { BEBIDAS, CATS, ESTUDIO_MEJORAR_URL, ESTUDIO_URL, GLB, IMG, PLATOS, type Plato } from '../config';
import Plate3D from './Plate3D';

export default function MenuSection() {
  const [cat, setCat] = useState('Todo');
  const [carrito, setCarrito] = useState<Record<number, number>>({});
  const [glbSel, setGlbSel] = useState<{ url: string; label: string }>({ url: GLB.burger, label: 'HAMBURGUESA_DOBLE.3D' });
  const visorRef = useRef<HTMLDivElement>(null);

  const platos = useMemo(() => cat === 'Todo' ? PLATOS : PLATOS.filter((p) => p.cat === cat), [cat]);
  const bebidas = useMemo(() => cat === 'Todo' || cat === 'Para picar' ? BEBIDAS : [], [cat]);

  const add = (p: Plato) => { if (!p.no) setCarrito((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 })); };
  const quitar = (id: number) => setCarrito((c) => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });

  const lineas = Object.entries(carrito).map(([id, q]) => {
    const p = PLATOS.find((x) => x.id === Number(id))!;
    return { p, q, sub: p.p * q };
  });
  const total = lineas.reduce((a, l) => a + l.sub, 0);

  const verEn3D = (p: Plato) => {
    if (!p.glb) return;
    setGlbSel({ url: GLB[p.glb], label: p.n.toUpperCase().replace(/\s+/g, '_') + '.3D' });
    visorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const pedirWhatsApp = () => {
    if (!lineas.length) return;
    const cuerpo = lineas.map((l) => `• ${l.q} × ${l.p.n} — Bs ${l.sub}`).join('\n');
    const msg = `🛵 PEDIDO · TINGO DELIVERY\nLocal: Doña Elsa — Montero\n\n${cuerpo}\n\nTOTAL: Bs ${total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section id="menu" className="bg-negro/45 py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <span className="font-press-start text-[9px] bg-brasa text-white px-3 py-2 tracking-widest">✱ TU CARTA, EN 3D</span>
        <h2 className="font-press-start text-maiz text-xl sm:text-3xl md:text-4xl leading-tight mt-5 uppercase">El menú que<br /><span className="text-crema">gira con el dedo.</span></h2>
        <p className="mt-4 text-crema/80 max-w-lg">El cliente escanea el QR de la mesa, ve tus platos con foto de verdad, los gira en 3D y arma su pedido. Tú no escribes nada.</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <a href={ESTUDIO_MEJORAR_URL} target="_blank" rel="noopener noreferrer" className="font-press-start text-[9px] text-crema bg-rojo border-[3px] border-negro py-3.5 px-5 shadow-[4px_4px_0_var(--color-maiz)] active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider">📷 Mejorar la foto de mi platillo ▸</a>
          <a href={ESTUDIO_URL} target="_blank" rel="noopener noreferrer" className="font-press-start text-[9px] text-carbon bg-maiz border-[3px] border-negro py-3.5 px-5 hover:bg-lima transition-colors uppercase tracking-wider">Estudio IA ▸</a>
        </div>

        {/* visor 3D destacado */}
        <div ref={visorRef}>
          <Plate3D glbUrl={glbSel.url} label={glbSel.label} />
        </div>

        {/* categorías */}
        <div className="flex gap-2 flex-wrap mt-10">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`font-press-start text-[9px] px-4 py-3 border-2 tracking-wider transition-colors ${c === cat ? 'bg-lima text-carbon border-lima' : 'bg-transparent text-crema/70 border-crema/25 hover:border-lima'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* platos */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {platos.map((p) => (
            <div key={p.id} className={`border-[3px] border-carbon bg-carbon overflow-hidden flex flex-col ${p.no ? 'opacity-60' : ''}`}>
              <div className="relative aspect-[5/4] bg-black">
                <img src={IMG[p.img]} alt={p.n} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                {p.glb && !p.no && (
                  <button onClick={() => verEn3D(p)} className="absolute bottom-2 right-2 font-press-start text-[8px] bg-lima text-carbon px-2.5 py-1.5 border-2 border-carbon tracking-wider cursor-pointer">VER 3D ▸</button>
                )}
                {p.no && <span className="absolute top-2 left-2 font-press-start text-[8px] bg-brasa text-white px-2 py-1.5 tracking-wider">AGOTADO</span>}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-press-start text-[11px] text-lima leading-snug uppercase">{p.n}</h3>
                  <span className="font-mono font-bold text-crema whitespace-nowrap">Bs {p.p}</span>
                </div>
                <p className="text-sm text-crema/70 mt-2 flex-1">{p.d}</p>
                <button onClick={() => add(p)} disabled={p.no}
                  className="mt-3 font-press-start text-[9px] text-carbon bg-lima border-2 border-carbon py-3 uppercase tracking-wider disabled:bg-crema/20 disabled:text-crema/50 cursor-pointer disabled:cursor-not-allowed">
                  {p.no ? 'Agotado' : 'Agregar ▸'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* bebidas */}
        {bebidas.length > 0 && (
          <div className="mt-6 border-[3px] border-carbon bg-carbon">
            {bebidas.map((b) => (
              <div key={b.n} className="flex justify-between items-center px-4 py-3.5 border-b border-crema/10 last:border-b-0">
                <div><b className="text-crema">{b.n}</b> <span className="text-crema/50 text-sm">— {b.s}</span></div>
                <span className="font-mono font-bold text-lima">Bs {b.p}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* carrito flotante */}
      {lineas.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[65] w-[92%] max-w-md border-[3px] border-lima bg-carbon shadow-[6px_6px_0_var(--color-azul)]">
          <div className="bg-lima text-carbon font-press-start text-[9px] px-3 py-2.5 flex justify-between tracking-wide"><span>▸ TU PEDIDO</span><span>TOTAL Bs {total}</span></div>
          <div className="p-3 max-h-48 overflow-y-auto">
            {lineas.map((l) => (
              <div key={l.p.id} className="flex justify-between items-center py-1.5 text-sm">
                <span className="text-crema/85">{l.q}× {l.p.n}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-crema/70">Bs {l.sub}</span>
                  <button onClick={() => quitar(l.p.id)} className="font-press-start text-[10px] text-brasa px-2 cursor-pointer">−</button>
                </span>
              </div>
            ))}
          </div>
          <button onClick={pedirWhatsApp} className="w-full font-press-start text-[10px] text-carbon bg-lima border-t-[3px] border-carbon py-4 uppercase tracking-widest cursor-pointer">Pedir por WhatsApp ▸</button>
        </div>
      )}
    </section>
  );
}
