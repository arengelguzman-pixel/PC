# Cómo integrar el Estudio IA en la landing oficial de Plato Vivo

Guía para conectar el Estudio IA (mejorar fotos de platillos, crear imágenes y poner la marca del restaurante) a la landing oficial de Plato Vivo. Puedes seguirla tú, dársela a un programador o pegarle el **prompt del final** a Claude Code en tu computadora.

---

## Qué ya está listo y funcionando

| Qué | Dónde |
|---|---|
| Estudio IA publicado | https://plato-vivo.vercel.app/estudio/ |
| Código de acceso del estudio | variable `STUDIO_PASSWORD` en Vercel |
| Código fuente | GitHub `arengelguzman-pixel/PC`, rama `claude/higgsfield-mobile-plato-vivo-rj16qj` |
| Proyecto en Vercel | `plato-vivo` |
| IA | API pública de Higgsfield (`HF_KEY` en Vercel) |

Modelos configurados:

- **Mejorar foto:** `alibaba/qwen-image-3/edit`, en 2k. Conserva el mismo platillo.
- **Crear desde texto:** `z-image/turbo`, en 2k. Es rápido y económico.
- **Limpieza automática:** cada imagen quita servilletas, tickets, celulares, manos, cubiertos sueltos, botellas, migajas, manchas, textos y fondos desordenados. El platillo queda como protagonista, con espacio libre para el texto y la marca. No hay que escribir nada.

---

## Ruta A — La más rápida (5 minutos, sin tocar código del estudio)

La landing oficial se queda donde está y solo **enlaza** al estudio que ya está publicado.

1. Abre el `index.html` de tu landing oficial (carpeta `PLATO VIVO`).
2. Donde quieras el botón (menú, hero o sección de menús), pega:

   ```html
   <a href="https://plato-vivo.vercel.app/estudio/" class="btn-estudio">Estudio IA</a>
   ```

   También puedes abrir el estudio directo en una sección:

   ```html
   <a href="https://plato-vivo.vercel.app/estudio/?vista=mejorar">Mejorar la foto de mi platillo</a>
   <a href="https://plato-vivo.vercel.app/estudio/?vista=crear">Crear imagen con IA</a>
   <a href="https://plato-vivo.vercel.app/estudio/?vista=marca">Ponerle mi marca</a>
   ```

3. **(Opcional) Botón flotante verde**, visible siempre en el celular. Pega esto justo antes de `</body>`:

   ```html
   <style>
     .pv-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:50;
       display:inline-flex;align-items:center;gap:8px;min-height:52px;padding:0 20px;border-radius:999px;
       background:#c6ff3d;color:#0b0b0c;font:700 15px/1 system-ui,sans-serif;text-decoration:none;
       box-shadow:0 10px 30px rgba(198,255,61,.35)}
     .pv-fab svg{width:20px;height:20px;fill:currentColor}
   </style>
   <a class="pv-fab" href="https://plato-vivo.vercel.app/estudio/" aria-label="Abrir Estudio IA">
     <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>
     Estudio IA
   </a>
   ```

4. Publica tu landing como siempre. Listo.

> Si más adelante pones un dominio propio (por ejemplo `platovivo.com`), en Vercel puedes asignarle `estudio.platovivo.com` al proyecto `plato-vivo` y cambiar los links.

---

## Ruta B — Todo en un solo sitio (landing oficial + estudio en el mismo dominio)

La landing oficial reemplaza a la landing de prueba y el estudio queda en `/estudio/` del mismo sitio.

1. Sube la carpeta de tu landing oficial a GitHub. Desde el celular: github.com/arengelguzman-pixel/PC → cambia a la rama `claude/higgsfield-mobile-plato-vivo-rj16qj` → **Add file → Upload files**. Sube todo el contenido de `PLATO VIVO` (el `index.html`, las imágenes, el avatar, la página de menús, etc.).
2. La estructura final debe quedar así:

   ```
   index.html              ← TU landing oficial (reemplaza la de prueba)
   menus.html / menus/     ← tu página de menús (si existe)
   assets/ o img/          ← tus imágenes, avatar, logo
   estudio/                ← NO tocar (la app del estudio)
   api/generate.js         ← NO tocar (conexión con Higgsfield)
   vercel.json             ← NO tocar
   package.json            ← NO tocar
   ```

3. En tu `index.html` oficial agrega los links de la Ruta A, pero **relativos**: `href="estudio/"`, `href="estudio/?vista=mejorar"`, etc.
4. En Vercel → proyecto `plato-vivo` → **Settings → Git**, conecta el repositorio `arengelguzman-pixel/PC` y la rama. Así cada cambio que subas se publica solo. *Hoy no está conectado: Vercel no tenía permiso sobre el repo y los archivos se subieron directo.*
5. Si no quieres conectar Git, pídele a Claude que lo vuelva a publicar.

---

## Variables en Vercel (proyecto `plato-vivo` → Settings → Environment Variables)

| Variable | Valor | Obligatoria |
|---|---|---|
| `HF_KEY` | `TU_API_KEY:TU_API_SECRET` de cloud.higgsfield.ai | Sí |
| `STUDIO_PASSWORD` | código para entrar al estudio | Muy recomendada |
| `HIGGSFIELD_EDIT_MODEL` | `alibaba/qwen-image-3/edit` | No (ya es el valor por defecto) |
| `HIGGSFIELD_T2I_MODEL` | `z-image/turbo` | No (ya es el valor por defecto) |
| `HIGGSFIELD_RESOLUTION` | `2k` (o `1k` para gastar menos, con menos calidad) | No |

**Importante:** cuando revoques la clave temporal de Higgsfield, pon la nueva en `HF_KEY` y haz **Redeploy**. Si no, el estudio deja de generar imágenes.

---

## Checklist de prueba (desde el celular)

- [ ] Abre `/estudio/`. Arriba debe decir **"Higgsfield conectado"**.
- [ ] **Mejorar:** Cámara → foto de un platillo con la mesa desordenada → **Mejorar con IA**. Pide el código la primera vez. En 45-90 s aparece el antes/después, con el fondo limpio.
- [ ] **Crear:** toca "Tacos al pastor" → **Generar imagen**. Con Z-Turbo tarda unos 15 s.
- [ ] **Marca:** "Ponerle mi marca →" → escribe nombre, precio y WhatsApp → sube el logo → **Descargar** y **Compartir**.
- [ ] **Galería:** aparecen las imágenes generadas.

---

## Prompt para Claude Code (pégalo en tu computadora, dentro de la carpeta PLATO VIVO)

```
Estoy en la carpeta de mi landing oficial "PLATO VIVO". Quiero integrar el Estudio IA
que ya está publicado en https://plato-vivo.vercel.app/estudio/ (código fuente en GitHub:
arengelguzman-pixel/PC, rama claude/higgsfield-mobile-plato-vivo-rj16qj, y guía en INTEGRACION.md).

Haz esto:
1. Agrega en el menú principal y en el hero de index.html un botón "Estudio IA" que abra
   https://plato-vivo.vercel.app/estudio/ respetando el diseño actual (colores, tipografía,
   avatar negro). En la página de menús agrega "Mejorar la foto de mi platillo" →
   https://plato-vivo.vercel.app/estudio/?vista=mejorar
2. Agrega el botón flotante "Estudio IA" (bloque pv-fab de INTEGRACION.md), adaptando el color
   al de mi marca.
3. Revisa que se vea bien en celular (390px de ancho) y que no rompa nada existente.
4. No cambies nada del estudio ni de la carpeta api/.
```
