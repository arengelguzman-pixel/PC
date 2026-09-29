import { useEffect, useState } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';

// Formulario terminal que aparece deslizando cuando el scroll llega al final
// (firma del spec, adaptado al contacto de MEZA).
export default function FeedbackForm() {
  const p = useScrollProgress();
  const [cerrado, setCerrado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [montado, setMontado] = useState(false);
  useEffect(() => { setMontado(true); }, []);
  const visible = montado && p >= 0.9 && !cerrado;

  // Al reabrir el scroll arriba, permite que vuelva a salir.
  useEffect(() => { if (p < 0.7) setCerrado(false); }, [p]);

  return (
    <div
      className="fixed left-1/2 z-[55] w-[92%] max-w-[460px] p-6 sm:p-8 bg-slate-950/95 border-4 border-azul shadow-[10px_10px_0_var(--color-lima)] pointer-events-auto transition-all duration-[900ms]"
      style={{
        bottom: '50%',
        transform: visible ? 'translate(-50%, 50%) rotate(0deg)' : 'translate(-50%, 150vh) rotate(15deg)',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <button onClick={() => setCerrado(true)} className="absolute top-4 right-4 font-press-start text-[14px] text-slate-500 hover:text-brasa transition-colors cursor-pointer bg-transparent border-none">[X]</button>

      {!enviado ? (
        <form onSubmit={(e) => { e.preventDefault(); setEnviado(true); }} className="flex flex-col gap-4 sm:gap-5">
          <div className="font-press-start text-[10px] sm:text-xs text-lima tracking-widest uppercase text-center">La primera es gratis</div>
          <p className="font-body text-sm text-crema/70 text-center -mt-2">Mándanos una foto y te devolvemos tu plato arreglado + un menú de prueba con el nombre de tu local.</p>
          <input required type="text" placeholder="NOMBRE DEL LOCAL" className="font-mono text-xs text-white bg-slate-900 border-2 border-slate-700 focus:border-lima hover:border-slate-500 outline-none p-3 w-full uppercase placeholder-slate-600 transition-colors" />
          <input required inputMode="numeric" placeholder="TU WHATSAPP" className="font-mono text-xs text-white bg-slate-900 border-2 border-slate-700 focus:border-lima hover:border-slate-500 outline-none p-3 w-full placeholder-slate-600 transition-colors" />
          <select required defaultValue="" className="font-mono text-xs text-white bg-slate-900 border-2 border-slate-700 focus:border-lima outline-none p-3 w-full transition-colors">
            <option value="" disabled>QUÉ VENDES</option>
            <option>Comida rápida / hamburguesas</option>
            <option>Comida cruceña / almuerzos</option>
            <option>Pollos a la brasa / broaster</option>
            <option>Pizzería</option>
            <option>Otra cosa</option>
          </select>
          <button type="submit" className="font-press-start text-[9px] sm:text-[10px] text-carbon bg-lima hover:bg-lime-300 active:translate-y-0.5 active:shadow-none border-2 border-carbon py-3.5 px-6 shadow-[4px_4px_0_var(--color-azul)] w-full uppercase tracking-widest cursor-pointer transition-all">Enviar mi foto ▸</button>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="font-press-start text-[32px] text-lima mb-4 animate-bounce">✦</div>
          <div className="font-press-start text-xs sm:text-sm text-lima mb-3 tracking-widest uppercase">Listo</div>
          <p className="font-body text-sm text-slate-400 max-w-sm mb-6 mx-auto">Te escribimos por WhatsApp hoy mismo con tu plato arreglado.</p>
          <button onClick={() => setEnviado(false)} className="font-press-start text-[9px] text-carbon bg-lima hover:bg-lime-300 border-2 border-carbon py-2.5 px-5 uppercase tracking-wider shadow-[3px_3px_0_var(--color-azul)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">[ Enviar otra ]</button>
        </div>
      )}
    </div>
  );
}
