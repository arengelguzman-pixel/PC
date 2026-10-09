import { useEffect, useMemo, useRef, useState } from 'react';
import type { Afiliado } from '../../afiliados/elGaraje';
import { confirmarPago, verComprobante, guardarQr, comprimirImagen, getCierres, cerrarCaja, getDestino, codigoVinculo, quitarDestino, urlPdfCierre, urlArchivo, ETIQUETA_PAGO, type Pedido, type Cierre, type Destino } from '../../lib/pedidos';
import { beep, voz, Conexion, AvisoSonido } from './comunes';
import CierreCaja, { type Cobro } from './CierreCaja';

// Vista de Caja (nuestra tipografía). Confirma o rechaza pagos viendo el
// comprobante, marca cobros en efectivo y gestiona el QR de cobro del local.
// El estado (pedidos, qr) llega en vivo por props desde el shell.

const hhmm = (ms: number) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const esHoy = (ms: number) => new Date(ms).toDateString() === new Date().toDateString();
const textoError = (r: { causa?: string; msg?: string }) => {
  const base = r.msg || 'No se pudo completar. Intenta de nuevo.';
  return r.causa === 'clave_mala' || r.causa === 'sin_clave' ? `${base} Toca "Salir" y vuelve a escribir la clave.` : base;
};
const colorPago = (p: Pedido) => p.pago === 'por_confirmar' ? 'bg-maiz text-negro' : p.pago === 'confirmado' ? 'bg-lima text-negro' : p.pago === 'rechazado' ? 'bg-brasa text-crema' : 'bg-crema/25 text-crema';

const BTN = 'font-press-start text-[8px] py-2.5 px-3 border-2 uppercase tracking-wider disabled:opacity-40';
const BTN_LIMA = `${BTN} text-negro bg-lima border-negro`;
const BTN_LINEA = `${BTN} text-crema/80 border-crema/30`;
const BTN_BRASA = `${BTN} text-brasa border-brasa`;

type Modal = { id: string; src: string | null; err: string };

