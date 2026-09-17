const TABLA: [string, string, string][] = [
  ['Tu logo y tus colores', '✓', '✓'],
  ['Tipografía de tu marca', '✓', '✓'],
  ['Tono con el que hablas', '1 tono', '3 tonos'],
  ['Afiches por mes', '4', '10 + 1 video'],
  ['Formatos por afiche', '2', '4'],
  ['Platos en 3D real', '2', '8'],
  ['Calendario sugerido', '—', '✓'],
];

export default function Pricing() {
  return (
    <section className="bg-[#0A0605] py-16 md:py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-press-start text-lima text-xl sm:text-3xl md:text-4xl leading-tight uppercase">Cuánto sale</h2>

        <div className="mt-7 border-[3px] border-carbon bg-crema text-carbon p-6 shadow-[7px_7px_0_var(--color-azul)]">
          <span className="font-press-start text-[9px] bg-carbon text-lima px-3 py-2 tracking-widest">PLAN MENÚ VIVO</span>
          <div className="font-mono font-extrabold text-5xl mt-4 leading-none">Bs 149<small className="text-base font-semibold"> / mes</small></div>
          <p className="mt-3 text-sm font-semibold">+ Bs 490 una sola vez por la instalación.<br />Gratis si pagas 6 meses juntos.</p>
          <ul className="mt-5 grid gap-0">
            {['Tu carta digital con QR para las mesas', 'Hasta 30 platos con la foto arreglada', 'Tus platos estrella en 3D de verdad', '4 afiches para tus redes cada mes', 'Cambios ilimitados hechos por ti', 'Te dejamos los QR impresos y plastificados'].map((t) => (
              <li key={t} className="pl-6 relative py-2.5 border-t border-carbon/20 text-sm"><span className="absolute left-0 text-brasa font-bold">✓</span>{t}</li>
            ))}
          </ul>
        </div>

        <h3 className="font-press-start text-lima text-sm sm:text-lg mt-14 uppercase leading-snug">Tu marca,<br />ya cargada.</h3>
        <p className="mt-3 text-crema/80">El día que te damos de alta guardamos tu logo, tus colores y tu forma de hablar. Después, todo lo que salga ya viene con eso puesto.</p>
        <div className="mt-6 border-[3px] border-lima">
          <div className="grid grid-cols-[1fr_88px_108px] bg-lima text-carbon font-press-start text-[9px] tracking-wide">
            <span className="p-3.5">LO QUE GUARDAMOS</span><span className="p-3.5 text-center">BÁSICO</span><span className="p-3.5 text-center">COMPLETO</span>
          </div>
          {TABLA.map((row) => (
            <div key={row[0]} className="grid grid-cols-[1fr_88px_108px] border-t border-crema/15 text-sm items-center">
              <span className="p-3.5 text-crema/90">{row[0]}</span>
              <span className="p-3.5 text-center font-mono font-bold text-crema">{row[1]}</span>
              <span className="p-3.5 text-center font-mono font-bold text-lima">{row[2]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
