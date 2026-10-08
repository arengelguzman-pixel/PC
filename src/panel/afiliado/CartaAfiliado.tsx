import { useEffect, useMemo, useState } from 'react';
import LogoMeza from '../../components/LogoMeza';
import type { Afiliado } from '../../afiliados/elGaraje';
import { conectarSala, claveGuardada, guardarClave, type Pedido } from '../../lib/pedidos';
import { PuertaClave } from './comunes';
import Cliente from './Cliente';
import Cocina from './Cocina';
import Caja from './Caja';

// Shell del menú de un afiliado (link secreto). Mantiene UNA conexión en tiempo
// real con la sala del local y reparte el estado a las tres vistas:
//  · Cliente → su marca; pide, paga por QR (sube comprobante) o en caja, sigue su pedido.
//  · Cocina  → nuestra tipografía; comanda con alarma, tiempos, disponibilidad.
//  · Caja    → nuestra tipografía; confirma pagos viendo el comprobante, gestiona el QR de cobro.

export type Vista = 'cliente' | 'cocina' | 'caja';

export default function CartaAfiliado({ data }: { data: Afiliado }) {
  const params = useMemo(() => new URLSearchParams(location.search), []);
  // Modo personal: solo si el link trae ?vista=cocina|caja se muestran esas
  // pestañas. El comensal (link del QR de la mesa) ve únicamente el menú.
  const modoStaff = params.get('vista') === 'cocina' || params.get('vista') === 'caja';
  const [vista, setVista] = useState<Vista>(() => {
    const v = params.get('vista');
    return v === 'cocina' || v === 'caja' ? v : 'cliente';
  });
  const mesa = useMemo(() => (params.get('mesa') || '').replace(/[^0-9A-Za-z-]/g, '').slice(0, 6), [params]);

  // estado en vivo de la sala
  const [pedidos, setPedidos] = useState<Record<string, Pedido>>({});
  const [agotados, setAgotados] = useState<string[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [cierreDesde, setCierreDesde] = useState(0);     // inicio del turno abierto de caja
  const [conectado, setConectado] = useState(false);
  const [clave, setClaveEstado] = useState(() => claveGuardada(data.local));
  const setClave = (c: string) => { guardarClave(data.local, c); setClaveEstado(c); };

  useEffect(() => {
    document.title = `${data.nombre} · Menú`;
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    // ícono y nombre del local al "Agregar a inicio" (iPhone/Android): su logo, no el de MEZA
    const icono = data.icono || data.logo;
    document.querySelectorAll('link[rel="apple-touch-icon"], link[rel="icon"]').forEach((l) => l.remove());
    for (const rel of ['apple-touch-icon', 'icon']) { const l = document.createElement('link'); l.rel = rel; l.href = icono; document.head.appendChild(l); }
    const t = document.createElement('meta'); t.name = 'apple-mobile-web-app-title'; t.content = data.nombre; document.head.appendChild(t);
    const c = document.createElement('meta'); c.name = 'theme-color'; c.content = '#0B0B0B'; document.head.appendChild(c);
    const cerrar = conectarSala(data.local, (e) => {
      if (e.type === 'estado') {
        setPedidos(Object.fromEntries(e.pedidos.map((p) => [p.id, p])));
        setAgotados(e.agotados); setQr(e.qr); setCierreDesde(e.cierreDesde || 0);
      } else if (e.type === 'pedido') {
        setPedidos((prev) => ({ ...prev, [e.pedido.id]: e.pedido }));
      } else if (e.type === 'agotados') setAgotados(e.slugs);
      else if (e.type === 'qr') setQr(e.qr);
      else if (e.type === 'cierre') setCierreDesde(e.hasta);
    }, setConectado);
    return () => { document.head.removeChild(m); cerrar(); };
  }, [data.local, data.nombre]);

  const lista = useMemo(() => Object.values(pedidos).sort((a, b) => b.creado - a.creado), [pedidos]);
  const nuevas = lista.filter((p) => p.cocina === 'nuevo' && !p.recibido).length;
  const porConfirmar = lista.filter((p) => p.pago === 'por_confirmar' || (p.metodo === 'efectivo' && p.pago === 'pendiente' && p.cocina !== 'entregado')).length;

  const tab = (v: Vista, t: string, n?: number) => (
    <button onClick={() => setVista(v)} className={`font-press-start text-[7px] px-2.5 py-1.5 border-2 tracking-wider ${vista === v ? 'bg-lima text-negro border-lima' : 'text-crema/70 border-crema/25'}`}>
      {t}{n ? ` ·${n}` : ''}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* barra de vistas — nuestra tipografía, discreta */}
      <div className="sticky top-0 z-40 bg-carbon/95 backdrop-blur border-b-2 border-lima px-3 py-2 flex items-center justify-between gap-2">
        <LogoMeza alto={12} animado={false} sombra={false} />
        {modoStaff
          ? <div className="flex gap-1">{tab('cliente', 'Cliente')}{tab('cocina', 'Cocina', nuevas)}{tab('caja', 'Caja', porConfirmar)}</div>
          : <span className="font-press-start text-[7px] text-crema/40 tracking-wider">{data.nombre.toUpperCase()}</span>}
      </div>

      {vista === 'cliente' && <Cliente data={data} mesa={mesa} agotados={agotados} qr={qr} pedidos={lista} conectado={conectado} />}
      {vista === 'cocina' && (clave
        ? <Cocina data={data} pedidos={lista} agotados={agotados} clave={clave} conectado={conectado} salir={() => setClave('')} />
        : <PuertaClave local={data.local} onOk={setClave} />)}
      {vista === 'caja' && (clave
        ? <Caja data={data} pedidos={lista} qr={qr} cierreDesde={cierreDesde} clave={clave} conectado={conectado} salir={() => setClave('')} />
        : <PuertaClave local={data.local} onOk={setClave} />)}
    </div>
  );
}
