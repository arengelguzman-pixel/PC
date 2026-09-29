import { useRef, useState } from 'react';

// Comparador antes/después con tirador arrastrable.
export default function BeforeAfter({
  antes, despues, etAntes = 'TU FOTO', etDespues = 'CON MEZA',
  className = '', small = false,
}: {
  antes: string; despues: string;
  etAntes?: string; etDespues?: string;
  className?: string; small?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(50);
  const act = useRef(false);

  const mover = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const v = ((clientX - r.left) / r.width) * 100;
    setX(Math.max(2, Math.min(98, v)));
  };

  return (
    <div
      ref={ref}
      className={`relative border-[3px] border-lima overflow-hidden aspect-square bg-black select-none touch-none cursor-ew-resize ${className}`}
      onPointerDown={(e) => { act.current = true; e.currentTarget.setPointerCapture(e.pointerId); mover(e.clientX); }}
      onPointerMove={(e) => { if (act.current) mover(e.clientX); }}
      onPointerUp={() => { act.current = false; }}
      onPointerCancel={() => { act.current = false; }}
    >
      <img src={antes} alt="Antes" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <img src={despues} alt="Después" loading="lazy" className="absolute inset-0 w-full h-full object-cover ba-clip" style={{ ['--x' as string]: `${x}%` }} />
      <span className={`absolute z-[3] font-press-start ${small ? 'text-[7px] px-2 py-1 bottom-2 left-2' : 'text-[9px] px-3 py-1.5 bottom-3 left-3'} tracking-widest bg-carbon text-crema`}>{etAntes}</span>
      <span className={`absolute z-[3] font-press-start ${small ? 'text-[7px] px-2 py-1 bottom-2 right-2' : 'text-[9px] px-3 py-1.5 bottom-3 right-3'} tracking-widest bg-lima text-carbon`}>{etDespues}</span>
      <div className="absolute top-0 bottom-0 w-1 bg-lima z-[3]" style={{ left: `${x}%` }} />
      <div className={`absolute top-1/2 z-[4] ${small ? 'w-10 h-10 text-[13px]' : 'w-[54px] h-[54px] text-[15px]'} -translate-x-1/2 -translate-y-1/2 rounded-full bg-lima border-[3px] border-carbon grid place-items-center text-carbon font-press-start`} style={{ left: `${x}%` }}>↔</div>
    </div>
  );
}
