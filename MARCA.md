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

**La rúbrica de la marca es el isotipo: la Z-mesa.** El nombre se escribe en la tipografía de la landing (Press Start 2P, lima con sombra píxel roja) y **la Z del medio es el isotipo** (M E [Z] A); nunca el isotipo antes de la palabra. El nombre puede cambiar; la Z es lo que se queda. Sin ubicación en la marca (no hay oficina; Montero es solo piloto). En pantalla la Z **recorre las cuatro épocas con un glitch** entre una y otra; en papel (tarjetas, stickers) va la Z píxel fija.

**Eslogan:** *La mesa que atiende.*
**Promesa:** tu cliente escanea, pide desde la mesa y a la cocina le llega al instante.

## Activos (`public/meza/`)

Todo sale de una sola fuente: `src/marca/meza.ts` (grilla de píxeles + las 4 Z). Regenerar con `npx tsx scripts/marca-meza.ts` (borra y rehace la carpeta).

- `isotipo-{pixel,led,holo,iso}.{svg,png}` — la Z sola, fondo transparente (768×1024). `isotipo-negro.svg` para fondos claros.
- `lockup.png` / `lockup-negro.png` / `lockup-byzeta.png` — isotipo + MEZA (firma completa), transparente.
- `perfil-{pixel,led,holo,iso}.png` — foto de perfil para redes (1080×1080, negro a sangre). Usar **perfil-pixel** por defecto; las otras para campañas.
- `portada-facebook.png` (1640×624) y `historia.png` (1080×1920) — portada y una historia de marca.
- `icono-{pixel,led,holo,iso}.{svg,png}` — ícono de app (1024), `icono-512.png`, `icono-180.png` (iOS), `/favicon.svg`.
- `wordmark-pixel.svg` — el MEZA en píxeles (alternativo, no es el logo principal).

En la app: `<LogoMeza alto={28} />` (isotipo animado + MEZA), `<Isotipo tam={40} />`, `<IconoMeza epoca="iso" />` en `src/components/LogoMeza.tsx`.
Tarjetas QR de mesa (diseño MEZA, sin marca del local): `npx tsx scripts/qr-tarjetas.ts <qrDir> <outDir> <n>`.

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

## Avatar (mascota de ZETA, en definición)

Un solo personaje para todas las apps de ZETA (MEZA, facturación, abogados, asistente), que se "disfraza" según el producto. Sin rostro: metáfora de los negocios que aún no tienen forma digital; en video se cuenta como confusión → solución, nunca burlándose del cliente. No copiar al encapuchado de motionsites. Fondo rojo, ropa negra, acentos lima.
**Elegido: VISOR Z** (30-sep-2026): humanoide esbelto, casco-visor negro brillante sin rostro, cuello tortuga y guantes negros; en el visor vive la Z píxel lima (apagada = sin identidad todavía, encendida = con MEZA). Se viste según el producto (para MEZA: delantal). Cuadros clave en `entregas/marca/avatar/` (`ka-antes.png` Z apagada con celular y delantal gris viejo; `kc-despues.png` Z encendida, delantal negro, bandeja con tarjeta lima y cable lima enchufado en la nuca).

**Hero de la landing (tres videos, Kling 3.0 pro 1080p 9:16, en `public/video/`):** `antes` loop (confundido con el celular) → `cambio` una sola vez (tira el celular, se saca el delantal viejo, se enchufa, la Z se enciende, se pone el delantal negro) → `despues` loop (seguro). Los loops son **ping-pong** (ida + vuelta) con `loop` nativo: terminan donde empiezan, sin salto ni transparencia. El video va a sangre detrás de los textos; en pantallas anchas el encuadre se ancla arriba (cabeza y torso), en vertical se ve entero. El scroll no pausa nada (`src/components/MunecoFondo.tsx`). Preparar clips con `python scripts/hero-video.py`; los loops ping-pong se generan con ffmpeg (ver historial del commit). Kling 3.0 en 4K cuesta 60 créditos por 10 s (vs 17.5 en pro 1080p).

**Fotos antes/después:** anillo 3D arrastrable con inercia y giro lento en reposo (técnica Vertex, #22 del catálogo Retro Global); la tarjeta del frente tiene el comparador deslizable; la última es "+" para subir tu foto (`src/components/FotosAnillo.tsx`).
Otras propuestas descartadas: 2 · MANIQUÍ, 3 · CABEZA DE PANTALLA.

## Videos

Todo el contenido de MEZA es animado (clips 3D o video comercial); las imágenes fijas van solo en la landing.

1. **Evolución de la Z** — hecho sin IA: `npx tsx scripts/marca-clip.ts` → `entregas/marca/meza-logo-{9x16,1x1}.mp4` + gif (píxel → LED → holograma → 3D con glitch, cierre con el eslogan).
2. **La mesa que atiende** — cuadros clave en `entregas/marca/cuadros/` (k1 mesa con QR → k2 la tapa se vuelve pantalla → k3 sale el robot Z con la pizza → k4 atiende), generados con Nano Banana 2 (1.5 créditos c/u) usando el cuadro anterior como referencia; el personaje es `robot-z.png`. Video con Seedance 2.0 Mini (5 créditos por clip de 5 s, cuadro inicial + final) y unión con `python scripts/marca-mesa.py <salida> <clips…> entregas/marca/meza-logo-9x16.mp4`.
3. **Antes / después** (10 s): la carta de papel manchada → el celular con el menú; la foto de celular → la foto MEZA. Mismo plato, otra foto. (Pendiente.)

Costos reales por MCP (sep-2026): GPT Image 2 alta 3.5 créditos, Nano Banana 2 1.5, Seedance 2.0 Mini 5 s 720p 5, Kling 3.0 Turbo 7.5, Veo 3.1 Lite 9. Renders GPT del isotipo en `entregas/marca/isotipo-gpt/`.
