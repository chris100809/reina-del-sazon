# 💌 Nuestro Universo — regalo de cumpleaños para Susej

App web estática (HTML + CSS + JS, sin instalar nada) con:

1. Portada con sobre y contador en vivo desde el 14/02/2025 + cuenta regresiva a su cumpleaños (22/10)
2. "Todo sobre ti" y generador de 50 razones por las que te amo
3. Línea de tiempo "Nuestra historia"
4. Galería: tarjetas que se voltean + polaroids con lightbox (50 fotos + 1 video)
5. Carta con efecto de máquina de escribir
6. Metas y sueños con barra de progreso (se guarda en el navegador)
7. Cápsulas del tiempo (cumpleaños, día triste, próximo aniversario)
8. Quiz "¿Cuánto nos conocemos?"
9. Mapa real de las estrellas del 14/02/2025 sobre Venezuela + cierre

## Cómo verla

- **Publicarla gratis con GitHub Pages:** en GitHub → *Settings → Pages* → *Deploy from a branch* → elige la rama y la carpeta `/ (root)`.
  Quedará en `https://chris100809.github.io/reina-del-sazon/regalo-susej/`.
- **En tu computadora:** dentro de esta carpeta ejecuta `python3 -m http.server` y abre `http://localhost:8000`.
  (La canción de YouTube necesita servirse por http/https; abriendo el archivo con doble clic puede no sonar.)

## Editar contenido

Todo el texto, fechas, fotos, quiz y cápsulas están en **`data.js`**. No hace falta tocar nada más.

- Las cápsulas con fecha se abren solas. Para verlas tú antes: añade `?vista=chris` al final de la URL.
- La canción usa YouTube ("Especial" – Eladio Carrión). Si prefieres un mp3, ponlo en `assets/` y escribe su ruta en `cancion.mp3`.
- La hora exacta del noviazgo está a las 00:00; cámbiala en `novios` si recuerdas la real.
