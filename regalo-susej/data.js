/*
 * ─────────────────────────────────────────────────────────────
 *  CONTENIDO DEL REGALO — edita aquí cualquier texto, fecha o foto.
 *  No hace falta tocar script.js ni styles.css.
 * ─────────────────────────────────────────────────────────────
 */
window.LOVE = {
  el: 'Christopher',
  ella: 'Susej',
  ellaCompleto: 'Susej Gutiérrez',
  elCompleto: 'Christopher Vera',
  apodo: 'mi pucheritos',

  // Fechas (hora de Venezuela, UTC-4). Cambia la hora si recuerdas la exacta.
  novios: '2025-02-14T00:00:00-04:00',
  nosConocimos: '2023-06-18T00:00:00-04:00',
  cumple: { mes: 10, dia: 22 }, // 22 de octubre

  cancion: {
    titulo: 'Especial',
    artista: 'Eladio Carrión',
    youtubeId: 'NFGQajRHnbQ',
    // Si algún día quieres usar un archivo propio, pon aquí 'assets/cancion.mp3'
    mp3: ''
  },

  // ── SOBRE ELLA ──────────────────────────────────────────────
  sobreElla: {
    intro:
      'Hay personas que llegan a tu vida y la ordenan sin darse cuenta. Tú llegaste y le diste sentido a todo. ' +
      'Eres sensible, cariñosa, divertida y un poquito loquita (de la mejor manera), y tienes un humor tan parecido al mío ' +
      'que a veces siento que me estoy riendo conmigo mismo… pero mejor, porque eres tú.',
    cita:
      'A veces pareces todo lo contrario a mí, y a veces te siento igualita a mí. Eres la única persona con la que me siento bien de verdad.',
    rasgos: [
      { icono: 'ojo', titulo: 'Tus ojos hazel', texto: 'Cambian con la luz y cada vez que me miran me pierdo en ellos. Son mi color favorito del mundo.' },
      { icono: 'sonrisa', titulo: 'Tu sonrisa', texto: 'Esa sonrisa me arregla cualquier día. Si la tengo cerca, todo está bien.' },
      { icono: 'colita', titulo: 'Tú con colita', texto: 'No sé cómo explicarlo, pero cuando te haces una colita te ves preciosa. Me encanta.' },
      { icono: 'mano', titulo: 'Tus caricias', texto: 'Tus manos en mi cara, en mi pelo, en mi espalda… son mi lugar seguro.' },
      { icono: 'puchero', titulo: 'Tus pucheros', texto: 'Por algo eres mi pucheritos. Cuando haces pucheros me derrito, aunque lo hagas para ganarme las discusiones.' },
      { icono: 'pierna', titulo: 'Tu piernita inquieta', texto: 'Esa manía de mover la pierna sin parar. La reconocería en cualquier lugar, y la amo.' }
    ]
  },

  // ── RAZONES POR LAS QUE TE AMO ──────────────────────────────
  razones: [
    'Porque tus ojos hazel son lo más bonito que he visto en mi vida.',
    'Porque tu sonrisa me arregla hasta el peor día.',
    'Porque eres la única persona con la que me siento bien de verdad.',
    'Porque tenemos el mismo humor y nos reímos de las mismas tonterías.',
    'Porque eres loquita, de la mejor manera posible.',
    'Porque haces pucheros y me derrito cada vez.',
    'Porque eres mi pucheritos y nadie más lo será.',
    'Porque mueves la pierna sin parar y hasta eso me parece tierno.',
    'Porque te ves preciosa con colita.',
    'Porque tus caricias me calman como nada más en el mundo.',
    'Porque eres sensible y sientes todo con el corazón.',
    'Porque eres cariñosa conmigo incluso cuando no lo merezco.',
    'Porque eres una buena persona de verdad, de las que casi no quedan.',
    'Porque a veces eres todo lo contrario a mí y eso me completa.',
    'Porque a veces eres igualita a mí y eso me hace sentir en casa.',
    'Porque supe que te amaba solo tres días después de conocerte.',
    'Porque me dijiste que sí en la cascada, el día más bonito de mi vida.',
    'Porque nuestro primer beso fue en un ascensor y desde ahí no he dejado de subir.',
    'Porque cada 14 celebro haberte elegido otra vez.',
    'Porque me pegas mocos y aun así no te cambiaría por nada. 🤢❤️',
    'Porque nos reímos todo el tiempo, hasta en los momentos más serios.',
    'Porque me viste casi morirme después de dos Monster haciendo ejercicio… y te quedaste.',
    'Porque contigo Tucacas, Choroní, Trujillo y El Ávila se volvieron recuerdos para siempre.',
    'Porque contigo cualquier plan, por simple que sea, se vuelve mi favorito.',
    'Porque me impulsas a ser mejor sin pedirme que deje de ser yo.',
    'Porque sueñas con ver auroras boreales y yo sueño con verlas a tu lado.',
    'Porque quiero vivir contigo y despertar viendo tu cara cada mañana.',
    'Porque quiero tener hijos contigo y que tengan tus ojos.',
    'Porque contigo el futuro no me da miedo, me da ilusión.',
    'Porque me abrazas y el mundo se calla.',
    'Porque tus besos siguen sintiéndose como el primero.',
    'Porque sabes exactamente cuándo necesito un abrazo.',
    'Porque te tapas la boca para reírte y tus ojos te delatan.',
    'Porque haces caras raras en las fotos y igual sales preciosa.',
    'Porque me haces sentir el hombre más afortunado del mundo.',
    'Porque contigo puedo ser yo, sin filtros.',
    'Porque eres mi mejor amiga además de mi novia.',
    'Porque estás para mí en las buenas y en las malas.',
    'Porque quiero estar para ti en las buenas y, sobre todo, en las malas.',
    'Porque cuando estoy lejos de ti, te tengo presente en todo.',
    'Porque tu voz es mi canción favorita (después de "Especial", obvio).',
    'Porque cada foto contigo es mi nueva foto favorita.',
    'Porque haces que los días normales se sientan especiales.',
    'Porque me miras como si yo fuera suficiente.',
    'Porque eres hermosa por fuera y todavía más por dentro.',
    'Porque contigo aprendí lo que es amar de verdad.',
    'Porque nunca me aburro de ti, ni me aburriré.',
    'Porque eres mi persona favorita para no hacer nada.',
    'Porque juntos somos un equipo y vamos a cumplir todas nuestras metas.',
    'Porque te elegiría hoy, mañana y todos los días de mi vida.'
  ],

  // ── LÍNEA DE TIEMPO ─────────────────────────────────────────
  historia: [
    {
      fecha: '18 de junio de 2023',
      titulo: 'El día que nos conocimos',
      foto: 'assets/fotos/foto-03.jpg',
      texto:
        'Ese día no sabía que mi vida estaba a punto de cambiar. Llegaste tú, con esos ojos y esa forma tan tuya de ser, ' +
        'y algo dentro de mí supo que no iba a ser una persona más. Fue el comienzo de todo.'
    },
    {
      fecha: '21 de junio de 2023',
      titulo: 'El primer "te amo"',
      foto: 'assets/fotos/foto-02.jpg',
      texto:
        'Tres días. Solo tres días después de conocerte ya te lo estaba diciendo. Muchos dirían que era muy pronto; ' +
        'yo digo que mi corazón simplemente lo supo antes que yo. Desde ahí sabía que te amaba, y nunca dejé de hacerlo.'
    },
    {
      fecha: 'El ascensor',
      titulo: 'Nuestro primer beso',
      foto: 'assets/fotos/foto-27.jpg',
      texto:
        'De todos los lugares del mundo, fue en un ascensor. Unos segundos entre piso y piso que se sintieron eternos. ' +
        'Desde entonces cada ascensor me recuerda a ti… y no me quejo.'
    },
    {
      fecha: '14 de febrero de 2025',
      titulo: 'En la cascada: nuestra primera cita y el "sí"',
      foto: 'assets/fotos/foto-09.jpg',
      texto:
        'Nuestra primera cita oficial y el día en que nos hicimos novios, en la cascada, un Día de San Valentín. ' +
        'El sonido del agua, tus nervios, los míos, y un "sí" que se convirtió en el día más bonito de mi vida.'
    },
    {
      fecha: 'Todos los 14',
      titulo: 'Cumplimos mes',
      foto: 'assets/fotos/foto-43.jpg',
      texto:
        'Desde aquel 14 de febrero, cada día 14 es nuestro. Un mes más de risas, de abrazos, de aprender el uno del otro ' +
        'y de elegirnos otra vez.'
    },
    {
      fecha: 'Nuestras aventuras',
      titulo: 'Tucacas, Choroní, Trujillo, El Ávila… y más',
      foto: 'assets/fotos/foto-46.jpg',
      texto:
        'El mar de Tucacas y Choroní, el frío de Trujillo y la subida a El Ávila. Lugares hermosos, pero lo que los hizo inolvidables ' +
        'fue tenerte a mi lado. Y esto es solo el comienzo: nos falta el mundo entero.'
    },
    {
      fecha: 'Recuerdo gracioso',
      titulo: 'La noche de los dos Monster',
      foto: 'assets/fotos/foto-34.jpg',
      texto:
        'Cuando tu papá se fue de viaje me escapé a tu casa. Me tomé dos Monster, me puse a hacer ejercicio delante de ti para lucirme… ' +
        'y casi me muero. Tú muerta de la risa y yo con el corazón a mil. Literal. Sigue siendo una de nuestras historias favoritas.'
    },
    {
      fecha: 'Siempre',
      titulo: 'Risas, mocos y nosotros',
      foto: 'assets/fotos/foto-39.jpg',
      texto:
        'Me pegas mocos (sí, lo dije aquí, ya es oficial) y nos reímos por todo, incluso en los momentos más íntimos. ' +
        'Así somos: dos locos que se aman y que no pueden parar de reírse juntos.'
    },
    {
      fecha: '22 de octubre de 2026',
      titulo: 'Tu cumpleaños',
      foto: 'assets/fotos/foto-50.jpg',
      texto:
        'Hoy celebro que existes. Este regalo es mi forma de decirte que cada momento contigo vale la pena guardarlo para siempre. ' +
        'Feliz cumpleaños, mi pucheritos.'
    }
  ],

  // ── GALERÍA ─────────────────────────────────────────────────
  // destacadas: tarjetas que se voltean para mostrar la historia detrás de la foto.
  destacadas: [
    { foto: 'assets/fotos/foto-27.jpg', titulo: 'El ascensor', historia: 'Los ascensores siempre serán nuestros. Ahí fue nuestro primer beso, y desde entonces cada viaje entre pisos sabe a ti.' },
    { foto: 'assets/fotos/foto-47.jpg', titulo: 'Nuestro mar', historia: 'Olas, sal y tú en mis brazos. Si pudiera congelar un momento, sería uno de estos.' },
    { foto: 'assets/fotos/foto-26.jpg', titulo: 'Tus ojos hazel', historia: 'La foto que mejor explica por qué no puedo dejar de mirarte. Mi color favorito del mundo.' },
    { foto: 'assets/fotos/foto-16.jpg', titulo: 'Picnic de enamorados', historia: 'Fruta, un mantel de cuadritos, la grama y tus besos. No necesitamos nada más para ser felices.' }
  ],
  fotos: [
    { src: 'assets/video/momento.mp4', poster: 'assets/video/momento.jpg', video: true, cap: 'Cine, tú y yo 🎬' },
    { src: 'assets/fotos/foto-01.jpg', cap: 'Noche de luces y sombrero 🤠' },
    { src: 'assets/fotos/foto-02.jpg', cap: 'Tú escondiendo la risa, yo feliz' },
    { src: 'assets/fotos/foto-03.jpg', cap: 'Así de cerquita, siempre' },
    { src: 'assets/fotos/foto-04.jpg', cap: 'Nuestra fila del cine' },
    { src: 'assets/fotos/foto-05.jpg', cap: 'Mi lugar favorito: abrazado a ti' },
    { src: 'assets/fotos/foto-06.jpg', cap: 'Esa sonrisa que me desarma' },
    { src: 'assets/fotos/foto-07.jpg', cap: 'Paz y amor ✌️' },
    { src: 'assets/fotos/foto-08.jpg', cap: 'Besitos robados' },
    { src: 'assets/fotos/foto-09.jpg', cap: 'Entre árboles y besos' },
    { src: 'assets/fotos/foto-10.jpg', cap: 'Tu carita de pena que tanto amo' },
    { src: 'assets/fotos/foto-11.jpg', cap: 'Un día de logros, contigo' },
    { src: 'assets/fotos/foto-12.jpg', cap: 'Celebrando juntos' },
    { src: 'assets/fotos/foto-13.jpg', cap: 'Orgullosos el uno del otro' },
    { src: 'assets/fotos/foto-14.jpg', cap: 'El sol, tú y yo' },
    { src: 'assets/fotos/foto-15.jpg', cap: 'Picnic de enamorados' },
    { src: 'assets/fotos/foto-16.jpg', cap: 'Picnic, fruta y tus besos' },
    { src: 'assets/fotos/foto-17.jpg', cap: 'Yo sonriendo, tú espiando 👀' },
    { src: 'assets/fotos/foto-18.jpg', cap: 'Tirados en la grama, sin apuro' },
    { src: 'assets/fotos/foto-19.jpg', cap: 'Flojeando contigo' },
    { src: 'assets/fotos/foto-20.jpg', cap: 'Espejito, espejito…' },
    { src: 'assets/fotos/foto-22.jpg', cap: 'Mirada de piscina' },
    { src: 'assets/fotos/foto-23.jpg', cap: 'Tardes de terraza' },
    { src: 'assets/fotos/foto-24.jpg', cap: 'Abrazos de noche' },
    { src: 'assets/fotos/foto-25.jpg', cap: 'Un beso en el camino' },
    { src: 'assets/fotos/foto-26.jpg', cap: 'Ojos hazel, mi perdición' },
    { src: 'assets/fotos/foto-27.jpg', cap: 'Ascensores: nuestro lugar 💋' },
    { src: 'assets/fotos/foto-28.jpg', cap: 'Tú haciendo caras, yo feliz' },
    { src: 'assets/fotos/foto-29.jpg', cap: 'Besos frente al espejo' },
    { src: 'assets/fotos/foto-30.jpg', cap: 'Mi equipo favorito' },
    { src: 'assets/fotos/foto-31.jpg', cap: 'Mi pucheritos en pose oficial' },
    { src: 'assets/fotos/foto-32.jpg', cap: 'Un beso en el espejo' },
    { src: 'assets/fotos/foto-33.jpg', cap: 'Tus manos, tus anillos, mi frente' },
    { src: 'assets/fotos/foto-34.jpg', cap: 'Los más payasos del mundo 😛' },
    { src: 'assets/fotos/foto-35.jpg', cap: 'Te tapas la boca, pero tus ojos se ríen' },
    { src: 'assets/fotos/foto-36.jpg', cap: 'Un día bonito en familia' },
    { src: 'assets/fotos/foto-37.jpg', cap: 'Otra vez nosotros en un ascensor' },
    { src: 'assets/fotos/foto-38.jpg', cap: 'Selfie de espejo oficial' },
    { src: 'assets/fotos/foto-39.jpg', cap: 'Cintillo rosado y cero vergüenza' },
    { src: 'assets/fotos/foto-40.jpg', cap: 'Pijamas y espejo' },
    { src: 'assets/fotos/foto-41.jpg', cap: 'Un beso entre la gente' },
    { src: 'assets/fotos/foto-42.jpg', cap: 'Espejo octagonal, amor infinito' },
    { src: 'assets/fotos/foto-43.jpg', cap: 'Globos rosados y un amor enorme 🎈' },
    { src: 'assets/fotos/foto-44.jpg', cap: 'Un beso con sabor a mar' },
    { src: 'assets/fotos/foto-45.jpg', cap: 'Listos para la playa' },
    { src: 'assets/fotos/foto-46.jpg', cap: 'El mar fue testigo' },
    { src: 'assets/fotos/foto-47.jpg', cap: 'Olas, risas y tú en mis brazos' },
    { src: 'assets/fotos/foto-48.jpg', cap: 'Abrazos que curan' },
    { src: 'assets/fotos/foto-49.jpg', cap: 'Tus manos en mi cara' },
    { src: 'assets/fotos/foto-50.jpg', cap: 'Pastel, besos y celebración 🎂' },
    { src: 'assets/fotos/foto-51.jpg', cap: 'Te besaría mil veces más' }
  ],

  // ── CARTA / POEMA ───────────────────────────────────────────
  carta: [
    'Mi pucheritos:',
    '',
    'Hoy cumples años y yo quería regalarte algo que no se acabe, algo que puedas abrir cuantas veces quieras. ' +
      'Por eso hice este pequeño universo, nuestro universo, donde guardo todo lo que somos.',
    '',
    'Desde el 18 de junio de 2023 mi vida tiene otro color: el color hazel de tus ojos. ' +
      'Tres días me bastaron para saber que te amaba, y cada día desde entonces solo me lo ha confirmado.',
    '',
    'Quiero prometerte algo, y quiero que lo leas despacio:',
    'voy a estar contigo en las buenas y en las malas.',
    'En los días bonitos, para celebrarte.',
    'En los días grises, para abrazarte hasta que pasen.',
    'Nos vamos a impulsar juntos, a cumplir cada meta, a crecer sin soltarnos la mano.',
    'Y donde sea que esté, te voy a tener presente en todo.',
    '',
    'Sueño con nuestra casa, con nuestros hijos, con viajar por el mundo y con estar a tu lado ' +
      'el día que el cielo se pinte de verde y veamos juntos las auroras boreales.',
    '',
    'Gracias por ser tú: sensible, cariñosa, divertida y loquita. ' +
      'Gracias por elegirme cada 14 y por hacerme reír incluso cuando me pegas mocos.',
    '',
    'Feliz cumpleaños, amor. Te amo hoy, te amo mañana y te voy a amar siempre.',
    '',
    'Tuyo, para siempre,',
    'Christopher'
  ],

  // ── METAS Y SUEÑOS ──────────────────────────────────────────
  metas: [
    { texto: 'Hacernos novios en un lugar mágico (la cascada)', hecho: true },
    { texto: 'Ir a la playa juntos: Tucacas y Choroní', hecho: true },
    { texto: 'Subir El Ávila juntos', hecho: true },
    { texto: 'Viajar a Trujillo juntos', hecho: true },
    { texto: 'Celebrar tu cumpleaños con un regalo que dure para siempre', hecho: true },
    { texto: 'Vivir juntos en nuestro propio hogar', hecho: false },
    { texto: 'Ver juntos las auroras boreales 🌌 (tu sueño)', hecho: false },
    { texto: 'Tener nuestros hijos y formar nuestra familia', hecho: false },
    { texto: 'Viajar mucho juntos, por Venezuela y por el mundo', hecho: false },
    { texto: 'Cumplir cada una de nuestras metas, impulsándonos el uno al otro', hecho: false },
    { texto: 'Llegar a viejitos y seguir riéndonos igual', hecho: false }
  ],

  // ── CÁPSULAS DEL TIEMPO ─────────────────────────────────────
  // tipo 'fecha' → se abre sola cuando llega la fecha.
  // tipo 'triste' → ella la puede abrir cuando la necesite.
  capsulas: [
    {
      tipo: 'fecha',
      titulo: 'Ábrela en tu cumpleaños',
      abre: '2026-10-22T00:00:00-04:00',
      mensaje:
        '¡Feliz cumpleaños, mi pucheritos! 🎂 Hoy el mundo celebra que existes, pero nadie lo celebra tanto como yo. ' +
        'Gracias por cada risa, cada abrazo y cada puchero. Que este año te traiga todo lo que sueñas, y que yo esté ahí para verte cumplirlo. ' +
        'Te amo con todo lo que soy.'
    },
    {
      tipo: 'triste',
      titulo: 'Ábrela en un día triste',
      mensaje:
        'Amor, si estás leyendo esto es porque hoy pesa un poquito más. Quiero que sepas algo: no estás sola, nunca lo vas a estar. ' +
        'Siempre voy a estar para ti, en las buenas y sobre todo en las malas. Respira, acuérdate de nuestras risas, de los Monster, ' +
        'de los mocos, del ascensor y de la cascada. Todo pasa, pero yo me quedo. Eres fuerte, eres increíble y eres mi persona favorita. ' +
        'Ahora escríbeme o llámame, que quiero abrazarte. Te amo. 💗'
    },
    {
      tipo: 'fecha',
      titulo: 'Ábrela en nuestro próximo aniversario',
      abre: '2027-02-14T00:00:00-04:00',
      mensaje:
        '¡Feliz aniversario, mi amor! Dos años desde aquel "sí" en la cascada. Dos años de elegirnos cada 14, de reírnos de todo y de crecer juntos. ' +
        'Te prometí estar contigo en las buenas y en las malas, impulsarnos y tenerte presente en todo, y hoy te lo vuelvo a prometer. ' +
        'Vamos por nuestra casa, por nuestros viajes, por nuestras auroras boreales y por toda una vida. Te amo más que ayer.'
    }
  ],

  // ── QUIZ ────────────────────────────────────────────────────
  // La primera opción de cada pregunta es la correcta (se mezclan al mostrarse).
  quiz: [
    { p: '¿Dónde fue nuestra primera cita?', opciones: ['En la cascada', 'En el cine', 'En la playa', 'En un restaurante'] },
    { p: '¿Dónde fue nuestro primer beso?', opciones: ['En un ascensor', 'En la cascada', 'En el cine', 'En la playa'] },
    { p: '¿Cuándo cumplimos mes?', opciones: ['Todos los 14', 'Todos los 18', 'Todos los 22', 'Todos los 1'] },
    { p: '¿Cuántos días después de conocernos te dije "te amo"?', opciones: ['3 días', '1 semana', '1 mes', '6 meses'] },
    { p: '¿Cómo te digo yo de cariño?', opciones: ['Mi pucheritos', 'Mi princesa', 'Mi gordita', 'Mi reina'] },
    { p: '¿Cuál es nuestra canción especial?', opciones: ['"Especial" de Eladio Carrión', '"Tití Me Preguntó" de Bad Bunny', '"Hawái" de Maluma', '"Provenza" de Karol G'] }
  ],

  // ── MAPA DE ESTRELLAS ───────────────────────────────────────
  cielo: {
    fecha: '2025-02-14T20:00:00-04:00',
    lugar: 'la cascada, Venezuela',
    lat: 10.5,
    lon: -66.9
  },

  cierre: 'Por siempre y para siempre, juntos'
};
