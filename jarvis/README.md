# JARVIS

Panel de control para todos los proyectos: metas del día, registro de avance,
hitos, enlaces a cada sesión de Claude y cuenta regresiva a cada lanzamiento.

- Versión publicada (con datos sincronizados): https://claude.ai/artifact/GVMrcow2V6URmUhMmV26Dh
- `index.html` es la misma página. Abierta fuera de claude.ai guarda los datos
  solo en ese navegador y el botón «Planificar mi día» no está disponible.

Los datos (proyectos y días) viven en la base de datos del artefacto, no en este repo.

## Motores y techos

JARVIS no solo dice **qué** hacer: también **con qué modelo** y **dentro de qué techo**.
Ese pedazo viene de la Consola Retroglobal y ahora vive acá.

- Cada meta lleva su motor — Fable 5, Opus, Sonnet 5, Haiku 4.5 o Higgsfield — y los minutos estimados.
- Pestaña **Consumo**: los tres techos que hay que medir por separado (sesión de 5 h, semanal
  general y semanal de Opus), más los créditos de Higgsfield. Los porcentajes los pone él:
  Claude no expone el consumo real.
- Al planificar el día, JARVIS rutea cada meta según las reglas curadas: la más dura de la mañana
  en Fable, terminal en Sonnet, lo mecánico en Haiku, y evita Opus si su semanal pasó del 70%.

Los techos se guardan en `config/limites` de la misma base de datos.
