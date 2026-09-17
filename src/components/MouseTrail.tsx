import { useEffect, useRef, useState } from 'react';
import { TRAIL_STICKERS } from '../config';

type Sticker = { id: number; x: number; y: number; rot: number; src: string };

// Stickers que aparecen siguiendo el cursor (5 tipos en ciclo, máx 4 vivos).
export default function MouseTrail() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const last = useRef({ x: 0, y: 0 });
  const counter = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (matchMedia('(pointer: coarse)').matches) return; // sin rastro en táctil

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      if (Math.hypot(dx, dy) < 150) return;
      last.current = { x: e.clientX, y: e.clientY };
      const src = TRAIL_STICKERS[counter.current % TRAIL_STICKERS.length];
      counter.current++;
      const s: Sticker = {
        id: idRef.current++,
        x: e.clientX, y: e.clientY,
        rot: Math.random() * 40 - 20,
        src,
      };
      setStickers((prev) => [...prev.slice(-3), s]);
      window.setTimeout(() => {
        setStickers((prev) => prev.filter((p) => p.id !== s.id));
      }, 2200);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {stickers.map((s) => (
        <div
          key={s.id}
          className="absolute select-none pointer-events-none flex items-center justify-center"
          style={{
            left: s.x, top: s.y,
            transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
            ['--rot' as string]: `${s.rot}deg`,
            animation: 'sticker-fade-out 2.2s forwards cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <img
            src={s.src}
            referrerPolicy="no-referrer"
            className="w-[90px] sm:w-[130px] md:w-[160px] h-auto object-contain"
            alt=""
          />
        </div>
      ))}
    </div>
  );
}
