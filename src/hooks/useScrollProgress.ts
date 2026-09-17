import { useEffect, useState } from 'react';

// Progreso global de scroll [0..1] sobre todo el documento.
export function useScrollProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const v = max > 0 ? window.scrollY / max : 0;
      setP((prev) => (Math.abs(prev - v) > 0.0005 ? v : prev));
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
  return p;
}

// Progreso local de un elemento respecto al viewport [0..1].
// 0 = el tope del elemento llega al fondo del viewport; 1 = su fondo sale por arriba.
export function elementProgress(el: HTMLElement | null): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const total = r.height + vh;
  const done = vh - r.top;
  return Math.max(0, Math.min(1, done / total));
}
