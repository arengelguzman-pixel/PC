import { useEffect, useMemo, useRef, useState } from 'react';
import type { Afiliado } from '../../afiliados/elGaraje';
import { avanzarCocina, setAgotados, mmss, minutos, type Pedido, type EstadoCocina } from '../../lib/pedidos';
import { beep, Conexion, Foto } from './comunes';

// Vista de Cocina (nuestra tipografía). El estado en vivo (pedidos / agotados)
// llega por props desde el shell; aquí solo se actúa y se avisa:
//  · comanda con alarma insistente hasta tocar "RECIBIDO" (reconocimiento local)
//  · avisos del sistema (Notification) al llegar una comanda nueva
//  · antigüedad viva por comanda y estado del pago
//  · disponibilidad por categoría (Hay / Agotada)

type Filtro = 'todas' | EstadoCocina;

const ET: Record<EstadoCocina, string> = { nuevo: 'NUEVA', preparando: 'EN HORNO', listo: 'LISTA', entregado: 'ENTREGADA' };
const SIG: Record<EstadoCocina, EstadoCocina> = { nuevo: 'preparando', preparando: 'listo', listo: 'entregado', entregado: 'entregado' };
const ACCION: Record<EstadoCocina, string> = { nuevo: 'Al horno ▸', preparando: 'Lista ▸', listo: 'Entregar ▸', entregado: '' };
const VACIO: Record<Filtro, string> = {
  todas: 'sin comandas — llegan aquí cuando un cliente pide',
  nuevo: 'no hay comandas nuevas',
  preparando: 'nada en el horno',
  listo: 'nada listo para entregar',
  entregado: 'todavía no se entregó nada',
};
const colorEstado = (e: EstadoCocina) => e === 'nuevo' ? 'bg-maiz text-negro' : e === 'preparando' ? 'bg-azul text-white' : e === 'listo' ? 'bg-lima text-negro' : 'bg-crema/25 text-crema';

// pago: texto + clases del badge
function badgePago(p: Pedido): [string, string] {
  if (p.pago === 'confirmado') return [p.metodo === 'qr' ? 'QR ✓ pagado' : '✓ pagado', 'bg-lima text-negro'];
  if (p.pago === 'rechazado') return ['Rechazado', 'bg-brasa text-negro'];
  if (p.pago === 'por_confirmar') return ['QR · por confirmar', 'bg-maiz text-negro'];
  if (p.metodo === 'qr') return ['QR · sin comprobante', 'bg-crema/10 text-crema/60'];
  return ['Efectivo · cobrar en caja', 'bg-crema/10 text-crema/60'];
}
const resumen = (p: Pedido) => `${p.items.map((l) => `${l.q}× ${l.n}${l.tamT ? ` ${l.tamT}` : ''}`).join(' · ')} — Bs ${p.total}`.slice(0, 140);

// comandas reconocidas en ESTE dispositivo
const kAck = (local: string) => `pv_ack_${local}`;
const leerAcks = (local: string): string[] => { try { return JSON.parse(localStorage.getItem(kAck(local)) || '[]'); } catch { return []; } };
const guardarAcks = (local: string, ids: string[]) => { try { localStorage.setItem(kAck(local), JSON.stringify(ids.slice(-300))); } catch { /* */ } };

