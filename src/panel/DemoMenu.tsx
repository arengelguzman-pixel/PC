import { useEffect, useRef, useState } from 'react';
import LogoMeza from '../components/LogoMeza';
import { PLATOS, IMG, GLB, type Plato } from '../config';
import { LOOKS, TPLS, paletaVars, type LookKey, type TplKey } from '../lib/carta';
import Plate3D from '../components/Plate3D';
import CierreCaja, { resumir, type Cobro } from './afiliado/CierreCaja';
import type { Cierre } from '../lib/pedidos';

// Menú con 2 pestañas:
//  · COCINA/ADMIN → ve los pedidos, decide platos disponibles, gestiona mesas,
//    personaliza el diseño (mosaicos) y carga los datos del negocio.
//  · CLIENTE (tras escanear el QR de su mesa) → menú minimalista y moderno donde
//    ordena; ve precios y qué está agotado. Sus pedidos llegan a la cocina.

const TIPOS = ['Comida rápida', 'Comida cruceña', 'Pollos a la brasa', 'Almuerzos', 'Pizzería'];
const MESAS = [1, 2, 3, 4, 5, 6];

type Estado = 'nuevo' | 'preparando' | 'listo' | 'entregado';
type Item = { id: number; n: string; p: number; q: number };
type Ticket = { id: number; mesa: number; items: Item[]; total: number; estado: Estado; nacido: number };
const ET: Record<Estado, string> = { nuevo: 'NUEVA', preparando: 'EN COCINA', listo: 'LISTO', entregado: 'ENTREGADO' };
const colorEstado = (e: Estado) => e === 'nuevo' ? 'bg-maiz text-negro' : e === 'preparando' ? 'bg-azul text-white' : e === 'listo' ? 'bg-lima text-negro' : 'bg-crema/30 text-crema';

function arreglarLogo(im: HTMLImageElement): string {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d')!, l = Math.min(im.naturalWidth, im.naturalHeight);
  x.save(); x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); x.clip();
  x.imageSmoothingQuality = 'high';
  try { x.filter = 'contrast(1.14) saturate(1.25) brightness(1.06)'; } catch { /* */ }
  x.drawImage(im, (im.naturalWidth - l) / 2, (im.naturalHeight - l) / 2, l, l, 0, 0, S, S);
  x.restore(); return c.toDataURL('image/png');
}
function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC(); const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); g.gain.value = 0.06; o.type = 'square';
    o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.24); setTimeout(() => ctx.close(), 400);
  } catch { /* */ }
}

