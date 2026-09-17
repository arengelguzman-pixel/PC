import { BEFORE_AFTER } from '../config';
import BeforeAfter from './BeforeAfter';
import Reveal from './Reveal';

// Sección dedicada: el antes/después de una corrección con IA.
// (Las fotos de platos viven acá, no en el fondo del hero.)
export default function BeforeAfterSection() {
  const [primero, ...resto] = BEFORE_AFTER;
  return (
    <section id="antes-despues" className="bg-rojo/60 py-16 md:py-24 px-6">
      <Reveal className="max-w-2xl mx-auto">
        <span className="font-press-start text-[9px] bg-maiz text-negro px-3 py-2 tracking-widest">✱ ANTES / DESPUÉS · IA</span>
        <h2 className="font-press-start text-lima text-xl sm:text-3xl md:text-4xl leading-tight mt-5 uppercase" style={{ textShadow: '3px 3px 0 var(--color-negro)' }}>
          La misma comida.<br /><span className="text-crema">Otra foto.</span>
        </h2>
        <p className="mt-4 text-crema/90 max-w-lg">
          No te cambiamos el plato ni te inventamos ingredientes. Es tu comida de verdad, con la luz
          arreglada por IA. Arrastra el dedo sobre la foto ↓
        </p>

        <BeforeAfter antes={primero.antes} despues={primero.despues} className="mt-6 !border-negro" />

        <p className="text-sm text-crema/80 mt-5">
          Cinco ejemplos más. Todos salieron del mismo motor que vas a usar tú, y en todos el plato
          queda exactamente en el mismo lugar:
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          {resto.map((par, i) => (
            <BeforeAfter key={i} antes={par.antes} despues={par.despues} etAntes="ANTES" etDespues="DESPUÉS" small className="!border-negro" />
          ))}
        </div>

        <div className="mt-8 border-l-4 border-maiz bg-black/20 px-4 py-4">
          <p className="text-crema/90 text-sm">
            <b className="text-maiz">La IA arregla la foto, nunca la comida.</b> Las mismas presas, la misma
            porción, el mismo plato. Si el cliente pide por la foto, recibe exactamente eso.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
