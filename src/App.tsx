import { useRef } from 'react';
import { MARCA } from './config';
import Marquee from './components/Marquee';
import MouseTrail from './components/MouseTrail';
import ScrollHero from './components/ScrollHero';
import PhotoTry, { type PhotoTryHandle } from './components/PhotoTry';
import MenuSection from './components/MenuSection';
import PosterMachine from './components/PosterMachine';
import Pricing from './components/Pricing';
import FeedbackForm from './components/FeedbackForm';
import Reveal from './components/Reveal';
import OwnerPanel from './panel/OwnerPanel';
import Nuevo from './panel/Nuevo';

export default function App() {
  const photoRef = useRef<PhotoTryHandle>(null);

  // /nuevo   → pantalla de alta (identificador, clave y QR)
  // ?r=<local> → carta de un restaurante (cliente + panel del dueño)
  // resto    → landing de venta
  if (location.pathname.replace(/\/+$/, '').endsWith('/nuevo')) return <Nuevo />;
  if (new URLSearchParams(location.search).get('r')) return <OwnerPanel />;

  return (
    <div className="relative w-full bg-slate-950 select-none">
      <MouseTrail />

      <ScrollHero onProbar={() => photoRef.current?.abrir()} />

      <Marquee variant="band" />

      {/* Las dos cosas */}
      <section className="bg-carbon py-16 md:py-24 px-6">
        <Reveal className="max-w-4xl mx-auto">
          <h2 className="font-press-start text-lima text-xl sm:text-3xl md:text-4xl leading-tight uppercase">Hacemos<br /><span className="text-crema">dos cosas.</span></h2>
          <p className="mt-4 text-crema/80 max-w-lg">Nada más. Pero esas dos las hacemos bien, y son las dos que te faltan.</p>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <a href="#menu" className="block bg-[#0A0605] border-[3px] border-carbon p-6 shadow-[6px_6px_0_rgba(0,0,0,.35)] active:translate-x-1 active:translate-y-1 transition-transform">
              <span className="font-press-start text-4xl text-lima leading-none block">01</span>
              <h3 className="font-press-start text-sm text-crema mt-4 leading-snug uppercase">Tu carta se vuelve una experiencia</h3>
              <p className="text-sm text-crema/70 mt-3">El cliente escanea el QR de la mesa y ve tus platos en 3D. Los gira con el dedo antes de pedir.</p>
              <span className="font-press-start text-[9px] text-lima mt-4 inline-block tracking-wider">Ver cómo ▸</span>
            </a>
            <a href="#redes" className="block bg-crema text-carbon border-[3px] border-carbon p-6 shadow-[6px_6px_0_rgba(0,0,0,.35)] active:translate-x-1 active:translate-y-1 transition-transform">
              <span className="font-press-start text-4xl text-brasa leading-none block">02</span>
              <h3 className="font-press-start text-sm mt-4 leading-snug uppercase">Tus redes resueltas</h3>
              <p className="text-sm text-carbon/70 mt-3">Sacas la foto con tu celular, nosotros te devolvemos el afiche listo, con tu marca y el texto escrito.</p>
              <span className="font-press-start text-[9px] text-brasa mt-4 inline-block tracking-wider">Ver cómo ▸</span>
            </a>
          </div>
        </Reveal>
      </section>

      <PhotoTry ref={photoRef} />
      <MenuSection />
      <PosterMachine />
      <Pricing />

      <footer id="contacto" className="bg-carbon border-t-4 border-lima py-16 px-6 text-center">
        <div className="font-press-start text-lima text-lg">{MARCA.nombre}</div>
        <p className="text-crema/50 text-sm mt-4">{MARCA.ciudad}<br />{MARCA.eslogan}</p>
        <p className="text-crema/40 text-xs mt-6 max-w-md mx-auto font-mono">Desliza hasta abajo para dejarnos tu contacto — o toca "Contacto" arriba.</p>
      </footer>

      <FeedbackForm />
    </div>
  );
}
