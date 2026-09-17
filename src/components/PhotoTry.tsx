import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FALLOS, mejorar, pareceComida, recorte, type Aviso } from '../lib/api';

export type PhotoTryHandle = { abrir: () => void };

type Estado = 'idle' | 'proc' | 'dudoso' | 'falla' | 'resul';

const PhotoTry = forwardRef<PhotoTryHandle>(function PhotoTry(_props, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const seccionRef = useRef<HTMLElement>(null);
  const origCanvas = useRef<HTMLCanvasElement | null>(null);

  const [estado, setEstado] = useState<Estado>('idle');
  const [pct, setPct] = useState(0);
  const [procTxt, setProcTxt] = useState('leyendo tu foto');
  const [antes, setAntes] = useState('');
  const [despues, setDespues] = useState('');
  const [motor, setMotor] = useState('MOTOR REAL');
  const [aviso, setAviso] = useState<{ tit: string; txt: string } | null>(null);
  const [mostrarPlato, setMostrarPlato] = useState(false);
  const [falla, setFalla] = useState<{ tit: string; txt: string; cod?: string }>({ tit: '', txt: '' });
  const [x, setX] = useState(50);
  const baRef = useRef<HTMLDivElement>(null);
  const relojRef = useRef<number | null>(null);

  const abrir = () => {
    seccionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    setTimeout(() => inputRef.current?.click(), 420);
  };
  useImperativeHandle(ref, () => ({ abrir }));

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return fallo('⚠️ Eso no es una foto', 'Elige una imagen de tu galería.');
    if (f.size > 20 * 1024 * 1024) return fallo('📦 Esa foto pesa demasiado', 'Prueba con una más chica, o vuelve a sacarla.');

    setEstado('proc'); setPct(10); setProcTxt('leyendo tu foto');
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const cv = recorte(im);
      origCanvas.current = cv;
      setAntes(cv.toDataURL('image/jpeg', 0.92));
      if (pareceComida(cv) < 0.16) setEstado('dudoso');
      else arreglar(false);
    };
    im.onerror = () => fallo('No pude leer esa foto', 'A veces pasa con fotos muy viejas o capturas. Prueba con otra.');
    im.src = url;
  };

  const arreglar = async (enPlato: boolean) => {
    const cv = origCanvas.current;
    if (!cv) return;
    setEstado('proc');
    const frases: [number, string][] = [
      [18, 'mandando la foto al motor'], [34, 'corrigiendo el color de la luz'],
      [52, 'volviendo a iluminar el plato'], [68, enPlato ? 'pasándolo a un plato' : 'limpiando el fondo'],
      [82, 'dándole nitidez'], [92, 'revisando que la comida no haya cambiado'],
    ];
    let k = 0;
    setPct(frases[0][0]); setProcTxt(frases[0][1]);
    relojRef.current = window.setInterval(() => {
      k = Math.min(k + 1, frases.length - 1);
      setPct(frases[k][0]); setProcTxt(frases[k][1]);
    }, 1900);

    const j = await mejorar(cv.toDataURL('image/jpeg', 0.9), enPlato);
    if (relojRef.current) clearInterval(relojRef.current);

    if (!j.ok || !j.foto) {
      const [tit, txt] = FALLOS[j.causa || ''] || ['😕 No se pudo esta vez', 'Prueba de nuevo en un momento.'];
      setFalla({ tit, txt, cod: j.codigo });
      setEstado('falla');
      return;
    }
    setPct(100); setProcTxt('listo');
    setDespues(j.foto);
    setMotor(j.motor === 'higgsfield' ? 'MOTOR · HIGGSFIELD' : 'MOTOR · NANO BANANA');
    pintarAviso(j.aviso ?? null, enPlato);
    setTimeout(() => { setEstado('resul'); baRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 380);
  };

  const pintarAviso = (a: Aviso, enPlato: boolean) => {
    setMostrarPlato(!!(a && a.envase && !enPlato));
    if (a && a.empezado) {
      setAviso({ tit: 'OJO CON ESTA FOTO', txt: 'Parece que el plato ya estaba empezado. La arreglamos igual — pero para tu carta conviene una foto del plato entero, recién servido.' });
    } else if (enPlato) {
      setAviso({ tit: 'SERVIDO EN PLATO', txt: 'Es la misma comida, las mismas piezas y la misma porción — solo cambiamos el envase por un plato.' });
    } else setAviso(null);
  };

  const fallo = (tit: string, txt: string) => { setFalla({ tit, txt }); setEstado('falla'); };

  const descargar = () => {
    if (!despues) return;
    const a = document.createElement('a');
    a.download = 'mi-plato-plato-vivo.jpg';
    a.href = despues; a.click();
  };

  const moverBA = (clientX: number) => {
    const el = baRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setX(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };
  const actBA = useRef(false);

  return (
    <section ref={seccionRef} id="probar" className="bg-carbon py-16 md:py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <span className="font-press-start text-[9px] bg-lima text-carbon px-3 py-2 tracking-widest">✱ PRUÉBALO CON TU COMIDA</span>
        <h2 className="font-press-start text-lima text-xl sm:text-3xl md:text-4xl leading-tight mt-5 uppercase">Sube una foto<br /><span className="text-crema">y mira qué pasa.</span></h2>
        <p className="mt-4 text-crema/80 max-w-lg">Sácale una foto a un plato tuyo ahora, o elige una de tu galería. La arregla el mismo motor que usamos para las cartas de verdad. Tarda unos segundos.</p>

        <div className="mt-6 border-2 border-dashed border-crema/25 p-5">
          <p className="font-press-start text-[9px] text-lima tracking-widest uppercase mb-4">Para que salga bien, la foto debe ser:</p>
          <ul className="grid gap-3">
            {[['Un plato entero', 'sin empezar a comer'], ['Servido y ordenado', 'como se lo das al cliente'], ['De arriba o de costado', 'que se vea todo el plato'], ['Con luz', 'de día o cerca de una ventana']].map(([b, s]) => (
              <li key={b} className="pl-6 relative"><span className="absolute left-0 text-lima font-bold">✓</span><b className="text-crema">{b}</b> <span className="text-crema/60 text-sm">— {s}</span></li>
            ))}
          </ul>
          <p className="text-sm text-crema/60 mt-4 pt-3 border-t border-crema/15">No importa que esté en plumavit, que el mantel sea feo o que salga la mesa de al lado. Eso lo limpiamos nosotros.</p>
        </div>

        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
        <button onClick={abrir} className="w-full mt-5 font-press-start text-[11px] text-carbon bg-lima border-[3px] border-carbon py-6 shadow-[5px_5px_0_var(--color-azul)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer">
          📷 Elegir una foto ▸
        </button>
        <p className="text-center text-sm text-crema/50 mt-3">Se usa solo para arreglarla. No la guardamos ni la publicamos.</p>

        {estado === 'proc' && (
          <div className="mt-6 text-center">
            <div className="h-2 bg-crema/15 border-2 border-carbon overflow-hidden"><i className="block h-full bg-lima transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
            <p className="font-mono text-sm text-lima mt-3">{procTxt}…</p>
          </div>
        )}

        {estado === 'dudoso' && (
          <div className="mt-6 bg-maiz text-carbon border-[3px] border-carbon shadow-[5px_5px_0_rgba(0,0,0,.4)] p-5">
            <div className="font-press-start text-[12px] leading-snug">🤔 Mmm… esto no parece comida</div>
            <p className="mt-3 text-sm">Puede que me esté equivocando — con ensaladas y sopas claras a veces me confundo. Si es un plato de verdad, adelante.</p>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
              <button onClick={() => arreglar(false)} className="font-press-start text-[9px] bg-lima border-2 border-carbon py-3.5 uppercase tracking-wider cursor-pointer">Es comida, arréglala ▸</button>
              <button onClick={abrir} className="font-press-start text-[9px] border-2 border-carbon/50 py-3.5 uppercase tracking-wider cursor-pointer">Elegir otra foto</button>
            </div>
          </div>
        )}

        {estado === 'falla' && (
          <div className="mt-6 bg-maiz text-carbon border-[3px] border-carbon shadow-[5px_5px_0_rgba(0,0,0,.4)] p-5">
            <div className="font-press-start text-[12px] leading-snug">{falla.tit}</div>
            <p className="mt-3 text-sm">{falla.txt}</p>
            {falla.cod && <p className="font-mono text-[11px] opacity-60 mt-2">código: {falla.cod}</p>}
            <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
              <button onClick={abrir} className="font-press-start text-[9px] border-2 border-carbon/50 py-3.5 uppercase tracking-wider cursor-pointer">Probar con otra</button>
              <a href="#contacto" className="font-press-start text-[9px] bg-lima border-2 border-carbon py-3.5 text-center uppercase tracking-wider">Escríbenos ▸</a>
            </div>
          </div>
        )}

        {estado === 'resul' && (
          <div className="mt-6">
            <div
              ref={baRef}
              className="relative border-[3px] border-lima overflow-hidden aspect-square bg-black select-none touch-none cursor-ew-resize"
              onPointerDown={(e) => { actBA.current = true; e.currentTarget.setPointerCapture(e.pointerId); moverBA(e.clientX); }}
              onPointerMove={(e) => actBA.current && moverBA(e.clientX)}
              onPointerUp={() => (actBA.current = false)}
              onPointerCancel={() => (actBA.current = false)}
            >
              <img src={antes} alt="Tu foto" className="absolute inset-0 w-full h-full object-cover" />
              <img src={despues} alt="Arreglada" className="absolute inset-0 w-full h-full object-cover ba-clip" style={{ ['--x' as string]: `${x}%` }} />
              <span className="absolute bottom-3 left-3 z-[3] font-press-start text-[8px] px-2 py-1.5 tracking-widest bg-carbon text-crema">TU FOTO</span>
              <span className="absolute bottom-3 right-3 z-[3] font-press-start text-[8px] px-2 py-1.5 tracking-widest bg-lima text-carbon">ARREGLADA</span>
              <div className="absolute top-0 bottom-0 w-1 bg-lima z-[3]" style={{ left: `${x}%` }} />
              <div className="absolute top-1/2 z-[4] w-[54px] h-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lima border-[3px] border-carbon grid place-items-center text-carbon font-press-start text-[15px]" style={{ left: `${x}%` }}>↔</div>
            </div>

            {aviso && (
              <div className="mt-4 border-l-4 border-lima bg-lima/10 px-4 py-3.5">
                <div className="font-press-start text-[10px] text-lima tracking-wide mb-1.5">{aviso.tit}</div>
                <p className="text-sm text-crema/90">{aviso.txt}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
              {mostrarPlato && <button onClick={() => arreglar(true)} className="font-press-start text-[9px] text-carbon bg-lima border-[3px] border-carbon py-4 uppercase tracking-wider cursor-pointer">🍽️ Ponerlo en un plato ▸</button>}
              <button onClick={descargar} className="font-press-start text-[9px] text-carbon bg-lima border-[3px] border-carbon py-4 uppercase tracking-wider cursor-pointer">Guardar mi foto ▸</button>
              <button onClick={abrir} className="font-press-start text-[9px] text-crema border-2 border-crema/50 py-4 uppercase tracking-wider cursor-pointer">Probar con otra</button>
            </div>

            <div className="mt-6 border-[3px] border-lima bg-[#0A0605]">
              <div className="bg-lima text-carbon font-press-start text-[9px] tracking-wide px-3 py-2.5 flex justify-between"><span>▸ LO QUE ACABA DE PASAR</span><span>{motor}</span></div>
              <div className="p-5">
                <p className="text-sm text-crema/90">Le corrigió el color de la luz, la volvió a iluminar como en estudio, le sacó el ruido, le dio nitidez y le limpió el fondo: fuera manos, servilletas, botellas y cables.</p>
                <p className="text-sm text-crema/90 mt-3"><b className="text-lima">Tu comida no cambió.</b> Las mismas presas, la misma porción, el mismo plato. Arreglamos la foto, nunca el plato.</p>
                <a href="#contacto" className="block mt-4 font-press-start text-[9px] text-carbon bg-lima border-[3px] border-carbon py-4 text-center uppercase tracking-wider">Quiero toda mi carta así ▸</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export default PhotoTry;
