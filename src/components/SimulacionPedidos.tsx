import { useEffect, useRef, useState } from 'react';
import { PLATOS } from '../config';

// Simulación en vivo de la operación del local: las mesas piden, la cocina
// recibe los tickets y avanza los estados, y el cliente ve su pedido en tiempo
// real. Todo es una demostración (temporizadores), sin backend.

type Estado = 'nuevo' | 'preparando' | 'listo' | 'entregado';
type Pedido = { id: number; mesa: number; items: { n: string; q: number }[]; total: number; estado: Estado; cambio: number };

const MESAS = [1, 2, 3, 4, 5, 6];
const DUR: Record<Estado, number> = { nuevo: 5000, preparando: 9000, listo: 6000, entregado: 4000 };
const SIG: Record<Estado, Estado | null> = { nuevo: 'preparando', preparando: 'listo', listo: 'entregado', entregado: null };
const ET: Record<Estado, string> = { nuevo: 'NUEVO', preparando: 'EN COCINA', listo: 'LISTO ▸ LLEVAR', entregado: 'ENTREGADO' };
const PASOS: Estado[] = ['nuevo', 'preparando', 'listo', 'entregado'];

const colorEstado = (e: Estado) =>
  e === 'nuevo' ? 'bg-maiz text-negro' : e === 'preparando' ? 'bg-azul text-white' : e === 'listo' ? 'bg-lima text-negro' : 'bg-crema/30 text-crema';

function crear(id: number, mesa: number): Pedido {
  const n = 1 + Math.floor(Math.random() * 2);
  const elegidos = Array.from({ length: n }, () => PLATOS[Math.floor(Math.random() * PLATOS.length)]);
  const mapa = new Map<string, { n: string; q: number; p: number }>();
  for (const p of elegidos) {
    const prev = mapa.get(p.n);
    if (prev) prev.q++;
    else mapa.set(p.n, { n: p.n, q: 1, p: p.p });
  }
  const items = [...mapa.values()];
  const total = items.reduce((a, it) => a + it.p * it.q, 0);
  return { id, mesa, items: items.map(({ n, q }) => ({ n, q })), total, estado: 'nuevo', cambio: Date.now() };
}

