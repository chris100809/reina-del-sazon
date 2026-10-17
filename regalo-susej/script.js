(() => {
  'use strict';

  const L = window.LOVE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preview = new URLSearchParams(location.search).get('vista') === 'chris';

  /* ───────── Iconos (trazos estilo Lucide) ───────── */
  const ICONS = {
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    play: '<polygon points="7 4 20 12 7 20 7 4"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    rain: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
    calheart: '<path d="M3 10h18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21.3 14.7a2.4 2.4 0 0 0-3.5 0l-.3.4-.4-.4a2.4 2.4 0 0 0-3.4 3.4L17.5 22l3.6-3.6c1.2-1.2 1.1-2.8.2-3.7Z"/>',
    ojo: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    sonrisa: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    colita: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/>',
    mano: '<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    puchero: '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
    pierna: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const paintIcons = (root = document) => $$('[data-icon]', root).forEach((n) => { n.innerHTML = icon(n.dataset.icon); });

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d) => d.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Caracas' });
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const pad = (n) => String(n).padStart(2, '0');
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento: no pasa nada */ } }
  };

  /* ───────── Confeti propio (corazones + papelitos) ───────── */
  const fx = $('#fx');
  const fxCtx = fx.getContext('2d');
  let particles = [];
  let fxRunning = false;
  const COLORS = ['#f6b8cf', '#fbd9e6', '#be123c', '#f2c46d', '#fde68a', '#ffffff', '#e11d48'];
  function sizeFx() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawHeart(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.3);
    c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    c.fill();
  }
  function confetti({ count = 120, x = 0.5, y = 0.6, spread = 70, power = 13 } = {}) {
    if (reduceMotion) return;
    const ox = x * innerWidth, oy = y * innerHeight;
    for (let i = 0; i < count; i++) {
      const ang = (-90 + (Math.random() - 0.5) * spread * 2) * Math.PI / 180;
      const v = power * (0.45 + Math.random() * 0.75);
      particles.push({
        x: ox, y: oy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
        g: 0.32 + Math.random() * 0.1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        s: 6 + Math.random() * 7, c: COLORS[(Math.random() * COLORS.length) | 0],
        heart: Math.random() < 0.45, life: 0, max: 110 + Math.random() * 60
      });
    }
    if (!fxRunning) { fxRunning = true; requestAnimationFrame(stepFx); }
  }
  function stepFx() {
    fxCtx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter((p) => p.life < p.max && p.y < innerHeight + 40);
    for (const p of particles) {
      p.life++; p.vx *= 0.985; p.vy = p.vy * 0.985 + p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      fxCtx.save();
      fxCtx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      fxCtx.fillStyle = p.c;
      fxCtx.translate(p.x, p.y); fxCtx.rotate(p.rot);
      if (p.heart) drawHeart(fxCtx, 0, -p.s / 2, p.s * 1.3);
      else fxCtx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      fxCtx.restore();
    }
    if (particles.length) requestAnimationFrame(stepFx);
    else { fxRunning = false; fxCtx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  const celebrate = () => { confetti({ x: 0.2, y: 0.7, count: 90 }); confetti({ x: 0.8, y: 0.7, count: 90 }); };

  /* ───────── Corazones al tocar ───────── */
  document.addEventListener('pointerdown', (e) => {
    if (reduceMotion || e.target.closest('.lightbox, .modal, .gate')) return;
    const h = document.createElement('span');
    h.className = 'click-heart';
    h.textContent = '♥';
    h.style.left = e.clientX + 'px';
    h.style.top = e.clientY + 'px';
    h.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
    h.style.color = COLORS[(Math.random() * 4) | 0];
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1000);
  });

  /* ───────── Música ───────── */
  const player = $('#player');
  const playerBtn = $('#player-btn');
  const audio = $('#audio');
  $('#player-title').textContent = L.cancion.titulo;
  $('#player-artist').textContent = L.cancion.artista;
  let yt = null, ytReady = false, wantPlay = false, playing = false;

  function setPlaying(on) {
    playing = on;
    player.classList.toggle('playing', on);
    playerBtn.innerHTML = `<span class="ic">${icon(on ? 'pause' : 'play')}</span>`;
    playerBtn.setAttribute('aria-label', on ? 'Pausar canción' : 'Reproducir canción');
  }
  function playMusic() {
    if (L.cancion.mp3) { audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); return; }
    wantPlay = true;
    if (ytReady) yt.playVideo();
  }
  function pauseMusic() {
    wantPlay = false;
    if (L.cancion.mp3) audio.pause();
    else if (ytReady) yt.pauseVideo();
    setPlaying(false);
  }
  if (L.cancion.mp3) {
    audio.src = L.cancion.mp3;
  } else {
    window.onYouTubeIframeAPIReady = () => {
      yt = new YT.Player('yt-player', {
        width: 200, height: 200, videoId: L.cancion.youtubeId,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: L.cancion.youtubeId, playsinline: 1, rel: 0 },
        events: {
          onReady: () => { ytReady = true; yt.setVolume(70); if (wantPlay) yt.playVideo(); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setPlaying(false);
          }
        }
      });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    document.head.appendChild(s);
  }
  playerBtn.addEventListener('click', () => (playing ? pauseMusic() : playMusic()));
  setPlaying(false);

  /* ───────── Portada ───────── */
  const gate = $('#gate');
  document.body.classList.add('locked');
  $('#gate-btn').addEventListener('click', () => {
    gate.classList.add('opening');
    playMusic();
    setTimeout(() => {
      gate.classList.add('gone');
      document.body.classList.remove('locked');
      player.classList.add('show');
      celebrate();
      if (isBirthdayToday()) setTimeout(celebrate, 900);
    }, reduceMotion ? 50 : 1100);
    setTimeout(() => gate.remove(), 2200);
  });

  /* ───────── Navegación ───────── */
  const nav = $('.topnav');
  const navLinks = $$('a', nav);
  const onScroll = () => nav.classList.toggle('show', scrollY > innerHeight * 0.5);
  addEventListener('scroll', onScroll, { passive: true });
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id === 'razones' ? 'ella' : en.target.id;
      navLinks.forEach((a) => {
        const on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('active', on);
        if (on && nav.classList.contains('show')) a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach((s) => secObs.observe(s));

  /* ───────── Aparición al hacer scroll ───────── */
  const revObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revObs.unobserve(en.target); } });
  }, { threshold: 0.12 });
  const watchReveal = (root = document) => $$('.reveal:not(.in)', root).forEach((n) => revObs.observe(n));

  /* ───────── Cielo del hero ───────── */
  function heroSky() {
    const cv = $('#hero-sky');
    const c = cv.getContext('2d');
    let stars = [], w = 0, h = 0, visible = true;
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 4500);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + 0.2, p: Math.random() * Math.PI * 2, s: 0.5 + Math.random() * 1.5 }));
    }
    function draw(t) {
      c.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = reduceMotion ? 0.7 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.p + t * 0.001 * s.s));
        c.globalAlpha = a;
        c.fillStyle = s.r > 1.1 ? '#fde68a' : '#ffffff';
        c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
      if (visible && !reduceMotion) requestAnimationFrame(draw);
    }
    size();
    addEventListener('resize', size);
    new IntersectionObserver(([en]) => {
      const was = visible; visible = en.isIntersecting;
      if (visible && !was) requestAnimationFrame(draw);
    }).observe(cv);
    requestAnimationFrame(draw);

    const holder = $('.hero-hearts');
    if (!reduceMotion) {
      setInterval(() => {
        if (!visible || document.hidden) return;
        const el = document.createElement('span');
        el.className = 'float-heart';
        el.textContent = '♥';
        const dur = 9 + Math.random() * 8;
        el.style.left = Math.random() * 100 + '%';
        el.style.fontSize = 10 + Math.random() * 22 + 'px';
        el.style.animationDuration = dur + 's';
        holder.appendChild(el);
        setTimeout(() => el.remove(), dur * 1000);
      }, 700);
    }
  }

  /* ───────── Contador del amor ───────── */
  const start = new Date(L.novios);
  const addMonths = (d, m) => {
    const r = new Date(d.getTime());
    const day = r.getDate();
    r.setDate(1); r.setMonth(r.getMonth() + m);
    const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(day, last));
    return r;
  };
  function elapsed(from, to) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    let anchor = addMonths(from, months);
    if (anchor > to) { months--; anchor = addMonths(from, months); }
    let rest = Math.floor((to - anchor) / 1000);
    const d = Math.floor(rest / 86400); rest -= d * 86400;
    const h = Math.floor(rest / 3600); rest -= h * 3600;
    const mi = Math.floor(rest / 60);
    return { y: Math.floor(months / 12), mo: months % 12, d, h, mi, s: rest - mi * 60 };
  }
  const numEls = Object.fromEntries($$('#counter .num').map((n) => [n.dataset.k, n]));
  function tickCounter() {
    const now = new Date();
    const e = now >= start ? elapsed(start, now) : { y: 0, mo: 0, d: 0, h: 0, mi: 0, s: 0 };
    for (const k in e) {
      const v = k === 'y' || k === 'mo' || k === 'd' ? String(e[k]) : pad(e[k]);
      const n = numEls[k];
      if (n.textContent !== v) {
        n.textContent = v;
        if (!reduceMotion) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
      }
    }
    const daysTogether = Math.floor((now - start) / 86400000);
    const daysKnown = Math.floor((now - new Date(L.nosConocimos)) / 86400000);
    $('#hero-since').innerHTML =
      `<b>${daysTogether.toLocaleString('es-VE')}</b> días siendo novios · <b>${daysKnown.toLocaleString('es-VE')}</b> días desde que te conocí`;
  }

  /* ───────── Cumpleaños ───────── */
  function isBirthdayToday(now = new Date()) {
    return now.getMonth() + 1 === L.cumple.mes && now.getDate() === L.cumple.dia;
  }
  function tickBirthday() {
    const box = $('#bday');
    const now = new Date();
    if (isBirthdayToday(now)) {
      box.classList.add('today');
      box.innerHTML = `<div class="bday-title">¡Feliz cumpleaños, ${esc(L.ella)}!</div><div>Hoy el mundo es más bonito porque naciste tú 🎂</div>`;
      $('#hero-eyebrow').textContent = 'Hoy es tu día, mi pucheritos';
      return;
    }
    let next = new Date(now.getFullYear(), L.cumple.mes - 1, L.cumple.dia);
    if (next <= now) next = new Date(now.getFullYear() + 1, L.cumple.mes - 1, L.cumple.dia);
    let s = Math.floor((next - now) / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    box.classList.remove('today');
    box.innerHTML =
      `<div class="bday-title">Cuenta regresiva para tu cumpleaños 🎂</div>` +
      `<div class="bday-time"><span><b>${d}</b><small>días</small></span><span><b>${pad(h)}</b><small>horas</small></span>` +
      `<span><b>${pad(m)}</b><small>min</small></span><span><b>${pad(s)}</b><small>seg</small></span></div>`;
  }

  /* ───────── Sobre ella ───────── */
  function renderElla() {
    $('#ella-intro').textContent = L.sobreElla.intro;
    $('#ella-cita').textContent = '“' + L.sobreElla.cita + '”';
    $('#rasgos').innerHTML = L.sobreElla.rasgos.map((r) =>
      `<article class="rasgo reveal"><div class="rasgo-ic">${icon(r.icono)}</div><h3>${esc(r.titulo)}</h3><p>${esc(r.texto)}</p></article>`
    ).join('');
  }

  /* ───────── Razones ───────── */
  function initReasons() {
    let deck = [], shown = 0;
    const txt = $('#reason-text'), num = $('#reason-num');
    num.textContent = `${L.razones.length} razones (y contando)`;
    $('#reason-btn').addEventListener('click', (e) => {
      if (!deck.length) deck = shuffle(L.razones);
      const next = deck.pop();
      shown++;
      txt.classList.add('fade');
      setTimeout(() => {
        txt.textContent = next;
        num.textContent = `Razón #${shown}`;
        txt.classList.remove('fade');
      }, 300);
      const r = e.currentTarget.getBoundingClientRect();
      confetti({ count: 24, x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight, spread: 40, power: 8 });
    });
  }

  /* ───────── Línea de tiempo ───────── */
  function renderTimeline() {
    $('#timeline').innerHTML = L.historia.map((h, i) => `
      <li class="tl-item reveal">
        <span class="tl-dot">♥</span>
        <article class="tl-card">
          <div class="tl-img" data-src="${esc(h.foto)}" data-cap="${esc(h.titulo)}"><img src="${esc(h.foto)}" alt="${esc(h.titulo)}" loading="lazy"></div>
          <div class="tl-body">
            <span class="tl-date">${esc(h.fecha)}</span>
            <h3>${esc(h.titulo)}</h3>
            <button class="tl-toggle" type="button" aria-expanded="false" aria-controls="tl-s-${i}">Leer nuestra historia <span class="ic">${icon('down')}</span></button>
            <div class="tl-story" id="tl-s-${i}"><div><p>${esc(h.texto)}</p></div></div>
          </div>
        </article>
      </li>`).join('');
    $('#timeline').addEventListener('click', (e) => {
      const t = e.target.closest('.tl-toggle');
      if (t) {
        const item = t.closest('.tl-item');
        const open = item.classList.toggle('open');
        t.setAttribute('aria-expanded', String(open));
        t.firstChild.textContent = open ? 'Cerrar historia ' : 'Leer nuestra historia ';
        return;
      }
      const im = e.target.closest('.tl-img');
      if (im) openLightbox([{ src: im.dataset.src, cap: im.dataset.cap }], 0);
    });
  }

  /* ───────── Galería ───────── */
  const PAGE = 12;
  let galleryShown = 0;
  function renderFlips() {
    $('#flips').innerHTML = L.destacadas.map((f) => `
      <button class="flip reveal" type="button" aria-label="Voltear: ${esc(f.titulo)}">
        <span class="flip-inner">
          <span class="flip-face flip-front"><img src="${esc(f.foto)}" alt="${esc(f.titulo)}" loading="lazy"><em>toca ↻</em><span>${esc(f.titulo)}</span></span>
          <span class="flip-face flip-back"><h4>${esc(f.titulo)}</h4><p>${esc(f.historia)}</p></span>
        </span>
      </button>`).join('');
    $('#flips').addEventListener('click', (e) => {
      const f = e.target.closest('.flip');
      if (f) f.classList.toggle('flipped');
    });
  }
  function morePhotos() {
    const grid = $('#polaroids');
    const slice = L.fotos.slice(galleryShown, galleryShown + PAGE);
    grid.insertAdjacentHTML('beforeend', slice.map((p, k) => {
      const i = galleryShown + k;
      const rot = (Math.random() * 6 - 3).toFixed(1);
      const thumb = p.video ? p.poster : p.src;
      return `<button class="polaroid" type="button" data-i="${i}" style="--r:${rot}deg;animation-delay:${k * 40}ms" aria-label="Ver: ${esc(p.cap)}">
        <span class="ph"><img src="${esc(thumb)}" alt="${esc(p.cap)}" loading="lazy">${p.video ? `<span class="play"><b>${icon('play')}</b></span>` : ''}</span>
        <span class="cap">${esc(p.cap)}</span></button>`;
    }).join(''));
    galleryShown += slice.length;
    const btn = $('#more-btn');
    const left = L.fotos.length - galleryShown;
    if (left <= 0) btn.hidden = true;
    else btn.textContent = `Ver más momentos (${left})`;
  }
  function initGallery() {
    renderFlips();
    morePhotos();
    $('#more-btn').addEventListener('click', morePhotos);
    $('#polaroids').addEventListener('click', (e) => {
      const p = e.target.closest('.polaroid');
      if (p) openLightbox(L.fotos, Number(p.dataset.i));
    });
  }

  /* ───────── Lightbox ───────── */
  const lb = $('#lightbox');
  let lbList = [], lbIdx = 0, lbReturn = null;
  function showLb() {
    const it = lbList[lbIdx];
    const media = $('#lb-media');
    media.innerHTML = it.video
      ? `<video src="${esc(it.src)}" poster="${esc(it.poster || '')}" controls autoplay playsinline></video>`
      : `<img src="${esc(it.src)}" alt="${esc(it.cap)}">`;
    $('#lb-cap').textContent = it.cap;
    const multi = lbList.length > 1;
    $('#lb-prev').hidden = !multi; $('#lb-next').hidden = !multi;
    if (it.video && playing) { pauseMusic(); lb.dataset.resume = '1'; }
  }
  function openLightbox(list, i) {
    lbReturn = document.activeElement;
    lbList = list; lbIdx = i;
    lb.hidden = false;
    document.body.classList.add('locked');
    showLb();
    $('#lb-close').focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    $('#lb-media').innerHTML = '';
    document.body.classList.remove('locked');
    if (lb.dataset.resume) { delete lb.dataset.resume; playMusic(); }
    if (lbReturn) lbReturn.focus();
  }
  const lbStep = (d) => { lbIdx = (lbIdx + d + lbList.length) % lbList.length; showLb(); };
  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', () => lbStep(-1));
  $('#lb-next').addEventListener('click', () => lbStep(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  let tx = null;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (tx === null || lbList.length < 2) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1);
    tx = null;
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight' && lbList.length > 1) lbStep(1);
      else if (e.key === 'ArrowLeft' && lbList.length > 1) lbStep(-1);
    } else if (!modal.hidden && e.key === 'Escape') closeModal();
  });

  /* ───────── Carta con máquina de escribir ───────── */
  function initLetter() {
    const body = $('#letter-body');
    const skip = $('#letter-skip');
    const lines = L.carta;
    const sigIdx = lines.length - 1;
    let started = false, done = false, timer = null;
    const lineEl = (i) => {
      const d = document.createElement('div');
      if (i === sigIdx) d.className = 'sig';
      return d;
    };
    function finish() {
      done = true;
      clearTimeout(timer);
      body.innerHTML = '';
      lines.forEach((t, i) => { const d = lineEl(i); d.textContent = t || ' '; body.appendChild(d); });
      skip.hidden = true;
    }
    function type() {
      started = true;
      let li = 0, ci = 0, cur = null;
      const caret = document.createElement('span');
      caret.className = 'caret';
      const step = () => {
        if (done) return;
        if (li >= lines.length) { caret.remove(); skip.hidden = true; done = true; return; }
        if (!cur) { cur = lineEl(li); body.appendChild(cur); cur.appendChild(caret); }
        const t = lines[li];
        if (ci < t.length) {
          caret.before(t[ci]);
          const ch = t[ci++];
          timer = setTimeout(step, ch === ',' ? 160 : ch === '.' ? 260 : 32 + Math.random() * 24);
        } else {
          if (!t) caret.before(' ');
          li++; ci = 0; cur = null;
          timer = setTimeout(step, t ? 380 : 120);
        }
      };
      step();
    }
    skip.addEventListener('click', finish);
    if (reduceMotion) { finish(); return; }
    new IntersectionObserver(([en], obs) => {
      if (en.isIntersecting && !started) { obs.disconnect(); type(); }
    }, { threshold: 0.3 }).observe($('#letter'));
  }

  /* ───────── Metas ───────── */
  function initBucket() {
    const KEY = 'susej-metas-v1';
    const saved = store.get(KEY);
    const state = L.metas.map((m, i) => (Array.isArray(saved) && typeof saved[i] === 'boolean' ? saved[i] : m.hecho));
    const ul = $('#bucket-list');
    ul.innerHTML = L.metas.map((m, i) => `
      <li class="bucket-item"><label>
        <input type="checkbox" data-i="${i}" ${state[i] ? 'checked' : ''}>
        <span class="check">${icon('check')}</span>
        <span class="btext">${esc(m.texto)}</span>
      </label></li>`).join('');
    const update = () => {
      const n = state.filter(Boolean).length;
      $('#bucket-count').textContent = `${n}/${state.length} sueños cumplidos`;
      $('#bucket-pct').textContent = Math.round((n / state.length) * 100) + '%';
      $('#bucket-bar').style.width = (n / state.length) * 100 + '%';
    };
    ul.addEventListener('change', (e) => {
      const cb = e.target;
      state[Number(cb.dataset.i)] = cb.checked;
      store.set(KEY, state);
      update();
      if (cb.checked) {
        const r = cb.closest('label').getBoundingClientRect();
        confetti({ count: 50, x: (r.left + 30) / innerWidth, y: r.top / innerHeight, spread: 50, power: 9 });
      }
    });
    update();
  }

  /* ───────── Cápsulas del tiempo ───────── */
  const modal = $('#modal');
  let modalReturn = null;
  function openModal(title, text) {
    modalReturn = document.activeElement;
    $('#modal-title').textContent = title;
    $('#modal-text').textContent = text;
    modal.hidden = false;
    document.body.classList.add('locked');
    $('#modal-close').focus();
    celebrate();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('locked');
    if (modalReturn) modalReturn.focus();
  }
  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  function initCapsules() {
    const wrap = $('#capsules');
    wrap.innerHTML = L.capsulas.map((c, i) => {
      const ic = c.tipo === 'triste' ? 'rain' : i === 0 ? 'cake' : 'calheart';
      return `<article class="capsule reveal" data-i="${i}">
        <div class="cap-ic">${icon(ic)}</div>
        <h3>${esc(c.titulo)}</h3>
        <div class="cap-state"></div>
      </article>`;
    }).join('');
    const cards = $$('.capsule', wrap);
    function paint() {
      const now = new Date();
      cards.forEach((card) => {
        const c = L.capsulas[Number(card.dataset.i)];
        const st = $('.cap-state', card);
        let html, open;
        if (c.tipo === 'triste') {
          open = true;
          html = `<p class="cap-note">Guárdala para cuando la necesites. Siempre va a estar aquí para ti.</p>
            <button class="btn btn-soft" type="button" data-open>Hoy la necesito</button>`;
        } else {
          const at = new Date(c.abre);
          open = preview || now >= at;
          if (open) {
            html = `<p class="cap-note">Se abrió el ${esc(fmtDate(at))} ✨</p><button class="btn btn-primary" type="button" data-open>${icon('unlock').replace('<svg', '<svg class="ic"')} Abrir cápsula</button>`;
          } else {
            let s = Math.floor((at - now) / 1000);
            const d = Math.floor(s / 86400); s -= d * 86400;
            const h = Math.floor(s / 3600); s -= h * 3600;
            const m = Math.floor(s / 60); s -= m * 60;
            html = `<p class="cap-note">Esta cápsula se abrirá el ${esc(fmtDate(at))}</p>
              <div class="cap-count"><span><b>${d}</b><small>días</small></span><span><b>${pad(h)}</b><small>hrs</small></span><span><b>${pad(m)}</b><small>min</small></span><span><b>${pad(s)}</b><small>seg</small></span></div>
              <button class="btn btn-soft" type="button" disabled>${icon('lock').replace('<svg', '<svg class="ic"')} Bloqueada</button>`;
          }
        }
        if (card.dataset.html !== html) { st.innerHTML = html; card.dataset.html = html; }
        card.classList.toggle('locked', !open);
        card.classList.toggle('open', open);
      });
    }
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (!b) return;
      const c = L.capsulas[Number(b.closest('.capsule').dataset.i)];
      openModal(c.titulo, c.mensaje);
    });
    paint();
    setInterval(paint, 1000);
  }

  /* ───────── Quiz ───────── */
  function initQuiz() {
    const card = $('#quiz-card');
    const YES = ['¡Exacto, mi amor! 💗', '¡Esa es mi pucheritos! 🥰', '¡Lo sabías! Te amo 😍', '¡Correctísimo! Me conoces tanto…', '¡Sí señora! 💋'];
    const NO = ['Ay no… ¿se te olvidó? 🥺 Igual te amo', 'Mmm, casi casi 😅', 'Te voy a hacer pucheros por esa 😤💗', '¡Noo! Eso me pasa por pegarte mocos 🤧', 'Fallaste, pero me sigues gustando igual 😌'];
    let qi = 0, score = 0, order = [];
    const pick = (a) => a[(Math.random() * a.length) | 0];
    function render() {
      if (qi >= L.quiz.length) return end();
      const q = L.quiz[qi];
      order = shuffle(q.opciones.map((t, i) => ({ t, ok: i === 0 })));
      card.innerHTML = `
        <div class="quiz-top"><span>Pregunta ${qi + 1} de ${L.quiz.length}</span><span>♥ ${score}</span></div>
        <div class="quiz-bar"><i style="width:${(qi / L.quiz.length) * 100}%"></i></div>
        <p class="quiz-q">${esc(q.p)}</p>
        <div class="quiz-opts">${order.map((o, i) => `<button class="opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>
        <p class="quiz-fb" aria-live="polite"></p>`;
    }
    function end() {
      const total = L.quiz.length;
      const msg = score === total ? '¡Perfecto! Nadie me conoce como tú. Eres mi alma gemela 💞'
        : score >= total - 2 ? '¡Casi perfecto! Se nota que me amas 🥰'
        : 'Tenemos que crear más recuerdos juntos para repasar… 😏💗';
      card.innerHTML = `<div class="quiz-end">
        <p class="kicker">Resultado</p>
        <p class="quiz-score">${score}/${total}</p>
        <p class="quiz-q">${esc(msg)}</p>
        <button class="btn btn-primary" type="button" data-retry>${icon('refresh').replace('<svg', '<svg class="ic"')} Jugar otra vez</button>
      </div>`;
      if (score >= total - 1) celebrate();
    }
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-retry]')) { qi = 0; score = 0; render(); return; }
      if (e.target.closest('[data-next]')) { qi++; render(); return; }
      const b = e.target.closest('.opt');
      if (!b || b.disabled) return;
      const chosen = order[Number(b.dataset.i)];
      const btns = $$('.opt', card);
      btns.forEach((x, i) => { x.disabled = true; if (order[i].ok) x.classList.add('right'); });
      const fb = $('.quiz-fb', card);
      if (chosen.ok) {
        score++;
        fb.textContent = pick(YES);
        const r = b.getBoundingClientRect();
        confetti({ count: 70, x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight, spread: 60, power: 10 });
      } else {
        b.classList.add('wrong');
        fb.textContent = pick(NO);
      }
      $('.quiz-top span:last-child', card).textContent = '♥ ' + score;
      const next = document.createElement('button');
      next.className = 'btn btn-primary quiz-next';
      next.type = 'button';
      next.dataset.next = '';
      next.textContent = qi + 1 < L.quiz.length ? 'Siguiente pregunta →' : 'Ver mi resultado';
      fb.after(next);
    });
    render();
  }

  /* ───────── Mapa de estrellas real ───────── */
  // [nombre, ascensión recta (h), declinación (°), magnitud]
  const STARS = [
    ['Sirio', 6.752, -16.716, -1.46], ['Mirzam', 6.378, -17.956, 1.98], ['Wezen', 7.140, -26.393, 1.83], ['Adhara', 6.977, -28.972, 1.5],
    ['Aludra', 7.402, -29.303, 2.45], ['Furud', 6.338, -30.063, 3.0],
    ['Betelgeuse', 5.919, 7.407, 0.5], ['Rigel', 5.242, -8.202, 0.13], ['Bellatrix', 5.419, 6.35, 1.64], ['Saiph', 5.796, -9.67, 2.06],
    ['Alnitak', 5.679, -1.943, 1.77], ['Alnilam', 5.604, -1.202, 1.69], ['Mintaka', 5.533, -0.299, 2.23], ['Meissa', 5.585, 9.934, 3.39],
    ['Procyon', 7.655, 5.225, 0.34], ['Gomeisa', 7.453, 8.289, 2.9],
    ['Cástor', 7.577, 31.888, 1.58], ['Pólux', 7.755, 28.026, 1.14], ['Alhena', 6.629, 16.399, 1.93], ['Mebsuta', 6.732, 25.131, 3.0],
    ['Tejat', 6.383, 22.514, 2.87], ['Wasat', 7.335, 21.982, 3.5],
    ['Aldebarán', 4.599, 16.509, 0.85], ['Elnath', 5.438, 28.608, 1.65], ['Pléyades', 3.791, 24.105, 2.87], ['ζ Tau', 5.627, 21.143, 3.0],
    ['Ain', 4.477, 19.18, 3.5], ['γ Tau', 4.33, 15.628, 3.6],
    ['Capella', 5.278, 45.998, 0.08], ['Menkalinan', 5.992, 44.947, 1.9], ['θ Aur', 5.995, 37.212, 2.6], ['ι Aur', 4.95, 33.166, 2.7],
    ['Régulo', 10.139, 11.967, 1.35], ['Denébola', 11.818, 14.572, 2.14], ['Algieba', 10.333, 19.842, 2.0], ['Zosma', 11.235, 20.524, 2.56],
    ['Chertan', 11.237, 15.43, 3.3], ['η Leo', 10.122, 16.763, 3.5], ['Adhafera', 10.278, 23.417, 3.4], ['Ras Elased', 9.764, 23.774, 3.0],
    ['Canopus', 6.399, -52.696, -0.74], ['Naos', 8.06, -40.003, 2.2], ['Regor', 8.159, -47.337, 1.8], ['Alfard', 9.46, -8.659, 2.0],
    ['Dubhe', 11.062, 61.751, 1.8], ['Merak', 11.031, 56.382, 2.37], ['Phecda', 11.897, 53.695, 2.44], ['Megrez', 12.257, 57.033, 3.3],
    ['Alioth', 12.9, 55.96, 1.77], ['Mizar', 13.399, 54.925, 2.27], ['Alkaid', 13.792, 49.313, 1.86],
    ['Mirfak', 3.405, 49.861, 1.8], ['Algol', 3.136, 40.956, 2.1],
    ['Schedar', 0.675, 56.537, 2.2], ['Caph', 0.153, 59.15, 2.3], ['γ Cas', 0.945, 60.717, 2.4], ['Ruchbah', 1.43, 60.235, 2.7], ['Segin', 1.907, 63.67, 3.4],
    ['Polaris', 2.53, 89.264, 2.0], ['Hamal', 2.12, 23.462, 2.0], ['Sheratan', 1.911, 20.808, 2.6],
    ['Alpheratz', 0.14, 29.09, 2.06], ['Mirach', 1.162, 35.62, 2.07], ['Almach', 2.065, 42.33, 2.1],
    ['Achernar', 1.629, -57.237, 0.46], ['Arneb', 5.546, -17.822, 2.6], ['Nihal', 5.471, -20.759, 2.8], ['Phact', 5.661, -34.074, 2.6],
    ['Menkar', 3.038, 4.09, 2.5], ['Diphda', 0.727, -17.987, 2.0], ['Acrux', 12.443, -63.099, 0.77], ['Gacrux', 12.519, -57.113, 1.6]
  ];
  const LINES = [
    ['Betelgeuse', 'Bellatrix'], ['Betelgeuse', 'Alnitak'], ['Bellatrix', 'Mintaka'], ['Alnitak', 'Alnilam'], ['Alnilam', 'Mintaka'],
    ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel'], ['Betelgeuse', 'Meissa'], ['Bellatrix', 'Meissa'],
    ['Sirio', 'Mirzam'], ['Sirio', 'Wezen'], ['Wezen', 'Adhara'], ['Wezen', 'Aludra'], ['Adhara', 'Furud'],
    ['Procyon', 'Gomeisa'],
    ['Cástor', 'Pólux'], ['Cástor', 'Mebsuta'], ['Mebsuta', 'Tejat'], ['Pólux', 'Wasat'], ['Wasat', 'Alhena'],
    ['Aldebarán', 'Ain'], ['Aldebarán', 'γ Tau'], ['Ain', 'Elnath'], ['Aldebarán', 'ζ Tau'],
    ['Capella', 'Menkalinan'], ['Menkalinan', 'θ Aur'], ['θ Aur', 'Elnath'], ['Elnath', 'ι Aur'], ['ι Aur', 'Capella'],
    ['Régulo', 'η Leo'], ['η Leo', 'Algieba'], ['Algieba', 'Adhafera'], ['Adhafera', 'Ras Elased'], ['Algieba', 'Zosma'],
    ['Zosma', 'Denébola'], ['Denébola', 'Chertan'], ['Chertan', 'Régulo'], ['Zosma', 'Chertan'],
    ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid'],
    ['Mirfak', 'Algol'], ['Caph', 'Schedar'], ['Schedar', 'γ Cas'], ['γ Cas', 'Ruchbah'], ['Ruchbah', 'Segin'],
    ['Hamal', 'Sheratan'], ['Alpheratz', 'Mirach'], ['Mirach', 'Almach'], ['Arneb', 'Nihal'], ['Acrux', 'Gacrux']
  ];
  const CONST = [
    ['Orión', ['Betelgeuse', 'Rigel', 'Alnilam']], ['Can Mayor', ['Sirio', 'Wezen', 'Adhara']], ['Géminis', ['Cástor', 'Alhena']],
    ['Tauro', ['Aldebarán', 'Elnath']], ['Auriga', ['Capella', 'Menkalinan', 'ι Aur']], ['Leo', ['Régulo', 'Denébola', 'Algieba']],
    ['Osa Mayor', ['Dubhe', 'Alkaid']], ['Casiopea', ['Schedar', 'Ruchbah']]
  ];
  const LABELS = ['Sirio', 'Betelgeuse', 'Rigel', 'Aldebarán', 'Capella', 'Procyon', 'Pólux', 'Canopus', 'Régulo', 'Pléyades'];

  function initStarMap() {
    const cv = $('#starmap');
    const c = cv.getContext('2d');
    const when = new Date(L.cielo.fecha);
    const lat = L.cielo.lat * Math.PI / 180;
    const jd = when.getTime() / 86400000 + 2440587.5;
    const gmst = (280.46061837 + 360.98564736629 * (jd - 2451545)) % 360;
    const lst = (gmst + L.cielo.lon + 360) % 360;

    const proj = STARS.map(([name, ra, dec, mag]) => {
      const ha = (lst - ra * 15) * Math.PI / 180;
      const d = dec * Math.PI / 180;
      const alt = Math.asin(Math.sin(d) * Math.sin(lat) + Math.cos(d) * Math.cos(lat) * Math.cos(ha));
      const az = Math.atan2(-Math.sin(ha) * Math.cos(d), Math.cos(lat) * Math.sin(d) - Math.sin(lat) * Math.cos(d) * Math.cos(ha));
      return { name, mag, alt, az };
    });
    const byName = Object.fromEntries(proj.map((s) => [s.name, s]));

    // estrellas de fondo deterministas (siempre las mismas)
    let seed = 140225;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const faint = Array.from({ length: 520 }, () => ({ a: rnd() * Math.PI * 2, r: Math.sqrt(rnd()), s: rnd() * 0.9 + 0.2, o: rnd() * 0.6 + 0.15 }));

    let S = 0, R = 0, cx = 0, cy = 0, base = null, visible = false;
    const xy = (s) => {
      const r = ((Math.PI / 2 - s.alt) / (Math.PI / 2)) * R;
      return [cx - r * Math.sin(s.az), cy - r * Math.cos(s.az)];
    };
    function buildBase() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = cv.clientWidth; cv.width = S * dpr; cv.height = S * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = cy = S / 2; R = S / 2 - 26;
      base = document.createElement('canvas');
      base.width = cv.width; base.height = cv.height;
      const b = base.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = b.createRadialGradient(cx, cy * 0.9, 10, cx, cy, S / 2);
      g.addColorStop(0, '#24103a'); g.addColorStop(0.7, '#12071f'); g.addColorStop(1, '#080310');
      b.fillStyle = g; b.beginPath(); b.arc(cx, cy, S / 2, 0, Math.PI * 2); b.fill();
      // Vía Láctea sutil
      b.save(); b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2); b.clip();
      b.translate(cx, cy); b.rotate(-0.55);
      const mw = b.createLinearGradient(0, -R * 0.25, 0, R * 0.25);
      mw.addColorStop(0, 'rgba(246,184,207,0)'); mw.addColorStop(0.5, 'rgba(246,184,207,0.07)'); mw.addColorStop(1, 'rgba(246,184,207,0)');
      b.fillStyle = mw; b.fillRect(-S, -R * 0.25, S * 2, R * 0.5);
      b.restore();
      // fondo
      faint.forEach((f) => {
        b.globalAlpha = f.o; b.fillStyle = '#fff';
        b.beginPath(); b.arc(cx + Math.cos(f.a) * f.r * R, cy + Math.sin(f.a) * f.r * R, f.s * (S / 620), 0, Math.PI * 2); b.fill();
      });
      b.globalAlpha = 1;
      // horizonte
      b.strokeStyle = 'rgba(246,184,207,.35)'; b.lineWidth = 1;
      b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2); b.stroke();
      b.setLineDash([2, 6]); b.strokeStyle = 'rgba(246,184,207,.12)';
      [R / 3, (2 * R) / 3].forEach((rr) => { b.beginPath(); b.arc(cx, cy, rr, 0, Math.PI * 2); b.stroke(); });
      b.setLineDash([]);
      // líneas de constelaciones
      b.strokeStyle = 'rgba(246,184,207,.38)'; b.lineWidth = Math.max(0.8, S / 700);
      LINES.forEach(([a, z]) => {
        const s1 = byName[a], s2 = byName[z];
        if (!s1 || !s2 || s1.alt < 0 || s2.alt < 0) return;
        const [x1, y1] = xy(s1), [x2, y2] = xy(s2);
        b.beginPath(); b.moveTo(x1, y1); b.lineTo(x2, y2); b.stroke();
      });
      // nombres de constelaciones
      const fs = Math.max(10, S / 52);
      b.font = `italic ${fs}px 'Playfair Display', serif`; b.textAlign = 'center';
      b.fillStyle = 'rgba(253,230,138,.75)';
      CONST.forEach(([label, names]) => {
        const pts = names.map((n) => byName[n]).filter((s) => s && s.alt > 0.03).map(xy);
        if (!pts.length) return;
        const x = pts.reduce((a, p) => a + p[0], 0) / pts.length;
        const y = pts.reduce((a, p) => a + p[1], 0) / pts.length;
        b.fillText(label, x, y + fs * 1.6);
      });
      // nombres de estrellas
      b.font = `${fs * 0.85}px Poppins, sans-serif`; b.fillStyle = 'rgba(251,217,230,.85)'; b.textAlign = 'left';
      LABELS.forEach((n) => {
        const s = byName[n];
        if (!s || s.alt < 0.03) return;
        const [x, y] = xy(s);
        b.fillText(n === 'Sirio' ? 'Sirio ♥' : n, x + 7, y - 6);
      });
      // puntos cardinales
      b.font = `600 ${fs}px Poppins, sans-serif`; b.fillStyle = 'rgba(246,184,207,.9)'; b.textAlign = 'center'; b.textBaseline = 'middle';
      [['N', 0, -1], ['S', 0, 1], ['E', -1, 0], ['O', 1, 0]].forEach(([t, dx, dy]) => b.fillText(t, cx + dx * (R + 13), cy + dy * (R + 13)));
      b.textBaseline = 'alphabetic';
    }
    function frame(t) {
      c.clearRect(0, 0, S, S);
      c.drawImage(base, 0, 0, S, S);
      const k = S / 620;
      for (const s of proj) {
        if (s.alt < 0) continue;
        const [x, y] = xy(s);
        const r = Math.max(0.9, (3.6 - s.mag * 0.75)) * k;
        const tw = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(t * 0.002 + s.az * 13);
        if (s.mag < 1.6) {
          const gl = c.createRadialGradient(x, y, 0, x, y, r * 5);
          gl.addColorStop(0, `rgba(255,240,245,${0.45 * tw})`); gl.addColorStop(1, 'rgba(255,240,245,0)');
          c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 5, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = tw;
        c.fillStyle = s.name === 'Sirio' ? '#fbd9e6' : s.name === 'Betelgeuse' || s.name === 'Aldebarán' ? '#ffd2a6' : '#ffffff';
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
      }
      if (visible && !reduceMotion) requestAnimationFrame(frame);
    }
    const redraw = () => { buildBase(); requestAnimationFrame(frame); };
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(redraw, 150); });
    new IntersectionObserver(([en]) => {
      const was = visible; visible = en.isIntersecting;
      if (visible && !was) requestAnimationFrame(frame);
    }).observe(cv);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(redraw);

    const hh = when.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Caracas' });
    $('#sky-kicker').textContent = `El cielo del ${fmtDate(when)}`;
    $('#starmap-cap').innerHTML =
      `Así se veía el cielo sobre <b>${esc(L.cielo.lugar)}</b> la noche en que me dijiste que sí, a las ${esc(hh)}. ` +
      `Orión brillaba justo encima de nosotros y <b>Sirio</b>, la estrella más brillante del cielo, estaba ahí, igual que tú en mi vida.`;
  }

  /* ───────── Arranque ───────── */
  function init() {
    paintIcons();
    sizeFx();
    addEventListener('resize', sizeFx);
    heroSky();
    tickCounter(); tickBirthday();
    setInterval(() => { tickCounter(); tickBirthday(); }, 1000);
    renderElla();
    initReasons();
    renderTimeline();
    initGallery();
    initLetter();
    initBucket();
    initCapsules();
    initQuiz();
    initStarMap();
    $('#closing-phrase').textContent = L.cierre;
    watchReveal();
    onScroll();
  }
  init();
})();
