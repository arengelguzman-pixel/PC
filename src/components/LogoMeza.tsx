import { useEffect, useId, useState } from 'react';
import { COLOR, EPOCAS, type EpocaZ, svgIcono, svgWordmark } from '../marca/meza';

// Wordmark MEZA. Si está animado, la Z recorre sus cuatro épocas
// (píxel → LED → holograma → 3D) con un glitch corto entre una y otra.
type Props = { alto?: number; color?: string; animado?: boolean; epoca?: EpocaZ; byZeta?: boolean; className?: string; cada?: number };

function usarEpoca(animado: boolean, fija: EpocaZ | undefined, cada: number) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<EpocaZ | null>(null);
  useEffect(() => {
    if (!animado || fija || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let t2 = 0;
    const t = setInterval(() => {
      setI((v) => { setPrev(EPOCAS[v]); return (v + 1) % EPOCAS.length; });
      t2 = window.setTimeout(() => setPrev(null), 380);
    }, cada);
    return () => { clearInterval(t); clearTimeout(t2); };
  }, [animado, fija, cada]);
  return { epoca: fija ?? EPOCAS[i], prev };
}

export default function LogoMeza({ alto = 28, color = COLOR.lima, animado = true, epoca: fija, byZeta = false, className = '', cada = 2600 }: Props) {
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const { epoca, prev } = usarEpoca(animado, fija, cada);
  const ancho = alto * (24 / 9);
  const capa = (ep: EpocaZ, cls: string) => (
    <span key={ep + cls} className={`logo-capa absolute inset-0 ${cls}`} dangerouslySetInnerHTML={{ __html: svgWordmark({ color, epoca: ep, id: id + ep }) }} />
  );
  return (
    <span className={`inline-flex flex-col items-end leading-none ${className}`} aria-label="MEZA">
      <span className="relative block" style={{ width: ancho, height: alto }}>
        {prev ? [capa(prev, 'logo-gl-a'), capa(epoca, 'logo-gl-b')] : capa(epoca, '')}
      </span>
      {byZeta && <span className="font-press-start mt-[0.35em]" style={{ fontSize: Math.max(7, alto * 0.28), color, opacity: 0.85 }}>by ZETA</span>}
    </span>
  );
}

// Ícono cuadrado (app / favicon / crédito pequeño), con una época fija o animada.
export function IconoMeza({ tam = 40, epoca: fija, animado = false, color = COLOR.lima, fondo = COLOR.negro as string | null, className = '', cada = 2600 }: { tam?: number; epoca?: EpocaZ; animado?: boolean; color?: string; fondo?: string | null; className?: string; cada?: number }) {
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const { epoca, prev } = usarEpoca(animado, fija, cada);
  const capa = (ep: EpocaZ, cls: string) => (
    <span key={ep + cls} className={`logo-capa absolute inset-0 ${cls}`} dangerouslySetInnerHTML={{ __html: svgIcono({ color, epoca: ep, fondo, id: id + ep }) }} />
  );
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: tam, height: tam }} aria-label="MEZA">
      {prev ? [capa(prev, 'logo-gl-a'), capa(epoca, 'logo-gl-b')] : capa(epoca, '')}
    </span>
  );
}
