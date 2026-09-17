import { useEffect, useMemo, useRef, useState } from 'react';
import { PLATOS, IMG, type Plato } from '../config';
import {
  LOOKS, TPLS, COLORES, type LookKey, type TplKey,
  cartaGet, cartaPost, recortarLogo, paletaVars, leerLocal, leerClave, type DatosCarta,
} from '../lib/carta';

type Marca = { nombre: string; bajada: string; logo: string; color: string };
type Est = { p: number; no: boolean };

const fotoDe = (p: Plato) => (p.img.startsWith('/') ? p.img : IMG[p.img]);

export default function OwnerPanel() {
  const LOCAL = useMemo(leerLocal, []);
  const CLAVE = useMemo(leerClave, []);
  const soloCliente = !CLAVE;

  const [tab, setTab] = useState<'cli' | 'due'>(soloCliente ? 'cli' : 'due');
  const [marca, setMarca] = useState<Marca>({ nombre: 'Doña Elsa', bajada: 'Comida cruceña y rápida · Montero', logo: '', color: '' });
  const [look, setLook] = useState<LookKey>('brasa');
  const [tpl, setTpl] = useState<TplKey>('vitrina');
  const [est, setEst] = useState<Record<number, Est>>(() => Object.fromEntries(PLATOS.map((p) => [p.id, { p: p.p, no: p.no }])));
  const [extras, setExtras] = useState<Plato[]>([]);
  const [cambios, setCambios] = useState(0);
  const [guardadoEn, setGuardadoEn] = useState('');
  const [editando, setEditando] = useState<Plato | null>(null);
  const [toast, setToast] = useState<{ t: string; s: string } | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const platos = useMemo(() => [...PLATOS, ...extras], [extras]);
  const marcar = () => setCambios((c) => c + 1);
  const avisar = (t: string, s: string) => { setToast({ t, s }); window.setTimeout(() => setToast(null), 2600); };

  // Cargar carta existente
  useEffect(() => {
    if (!LOCAL) return;
    cartaGet(LOCAL).then((j) => {
      if (j.ok && j.existe && j.datos) {
        const D = j.datos;
        setMarca((m) => ({ nombre: D.nombre || m.nombre, bajada: D.bajada ?? m.bajada, logo: D.logo || '', color: D.color || '' }));
        if (D.look) { setLook(D.look); const L = LOOKS.find((x) => x.k === D.look); if (L) setTpl(L.tpl); }
        if (Array.isArray(D.platos)) {
          setEst((prev) => {
            const n = { ...prev };
            D.platos.forEach((g) => { if (n[g.id]) n[g.id] = { p: typeof g.p === 'number' ? g.p : n[g.id].p, no: !!g.no }; });
            return n;
          });
        }
        if (j.guardado) setGuardadoEn(j.guardado);
        setCambios(0);
      }
    });
  }, [LOCAL]);

  const elegirLook = (k: LookKey) => {
    setLook(k);
    const L = LOOKS.find((x) => x.k === k)!;
    setTpl(L.tpl);
    marcar();
    avisar('Look: ' + L.t, 'Así va a ver tu carta el cliente.');
  };

  const subirLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return avisar('Eso no es una imagen', 'Elige una foto o un logo.');
    const url = URL.createObjectURL(f); const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); setMarca((m) => ({ ...m, logo: recortarLogo(im) })); marcar(); };
    im.onerror = () => avisar('No pude leer esa imagen', 'Prueba con otra.');
    im.src = url;
  };

  const toggleHay = (id: number) => { setEst((s) => ({ ...s, [id]: { ...s[id], no: !s[id].no } })); marcar(); };
  const paso = (n: number) => { if (!editando) return; setEst((s) => ({ ...s, [editando.id]: { ...s[editando.id], p: Math.max(0, s[editando.id].p + n) } })); marcar(); };
  const agregarPlato = () => {
    const id = 100 + extras.length;
    setExtras((x) => [...x, { id, cat: 'Platos', n: 'Pollo con arroz', p: 25, img: '/fotos/fiel.jpg', glb: null, no: false, d: 'Presa de pollo a la brasa con arroz graneado.', t: '1/4 de pollo · arroz graneado' }]);
    setEst((s) => ({ ...s, [id]: { p: 25, no: false } }));
    marcar();
    avisar('Plato agregado', 'Ponle el precio y publica cuando quieras.');
  };

  const publicar = async () => {
    if (!LOCAL) { setCambios(0); return avisar('Esta es la demostración', 'Los cambios se ven pero no se guardan. En la carta de un cliente de verdad, este botón la publica.'); }
    if (!CLAVE) return avisar('Te falta la clave', 'Este link abre tu carta pero no puede cambiarla. Usa el link de administración que te dimos.');
    const datos: DatosCarta = {
      v: 1, nombre: marca.nombre, bajada: marca.bajada, logo: marca.logo, look, color: marca.color,
      platos: platos.map((p) => ({ id: p.id, p: est[p.id]?.p ?? p.p, no: !!est[p.id]?.no })),
    };
    const j = await cartaPost(LOCAL, CLAVE, datos);
    if (!j.ok) {
      const m = ({ clave_mala: 'Esa clave no corresponde a este local.', pesada: 'La carta pesa demasiado. Prueba con un logo más chico.', sin_deposito: 'Este sitio todavía no tiene dónde guardar.', red: 'Se cortó la conexión. Revisa tu wifi.' } as Record<string, string>)[j.causa || ''] || j.msg || 'No se pudo publicar. Prueba de nuevo.';
      return avisar('No se publicó', m);
    }
    setCambios(0);
    if (j.guardado) setGuardadoEn(j.guardado);
    avisar('Publicado', 'Tus clientes ya lo ven. El link de tu carta no cambió.');
  };

  const ligaPublica = LOCAL ? `${location.origin}${location.pathname}?r=${LOCAL}` : '';
  const copiarLiga = () => {
    if (!ligaPublica) return;
    (navigator.clipboard ? navigator.clipboard.writeText(ligaPublica) : Promise.reject())
      .then(() => avisar('Link copiado', 'Pégalo en WhatsApp o mándalo a imprimir en el QR.'))
      .catch(() => avisar('Copia el link a mano', ligaPublica));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-crema pb-40">
      {/* barra superior */}
      <header className="sticky top-0 z-40 bg-carbon border-b-4 border-lima px-4 py-3 flex items-center justify-between gap-3">
        <span className="font-press-start text-[11px] text-lima">PLATO VIVO</span>
        <div className="flex gap-1.5">
          <button onClick={() => setTab('cli')} className={`font-press-start text-[8px] px-3 py-2.5 border-2 tracking-wider ${tab === 'cli' ? 'bg-lima text-carbon border-lima' : 'text-crema/70 border-crema/25'}`}>Lo que ve tu cliente</button>
          {!soloCliente && <button onClick={() => setTab('due')} className={`font-press-start text-[8px] px-3 py-2.5 border-2 tracking-wider ${tab === 'due' ? 'bg-lima text-carbon border-lima' : 'text-crema/70 border-crema/25'}`}>Lo que ves tú</button>}
        </div>
      </header>

      {tab === 'cli'
        ? <ClientePreview marca={marca} look={look} tpl={tpl} platos={platos} est={est} />
        : (
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Vista previa mini */}
            <p className="font-press-start text-[9px] text-lima tracking-widest uppercase mb-3">Así se ve tu carta</p>
            <div className="border-[3px] border-lima max-h-[46vh] overflow-y-auto">
              <ClientePreview marca={marca} look={look} tpl={tpl} platos={platos} est={est} compacto />
            </div>

            {/* Marca */}
            <Seccion titulo="Tu marca">
              <Campo label="Nombre del local">
                <input value={marca.nombre} onChange={(e) => { setMarca((m) => ({ ...m, nombre: e.target.value })); marcar(); }} className={inputCls} />
              </Campo>
              <Campo label="Bajada (una línea)">
                <input value={marca.bajada} onChange={(e) => { setMarca((m) => ({ ...m, bajada: e.target.value })); marcar(); }} className={inputCls} />
              </Campo>
              <Campo label="Logo">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 border-2 border-dashed border-crema/30 grid place-items-center overflow-hidden shrink-0 bg-carbon">
                    {marca.logo ? <img src={marca.logo} alt="" className="w-full h-full object-cover" /> : <span className="text-crema/40 text-2xl">◧</span>}
                  </div>
                  <input ref={logoInput} type="file" accept="image/*" hidden onChange={subirLogo} />
                  <button onClick={() => logoInput.current?.click()} className="flex-1 font-press-start text-[9px] text-crema border-2 border-crema/40 py-3.5 uppercase tracking-wider cursor-pointer">Subir logo ▸</button>
                </div>
              </Campo>
              <Campo label="Color de marca">
                <div className="flex gap-2.5 flex-wrap">
                  {COLORES.map((c) => (
                    <button key={c || 'auto'} onClick={() => { setMarca((m) => ({ ...m, color: c })); marcar(); }}
                      title={c ? 'Color propio' : 'El del look'}
                      className={`w-10 h-10 rounded-full border-[3px] ${c === marca.color ? 'border-lima' : 'border-transparent'}`}
                      style={{ background: c || 'linear-gradient(135deg,#E8531F,#F2B33D)' }} />
                  ))}
                </div>
              </Campo>
            </Seccion>

            {/* Look */}
            <Seccion titulo="El look" nota="Cada uno trae paleta, letra y estructura. Tocas uno solo — no puede quedar feo.">
              <div className="grid grid-cols-2 gap-2.5">
                {LOOKS.map((L) => (
                  <button key={L.k} onClick={() => elegirLook(L.k)} className={`text-left border-2 overflow-hidden ${L.k === look ? 'border-lima' : 'border-crema/25'}`}>
                    <span className="flex h-12">{L.c.map((x, i) => <i key={i} className="flex-1" style={{ background: x }} />)}</span>
                    <span className="block p-2.5"><b className={`block font-press-start text-[9px] ${L.k === look ? 'text-lima' : 'text-crema'}`}>{L.t}</b><span className="block text-[11px] text-crema/60 mt-1">{L.s}</span></span>
                  </button>
                ))}
              </div>
            </Seccion>

            {/* Plantilla */}
            <Seccion titulo="El diseño">
              <div className="flex gap-2 flex-wrap">
                {TPLS.map((t) => (
                  <button key={t.k} onClick={() => { setTpl(t.k); marcar(); }} className={`font-press-start text-[9px] px-3.5 py-3 border-2 tracking-wider ${t.k === tpl ? 'bg-lima text-carbon border-lima' : 'text-crema/70 border-crema/25'}`}>{t.t}</button>
                ))}
              </div>
            </Seccion>

            {/* Platos */}
            <Seccion titulo="Tus platos" nota="Toca el precio para cambiarlo. Marca lo que se acabó — el cliente lo ve al toque.">
              <div className="flex flex-col gap-2.5">
                {platos.map((p) => {
                  const e = est[p.id] || { p: p.p, no: p.no };
                  return (
                    <div key={p.id} className="flex items-center gap-3 border-2 border-crema/20 bg-carbon p-2.5">
                      <img src={fotoDe(p)} alt="" className="w-16 h-16 object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-crema truncate">{p.n}</div>
                        <button onClick={() => setEditando(p)} className="font-mono font-bold text-lima text-lg mt-0.5 cursor-pointer">Bs {e.p}</button>
                      </div>
                      <button onClick={() => toggleHay(p.id)} className={`font-press-start text-[8px] px-3 py-2.5 border-2 tracking-wider shrink-0 ${e.no ? 'text-brasa border-brasa' : 'text-lima border-lima'}`}>{e.no ? 'Se acabó' : 'Hay'}</button>
                    </div>
                  );
                })}
                <button onClick={agregarPlato} className="border-2 border-dashed border-crema/30 py-6 font-press-start text-[10px] text-crema/70 uppercase tracking-wider cursor-pointer">＋ Agregar un plato</button>
              </div>
            </Seccion>

            {/* Liga */}
            {LOCAL && (
              <Seccion titulo="El link de tu carta">
                <div className="font-mono text-xs text-crema/80 bg-carbon border-2 border-crema/20 p-3 break-all">{ligaPublica}</div>
                <button onClick={copiarLiga} className="mt-2.5 w-full font-press-start text-[9px] text-crema border-2 border-crema/40 py-3.5 uppercase tracking-wider cursor-pointer">Copiar link ▸</button>
                {guardadoEn && <p className="text-xs text-crema/50 mt-2.5 text-center">Última publicación: {new Date(guardadoEn).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</p>}
              </Seccion>
            )}
          </div>
        )}

      {/* Editor de precio */}
      {editando && (
        <div className="fixed inset-0 z-[80] bg-carbon/95 grid place-items-center p-6" onClick={() => setEditando(null)}>
          <div className="w-full max-w-sm border-[3px] border-lima bg-carbon p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="font-press-start text-[11px] text-lima uppercase">{editando.n}</div>
            <div className="font-mono font-extrabold text-5xl my-6">{est[editando.id]?.p ?? editando.p}<small className="text-base font-semibold text-crema/60"> Bs</small></div>
            <div className="flex items-center gap-3 justify-center">
              {[-5, -1, 1, 5].map((n) => (
                <button key={n} onClick={() => paso(n)} className="font-press-start text-[11px] w-14 h-14 border-2 border-crema/40 text-crema cursor-pointer">{n > 0 ? '+' + n : n}</button>
              ))}
            </div>
            <button onClick={() => setEditando(null)} className="mt-6 w-full font-press-start text-[10px] text-carbon bg-lima border-[3px] border-carbon py-4 uppercase tracking-widest cursor-pointer">Listo ▸</button>
          </div>
        </div>
      )}

      {/* Barra publicar */}
      {tab === 'due' && cambios > 0 && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[70] w-[92%] max-w-md">
          <button onClick={publicar} className="w-full font-press-start text-[11px] text-carbon bg-lima border-[3px] border-carbon py-4 shadow-[6px_6px_0_var(--color-azul)] uppercase tracking-widest cursor-pointer">
            Publicar<span className="block font-body text-[11px] tracking-normal normal-case mt-1 opacity-80">{cambios === 1 ? '1 cambio' : cambios + ' cambios'}</span>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 top-20 z-[90] w-[92%] max-w-sm bg-maiz text-carbon border-[3px] border-carbon shadow-[5px_5px_0_rgba(0,0,0,.4)] p-4">
          <div className="font-press-start text-[10px] leading-snug">{toast.t}</div>
          <p className="text-sm mt-2">{toast.s}</p>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full bg-carbon border-2 border-crema/30 focus:border-lima outline-none text-crema p-3.5';

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="font-press-start text-[11px] text-lima uppercase tracking-wide">{titulo}</h3>
      {nota && <p className="text-sm text-crema/60 mt-2">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3.5">
      <span className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">{label}</span>
      {children}
    </label>
  );
}

// ---- Vista previa del cliente, temeada por look ----
function ClientePreview({ marca, look, tpl, platos, est, compacto }: {
  marca: Marca; look: LookKey; tpl: TplKey; platos: Plato[]; est: Record<number, Est>; compacto?: boolean;
}) {
  const vars = paletaVars(look, marca.color);
  return (
    <div style={{ ...vars, background: 'var(--fondo)', color: 'var(--cunape)' }} className={compacto ? 'p-4' : 'min-h-screen p-5'}>
      <div className="flex items-center gap-3">
        {marca.logo
          ? <img src={marca.logo} alt="" className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: 'var(--ceniza)' }} />
          : <div className="w-12 h-12 rounded-full grid place-items-center font-bold" style={{ background: 'var(--brasa)', color: '#fff' }}>{marca.nombre.slice(0, 2).toUpperCase()}</div>}
        <div>
          <div className="text-xl font-bold leading-tight" style={{ fontFamily: 'var(--font-body)' }}>{marca.nombre}</div>
          <div className="text-sm" style={{ color: 'var(--txt2)' }}>{marca.bajada}</div>
        </div>
      </div>

      <div className={tpl === 'mosaico' ? 'grid grid-cols-2 gap-3 mt-5' : 'flex flex-col gap-3 mt-5'}>
        {platos.map((p) => {
          const e = est[p.id] || { p: p.p, no: p.no };
          const foto = fotoDe(p);
          if (tpl === 'clasica') {
            return (
              <div key={p.id} className="flex items-baseline gap-2 py-2" style={{ borderBottom: '1px dotted var(--ceniza)', opacity: e.no ? 0.5 : 1 }}>
                <b className="font-medium" style={{ fontFamily: 'var(--font-body)' }}>{p.n}</b>
                <span className="flex-1 border-b border-dotted self-end mb-1" style={{ borderColor: 'var(--tenue)' }} />
                <span className="font-mono font-bold" style={{ color: 'var(--maiz)' }}>{e.no ? 'Agotado' : 'Bs ' + e.p}</span>
              </div>
            );
          }
          if (tpl === 'lista') {
            return (
              <div key={p.id} className="flex items-center gap-3" style={{ background: 'var(--humo)', opacity: e.no ? 0.5 : 1 }}>
                <img src={foto} alt="" className="w-[72px] h-[72px] object-cover shrink-0" />
                <div className="flex-1 min-w-0 py-2">
                  <b className="block font-medium" style={{ fontFamily: 'var(--font-body)' }}>{p.n}</b>
                  <span className="text-xs" style={{ color: 'var(--txt2)' }}>{p.d}</span>
                </div>
                <span className="font-mono font-bold px-3 shrink-0" style={{ color: 'var(--maiz)' }}>{e.no ? '—' : 'Bs ' + e.p}</span>
              </div>
            );
          }
          const ratio = tpl === 'panorama' ? 'aspect-video' : tpl === 'mosaico' ? 'aspect-square' : 'aspect-[5/4]';
          return (
            <div key={p.id} style={{ background: 'var(--humo)', opacity: e.no ? 0.5 : 1 }}>
              <div className={`relative ${ratio}`}>
                <img src={foto} alt="" className="absolute inset-0 w-full h-full object-cover" />
                {e.no && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1" style={{ background: 'var(--brasa)', color: '#fff' }}>AGOTADO</span>}
              </div>
              <div className="p-3 flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <b className="block font-medium" style={{ fontFamily: 'var(--font-body)' }}>{p.n}</b>
                  {!compacto && <span className="text-xs" style={{ color: 'var(--txt2)' }}>{p.d}</span>}
                </div>
                <span className="font-mono font-bold whitespace-nowrap" style={{ color: 'var(--maiz)' }}>{e.no ? '—' : 'Bs ' + e.p}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
