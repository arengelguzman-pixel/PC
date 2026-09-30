import { useState } from 'react';

// Formulario de contacto, fijo en el pie (sin animaciones flotantes: menos ruido).
export default function FeedbackForm() {
  const [enviado, setEnviado] = useState(false);
  const campo = 'font-mono text-xs text-white bg-slate-900 border-2 border-slate-700 focus:border-lima hover:border-slate-500 outline-none p-3 w-full placeholder-slate-600 transition-colors';
  return (
    <div className="w-full max-w-[460px] p-6 sm:p-7 bg-slate-950/90 border-4 border-azul shadow-[8px_8px_0_var(--color-lima)]">
      {!enviado ? (
        <form onSubmit={(e) => { e.preventDefault(); setEnviado(true); }} className="flex flex-col gap-4">
          <div className="font-press-start text-[10px] sm:text-xs text-lima tracking-widest uppercase">La primera es gratis</div>
          <p className="font-body text-sm text-crema/70 -mt-1">Déjanos tu WhatsApp y te armamos un menú de prueba con el nombre de tu local.</p>
          <input required type="text" placeholder="NOMBRE DEL LOCAL" className={`${campo} uppercase`} />
          <input required inputMode="numeric" placeholder="TU WHATSAPP" className={campo} />
          <select required defaultValue="" className={campo}>
            <option value="" disabled>QUÉ VENDES</option>
            <option>Comida rápida / hamburguesas</option>
            <option>Comida cruceña / almuerzos</option>
            <option>Pollos a la brasa / broaster</option>
            <option>Pizzería</option>
            <option>Otra cosa</option>
          </select>
          <button type="submit" className="font-press-start text-[9px] sm:text-[10px] text-carbon bg-lima hover:bg-lime-300 active:translate-y-0.5 active:shadow-none border-2 border-carbon py-3.5 px-6 shadow-[4px_4px_0_var(--color-azul)] w-full uppercase tracking-widest cursor-pointer transition-all">Quiero mi demo ▸</button>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="font-press-start text-[32px] text-lima mb-4 animate-bounce">✦</div>
          <div className="font-press-start text-xs sm:text-sm text-lima mb-3 tracking-widest uppercase">Listo</div>
          <p className="font-body text-sm text-slate-400 max-w-sm mb-6 mx-auto">Te escribimos por WhatsApp hoy mismo.</p>
          <button onClick={() => setEnviado(false)} className="font-press-start text-[9px] text-carbon bg-lima hover:bg-lime-300 border-2 border-carbon py-2.5 px-5 uppercase tracking-wider shadow-[3px_3px_0_var(--color-azul)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">[ Enviar otro ]</button>
        </div>
      )}
    </div>
  );
}
