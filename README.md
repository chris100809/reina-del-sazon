# reina-del-sazon — Motor de Producción de Video

Pipeline local y asíncrono que convierte un link de proveedor en un video vertical listo para publicar.
Se construye **por partes**; cada parte es un handler que se enchufa al daemon.

## Parte 1 — Base (✅ lista)

```
bin/engine.js              CLI (add / list / show / retry / run)
core/config.js             Configuración por variables de entorno
core/state/states.js       Máquina de estados + orden de etapas
core/state/jsonStore.js    Estado persistente local (JSON atómico, locks con lease)
core/queue/daemon.js       Orquestador: reclama trabajos, ejecuta handlers, reintenta
core/workspace/            Carpeta por producto: raw_images, images, b_roll, audio, subs, output
core/stages/index.js       Registro de handlers por etapa
tests/                     node --test (sin dependencias)
```

### Estados

| Estado | Etapa que lo consume | Etiqueta mientras corre |
|---|---|---|
| `PENDING_SCRAPE` | scrape | SCRAPING |
| `PENDING_SCRIPT` | script (Gemini) | AI_THINKING |
| `PENDING_ASSETS` | assets (TTS, B-roll) | ASSET_GATHERING |
| `READY_FOR_RENDER` | render (FFmpeg) | RENDERING |
| `READY_TO_PUBLISH` | publish | PUBLISHING |
| `PUBLISHED` / `FAILED` | — (terminales) | |

- **Tolerancia a fallos:** cada error se reintenta con backoff exponencial (30s, 60s, …) hasta
  `ENGINE_MAX_ATTEMPTS` (3). Luego pasa a `FAILED` recordando la etapa; `engine retry <id>` lo reencola.
  Un handler lanza `PermanentError` cuando reintentar no sirve.
- **Recuperación ante caídas:** si el proceso muere a mitad de un render, el lock vence
  (`ENGINE_LEASE_MS`) y el siguiente tick retoma el producto.
- **Firestore:** `JsonStore` define la interfaz (`create/get/list/claimNext/complete/fail/retry`).
  Un `FirestoreStore` con transacciones puede reemplazarlo sin tocar el daemon.

### Uso

```bash
npm test
node bin/engine.js add "https://www.aliexpress.us/item/....html"
node bin/engine.js run --once     # un pase
node bin/engine.js run            # daemon (cada ENGINE_POLL_INTERVAL_MS, 5 min por defecto)
node bin/engine.js list
```

Variables: `ENGINE_ROOT`, `ENGINE_WORKSPACE_DIR`, `ENGINE_LOGS_DIR`, `ENGINE_DB_FILE`,
`ENGINE_POLL_INTERVAL_MS`, `ENGINE_LEASE_MS`, `ENGINE_MAX_ATTEMPTS`, `ENGINE_BACKOFF_BASE_MS`.

## Parte 2 — Scrape de AliExpress + frames 9:16 (✅ lista)

```
core/scrapers/aliexpress/url.js    IDs de producto, links cortos, URLs de imagen en alta resolución
core/scrapers/aliexpress/api.js    API oficial de afiliados (firma HMAC-SHA256)
core/scrapers/aliexpress/page.js   Lectura de la página pública (fallback, sin evasión)
core/scrapers/download.js          Descargas con límite de tamaño/tipo y concurrencia
core/images/vertical.js            sharp: quitar bordes blancos -> 1080x1920 (cover o fondo difuminado)
core/stages/scrape.js              Handler de la etapa "scrape"
```

Flujo: `link → ID de producto → (API si hay credenciales | página pública) → raw_images/ → images/frame_NN.jpg`

- **API recomendada:** crea una app gratis en https://portals.aliexpress.com, copia `.env.example` a `.env`
  y llena `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET` y `ALIEXPRESS_TRACKING_ID`. Además de las imágenes
  trae precio, categoría, video del proveedor y link de afiliado.
- **Sin API:** se lee la página pública. Si AliExpress responde con captcha/403, el producto se reintenta
  con backoff y, si sigue, queda en `FAILED`.
- **Imágenes manuales:** copia fotos en `workspace/<id>/raw_images/` y `engine retry <id>`
  (o antes del primer `run`): se usan sin contactar AliExpress.
- Se descartan miniaturas (< 500 px) y archivos corruptos; `product.data.frames` guarda los frames generados.

```bash
node bin/engine.js add "https://www.aliexpress.com/item/1005006123456789.html"   # -> ali_1005006123456789
node bin/engine.js run --once
```

## Parte 3 — Guion con Gemini (✅ lista)

```
core/agents/gemini.js         Cliente REST de Gemini (sin SDK); 400/401/403/404 = permanente, 429/5xx = reintento
core/agents/scriptSchema.js   Esquema JSON (responseSchema) + validador/normalizador
core/agents/json.js           Extracción tolerante: JSON puro, bloque ```json, o /{[\s\S]*}/
core/agents/scriptwriter.js   Prompt de sistema, parámetros (temp 0.85, topP 0.9, topK 40) y bucle de 3 intentos
core/stages/script.js         Handler de la etapa "script" -> workspace/<id>/script.json
```

- **JSON indestructible en 3 capas:** (1) Gemini con `responseMimeType: application/json` + `responseSchema`,
  (2) extracción tolerante si aun así viene texto extra, (3) validador propio. Si el guion no cumple, los
  errores exactos se le devuelven a Gemini en el siguiente intento (máx. 3). Si los 3 fallan, el daemon
  reintenta más tarde con backoff.
- **Cadena de pensamiento estructurada:** el primer campo es `strategy` (cliente, problema, beneficio, por qué
  funciona el hook); el modelo razona ahí antes de escribir el guion, sin romper el JSON.
- **Normalización automática:** reindexa segmentos, ajusta `product_image_index` al número real de frames, quita
  palabras de énfasis que no se pronuncian, limpia hashtags. Segmento 0 = hook A (para la variante B del render).
- **Cumplimiento publicitario:** el prompt prohíbe inventar especificaciones, reseñas o estadísticas, urgencia
  falsa y claims médicos (FTC / políticas de TikTok). Solo usa los datos del proveedor.
- `script.json` se reutiliza en reintentos (no gasta cuota). Para regenerar: bórralo. Si lo editas a mano, se revalida.
- Sin `GEMINI_API_KEY` la etapa queda en pausa (los productos esperan en `PENDING_SCRIPT`).

## Hoja de ruta

4. **Audio**: `edge-tts` (Python) con timestamps por palabra → subtítulos `.ass` estilo karaoke.
5. **B-roll**: API de Pexels con fallback recortando la búsqueda.
6. **Render**: filtergraph de FFmpeg (zoompan, transiciones, ducking, ASS) + detección NVENC.
7. **Publicación**: APIs oficiales (TikTok Content Posting, YouTube Data, Pinterest).
8. **TUI**: panel en terminal alimentado por `logger.events`.
