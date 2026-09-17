import { useEffect, useRef, useState } from 'react';
import type { Mesh } from 'three';

// Visor 3D real. Three.js se importa dinámico: no pesa hasta que alguien lo pide.
export default function Plate3D({ glbUrl, label }: { glbUrl: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'listo' | 'error'>('idle');
  const [tocado, setTocado] = useState(false);
  const cleanup = useRef<(() => void) | null>(null);

  const pedir3D = async () => {
    if (estado !== 'idle') return;
    setEstado('cargando');
    try {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const cv = canvasRef.current!;
      const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      R.setPixelRatio(Math.min(devicePixelRatio, 2));
      R.toneMapping = THREE.ACESFilmicToneMapping;
      R.toneMappingExposure = 1.1;
      R.shadowMap.enabled = true;
      R.shadowMap.type = THREE.PCFSoftShadowMap;

      const SC = new THREE.Scene();
      const CAM = new THREE.PerspectiveCamera(34, 1, 0.05, 100);
      CAM.position.set(0, 1.02, 2.35);
      SC.add(new THREE.HemisphereLight(0xfff6ea, 0x2a1512, 1.0));
      const k = new THREE.DirectionalLight(0xfff0dc, 2.1);
      k.position.set(2.4, 4.2, 2.6);
      k.castShadow = true;
      k.shadow.mapSize.set(1024, 1024);
      k.shadow.camera.far = 14;
      k.shadow.camera.left = k.shadow.camera.bottom = -3;
      k.shadow.camera.right = k.shadow.camera.top = 3;
      k.shadow.bias = -0.0012;
      SC.add(k);
      const rim = new THREE.DirectionalLight(0xff6b5a, 0.8);
      rim.position.set(-3, 1.6, -2.4);
      SC.add(rim);
      const piso = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.4 }));
      piso.rotation.x = -Math.PI / 2;
      piso.receiveShadow = true;
      SC.add(piso);

      const CTL = new OrbitControls(CAM, cv);
      CTL.enableDamping = true;
      CTL.dampingFactor = 0.075;
      CTL.enablePan = false;
      CTL.minDistance = 1.6;
      CTL.maxDistance = 4;
      CTL.minPolarAngle = 0.22;
      CTL.maxPolarAngle = Math.PI / 2.12;
      CTL.autoRotate = true;
      CTL.autoRotateSpeed = 1.5;
      CTL.addEventListener('start', () => { CTL.autoRotate = false; setTocado(true); });
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) CTL.autoRotate = false;

      const medir = () => {
        const w = cv.clientWidth, h = cv.clientHeight;
        R.setSize(w, h, false);
        CAM.aspect = w / h;
        CAM.updateProjectionMatrix();
      };
      addEventListener('resize', medir);
      medir();

      let vivo = true;
      const loop = () => { if (!vivo) return; requestAnimationFrame(loop); CTL.update(); R.render(SC, CAM); };
      loop();

      new GLTFLoader().load(glbUrl, (g) => {
        const raiz = g.scene;
        raiz.traverse((o) => { const m = o as Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        const bb = new THREE.Box3().setFromObject(raiz);
        const t = bb.getSize(new THREE.Vector3());
        const c = bb.getCenter(new THREE.Vector3());
        const s = 1.52 / Math.max(t.x, t.y, t.z);
        raiz.scale.setScalar(s);
        raiz.position.set(-c.x * s, -bb.min.y * s, -c.z * s);
        SC.add(raiz);
        CTL.target.set(0, (t.y * s) / 2, 0);
        CTL.update();
        setEstado('listo');
      }, undefined, () => setEstado('error'));

      cleanup.current = () => {
        vivo = false;
        removeEventListener('resize', medir);
        CTL.dispose();
        R.dispose();
      };
    } catch {
      setEstado('error');
    }
  };

  // En pantallas grandes (wifi casi seguro) se carga solo al llegar.
  useEffect(() => {
    if (innerWidth < 900) return;
    const el = cajaRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { pedir3D(); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cleanup.current?.(), []);

  return (
    <div ref={cajaRef} className="mt-7 border-[3px] border-lima bg-[#0A0605] relative">
      <div className="bg-lima text-carbon font-press-start text-[10px] tracking-widest px-3 py-2 flex justify-between">
        <span>▸ {label}</span>
        <span>{estado === 'listo' ? 'LISTO' : estado === 'error' ? 'ERROR' : estado === 'cargando' ? 'CARGANDO' : '3D'}</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-[min(58vw,330px)] block touch-none" />
      {estado === 'idle' && (
        <button
          onClick={pedir3D}
          className="absolute inset-x-0 top-[38px] bottom-0 grid place-items-center gap-1.5 bg-[#0A0605]/50 text-lima font-press-start text-[11px] tracking-widest cursor-pointer"
        >
          ▸ TOCA PARA VER EL PLATO EN 3D
          <small className="font-body text-crema/60 text-xs tracking-normal normal-case">lo arma tu celular · gíralo con el dedo</small>
        </button>
      )}
      {estado === 'cargando' && (
        <div className="absolute inset-x-0 top-[38px] bottom-0 grid place-items-center text-lima font-press-start text-[11px]">generando malla…</div>
      )}
      <p className="text-center font-mono text-xs text-crema/60 py-3 transition-opacity" style={{ opacity: tocado ? 0 : 1 }}>
        arrastra para girar · pellizca para acercar
      </p>
    </div>
  );
}
