import { useRef } from 'react';
import { MARCA } from './config';
import Marquee from './components/Marquee';
import MouseTrail from './components/MouseTrail';
import ScrollHero from './components/ScrollHero';
import PhotoTry, { type PhotoTryHandle } from './components/PhotoTry';
import PosterMachine from './components/PosterMachine';
import FeedbackForm from './components/FeedbackForm';
import Reveal from './components/Reveal';
import BeforeAfterSection from './components/BeforeAfterSection';
import MunecoFondo from './components/MunecoFondo';
import Intersticial from './components/Intersticial';
import OwnerPanel from './panel/OwnerPanel';
import Nuevo from './panel/Nuevo';
import DemoMenu from './panel/DemoMenu';

export default function App() {
  const photoRef = useRef<PhotoTryHandle>(null);
  const ruta = location.pathname.replace(/\/+$/, '');

  // /demo    → el menú (negocio + logo + armado de pedido + cocina)
  // /nuevo   → pantalla de alta (identificador, clave y QR)
  // ?r=<local> → carta de un restaurante (cliente + panel del dueño)
  // resto    → landing de venta
  if (ruta.endsWith('/demo')) return <DemoMenu />;
  if (ruta.endsWith('/nuevo')) return <Nuevo />;
  if (new URLSearchParams(location.search).get('r')) return <OwnerPanel />;

  return (
    <div className="relative w-full select-none">
      <MouseTrail />
      <MunecoFondo />

      <div className="relative z-10">
      <ScrollHero onProbar={() => photoRef.current?.abrir()} />

      <Marquee variant="band" />

      {/* Las dos cosas */}
      <section className="bg-negro/45 py-16 md:py-24 px-6">
        <Reveal className="max-w-4xl mx-auto">
          <h2 className="font-press-start text-maiz text-xl sm:text-3xl md:text-4xl leading-tight uppercase">Hacemos<br /><span className="text-crema">dos cosas.</span></h2>
          <p className="mt-4 text-crema/80 max-w-lg">Nada más. Pero esas dos las hacemos bien, y son las dos que te faltan.</p>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <a href="/demo" className="block bg-rojo border-[3px] border-negro p-6 shadow-[6px_6px_0_var(--color-maiz)] active:translate-x-1 active:translate-y-1 transition-transform">
              <span className="font-press-start text-4xl text-maiz leading-none block">01</span>
              <h3 className="font-press-start text-sm text-crema mt-4 leading-snug uppercase">Tu carta se vuelve una experiencia</h3>
              <p className="text-sm text-crema/90 mt-3">El cliente pide desde la mesa y a la cocina le llega la comanda al instante. Pruébalo en vivo.</p>
              <span className="font-press-start text-[9px] text-maiz mt-4 inline-block tracking-wider">Probar el menú ▸</span>
            </a>
            <a href="#redes" className="block bg-maiz text-negro border-[3px] border-negro p-6 shadow-[6px_6px_0_var(--color-azul)] active:translate-x-1 active:translate-y-1 transition-transform">
              <span className="font-press-start text-4xl text-rojo leading-none block">02</span>
              <h3 className="font-press-start text-sm mt-4 leading-snug uppercase">Tus redes resueltas</h3>
              <p className="text-sm text-negro/80 mt-3">Sacas la foto con tu celular, nosotros te devolvemos el afiche listo, con tu marca y el texto escrito.</p>
              <span className="font-press-start text-[9px] text-rojo mt-4 inline-block tracking-wider">Ver cómo ▸</span>
            </a>
          </div>
        </Reveal>
      </section>

      <PhotoTry ref={photoRef} />

      <Intersticial frase={'LA MISMA COMIDA.\nOTRA FOTO.'} />

      <BeforeAfterSection />
      <PosterMachine />

      {/* CTA al menú (demostración gratuita) */}
      <section className="bg-negro/45 py-16 md:py-20 px-6 text-center">
        <Reveal className="max-w-2xl mx-auto">
          <span className="font-press-start text-[9px] bg-lima text-negro px-3 py-2 tracking-widest">✱ DEMOSTRACIÓN GRATIS</span>
          <h2 className="font-press-start text-maiz text-xl sm:text-3xl leading-tight mt-5 uppercase" style={{ textShadow: '3px 3px 0 var(--color-rojo)' }}>Pruébalo<br /><span className="text-crema">sin costo.</span></h2>
          <p className="mt-4 text-crema/85">Arma un pedido desde la mesa y míralo llegar a la cocina en vivo. Gratis, sin compromiso.</p>
          <a href="/demo" className="inline-block mt-6 font-press-start text-[11px] text-crema bg-rojo border-[3px] border-negro py-4 px-7 shadow-[5px_5px_0_var(--color-maiz)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest">Probar el menú en vivo ▸</a>
        </Reveal>
      </section>

      <footer id="contacto" className="bg-negro/60 border-t-4 border-maiz py-16 px-6 text-center">
        <div className="font-press-start text-maiz text-lg">{MARCA.nombre}</div>
        <p className="text-crema/50 text-sm mt-4">{MARCA.ciudad}<br />{MARCA.eslogan}</p>
        <p className="text-crema/40 text-xs mt-6 max-w-md mx-auto font-mono">Desliza hasta abajo para dejarnos tu contacto — o toca "Contacto" arriba.</p>
      </footer>
      </div>

      <FeedbackForm />
    </div>
  );
}
