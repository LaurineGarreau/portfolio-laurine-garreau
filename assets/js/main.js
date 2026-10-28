// Portfolio — Garreau Laurine
(() => {
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
  const toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Apparitions au scroll (déclenchent aussi le tracé des annotations)
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Illustrations du titre : petit saut au clic puis ouverture du projet
  const decos = document.querySelectorAll('.deco');
  if (decos.length) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    decos.forEach(d => d.addEventListener('click', e => {
      if (reduce || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      d.classList.remove('is-pressed');
      void d.offsetWidth;
      d.classList.add('is-pressed');
      setTimeout(() => { window.location.href = d.href; }, 480);
    }));
  }

  // Liste des projets (accueil) : au survol d'un titre, l'image du projet apparaît et suit doucement la souris
  const works = document.querySelector('[data-works]');
  const peek = document.querySelector('.peek');
  if (works && peek && window.matchMedia('(hover: hover)').matches) {
    const img = peek.querySelector('img');
    let x = 0, y = 0, px = 0, py = 0, running = false;
    const follow = () => {
      px += (x - px) * .16;
      py += (y - py) * .16;
      peek.style.left = px + 'px';
      peek.style.top = py + 'px';
      running = peek.classList.contains('is-on') || Math.abs(x - px) > .5;
      if (running) requestAnimationFrame(follow);
    };
    const start = () => { if (!running) { running = true; requestAnimationFrame(follow); } };
    works.addEventListener('mousemove', e => {
      x = e.clientX + 40; y = e.clientY;
      start();
    });
    works.querySelectorAll('[data-peek]').forEach(a => {
      a.addEventListener('mouseenter', e => {
        x = e.clientX + 40; y = e.clientY;
        // l'aperçu apparaît directement sous la souris (même si on arrive en faisant défiler, sans bouger la souris)
        if (!peek.classList.contains('is-on')) {
          px = x; py = y;
          peek.style.left = px + 'px';
          peek.style.top = py + 'px';
        }
        img.src = a.dataset.peek;
        peek.classList.add('is-on');
        start();
      });
      a.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
    });
    // en faisant défiler, la souris quitte le titre sans « mouseleave » fiable : on masque l'aperçu
    window.addEventListener('scroll', () => {
      const hovered = works.querySelector('[data-peek]:hover');
      if (!hovered) peek.classList.remove('is-on');
    }, { passive: true });
  }

  // À propos : les courbes de niveau se tracent au fil du défilement
  const topo = document.querySelector('.topo-wrap');
  if (topo) {
    const lines = [...topo.querySelectorAll('path')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // chaque ligne démarre à un moment différent (réparti entre 0 et 45 % du trajet)
    const starts = lines.map((_, i) => ((i * 37) % 100) / 100 * .45);
    const SPAN = .55; // part du trajet pendant laquelle une ligne se dessine
    let ticking = false;
    const draw = () => {
      ticking = false;
      const r = topo.getBoundingClientRect();
      // 0 quand le haut de la section entre en bas de l'écran, 1 quand son milieu atteint le milieu de l'écran
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight / 2 + r.height / 2)));
      lines.forEach((path, i) => {
        const t = Math.min(1, Math.max(0, (p - starts[i]) / SPAN));
        path.style.strokeDashoffset = (1 - t).toFixed(3);
      });
    };
    if (reduce) lines.forEach(path => { path.style.strokeDashoffset = '0'; });
    else {
      window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(draw); }
      }, { passive: true });
      window.addEventListener('resize', draw);
      draw();
    }
  }

  // Contact : copier l'adresse e-mail en un clic
  const copy = document.querySelector('[data-copy]');
  if (copy) {
    const label = copy.textContent;
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copy.dataset.copy);
        copy.textContent = 'Adresse copiée ✓';
      } catch (err) {
        // presse-papiers indisponible : on sélectionne l'adresse pour un Ctrl+C manuel
        const range = document.createRange();
        range.selectNodeContents(document.querySelector('.mail-link'));
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        copy.textContent = 'Ctrl+C pour copier';
      }
      setTimeout(() => { copy.textContent = label; }, 2200);
    });
  }

  // Lightbox (pages projet)
  const shots = document.querySelectorAll('.shot');
  if (shots.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<img alt=""><button type="button" aria-label="Fermer">×</button>';
    document.body.appendChild(box);
    const big = box.querySelector('img');
    const close = () => box.classList.remove('is-open');
    shots.forEach(s => s.addEventListener('click', () => {
      const img = s.querySelector('img');
      big.src = img.src;
      big.alt = img.alt;
      box.classList.add('is-open');
    }));
    box.addEventListener('click', e => { if (e.target !== big) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // Compétences : un clic sur une étiquette déploie son illustration sous le groupe (une seule ouverte par groupe ;
  // re-cliquer referme). Le contenu est recopié depuis le <template>, ce qui relance les animations à chaque ouverture.
  document.querySelectorAll('.skills-row').forEach(row => {
    const panel = row.querySelector('.skill-panel');
    const btns = [...row.querySelectorAll('.tag-btn')];
    btns.forEach(btn => btn.addEventListener('click', () => {
      const wasOpen = btn.getAttribute('aria-expanded') === 'true';
      btns.forEach(b => b.setAttribute('aria-expanded', 'false'));
      if (wasOpen) { panel.hidden = true; panel.replaceChildren(); return; }
      btn.setAttribute('aria-expanded', 'true');
      panel.replaceChildren(btn.parentElement.querySelector('template').content.cloneNode(true));
      panel.setAttribute('aria-label', btn.textContent);
      panel.hidden = false;
    }));
  });

  // Intro d'ouverture (accueil), sur le modèle de fischundtisch.de :
  // 1. le nom s'écrit lettre par lettre
  // 2. le badge « L » et les objets UX apparaissent en croix au centre
  // 3. le badge vole vers l'en-tête qui descend, les objets volent vers le titre qui remonte
  const intro = document.querySelector('.intro');
  if (intro && document.documentElement.classList.contains('intro-on')) runIntro(intro);

  async function runIntro(intro) {
    const root = document.documentElement;
    const header = document.querySelector('.site-header');
    const headerBadge = header.querySelector('.badge');
    const lines = [...document.querySelectorAll('.hero-title .line')];
    const decos = [...document.querySelectorAll('.hero-title .deco')];
    const after = document.querySelectorAll('.hero-hello, .hero-meta, .tiles');
    const easeInOut = 'cubic-bezier(.65, 0, .35, 1)';
    const easeOut = 'cubic-bezier(.22, .8, .2, 1)';
    const pop = 'cubic-bezier(.34, 1.56, .64, 1)';
    let skipped = false;
    // Tempo global : la séquence est jouée à ~45 % de sa durée d'origine (≈ 2,5 s au lieu de 5,5 s)
    const K = .45;
    const wait = ms => new Promise(r => setTimeout(r, ms * K));
    const touched = [];
    const anim = (el, frames, opts) => {
      touched.push(el);
      return el.animate(frames, { fill: 'forwards', ...opts, duration: opts.duration * K, delay: (opts.delay || 0) * K });
    };
    // flottement CSS des objets : mis en pause pendant l'intro pour que les copies atterrissent pile dessus
    const floats = decos.map(d => d.querySelector('img').getAnimations()).flat();
    floats.forEach(a => a.pause());

    // Passage de relais : les vrais éléments prennent la place des copies, l'intro disparaît
    const handOff = () => {
      if (!root.classList.contains('intro-on')) return;
      const ring = intro.querySelector('.badge svg');
      const headerRing = headerBadge.querySelector('svg');
      if (ring && headerRing) { // l'anneau de texte garde son angle, sans saut
        const [from] = ring.getAnimations(), [to] = headerRing.getAnimations();
        if (from && to) to.currentTime = from.currentTime;
      }
      root.classList.add('intro-done');
      root.classList.remove('intro-on');
      floats.forEach(a => a.play());
      intro.remove();
    };
    // Une fois tout arrivé, on retire les animations JS (leur état final = l'état CSS normal)
    const cleanUp = () => touched.forEach(el => el.getAnimations().forEach(a => a.cancel()));
    const skip = () => {
      if (skipped || !root.classList.contains('intro-on')) return;
      skipped = true;
      handOff();
      cleanUp();
    };
    intro.addEventListener('click', skip);
    window.addEventListener('keydown', skip, { once: true });
    // on ne retient pas ceux qui veulent déjà descendre
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('touchstart', skip, { once: true, passive: true });
    try { sessionStorage.setItem('intro-vue', '1'); } catch (e) {} // une seule fois par visite
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    // les mesures de la phase 3 doivent se faire avec les vraies polices
    await Promise.race([document.fonts.ready, wait(1500)]);
    if (skipped) return;

    // 1. Le nom, lettre par lettre
    const word = intro.querySelector('.intro-word');
    const letters = [...word.textContent].map(ch => {
      const s = document.createElement('span');
      s.textContent = ch;
      return s;
    });
    word.replaceChildren(...letters);
    word.classList.add('is-ready');
    letters.forEach((s, i) => anim(s,
      [{ opacity: 0, transform: 'translateY(.35em)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 650, delay: 150 + i * 45, easing: easeOut, fill: 'both' }));
    await wait(150 + letters.length * 45 + 850);
    if (skipped) return;

    // 2. Le nom se replie dans son « L », qui glisse au centre et devient le L du badge ;
    //    l'anneau de texte se déploie ensuite autour, puis les objets apparaissent en croix
    const box = intro.getBoundingClientRect(); // zone visible (hors gouttière de défilement)
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    const B = 120;
    const badge = headerBadge.cloneNode(true);
    badge.removeAttribute('href');
    badge.classList.add('intro-piece');
    badge.style.left = cx - B / 2 + 'px';
    badge.style.top = cy - B / 2 + 'px';
    const mono = badge.querySelector('.mono');
    const ring = badge.querySelector('svg');
    mono.style.opacity = '0';
    ring.style.opacity = '0';
    intro.append(badge);

    const L = letters[0];
    const trail = parseFloat(getComputedStyle(word).letterSpacing) || 0; // blanc après chaque lettre
    const lr = L.getBoundingClientRect();
    const lx = lr.left + (lr.width - trail) / 2, ly = lr.top + lr.height / 2;
    const mr = mono.getBoundingClientRect();
    const mx = mr.left + mr.width / 2, my = mr.top + mr.height / 2;
    const START = .86; // échelle du badge au moment du fondu (il se déploie ensuite jusqu'à 1)
    const grow = START * parseFloat(getComputedStyle(mono).fontSize) / parseFloat(getComputedStyle(L).fontSize);
    const FOLD = 520, TRAVEL = 820, T0 = 180; // repli des lettres, trajet du L, décalage du trajet

    // les autres lettres convergent vers le centre, là où le L se rend, en s'effaçant
    letters.slice(1).forEach((s, i, rest) => {
      const r = s.getBoundingClientRect();
      const toCenter = mx - (r.left + (r.width - trail) / 2);
      anim(s, [{ opacity: 1, transform: 'translate(0, 0) scale(1)' }, { opacity: 0, transform: `translate(${toCenter * .8}px, 0) scale(.6)` }],
        { duration: FOLD, delay: (rest.length - 1 - i) * 16, easing: easeInOut });
    });
    L.style.transformOrigin = `${(lr.width - trail) / 2}px 50%`;
    const there = `translate(${mx - lx}px, ${my - ly}px) scale(${grow})`;
    anim(L, [
      { opacity: 1, transform: 'translate(0, 0) scale(1)' },
      { opacity: 1, transform: there, offset: .72 },
      { opacity: 0, transform: there }
    ], { duration: TRAVEL, delay: T0, easing: easeInOut });
    anim(mono, [{ opacity: 0 }, { opacity: 1 }], { duration: TRAVEL * .3, delay: T0 + TRAVEL * .62, easing: 'linear' });
    anim(ring, [{ opacity: 0 }, { opacity: 1 }], { duration: 650, delay: T0 + TRAVEL * .7, easing: easeOut });
    anim(badge, [{ transform: `scale(${START})` }, { transform: 'scale(1)' }],
      { duration: 900, delay: T0 + TRAVEL * .7, easing: easeOut, fill: 'both' });
    const POP = T0 + TRAVEL + 150; // les objets arrivent quand le badge est formé

    const R = Math.min(130, innerWidth * .3), S = 54;
    const spots = [[0, -R], [R, 0], [-R, 0], [0, R]]; // souris en haut, Figma à droite, téléphone à gauche, curseur en bas
    const pieces = decos.map((d, i) => {
      const src = d.querySelector('img');
      const ratio = src.naturalWidth && src.naturalHeight ? src.naturalWidth / src.naturalHeight : 1;
      const p = document.createElement('div');
      p.className = 'intro-piece';
      p.style.height = S + 'px';
      p.style.width = S * ratio + 'px';
      p.style.left = cx + spots[i][0] - (S * ratio) / 2 + 'px';
      p.style.top = cy + spots[i][1] - S / 2 + 'px';
      p.append(src.cloneNode());
      intro.append(p);
      anim(p, [{ opacity: 0, transform: 'scale(0) rotate(-30deg)' }, { opacity: 1, transform: 'none' }],
        { duration: 600, delay: POP + i * 90, easing: pop, fill: 'both' }); // invisible pendant l'attente
      return p;
    });
    await wait(POP + decos.length * 90 + 600 + 450);
    if (skipped) return;

    // 3. Chacun rejoint sa place : on mesure la mise en page finale, puis on y vole
    header.style.transform = 'none';
    const bRect = headerBadge.getBoundingClientRect();
    const dRects = decos.map(d => d.getBoundingClientRect());
    header.style.transform = '';
    // position de flottement (en pause) de chaque vrai objet, à reproduire à l'arrivée
    const poses = decos.map(d => {
      const cs = getComputedStyle(d.querySelector('img'));
      const [tx = 0, ty = 0] = (cs.translate === 'none' ? '' : cs.translate).split(' ').map(parseFloat);
      return { tx: tx || 0, ty: ty || 0, rot: cs.rotate === 'none' ? '0deg' : cs.rotate };
    });
    const D = 1150, LAG = 80; // la 2e ligne part 80 ms après la 1re
    const lineOf = el => lines.findIndex(l => l.contains(el));
    const flyTo = (el, fromX, fromY, size, rect, arc, delay, pose) => {
      const s = rect.height / size;
      const dx = rect.left + rect.width / 2 - fromX + (pose ? pose.tx : 0);
      const dy = rect.top + rect.height / 2 - fromY + (pose ? pose.ty : 0);
      const end = `translate(${dx}px, ${dy}px) scale(${s}) rotate(${pose ? pose.rot : '0deg'})`;
      return anim(el, [
        { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        { transform: `translate(${dx / 2}px, ${dy / 2 - arc}px) scale(${(1 + s) / 2}) rotate(-10deg)`, offset: .5 },
        { transform: end }
      ], { duration: D, delay, easing: easeInOut });
    };
    flyTo(badge, cx, cy, B, bRect, 40, 0);
    pieces.forEach((p, i) => flyTo(p, cx + spots[i][0], cy + spots[i][1], S, dRects[i], 70, lineOf(decos[i]) * LAG, poses[i]));
    anim(intro, [{ backgroundColor: getComputedStyle(intro).backgroundColor }, { backgroundColor: 'rgba(247, 248, 251, 0)' }],
      { duration: 700, delay: 150 });
    anim(header, [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }],
      { duration: 800, delay: D - 800, easing: easeOut }); // arrive en même temps que le badge
    lines.forEach((l, i) => anim(l, [{ opacity: 0, transform: 'translateY(55vh)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: D, delay: i * LAG, easing: easeInOut, fill: 'both' }));
    after.forEach((el, i) => anim(el, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 700, delay: D * .65 + i * 120, easing: easeOut, fill: 'both' }));
    await wait(D + LAG + 30);
    if (skipped) return;
    handOff();
    await wait(D * .65 + after.length * 120 + 700 - D);
    cleanUp();
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
