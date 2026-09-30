import { useEffect, useState } from 'react';

// Botón fijo abajo en celular: aparece pasado el hero y se esconde al llegar al pie.
export default function CtaMovil() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const f = () => {
      const fin = document.documentElement.scrollHeight - window.innerHeight * 1.7;
      setVisible(window.scrollY > window.innerHeight * 0.85 && window.scrollY < fin);
    };
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <div className={`md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-carbon/90 backdrop-blur border-t-2 border-lima transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
      <a href="/demo" className="block text-center font-press-start text-[10px] text-negro bg-lima py-3.5 uppercase tracking-widest">Probar el menú en vivo ▸</a>
    </div>
  );
}
