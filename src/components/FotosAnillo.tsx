import { useEffect, useRef, useState } from 'react';
import { BEFORE_AFTER } from '../config';
import BeforeAfter from './BeforeAfter';
import Reveal from './Reveal';

// Técnica "anillo de tarjetas" (Vertex Hologramas, #22 del catálogo Retro Global):
// las fotos giran en un anillo 3D que se arrastra con inercia y gira solo cuando
// nadie lo toca. La tarjeta del frente es la activa: su comparador antes/después se
// desliza con el dedo. La última tarjeta del anillo es "+" (sube tu foto).
const N = BEFORE_AFTER.length + 1;
const PASO = 360 / N;

export default function FotosAnillo({ onSubir }: { onSubir: () => void }) {
  const anillo = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(0);
  const [w, setW] = useState(280);
  const est = useRef({ ang: 0, vel: 0, arrastrando: false, x0: 0, ang0: 0, ultimoX: 0, quietoDesde: 0 });

  useEffect(() => {
    const medir = () => setW(window.innerWidth < 640 ? 230 : 280);
    medir(); window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  useEffect(() => {
    const el = anillo.current; if (!el) return;
    let raf = 0, vivo = true;
    const paso = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(paso);
      const s = est.current;
      if (!s.arrastrando) {
        s.ang += s.vel; s.vel *= 0.94;
        if (Math.abs(s.vel) < 0.02) { s.vel = 0; if (performance.now() - s.quietoDesde > 2500) s.ang -= 0.07; } // giro lento en reposo
      }
      el.style.transform = `rotateY(${s.ang}deg)`;
      const frente = ((Math.round(-s.ang / PASO) % N) + N) % N;
      setActiva((p) => (p === frente ? p : frente));
      Array.from(el.children).forEach((h, i) => {
        const rel = ((((i * PASO + s.ang) % 360) + 540) % 360) - 180;       // ángulo respecto al frente (−180..180)
        const c = Math.cos((rel * Math.PI) / 180);
        const op = Math.max(0, Math.min(1, (c + 0.25) / 1.1));
        const e = h as HTMLElement;
        e.style.opacity = String(op);
        e.style.visibility = op <= 0 ? 'hidden' : 'visible';
        e.style.pointerEvents = Math.abs(rel) < PASO / 2 ? 'auto' : 'none';
      });
    };
    paso();
    return () => { vivo = false; cancelAnimationFrame(raf); };
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = est.current; s.arrastrando = true; s.x0 = s.ultimoX = e.clientX; s.ang0 = s.ang; s.vel = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = est.current; if (!s.arrastrando) return;
    s.vel = (e.clientX - s.ultimoX) * 0.3; s.ultimoX = e.clientX;
    s.ang = s.ang0 + (e.clientX - s.x0) * 0.3;
  };
  const onUp = () => { const s = est.current; s.arrastrando = false; s.quietoDesde = performance.now(); };
  const parar = (e: React.PointerEvent) => { e.stopPropagation(); est.current.vel = 0; est.current.quietoDesde = performance.now() + 6000; };

  const R = Math.round((w / 2) / Math.tan(Math.PI / N) * 1.18);
  const alto = w + 60;

  return (
    <section id="fotos" className="bg-rojo/50 py-16 md:py-20 overflow-hidden">
      <Reveal className="max-w-5xl mx-auto px-6">
        <span className="font-press-start text-[9px] bg-maiz text-negro px-3 py-2 tracking-widest">✱ FOTOS CON IA</span>
        <h2 className="font-press-start text-lima text-xl sm:text-3xl md:text-4xl leading-tight mt-5 uppercase" style={{ textShadow: '3px 3px 0 var(--color-negro)' }}>
          La misma comida.<br /><span className="text-crema">Otra foto.</span>
        </h2>
        <p className="mt-4 text-crema/90 max-w-lg">Mismo plato, misma porción. Solo arreglamos la luz y limpiamos el fondo.</p>
      </Reveal>

      <div className="anillo-escena mt-8" style={{ height: alto, ['--w' as string]: `${w}px` }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div ref={anillo} className="anillo">
          {BEFORE_AFTER.map((par, i) => (
            <div key={i} className="anillo-tarjeta" style={{ transform: `rotateY(${i * PASO}deg) translateZ(${R}px)` }} onPointerDown={i === activa ? parar : undefined}>
              <BeforeAfter antes={par.antes} despues={par.despues} etAntes="ANTES" etDespues="MEZA" small className={`!border-negro shadow-[6px_6px_0_var(--color-negro)] ${i === activa ? '' : 'pointer-events-none'}`} />
            </div>
          ))}
          <div className="anillo-tarjeta" style={{ transform: `rotateY(${BEFORE_AFTER.length * PASO}deg) translateZ(${R}px)` }} onPointerDown={activa === BEFORE_AFTER.length ? parar : undefined}>
            <button onClick={onSubir} className="w-full aspect-square border-[3px] border-dashed border-crema/80 bg-black/30 hover:bg-lima/15 hover:border-lima transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer shadow-[6px_6px_0_var(--color-negro)]">
              <span className="font-press-start text-5xl text-lima leading-none">+</span>
              <span className="font-press-start text-[9px] text-crema uppercase tracking-widest text-center leading-relaxed">Sube tu<br />foto</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
        <p className="font-mono text-[11px] text-crema/60 tracking-wide">◂ ARRASTRA PARA GIRAR · MUEVE LA LÍNEA DE LA FOTO DEL FRENTE ▸</p>
        <button onClick={onSubir} className="font-press-start text-[10px] sm:text-[11px] text-crema bg-negro border-[3px] border-negro py-4 px-7 shadow-[5px_5px_0_var(--color-lima)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer sm:ml-auto">
          📷 Probar con mi foto ▸
        </button>
      </div>
    </section>
  );
}
