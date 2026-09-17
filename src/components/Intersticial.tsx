// Banda transparente entre secciones: deja ver el muñeco del fondo fijo
// (el muñeco "pasa entre páginas") con una frase pixel encima.
export default function Intersticial({ frase }: { frase: string }) {
  return (
    <div className="relative h-[62vh] md:h-[80vh] flex items-center justify-center overflow-hidden px-6">
      {/* degradados: funden la sección de arriba y la de abajo con el muñeco */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-negro to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-negro to-transparent" />
      <div className="absolute inset-0 bg-black/25" />
      <p className="relative font-press-start text-maiz text-lg sm:text-2xl md:text-4xl leading-[1.35] uppercase text-center max-w-3xl" style={{ textShadow: '4px 4px 0 var(--color-rojo)' }}>
        {frase}
      </p>
    </div>
  );
}
