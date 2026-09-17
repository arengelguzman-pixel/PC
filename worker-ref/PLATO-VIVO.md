# PLATO VIVO — contexto completo del proyecto

> Documento de traspaso para Claude Code. Escrito el **17 de septiembre de 2026**.
> Lee esto entero antes de tocar nada. Al final hay una lista de trampas que ya
> costaron horas: no las vuelvas a pisar.

---

## 0. Lo primero que tienes que hacer

**El código fuente local se perdió** (el contenedor donde se construyó fue reciclado).
Lo único que sobrevive es lo que está **desplegado en producción**, y desde ahí se
recupera todo. Junto a este documento viene la carpeta `recuperado/` con una copia,
pero lo desplegado siempre es la verdad.

```bash
# 1) las tres páginas publicadas (el cliente completo va adentro, sin minificar)
BASE=https://plato-vivo.argianpaypal.workers.dev
curl -s $BASE/index.html   -o publicado/index.html
curl -s $BASE/landing.html -o publicado/landing.html
curl -s $BASE/menu.html    -o publicado/menu.html

# 2) el código del Worker (viene como multipart; el módulo se llama index.js)
curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/workers/services/plato-vivo/environments/production/content" \
     -H "Authorization: Bearer $CF_TOKEN" -o worker.multipart
```

El Worker desplegado viene **empaquetado por esbuild en un solo archivo**. En
`recuperado/worker/worker-desplegado.js` está ya limpio de los `__name()` que mete el
bundler. Tu primer trabajo es **volver a partirlo en módulos** (`src/index.js`,
`src/mejorar.js`, `src/carta.js`) tal como estaba, porque el bundle los tiene pegados y
renombrados (`onRequestPost` / `onRequestPost2`).

---

## 1. Qué es PLATO VIVO

Producto para **restaurantes chicos de Montero, Santa Cruz, Bolivia**. Lo lleva
**Antonio** — fuerte en redes sociales y algoritmo, principiante en programación.
El cliente final es un dueño de restaurante que **no sabe usar Instagram, no sabe
editar fotos y no sabe escribir un prompt**. Todo el diseño parte de ahí.

Vende dos cosas, y solo dos:

**1. El menú se vuelve una experiencia.** El cliente escanea un QR en la mesa, ve la
carta con fotos buenas, toca un plato y lo **gira en 3D con el dedo**, arma un pedido y
lo manda por WhatsApp — ya escrito — a la administradora de **Tingo Delivery**. El dueño
del restaurante no escribe nada. *Esto es el gancho de venta.*

**2. Las fotos y las redes, resueltas.** El dueño manda cualquier foto de celular y le
vuelve una foto de calidad publicable. *Esto es el pago recurrente mensual.*

**Eslogan: "¿Quieres darle vida a tu comida?"**

### Las personas

| Quién | Rol | Cómo cobra |
|---|---|---|
| **Antonio** | Dueño del producto, conocimiento, tiempo | Sueldo + utilidad |
| **El tío** | Puso la inversión inicial (Higgsfield, Claude) | % de utilidad |
| **Don Widen** | Dueño de Tingo Delivery, hace el contacto con los restaurantes | **Comisión por cliente traído — nunca participación societaria** |

Esa distinción importa: Widen cobra por venta, no es socio. Está documentado en la
página interna `interno-a7f3k9.html` (sin enlazar desde ningún lado, a propósito).

---

## 2. LA REGLA DE FIDELIDAD — no negociable

Es lo más importante del proyecto entero. Antonio la definió en el primer día:

> *"Si convertimos un pollo brasa normal en un plato gourmet y luego van al restaurante
> y no es así, sería publicidad engañosa."*

**La IA arregla la FOTOGRAFÍA. Nunca la COMIDA.**

| Puede | No puede |
|---|---|
| Corregir luz, color, balance de blancos | Agregar, quitar o agrandar comida |
| Quitar ruido, grano, desenfoque, artefactos | Quitar una mordida o cerrar un corte |
| Limpiar el fondo (bandejas, cubiertos, manos, mesas, envases sueltos) | Agregar perejil, salsa o decoración que no estaba |
| Reacomodar piezas que **ya están** y limpiar chorreados del borde | Cambiar el plato o el envase por uno mejor |
| Reiluminar como estudio | Reencuadrar, alejar o acercar la cámara |