export default function DemoMenu() {
  const [vista, setVista] = useState<'admin' | 'cliente'>('cliente');
  const [adminTab, setAdminTab] = useState<'pedidos' | 'caja' | 'platos' | 'mesas' | 'diseno' | 'negocio'>('pedidos');
  // cierre de caja del demo: cada pedido entregado cuenta como cobrado en efectivo; se guarda en este navegador
  const [cierres, setCierres] = useState<Cierre[]>(() => { try { return JSON.parse(localStorage.getItem('meza_demo_cierres') || '[]'); } catch { return []; } });
  const [cerradoHasta, setCerradoHasta] = useState<number>(() => { try { return Number(localStorage.getItem('meza_demo_cierre_desde') || 0); } catch { return 0; } });

  const [negocio, setNegocio] = useState({ nombre: 'Doña Elsa', tipo: TIPOS[1], logo: '' });
  const [look, setLook] = useState<LookKey>('brasa');
  const [tpl, setTpl] = useState<TplKey>('vitrina');
  const [noDisp, setNoDisp] = useState<number[]>([]);
  const [mesaCliente, setMesaCliente] = useState(1);
  const [carrito, setCarrito] = useState<Record<number, number>>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [alerta, setAlerta] = useState('');
  const [sonido, setSonido] = useState(true);
  const [, setTick] = useState(0);
  const idRef = useRef(1);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = window.setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  const agotado = (id: number) => noDisp.includes(id);
  const toggleDisp = (id: number) => setNoDisp((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const add = (p: Plato) => { if (!agotado(p.id)) setCarrito((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 })); };
  const quitar = (id: number) => setCarrito((c) => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const lineas = Object.entries(carrito).map(([id, q]) => { const p = PLATOS.find((x) => x.id === +id)!; return { p, q, sub: p.p * q }; });
  const total = lineas.reduce((a, l) => a + l.sub, 0);

  const hacerPedido = () => {
    if (!lineas.length) return;
    const t: Ticket = { id: idRef.current++, mesa: mesaCliente, items: lineas.map((l) => ({ id: l.p.id, n: l.p.n, p: l.p.p, q: l.q })), total, estado: 'nuevo', nacido: Date.now() };
    setTickets((prev) => [...prev, t]);
    setCarrito({});
    setAlerta(`🔔 ¡NUEVA COMANDA! Mesa ${t.mesa} · ${t.items.reduce((a, i) => a + i.q, 0)} platos · Bs ${t.total}`);
    if (sonido) beep();
    window.setTimeout(() => setAlerta(''), 4200);
  };
  const avanzar = (id: number) => setTickets((prev) => prev.map((k) => k.id === id ? { ...k, estado: (k.estado === 'nuevo' ? 'preparando' : k.estado === 'preparando' ? 'listo' : 'entregado') as Estado, nacido: Date.now() } : k));
  const liberarMesa = (m: number) => setTickets((prev) => prev.filter((k) => k.mesa !== m));

  const subirLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); setNegocio((n) => ({ ...n, logo: arreglarLogo(im) })); };
    im.src = url;
  };

  const enCurso = tickets.filter((k) => k.estado !== 'entregado');
  const nuevas = tickets.filter((k) => k.estado === 'nuevo').length;
  const cobros: Cobro[] = tickets.filter((k) => k.estado === 'entregado' && k.nacido > cerradoHasta)
    .map((k) => ({ id: `P-${String(k.id).padStart(3, '0')}`, total: k.total, metodo: 'efectivo' as const, items: k.items.map((i) => ({ n: i.n, q: i.q, p: i.p })), en: k.nacido }));
  const cerrarCajaDemo = async (contado: number | null, nota: string) => {
    const r = resumir(cobros); const hasta = Date.now();
    const c: Cierre = { id: `Z-${String(cierres.length + 1).padStart(3, '0')}`, desde: cerradoHasta, hasta, ...r, efectivoContado: contado, diferencia: contado === null ? null : Math.round((contado - r.efectivo) * 100) / 100, nota };
    const lista = [c, ...cierres]; setCierres(lista); setCerradoHasta(hasta);
    try { localStorage.setItem('meza_demo_cierres', JSON.stringify(lista)); localStorage.setItem('meza_demo_cierre_desde', String(hasta)); } catch { /* */ }
    return c;
  };
  const ocupada = (m: number) => tickets.some((k) => k.mesa === m && k.estado !== 'entregado');

  return (
    <div className="min-h-screen bg-negro text-crema">
      {alerta && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-lg bg-maiz text-negro border-[3px] border-negro shadow-[6px_6px_0_var(--color-rojo)] px-4 py-3 font-press-start text-[10px] tracking-wide animate-pulse">{alerta}</div>
      )}

      {/* cabecera + 2 pestañas */}
      <header className="sticky top-0 z-40 bg-carbon border-b-4 border-lima px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <a href="/" aria-label="MEZA"><LogoMeza alto={14} /></a>
        <div className="flex gap-1.5">
          <button onClick={() => setVista('cliente')} className={`font-press-start text-[8px] px-3 py-2.5 border-2 tracking-wider ${vista === 'cliente' ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>Cliente (QR)</button>
          <button onClick={() => setVista('admin')} className={`font-press-start text-[8px] px-3 py-2.5 border-2 tracking-wider ${vista === 'admin' ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>Cocina / Admin{nuevas ? ` · ${nuevas}` : ''}</button>
        </div>
      </header>

      {vista === 'cliente'
        ? <Cliente negocio={negocio} look={look} tpl={tpl} agotado={agotado} lineas={lineas} total={total}
            mesaCliente={mesaCliente} setMesaCliente={setMesaCliente} add={add} quitar={quitar} hacerPedido={hacerPedido} />
        : (
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* sub-nav admin */}
            <div className="flex gap-1.5 flex-wrap mb-6">
              {([['pedidos', 'Pedidos'], ['caja', 'Caja'], ['platos', 'Platos'], ['mesas', 'Mesas'], ['diseno', 'Diseño'], ['negocio', 'Negocio']] as const).map(([k, t]) => (
                <button key={k} onClick={() => setAdminTab(k)} className={`font-press-start text-[8px] px-3 py-2.5 border-2 tracking-wider ${adminTab === k ? 'bg-maiz text-negro border-maiz' : 'text-crema/70 border-crema/25'}`}>{t}{k === 'pedidos' && nuevas ? ` ·${nuevas}` : ''}</button>
              ))}
            </div>

            {adminTab === 'pedidos' && (
              <section>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-press-start text-[11px] text-lima uppercase tracking-wide">Pantalla de cocina</h2>
                  <div className="flex items-center gap-2">
                    <span className={`font-press-start text-[8px] px-2 py-1.5 tracking-wider ${nuevas ? 'bg-maiz text-negro animate-pulse' : 'bg-crema/15 text-crema/60'}`}>{nuevas} NUEVA(S)</span>
                    <button onClick={() => setSonido((s) => !s)} className="font-press-start text-[8px] text-crema/70 border-2 border-crema/25 px-2.5 py-1.5 uppercase tracking-wider">Sonido {sonido ? 'ON' : 'OFF'}</button>
                  </div>
                </div>
                <p className="text-sm text-crema/60 mt-2">Cuando una mesa ordena llega la comanda con alerta (banner + bip + contador). Toca para avanzar.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  {enCurso.length === 0 && <p className="text-crema/40 text-sm font-mono py-8 text-center col-span-full">sin comandas — pide desde la pestaña Cliente</p>}
                  {enCurso.map((k) => (
                    <div key={k.id} className={`border-2 p-3 ${k.estado === 'nuevo' ? 'border-maiz' : 'border-crema/15'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-press-start text-[10px] text-crema">MESA {k.mesa}</span>
                        <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${colorEstado(k.estado)}`}>{ET[k.estado]}</span>
                      </div>
                      <ul className="mt-2 font-mono text-xs text-crema/80 leading-relaxed">{k.items.map((it, i) => <li key={i}>{it.q}× {it.n}</li>)}</ul>
                      <button onClick={() => avanzar(k.id)} className={`mt-2 w-full font-press-start text-[8px] py-2 border-2 uppercase tracking-wider ${k.estado === 'listo' ? 'text-crema border-crema/30' : 'text-negro bg-lima border-negro'}`}>{k.estado === 'nuevo' ? 'Empezar ▸' : k.estado === 'preparando' ? 'Marcar listo ▸' : 'Entregar ▸'}</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {adminTab === 'caja' && (
              <section>
                <h2 className="font-press-start text-[11px] text-lima uppercase tracking-wide">Caja y cierre del día</h2>
                <p className="text-sm text-crema/60 mt-2">Las ventas del turno se suman solas. Al final del día tocas “Cerrar caja”, cuentas el efectivo y queda el balance guardado. En este demo, cada pedido entregado cuenta como cobrado en efectivo.</p>
                <CierreCaja nombre={negocio.nombre} desde={cerradoHasta} cobros={cobros} cierres={cierres} onCerrar={cerrarCajaDemo} />
              </section>
            )}

            {adminTab === 'platos' && (
              <section>
                <h2 className="font-press-start text-[11px] text-lima uppercase tracking-wide">Disponibilidad de platos</h2>
                <p className="text-sm text-crema/60 mt-2">Marca lo que se acabó — el cliente lo ve al instante y no puede pedirlo.</p>
                <div className="flex flex-col gap-2.5 mt-4">
                  {PLATOS.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 border-2 border-crema/20 bg-carbon p-2.5">
                      <img src={IMG[p.img]} alt="" className="w-14 h-14 object-cover shrink-0" />
                      <div className="flex-1 min-w-0"><div className="text-sm text-crema truncate">{p.n}</div><div className="font-mono text-lima text-sm">Bs {p.p}</div></div>
                      <button onClick={() => toggleDisp(p.id)} className={`font-press-start text-[8px] px-3 py-2.5 border-2 tracking-wider shrink-0 ${agotado(p.id) ? 'text-brasa border-brasa' : 'text-lima border-lima'}`}>{agotado(p.id) ? 'Se acabó' : 'Hay'}</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {adminTab === 'mesas' && (
              <section>
                <h2 className="font-press-start text-[11px] text-lima uppercase tracking-wide">Gestión de mesas</h2>
                <p className="text-sm text-crema/60 mt-2">Cada mesa tiene su QR. Aquí ves cuáles tienen pedido activo y puedes liberarlas.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {MESAS.map((m) => (
                    <div key={m} className={`border-2 p-4 ${ocupada(m) ? 'border-rojo bg-rojo/15' : 'border-crema/20'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-press-start text-[12px] text-crema">MESA {m}</span>
                        <span className={`font-mono text-[11px] ${ocupada(m) ? 'text-maiz' : 'text-crema/40'}`}>{ocupada(m) ? '● ocupada' : 'libre'}</span>
                      </div>
                      <button onClick={() => setMesaCliente(m)} className="mt-3 w-full font-press-start text-[7px] text-crema/70 border-2 border-crema/25 py-2 uppercase tracking-wider">Ver QR / abrir mesa</button>
                      {ocupada(m) && <button onClick={() => liberarMesa(m)} className="mt-1.5 w-full font-press-start text-[7px] text-brasa border-2 border-brasa/40 py-2 uppercase tracking-wider">Liberar</button>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {adminTab === 'diseno' && (
              <section>
                <h2 className="font-press-start text-[11px] text-lima uppercase tracking-wide">Diseño del menú</h2>
                <p className="text-sm text-crema/60 mt-2">Elige el look (paleta + letra) y el mosaico. Así lo verá el cliente.</p>
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  {LOOKS.map((L) => (
                    <button key={L.k} onClick={() => { setLook(L.k); setTpl(L.tpl); }} className={`text-left border-2 overflow-hidden ${L.k === look ? 'border-lima' : 'border-crema/25'}`}>
                      <span className="flex h-10">{L.c.map((x, i) => <i key={i} className="flex-1" style={{ background: x }} />)}</span>
                      <span className="block p-2.5"><b className={`block font-press-start text-[9px] ${L.k === look ? 'text-lima' : 'text-crema'}`}>{L.t}</b><span className="block text-[11px] text-crema/60 mt-1">{L.s}</span></span>
                    </button>
                  ))}
                </div>
                <p className="font-press-start text-[8px] text-crema/60 tracking-widest uppercase mt-6 mb-2">Mosaico</p>
                <div className="flex gap-2 flex-wrap">
                  {TPLS.map((t) => <button key={t.k} onClick={() => setTpl(t.k)} className={`font-press-start text-[9px] px-3 py-2.5 border-2 tracking-wider ${t.k === tpl ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>{t.t}</button>)}
                </div>
              </section>
            )}

            {adminTab === 'negocio' && (
              <section>
                <h2 className="font-press-start text-[11px] text-lima uppercase tracking-wide">Datos del negocio</h2>
                <div className="grid sm:grid-cols-[1fr_auto] gap-5 mt-4 items-start">
                  <div className="space-y-3">
                    <div><label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Nombre</label>
                      <input value={negocio.nombre} onChange={(e) => setNegocio((n) => ({ ...n, nombre: e.target.value }))} className="w-full bg-carbon border-2 border-crema/30 focus:border-lima outline-none text-crema p-3.5" /></div>
                    <div><label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Qué vende</label>
                      <div className="flex gap-2 flex-wrap">{TIPOS.map((t) => <button key={t} onClick={() => setNegocio((n) => ({ ...n, tipo: t }))} className={`text-sm px-3 py-2.5 border-2 ${t === negocio.tipo ? 'bg-carbon text-lima border-lima' : 'bg-black/20 text-crema/70 border-crema/25'}`}>{t}</button>)}</div></div>
                  </div>
                  <div className="text-center">
                    <label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Foto de perfil</label>
                    <div className="w-28 h-28 rounded-full border-[3px] border-lima overflow-hidden grid place-items-center bg-carbon mx-auto">
                      {negocio.logo ? <img src={negocio.logo} alt="logo" className="w-full h-full object-cover" /> : <span className="text-crema/40 text-3xl">◧</span>}
                    </div>
                    {negocio.logo && <p className="font-press-start text-[7px] text-lima mt-2 tracking-wider">✨ ARREGLADA</p>}
                    <input ref={logoInput} type="file" accept="image/*" hidden onChange={subirLogo} />
                    <button onClick={() => logoInput.current?.click()} className="mt-2 font-press-start text-[8px] text-carbon bg-maiz border-2 border-negro py-2.5 px-4 uppercase tracking-wider hover:bg-lima transition-colors">Subir logo ▸</button>
                  </div>
                </div>
                <p className="text-sm text-crema/55 mt-3">La foto se recorta redonda y se le realza luz y color para el perfil.</p>
              </section>
            )}
          </div>
        )}
    </div>
  );
}

// ---- Vista del cliente: minimalista, temeada por el look ----
function Cliente({ negocio, look, tpl, agotado, lineas, total, mesaCliente, setMesaCliente, add, quitar, hacerPedido }: {
  negocio: { nombre: string; tipo: string; logo: string }; look: LookKey; tpl: TplKey;
  agotado: (id: number) => boolean; lineas: { p: Plato; q: number; sub: number }[]; total: number;
  mesaCliente: number; setMesaCliente: (m: number) => void;
  add: (p: Plato) => void; quitar: (id: number) => void; hacerPedido: () => void;
}) {
  const vars = paletaVars(look, '');
  const grid = tpl === 'mosaico' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3';
  const [ver3d, setVer3d] = useState<{ url: string; label: string } | null>(null);
  return (
    <div style={{ ...vars, background: 'var(--fondo)', color: 'var(--cunape)' }} className="min-h-[calc(100vh-56px)]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-28">
        {/* aviso de QR */}
        <div className="text-center text-xs mb-4" style={{ color: 'var(--tenue)' }}>
          Escaneaste el QR de la <b style={{ color: 'var(--brasa)' }}>Mesa {mesaCliente}</b> ·{' '}
          <select value={mesaCliente} onChange={(e) => setMesaCliente(+e.target.value)} className="bg-transparent underline" style={{ color: 'var(--brasa)' }}>
            {MESAS.map((m) => <option key={m} value={m} style={{ color: '#000' }}>cambiar a Mesa {m}</option>)}
          </select>
        </div>
        {/* cabecera negocio */}
        <div className="flex items-center gap-3">
          {negocio.logo
            ? <img src={negocio.logo} alt="" className="w-14 h-14 rounded-full object-cover" style={{ border: '2px solid var(--ceniza)' }} />
            : <div className="w-14 h-14 rounded-full grid place-items-center font-bold" style={{ background: 'var(--brasa)', color: '#fff' }}>{negocio.nombre.slice(0, 2).toUpperCase()}</div>}
          <div><div className="text-2xl font-bold leading-tight" style={{ fontFamily: 'var(--font-body)' }}>{negocio.nombre}</div>
            <div className="text-sm" style={{ color: 'var(--txt2)' }}>{negocio.tipo} · Montero</div></div>
        </div>

        {/* platos */}
        <div className={`mt-6 ${grid}`}>
          {PLATOS.map((p) => {
            const no = agotado(p.id);
            if (tpl === 'clasica') {
              return (
                <div key={p.id} className="flex items-baseline gap-2 py-2" style={{ borderBottom: '1px dotted var(--ceniza)', opacity: no ? 0.45 : 1 }}>
                  <b className="font-medium" style={{ fontFamily: 'var(--font-body)' }}>{p.n}</b>
                  <span className="flex-1 border-b border-dotted self-end mb-1" style={{ borderColor: 'var(--tenue)' }} />
                  {p.glb && <button onClick={() => setVer3d({ url: GLB[p.glb!], label: p.n })} className="text-[11px] font-bold px-2 py-1 rounded-full mr-1" style={{ border: '1px solid var(--tenue)', color: 'var(--cunape)' }}>◈ 3D</button>}
                  {no ? <span className="text-xs font-bold" style={{ color: 'var(--brasa)' }}>AGOTADO</span>
                      : <><span className="font-mono font-bold" style={{ color: 'var(--maiz)' }}>Bs {p.p}</span>
                          <button onClick={() => add(p)} className="ml-2 w-7 h-7 rounded-full text-lg leading-none" style={{ background: 'var(--brasa)', color: '#fff' }}>+</button></>}
                </div>
              );
            }
            const foto = IMG[p.img];
            const ratio = tpl === 'panorama' ? 'aspect-video' : tpl === 'mosaico' ? 'aspect-square' : 'aspect-[5/4]';
            const lista = tpl === 'lista';
            return (
              <div key={p.id} className={lista ? 'flex items-center gap-3 overflow-hidden' : 'overflow-hidden'} style={{ background: 'var(--humo)', borderRadius: 14, opacity: no ? 0.55 : 1 }}>
                <div className={`relative ${lista ? 'w-24 h-24 shrink-0' : ratio}`}>
                  <img src={foto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  {no && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1" style={{ background: 'var(--brasa)', color: '#fff' }}>AGOTADO</span>}
                </div>
                <div className="p-3 flex-1 min-w-0">
                  <b className="block font-medium leading-tight" style={{ fontFamily: 'var(--font-body)' }}>{p.n}</b>
                  {!lista && <span className="block text-xs mt-1" style={{ color: 'var(--txt2)' }}>{p.d}</span>}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="font-mono font-bold" style={{ color: 'var(--maiz)' }}>{no ? '—' : `Bs ${p.p}`}</span>
                    <div className="flex items-center gap-2">
                      {p.glb && <button onClick={() => setVer3d({ url: GLB[p.glb!], label: p.n })} className="text-xs font-bold px-2.5 py-1.5 rounded-full" style={{ border: '1px solid var(--tenue)', color: 'var(--cunape)' }}>◈ 3D</button>}
                      {!no && <button onClick={() => add(p)} className="font-bold text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--brasa)', color: '#fff' }}>Agregar +</button>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* carrito fijo del cliente */}
      {lineas.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30" style={{ background: 'var(--carbon)', borderTop: '3px solid var(--brasa)' }}>
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="max-h-28 overflow-y-auto">
              {lineas.map((l) => (
                <div key={l.p.id} className="flex justify-between items-center py-1 text-sm">
                  <span style={{ color: 'var(--cunape)' }}>{l.q}× {l.p.n}</span>
                  <span className="flex items-center gap-2"><span className="font-mono" style={{ color: 'var(--txt2)' }}>Bs {l.sub}</span>
                    <button onClick={() => quitar(l.p.id)} className="w-6 h-6 rounded-full" style={{ background: 'var(--humo)', color: 'var(--cunape)' }}>−</button></span>
                </div>
              ))}
            </div>
            <button onClick={hacerPedido} className="mt-2 w-full py-4 rounded-xl font-bold text-lg" style={{ background: 'var(--brasa)', color: '#fff' }}>Hacer mi pedido · Bs {total}</button>
          </div>
        </div>
      )}

      {/* visor 3D del plato (girar con el dedo) */}
      {ver3d && (
        <div className="fixed inset-0 z-[80] bg-black/85 grid place-items-center p-5" onClick={() => setVer3d(null)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-press-start text-[10px] text-lima">{ver3d.label}</span>
              <button onClick={() => setVer3d(null)} className="font-press-start text-[12px] text-crema/70 hover:text-brasa">[X]</button>
            </div>
            <Plate3D key={ver3d.url} glbUrl={ver3d.url} label={ver3d.label.toUpperCase().replace(/\s+/g, '_')} />
            <p className="text-center text-crema/60 text-xs mt-2 font-mono">arrástralo para girar · pellizca para acercar</p>
          </div>
        </div>
      )}
    </div>
  );
}
