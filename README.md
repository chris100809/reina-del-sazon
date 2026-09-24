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
core/workspace/            Carpeta por producto: raw_images, b_roll, audio, subs, output
core/stages/index.js       Registro de handlers (se llena en las próximas partes)
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
node bin/engine.js add prod_12938 "https://www.aliexpress.us/item/....html"
node bin/engine.js run --once     # un pase
node bin/engine.js run            # daemon (cada ENGINE_POLL_INTERVAL_MS, 5 min por defecto)
node bin/engine.js list
```

Variables: `ENGINE_ROOT`, `ENGINE_WORKSPACE_DIR`, `ENGINE_LOGS_DIR`, `ENGINE_DB_FILE`,
`ENGINE_POLL_INTERVAL_MS`, `ENGINE_LEASE_MS`, `ENGINE_MAX_ATTEMPTS`, `ENGINE_BACKOFF_BASE_MS`.

## Hoja de ruta

2. **Scrape**: datos e imágenes del producto → `sharp` → 1080x1920 con fondo difuminado.
3. **Script**: Gemini con salida JSON por esquema + validación + 3 reintentos.
4. **Audio**: `edge-tts` (Python) con timestamps por palabra → subtítulos `.ass` estilo karaoke.
5. **B-roll**: API de Pexels con fallback recortando la búsqueda.
6. **Render**: filtergraph de FFmpeg (zoompan, transiciones, ducking, ASS) + detección NVENC.
7. **Publicación**: APIs oficiales (TikTok Content Posting, YouTube Data, Pinterest).
8. **TUI**: panel en terminal alimentado por `logger.events`.
