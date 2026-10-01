# MEZA

Landing única (React + Vite + TypeScript + Tailwind v4) para restaurantes.
Diseño brutalista/retro-digital: todo el negocio en una sola
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

## Cierre de caja, archivo y envío automático

En la Caja de cada local: turno abierto en vivo, "Cerrar caja" (efectivo contado + nota),
historial, PDF del cierre con todos los comprobantes de QR (archivados 90 días en la sala
del local) y envío automático al dueño. Rutas en `worker/sala.js` (`/cierres`, `/archivo`,
`/destino`).

**Telegram (una sola vez, dueño de la cuenta MEZA):**

1. En Telegram, abre `@BotFather` → `/newbot` → nombre y usuario (p. ej. `meza_caja_bot`) → copia el token.
2. `npx wrangler secret put TELEGRAM_TOKEN` (pega el token).
3. `node scripts/telegram-setup.mjs <TOKEN> <TELEGRAM_WEBHOOK_SECRET>` (el secreto está en `.dev.vars`).
4. En `wrangler.toml` pon `TELEGRAM_BOT = "meza_caja_bot"` y `npm run deploy`.

Después, en cada local: Caja → "Vincular Telegram del dueño" → abrir el enlace en el celular
del dueño → Iniciar. Desde ahí cada cierre le llega con el PDF.

**Webhook (opcional):** `npx wrangler secret put WEBHOOK_CIERRE` con la URL de n8n/Make; recibe
`{tipo:'cierre', local, cierre, resumen, pdfBase64, pdfNombre}` para reenviar por WhatsApp o correo.

## Regla de fidelidad

La IA arregla la **foto**, nunca la **comida**. Los prompts van en duro en el
servidor (`server/prompts.ts`) y el dueño del restaurante no puede tocarlos.
