import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FALLOS, mejorar, pareceComida, recorte, type Aviso } from '../lib/api';
import { ESTUDIO_MEJORAR_URL } from '../config';

export type PhotoTryHandle = { abrir: () => void };

type Estado = 'idle' | 'proc' | 'dudoso' | 'falla' | 'resul';

// Ventana (no sección) para probar el motor con una foto propia. Se abre desde
// el hero, desde la tarjeta "+" del carrusel o desde el botón de la sección.
const PhotoTry = forwardRef<PhotoTryHandle>(function PhotoTry(_props, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const origCanvas = useRef<HTMLCanvasElement | null>(null);

  const [abierto, setAbierto] = useState(false);
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

  const abrir = () => { setAbierto(true); setTimeout(() => inputRef.current?.click(), 350); };
  const elegir = () => inputRef.current?.click();
  const cerrar = () => setAbierto(false);
  useImperativeHandle(ref, () => ({ abrir }));

  useEffect(() => {
    if (!abierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [abierto]);

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
    a.download = 'mi-plato-meza.jpg';
    a.href = despues; a.click();
  };

  const moverBA = (clientX: number) => {
    const el = baRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setX(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };
  const actBA = useRef(false);

  const btnLima = 'font-press-start text-[9px] text-carbon bg-lima border-[3px] border-carbon py-3.5 uppercase tracking-wider cursor-pointer';
  const btnLinea = 'font-press-start text-[9px] text-crema border-2 border-crema/50 py-3.5 uppercase tracking-wider cursor-pointer';

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      {abierto && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={cerrar} role="dialog" aria-modal="true">
          <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-8">
            <section onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xl bg-negro border-[3px] border-lima shadow-[8px_8px_0_var(--color-rojo)] p-5 sm:p-7">
              <button onClick={cerrar} aria-label="Cerrar" className="absolute top-3 right-3 font-press-start text-[12px] text-crema/60 hover:text-rojo cursor-pointer bg-transparent border-none">[X]</button>

              <span className="font-press-start text-[8px] bg-maiz text-negro px-3 py-2 tracking-widest">✱ PRUÉBALO CON TU COMIDA</span>
              <h2 className="font-press-start text-maiz text-lg sm:text-2xl leading-tight mt-4 uppercase">Sube una foto<br /><span className="text-crema">y mira qué pasa.</span></h2>
              <p className="mt-3 text-crema/80 text-sm">Plato entero, servido y con luz. Si el fondo es feo o sale la mesa de al lado, no importa: eso lo limpiamos nosotros.</p>

              {(estado === 'idle' || estado === 'proc') && (
                <button onClick={elegir} disabled={estado === 'proc'} className="w-full mt-5 font-press-start text-[11px] text-crema bg-rojo border-[3px] border-negro py-5 shadow-[5px_5px_0_var(--color-maiz)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest cursor-pointer disabled:opacity-60">
                  📷 Elegir una foto ▸
                </button>
              )}
              <p className="text-center text-xs text-crema/50 mt-2">Se usa solo para arreglarla. No la guardamos ni la publicamos.</p>

              {estado === 'proc' && (
                <div className="mt-5 text-center">
                  <div className="h-2 bg-crema/15 border-2 border-carbon overflow-hidden"><i className="block h-full bg-lima transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
                  <p className="font-mono text-sm text-lima mt-3">{procTxt}…</p>
                </div>
              )}

              {estado === 'dudoso' && (
                <div className="mt-5 bg-maiz text-carbon border-[3px] border-carbon shadow-[5px_5px_0_rgba(0,0,0,.4)] p-5">
                  <div className="font-press-start text-[12px] leading-snug">🤔 Mmm… esto no parece comida</div>
                  <p className="mt-3 text-sm">Puede que me esté equivocando — con ensaladas y sopas claras a veces me confundo. Si es un plato de verdad, adelante.</p>
                  <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
                    <button onClick={() => arreglar(false)} className="font-press-start text-[9px] bg-lima border-2 border-carbon py-3.5 uppercase tracking-wider cursor-pointer">Es comida, arréglala ▸</button>
                    <button onClick={elegir} className="font-press-start text-[9px] border-2 border-carbon/50 py-3.5 uppercase tracking-wider cursor-pointer">Elegir otra foto</button>
                  </div>
                </div>
              )}

              {estado === 'falla' && (
                <div className="mt-5 bg-maiz text-carbon border-[3px] border-carbon shadow-[5px_5px_0_rgba(0,0,0,.4)] p-5">
                  <div className="font-press-start text-[12px] leading-snug">{falla.tit}</div>
                  <p className="mt-3 text-sm">{falla.txt}</p>
                  {falla.cod && <p className="font-mono text-[11px] opacity-60 mt-2">código: {falla.cod}</p>}
                  <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
                    <button onClick={elegir} className="font-press-start text-[9px] border-2 border-carbon/50 py-3.5 uppercase tracking-wider cursor-pointer">Probar con otra</button>
                    <a href="#contacto" onClick={cerrar} className="font-press-start text-[9px] bg-lima border-2 border-carbon py-3.5 text-center uppercase tracking-wider">Escríbenos ▸</a>
                  </div>
                </div>
              )}

              {estado === 'resul' && (
                <div className="mt-5">
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
                    <div className="mt-4 border-l-4 border-lime bg-lima/10 px-4 py-3.5">
                      <div className="font-press-start text-[10px] text-lima tracking-wide mb-1.5">{aviso.tit}</div>
                      <p className="text-sm text-crema/90">{aviso.txt}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
                    {mostrarPlato && <button onClick={() => arreglar(true)} className={btnLima}>🍽️ Ponerlo en un plato ▸</button>}
                    <button onClick={descargar} className={btnLima}>Guardar mi foto ▸</button>
                    <button onClick={elegir} className={btnLinea}>Probar con otra</button>
                  </div>

                  <div className="mt-5 border-[3px] border-lima bg-[#0A0605]">
                    <div className="bg-lima text-carbon font-press-start text-[9px] tracking-wide px-3 py-2.5 flex justify-between"><span>▸ LO QUE PASÓ</span><span>{motor}</span></div>
                    <div className="p-4">
                      <p className="text-sm text-crema/90"><b className="text-lima">Tu comida no cambió.</b> Corregimos la luz, sacamos el ruido, dimos nitidez y limpiamos el fondo. Las mismas presas, la misma porción, el mismo plato.</p>
                      <a href="#contacto" onClick={cerrar} className="block mt-4 font-press-start text-[9px] text-carbon bg-lima border-[3px] border-carbon py-4 text-center uppercase tracking-wider">Quiero toda mi carta así ▸</a>
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-5 pt-4 border-t border-crema/15 text-xs text-crema/60">
                ¿Quieres comparar con otro motor? <a href={ESTUDIO_MEJORAR_URL} target="_blank" rel="noopener noreferrer" className="text-maiz underline underline-offset-2">Probar en el Estudio IA ▸</a>
              </p>
            </section>
          </div>
        </div>
      )}
    </>
  );
});

export default PhotoTry;
