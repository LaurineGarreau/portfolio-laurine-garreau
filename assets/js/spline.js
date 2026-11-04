// Scènes 3D Spline du Laboratoire (chargé seulement sur cette page, en module)
// (le runtime doit être au moins aussi récent que la version de Spline qui a exporté les scènes)
// - la scène d'ouverture (la chambre) se déploie à l'entrée de la page et se manipule directement ;
// - les autres scènes s'ouvrent en grand depuis leur carte (« Manipuler en 3D »), chargées au clic seulement.
import { Application } from 'https://cdn.jsdelivr.net/npm/@splinetool/runtime@2.0.136/build/runtime.js';

const touch = matchMedia('(pointer: coarse)').matches;
// rendu WebGL imposé : le rendu WebGPU automatique restait vide sur certains navigateurs, et toutes les scènes
// d'une page doivent utiliser le même moteur

// la molette doit faire défiler la page, pas zoomer dans la scène : on l'arrête avant qu'elle n'atteigne le canvas
const keepWheelForPage = el => el.addEventListener('wheel', e => e.stopPropagation(), { capture: true });

/* Scène d'ouverture ------------------------------------------------------- */
const stage = document.querySelector('.lab-stage');
if (stage) {
  const canvas = stage.querySelector('canvas');
  keepWheelForPage(stage);
  // le déploiement démarre dès que la scène est à l'écran
  new IntersectionObserver(([e], io) => {
    if (e.isIntersecting) { stage.classList.add('is-open'); io.disconnect(); }
  }, { threshold: .15 }).observe(stage);

  const app = new Application(canvas, { htmlContentMode: 'none', renderer: 'webgl' });
  app.load(stage.dataset.scene)
    .then(() => {
      // la caméra de la scène est cadrée pour un écran large : on recule sur un écran étroit
      if (stage.clientWidth < 700) app.setZoom(stage.clientWidth / 640);
      stage.classList.add('is-ready');
    })
    .catch(() => stage.classList.add('is-failed')); // l'image de la chambre reste affichée

  // en pause quand elle sort de l'écran (batterie, fluidité du reste de la page)
  new IntersectionObserver(([e]) => { if (stage.classList.contains('is-ready')) e.isIntersecting ? app.play() : app.stop(); })
    .observe(stage);

  // sur écran tactile, le doigt doit d'abord pouvoir faire défiler la page : on active la 3D sur demande
  if (touch) {
    stage.classList.add('is-touch');
    stage.querySelector('.stage-start').addEventListener('click', () => stage.classList.add('is-live'));
    stage.querySelector('.stage-stop').addEventListener('click', () => stage.classList.remove('is-live'));
  }
}

/* Scènes en grand, depuis leur carte -------------------------------------- */
const triggers = document.querySelectorAll('[data-spline]');
if (triggers.length) {
  const box = document.createElement('div');
  box.className = 'spline-modal';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<div class="spline-frame"><canvas></canvas><p class="spline-hint">Glisse pour faire tourner</p></div>'
    + '<button type="button" class="spline-close" aria-label="Fermer">×</button>';
  document.body.appendChild(box);
  keepWheelForPage(box);
  let app = null, opener = null;

  const close = () => {
    box.classList.remove('is-open', 'is-ready');
    if (app) { app.dispose(); app = null; } // libère le contexte WebGL
    opener?.focus();
  };
  triggers.forEach(t => t.addEventListener('click', () => {
    opener = t;
    box.setAttribute('aria-label', t.dataset.title || 'Scène 3D');
    box.classList.add('is-open');
    app = new Application(box.querySelector('canvas'), { htmlContentMode: 'none', renderer: 'webgl' });
    app.load(t.dataset.spline).then(() => box.classList.add('is-ready'));
    box.querySelector('.spline-close').focus();
  }));
  box.querySelector('.spline-close').addEventListener('click', close);
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
}
