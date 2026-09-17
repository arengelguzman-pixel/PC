import { useEffect, useRef, useState } from 'react';
import type HlsType from 'hls.js';
import { HERO_FRASES, MANIFIESTO, MARCA, VIDEO_HERO } from '../config';
import Marquee from './Marquee';

// Título que se "desescribe" con el scroll (typewriter del spec).
const TITULO = HERO_FRASES[0]; // "¿PLATO SIN VIDA?"

// Conecta un <video> a un stream HLS y calienta el decoder.
function montarHls(Hls: typeof HlsType, video: HTMLVideoElement, url: string): () => void {
  if (Hls.isSupported()) {
    const hls = new Hls({ maxBufferLength: 60 });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().then(() => video.pause()).catch(() => {}); });
    return () => hls.destroy();
  }
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.addEventListener('loadedmetadata', () => { video.play().then(() => video.pause()).catch(() => {}); });
  }
  return () => {};
}

export default function ScrollHero({ onProbar }: { onProbar: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const v1 = useRef<HTMLVideoElement>(null);
  const v2 = useRef<HTMLVideoElement>(null);
  const [p, setP] = useState(0);

  // progreso local (para texto y manifiesto)
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

  // videos: carga HLS (diferida) + scrub por scroll (lerp), crossfade en 0.5
  useEffect(() => {
    const a = v1.current, b = v2.current;
    if (!a || !b) return;
    let raf = 0, vivo = true, off1 = () => {}, off2 = () => {};
    import('hls.js').then(({ default: Hls }) => {
      if (!vivo) return;
      off1 = montarHls(Hls, a, VIDEO_HERO.uno);
      off2 = montarHls(Hls, b, VIDEO_HERO.dos);
    });
    const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
    const loop = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(loop);
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const prog = Math.max(0, Math.min(1, total > 0 ? -r.top / total : 0));

      if (a.duration) {
        const t1 = Math.min(1, prog / 0.5) * a.duration;
        if (!a.seeking) a.currentTime = prog <= 0.005 ? 0 : lerp(a.currentTime, t1, 0.3);
      }
      if (b.duration) {
        const t2 = Math.max(0, (prog - 0.5) / 0.5) * b.duration;
        if (!b.seeking) b.currentTime = prog >= 0.995 ? b.duration : lerp(b.currentTime, t2, 0.3);
      }
      // crossfade sin oscurecer: v1 se mantiene hasta que v2 sube encima
      const o2 = prog < 0.45 ? 0 : prog > 0.5 ? 1 : (prog - 0.45) / 0.05;
      a.style.opacity = prog > 0.5 ? '0' : '1';
      b.style.opacity = String(o2);
    };
    loop();
    return () => { vivo = false; if (raf) cancelAnimationFrame(raf); off1(); off2(); };
  }, []);

  // borrado del título (0 .. 0.22)
  const activo = Math.min(p, 0.22) / 0.22;
  const texto = TITULO.slice(0, Math.round((1 - activo) * TITULO.length));

  // manifiesto rodante (0.30 → 1)
  const inicio = 0.30;
  const alpha = p > inicio ? (p - inicio) / (1 - inicio) : 0;
  const manifOpacity = Math.min(1, alpha / 0.05);
  const manifY = 100 - alpha * 420;
  // oscurecer sólo mientras el manifiesto está a la vista (el muñeco se ve antes y después)
  const foco = alpha > 0 ? Math.max(0, 1 - Math.abs(manifY - 8) / 95) : 0;

  return (
    <div ref={wrap} className="relative h-[420vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-negro">

        {/* Fondo: el muñeco encapuchado (video scroll-scrubbed) */}
        <div className="absolute inset-0">
          <video ref={v1} muted playsInline preload="auto" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 1 }} />
          <video ref={v2} muted playsInline preload="auto" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 0 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/80" />
          <div className="absolute inset-0 bg-negro" style={{ opacity: foco * 0.62 }} />
        </div>

        {/* Cinta diagonal (se va con el scroll) */}
        <Marquee variant="diag" />

        {/* Navegación */}
        <nav className="absolute top-8 right-6 md:right-14 z-50 flex gap-5 md:gap-9 font-press-start text-[9px] sm:text-[11px] text-white">
          <a href="#probar" className="hover:text-maiz transition-colors">Probar</a>
          <a href="#menu" className="hover:text-maiz transition-colors">Menú</a>
          <a href="#redes" className="hover:text-maiz transition-colors">Redes</a>
          <a href="#contacto" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); }} className="hover:text-maiz transition-colors">Contacto</a>
        </nav>

        {/* Título que se desescribe */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end p-6 md:p-16 pb-24 sm:pb-28">
          <span className="font-press-start text-[9px] sm:text-[11px] text-negro bg-maiz self-start px-3 py-2 tracking-widest mb-5">
            {MARCA.nombre} ✱ MONTERO 2026
          </span>
          <h1 className="font-press-start text-maiz text-2xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.25] tracking-tight uppercase max-w-4xl" style={{ textShadow: '4px 4px 0 var(--color-rojo)' }}>
            {texto}
            <span className="inline-block w-[0.14em] h-[0.8em] bg-maiz ml-1 align-middle cursor-parp" />
          </h1>
          <p className="mt-6 max-w-md text-crema text-base sm:text-lg font-body">
            Tu comida ya es buena. Ahora que se vea así — con la foto que ya tienes.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md pointer-events-auto">
            <button
              onClick={onProbar}
              className="font-press-start text-[10px] sm:text-xs text-crema bg-rojo border-[3px] border-negro py-4 px-6 shadow-[5px_5px_0_var(--color-maiz)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer"
            >
              📷 Sube tu foto ▸
            </button>
            <a
              href="#menu"
              className="font-press-start text-[10px] sm:text-xs text-crema border-2 border-crema/60 py-4 px-6 text-center hover:border-maiz hover:text-maiz transition-colors uppercase tracking-widest"
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
          <div className="font-press-start text-maiz text-[18px] sm:text-[24px] md:text-[30px] leading-[1.4] tracking-tight uppercase whitespace-pre-line" style={{ textShadow: '3px 3px 0 var(--color-rojo)' }}>
            {MANIFIESTO}
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
