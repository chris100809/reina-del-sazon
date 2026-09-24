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

## Parte 4 — Voz + subtítulos karaoke (✅ lista)

```
core/audio/tts.py          Python + edge-tts: un clip por segmento, rate +15%, pitch +2Hz, WordBoundary
core/audio/voice.js        Invoca tts.py (spawn), une clips con FFmpeg y arma la línea de tiempo por palabra
core/subs/ass.js           Genera captions.ass (1080x1920) estilo karaoke
core/media/{process,ffmpeg}.js   spawn con timeout/abort, ffmpeg/ffprobe
core/stages/assets.js      Handler de la etapa "assets" (voz + subtítulos + B-roll)
```

**Requisitos en tu PC:** Python 3 (`pip install edge-tts`) y FFmpeg en el PATH (o `FFMPEG_BIN` / `FFPROBE_BIN`).

- **Voz femenina** por defecto `en-US-AriaNeural`. Alternativas: `en-US-JennyNeural`, `en-US-AvaNeural`,
  `en-US-EmmaNeural`. Para escucharlas: `node bin/engine.js voice-sample en-US-JennyNeural`.
- **Sonido de anuncio:** los clips se unen con 0.12 s de respiro y se masterizan (highpass 80 Hz → compresor →
  `loudnorm` a -14 LUFS, el volumen estándar de TikTok/Reels).
- **Sincronía exacta:** las duraciones se miden sobre audio decodificado (WAV), no sobre el MP3, cuyo relleno
  del encoder desfasaría los subtítulos ~50 ms por segmento.
- **Subtítulos:** bloques de 1-3 palabras en mayúsculas; la palabra hablada se pinta amarilla (`#FFFF00`) y crece
  al 115 %; las `subtitle_emphasis_words` del guion crecen al 132 % con animación "pop". Se ubican en el tercio
  inferior, por encima de la zona de botones de TikTok. Si edge-tts no entrega tiempos por palabra, se estiman.
- **Salidas:** `audio/voice.mp3`, `audio/voice.json` (tiempos de segmentos y palabras), `subs/captions.ass`.
  La voz se reutiliza en reintentos; se regenera sola si cambia el texto del guion o la voz.

## Parte 5 — B-roll desde Pexels (✅ lista)

```
core/broll/queries.js    Cadena de búsquedas: completa -> sin stopwords -> recortando la última palabra -> genéricas
core/broll/pexels.js     API de Pexels (orientation=portrait, size=medium) + elección de clip/archivo
core/broll/gather.js     Un clip por segmento "b-roll_video", con respaldo a imagen del producto
core/broll/prepare.js    FFmpeg: 1080x1920, 30 fps, sin audio, duración exacta (loop si hace falta)
core/media/download.js   Descarga en streaming con límite de tamaño y escritura atómica
```

- **Duración exacta:** cada clip dura lo que su segmento en la voz (Parte 4) + 0.5 s de margen para transiciones.
- **Elección:** vertical, sin repetir clip dentro del mismo video, el primero que alcance la duración; archivo más
  liviano con alto ≥ 1280 (evita 4K). Si ninguno alcanza, se usa el más largo en loop.
- **Nunca un bloque negro:** `"shocked person looking at phone"` → `"shocked person looking phone"` →
  `"shocked person looking"` → … → `"shocked"`. Si nada funciona (o no hay `PEXELS_API_KEY`), el segmento usa
  una imagen del producto.
- **Reanudable:** `b_roll/manifest.json` guarda cada segmento resuelto (con autor y link de Pexels para créditos).
  Un reintento (p. ej. tras un 429 de cuota) continúa donde quedó; si cambia la búsqueda del guion, se rehace.
- Una API key inválida marca el producto como `FAILED` (no tiene sentido reintentar); los 429/5xx se reintentan.

## Parte 6 — Render con FFmpeg (✅ lista)

```
core/render/plan.js       Línea de tiempo visual sincronizada con la voz (inicio, duración y transición por segmento)
core/render/effects.js    zoom_effect -> zoompan, transition_in -> xfade, efecto glitch
core/render/commands.js   Argumentos de FFmpeg: pasada 1 (clip por segmento) y pasada 2 (composición)
core/render/encoder.js    Detección real de NVENC + perfiles de codificación
core/render/sfx.js        assets/sfx/ (tuyos) o sintetizados si faltan
core/render/music.js      Elección de pista en assets/music/
core/stages/render.js     Handler de la etapa "render" -> output/final.mp4 + output/cover.jpg
```

**Pasada 1 — un clip por segmento** (en paralelo): la imagen o el B-roll se sobre-escala 2x y pasa por
`zoompan` con `d=1` (Ken Burns centrado `x=iw/2-(iw/zoom/2)`, zoom out o paneo), 30 fps, frames exactos.
Zoom de 20 % en `fast_paced`, 10 % en `cinematic_slow`.

**Pasada 2 — composición:**
- **Transiciones `xfade`** que *terminan* justo cuando empieza cada frase: `cut` (1 frame), `fade`, `slide_up`,
  `zoom_blur` (zoomin) y `glitch` (pixelize + separación RGB + ruido).
- **Subtítulos** `captions.ass` quemados con libass (se ejecuta con `cwd` en `subs/` para evitar el escape de
  rutas de Windows dentro del filtergraph).
- **Audio:** voz + música en loop con fade in/out + ducking `sidechaincompress=threshold=0.06:ratio=4:attack=5:release=100`.
  Los segmentos con `music_ducking: false` no bajan la música. SFX en el inicio de cada transición; el `riser`
  termina justo cuando entra su segmento. `alimiter` final (sin clipping); resultado ≈ -14 LUFS.
- **Codificación:** `h264_nvenc -preset p6 -tune hq -b:v 8M` si hay NVIDIA, si no `libx264 -crf 19`. La detección
  hace una codificación de prueba (FFmpeg lista `h264_nvenc` aunque no haya GPU). Forzar con `RENDER_ENCODER`.

**Carpetas:** `assets/music/` (tus pistas libres de derechos; una por producto, siempre la misma para el mismo
producto) y `assets/sfx/` (`whoosh`, `impact`, `pop`, `ding`, `riser`; los que falten se sintetizan).

**Reutilización:** `output/render.json` guarda una huella de todos los insumos; si nada cambió no se re-renderiza.
Referencia en CPU de 4 núcleos sin GPU: ~55 s para un video de 28 s.

## Hoja de ruta

7. **Publicación**: APIs oficiales (TikTok Content Posting, YouTube Data, Pinterest).
8. **TUI**: panel en terminal alimentado por `logger.events`.