**Excepción única y explícita:** el modo `plato:true` mueve la comida de un envase
descartable a un plato blanco simple. **La comida no cambia** — mismas piezas, misma
porción, mismas salsas. Solo cambia el recipiente. Es opt-in: aparece como botón
*"🍽️ PONERLO EN UN PLATO"* y solo cuando el revisor detecta envase descartable.

Esto no es un escrúpulo: **es el argumento de venta**. Si el cliente pide por la foto y
recibe menos comida, se queja con el restaurante y el restaurante culpa a Antonio.

Los tres prompts completos están en `recuperado/worker/`:
`regla.txt`, `regla_plato.txt`, `revision.txt`. **Van en duro en el servidor.** El dueño
del restaurante no puede tocarlos. Ese párrafo es el seguro legal del producto.

---

## 3. Qué está vivo ahora mismo

| | |
|---|---|
| **Sitio** | https://plato-vivo.argianpaypal.workers.dev |
| **Menú público** | `/menu.html?r=dona-elsa` |
| **Menú administrable** | `/menu.html?r=dona-elsa#k=<CLAVE>` |
| **Cuenta Cloudflare** | de Antonio, gratis, permanente (`4ef2852bace8f21e83ee4c40f13b9ac6`) |
| **Worker** | `plato-vivo`, subdominio `argianpaypal` |
| **KV** | `plato-vivo-cartas` → `4381b84f8e194352956088097ce3498c`, binding `CARTAS` |
| **Motor de imagen** | Google Gemini `gemini-3.1-flash-image` (Nano Banana 2), 1K |
| **Revisor** | Google Gemini `gemini-3.1-flash-lite` |
| **Observabilidad** | activada, `head_sampling_rate = 1` |

### Páginas

- **`index.html`** — hub, dos tarjetas (landing y menú). 4.5 KB.
- **`landing.html`** — la venta. Rojo brutalista/Y2K, deliberadamente opuesta al menú.
  Hero con máquina de escribir, personaje pensando con globos amarillos, **módulo de
  subir foto que llama al motor real**, 6 comparadores antes/después, 3D en vivo,
  máquina de afiches, precios, formulario tipo terminal. 58 KB.
- **`menu.html`** — el producto. Dos pestañas: *Lo que ve tu cliente* / *Lo que ves tú*.
  58 KB.
- **`interno-a7f3k9.html`** — reparto de utilidades con calculadora. **No enlazada.**

### Rendimiento (ya optimizado, no lo rompas)

| | antes | ahora |
|---|---|---|
| `menu.html` | 1.514 KB | **51 KB** |
| `landing.html` | 2.285 KB | **56 KB** |

Se logró con dos cosas:
1. Las fotos salieron del HTML a `fotos/*.jpg` con `loading="lazy" decoding="async"`.
2. **Three.js (~600 KB) ya no se descarga al abrir.** Se baja recién cuando alguien toca
   un plato, vía `cargarLib()`, que inyecta `lib/three.min.js` y después `lib/loaders.js`.

---

## 4. Arquitectura

```
Cloudflare Worker  "plato-vivo"
├── src/index.js      enruta: /api/mejorar, /api/carta, "/" → index.html, resto → ASSETS
├── src/mejorar.js    motor de fotos + revisor + topes de gasto
├── src/carta.js      guardar/leer la carta en KV
└── public/           servido por el binding ASSETS
    ├── index.html landing.html menu.html interno-a7f3k9.html
    ├── fotos/   *.jpg  (platos y comparadores)
    ├── glb/     burger.glb pique.glb majadito.glb   (modelos 3D)
    └── lib/     three.min.js  loaders.js            (carga diferida)
```

`wrangler.toml`:

