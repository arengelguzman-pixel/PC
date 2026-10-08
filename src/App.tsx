import { useRef } from 'react';
import { MARCA } from './config';
import Marquee from './components/Marquee';
import MouseTrail from './components/MouseTrail';
import ScrollHero from './components/ScrollHero';
import ComoFunciona from './components/ComoFunciona';
import FotosAnillo from './components/FotosAnillo';
import PhotoTry, { type PhotoTryHandle } from './components/PhotoTry';
import FeedbackForm from './components/FeedbackForm';
import Reveal from './components/Reveal';
import MunecoFondo from './components/MunecoFondo';
import Intersticial from './components/Intersticial';
import LogoMeza from './components/LogoMeza';
import CtaMovil from './components/CtaMovil';
import OwnerPanel from './panel/OwnerPanel';
import Nuevo from './panel/Nuevo';
import DemoMenu from './panel/DemoMenu';
import CartaAfiliado from './panel/afiliado/CartaAfiliado';
import { AFILIADOS } from './afiliados/elGaraje';
import { PROTOTIPOS } from './afiliados/prototipos';

export default function App() {
  const photoRef = useRef<PhotoTryHandle>(null);
  const ruta = location.pathname.replace(/\/+$/, '');

  // /m/<token> → menú personalizado de un afiliado (link secreto)
  // /demo    → el menú demo (negocio + logo + armado de pedido + cocina)
  // /nuevo   → pantalla de alta (identificador, clave y QR)
  // ?r=<local> → carta de un restaurante (cliente + panel del dueño)
  // resto    → landing de venta
  const mMatch = ruta.match(/\/m\/([a-z0-9-]+)$/i);
  if (mMatch) {
    const af = [...AFILIADOS, ...PROTOTIPOS].find((a) => a.token === mMatch[1]);
    if (af) return <CartaAfiliado data={af} />;
  }
  if (ruta.endsWith('/demo')) return <DemoMenu />;
  if (ruta.endsWith('/nuevo')) return <Nuevo />;
  if (new URLSearchParams(location.search).get('r')) return <OwnerPanel />;

  // Landing: corta. Hero → qué hace (3 pasos) → fotos (carrusel) → demo gratis + contacto.
  const abrirFoto = () => photoRef.current?.abrir();
  return (
    <div className="relative w-full select-none">
      <MouseTrail />
      <MunecoFondo />

      <div className="relative z-10">
        <ScrollHero onProbar={abrirFoto} />
        <Marquee variant="band" />
        <ComoFunciona />
        <Intersticial frase={'TU CARTA\nYA NO ES UN PAPEL.'} />
        <FotosAnillo onSubir={abrirFoto} />

        <section id="contacto" className="bg-negro/60 border-t-4 border-maiz py-16 md:py-20 px-6">
          <Reveal className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="font-press-start text-[9px] bg-lima text-negro px-3 py-2 tracking-widest">✱ DEMOSTRACIÓN GRATIS</span>
              <h2 className="font-press-start text-maiz text-xl sm:text-3xl leading-tight mt-5 uppercase" style={{ textShadow: '3px 3px 0 var(--color-rojo)' }}>Pruébalo<br /><span className="text-crema">sin costo.</span></h2>
              <p className="mt-4 text-crema/85 max-w-md">Arma un pedido desde la mesa y míralo llegar a la cocina en vivo. Gratis, sin compromiso.</p>
              <a href="/demo" className="inline-block mt-6 font-press-start text-[11px] text-crema bg-rojo border-[3px] border-negro py-4 px-7 shadow-[5px_5px_0_var(--color-maiz)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest">Probar el menú en vivo ▸</a>
            </div>
            <div className="md:justify-self-end w-full max-w-[460px]"><FeedbackForm /></div>
          </Reveal>
        </section>

        <footer className="bg-carbon/80 py-10 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <LogoMeza alto={40} byZeta />
            <p className="font-press-start text-[9px] text-maiz uppercase tracking-wider">{MARCA.eslogan}</p>
          </div>
        </footer>
      </div>

      <CtaMovil />
      <PhotoTry ref={photoRef} />
    </div>
  );
}
