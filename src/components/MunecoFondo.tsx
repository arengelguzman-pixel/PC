import { useEffect, useRef } from 'react';
import { VIDEO_HERO } from '../config';

// Fondo fijo con el avatar. Tres capas de video:
//   A "antes"   → loop: Z apagada, con el celular, confundido.
//   B "cambio"  → una sola vez: tira el celular, se cambia, se enchufa, la Z se enciende.
//   C "después" → loop: Z encendida, seguro.
// Nada se pausa con el scroll: los loops corren siempre; el scroll solo decide
// qué capa se ve (crossfade). Al terminar B, se funde solo a C.
// Cada loop vive en DOS <video> que se funden al reiniciar (loop sin salto).
const FUNDIDO = 0.9;      // s de cruce al reiniciar un loop
const CAMBIO_EN = 0.30;   // progreso del hero donde arranca la transformación
const RAMPA = 0.06;       // tramo de fundido A → B

type Capa = { play(): void; pause(): void; reset(): void };

function cargar(v: HTMLVideoElement, url: string) {
  v.src = url; v.load();
}

function crearLoop(url: string, ea: HTMLVideoElement, eb: HTMLVideoElement): Capa {
  for (const v of [ea, eb]) { cargar(v, url); v.style.transition = `opacity ${FUNDIDO}s linear`; }
  let activo = ea, otro = eb, sonando = false, fundiendo = false;
  const alTiempo = (e: Event) => {
    const v = e.target as HTMLVideoElement;
    if (!sonando || fundiendo || v !== activo || !v.duration || v.duration - v.currentTime > FUNDIDO) return;
    fundiendo = true;
    otro.currentTime = 0; otro.play().catch(() => {});
    otro.style.opacity = '1'; v.style.opacity = '0';
    setTimeout(() => { v.pause(); v.currentTime = 0; const t = activo; activo = otro; otro = t; fundiendo = false; }, FUNDIDO * 1000 + 80);
  };
  const alFin = (e: Event) => { const v = e.target as HTMLVideoElement; if (v === activo && sonando) { v.currentTime = 0; v.play().catch(() => {}); } };
  for (const v of [ea, eb]) { v.addEventListener('timeupdate', alTiempo); v.addEventListener('ended', alFin); }
  return {
    play() { sonando = true; activo.play().catch(() => {}); if (fundiendo) otro.play().catch(() => {}); },
    pause() { sonando = false; activo.pause(); otro.pause(); },
    reset() {},
  };
}

export default function MunecoFondo() {
  const wA = useRef<HTMLDivElement>(null), wB = useRef<HTMLDivElement>(null), wC = useRef<HTMLDivElement>(null);
  const a1 = useRef<HTMLVideoElement>(null), a2 = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const c1 = useRef<HTMLVideoElement>(null), c2 = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const A = wA.current, B = wB.current, C = wC.current, vb = b.current;
    if (!A || !B || !C || !vb || !a1.current || !a2.current || !c1.current || !c2.current) return;
    let raf = 0, vivo = true;
    const capaA = crearLoop(VIDEO_HERO.antes, a1.current, a2.current);
    const capaC = crearLoop(VIDEO_HERO.despues, c1.current, c2.current);
    cargar(vb, VIDEO_HERO.cambio);
    B.style.transition = 'opacity 0.9s linear'; C.style.transition = 'opacity 0.9s linear';

    let fase: 'a' | 'b' | 'c' = 'a';
    let bTerminada = false;
    const aFaseB = () => {
      if (fase === 'b') return;
      fase = 'b';
      if (bTerminada) { aFaseC(); return; }
      vb.currentTime = 0; vb.play().catch(() => {});
      B.style.opacity = '1'; C.style.opacity = '0';
      capaC.pause();
    };
    const aFaseC = () => {
      fase = 'c'; bTerminada = true;
      capaC.play();
      C.style.opacity = '1';
      setTimeout(() => { if (fase === 'c') { B.style.opacity = '0'; vb.pause(); } }, 950);
    };
    const aFaseA = () => {
      if (fase === 'a') return;
      fase = 'a'; bTerminada = false;
      vb.pause(); vb.currentTime = 0; B.style.opacity = '0'; C.style.opacity = '0';
      capaC.pause();
    };
    vb.addEventListener('ended', () => { if (fase === 'b') aFaseC(); });

    const hero = () => (document.querySelector('[data-hero]') as HTMLElement | null)?.offsetHeight ?? window.innerHeight * 2.4;
    const loop = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(loop);
      const total = Math.max(1, hero() - window.innerHeight);
      const t = Math.max(0, Math.min(1, window.scrollY / total));
      const k = Math.max(0, Math.min(1, (t - CAMBIO_EN) / RAMPA)); // 0 = solo A, 1 = solo B/C
      A.style.opacity = String(1 - k);
      if (k > 0) { if (fase === 'a') aFaseB(); } else aFaseA();
      if (k < 1) capaA.play(); else capaA.pause();
    };
    loop();
    return () => { vivo = false; if (raf) cancelAnimationFrame(raf); capaA.pause(); capaC.pause(); vb.pause(); };
  }, []);

  const video = (ref: React.RefObject<HTMLVideoElement | null>, visible: boolean, poster?: string) => (
    <video ref={ref} muted playsInline preload="auto" poster={poster} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: visible ? 1 : 0, willChange: 'opacity' }} />
  );
  return (
    <div className="fixed inset-0 overflow-hidden"  style={{ zIndex: 0, transform: 'translateZ(0)', contain: 'strict', background: '#A00C0D' }}>
      <div ref={wC} className="capa-avatar" style={{ opacity: 0 }}>{video(c1, true)}{video(c2, false)}</div>
      <div ref={wB} className="capa-avatar" style={{ opacity: 0 }}>{video(b, true)}</div>
      <div ref={wA} className="capa-avatar" style={{ opacity: 1, willChange: 'opacity' }}>{video(a1, true, '/video/avatar-antes.jpg')}{video(a2, false)}</div>
    </div>
  );
}