```toml
name = "plato-vivo"
account_id = "4ef2852bace8f21e83ee4c40f13b9ac6"
main = "src/index.js"
compatibility_date = "2026-08-26"

[assets]
directory = "./public"
binding = "ASSETS"
not_found_handling = "404-page"
html_handling = "none"          # sin esto /landing.html redirige a /landing

[vars]
MOTOR = "gemini"                # "gemini" | "higgsfield"
RESOLUCION = "1K"
LIMITE_DIA = "120"
LIMITE_IP = "40"

[[kv_namespaces]]
binding = "CARTAS"
id = "4381b84f8e194352956088097ce3498c"

[observability]
enabled = true
head_sampling_rate = 1
```

### 🔐 Secretos — NO van en el repo

`GEMINI_API_KEY` está hoy en `[vars]` **en texto plano**, que fue una decisión de
urgencia el día del demo. **Primer arreglo de higiene: pásalo a secret.**

```bash
npx wrangler secret put GEMINI_API_KEY
```

Antonio tiene la llave. Además: la llave de Gemini, un token de Cloudflare y la Global
API Key **pasaron por un chat** durante el desarrollo. Recomiéndale rotar las tres
antes de seguir. Para desarrollo local: `.dev.vars` (y `.gitignore`).

---

## 5. Contrato de la API

### `POST /api/mejorar`

```jsonc
// entrada
{ "foto": "data:image/jpeg;base64,...",   // el cliente recorta a 1024×1024 antes
  "plato": false }                         // true = pasar de envase a plato blanco

// salida
{ "ok": true, "motor": "gemini", "plato": false,
  "foto": "data:image/jpeg;base64,...",
  "aviso": { "empezado": false, "envase": true, "motivo": "cubiertos sucios" } }
```

`aviso` viene del revisor, que corre **en paralelo** con el retoque (`Promise.all`), así
que no suma espera. **Nunca bloquea.** Si falla, devuelve `null` y la foto sale igual.

Errores: `{ ok:false, causa, msg, codigo }` con estos `causa`:
`sin_motor` (501) · `vacio` (400) · `pesada` (413) · `tope_dia` / `tope_ip` (429) ·
`nsfw` (422) · `sin_creditos` (402) · `motor` (502).
`codigo` es corto y legible para soporte: `SATURADO-503`, `CUOTA-429`, `LLAVE`, `FILTRO`,
`SIN-IMAGEN`, `HTTP-xxx`.

**Reintento automático:** ante 429/500/502/503/504 u "overload"/"high demand" reintenta
3 veces con espera creciente. Se agregó porque Google se satura de a ratos y sin esto la
página decía "el motor no pudo con esta foto" cuando el problema no era la foto.

### `GET /api/carta?r=<local>` · `POST /api/carta`

```jsonc
// POST
{ "r": "dona-elsa", "clave": "<clave de edición>", "datos": { /* ver §6 */ } }
```

- `r` se limpia a `[a-z0-9-]`, máximo 40.
- La primera vez que se guarda, la `clave` enviada **queda registrada**. Después tiene
  que coincidir o responde 403 `clave_mala`.
- La comparación de clave es **en tiempo constante** (función `igual`), para no filtrarla
  midiendo cuánto tarda en fallar.
- **La clave nunca sale del servidor** en el GET.
- Tope: 400 KB por carta.

**Modelo de dos links** (esto es el corazón del producto multi-restaurante):

| Link | Para quién | Qué puede |
|---|---|---|
| `/menu.html?r=dona-elsa` | el comensal, va en el QR de la mesa | solo ver — la pestaña del dueño ni se muestra |
| `/menu.html?r=dona-elsa#k=CLAVE` | el dueño | ver y publicar |

La clave va **después del `#`**, y el navegador **no manda esa parte al servidor** al
cargar la página: no queda en ningún log de tránsito. Sí viaja en el body del POST.

---

## 6. Esquemas de datos

### La carta guardada en KV (`carta:<r>`)

```jsonc
{ "clave": "<clave de edición>",        // nunca se devuelve
  "guardado": "2026-08-31T19:14:45.629Z",
  "datos": {
    "v": 1,
    "nombre": "Doña Elsa",
    "bajada": "Comida cruceña y rápida · Montero",
    "logo":   "data:image/jpeg;base64,...",   // recortado a 256×256 en el celular
    "look":   "brasa",
    "color":  "",                              // "" = el acento del look
    "platos": [ { "id": 1, "p": 35, "no": false } ]   // precio y agotado
  } }
```

