import { useEffect, useRef, useState } from 'react';
import type { Tamano } from '../../afiliados/elGaraje';
import { registrarClave, guardarClave } from '../../lib/pedidos';

// Piezas compartidas por las vistas del afiliado (Cliente / Cocina / Caja).

export const precioDe = (t: Tamano, borde: boolean) => (borde && t.borde ? t.borde : t.p);

export function Foto({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => { const el = ref.current; if (el && el.complete && el.naturalWidth > 0) setOk(true); }, [src]);
  return <img ref={ref} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setOk(true)} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ok ? 'opacity-100' : 'opacity-0'}`} />;
}

export function Agotada() {
  return <span className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-1 rounded-full bg-black/85 text-white tracking-wide">AGOTADA</span>;
}

// Hoja inferior (bottom sheet) para la vista del cliente.
export function Hoja({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-lg bg-[#161616] rounded-t-3xl border-t border-white/10 max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="w-11 h-1.5 rounded-full bg-white/20 mx-auto mt-3 mb-1" />
        {children}
      </div>
    </div>
  );
}

// --- Sonido: bip (WebAudio) + voz (MP3 de ElevenLabs en /public/voz) ---
// iPhone/Android solo dejan sonar audio que se "desbloqueó" dentro de un toque del
// usuario. Por eso hay UN solo <audio> y UN solo AudioContext, que se crean y arrancan
// en `desbloquearSonido()` (lo llama el primer toque en la pantalla, la puerta de
// clave y el botón "Activar sonido"). Después, voz() y beep() los reutilizan.
let audioVoz: HTMLAudioElement | null = null;
let ctxBeep: AudioContext | null = null;
let sonidoListo = false;
const oyentes = new Set<(ok: boolean) => void>();

export function desbloquearSonido() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxBeep) ctxBeep = new AC();
    if (ctxBeep.state === 'suspended') ctxBeep.resume().catch(() => {});
    if (!audioVoz) { audioVoz = new Audio(); audioVoz.preload = 'auto'; }
    audioVoz.src = '/voz/silencio.mp3'; audioVoz.volume = 1;
    audioVoz.play().then(() => { sonidoListo = true; oyentes.forEach((f) => f(true)); }).catch(() => {});
  } catch { /* sin audio */ }
}
export const haySonido = () => sonidoListo;

// true cuando el audio ya se desbloqueó en esta carga; el primer toque en la pantalla lo intenta solo
export function useSonidoListo(): [boolean, () => void] {
  const [listo, setListo] = useState(sonidoListo);
  useEffect(() => {
    oyentes.add(setListo);
    const primero = () => desbloquearSonido();
    document.addEventListener('click', primero, { once: true });
    document.addEventListener('touchend', primero, { once: true });
    return () => { oyentes.delete(setListo); document.removeEventListener('click', primero); document.removeEventListener('touchend', primero); };
  }, []);
  return [listo, desbloquearSonido];
}

// Aviso fijo abajo mientras el sonido no esté activo (cocina/caja).
export function AvisoSonido() {
  const [listo, activar] = useSonidoListo();
  if (listo) return null;
  return (
    <button onClick={activar} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[96] w-[94%] max-w-lg bg-lima text-negro border-[3px] border-negro shadow-[6px_6px_0_var(--color-rojo)] px-4 py-3.5 flex items-center gap-3 text-left">
      <span className="text-2xl">🔈</span>
      <span className="font-press-start text-[9px] leading-relaxed tracking-wide">TOCA AQUÍ PARA ACTIVAR EL SONIDO Y LA VOZ</span>
    </button>
  );
}

// Bip corto. Usa el AudioContext desbloqueado; si no existe, intenta crear uno.
export function beep(tono = 880, dur = 0.24) {
  try {
    if (!ctxBeep) { const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; ctxBeep = new AC(); }
    const ctx = ctxBeep; if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); g.gain.value = 0.07; o.type = 'square';
    o.frequency.setValueAtTime(tono, ctx.currentTime); o.frequency.setValueAtTime(tono * 1.5, ctx.currentTime + dur / 2);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* sin audio */ }
}

// Voz: `mesa` 1–10 tiene su propio clip; cualquier otra cosa usa el genérico.
export function voz(tipo: 'comanda' | 'comprobante', mesa?: string) {
  try {
    const n = Number(mesa);
    const src = `/voz/${tipo}${n >= 1 && n <= 10 && Number.isInteger(n) ? `-mesa-${n}` : ''}.mp3`;
    if (!audioVoz) { audioVoz = new Audio(); audioVoz.preload = 'auto'; }
    audioVoz.src = src; audioVoz.volume = 1;
    audioVoz.play().catch(() => { /* bloqueado hasta que el usuario toque la pantalla */ });
  } catch { /* sin audio */ }
}

// Puerta de clave de personal (cocina/caja): registra la primera vez, valida después.
export function PuertaClave({ local, onOk }: { local: string; onOk: (clave: string) => void }) {
  const [c, setC] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);
  const entrar = async () => {
    desbloquearSonido();   // el toque en "Entrar" habilita bip y voz en iPhone/Android
    setErr(''); setCargando(true);
    const r = await registrarClave(local, c.trim());
    setCargando(false);
    if (!r.ok) return setErr(r.msg || 'No se pudo validar la clave.');
    guardarClave(local, c.trim()); onOk(c.trim());
  };
  return (
    <div className="min-h-[70vh] grid place-items-center px-6">
      <div className="w-full max-w-sm border-[3px] border-lima bg-carbon p-6">
        <p className="font-press-start text-[9px] text-lima tracking-widest uppercase">Personal del local</p>
        <p className="text-sm text-crema/70 mt-3">Escribe la clave de personal. La primera vez que se usa, queda registrada para este local.</p>
        <input value={c} onChange={(e) => setC(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && entrar()} type="password" inputMode="numeric" placeholder="Clave" className="mt-4 w-full bg-negro border-2 border-crema/30 focus:border-lima outline-none text-crema p-3.5 text-lg tracking-widest" />
        {err && <p className="mt-2 text-sm text-brasa">{err}</p>}
        <button onClick={entrar} disabled={cargando || c.trim().length < 4} className="mt-4 w-full font-press-start text-[10px] text-carbon bg-lima border-[3px] border-negro py-4 uppercase tracking-widest disabled:opacity-40">{cargando ? 'Validando…' : 'Entrar ▸'}</button>
      </div>
    </div>
  );
}

// Indicador de conexión en tiempo real (esquina de cocina/caja).
export function Conexion({ ok }: { ok: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${ok ? 'text-lima' : 'text-brasa'}`}><span className={`w-2 h-2 rounded-full ${ok ? 'bg-lima' : 'bg-brasa animate-pulse'}`} />{ok ? 'en vivo' : 'reconectando…'}</span>;
}
