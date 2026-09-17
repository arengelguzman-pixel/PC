import { MARQUEE } from '../config';

// Marquesina brutalista. Diagonal en el hero (variant="diag") o recta como banda.
export default function Marquee({ variant = 'band' }: { variant?: 'band' | 'diag' }) {
  const items = [...MARQUEE, ...MARQUEE, ...MARQUEE];
  const contenido = (
    <div className="animate-marquee">
      {[0, 1].map((dup) => (
        <span key={dup} className="font-press-start text-[12px] sm:text-[14px] text-lima tracking-widest whitespace-nowrap flex items-center">
          {items.map((t, i) => (
            <span key={i} className="px-4">✱ {t}</span>
          ))}
        </span>
      ))}
    </div>
  );

  if (variant === 'diag') {
    return (
      <div className="absolute top-14 left-[-170px] w-[720px] -rotate-[30deg] z-50 bg-azul py-[16px] overflow-hidden select-none pointer-events-none shadow-2xl">
        {contenido}
      </div>
    );
  }
  return (
    <div className="bg-carbon border-y-4 border-lima py-3 overflow-hidden select-none">
      {contenido}
    </div>
  );
}
