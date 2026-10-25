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

  // Apparitions + compteurs
  const animateCounter = el => {
    const target = Number(el.dataset.count);
    const pad = el.dataset.pad ? Number(el.dataset.pad) : 0;
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / 1600);
      const v = Math.round(target * (1 - Math.pow(1 - t, 3)));
      el.textContent = String(v).padStart(pad, '0');
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll('[data-count]').forEach(animateCounter);
      io.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Illustrations du titre : petit saut au clic puis ouverture du projet, parallaxe au scroll
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
    if (!reduce) {
      const speeds = [-.12, .08, -.06, .1];
      let ticking = false;
      const parallax = () => {
        const y = Math.min(window.scrollY, 900);
        decos.forEach((d, i) => { d.style.translate = `0 ${(y * speeds[i % speeds.length]).toFixed(1)}px`; });
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
      }, { passive: true });
    }
  }

  // Sélecteur de projets (accueil)
  const selector = document.querySelector('[data-selector]');
  if (selector) {
    const tabs = selector.querySelectorAll('[role="tab"]');
    const imgs = selector.querySelectorAll('.stage-frame img');
    const title = selector.querySelector('[data-stage-title]');
    const text = selector.querySelector('[data-stage-text]');
    const link = selector.querySelector('[data-stage-link]');
    const select = i => {
      tabs.forEach((t, j) => t.setAttribute('aria-selected', i === j));
      imgs.forEach((img, j) => img.classList.toggle('is-active', i === j));
      const t = tabs[i];
      title.textContent = t.dataset.title;
      text.textContent = t.dataset.text;
      link.href = t.dataset.href;
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('mouseenter', () => window.matchMedia('(hover: hover)').matches && select(i));
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
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const touched = [];
    const anim = (el, frames, opts) => { touched.push(el); return el.animate(frames, { fill: 'forwards', ...opts }); };
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

  // Formulaire de contact : vérification des champs puis envoi par e-mail via FormSubmit (sans quitter la page)
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const status = form.querySelector('.form-status');
    const button = form.querySelector('button[type="submit"]');
    const label = button.querySelector('.btn-label');
    const messages = {
      valueMissing: 'Ce champ est obligatoire.',
      typeMismatch: 'Cette adresse e-mail ne semble pas valide.',
    };
    const check = input => {
      const field = input.closest('.field');
      const error = field.querySelector('.field-error');
      const problem = Object.keys(messages).find(k => input.validity[k]);
      field.classList.toggle('has-error', !!problem);
      if (error) error.textContent = problem ? messages[problem] : '';
      return !problem;
    };
    const required = [...form.querySelectorAll('[required]')];
    // une fois signalé, un champ se revérifie pendant la saisie
    required.forEach(input => input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) check(input);
    }));
    const setStatus = (html, kind) => {
      status.innerHTML = html;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const valid = required.map(check).every(Boolean);
      if (!valid) {
        form.querySelector('.has-error input, .has-error textarea').focus();
        return;
      }
      button.disabled = true;
      label.textContent = 'Envoi…';
      setStatus('');
      try {
        const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) === 'false') throw new Error(data.message || res.status);
        form.reset();
        form.classList.add('is-sent');
        label.textContent = 'Message envoyé';
        setStatus('Merci ! Votre message est bien parti, je vous réponds très vite.', 'ok');
      } catch (err) {
        button.disabled = false;
        label.textContent = 'Envoyer le message';
        setStatus('Oups, l\'envoi n\'a pas fonctionné. Vous pouvez m\'écrire directement à <a href="mailto:garreau.laurine@gmail.com">garreau.laurine@gmail.com</a>.', 'error');
      }
    });
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
