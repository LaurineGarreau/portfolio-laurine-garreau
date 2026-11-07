// Scènes 3D Spline du Laboratoire (chargé seulement sur cette page, en module)
// (le runtime doit être au moins aussi récent que la version de Spline qui a exporté les scènes)
// Chaque scène s'ouvre en grand depuis sa carte (« Voir en 3D »), chargée au clic seulement. La caméra reste fixe :
// on garde le cadrage prévu dans Spline et seulement les interactions de la scène (survol, clic).
import { Application } from 'https://cdn.jsdelivr.net/npm/@splinetool/runtime@2.0.136/build/runtime.js';

// rendu WebGL imposé : le rendu WebGPU automatique restait vide sur certains navigateurs, et toutes les scènes
// d'une page doivent utiliser le même moteur

// la molette doit faire défiler la page, pas zoomer dans la scène : on l'arrête avant qu'elle n'atteigne le canvas
const keepWheelForPage = el => el.addEventListener('wheel', e => e.stopPropagation(), { capture: true });

/* Scènes en grand, depuis leur carte -------------------------------------- */
const triggers = document.querySelectorAll('[data-spline]');
if (triggers.length) {
  const box = document.createElement('div');
  box.className = 'spline-modal';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<div class="spline-frame"><canvas></canvas><p class="spline-hint"></p></div>'
    + '<button type="button" class="spline-close" aria-label="Fermer">×</button>';
  document.body.appendChild(box);
  keepWheelForPage(box);
  let app = null, opener = null, blocked = [];
  // touches désactivées pour une scène (data-block-keys="0|…") : arrêtées avant que Spline ne les reçoive
  // (écouteur posé au chargement, donc avant ceux du runtime)
  const blockKeys = e => {
    if (box.classList.contains('is-open') && blocked.includes(e.key)) { e.stopImmediatePropagation(); e.preventDefault(); }
  };
  ['keydown', 'keyup', 'keypress'].forEach(type => window.addEventListener(type, blockKeys, { capture: true }));
  const hint = box.querySelector('.spline-hint');
  const touch = matchMedia('(pointer: coarse)').matches;
  // touches à taper, écrites dans data-keys (« touche:effet|touche ») ; sans clavier, on invite à toucher les objets
  const showKeys = t => {
    hint.replaceChildren();
    if (touch || !t.dataset.keys) { hint.textContent = 'Touche les objets pour les animer'; return; }
    hint.append('Tape ');
    t.dataset.keys.split('|').forEach((pair, i) => {
      const [key, effect] = pair.split(':');
      if (i) hint.append(effect ? ' · ' : ' ');
      const k = document.createElement('kbd'); k.textContent = key; hint.append(k);
      if (effect) hint.append(' ' + effect);
    });
    if (t.dataset.click) hint.append(' ' + t.dataset.click);
  };

  const close = () => {
    box.classList.remove('is-open', 'is-ready');
    if (app) { app.dispose(); app = null; } // libère le contexte WebGL
    opener?.focus();
  };
  triggers.forEach(t => t.addEventListener('click', () => {
    opener = t;
    blocked = (t.dataset.blockKeys || '').split('|').filter(Boolean);
    box.setAttribute('aria-label', t.dataset.title || 'Scène 3D');
    showKeys(t);
    box.classList.add('is-open');
    app = new Application(box.querySelector('canvas'), { htmlContentMode: 'none', renderer: 'webgl' });
    app.load(t.dataset.spline).then(() => {
      const orbit = app.controls?.orbitControls; // pas d'API publique : on coupe la rotation / le zoom de la caméra
      if (orbit) orbit.enabled = false;
      box.classList.add('is-ready');
    });
    box.querySelector('.spline-close').focus();
  }));
  box.querySelector('.spline-close').addEventListener('click', close);
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
}
