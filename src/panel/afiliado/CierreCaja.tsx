import { useMemo, useState } from 'react';
import type { Cierre, Destino } from '../../lib/pedidos';

// Cierre de caja (nuestra tipografía). Lo usan la Caja real del afiliado y el
// demo de la landing con los mismos datos de entrada:
//  · cobros: ventas cobradas del turno abierto (desde el último cierre)
//  · cierres: historial (el más nuevo primero)
//  · onCerrar: registra el cierre (el servidor o el demo calculan el balance)
//  · urlPdf / urlComprobante / envio: solo en la Caja real (archivo y envío automático)

export type Cobro = { id: string; total: number; metodo: 'qr' | 'efectivo'; items: { n: string; q: number; p: number; tamT?: string }[]; en: number };
export type Envio = {
  destino: Destino; bot: string; telegramListo: boolean; webhook: boolean;
  onVincular: () => Promise<{ code: string; param: string; enlace: string } | null>;
  onDesvincular: () => Promise<void>;
  onRefrescar: () => Promise<void>;
};

const fecha = (ms: number) => new Date(ms).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', '');
const bs = (n: number) => `Bs ${Math.round(n * 100) / 100}`;

export function resumir(cobros: Cobro[]) {
  const r = { pedidos: cobros.length, total: 0, qr: 0, efectivo: 0, qrN: 0, efectivoN: 0, top: [] as { n: string; q: number; total: number }[] };
  const platos = new Map<string, { n: string; q: number; total: number }>();
  for (const c of cobros) {
    r.total += c.total;
    if (c.metodo === 'qr') { r.qr += c.total; r.qrN++; } else { r.efectivo += c.total; r.efectivoN++; }
    for (const l of c.items) {
      const n = l.tamT ? `${l.n} · ${l.tamT}` : l.n;
      const a = platos.get(n) || { n, q: 0, total: 0 };
      a.q += l.q; a.total += l.p * l.q; platos.set(n, a);
    }
  }
  r.top = [...platos.values()].sort((a, b) => b.q - a.q || b.total - a.total).slice(0, 8);
  return r;
}

export function textoResumen(nombre: string, c: Cierre) {
  const lineas = [
    `CIERRE DE CAJA · ${nombre}`, `${c.id} · ${fecha(c.desde || c.hasta)} → ${fecha(c.hasta)}`, '',
    `Pedidos cobrados: ${c.pedidos}`, `QR: ${bs(c.qr)} (${c.qrN})`, `Efectivo: ${bs(c.efectivo)} (${c.efectivoN})`, `TOTAL: ${bs(c.total)}`,
  ];
  if (c.efectivoContado !== null) lineas.push(`Efectivo contado: ${bs(c.efectivoContado)} · diferencia ${c.diferencia !== null && c.diferencia >= 0 ? '+' : ''}${c.diferencia ?? 0}`);
  if (c.top.length) lineas.push('', 'Más vendidos:', ...c.top.slice(0, 5).map((t, i) => `${i + 1}. ${t.n} ×${t.q} (${bs(t.total)})`));
  if (c.comprobantes?.length) lineas.push('', `Comprobantes de QR archivados: ${c.comprobantes.length}`);
  if (c.nota) lineas.push('', `Nota: ${c.nota}`);
  lineas.push('', 'MEZA · la mesa que atiende');
  return lineas.join('\n');
}

const BTN = 'font-press-start text-[8px] py-2.5 px-3 border-2 uppercase tracking-wider disabled:opacity-40';
const BTN_LIMA = `${BTN} text-negro bg-lima border-negro`;
const BTN_LINEA = `${BTN} text-crema/80 border-crema/30`;
const BTN_MAIZ = `${BTN} text-negro bg-maiz border-negro`;
const BTN_BRASA = `${BTN} text-brasa border-brasa`;

function Dato({ k, v, grande }: { k: string; v: string; grande?: boolean }) {
  return (
    <div className={`border-2 border-crema/15 p-3 ${grande ? 'bg-lima/10 border-lima/40' : ''}`}>
      <div className="font-press-start text-[7px] text-crema/55 tracking-widest uppercase">{k}</div>
      <div className={`font-mono tabular-nums mt-1.5 ${grande ? 'text-lima text-xl' : 'text-crema text-base'}`}>{v}</div>
    </div>
  );
}

