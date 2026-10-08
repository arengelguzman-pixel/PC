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

## Voz de avisos (ElevenLabs)

Cocina anuncia cada comanda nueva con voz ("¡Nueva comanda! Mesa cinco") y la repite cada 20 s
hasta tocar "Recibido"; Caja anuncia los comprobantes. Son clips MP3 pregrabados en `public/voz/`
(`comanda[-mesa-N].mp3`, `comprobante[-mesa-N].mp3`, N = 1..10; voz "Cristina", modelo
eleven_multilingual_v2). Para más mesas, generar los clips que falten con el mismo texto y voz.

## Casilla "¿Algo en particular?"

`personalizar: true` en el `Afiliado` muestra una casilla por pizza (sin aceitunas, bien cocida…).
Viaja como `nota` dentro de cada línea y se ve en carrito, cocina y caja. En El Garaje real está
apagada hasta que la dueña lo decida; en el sandbox está encendida.

## Manual, capturas y videos tutoriales

```bash
node scripts/capturas-manual.mjs     # capturas reales del sandbox (puppeteer-core + Chrome)
python scripts/manual-garaje.py      # PDF: entregas/manual/MEZA-manual-El-Garaje.pdf
node scripts/videos-tutorial.mjs     # 4 videos verticales con narración: entregas/manual/videos/
```

La narración está en `entregas/manual/narracion/` (ElevenLabs, `meta.json` con duraciones).

## Prototipos para nuevos locales

`src/afiliados/prototipos.ts`: pollería, hamburguesería, comida cruceña y cafetería, cada uno con
su link `/m/<token>` y sala propia (clave de personal de demo: `demo1234`). Para un local real:
copiar el prototipo, cambiar nombre/WhatsApp/logo/platos y el token.

## Dominio propio: pidemeza.com

Comprado el 8-oct-2026 en Cloudflare Registrar, pero en la cuenta "Handy Mustard"
(`4c612a80…`), distinta de la cuenta donde vive el Worker `meza` (`8b0e7626…`). Un dominio
personalizado no puede cruzar cuentas, así que `worker-puerta/` es un Worker mínimo en la
cuenta del dominio que reenvía todo (ruta, query, cuerpo, WebSocket) a
`meza.arengel-guzman.workers.dev`:

```bash
npx wrangler deploy -c worker-puerta/wrangler.toml   # solo si cambia la puerta
npm run build && npx wrangler deploy                  # el Worker principal, como siempre
```

`www.pidemeza.com` → `pidemeza.com`. El dominio workers.dev sigue vivo como respaldo.

**Links cortos:** `ALIAS` en `worker/index.js` redirige `/garaje` → `/m/elgaraje-a3f9k2m8x1`
conservando la query, así que los QR de las mesas y los enlaces del personal son
`https://pidemeza.com/garaje?mesa=3`, `…/garaje?vista=cocina`, `…/garaje?vista=caja`.
Para un local nuevo: agregar su alias al mapa y publicar.

## Regla de fidelidad

La IA arregla la **foto**, nunca la **comida**. Los prompts van en duro en el
servidor (`server/prompts.ts`) y el dueño del restaurante no puede tocarlos.
