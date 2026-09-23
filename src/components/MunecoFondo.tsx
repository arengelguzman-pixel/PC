import { useEffect, useRef } from 'react';
import type HlsType from 'hls.js';
import { VIDEO_HERO } from '../config';

// Fondo fijo con el muñeco encapuchado. Los videos REPRODUCEN en loop (suave,
// sin trabas) y el scroll solo controla CUÁL se ve (crossfade por opacidad).
// Antes se hacía "scrubbing" moviendo currentTime con el scroll: eso obliga a
// re-buscar keyframes en el HLS y trababa, sobre todo en la parte del skater.
function montarHls(Hls: typeof HlsType, video: HTMLVideoElement, url: string): () => void {
  video.loop = true;
  if (Hls.isSupported()) {
    const hls = new Hls({ maxBufferLength: 30 });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
    return () => hls.destroy();
  }
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.addEventListener('loadedmetadata', () => { video.play().catch(() => {}); });
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

    import('hls.js').then(({ default: Hls }) => {
      if (!vivo) return;
      off1 = montarHls(Hls, a, VIDEO_HERO.uno);
      off2 = montarHls(Hls, b, VIDEO_HERO.dos);
    });

    // Solo opacidad por scroll (el video ya reproduce solo): cero seeks, fluido.
    const loop = () => {
      if (!vivo) return;
      raf = requestAnimationFrame(loop);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const prog = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
      a.style.opacity = prog > 0.5 ? '0' : '1';
      b.style.opacity = String(prog < 0.45 ? 0 : prog > 0.5 ? 1 : (prog - 0.45) / 0.05);
    };
    loop();
    return () => { vivo = false; if (raf) cancelAnimationFrame(raf); off1(); off2(); };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-negro" style={{ zIndex: 0 }}>
      <video ref={v1} muted playsInline loop preload="auto" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 1 }} />
      <video ref={v2} muted playsInline loop preload="auto" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 0 }} />
    </div>
  );
}
