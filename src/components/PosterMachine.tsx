import { useMemo, useState } from 'react';
import { AFICHE_PLATOS, OBJETIVOS } from '../config';

const FORMATOS: [string, string][] = [
  ['1:1 FEED', 'aspect-square'],
  ['9:16 HISTORIA', 'aspect-[9/16]'],
  ['4:5 INSTAGRAM', 'aspect-[4/5]'],
  ['16:9 DELIVERY', 'aspect-video'],
];

export default function PosterMachine() {
  const [oSel, setOSel] = useState('promo');
  const [pSel, setPSel] = useState('burger');
  const [frase, setFrase] = useState('2x1 este viernes hasta las 9');

  const arte = useMemo(() => {
    const pl = AFICHE_PLATOS.find((x) => x.k === pSel)!;
    const f = frase.trim() || 'promo de hoy';
    let tit: string, baj: string, copy: string;
    if (oSel === 'promo') {
      tit = f.length <= 24 ? f.toUpperCase() : '2X1 EN ' + pl.corto;
      baj = 'Solo por hoy · ' + pl.t;
      copy = `¡${f}! 🔥\nAprovecha ${pl.art} ${pl.t.toLowerCase()} a Bs ${pl.p}.\nPide por WhatsApp o ven nomás.\n\n#Montero #SantaCruz #ComidaMontero`;
    } else if (oSel === 'nuevo') {
      tit = 'NUEVO EN LA CARTA'; baj = pl.t + ' · ' + f;
      copy = `Estrenamos plato 👀\n${pl.t} — Bs ${pl.p}.\n${f}\nVen a probarlo.\n\n#Montero #PlatoNuevo`;
    } else if (oSel === 'hoy') {
      tit = 'HOY ESTAMOS ABIERTOS'; baj = f;
      copy = `¡Abrimos! 🍽️\n${f}\nHoy tenemos ${pl.art} ${pl.t.toLowerCase()} a Bs ${pl.p}.\nTe esperamos.\n\n#Montero #SantaCruz`;
    } else {
      tit = 'TE LO LLEVAMOS'; baj = f;
      copy = `Delivery en Montero 🛵\n${pl.t} a Bs ${pl.p}, calentito hasta tu puerta.\n${f}\nEscríbenos por WhatsApp.\n\n#DeliveryMontero`;
    }
    return { pl, tit, baj, copy };
  }, [oSel, pSel, frase]);

  return (
    <section id="redes" className="bg-carbon py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <span className="font-press-start text-[9px] bg-azul text-white px-3 py-2 tracking-widest">✱ TUS REDES, RESUELTAS</span>
        <h2 className="font-press-start text-lima text-xl sm:text-3xl md:text-4xl leading-tight mt-5 uppercase">Dilo con<br /><span className="text-crema">tus palabras.</span></h2>
        <p className="mt-4 text-crema/80 max-w-lg">No tienes que saber diseñar ni escribir para redes. Eliges tres cosas, escribes una frase como se la dirías a un amigo, y listo.</p>

        <div className="grid md:grid-cols-2 gap-8 mt-8 items-start">
          {/* controles */}
          <div>
            <label className="block font-press-start text-[9px] text-lima tracking-wider uppercase mb-3">1 ✱ Qué quieres lograr</label>
            <div className="flex gap-2 flex-wrap">
              {OBJETIVOS.map((o) => (
                <button key={o.k} onClick={() => setOSel(o.k)} className={`text-sm font-semibold px-4 py-3 border-2 transition-colors ${o.k === oSel ? 'bg-carbon text-lima border-lima' : 'bg-black/20 text-crema border-crema/25'}`}>{o.t}</button>
              ))}
            </div>
            <label className="block font-press-start text-[9px] text-lima tracking-wider uppercase mt-6 mb-3">2 ✱ Qué plato</label>
            <div className="flex gap-2 flex-wrap">
              {AFICHE_PLATOS.map((o) => (
                <button key={o.k} onClick={() => setPSel(o.k)} className={`text-sm font-semibold px-4 py-3 border-2 transition-colors ${o.k === pSel ? 'bg-carbon text-lima border-lima' : 'bg-black/20 text-crema border-crema/25'}`}>{o.t}</button>
              ))}
            </div>
            <label className="block font-press-start text-[9px] text-lima tracking-wider uppercase mt-6 mb-3">3 ✱ Dilo con tus palabras</label>
            <input value={frase} onChange={(e) => setFrase(e.target.value)} className="w-full bg-carbon border-2 border-crema/30 focus:border-lima outline-none text-crema p-4" />
            <p className="text-sm text-crema/70 mt-4">Nunca te pedimos colores, ni tipografías, ni "prompts". Eso quedó guardado cuando te dimos de alta.</p>
          </div>

          {/* vista previa */}
          <div>
            <div className="border-[3px] border-carbon bg-carbon p-2 shadow-[6px_6px_0_rgba(0,0,0,.35)]">
              <div className="relative aspect-square overflow-hidden bg-black">
                <img key={arte.pl.img} src={arte.pl.img} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" />
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-[2]">
                  <span className="w-8 h-8 grid place-items-center bg-brasa text-white font-press-start text-[10px] rounded-lg">DE</span>
                  <span className="font-press-start text-[9px] text-white tracking-wider">DOÑA ELSA</span>
                </div>
                <div className="absolute left-4 right-4 bottom-4 z-[2]">
                  <div className="font-press-start text-white text-lg sm:text-xl leading-tight uppercase" style={{ textShadow: '0 3px 14px rgba(0,0,0,.6)' }}>{arte.tit}</div>
                  <div className="text-white/90 text-sm mt-2 font-medium">{arte.baj}</div>
                </div>
                <div className="absolute top-3.5 right-3.5 z-[2] bg-brasa text-white font-press-start text-[11px] px-2.5 py-2 rounded-lg">Bs {arte.pl.p}</div>
              </div>
            </div>
            <div className="mt-4 bg-carbon border-2 border-dashed border-crema/30 p-4">
              <div className="font-press-start text-[9px] text-lima tracking-wider">✎ EL TEXTO DE LA PUBLICACIÓN</div>
              <p className="text-sm text-crema/90 mt-3 whitespace-pre-line">{arte.copy}</p>
            </div>
          </div>
        </div>

        {/* 4 formatos */}
        <h3 className="font-press-start text-lima text-sm sm:text-lg mt-12 uppercase leading-snug">El mismo aviso,<br />en los 4 tamaños que necesitas</h3>
        <div className="flex gap-3 mt-5 overflow-x-auto pb-2 md:grid md:grid-cols-4">
          {FORMATOS.map(([label, ratio]) => (
            <div key={label} className="border-[3px] border-carbon bg-carbon p-1.5 flex-[0_0_63%] md:flex-none">
              <span className="block font-press-start text-[8px] text-lima px-1 py-1.5 tracking-wide">{label}</span>
              <div className={`relative overflow-hidden bg-black ${ratio}`}>
                <img src={arte.pl.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" />
                <span className="absolute top-1.5 left-1.5 z-[2] bg-brasa text-white font-press-start text-[7px] px-1.5 py-1 rounded">DE</span>
                <span className="absolute top-1.5 right-1.5 z-[2] bg-brasa text-white font-press-start text-[7px] px-1.5 py-1 rounded">Bs {arte.pl.p}</span>
                <div className="absolute left-1.5 right-1.5 bottom-1.5 z-[2] font-press-start text-white text-[9px] leading-tight uppercase" style={{ textShadow: '0 2px 8px rgba(0,0,0,.7)' }}>{arte.tit}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-crema/70 mt-4">Esto no se paga por pieza. Es parte de la <b className="text-lima">mensualidad</b>: todos los meses tienes tu tanda de afiches incluida.</p>
      </div>
    </section>
  );
}