export default function Cocina({ data, pedidos, agotados, clave, conectado, salir }: {
  data: Afiliado; pedidos: Pedido[]; agotados: string[]; clave: string; conectado: boolean; salir: () => void;
}) {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [sonido, setSonido] = useState(true);
  const [acks, setAcks] = useState<string[]>(() => leerAcks(data.local));
  const [locales, setLocales] = useState<Record<string, Pedido>>({});     // respuestas optimistas de avanzar
  const [agotOpt, setAgotOpt] = useState<string[] | null>(null);          // disponibilidad optimista
  const [ocupado, setOcupado] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<{ msg: string; claveMala: boolean } | null>(null);
  const [permiso, setPermiso] = useState<NotificationPermission | 'no'>(() => ('Notification' in window ? Notification.permission : 'no'));
  const [, setTick] = useState(0);
  const vistos = useRef<Set<string> | null>(null);
  const tonoAlto = useRef(false);

  // reloj vivo para los mm:ss
  useEffect(() => { const t = window.setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  // las props mandan: cuando llega la lista real de agotados soltamos la optimista
  useEffect(() => { setAgotOpt(null); }, [agotados]);

  // pedido más reciente entre la prop y la respuesta optimista
  const lista = useMemo(() => pedidos.map((p) => { const l = locales[p.id]; return l && l.actualizado > p.actualizado ? l : p; }), [pedidos, locales]);
  const pendientes = useMemo(() => lista.filter((p) => p.cocina === 'nuevo' && !acks.includes(p.id)), [lista, acks]);
  const nPend = pendientes.length;
  const ultima = pendientes[0];

  const reconocer = (id: string) => setAcks((a) => { if (a.includes(id)) return a; const n = [...a, id]; guardarAcks(data.local, n); return n; });

  // alarma: bip alternado cada 4 s + vibración mientras haya comandas sin reconocer
  useEffect(() => {
    if (!nPend || !sonido) return;
    const sonar = () => {
      tonoAlto.current = !tonoAlto.current;
      beep(tonoAlto.current ? 1320 : 880);
      try { navigator.vibrate?.([200, 100, 200]); } catch { /* sin vibración */ }
    };
    sonar();
    const t = window.setInterval(sonar, 4000);
    return () => clearInterval(t);
  }, [nPend, sonido]);

  // título parpadeando mientras haya comandas sin reconocer
  useEffect(() => {
    if (!nPend) return;
    const normal = document.title;
    const aviso = `(${nPend}) NUEVA COMANDA`;
    let alt = true;
    document.title = aviso;
    const t = window.setInterval(() => { alt = !alt; document.title = alt ? aviso : normal; }, 1000);
    return () => { clearInterval(t); document.title = normal; };
  }, [nPend]);

  // avisos del sistema: solo para ids nunca vistos y recién creados (lo viejo no avisa)
  useEffect(() => {
    if (!vistos.current) { vistos.current = new Set(pedidos.map((p) => p.id)); return; }
    const ahora = Date.now();
    for (const p of pedidos) {
      if (vistos.current.has(p.id)) continue;
      vistos.current.add(p.id);
      if (p.cocina !== 'nuevo' || ahora - p.creado > 120000 || permiso !== 'granted') continue;
      try { new Notification(`Nueva comanda · ${p.mesa ? `Mesa ${p.mesa}` : p.id}`, { body: resumen(p), tag: p.id }); } catch { /* sin avisos */ }
    }
  }, [pedidos, permiso]);

  const activarAvisos = async () => {
    try { const r = await Notification.requestPermission(); setPermiso(r ?? Notification.permission); } catch { /* */ }
  };

  const fallo = (r: { msg?: string; causa?: string }, porDefecto: string) =>
    setError({ msg: r.msg || porDefecto, claveMala: r.causa === 'clave_mala' });

  const avanzar = async (p: Pedido) => {
    if (ocupado[p.id] || p.cocina === 'entregado') return;
    setOcupado((o) => ({ ...o, [p.id]: true }));
    const r = await avanzarCocina(data.local, p.id, clave, SIG[p.cocina]);
    setOcupado((o) => ({ ...o, [p.id]: false }));
    if (!r.ok) return fallo(r, 'No se pudo actualizar la comanda.');
    reconocer(p.id);
    setLocales((l) => ({ ...l, [p.id]: r.pedido }));
  };

  const agotVista = agotOpt ?? agotados;
  const alternar = async (slug: string) => {
    const nueva = agotVista.includes(slug) ? agotVista.filter((s) => s !== slug) : [...agotVista, slug];
    setAgotOpt(nueva);
    const r = await setAgotados(data.local, clave, nueva);
    if (!r.ok) { setAgotOpt(null); fallo(r, 'No se pudo cambiar la disponibilidad.'); }
  };

  const now = Date.now();
  const visibles = lista.filter((p) => filtro === 'todas' ? p.cocina !== 'entregado' : p.cocina === filtro);
  const entregadas = lista.filter((p) => p.cocina === 'entregado').length;
  const soportaAvisos = 'Notification' in window;

  return (
    <div className="min-h-screen bg-negro text-crema">
      {/* banner fijo: última comanda sin reconocer */}
      {ultima && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[95] w-[94%] max-w-lg bg-maiz text-negro border-[3px] border-negro shadow-[6px_6px_0_var(--color-rojo)] px-4 py-3 flex items-center gap-3">
          <p className="font-press-start text-[9px] leading-relaxed tracking-wide flex-1 min-w-0">
            🔔 NUEVA COMANDA · {ultima.id}{ultima.mesa ? ` · MESA ${ultima.mesa}` : ''} · Bs {ultima.total}{nPend > 1 ? ` · +${nPend - 1} más` : ''}
          </p>
          <button onClick={() => reconocer(ultima.id)} className="font-press-start text-[8px] bg-negro text-maiz px-3 py-2.5 shrink-0 uppercase tracking-wider">Recibido ✓</button>
        </div>
      )}

      {/* error en palabras normales */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] w-[94%] max-w-lg bg-carbon border-[3px] border-brasa px-4 py-3 flex items-center gap-3 flex-wrap">
          <p className="text-sm text-crema flex-1 min-w-[12rem]">{error.msg}</p>
          {error.claveMala && <button onClick={salir} className="font-press-start text-[8px] text-negro bg-brasa px-3 py-2 uppercase tracking-wider">Salir</button>}
          <button onClick={() => setError(null)} className="font-press-start text-[8px] text-crema/70 border-2 border-crema/25 px-3 py-2 uppercase tracking-wider">Cerrar</button>
        </div>
      )}

      <div className={`max-w-5xl mx-auto px-4 pb-12 ${ultima ? 'pt-20' : 'pt-6'}`}>
        {/* cabecera */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className="font-press-start text-[12px] text-maiz uppercase tracking-wide" style={{ textShadow: '2px 2px 0 var(--color-rojo)' }}>Cocina · {data.nombre}</h1>
            <div className="mt-2"><Conexion ok={conectado} /></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-press-start text-[8px] px-2 py-1.5 tracking-wider ${nPend ? 'bg-maiz text-negro animate-pulse' : 'bg-crema/15 text-crema/60'}`}>{nPend} NUEVA(S)</span>
            <button onClick={() => setSonido((s) => { if (!s) beep(880); return !s; })} className={`font-press-start text-[8px] border-2 px-2.5 py-1.5 uppercase tracking-wider ${sonido ? 'text-lima border-lima' : 'text-crema/70 border-crema/25'}`}>Sonido {sonido ? 'ON' : 'OFF'}</button>
            {soportaAvisos && permiso === 'default' && <button onClick={activarAvisos} className="font-press-start text-[8px] text-crema/70 border-2 border-crema/25 px-2.5 py-1.5 uppercase tracking-wider">Activar avisos</button>}
            {soportaAvisos && permiso === 'granted' && <span className="font-mono text-[10px] text-lima">avisos ✓</span>}
            {soportaAvisos && permiso === 'denied' && <span className="font-mono text-[10px] text-crema/40">avisos bloqueados</span>}
            <button onClick={salir} className="font-press-start text-[8px] text-crema/70 border-2 border-crema/25 px-2.5 py-1.5 uppercase tracking-wider">Salir</button>
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
          {visibles.length === 0 && <p className="text-crema/40 text-sm font-mono py-10 text-center col-span-full">{VACIO[filtro]}</p>}
          {visibles.map((p) => {
            const pend = p.cocina === 'nuevo' && !acks.includes(p.id);
            const activa = p.cocina !== 'entregado';
            const edad = minutos(now - p.creado);
            const tarde = activa && edad > 15, demora = activa && edad >= 8 && edad <= 15;
            const marco = pend || demora ? 'border-maiz' : tarde ? 'border-rojo' : 'border-crema/15';
            const colorT = !activa ? 'text-crema/40' : tarde ? 'text-rojo' : demora ? 'text-maiz' : 'text-crema/60';
            const [tPago, cPago] = badgePago(p);
            return (
              <div key={p.id} className={`relative border-2 p-3 ${marco}`}>
                {pend && <div className="absolute -inset-0.5 border-[3px] border-maiz animate-pulse pointer-events-none" />}
                <div className="flex justify-between items-center gap-2">
                  <span className="font-press-start text-[10px] text-crema">{p.id}{p.mesa ? ` · MESA ${p.mesa}` : ''}</span>
                  <span className={`font-mono text-[11px] tabular-nums ${colorT}`}>{mmss(now - p.creado)}{tarde || demora ? ` · ${edad} min` : ''}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${colorEstado(p.cocina)}`}>{ET[p.cocina]}</span>
                  <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${cPago}`}>{tPago}</span>
                </div>
                <ul className="mt-2 font-mono text-xs text-crema/85 leading-relaxed">
                  {p.items.map((l) => <li key={l.key}>{l.q}× {l.n}{l.tamT ? ` · ${l.tamT}` : ''}{l.borde ? ' · borde' : ''}</li>)}
                </ul>
                {p.nota && <p className="mt-2 text-xs text-maiz italic">“{p.nota}”</p>}
                {pend && (
                  <button onClick={() => reconocer(p.id)} className="mt-3 w-full font-press-start text-[10px] text-negro bg-maiz border-[3px] border-negro py-4 uppercase tracking-widest active:scale-[.98] transition-transform">Recibido ✓</button>
                )}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-crema/10">
                  <span className="font-mono text-maiz text-sm tabular-nums">Bs {p.total}</span>
                  {activa && (
                    <button onClick={() => avanzar(p)} disabled={!!ocupado[p.id]} className={`font-press-start text-[8px] py-2.5 px-3 border-2 uppercase tracking-wider disabled:opacity-40 ${p.cocina === 'listo' ? 'text-crema border-crema/30' : 'text-negro bg-lima border-negro'}`}>
                      {ocupado[p.id] ? '…' : ACCION[p.cocina]}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* disponibilidad por categoría */}
        <h2 className="font-press-start text-[9px] text-lima tracking-widest uppercase mt-10 mb-1">▸ Disponibilidad</h2>
        <p className="text-sm text-crema/55 mb-4">Marca lo agotado — el cliente lo ve al instante y no puede pedirlo.</p>
        {data.categorias.map((cat) => (
          <div key={cat.k} className="mb-5">
            <p className="font-press-start text-[8px] text-crema/50 tracking-widest uppercase mb-2">{cat.t}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {cat.items.map((it) => {
                const no = agotVista.includes(it.slug);
                return (
                  <div key={it.slug} className="flex items-center gap-3 border-2 border-crema/15 bg-carbon p-2">
                    <div className="relative w-11 h-11 rounded overflow-hidden bg-negro shrink-0">{it.foto && <Foto src={it.foto} alt={it.n} />}</div>
                    <span className={`text-sm truncate flex-1 ${no ? 'text-crema/50 line-through' : 'text-crema'}`}>{it.n}</span>
                    <button onClick={() => alternar(it.slug)} className={`font-press-start text-[8px] px-3 py-2 border-2 tracking-wider shrink-0 ${no ? 'text-brasa border-brasa' : 'text-lima border-lima'}`}>{no ? 'Agotada' : 'Hay'}</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