Los platos **se guardan solo por id/precio/agotado**: los nombres, descripciones, fotos y
modelos siguen viviendo en el HTML. *Esa es la principal deuda técnica* — ver §9.

### Un plato (hoy, en duro dentro de `menu.html`)

```js
{ id:1, cat:"Rápidas", n:"Hamburguesa doble", p:35,
  img:"burger",        // clave del mapa IMG → fotos/burger.jpg
  glb:"burger",        // clave del mapa GLB → glb/burger.glb, o null
  no:false,            // agotado
  d:"Doble carne, doble cheddar, tocino, lechuga y tomate. Viene con papas.",
  t:"2 carnes de res · cheddar · tocino · lechuga · tomate · papas fritas" }
```

Categorías: `["Todo","Rápidas","Cruceñas","Sopas","Para picar"]`.
Hay además un arreglo `BEBIDAS` con `{cat, n, s, p}` sin foto.

### Los 6 looks

Cada uno combina **paleta + tipografía + estructura**. Antonio eligió explícitamente
*"looks completos"* sobre *"armar por partes"*: el dueño toca **una** tarjeta y no puede
producir una combinación fea.

```js
const LOOKS=[
 {k:'brasa',  t:'Brasa',   s:'Pollería, parrilla, al paso',      tpl:'vitrina',  c:['#17120F','#E8531F','#F2B33D']},
 {k:'cunape', t:'Cuñapé',  s:'Cafetería, panadería, desayuno',   tpl:'vitrina',  c:['#F3EADC','#B4551E','#C9922F']},
 {k:'selva',  t:'Selva',   s:'Almuerzo casero, cruceña',         tpl:'mosaico',  c:['#0C130D','#8FBF6A','#E8C45C']},
 {k:'noche',  t:'Noche',   s:'Hamburguesas, rápidas, delivery',  tpl:'panorama', c:['#08080A','#C6FF3D','#FFE14D']},
 {k:'arcilla',t:'Arcilla', s:'Restaurante de mesa',              tpl:'lista',    c:['#1C110F','#D4795F','#E0A85C']},
 {k:'papel',  t:'Papel',   s:'Carta sobria, sin fotos',          tpl:'clasica',  c:['#F7F6F3','#1A1A1A','#8A7B54']}
];
```

Se aplican con `body[data-look="X"]` redefiniendo variables CSS. El CSS completo está en
`recuperado/looks.css`.

### Las 5 plantillas de estructura

`vitrina` (foto 5:4, por defecto) · `lista` (miniatura 88px) · `mosaico` (2 columnas 1:1) ·
`panorama` (16:9) · `clasica` (sin fotos, línea punteada de guía).
Se aplican con `data-tpl` en `#platos`.

---

## 7. Sistema de diseño

### El menú — carbón cálido

```css
--fondo:#0E0B09; --carbon:#17120F; --humo:#241C17; --ceniza:#3A2E26;
--brasa:#E8531F; --maiz:#F2B33D; --llajua:#C42B1C; --verde:#4C7A3E;
--cunape:#F4E9D8; --txt2:#B3A395; --tenue:#7D6E62;
--f-d:"Fraunces",Georgia,serif;          /* títulos */
--f-b:"Inter Tight",system-ui,sans-serif; /* cuerpo */
--f-m:"JetBrains Mono",ui-monospace,monospace;  /* números, tabular-nums */
--e-out:cubic-bezier(.16,1,.3,1);
--d-micro:120ms; --d-base:200ms; --d-sheet:280ms;
```

Solo se cargan **tres familias**. Los looks varían la *personalidad* cambiando qué
familia hace de título más peso, tracking y caja (`--f-tit`, `--tit-w`, `--tit-ls`,
`--tit-tt`) — no se agregan fuentes nuevas, para no perder la velocidad ganada.

### La landing — rojo brutalista, a propósito distinta

`--rojo:#E11B14` · `--lima:#C6FF3D` · `--negro:#120A09`, titulares en JetBrains Mono,
cinta diagonal, sello girando, marquesina.

