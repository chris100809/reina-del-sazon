# Efectos de sonido

Nombres que usa el guion (`audio_directive.sound_effect`):

| Archivo | Cuándo suena |
|---|---|
| `whoosh.(wav\|mp3\|ogg\|m4a)` | Al inicio de la transición del segmento |
| `impact.*` | Al inicio de la transición (reveal del producto) |
| `pop.*` | Al inicio de la transición |
| `ding.*` | Al inicio de la transición |
| `riser.*` | Crece y termina justo cuando entra el segmento |

Si falta alguno, se sintetiza con FFmpeg en `_generated/` (básico, pero funciona).
Reemplázalos por los tuyos cuando quieras: se detectan solos.

Los archivos de audio de esta carpeta no se suben a git.
