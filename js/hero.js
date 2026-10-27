/* Hero: a split doorway. Drag the seam (or tap a side button) all the way left for Work,
   all the way right for Life. Scrolling down without choosing goes to Work. */
window.initHero = async function (animate) {
  const $ = id => document.getElementById(id);
  const hero = $('hero'), knob = $('knob'), tip = $('tip'), back = $('back');
  const work = $('work'), life = $('life');
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  life.hidden = true;  /* without JS the Life section simply follows the work */
  hero.classList.add('pulse');

  /* work layer: a compact view of the real NBIS gamma grid */
  try {
    const d = await fetch('data/nbis.json').then(r => r.json());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, m, day] = d.date.split('-').map(Number);
    $('hero-eye').textContent = `REAL DATA · ${d.ticker} · ${months[m - 1]} ${day}, ${y}`.toUpperCase();
    const max = Math.max(...d.net.flat().map(v => Math.abs(v || 0)));
    const shade = v => { if (!v) return '#151a22'; const x = v / max;
      return x > .5 ? '#c9d34a' : x > .2 ? '#1d9e75' : x > .03 ? '#1f5a45' : x > -.03 ? '#1c2230' : x > -.2 ? '#2a2440' : x > -.5 ? '#5b3a9a' : '#9d78e6'; };
    const heat = $('hero-heat');
    heat.style.gridTemplateColumns = `repeat(${d.dtes.length}, 1fr)`;
    heat.style.width = `min(100%, ${d.dtes.length * 58}px)`;
    const wr = d.strikes.indexOf(d.winner.strike), wc = d.dtes.indexOf(d.winner.dte);
    heat.innerHTML = d.net.map((row, r) => row.map((v, c) =>
      `<span style="background:${shade(v)}${r === wr && c === wc ? ';outline:2px solid #f2d34a;outline-offset:1px' : ''}"></span>`).join('')).join('');
    const [lead, ...rest] = d.verdict.split(':');
    $('hero-v').innerHTML = `<b>${lead}:</b>${rest.join(':')}`;
  } catch (e) { /* the grid is decoration here; the options section reports its own errors */ }

  let x = 50;
  const setX = v => { x = Math.max(0, Math.min(100, v)); hero.style.setProperty('--x', x + '%'); knob.setAttribute('aria-valuenow', Math.round(x)); };
  const animateTo = (to, done) => {
    if (!motion) { setX(to); done && done(); return; }
    const from = x, t0 = performance.now(), dur = 420;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); setX(from + (to - from) * e); k < 1 ? requestAnimationFrame(step) : done && done(); };
    requestAnimationFrame(step);
  };
  const scrollToEl = el => window.lenis ? window.lenis.scrollTo(el, { immediate: !motion }) : el.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
  const refresh = () => window.ScrollTrigger && ScrollTrigger.refresh();
  const show = side => {
    const onLife = side === 'life';
    work.hidden = onLife; life.hidden = !onLife;
    document.documentElement.classList.toggle('on-life', onLife);
    back.hidden = false;
    refresh();
    scrollToEl(onLife ? life : $('p1'));
  };
  /* the work layer sits left of the seam: seam at 100% = all work, at 0% = all photo */
  const goWork = () => animateTo(100, () => show('work'));
  const goLife = () => animateTo(0, () => show('life'));
  const reset = () => {
    work.hidden = false; life.hidden = true; back.hidden = true;
    document.documentElement.classList.remove('on-life');
    refresh();
    window.lenis ? window.lenis.scrollTo(0, { immediate: !motion }) : scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
    animateTo(50);
  };

  /* drag anywhere on the hero; a mostly vertical gesture keeps scrolling the page */
  let start = null, dragging = false;
  hero.addEventListener('pointerdown', e => {
    if (e.target.closest('.door')) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragging = e.target === knob;
    if (dragging) hero.setPointerCapture(e.pointerId);
  });
  hero.addEventListener('pointermove', e => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { dragging = true; hero.setPointerCapture(e.pointerId); }
    if (dragging) {
      hero.classList.remove('pulse'); tip.style.opacity = 0;
      const r = hero.getBoundingClientRect();
      setX((e.clientX - r.left) / r.width * 100);
    }
  });
  const end = () => {
    if (dragging) { if (x >= 80) goWork(); else if (x <= 20) goLife(); else animateTo(50); }
    start = null; dragging = false;
  };
  hero.addEventListener('pointerup', end);
  hero.addEventListener('pointercancel', end);
  knob.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goWork(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goLife(); }
  });
  $('go-work').addEventListener('click', goWork);
  $('go-life').addEventListener('click', goLife);
  $('to-work').addEventListener('click', e => { e.preventDefault(); setX(100); show('work'); });
  back.addEventListener('click', reset);
  setX(50);
};
