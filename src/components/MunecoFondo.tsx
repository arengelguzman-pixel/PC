import { useEffect, useRef } from 'react';
import type HlsType from 'hls.js';
import { VIDEO_HERO } from '../config';

// Fondo fijo con el muñeco encapuchado. Scrubbea con TODO el scroll del
// documento (no solo el hero): las secciones sólidas lo tapan y las bandas
// intersticiales transparentes lo dejan ver — el muñeco "pasa entre páginas".
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

export default function MunecoFondo() {
  const v1 = useRef<HTMLVideoElement>(null);
  const v2 = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const a = v1.current, b = v2.current;
    if (!a || !b) return;
    let raf = 0, vivo = true, off1 = () => {}, off2 = () => {};

    // Móvil: el scrub de HLS por scroll no es fiable (iOS lo bloquea) y pesa.
    // Reproducimos el muñeco en loop — se mueve igual, sin depender del scroll.
    const esMovil = matchMedia('(pointer: coarse)').matches || (innerWidth > 0 && innerWidth < 768);
    if (esMovil) {
      a.loop = true;
      import('hls.js').then(({ default: Hls }) => {
        if (!vivo) return;
        off1 = montarHls(Hls, a, VIDEO_HERO.uno);
        setTimeout(() => a.play().catch(() => {}), 400);
      });
      b.style.opacity = '0';
      return () => { vivo = false; off1(); };
    }

    import('hls.js').then(({ default: Hls }) => {
      if (!vivo) return;
      off1 = montarHls(Hls, a, VIDEO_HERO.uno);
      off2 = montarHls(Hls, b, VIDEO_HERO.dos);
    });

    const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
    const loop = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(loop);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const prog = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
      if (a.duration) {
        const t1 = Math.min(1, prog / 0.5) * a.duration;
        if (!a.seeking) a.currentTime = prog <= 0.004 ? 0 : lerp(a.currentTime, t1, 0.3);
      }
      if (b.duration) {
        const t2 = Math.max(0, (prog - 0.5) / 0.5) * b.duration;
        if (!b.seeking) b.currentTime = prog >= 0.996 ? b.duration : lerp(b.currentTime, t2, 0.3);
      }
      a.style.opacity = prog > 0.5 ? '0' : '1';
      b.style.opacity = String(prog < 0.45 ? 0 : prog > 0.5 ? 1 : (prog - 0.45) / 0.05);
    };
    loop();
    return () => { vivo = false; if (raf) cancelAnimationFrame(raf); off1(); off2(); };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-negro" style={{ zIndex: 0 }}>
      <video ref={v1} muted playsInline preload="auto" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 1 }} />
      <video ref={v2} muted playsInline preload="auto" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 0 }} />
    </div>
  );
}
