import { useEffect, useRef, useState } from 'react';
import { BEFORE_AFTER, HERO_FRASES, MANIFIESTO, MARCA } from '../config';
import Marquee from './Marquee';

// Título que se "desescribe" con el scroll (adaptación del typewriter del spec).
const TITULO = HERO_FRASES[0]; // "¿PLATO SIN VIDA?"

export default function ScrollHero({ onProbar }: { onProbar: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const done = -r.top;
      setP(Math.max(0, Math.min(1, total > 0 ? done / total : 0)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // --- reel de fondo: recorre los pares antes/después con el scroll ---
  const pares = BEFORE_AFTER;
  const reel = Math.min(0.55, p) / 0.55;                 // el fondo transforma en el primer 55%
  const idxF = reel * (pares.length - 1);
  const idx = Math.min(pares.length - 1, Math.floor(idxF));
  const frac = idxF - idx;                                // 0..1 dentro del par: antes→después
  const par = pares[idx];

  // --- borrado del título (0 .. 0.22) ---
  const activo = Math.min(p, 0.22) / 0.22;
  const visibles = Math.round((1 - activo) * TITULO.length);
  const texto = TITULO.slice(0, visibles);

  // --- manifiesto rodante (empieza en 0.30) ---
  const inicio = 0.30;
  const alpha = p > inicio ? (p - inicio) / (1 - inicio) : 0;
  const manifOpacity = Math.min(1, alpha / 0.05);
  const manifY = 100 - alpha * 420; // de +100vh a -320vh

  return (
    <div ref={wrap} className="relative h-[420vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-carbon">

        {/* Reel de fondo (antes/después que cobra vida) */}
        <div className="absolute inset-0">
          <img src={par.antes} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 1 }} />
          <img src={par.despues} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: frac }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/85" />
          <div className="absolute inset-0 bg-carbon" style={{ opacity: alpha > 0 ? Math.min(0.72, alpha * 1.4) : 0 }} />
        </div>

        {/* Cinta diagonal (vive en el hero: se va con el scroll) */}
        <Marquee variant="diag" />

        {/* Navegación */}
        <nav className="absolute top-8 right-6 md:right-14 z-50 flex gap-5 md:gap-9 font-press-start text-[9px] sm:text-[11px] text-white">
          <a href="#probar" className="hover:text-lima transition-colors">Probar</a>
          <a href="#menu" className="hover:text-lima transition-colors">Menú</a>
          <a href="#redes" className="hover:text-lima transition-colors">Redes</a>
          <a href="#contacto" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); }} className="hover:text-lima transition-colors">Contacto</a>
        </nav>

        {/* Título que se desescribe */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end p-6 md:p-16 pb-24 sm:pb-28">
          <span className="font-press-start text-[9px] sm:text-[11px] text-carbon bg-maiz self-start px-3 py-2 tracking-widest mb-5">
            {MARCA.nombre} ✱ MONTERO 2026
          </span>
          <h1 className="font-press-start text-lima text-2xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.25] tracking-tight uppercase max-w-4xl">
            {texto}
            <span className="inline-block w-[0.14em] h-[0.8em] bg-lima ml-1 align-middle cursor-parp" />
          </h1>
          <p className="mt-6 max-w-md text-crema/90 text-base sm:text-lg font-body">
            Tu comida ya es buena. Ahora que se vea así — con la foto que ya tienes.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md pointer-events-auto">
            <button
              onClick={onProbar}
              className="font-press-start text-[10px] sm:text-xs text-carbon bg-lima border-[3px] border-carbon py-4 px-6 shadow-[5px_5px_0_var(--color-azul)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer"
            >
              📷 Sube tu foto ▸
            </button>
            <a
              href="#menu"
              className="font-press-start text-[10px] sm:text-xs text-crema border-2 border-crema/50 py-4 px-6 text-center hover:border-lima hover:text-lima transition-colors uppercase tracking-widest"
            >
              Ver el menú
            </a>
          </div>
        </div>

        {/* Manifiesto rodante */}
        <div
          className="absolute top-0 left-0 w-full md:w-[72%] h-screen z-20 pointer-events-none flex flex-col justify-start p-6 md:p-16 pt-[12vh]"
          style={{ opacity: manifOpacity, transform: `translateY(${manifY}vh)` }}
        >
          <div className="font-press-start text-lima text-[18px] sm:text-[24px] md:text-[30px] leading-[1.4] tracking-tight uppercase whitespace-pre-line">
            {MANIFIESTO}
          </div>
        </div>

        {/* Pista de scroll */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 font-press-start text-[8px] text-lima/70 tracking-widest transition-opacity"
          style={{ opacity: p > 0.04 ? 0 : 1 }}
        >
          ▾ DESLIZA
        </div>
      </div>
    </div>
  );
}