### Reglas de producto que no se negocian

1. **Español latino neutro, tuteo. Nada de voseo.** Antonio lo corrigió expresamente:
   *"no somos argentinos ni tampoco se escribe así en español latino"*. Ya se limpiaron
   tres rondas de "tenés / podés / girá / probá / armá". **Revisa cada texto nuevo.**
2. **Mientras menos botones y textos, mejor.** Textos grandes, intuitivos.
3. **Móvil primero.** Ahí está todo el tráfico. Probado en 360/390/430 px.
4. Los errores hablan en **palabras normales**, nunca códigos crudos ni pantallas rotas.

---

## 8. Economía

**Costo del motor: Bs 0.80 por foto** (Gemini 1K, $0.067, dólar paralelo ≈ Bs 12).

| | |
|---|---|
| Arreglar una carta completa (25 platos), una vez | **Bs 20** |
| Los 12 posts de redes de ese cliente, al mes | **Bs 10** |
| Suscripción mensual al restaurante | **Bs 199** |
| **El motor = 5% de la suscripción** | |

Otros precios verificados (agosto 2026), por si hay que cambiar de proveedor:
Gemini 512px $0.045 · 1K $0.067 · 2K $0.101 · Nano Banana Pro 2K $0.134 ·
fal.ai nano-banana edit $0.039 · GPT Image 2 $0.03–0.08.
**Se probó 2K y quedaba peor: más plano. Quédate en 1K.**

Punto de equilibrio corregido: **22 locales a Bs 199/mes** (incluye el sueldo de
Antonio). Un número anterior de "8 locales" era mío y estaba mal — está corregido dentro
de `interno-a7f3k9.html`.

Costos fijos de referencia: alta de cliente Bs 106 · fijo mensual Bs 680 ·
instalación Bs 490 · comisión de venta 15%.

---

## 9. Qué falta — en orden de valor

1. **Sacar los platos del HTML y meterlos en KV.** Hoy solo se guardan precio y agotado;
   el nombre, la descripción y la foto están escritos dentro de `menu.html`. Mientras siga
   así **no se puede dar de alta un restaurante distinto sin editar el HTML a mano**.
   Es el bloqueo número uno para escalar.
2. **Pantalla de alta `/nuevo`.** Que genere identificador, clave y QR de una, para
   cerrar un cliente y dejarle la carta andando en 5 minutos delante de él. Hoy cada
   restaurante hay que crearlo a mano por API.
3. **Subir fotos de platos desde el panel del dueño**, pasándolas por `/api/mejorar` y
   guardándolas en **R2** (KV no sirve para imágenes de catálogo).
4. **Generar el QR** en la misma página, listo para imprimir.
5. **Pipeline 3D.** Hoy los `.glb` se hacen a mano con Higgsfield `image_to_3d`
   (20 créditos crudo / 30 texturizado, ≈ Bs 15 por plato) y se optimizan con
   `gltf-transform --texture-compress webp --texture-size 1024 --simplify true`.
   Solo 3 de 8 platos tienen modelo. Era el plan premium.
6. **Módulo de posts para redes** — el segundo segmento del producto, el del pago
   recurrente. Está prometido en la landing pero **todavía no existe**.
7. Historial de versiones de la carta (poder volver atrás).

---

## 10. Trampas que ya costaron horas

**No las repitas.**

- **`vh` en iOS** mide la pantalla *sin* la barra de direcciones. La hoja del plato se
  salía por arriba y el 3D quedaba cortado. Usa `dvh` con `vh` de respaldo. Ya arreglado
  en `.caja` (88dvh) y `.visor` (40dvh).
- **`!!el.getAttribute('data-listo')` devuelve `false`** para un atributo vacío. Usa
  `hasAttribute()`. Perdí muchísimo tiempo "depurando" un 3D que funcionaba perfecto.
- **Cloudflare: 5 MB por archivo.** Por eso los `.glb` van sueltos y no incrustados.
- **Los créditos de la app de Higgsfield NO son los de su API.** La cuenta tenía 4.616
  créditos en la app y la API respondía `not_enough_credits`. Son dos saldos distintos.
