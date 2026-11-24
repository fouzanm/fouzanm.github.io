(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year').textContent = new Date().getFullYear();

  /* Scroll progress + nav state */
  const nav = $('#nav'), bar = $('#progress');
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
    nav.classList.toggle('scrolled', h.scrollTop > 20);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Mobile menu */
  const links = $('#links');
  $('#burger').addEventListener('click', () => links.classList.toggle('open'));
  $$('a', links).forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  /* Active link highlight */
  const secs = $$('main section[id]');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('a', links).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => spy.observe(s));

  /* Reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* Count-up */
  const co = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    co.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suf : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => co.observe(el));

  /* Spotlight cards follow the mouse */
  $$('.spot').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px');
    c.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* Cursor glow */
  const glow = $('#cursorGlow');
  const fx = $('.bg-fx');
  addEventListener('pointermove', e => {
    glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px';
    fx.style.setProperty('--cx', e.clientX + 'px'); fx.style.setProperty('--cy', e.clientY + 'px');
  }, { passive: true });
  document.addEventListener('pointerleave', () => { fx.style.setProperty('--cx', '-999px'); fx.style.setProperty('--cy', '-999px'); });

  /* Typing effect */
  const words = ['enterprise apps with Python', 'REST APIs & integrations', 'React & OWL interfaces', 'Odoo ERP solutions', 'automations with n8n'];
  const typed = $('#typed');
  if (reduce) typed.textContent = words[0];
  else {
    let w = 0, i = 0, del = false;
    (function type() {
      const word = words[w];
      typed.textContent = word.slice(0, i);
      if (!del && i === word.length) { del = true; return setTimeout(type, 1600); }
      if (del && i === 0) { del = false; w = (w + 1) % words.length; }
      i += del ? -1 : 1;
      setTimeout(type, del ? 28 : 65);
    })();
  }

  /* Hero background: interactive particle network */
  const cv = $('#bg'), ctx = cv.getContext('2d');
  let W, H, pts = [], mouse = { x: -999, y: -999 }, running = true;
  const resize = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    const n = Math.min(110, Math.floor(W * H / 14000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  };
  resize(); addEventListener('resize', resize);
  cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running && !reduce) draw(); }).observe(cv);

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 6.283); ctx.fillStyle = 'rgba(160,150,255,.8)'; ctx.fill();
    }
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
      const d = Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
      if (d < 120) { ctx.strokeStyle = `rgba(124,92,255,${(1 - d / 120) * .35})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke(); }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  draw();
})();
