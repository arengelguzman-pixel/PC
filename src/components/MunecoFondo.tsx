import { useEffect, useRef } from 'react';
import { VIDEO_HERO } from '../config';

// Fondo fijo con el avatar (Visor Z). Tres videos, a sangre, detrás de los textos:
//   A "antes"   → loop nativo (clip ping-pong: termina donde empieza, sin salto)
//   B "cambio"  → una sola vez: tira el celular, se cambia, se enchufa, la Z se enciende
//   C "después" → loop nativo (ping-pong)
// Orden de capas (abajo → arriba): B, C, A. Todo fundido es de una capa OPACA sobre
// otra capa OPACA: nunca se ve el fondo a través. Nada se pausa con el scroll: el
// scroll solo decide qué capa se ve.
const CAMBIO_EN = 0.30;   // progreso del hero donde arranca la transformación
const RAMPA = 0.06;       // tramo de fundido A → B

export default function MunecoFondo() {
  const a = useRef<HTMLVideoElement>(null), b = useRef<HTMLVideoElement>(null), c = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const va = a.current, vb = b.current, vc = c.current;
    if (!va || !vb || !vc) return;
    let raf = 0, vivo = true;
    let fase: 'a' | 'b' | 'c' = 'a';
    const tocar = (v: HTMLVideoElement) => { if (v.paused) v.play().catch(() => {}); };
    const ocultar = (v: HTMLVideoElement) => { v.style.transition = 'none'; v.style.opacity = '0'; requestAnimationFrame(() => { v.style.transition = ''; }); };

    const aC = () => {
      fase = 'c';
      vc.currentTime = 0; tocar(vc);
      vc.style.opacity = '1';                              // C se funde ENCIMA de B (B sigue opaca debajo)
      setTimeout(() => { if (fase === 'c') vb.pause(); }, 1000);
    };
    const aB = () => {
      if (fase !== 'a') return;
      fase = 'b';
      vb.currentTime = 0; tocar(vb);                       // B debajo; A se va desvaneciendo encima
      vc.pause(); ocultar(vc);
    };
    const aA = () => {
      if (fase === 'a') return;
      fase = 'a';
      vb.pause(); vb.currentTime = 0;
      vc.pause(); ocultar(vc);
    };
    vb.addEventListener('ended', () => { if (fase === 'b') aC(); });

    const hero = () => (document.querySelector('[data-hero]') as HTMLElement | null)?.offsetHeight ?? window.innerHeight * 2.4;
    const loop = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(loop);
      const total = Math.max(1, hero() - window.innerHeight);
      const t = Math.max(0, Math.min(1, window.scrollY / total));
      const k = Math.max(0, Math.min(1, (t - CAMBIO_EN) / RAMPA));   // 0 = solo A · 1 = B/C
      va.style.opacity = String(1 - k);
      if (k > 0) aB(); else aA();
      if (k < 1) tocar(va); else va.pause();
    };
    loop();
    return () => { vivo = false; if (raf) cancelAnimationFrame(raf); va.pause(); vb.pause(); vc.pause(); };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, transform: 'translateZ(0)', contain: 'strict', background: '#A00C0D' }}>
      <video ref={b} src={VIDEO_HERO.cambio} muted playsInline preload="auto" className="capa-avatar" />
      <video ref={c} src={VIDEO_HERO.despues} muted playsInline loop preload="auto" className="capa-avatar" style={{ opacity: 0, transition: 'opacity 0.9s linear' }} />
      <video ref={a} src={VIDEO_HERO.antes} muted playsInline loop autoPlay preload="auto" poster="/video/avatar-antes.jpg" className="capa-avatar" style={{ opacity: 1, willChange: 'opacity' }} />
    </div>
  );
}