export default function SimulacionPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [, setTick] = useState(0);
  const [mesaSel, setMesaSel] = useState<number | null>(null);
  const idRef = useRef(1);

  useEffect(() => {
    // arranque con un par de pedidos
    setPedidos([crear(idRef.current++, 2), crear(idRef.current++, 5)]);
    const motor = window.setInterval(() => {
      const now = Date.now();
      setPedidos((prev) => {
        // avanzar estados
        let next = prev.map((p) => {
          if (now - p.cambio >= DUR[p.estado]) {
            const s = SIG[p.estado];
            if (s) return { ...p, estado: s, cambio: now };
          }
          return p;
        });
        // quitar entregados vencidos
        next = next.filter((p) => !(p.estado === 'entregado' && now - p.cambio >= DUR.entregado));
        // generar pedido nuevo si hay mesa libre y no hay demasiados
        const activas = new Set(next.map((p) => p.mesa));
        const libres = MESAS.filter((m) => !activas.has(m));
        if (libres.length && next.length < 5 && Math.random() < 0.55) {
          next = [...next, crear(idRef.current++, libres[Math.floor(Math.random() * libres.length)])];
        }
        return next;
      });
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(motor);
  }, []);

  const activos = pedidos.filter((p) => p.estado !== 'entregado');
  const cocina = [...pedidos].sort((a, b) => a.id - b.id);
  const mesaCliente = mesaSel ?? activos[activos.length - 1]?.mesa ?? null;
  const pedidoCliente = pedidos.find((p) => p.mesa === mesaCliente) ?? null;
  const ocupada = (m: number) => pedidos.some((p) => p.mesa === m && p.estado !== 'entregado');

  return (
    <section id="operacion" className="bg-negro/45 py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <span className="font-press-start text-[9px] bg-lima text-negro px-3 py-2 tracking-widest">✱ TU LOCAL EN VIVO</span>
        <h2 className="font-press-start text-maiz text-xl sm:text-3xl md:text-4xl leading-tight mt-5 uppercase" style={{ textShadow: '3px 3px 0 var(--color-rojo)' }}>
          El pedido<br /><span className="text-crema">se arma solo.</span>
        </h2>
        <p className="mt-4 text-crema/85 max-w-xl">El cliente pide desde la mesa, la cocina lo recibe al instante y todos ven el mismo estado en tiempo real. Nadie anota nada en un papel. <span className="text-crema/60">(Demostración en vivo — toca una mesa.)</span></p>

        <div className="grid lg:grid-cols-3 gap-4 mt-8">
          {/* MESAS */}
          <div className="border-[3px] border-carbon bg-carbon/80 p-4">
            <div className="font-press-start text-[10px] text-lima tracking-widest uppercase mb-4">Mesas</div>
            <div className="grid grid-cols-3 gap-2.5">
              {MESAS.map((m) => {
                const on = ocupada(m);
                const sel = m === mesaCliente;
                return (
                  <button key={m} onClick={() => setMesaSel(m)}
                    className={`aspect-square border-2 flex flex-col items-center justify-center transition-colors ${sel ? 'border-lima' : 'border-crema/20'} ${on ? 'bg-rojo text-crema' : 'bg-carbon text-crema/50'}`}>
                    <span className="font-press-start text-[10px]">M{m}</span>
                    <span className="text-[10px] mt-1 font-mono">{on ? '● pidió' : 'libre'}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-crema/50 mt-4 font-mono">{activos.length} mesa(s) con pedido activo</p>
          </div>

          {/* COCINA (KDS) */}
          <div className="border-[3px] border-lima bg-[#0A0605]/85 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-press-start text-[10px] text-lima tracking-widest uppercase">▸ Cocina</span>
              <span className="font-mono text-[10px] text-crema/50">{cocina.filter((p) => p.estado !== 'entregado').length} en curso</span>
            </div>
            <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto">
              {cocina.length === 0 && <p className="text-crema/40 text-sm font-mono py-6 text-center">esperando pedidos…</p>}
              {cocina.map((p) => (
                <div key={p.id} className={`border-2 border-crema/15 p-3 ${p.estado === 'entregado' ? 'opacity-40' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-press-start text-[10px] text-crema">MESA {p.mesa}</span>
                    <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${colorEstado(p.estado)}`}>{ET[p.estado]}</span>
                  </div>
                  <ul className="mt-2 font-mono text-xs text-crema/80 leading-relaxed">
                    {p.items.map((it, i) => <li key={i}>{it.q}× {it.n}</li>)}
                  </ul>
                  <div className="mt-2 h-1.5 bg-crema/10 overflow-hidden">
                    <div className="h-full bg-lima transition-[width] duration-1000" style={{ width: `${Math.min(100, ((Date.now() - p.cambio) / DUR[p.estado]) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLIENTE */}
          <div className="border-[3px] border-carbon bg-carbon/80 p-4">
            <div className="font-press-start text-[10px] text-lima tracking-widest uppercase mb-4">Lo que ve el cliente</div>
            {pedidoCliente ? (
              <div className="border-2 border-crema/15 bg-negro/60 p-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-press-start text-[11px] text-maiz">MESA {pedidoCliente.mesa}</span>
                  <span className="font-mono font-bold text-lima">Bs {pedidoCliente.total}</span>
                </div>
                <ul className="mt-3 font-mono text-sm text-crema/85 leading-relaxed">
                  {pedidoCliente.items.map((it, i) => <li key={i}>{it.q}× {it.n}</li>)}
                </ul>
                {/* stepper de estado */}
                <div className="mt-4 flex gap-1.5">
                  {PASOS.map((s) => {
                    const idx = PASOS.indexOf(pedidoCliente.estado);
                    const hecho = PASOS.indexOf(s) <= idx;
                    return <div key={s} className={`flex-1 h-2 ${hecho ? 'bg-lima' : 'bg-crema/15'}`} />;
                  })}
                </div>
                <p className="font-press-start text-[9px] text-lima mt-3 tracking-wide uppercase">{ET[pedidoCliente.estado]}</p>
                <p className="text-xs text-crema/50 mt-1">
                  {pedidoCliente.estado === 'nuevo' && 'Tu pedido llegó a la cocina.'}
                  {pedidoCliente.estado === 'preparando' && 'Lo están preparando…'}
                  {pedidoCliente.estado === 'listo' && '¡Listo! Ya te lo llevan.'}
                  {pedidoCliente.estado === 'entregado' && '¡Buen provecho! 🍽️'}
                </p>
              </div>
            ) : (
              <p className="text-crema/40 text-sm font-mono py-6 text-center">toca una mesa ocupada<br />para ver su pedido</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