export default function Caja({ data, pedidos, qr, cierreDesde, clave, conectado, salir }: {
  data: Afiliado; pedidos: Pedido[]; qr: string | null; cierreDesde: number; clave: string; conectado: boolean; salir: () => void;
}) {
  const [cambios, setCambios] = useState<Record<string, Pedido>>({});   // optimista: gana si es más nuevo que la prop
  const [cargando, setCargando] = useState('');                          // id del pedido en proceso
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<Modal | null>(null);
  const [aviso, setAviso] = useState('');
  const [qrCargando, setQrCargando] = useState(false);
  const [qrErr, setQrErr] = useState('');
  const [verConfig, setVerConfig] = useState<boolean | null>(null);   // null = abierto solo si falta el QR
  const avisoTimer = useRef(0);
  const vistos = useRef<Set<string> | null>(null);
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [cierreOcupado, setCierreOcupado] = useState(false);
  const [cierreErr, setCierreErr] = useState('');
  const [destino, setDestino] = useState<{ destino: Destino; bot: string; telegramListo: boolean; webhook: boolean } | null>(null);

  const lista = useMemo(() => pedidos.map((p) => { const c = cambios[p.id]; return c && c.actualizado > p.actualizado ? c : p; }), [pedidos, cambios]);
  const porConfirmar = lista.filter((p) => p.pago === 'por_confirmar');
  const efectivo = lista.filter((p) => p.metodo === 'efectivo' && p.pago === 'pendiente' && p.cocina !== 'entregado');
  const porCobrar = [...porConfirmar, ...efectivo];
  const cobrados = lista.filter((p) => p.pago === 'confirmado').sort((a, b) => (b.confirmadoEn ?? b.actualizado) - (a.confirmadoEn ?? a.actualizado));
  const rechazados = lista.filter((p) => p.pago === 'rechazado');
  // turno abierto de caja: cobros confirmados después del último cierre
  const cobrosTurno: Cobro[] = cobrados
    .filter((p) => (p.confirmadoEn ?? p.actualizado) > cierreDesde)
    .map((p) => ({ id: p.id, total: p.total, metodo: p.metodo, items: p.items.map((l) => ({ n: l.n, q: l.q, p: l.p, tamT: l.tamT })), en: p.confirmadoEn ?? p.actualizado }));
  const turnoTotal = cobrosTurno.reduce((a, c) => a + c.total, 0);
  const hoy = cobrados.reduce((a, p) => a + (p.confirmadoEn && esHoy(p.confirmadoEn) ? p.total : 0), 0);

  // historial de cierres (con clave); se vuelve a pedir cuando alguien cierra caja
  useEffect(() => {
    let vivo = true;
    getCierres(data.local, clave).then((r) => { if (vivo && r.ok) setCierres(r.cierres); });
    return () => { vivo = false; };
  }, [data.local, clave, cierreDesde]);

  useEffect(() => {
    let vivo = true;
    getDestino(data.local, clave).then((r) => { if (vivo && r.ok) setDestino({ destino: r.destino, bot: r.bot, telegramListo: r.telegramListo, webhook: r.webhook }); });
    return () => { vivo = false; };
  }, [data.local, clave]);
  // el estado de envío llega unos segundos después del cierre: se vuelve a pedir la lista
  useEffect(() => {
    if (!cierres.length || cierres[0].envio === undefined || Object.keys(cierres[0].envio).length) return;
    const t = window.setTimeout(() => getCierres(data.local, clave).then((r) => { if (r.ok) setCierres(r.cierres); }), 6000);
    return () => clearTimeout(t);
  }, [cierres, data.local, clave]);
  const vincular = async () => { const r = await codigoVinculo(data.local, clave); return r.ok ? { code: r.code, param: r.param, enlace: r.enlace } : null; };
  const desvincular = async () => { const r = await quitarDestino(data.local, clave); if (r.ok) setDestino((d) => (d ? { ...d, destino: { telegram: null } } : d)); };
  const refrescarDestino = async () => { const r = await getDestino(data.local, clave); if (r.ok) setDestino({ destino: r.destino, bot: r.bot, telegramListo: r.telegramListo, webhook: r.webhook }); };

  const cerrar = async (efectivoContado: number | null, nota: string) => {
    setCierreOcupado(true); setCierreErr('');
    const r = await cerrarCaja(data.local, clave, efectivoContado, nota, data.nombre);
    setCierreOcupado(false);
    if (!r.ok) { setCierreErr(textoError(r)); return null; }
    setCierres((c) => [r.cierre, ...c.filter((x) => x.id !== r.cierre.id)]);
    return r.cierre;
  };

  // aviso en vivo: comprobante nuevo → bip + banner 5 s
  useEffect(() => {
    const actual = new Set(porConfirmar.map((p) => p.id));
    if (vistos.current) {
      const nuevos = porConfirmar.filter((p) => !vistos.current!.has(p.id));
      if (nuevos.length) {
        beep(); voz('comprobante', nuevos[0].mesa);
        setAviso(`Nuevo comprobante · ${nuevos[0].id} · Bs ${nuevos[0].total}${nuevos.length > 1 ? ` (+${nuevos.length - 1})` : ''}`);
        clearTimeout(avisoTimer.current);
        avisoTimer.current = window.setTimeout(() => setAviso(''), 5000);
      }
    }
    vistos.current = actual;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, cambios]);
  useEffect(() => () => clearTimeout(avisoTimer.current), []);

  // título del documento con pendientes
  useEffect(() => {
    const base = `${data.nombre} · Menú`;
    document.title = porConfirmar.length ? `(${porConfirmar.length}) por confirmar · ${data.nombre}` : base;
    return () => { document.title = base; };
  }, [porConfirmar.length, data.nombre]);

  const aplicar = (p: Pedido) => setCambios((c) => ({ ...c, [p.id]: p }));
  const setErr = (id: string, msg: string) => setErrores((e) => ({ ...e, [id]: msg }));

  const resolver = async (id: string, estado: 'confirmado' | 'rechazado') => {
    setCargando(id); setErr(id, '');
    const r = await confirmarPago(data.local, id, clave, estado);
    setCargando('');
    if (!r.ok) { const t = textoError(r); setErr(id, t); setModal((m) => (m && m.id === id ? { ...m, err: t } : m)); return; }
    aplicar(r.pedido);
    setModal((m) => (m && m.id === id ? null : m));
  };

  const abrirComprobante = async (id: string) => {
    setModal({ id, src: null, err: '' });
    const r = await verComprobante(data.local, id, clave);
    setModal((m) => (m && m.id === id ? (r.ok ? { ...m, src: r.comprobante } : { ...m, err: textoError(r) }) : m));
  };

  const subirQr = async (file: File | undefined) => {
    if (!file) return;
    setQrErr(''); setQrCargando(true);
    try {
      const dataUrl = await comprimirImagen(file, 900, 0.85);
      const r = await guardarQr(data.local, clave, dataUrl);
      if (!r.ok) setQrErr(textoError(r));
    } catch { setQrErr('No se pudo leer la imagen. Prueba con otra foto o captura.'); }
    setQrCargando(false);
  };
  const quitarQr = async () => {
    if (!confirm('¿Quitar el QR de cobro? Los clientes no podrán pagar por QR hasta que subas otro.')) return;
    setQrErr(''); setQrCargando(true);
    const r = await guardarQr(data.local, clave, null);
    if (!r.ok) setQrErr(textoError(r));
    setQrCargando(false);
  };

  const pedidoModal = modal ? lista.find((p) => p.id === modal.id) : undefined;

  const tarjeta = (p: Pedido) => {
    const ocupado = cargando === p.id;
    return (
      <div key={p.id} className={`border-2 p-3 ${p.pago === 'por_confirmar' ? 'border-maiz animate-[pulse_2s_ease-in-out_2]' : 'border-crema/15'}`}>
        <div className="flex justify-between items-center gap-2">
          <span className="font-press-start text-[10px] text-crema">{p.id}{p.mesa ? ` · MESA ${p.mesa}` : ''}</span>
          <span className="font-mono text-[11px] text-crema/60 tabular-nums">{hhmm(p.creado)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${p.metodo === 'qr' ? 'bg-azul text-white' : 'bg-crema/25 text-crema'}`}>{p.metodo === 'qr' ? 'QR' : 'EFECTIVO'}</span>
          <span className={`font-press-start text-[7px] px-2 py-1 tracking-wider ${colorPago(p)}`}>{ETIQUETA_PAGO[p.pago].toUpperCase()}</span>
        </div>
        <ul className="mt-2 font-mono text-xs text-crema/85 leading-relaxed">
          {p.items.map((l) => <li key={l.key}>{l.q}× {l.n}{l.tamT ? ` · ${l.tamT}` : ''}{l.borde ? ' · borde' : ''}{l.extras?.length ? ` + ${l.extras.join(', ')}` : ''}{l.nota ? ` — ${l.nota}` : ''}</li>)}
        </ul>
        {p.nota && <p className="mt-2 text-xs text-maiz italic">“{p.nota}”</p>}
        <div className="flex justify-between items-center gap-2 mt-3 pt-2 border-t border-crema/10">
          <span className="font-mono text-maiz text-sm tabular-nums">Bs {p.total}</span>
          {p.pago === 'por_confirmar' && <button onClick={() => abrirComprobante(p.id)} disabled={ocupado} className={BTN_LIMA}>Ver comprobante ▸</button>}
          {p.metodo === 'efectivo' && p.pago === 'pendiente' && p.cocina !== 'entregado' && (
            <button onClick={() => resolver(p.id, 'confirmado')} disabled={ocupado} className={BTN_LIMA}>{ocupado ? 'Guardando…' : 'Cobrado en efectivo ✓'}</button>
          )}
          {p.pago === 'confirmado' && p.confirmadoEn && <span className="font-mono text-[11px] text-lima/80 tabular-nums">cobrado {hhmm(p.confirmadoEn)}</span>}
        </div>
        {errores[p.id] && <p className="mt-2 text-xs text-brasa">{errores[p.id]}</p>}
      </div>
    );
  };

  const seccion = (titulo: string, items: Pedido[], vacio: string) => (
    <section className="mt-8">
      <h2 className="font-press-start text-[9px] text-lima tracking-widest uppercase mb-3">▸ {titulo}{items.length ? ` · ${items.length}` : ''}</h2>
      {items.length === 0
        ? <p className="text-crema/40 text-sm font-mono py-6 text-center border-2 border-dashed border-crema/10">{vacio}</p>
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{items.map(tarjeta)}</div>}
    </section>
  );

  return (
    <div className="min-h-screen bg-negro text-crema">
      {aviso && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[95] w-[94%] max-w-lg bg-maiz text-negro border-[3px] border-negro shadow-[6px_6px_0_var(--color-rojo)] px-4 py-3 font-press-start text-[10px] leading-relaxed tracking-wide animate-pulse">🔔 {aviso}</div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* cabecera */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-press-start text-[12px] text-maiz uppercase tracking-wide" style={{ textShadow: '2px 2px 0 var(--color-rojo)' }}>Caja · {data.nombre}</h1>
            <div className="mt-2"><Conexion ok={conectado} /></div>
          </div>
          <div className="flex items-center gap-2">
            <span title={`Hoy: Bs ${hoy}`} className="font-press-start text-[8px] px-2.5 py-1.5 tracking-wider bg-lima/15 text-lima border-2 border-lima/40">TURNO Bs {turnoTotal}</span>
            <button onClick={salir} className={BTN_LINEA}>Salir</button>
          </div>
        </div>

        {/* Configuración del local: QR de cobro (arriba, para que la dueña lo vea) */}
        <section className="mt-6 border-2 border-crema/15 bg-carbon p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-press-start text-[9px] text-lima tracking-widest uppercase">⚙ Configuración · QR de cobro</h2>
            <button onClick={() => setVerConfig((v) => !(v ?? !qr))} className={BTN_LINEA}>{(verConfig ?? !qr) ? 'Ocultar' : qr ? 'Ver / cambiar' : 'Configurar'}</button>
          </div>
          <p className="text-sm text-crema/55 mt-2">{qr ? 'QR cargado: en el menú de las mesas el cliente elige “Pagar con QR” o “Pagar en efectivo”.' : 'Sin QR: los clientes solo pueden pagar en efectivo. Sube la imagen del QR de tu banco o billetera y aparecerá “Pagar con QR” en los menús de las mesas.'}</p>
          {(verConfig ?? !qr) && (
            <div className="mt-4">
              <p className="text-xs text-crema/45 mb-3">Es el mismo QR impreso del local. El cliente lo escanea, paga desde su banco y sube el comprobante; tú lo confirmas aquí. Solo se cambia con la clave de personal.</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            {qr
              ? <img src={qr} alt="QR de cobro" className="w-full max-w-[280px] border-[3px] border-crema/20 bg-white" />
              : <div className="w-full max-w-[280px] aspect-square border-2 border-dashed border-crema/25 grid place-items-center p-6 text-center font-mono text-xs text-crema/40">sin QR — sube la imagen del QR de tu banco o billetera para cobrar por QR</div>}
            <div className="flex flex-col gap-2">
              <label className={`${BTN_LIMA} text-center cursor-pointer ${qrCargando ? 'opacity-40 pointer-events-none' : ''}`}>
                {qrCargando ? 'Guardando…' : qr ? 'Cambiar QR' : 'Subir QR'}
                <input type="file" accept="image/*" className="hidden" disabled={qrCargando} onChange={(e) => { subirQr(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {qr && <button onClick={quitarQr} disabled={qrCargando} className={BTN_BRASA}>Quitar</button>}
              {qrErr && <p className="text-xs text-brasa max-w-[280px]">{qrErr}</p>}
            </div>
          </div>
            </div>
          )}
        </section>

        {seccion('Por cobrar', porCobrar, 'nada por cobrar — los comprobantes y los pedidos en efectivo aparecen aquí')}
        {seccion('Cobrados', cobrados, 'aún no hay cobros confirmados')}
        <CierreCaja nombre={data.nombre} desde={cierreDesde} cobros={cobrosTurno} cierres={cierres} onCerrar={cerrar} ocupado={cierreOcupado} error={cierreErr}
          urlPdf={(id) => urlPdfCierre(data.local, id, clave)} urlComprobante={(z, p) => urlArchivo(data.local, z, p, clave)}
          envio={destino ? { ...destino, onVincular: vincular, onDesvincular: desvincular, onRefrescar: refrescarDestino } : undefined} />
        {seccion('Rechazados', rechazados, 'sin pagos rechazados')}


      </div>

      {/* modal: comprobante a tamaño completo */}
      {modal && (
        <div className="fixed inset-0 z-[90] bg-black/90 flex" onClick={() => setModal(null)}>
          <div className="relative m-auto w-full max-w-lg h-[100dvh] sm:h-auto sm:max-h-[94dvh] flex flex-col border-[3px] border-lima bg-carbon" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b-2 border-lima/40">
              <span className="font-press-start text-[9px] text-crema leading-relaxed">{modal.id}{pedidoModal?.mesa ? ` · MESA ${pedidoModal.mesa}` : ''}{pedidoModal ? ` · Bs ${pedidoModal.total}` : ''}</span>
              <button onClick={() => setModal(null)} className={`${BTN_LINEA} py-1.5 px-2`}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto bg-negro min-h-[200px]">
              {modal.src
                ? <img src={modal.src} alt={`Comprobante ${modal.id}`} className="block w-full h-auto" />
                : <p className="font-mono text-sm text-crema/40 py-16 text-center px-4">{modal.err || 'cargando comprobante…'}</p>}
            </div>
            {modal.err && modal.src && <p className="px-3 pt-2 text-xs text-brasa">{modal.err}</p>}
            <div className="grid grid-cols-2 gap-2 p-3 border-t-2 border-lima/40" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
              <button onClick={() => resolver(modal.id, 'confirmado')} disabled={cargando === modal.id || pedidoModal?.pago !== 'por_confirmar'} className={`${BTN_LIMA} py-3.5`}>{cargando === modal.id ? 'Guardando…' : 'Confirmar pago ✓'}</button>
              <button onClick={() => resolver(modal.id, 'rechazado')} disabled={cargando === modal.id || pedidoModal?.pago !== 'por_confirmar'} className={`${BTN_BRASA} py-3.5`}>Rechazar ✗</button>
            </div>
          </div>
        </div>
      )}
      <AvisoSonido />
    </div>
  );
}
