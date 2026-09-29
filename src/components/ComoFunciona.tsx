import Reveal from './Reveal';
import { IconoMeza } from './LogoMeza';
import { EPOCAS, NOMBRE_EPOCA } from '../marca/meza';

// Qué hace MEZA, en tres pasos — y la historia de la Z: de la carta de papel
// a la mesa que atiende (píxel → LED → holograma → 3D).
const PASOS = [
  { n: '01', t: 'Escanea el QR de la mesa', d: 'Sin app y sin registro. Abre el menú con fotos y pide desde el celular.' },
  { n: '02', t: 'Paga por QR o en efectivo', d: 'Sube el comprobante y caja lo confirma en segundos, en vivo.' },
  { n: '03', t: 'La cocina lo ve al instante', d: 'Alarma, comanda y estado en tiempo real: recibido → en preparación → listo.' },
];

export default function ComoFunciona() {
  return (
    <section id="como" className="bg-negro/50 py-16 md:py-24 px-6">
      <Reveal className="max-w-5xl mx-auto">
        <h2 className="font-press-start text-maiz text-xl sm:text-3xl md:text-4xl leading-tight uppercase">
          De la carta de papel<br /><span className="text-crema">a la mesa que atiende.</span>
        </h2>

        {/* Evolución de la Z */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="border-[3px] border-crema/20 p-4 flex flex-col items-center gap-3 text-center">
            <span className="w-14 h-14 grid place-items-center text-4xl opacity-50">📄</span>
            <span className="font-press-start text-[8px] text-crema/50 leading-relaxed uppercase line-through">Carta de papel</span>
          </div>
          {EPOCAS.map((e, i) => (
            <div key={e} className={`border-[3px] p-4 flex flex-col items-center gap-3 text-center ${i === EPOCAS.length - 1 ? 'border-lima bg-lima/10' : 'border-crema/20'}`}>
              <IconoMeza tam={56} epoca={e} />
              <span className="font-press-start text-[8px] text-crema/80 leading-relaxed uppercase">{NOMBRE_EPOCA[e]}</span>
            </div>
          ))}
        </div>

        {/* Tres pasos */}
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {PASOS.map((s, i) => (
            <div key={s.n} className={`border-[3px] border-negro p-6 ${i === 0 ? 'bg-rojo text-crema shadow-[6px_6px_0_var(--color-maiz)]' : i === 1 ? 'bg-maiz text-negro shadow-[6px_6px_0_var(--color-azul)]' : 'bg-azul text-crema shadow-[6px_6px_0_var(--color-rojo)]'}`}>
              <span className={`font-press-start text-4xl leading-none block ${i === 1 ? 'text-rojo' : 'text-maiz'}`}>{s.n}</span>
              <h3 className="font-press-start text-sm mt-4 leading-snug uppercase">{s.t}</h3>
              <p className={`text-sm mt-3 ${i === 1 ? 'text-negro/80' : 'text-crema/90'}`}>{s.d}</p>
            </div>
          ))}
        </div>

        <a href="/demo" className="inline-block mt-8 font-press-start text-[10px] sm:text-[11px] text-negro bg-lima border-[3px] border-negro py-4 px-7 shadow-[5px_5px_0_var(--color-rojo)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest">
          Probar el menú en vivo ▸
        </a>
      </Reveal>
    </section>
  );
}
