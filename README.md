# Plato Vivo · Estudio IA

Un estudio de imágenes con IA al estilo Higgsfield y **conectado a la API pública de Higgsfield**, pensado para usarse desde el celular e integrado a la landing de Plato Vivo.

| Sección | Qué hace | ¿Usa IA? |
|---|---|---|
| **Mejorar** | Subes la foto del platillo (cámara o galería), eliges un estilo (Delivery, Instagram, Mármol, Madera, Recién hecho, etc.) y la IA la deja profesional **sin cambiar tu comida**. Incluye comparador antes/después. | Sí (y un "Ajuste rápido gratis" sin IA) |
| **Crear** | Generas imágenes desde texto: promociones, fondos para menú y contenido nuevo. | Sí |
| **Marca** | Le pones logo, nombre, título, precio, etiqueta, llamado a la acción, @Instagram y WhatsApp. 4 plantillas (Promo, Menú, Historia, Sello) en 1:1, 4:5 y 9:16. Tu kit de marca se guarda en el celular. | No: el texto siempre sale bien escrito |
| **Diseño con IA (beta)** | La IA arma un anuncio completo con tu foto y tus textos. | Sí |
| **Galería** | Todo lo que generas se guarda en el celular para descargar, compartir o reutilizar. | — |

## Estructura

```
index.html                 ← landing de Plato Vivo (con botón flotante "Estudio IA")
estudio/
  index.html               ← la app del estudio
  estudio.css              ← diseño (modo oscuro, estilo Higgsfield)
  estudio.js               ← lógica: estilos, plantillas, galería, editor de marca
  manifest.webmanifest     ← permite "Agregar a pantalla de inicio" en el celular
api/
  generate.js              ← servidor conectado a la API de Higgsfield (tus credenciales viven aquí, nunca en el navegador)
vercel.json                ← configuración para Vercel
.env.example               ← variables que tienes que llenar
```

## Ponerlo en línea (Vercel, gratis) con la API de Higgsfield

1. Crea tus credenciales en [cloud.higgsfield.ai](https://cloud.higgsfield.ai) → **API Keys**. Te da un **API Key** y un **API Secret**. Carga saldo (la API cobra en dólares por imagen, aparte de tu plan de la app).
2. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub y elige **Add New → Project**. Importa este repositorio (`PC`) y presiona **Deploy**.
3. En el proyecto ve a **Settings → Environment Variables** y agrega:
   - `HF_KEY` = `TU_API_KEY:TU_API_SECRET` (las dos juntas, separadas por dos puntos)
   - `STUDIO_PASSWORD` = un código que solo tú conozcas (**muy recomendado**: sin él, cualquiera con el link podría gastar tu saldo)
4. Ve a **Deployments** y vuelve a desplegar (**Redeploy**) para que tome las variables.
5. Abre `https://tu-proyecto.vercel.app/estudio/` en el celular. Arriba a la derecha debe decir **"Higgsfield conectado"**.

> Sin `HF_KEY` el estudio funciona en **modo demo**: la sección Marca funciona completa y Mejorar aplica un ajuste automático gratis de luz y color.

### Cómo se conecta con Higgsfield

`api/generate.js` usa la misma API que los SDK oficiales de Higgsfield (`https://api.higgsfield.ai`):

1. Sube la foto del platillo con `POST /files/generate-upload-url`.
2. Envía el trabajo al modelo (`POST /{modelo}`) con el prompt, `aspect_ratio` y `resolution`.
3. El celular consulta `GET /requests/{id}/status` cada 2.5 s hasta que dice `completed` y descarga la imagen.

### Limpieza automática (sin escribir nada)

El servidor agrega siempre, a cada imagen, instrucciones para **quitar todo lo que ensucia la foto** (servilletas, tickets, celulares, manos, cubiertos sueltos, botellas, migajas, manchas, textos y fondos desordenados) y dejar **al platillo como único protagonista**, centrado y con espacio libre alrededor para el texto y la marca. Están en `CLEAN_EDIT` y `CLEAN_GENERATE` dentro de `api/generate.js`.

### Cambiar de modelo

Puedes usar cualquier modelo de imagen del catálogo de Higgsfield Cloud sin tocar código, con estas variables:

| Variable | Para qué | Por defecto |
|---|---|---|
| `HIGGSFIELD_EDIT_MODEL` | Mejorar foto y Diseño con IA (recibe tu foto) | `alibaba/qwen-image-3/edit` |
| `HIGGSFIELD_T2I_MODEL` | Crear desde texto | `z-image/turbo` (rápido y económico; alternativa: `alibaba/qwen-image-3/text-to-image`) |
| `HIGGSFIELD_RESOLUTION` | Calidad: `1k` o `2k` | `2k` |

La lista de modelos disponibles en tu cuenta sale de `GET https://api.higgsfield.ai/models` (con tu `HF_KEY`). Otros modelos de imagen que acepta tu foto: `marketing-studio/image`, `ideogram/v4.0`, `xai/grok-imagine-image-2.0`. Ninguno acepta 4:5, así que el estudio pide 3:4 y el editor de Marca recorta.

## Integrarlo en tu landing actual

Si ya tienes tu propia landing (por ejemplo en `C:\Users\chris\Desktop\PLATO VIVO`):

1. Copia las carpetas `estudio/` y `api/` y el archivo `vercel.json` junto a tu `index.html`.
2. En tu landing agrega un botón que lleve al estudio. Puedes abrirlo directo en una sección:
   ```html
   <a href="estudio/">Estudio IA</a>
   <a href="estudio/?vista=mejorar">Mejorar mi foto</a>
   <a href="estudio/?vista=crear">Crear imagen</a>
   <a href="estudio/?vista=marca">Poner mi marca</a>
   ```
3. Si quieres el botón flotante verde, copia el bloque `pv-fab` (HTML y CSS) que está al final de `index.html`.

## Personalizar

- **Estilos de mejora**: edita la lista `EDIT_PRESETS` al inicio de `estudio/estudio.js` (nombre, emoji e instrucción para la IA).
- **Ideas de "Crear"**: edita `CREATE_PRESETS` en el mismo archivo.
- **Colores del estudio**: cambia `--accent` en `estudio/estudio.css`.

## Probar en tu computadora

```bash
npm i -g vercel
vercel dev
```

Luego abre `http://localhost:3000/estudio/`. Pon tus credenciales en un archivo `.env.local` (copia `.env.example`).

## Costos

Cada imagen con IA se cobra de tu saldo de Higgsfield Cloud (el precio depende del modelo y la resolución; lo ves en el catálogo). Si Higgsfield rechaza una imagen por moderación o la generación falla, no se cobra. El "Ajuste rápido gratis" y la sección **Marca** no cuestan nada.
