import { useEffect, useId, useState } from 'react';
import { COLOR, EPOCAS, type EpocaZ, svgIcono, svgIsotipo } from '../marca/meza';

// Firma de MEZA: el isotipo (la Z-mesa) + el nombre en la tipografía de la
// landing (Press Start 2P). Si está animado, la Z recorre sus cuatro épocas
// (píxel → LED → holograma → 3D) con un glitch corto entre una y otra.

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

type BaseProps = { epoca?: EpocaZ; animado?: boolean; color?: string; className?: string; cada?: number };

// La Z-mesa sola (sin fondo). `tam` es la altura.
export function Isotipo({ tam = 28, epoca: fija, animado = true, color = COLOR.lima, className = '', cada = 2600 }: BaseProps & { tam?: number }) {
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const { epoca, prev } = usarEpoca(animado, fija, cada);
  const capa = (ep: EpocaZ, cls: string) => (
    <span key={ep + cls} className={`logo-capa absolute inset-0 ${cls}`} dangerouslySetInnerHTML={{ __html: svgIsotipo({ color, epoca: ep, id: id + ep }) }} />
  );
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: tam * 0.75, height: tam }} aria-label="MEZA">
      {prev ? [capa(prev, 'logo-gl-a'), capa(epoca, 'logo-gl-b')] : capa(epoca, '')}
    </span>
  );
}

// Isotipo + "MEZA" en Press Start 2P. `alto` es la altura de la Z; el texto va proporcional.
export default function LogoMeza({ alto = 28, color = COLOR.lima, animado = true, epoca, byZeta = false, sombra = true, className = '', cada = 2600 }: BaseProps & { alto?: number; byZeta?: boolean; sombra?: boolean }) {
  const fs = Math.round(alto * 0.6);
  const s = Math.max(1, Math.round(fs * 0.12));
  return (
    <span className={`inline-flex flex-col items-end leading-none ${className}`} aria-label="MEZA">
      <span className="inline-flex items-center" style={{ gap: fs * 0.45 }}>
        <Isotipo tam={alto} epoca={epoca} animado={animado} color={color} cada={cada} />
        <span className="font-press-start" style={{ fontSize: fs, color, textShadow: sombra ? `${s}px ${s}px 0 var(--color-rojo)` : undefined }}>MEZA</span>
      </span>
      {byZeta && <span className="font-press-start" style={{ fontSize: Math.max(7, Math.round(fs * 0.42)), color, opacity: 0.8, marginTop: fs * 0.55 }}>by ZETA</span>}
    </span>
  );
}

// Ícono cuadrado (app / favicon), con una época fija o animada.
export function IconoMeza({ tam = 40, epoca: fija, animado = false, color = COLOR.lima, fondo = COLOR.negro as string | null, className = '', cada = 2600 }: BaseProps & { tam?: number; fondo?: string | null }) {
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