function estadoEnvio(c: Cierre, envio?: Envio) {
  if (!envio) return null;
  const hayDestino = !!envio.destino.telegram || envio.webhook;
  if (!hayDestino) return <span className="text-crema/40">sin envío automático (vincula Telegram abajo)</span>;
  const e = c.envio || {};
  if (!Object.keys(e).length) return <span className="text-maiz">enviando…</span>;
  const partes: string[] = [];
  if (e.telegram) partes.push(e.telegram === 'ok' ? 'Telegram ✓' : `Telegram ✗ (${e.telegram.replace('error: ', '')})`);
  if (e.webhook) partes.push(e.webhook === 'ok' ? 'webhook ✓' : `webhook ✗ (${e.webhook.replace('error: ', '')})`);
  return <span className={partes.some((p) => p.includes('✗')) ? 'text-brasa' : 'text-lima'}>enviado · {partes.join(' · ')}</span>;
}

function EnvioAutomatico({ envio }: { envio: Envio }) {
  const [vinc, setVinc] = useState<{ code: string; param: string; enlace: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const t = envio.destino.telegram;
  const generar = async () => { setOcupado(true); setVinc(await envio.onVincular()); setOcupado(false); };
  const copiar = async (txt: string) => { try { await navigator.clipboard.writeText(txt); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* */ } };
  return (
    <div className="mt-5 border-2 border-crema/20 bg-carbon p-4">
      <div className="font-press-start text-[8px] text-maiz tracking-widest uppercase">Envío automático y archivo</div>
      <p className="text-sm text-crema/60 mt-2">Al cerrar caja se arma un PDF con el balance y todos los comprobantes de QR del turno (se guardan 90 días) y se envía solo al dueño por Telegram{envio.webhook ? ' y al webhook configurado' : ''}.</p>
      {t ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-lima">● Telegram vinculado: {t.nombre || 'dueño'} · desde {fecha(t.desde)}</span>
          <button onClick={envio.onDesvincular} className={BTN_BRASA}>Desvincular</button>
        </div>
      ) : !envio.telegramListo ? (
        <p className="mt-3 font-mono text-xs text-crema/45">El bot de Telegram todavía no está configurado (ver README: TELEGRAM_BOT y TELEGRAM_TOKEN).</p>
      ) : vinc ? (
        <div className="mt-3">
          <p className="text-sm text-crema/80">Abre este enlace en el celular del dueño y toca <b>Iniciar</b>. Vale 15 minutos.</p>
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <a href={vinc.enlace} target="_blank" rel="noopener noreferrer" className={BTN_LIMA}>Abrir en Telegram ▸</a>
            <button onClick={() => copiar(vinc.enlace)} className={BTN_LINEA}>{copiado ? 'Copiado ✓' : 'Copiar enlace'}</button>
            <button onClick={envio.onRefrescar} className={BTN_LINEA}>Ya lo abrí, revisar</button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-crema/45 break-all">{vinc.enlace}</p>
        </div>
      ) : (
        <button onClick={generar} disabled={ocupado} className={`${BTN_LIMA} mt-3`}>{ocupado ? 'Generando…' : 'Vincular Telegram del dueño ▸'}</button>
      )}
    </div>
  );
}