- **Una cuenta gratuita de ChatGPT no da acceso a la API.** Son productos y facturas
  distintas. Lo mismo con Google: **los modelos de imagen no tienen capa gratuita**, y el
  crédito de $300 de Google Cloud **no se puede usar para Gemini API en AI Studio**.
- **Cloudflare Drop y el drag-and-drop del panel no ejecutan funciones.** Tiene que ser
  un Worker (o Pages con Wrangler). El aviso literal es *"Pages functions are not supported"*.
- **`wrangler deploy --temporary` crea una cuenta prestada que se borra en 60 minutos**
  si no se reclama, y **entrar al sitio no es reclamarla**. Ya no aplica —el sitio está
  en la cuenta propia de Antonio— pero no vuelvas ahí.
- **El token de Cloudflare necesita la plantilla "Edit Cloudflare Workers"**. Uno de solo
  lectura lista los Workers pero no puede publicar, y el error (`assets-upload-session`
  Authentication error) no lo dice claro.
- **Playwright no alcanza `*.workers.dev`** desde el contenedor (ERR_CONNECTION_RESET), y
  `curl` recibe el reto anti-bot de Cloudflare (403) en las páginas HTML — los binarios
  (`.glb`, `.jpg`) sí pasan. Para probar de punta a punta usa `wrangler dev`, que sirve
  los assets y la API en el mismo origen.
- **Las fotos generadas por Higgsfield expiran a los 7 días.** Descárgalas siempre.
- El modelo de texto `gemini-3.5-flash` se satura seguido; el revisor usa
  `gemini-3.1-flash-lite`, que aguanta bien y es más barato.
- **El prompt manda primero y prohíbe después.** La versión que era casi puras
  prohibiciones hacía que el modelo solo recortara y corrigiera color, dejando la bandeja
  naranja y el ruido. El orden actual (ordena → prohíbe) fue el que lo arregló.

---

## 11. Cómo trabajar con Antonio

- Es principiante programando. **Explica el porqué, no solo el qué**, y sin jerga.
- **Verifica antes de afirmar.** Prueba en navegador real, mide bytes, mira los logs.
  Ya hubo un caso de reportar "está roto" cuando el roto era mi test.
- **Reconoce el error propio, rápido y sin drama.** Ha pasado varias veces y funciona
  mejor que justificar.
- Prefiere **lo visual antes que el texto aburrido**.
- Cuando le presentes opciones, dile cuál recomiendas **y por qué**, incluido el riesgo.
- Es cuidadoso con el dinero: siempre dale el costo en **bolivianos**.

---

## 12. Primeros pasos sugeridos

```
1. Recuperar el código (§0) y armar el repo con git.
2. Partir el bundle en src/index.js, src/mejorar.js, src/carta.js.
3. Extraer de menu.html y landing.html las plantillas .tpl.html + un script de build
   (había un build_sitio.py que escribía fotos/, lib/ y reemplazaba {{IMGS}}/{{GLBS}}).
4. GEMINI_API_KEY → wrangler secret. Sacarlo de [vars]. Rotar las llaves.
5. .gitignore: .dev.vars, node_modules, .wrangler
6. npx wrangler dev  → probar /menu.html?r=dona-elsa#k=...  antes de tocar nada
7. Recién ahí: los platos a KV (§9.1) y la pantalla /nuevo (§9.2).
```

**Prueba de humo antes de dar por buena cualquier publicación:**

```bash
B=https://plato-vivo.argianpaypal.workers.dev
curl -s -o /dev/null -w "%{http_code}\n" $B/menu.html            # 200
curl -s "$B/api/carta?r=dona-elsa"                                # existe:true
curl -s -X POST $B/api/mejorar -H 'Content-Type: application/json' \
     -d '{"foto":"data:image/jpeg;base64,'"$(base64 -w0 plato.jpg)"'"}'   # ok:true, ~11 s
```

---

*Todo lo de este documento está verificado contra producción el 17/09/2026: las páginas
responden, la carta de Doña Elsa sigue guardada en KV y los tres prompts salieron del
Worker desplegado, no de la memoria.*
