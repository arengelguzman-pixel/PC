import { BEFORE_AFTER } from '../config';
import Reveal from './Reveal';

// Carrusel rápido de antes/después (una sola técnica protagonista: la cinta).
// Cada tarjeta muestra la mitad "antes" y la mitad "MEZA"; al final, una
// tarjeta vacía con "+" para subir tu propia foto. La cinta se duplica para
// que el loop sea continuo y se pausa al pasar el mouse.
export default function FotosCarrusel({ onSubir }: { onSubir: () => void }) {
  const tarjeta = (par: { antes: string; despues: string }, k: string) => (
    <div key={k} className="relative w-[210px] sm:w-[250px] aspect-square shrink-0 border-[3px] border-negro overflow-hidden bg-black">
      <img src={par.antes} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <img src={par.despues} alt="" className="absolute inset-0 w-full h-full object-cover ba-clip" style={{ ['--x' as string]: '50%' }} />
      <span className="absolute top-0 bottom-0 left-1/2 w-1 bg-lima" />
      <span className="absolute bottom-2 left-2 font-press-start text-[7px] px-2 py-1 tracking-widest bg-carbon text-crema">ANTES</span>
      <span className="absolute bottom-2 right-2 font-press-start text-[7px] px-2 py-1 tracking-widest bg-lima text-carbon">MEZA</span>
    </div>
  );
  const mas = (k: string) => (
    <button key={k} onClick={onSubir} className="w-[210px] sm:w-[250px] aspect-square shrink-0 border-[3px] border-dashed border-crema/70 bg-black/25 hover:bg-lima/15 hover:border-lima transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer">
      <span className="font-press-start text-5xl text-lima leading-none">+</span>
      <span className="font-press-start text-[9px] text-crema uppercase tracking-widest text-center leading-relaxed">Sube tu<br />foto</span>
    </button>
  );
  const cinta = (n: number) => [...BEFORE_AFTER.map((p, i) => tarjeta(p, `${n}-${i}`)), mas(`${n}-mas`)];

  return (
    <section id="fotos" className="bg-rojo/50 py-16 md:py-20 overflow-hidden">
      <Reveal className="max-w-5xl mx-auto px-6">
        <span className="font-press-start text-[9px] bg-maiz text-negro px-3 py-2 tracking-widest">✱ FOTOS CON IA</span>
        <h2 className="font-press-start text-lima text-xl sm:text-3xl md:text-4xl leading-tight mt-5 uppercase" style={{ textShadow: '3px 3px 0 var(--color-negro)' }}>
          La misma comida.<br /><span className="text-crema">Otra foto.</span>
        </h2>
        <p className="mt-4 text-crema/90 max-w-lg">Mismo plato, misma porción. Solo arreglamos la luz y limpiamos el fondo.</p>
      </Reveal>

      <div className="mt-8 animate-carrusel gap-4 pl-6">
        {cinta(1)}{cinta(2)}
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        <button onClick={onSubir} className="font-press-start text-[10px] sm:text-[11px] text-crema bg-negro border-[3px] border-negro py-4 px-7 shadow-[5px_5px_0_var(--color-lima)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer">
          📷 Probar con mi foto ▸
        </button>
      </div>
    </section>
  );
}
