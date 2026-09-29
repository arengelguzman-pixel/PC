import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { PLATOS } from '../config';
import { cartaGet, cartaPost, type DatosCarta } from '../lib/carta';

const TIPOS = [
  { v: 'Comida cruceña y rápida', b: 'Comida cruceña y rápida · Montero' },
  { v: 'Hamburguesas y rápidas', b: 'Hamburguesas, rápidas y delivery · Montero' },
  { v: 'Pollos a la brasa / broaster', b: 'Pollos a la brasa y broaster · Montero' },
  { v: 'Almuerzos caseros', b: 'Almuerzo casero cruceño · Montero' },
  { v: 'Pizzería', b: 'Pizzas al horno · Montero' },
];

const slugify = (v: string) => v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

// Clave legible: sin caracteres confundibles (0/O, 1/l/I).
function generarClave(n = 8): string {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  for (let i = 0; i < n; i++) s += abc[buf[i] % abc.length];
  return s;
}

export default function Nuevo() {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [idManual, setIdManual] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState<{ local: string; clave: string } | null>(null);
  const [copiado, setCopiado] = useState('');
  const [qr, setQr] = useState('');
  const qrCanvas = useRef<HTMLCanvasElement>(null);

  const slug = useMemo(() => idManual ? slugify(idManual) : slugify(nombre), [idManual, nombre]);

  const origen = location.origin;
  const linkPublico = hecho ? `${origen}/?r=${hecho.local}` : '';
  const linkAdmin = hecho ? `${origen}/?r=${hecho.local}#k=${hecho.clave}` : '';

  // Generar QR del link público cuando se crea
  useEffect(() => {
    if (!linkPublico) return;
    QRCode.toDataURL(linkPublico, { width: 640, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } })
      .then(setQr).catch(() => setQr(''));
    if (qrCanvas.current) QRCode.toCanvas(qrCanvas.current, linkPublico, { width: 220, margin: 2 }).catch(() => {});
  }, [linkPublico]);

  const crear = async () => {
    setError('');
    if (!nombre.trim()) return setError('Escribe el nombre del restaurante.');
    if (!slug) return setError('Ese nombre no deja armar un identificador. Escribe uno a mano.');
    setCreando(true);
    try {
      const prev = await cartaGet(slug);
      if (prev.ok && prev.existe) { setCreando(false); return setError(`Ya existe una carta con "${slug}". Cambia el identificador a mano.`); }
      const clave = generarClave();
      const datos: DatosCarta = {
        v: 1, nombre: nombre.trim(), bajada: tipo.b, logo: '', look: 'brasa', color: '',
        platos: PLATOS.map((p) => ({ id: p.id, p: p.p, no: p.no })),
      };
      const j = await cartaPost(slug, clave, datos);
      setCreando(false);
      if (!j.ok) {
        const m = ({ sin_deposito: 'Este sitio todavía no tiene dónde guardar las cartas (falta el KV).', red: 'Se cortó la conexión. Revisa tu wifi.' } as Record<string, string>)[j.causa || ''] || j.msg || 'No se pudo crear. Prueba de nuevo.';
        return setError(m);
      }
      setHecho({ local: slug, clave });
    } catch {
      setCreando(false);
      setError('No se pudo crear. Prueba de nuevo.');
    }
  };

  const copiar = (txt: string, cual: string) => {
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
      .then(() => { setCopiado(cual); window.setTimeout(() => setCopiado(''), 1600); })
      .catch(() => { });
  };

  const descargarQR = () => {
    if (!qr) return;
    const a = document.createElement('a');
    a.download = `qr-${hecho?.local}.png`;
    a.href = qr; a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-crema">
      <header className="sticky top-0 z-40 bg-carbon border-b-4 border-lima px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-press-start text-[11px] text-lima">MEZA</a>
        <span className="font-press-start text-[8px] text-crema/60 tracking-widest uppercase">Alta de local</span>
      </header>

      <div className="max-w-xl mx-auto px-5 py-8">
        {!hecho ? (
          <>
            <span className="font-press-start text-[9px] bg-lima text-carbon px-3 py-2 tracking-widest">✱ NUEVO CLIENTE</span>
            <h1 className="font-press-start text-lima text-xl sm:text-2xl leading-tight mt-5 uppercase">Deja la carta<br /><span className="text-crema">andando en 5 minutos.</span></h1>
            <p className="mt-4 text-crema/80">Pon el nombre del local y crea la carta. Te da el link para las mesas, el QR para imprimir y el link de administración con la clave. Todo de una.</p>

            <div className="mt-8">
              <label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Nombre del restaurante</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Pollos Doña Elsa" className={inputCls} />
            </div>

            <div className="mt-5">
              <label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Qué vende</label>
              <div className="flex gap-2 flex-wrap">
                {TIPOS.map((t) => (
                  <button key={t.v} onClick={() => setTipo(t)} className={`text-sm px-3.5 py-3 border-2 ${t.v === tipo.v ? 'bg-carbon text-lima border-lima' : 'bg-black/20 text-crema/70 border-crema/25'}`}>{t.v}</button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="block font-press-start text-[8px] text-crema/60 tracking-widest uppercase mb-2">Identificador (va en el link)</label>
              <input value={idManual} onChange={(e) => setIdManual(e.target.value)} placeholder={slug || 'pollos-dona-elsa'} className={`${inputCls} font-mono`} />
              <p className="text-xs text-crema/50 mt-2 font-mono break-all">{origen}/?r={slug || '…'}</p>
            </div>

            {error && <p className="mt-5 bg-maiz text-carbon border-[3px] border-carbon p-3.5 text-sm font-medium">{error}</p>}

            <button onClick={crear} disabled={creando} className="mt-8 w-full font-press-start text-[11px] text-carbon bg-lima border-[3px] border-carbon py-5 shadow-[5px_5px_0_var(--color-azul)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer disabled:opacity-60">
              {creando ? 'Creando…' : 'Crear la carta ▸'}
            </button>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="font-press-start text-4xl text-lima animate-bounce">✦</div>
              <h1 className="font-press-start text-lima text-lg sm:text-xl mt-4 uppercase">Carta creada</h1>
              <p className="mt-3 text-crema/80">{nombre} ya tiene su carta. Guarda estos datos — la clave no se vuelve a mostrar.</p>
            </div>

            {/* Clave */}
            <div className="mt-8 border-[3px] border-brasa bg-carbon p-4">
              <div className="font-press-start text-[8px] text-brasa tracking-widest uppercase">Clave de edición (guárdala)</div>
              <div className="flex items-center justify-between gap-3 mt-2">
                <code className="font-mono font-bold text-2xl text-crema tracking-widest">{hecho.clave}</code>
                <button onClick={() => copiar(hecho.clave, 'clave')} className="font-press-start text-[8px] text-crema border-2 border-crema/40 px-3 py-2.5 uppercase cursor-pointer shrink-0">{copiado === 'clave' ? '✓' : 'Copiar'}</button>
              </div>
            </div>

            {/* Links */}
            <LinkCaja titulo="Link de administración (para el dueño)" valor={linkAdmin} onCopy={() => copiar(linkAdmin, 'admin')} copiado={copiado === 'admin'} />
            <LinkCaja titulo="Link público (va en el QR de la mesa)" valor={linkPublico} onCopy={() => copiar(linkPublico, 'pub')} copiado={copiado === 'pub'} />

            {/* QR */}
            <div className="mt-6 border-[3px] border-lima bg-crema p-5 flex flex-col items-center">
              <canvas ref={qrCanvas} className="w-[220px] h-[220px]" />
              <p className="font-press-start text-[8px] text-carbon tracking-widest uppercase mt-4 text-center">Escanéalo y llega a la carta</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
              <button onClick={descargarQR} className="font-press-start text-[9px] text-carbon bg-lima border-[3px] border-carbon py-4 uppercase tracking-wider cursor-pointer">Descargar QR ▸</button>
              <a href={linkAdmin} className="font-press-start text-[9px] text-crema border-2 border-crema/50 py-4 text-center uppercase tracking-wider">Abrir el panel ▸</a>
            </div>

            <button onClick={() => { setHecho(null); setNombre(''); setIdManual(''); setQr(''); }} className="mt-6 w-full font-press-start text-[9px] text-crema/70 border-2 border-crema/25 py-3.5 uppercase tracking-wider cursor-pointer">＋ Dar de alta otro local</button>
          </>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-carbon border-2 border-crema/30 focus:border-lima outline-none text-crema p-4';

function LinkCaja({ titulo, valor, onCopy, copiado }: { titulo: string; valor: string; onCopy: () => void; copiado: boolean }) {
  return (
    <div className="mt-4">
      <div className="font-press-start text-[8px] text-lima tracking-widest uppercase mb-2">{titulo}</div>
      <div className="flex items-stretch gap-2">
        <div className="flex-1 font-mono text-xs text-crema/85 bg-carbon border-2 border-crema/20 p-3 break-all">{valor}</div>
        <button onClick={onCopy} className="font-press-start text-[8px] text-carbon bg-lima border-2 border-carbon px-3 uppercase cursor-pointer shrink-0">{copiado ? '✓' : 'Copiar'}</button>
      </div>
    </div>
  );
}