export default function CierreCaja({ nombre, desde, cobros, cierres, onCerrar, ocupado, error, urlPdf, urlComprobante, envio }: {
  nombre: string; desde: number; cobros: Cobro[]; cierres: Cierre[];
  onCerrar: (efectivoContado: number | null, nota: string) => Promise<Cierre | null>;
  ocupado?: boolean; error?: string;
  urlPdf?: (id: string) => string;
  urlComprobante?: (cierreId: string, pedidoId: string) => string;
  envio?: Envio;
}) {
  const turno = useMemo(() => resumir(cobros), [cobros]);
  const [modal, setModal] = useState(false);
  const [contado, setContado] = useState('');
  const [nota, setNota] = useState('');
  const [hecho, setHecho] = useState<Cierre | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const promedio = turno.pedidos ? Math.round(turno.total / turno.pedidos) : 0;
  const dif = contado.trim() === '' ? null : Math.round((Number(contado) - turno.efectivo) * 100) / 100;
  const qrEnTurno = cobros.filter((c) => c.metodo === 'qr').length;

  const confirmar = async () => {
    const c = await onCerrar(contado.trim() === '' ? null : Number(contado), nota.trim());
    if (c) { setHecho(c); setModal(false); setContado(''); setNota(''); }
  };
  const compartir = (c: Cierre) => {
    const t = textoResumen(nombre, c);
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
  };

  return (
    <section className="mt-8">
      <h2 className="font-press-start text-[9px] text-lima tracking-widest uppercase mb-1">▸ Cierre de caja</h2>
      <p className="text-sm text-crema/55 mb-4">Suma los cobros confirmados del turno (QR y efectivo) y guarda el balance. Haz un cierre al terminar cada día o turno.</p>

      {hecho && (
        <div className="mb-4 border-[3px] border-lima bg-lima/10 p-3 flex flex-wrap items-center justify-between gap-2">
          <span className="font-press-start text-[9px] text-lima leading-relaxed">✓ {hecho.id} guardado · {bs(hecho.total)} · {hecho.pedidos} pedidos{hecho.comprobantes?.length ? ` · ${hecho.comprobantes.length} comprobantes archivados` : ''}</span>
          <div className="flex flex-wrap gap-2">
            {urlPdf && <a href={urlPdf(hecho.id)} target="_blank" rel="noopener noreferrer" className={BTN_MAIZ}>PDF ▸</a>}
            <button onClick={() => compartir(hecho)} className={BTN_LIMA}>Enviar por WhatsApp ▸</button>
            <button onClick={() => setHecho(null)} className={BTN_LINEA}>Cerrar</button>
          </div>
        </div>
      )}

      {/* turno abierto */}
      <div className="border-2 border-crema/20 bg-carbon p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-press-start text-[9px] text-maiz tracking-wider uppercase">Turno abierto {desde ? `· desde ${fecha(desde)}` : '· desde el inicio'}</span>
          <span className="font-mono text-[11px] text-crema/60">{turno.pedidos} cobro{turno.pedidos === 1 ? '' : 's'}{urlPdf && qrEnTurno ? ` · ${qrEnTurno} comprobante${qrEnTurno === 1 ? '' : 's'} de QR` : ''}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          <Dato k="Total cobrado" v={bs(turno.total)} grande />
          <Dato k="Por QR" v={`${bs(turno.qr)} · ${turno.qrN}`} />
          <Dato k="En efectivo" v={`${bs(turno.efectivo)} · ${turno.efectivoN}`} />
          <Dato k="Ticket promedio" v={bs(promedio)} />
        </div>
        {turno.top.length > 0 && (
          <div className="mt-3">
            <div className="font-press-start text-[7px] text-crema/55 tracking-widest uppercase mb-1.5">Más vendidos</div>
            <ol className="font-mono text-xs text-crema/85 leading-relaxed grid sm:grid-cols-2 gap-x-6">
              {turno.top.slice(0, 6).map((t, i) => <li key={t.n} className="flex justify-between gap-3"><span className="truncate">{i + 1}. {t.n}</span><span className="tabular-nums text-crema/60 shrink-0">×{t.q} · {bs(t.total)}</span></li>)}
            </ol>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setModal(true)} disabled={!turno.pedidos || ocupado} className={`${BTN_MAIZ} py-3.5 px-5`}>Cerrar caja ▸</button>
          {!turno.pedidos && <span className="font-mono text-[11px] text-crema/45 self-center">aún no hay cobros confirmados en este turno</span>}
        </div>
        {error && <p className="mt-2 text-xs text-brasa">{error}</p>}
      </div>

      {envio && <EnvioAutomatico envio={envio} />}
      {!envio && !urlPdf && <p className="mt-3 font-mono text-[11px] text-crema/40">En el piloto real, el cierre guarda los comprobantes de QR 90 días, arma el PDF y se envía solo al dueño.</p>}

      {/* historial */}
      <div className="mt-5">
        <div className="font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Cierres anteriores{cierres.length ? ` · ${cierres.length}` : ''}</div>
        {cierres.length === 0
          ? <p className="text-crema/40 text-sm font-mono py-5 text-center border-2 border-dashed border-crema/10">todavía no hay cierres guardados</p>
          : (
            <div className="border-2 border-crema/15 divide-y divide-crema/10">
              {cierres.map((c) => (
                <div key={c.id}>
                  <button onClick={() => setAbierto(abierto === c.id ? null : c.id)} className="w-full text-left px-3 py-2.5 grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 items-center font-mono text-xs">
                    <span className="font-press-start text-[8px] text-lima">{c.id}</span>
                    <span className="text-crema/70 truncate">{fecha(c.hasta)} · {c.pedidos} pedidos{c.comprobantes?.length ? ` · ${c.comprobantes.length} comp.` : ''}</span>
                    <span className="hidden sm:inline text-crema/60 tabular-nums">QR {c.qr}</span>
                    <span className="hidden sm:inline text-crema/60 tabular-nums">Efec. {c.efectivo}</span>
                    <span className="text-maiz tabular-nums text-right">{bs(c.total)}{c.diferencia !== null && c.diferencia !== 0 ? <span className={`ml-2 ${c.diferencia > 0 ? 'text-lima' : 'text-brasa'}`}>{c.diferencia > 0 ? '+' : ''}{c.diferencia}</span> : ''}</span>
                  </button>
                  {abierto === c.id && (
                    <div className="px-3 pb-3 text-xs font-mono text-crema/80">
                      <pre className="whitespace-pre-wrap leading-relaxed bg-negro border border-crema/10 p-3">{textoResumen(nombre, c)}</pre>
                      {envio && <p className="mt-2 text-[11px]">Envío automático: {estadoEnvio(c, envio)}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {urlPdf && <a href={urlPdf(c.id)} target="_blank" rel="noopener noreferrer" className={BTN_MAIZ}>Descargar PDF ▸</a>}
                        <button onClick={() => compartir(c)} className={BTN_LIMA}>Enviar por WhatsApp ▸</button>
                        <button onClick={() => navigator.clipboard?.writeText(textoResumen(nombre, c))} className={BTN_LINEA}>Copiar</button>
                      </div>
                      {urlComprobante && c.comprobantes && c.comprobantes.length > 0 && (
                        <div className="mt-3">
                          <div className="font-press-start text-[7px] text-crema/55 tracking-widest uppercase mb-1.5">Comprobantes archivados · {c.comprobantes.length}</div>
                          <div className="flex flex-wrap gap-2">
                            {c.comprobantes.map((m) => (
                              <a key={m.pedido} href={urlComprobante(c.id, m.pedido)} target="_blank" rel="noopener noreferrer" className="border-2 border-crema/20 px-2.5 py-1.5 hover:border-lima text-[11px] text-crema/80">{m.pedido} · M{m.mesa || '-'} · {bs(m.total)} ↗</a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* modal: confirmar cierre */}
      {modal && (
        <div className="fixed inset-0 z-[90] bg-black/90 flex" onClick={() => !ocupado && setModal(false)}>
          <div className="relative m-auto w-full max-w-md max-h-[94dvh] overflow-y-auto border-[3px] border-maiz bg-carbon p-5" onClick={(e) => e.stopPropagation()}>
            <div className="font-press-start text-[10px] text-maiz uppercase tracking-wide">Cerrar caja</div>
            <p className="text-sm text-crema/70 mt-2">Se guardará el balance del turno y empezará uno nuevo desde este momento.{urlPdf ? ` Los ${qrEnTurno} comprobante${qrEnTurno === 1 ? '' : 's'} de QR quedan archivados y el PDF se envía solo.` : ''}</p>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <Dato k="Total" v={bs(turno.total)} grande /><Dato k="Pedidos" v={String(turno.pedidos)} />
              <Dato k="QR" v={bs(turno.qr)} /><Dato k="Efectivo esperado" v={bs(turno.efectivo)} />
            </div>
            <label className="block font-press-start text-[7px] text-crema/60 tracking-widest uppercase mt-4 mb-1.5">Efectivo contado en caja (opcional)</label>
            <input value={contado} onChange={(e) => setContado(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder={`Bs ${turno.efectivo}`} className="w-full bg-negro border-2 border-crema/30 focus:border-lima outline-none text-crema p-3 font-mono" />
            {dif !== null && <p className={`mt-1.5 font-mono text-xs ${dif === 0 ? 'text-lima' : dif > 0 ? 'text-maiz' : 'text-brasa'}`}>{dif === 0 ? 'Cuadra exacto ✓' : dif > 0 ? `Sobran Bs ${dif}` : `Faltan Bs ${-dif}`}</p>}
            <label className="block font-press-start text-[7px] text-crema/60 tracking-widest uppercase mt-3 mb-1.5">Nota (opcional)</label>
            <input value={nota} onChange={(e) => setNota(e.target.value.slice(0, 200))} placeholder="Ej.: turno noche, cerró Carla" className="w-full bg-negro border-2 border-crema/30 focus:border-lima outline-none text-crema p-3 text-sm" />
            {error && <p className="mt-2 text-xs text-brasa">{error}</p>}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={confirmar} disabled={ocupado} className={`${BTN_LIMA} py-3.5`}>{ocupado ? 'Guardando…' : 'Confirmar cierre ✓'}</button>
              <button onClick={() => setModal(false)} disabled={ocupado} className={`${BTN_LINEA} py-3.5`}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
