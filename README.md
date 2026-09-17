# PLATO VIVO

Landing única (React + Vite + TypeScript + Tailwind v4) para restaurantes de
Montero, Santa Cruz. Diseño brutalista/retro-digital: todo el negocio en una sola
página con la misma línea gráfica — hero scroll-driven, prueba de foto con el motor
real, menú en 3D, máquina de afiches y contacto.

## Correr

```bash
npm install
npm run dev      # http://localhost:3000  (Vite en middleware de Express)
npm run build    # tsc + vite build → dist/
npm run preview  # sirve dist/ (NODE_ENV=production)
```

## Motor de fotos

`/api/mejorar` y `/api/carta` viven en `server.ts` (portados del Worker de
Cloudflare). Necesitan la llave de Gemini:

```bash
# .dev.vars o variable de entorno
GEMINI_API_KEY=...     # sin esto, el motor responde "sin_motor" y la UI lo dice
```

Otras variables opcionales: `MOTOR` (gemini), `RESOLUCION` (1K), `LIMITE_DIA`,
`LIMITE_IP`, `GEMINI_MODELO`, `MODELO_REVISION`, `REVISAR`.

Los topes de uso y las cartas se guardan **en memoria** (se reinician con el
server). Para producción persistente, el Worker + KV originales siguen siendo la
fuente — ver `worker-ref/PLATO-VIVO.md`.

## Estructura

- `src/config.ts` — fuente de verdad del contenido (menú, copy, afiches, assets).
- `src/components/` — secciones de la landing.
- `src/lib/api.ts` — cliente del motor + heurística "¿parece comida?".
- `server.ts` + `server/prompts.ts` — API y la regla de fidelidad en duro.
- `public/fotos`, `public/glb` — assets recuperados de producción.
- `worker-ref/` — Worker desplegado, prompts y documento de traspaso (referencia).

## Regla de fidelidad

La IA arregla la **foto**, nunca la **comida**. Los prompts van en duro en el
servidor (`server/prompts.ts`) y el dueño del restaurante no puede tocarlos.
