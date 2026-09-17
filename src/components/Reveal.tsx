import { useEffect, useRef, type ReactNode } from 'react';

// Revela el contenido al entrar en el viewport (clase .rev/.in de index.css).
export default function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { el.classList.add('in'); io.unobserve(el); }
      }),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`rev ${className}`}>{children}</div>;
}
