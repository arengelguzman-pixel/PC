import { useEffect, useRef, useState } from 'react';
import { ESTUDIO_URL, HERO_FRASES, MANIFIESTO } from '../config';
import LogoMeza from './LogoMeza';

// Título que se "desescribe" con el scroll (typewriter del spec).
const TITULO = HERO_FRASES[0];

// El fondo (muñeco) lo pone MunecoFondo, fijo detrás de todo. El hero es
// transparente y solo superpone texto + degradados de legibilidad.
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
      setP(Math.max(0, Math.min(1, total > 0 ? -r.top / total : 0)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // borrado del título (0 .. 0.22)
  const activo = Math.min(p, 0.22) / 0.22;
  const texto = TITULO.slice(0, Math.round((1 - activo) * TITULO.length));

  // manifiesto rodante (0.30 → 1): sube de 100vh a -100vh
  const inicio = 0.30;
  const alpha = p > inicio ? (p - inicio) / (1 - inicio) : 0;
  const manifOpacity = Math.min(1, alpha / 0.05);
  const manifY = 100 - alpha * 200;
  const foco = alpha > 0 ? Math.max(0, 1 - Math.abs(manifY - 8) / 95) : 0;

  return (
    <div ref={wrap} data-hero className="relative h-[170vh] md:h-[240vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Degradados de legibilidad sobre el muñeco (fondo fijo detrás) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/80" />
        <div className="absolute inset-0 bg-negro" style={{ opacity: foco * 0.6 }} />

        {/* Logo + navegación */}
        <a href="/" className="absolute top-6 left-6 md:left-14 z-50" aria-label="MEZA"><span className="md:hidden"><LogoMeza alto={22} /></span><span className="hidden md:inline"><LogoMeza alto={30} /></span></a>
        <nav className="absolute top-8 right-5 md:right-14 z-50 flex gap-3 sm:gap-5 md:gap-8 font-press-start text-[8px] sm:text-[11px] text-white">
          <a href="/demo" className="hover:text-maiz transition-colors">Menú</a>
          <a href="#fotos" className="hover:text-maiz transition-colors">Fotos</a>
          <a href="#contacto" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); }} className="hover:text-maiz transition-colors">Contacto</a>
          <a href={ESTUDIO_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:inline text-carbon bg-maiz px-2.5 py-1.5 hover:bg-lima transition-colors">Estudio IA ▸</a>
        </nav>

        {/* Título que se desescribe */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-start pt-24 sm:pt-28 px-6 md:px-16 pb-24 sm:pb-28">
          <div className="mt-auto">
          <h1 className="font-press-start text-maiz text-2xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.25] tracking-tight uppercase max-w-4xl" style={{ textShadow: '4px 4px 0 var(--color-rojo)' }}>
            {texto}
            <span className="inline-block w-[0.14em] h-[0.8em] bg-maiz ml-1 align-middle cursor-parp" />
          </h1>
          <p className="mt-6 max-w-md text-crema text-base sm:text-lg font-body">
            Tu cliente escanea, pide desde la mesa y a la cocina le llega al instante. Y tu comida se ve como sabe.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md pointer-events-auto">
            <a href="/demo" className="font-press-start text-[10px] sm:text-xs text-crema bg-rojo border-[3px] border-negro py-4 px-6 text-center shadow-[5px_5px_0_var(--color-maiz)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest">
              Probar el menú en vivo ▸
            </a>
            <button onClick={onProbar} className="font-press-start text-[10px] sm:text-xs text-crema border-2 border-crema/60 py-4 px-6 hover:border-maiz hover:text-maiz transition-colors uppercase tracking-widest cursor-pointer">
              📷 Sube tu foto
            </button>
          </div>
          </div>
        </div>

        {/* Manifiesto rodante (se desvanece antes de tocar el menú de arriba) */}
        <div className="absolute inset-0 z-20 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent 0, #000 16vh)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 16vh)' }}>
          <div className="absolute top-0 left-0 w-full md:w-[72%] h-screen flex flex-col justify-start p-6 md:p-16 pt-[12vh]" style={{ opacity: manifOpacity, transform: `translateY(${manifY}vh)` }}>
            <div className="font-press-start text-maiz text-[18px] sm:text-[24px] md:text-[30px] leading-[1.4] tracking-tight uppercase whitespace-pre-line" style={{ textShadow: '3px 3px 0 var(--color-rojo)' }}>
              {MANIFIESTO}
            </div>
          </div>
        </div>

        {/* Pista de scroll */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 font-press-start text-[8px] text-maiz tracking-widest transition-opacity" style={{ opacity: p > 0.04 ? 0 : 1 }}>
          ▾ DESLIZA
        </div>
      </div>
    </div>
  );
}
