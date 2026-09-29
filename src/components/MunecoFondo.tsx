import { useEffect, useRef } from 'react';
import type HlsType from 'hls.js';
import { VIDEO_HERO } from '../config';

// Fondo fijo con el muñeco encapuchado. Los videos REPRODUCEN en loop (suave,
// sin trabas) y el scroll solo controla CUÁL se ve (crossfade por opacidad).
//
// Cada clip vive en DOS <video>: cuando el que se ve está por terminar, el otro
// arranca desde 0 y se funden FUNDIDO segundos. Así el loop no "salta" — los
// clips no eran loops perfectos y el corte se notaba, sobre todo con el skater.
const FUNDIDO = 0.9;

type Capa = { play(): void; pause(): void; destroy(): void };

function crearCapa(Hls: typeof HlsType, url: string, ea: HTMLVideoElement, eb: HTMLVideoElement): Capa {
  const hls: HlsType[] = [];
  for (const v of [ea, eb]) {
    if (Hls.isSupported()) { const h = new Hls({ maxBufferLength: 20 }); h.loadSource(url); h.attachMedia(v); hls.push(h); }
    else if (v.canPlayType('application/vnd.apple.mpegurl')) v.src = url;
    v.style.transition = `opacity ${FUNDIDO}s linear`;
  }
  let activo = ea, otro = eb, sonando = false, fundiendo = false;
  const alTiempo = (e: Event) => {
    const v = e.target as HTMLVideoElement;
    if (!sonando || fundiendo || v !== activo || !v.duration || v.duration - v.currentTime > FUNDIDO) return;
    fundiendo = true;
    otro.currentTime = 0;
    otro.play().catch(() => {});
    otro.style.opacity = '1';
    v.style.opacity = '0';
    setTimeout(() => {
      v.pause(); v.currentTime = 0;
      const t = activo; activo = otro; otro = t;
      fundiendo = false;
    }, FUNDIDO * 1000 + 80);
  };
  // Si llegó al final sin fundir (pestaña dormida, etc.) reinicia sin cortar.
  const alFin = (e: Event) => { const v = e.target as HTMLVideoElement; if (v === activo && sonando) { v.currentTime = 0; v.play().catch(() => {}); } };
  for (const v of [ea, eb]) { v.addEventListener('timeupdate', alTiempo); v.addEventListener('ended', alFin); }
  return {
    play() { sonando = true; activo.play().catch(() => {}); if (fundiendo) otro.play().catch(() => {}); },
    pause() { sonando = false; activo.pause(); otro.pause(); },
    destroy() { hls.forEach((h) => h.destroy()); },
  };
}

export default function MunecoFondo() {
  const wA = useRef<HTMLDivElement>(null);
  const wB = useRef<HTMLDivElement>(null);
  const a1 = useRef<HTMLVideoElement>(null), a2 = useRef<HTMLVideoElement>(null);
  const b1 = useRef<HTMLVideoElement>(null), b2 = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const A = wA.current, B = wB.current;
    if (!A || !B || !a1.current || !a2.current || !b1.current || !b2.current) return;
    let raf = 0, vivo = true;
    let capaA: Capa | null = null, capaB: Capa | null = null;
    let modo = ''; // 'a' | 'b' | 'both'

    import('hls.js').then(({ default: Hls }) => {
      if (!vivo) return;
      capaA = crearCapa(Hls, VIDEO_HERO.uno, a1.current!, a2.current!);
      capaB = crearCapa(Hls, VIDEO_HERO.dos, b1.current!, b2.current!);
      modo = '';
    });

    // Solo opacidad por scroll (el video ya reproduce solo): cero seeks, fluido.
    // Pausamos la capa que NO se ve: decodificar todo a la vez era lo que trababa.
    const aplicarModo = (m: string) => {
      if (m === modo || !capaA || !capaB) return;
      modo = m;
      if (m === 'a') { capaA.play(); capaB.pause(); }
      else if (m === 'b') { capaB.play(); capaA.pause(); }
      else { capaA.play(); capaB.play(); }
    };
    const loop = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(loop);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const prog = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
      A.style.opacity = prog > 0.5 ? '0' : '1';
      B.style.opacity = String(prog < 0.45 ? 0 : prog > 0.5 ? 1 : (prog - 0.45) / 0.05);
      aplicarModo(prog > 0.44 && prog < 0.51 ? 'both' : prog >= 0.51 ? 'b' : 'a');
    };
    loop();
    return () => { vivo = false; if (raf) cancelAnimationFrame(raf); capaA?.destroy(); capaB?.destroy(); };
  }, []);

  const video = (ref: React.RefObject<HTMLVideoElement | null>, visible: boolean) => (
    <video ref={ref} muted playsInline preload="auto" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: visible ? 1 : 0, willChange: 'opacity' }} />
  );
  return (
    <div className="fixed inset-0 overflow-hidden bg-negro" style={{ zIndex: 0, transform: 'translateZ(0)', contain: 'strict' }}>
      <div ref={wA} className="absolute inset-0" style={{ opacity: 1, willChange: 'opacity' }}>{video(a1, true)}{video(a2, false)}</div>
      <div ref={wB} className="absolute inset-0" style={{ opacity: 0, willChange: 'opacity' }}>{video(b1, true)}{video(b2, false)}</div>
    </div>
  );
}
