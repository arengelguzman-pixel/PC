import { useRef } from 'react';
import { MARCA } from './config';
import Marquee from './components/Marquee';
import MouseTrail from './components/MouseTrail';
import ScrollHero from './components/ScrollHero';
import ComoFunciona from './components/ComoFunciona';
import PhotoTry, { type PhotoTryHandle } from './components/PhotoTry';
import PosterMachine from './components/PosterMachine';
import FeedbackForm from './components/FeedbackForm';
import Reveal from './components/Reveal';
import BeforeAfterSection from './components/BeforeAfterSection';
import MunecoFondo from './components/MunecoFondo';
import Intersticial from './components/Intersticial';
import LogoMeza from './components/LogoMeza';
import OwnerPanel from './panel/OwnerPanel';
import Nuevo from './panel/Nuevo';
import DemoMenu from './panel/DemoMenu';
import CartaAfiliado from './panel/afiliado/CartaAfiliado';
import { AFILIADOS } from './afiliados/elGaraje';

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
    const af = AFILIADOS.find((a) => a.token === mMatch[1]);
    if (af) return <CartaAfiliado data={af} />;
  }
  if (ruta.endsWith('/demo')) return <DemoMenu />;
  if (ruta.endsWith('/nuevo')) return <Nuevo />;
  if (new URLSearchParams(location.search).get('r')) return <OwnerPanel />;

  // Landing: corta y útil. Hero → qué hace (3 pasos) → fotos → redes → CTA.
  return (
    <div className="relative w-full select-none">
      <MouseTrail />
      <MunecoFondo />

      <div className="relative z-10">
        <ScrollHero onProbar={() => photoRef.current?.abrir()} />
        <Marquee variant="band" />
        <ComoFunciona />
        <PhotoTry ref={photoRef} />
        <Intersticial frase={'LA MISMA COMIDA.\nOTRA FOTO.'} />
        <BeforeAfterSection />
        <PosterMachine />

        {/* CTA final (demostración gratuita) */}
        <section className="bg-negro/45 py-16 md:py-20 px-6 text-center">
          <Reveal className="max-w-2xl mx-auto">
            <span className="font-press-start text-[9px] bg-lima text-negro px-3 py-2 tracking-widest">✱ DEMOSTRACIÓN GRATIS</span>
            <h2 className="font-press-start text-maiz text-xl sm:text-3xl leading-tight mt-5 uppercase" style={{ textShadow: '3px 3px 0 var(--color-rojo)' }}>Pruébalo<br /><span className="text-crema">sin costo.</span></h2>
            <p className="mt-4 text-crema/85">Arma un pedido desde la mesa y míralo llegar a la cocina en vivo. Gratis, sin compromiso.</p>
            <a href="/demo" className="inline-block mt-6 font-press-start text-[11px] text-crema bg-rojo border-[3px] border-negro py-4 px-7 shadow-[5px_5px_0_var(--color-maiz)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest">Probar el menú en vivo ▸</a>
          </Reveal>
        </section>

        <footer id="contacto" className="bg-negro/60 border-t-4 border-maiz py-14 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <LogoMeza alto={48} byZeta />
            <div className="text-center md:text-right">
              <p className="font-press-start text-[9px] text-maiz uppercase tracking-wider">{MARCA.eslogan}</p>
              <p className="text-crema/50 text-sm mt-3">{MARCA.ciudad}</p>
              <p className="text-crema/40 text-xs mt-3 font-mono">Desliza hasta abajo para dejarnos tu contacto.</p>
            </div>
          </div>
        </footer>
      </div>

      <FeedbackForm />
    </div>
  );
}
