# MEZA — identidad y voz

**MEZA** es la marca de menú digital de **ZETA** (agencia matriz). Se firma *MEZA by ZETA*.

## La idea

La **Z es una mesa**: tapa arriba, pata en diagonal, base abajo. Y esa mesa cambia de época:

| Época | Z | Qué cuenta |
|---|---|---|
| Papel | (tachada) | La carta de siempre. De donde venimos. |
| Píxel | bloques | El menú se volvió digital. |
| LED | matriz de puntos | El cliente pide desde la mesa. |
| Holograma | degradado lima→cian con cortes | Cocina y caja en vivo. |
| 3D | mesa isométrica | La mesa que atiende: sale de la pantalla, anota, organiza, lleva la comida. |

El logo **base es el píxel** (va con la tipografía de la app). En pantalla la Z **recorre las cuatro épocas con un glitch** entre una y otra; en papel se usa la Z píxel fija.

**Eslogan:** *La mesa que atiende.*
**Promesa:** tu cliente escanea, pide desde la mesa y a la cocina le llega al instante.

## Activos (`public/meza/`)

Todo sale de una sola fuente: `src/marca/meza.ts` (grilla de píxeles + las 4 Z). Regenerar con `npx tsx scripts/marca-meza.ts`.

- `logo.svg` / `logo.png` — wordmark lima, fondo transparente (para fondos oscuros).
- `logo-negro.*`, `logo-crema.svg` — para fondos claros / sobre foto.
- `lockup.png`, `lockup-negro.png` — wordmark + "by ZETA".
- `logo-{pixel,led,holo,iso}.png` — el wordmark en cada época (para reels y presentaciones).
- `icono-{pixel,led,holo,iso}.{svg,png}` — ícono de app (1024), `icono-512.png`, `icono-180.png` (iOS), `/favicon.svg`.

En la app: `<LogoMeza alto={28} />` (animado) y `<IconoMeza epoca="iso" />` en `src/components/LogoMeza.tsx`.

## Colores y tipografía

- Lima `#C6FF3D` (marca, sobre negro `#0B0B0B`). Cian `#38F2FF` solo en la época holograma.
- La landing suma rojo `#E11B14`, maíz `#F2B33D` y azul `#1B2FD8` (bloques brutalistas). El glitch del logo usa rojo/azul.
- Títulos y logo: **Press Start 2P**. Texto: Inter Tight. Datos/etiquetas: JetBrains Mono.
- Los menús de cada local usan **su** marca (colores y logo del restaurante); MEZA solo firma abajo, chiquito.

## Cómo hablamos

- **Tuteo, directo, corto.** Una idea por frase. Sin "soluciones integrales" ni "transformación digital".
- Hablamos del **dueño y su cocina**, no de tecnología: "a la cocina le llega al instante", no "sincronización en tiempo real".
- Verbos de acción en los botones: *Probar el menú en vivo ▸*, *Sube tu foto*, *Confirmar pago*.
- Mayúsculas píxel para las frases fuertes (máx. 4 líneas). Minúscula normal para explicar.
- Siempre hay algo que probar gratis. Nunca cerramos con "contáctanos"; cerramos con "pruébalo".
- Frases de marca: *La mesa que atiende.* · *Tu carta ya no es un papel.* · *La misma comida, otra foto.* · *Escanean. Piden. Llega a la cocina.*

## Videos (ideas para producir)

1. **Evolución de la Z** (5 s, reel/loop): papel → píxel → LED → holograma → 3D, con glitch y el sonido de un ticket de comanda al final.
2. **La mesa que atiende** (15–20 s): una mesa real; la tapa se dobla y se vuelve pantalla, empieza a anotar el pedido sola; de la pantalla sale un pequeño agente (la Z en 3D) que lleva el plato a la mesa y vuelve a la cocina. Cierre: logo + *La mesa que atiende.*
3. **Antes / después** (10 s): la carta de papel manchada → el celular con el menú; la foto de celular → la foto MEZA. Mismo plato, otra foto.

Motores: Nano Banana para los cuadros clave (identidad de la Z), video en Higgsfield/Seedance a partir de esos cuadros.
