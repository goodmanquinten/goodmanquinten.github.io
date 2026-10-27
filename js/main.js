/* motion shell: decides whether to animate, then starts smooth scroll, the rail and each section */
(async function () {
  /* desktop: pin and scrub each build over 850px.
     phones: pin too, and each swipe snaps to the next step (timelines mark steps with labels) */
  const wide = matchMedia('(min-width: 901px)').matches;
  window.isWide = wide;
  window.sectionST = (trigger, extra = {}) => wide
    ? { trigger, start: 'top top', end: '+=850', scrub: .4, pin: true, ...extra }
    : {
        trigger, start: 'top top', end: '+=950', scrub: .15, pin: true, anticipatePin: 1,
        snap: { snapTo: 'labelsDirectional', duration: { min: .15, max: .35 }, delay: 0, ease: 'power2.out' },
        ...extra,
      };
  const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap && window.ScrollTrigger;
  let lenis = null;

  if (animate) {
    document.documentElement.classList.add('anim');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });  /* phone address bar showing/hiding must not re-pin */
    if (window.Lenis) {
      lenis = window.lenis = new Lenis({ lerp: .1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    gsap.from('.hero .name .line', { yPercent: 105, duration: 1.1, ease: 'power4.out', stagger: .12 });
    gsap.from(['.hero .sub', '.side', '.knob'], { opacity: 0, y: 10, duration: .8, delay: .6, stagger: .08 });
  }

  /* each section is independent: one failing (e.g. data/nbis.json missing) can't stop the others */
  for (const init of [initHero, initOptions, initJobs, initNews, initPitch]) {
    try { await init(animate); } catch (e) { console.error(e); }
  }

  /* progress rail: highlights the section in view; links use smooth scroll when available */
  const links = [...document.querySelectorAll('.rail a')];
  const mark = id => links.forEach(a => a.classList.toggle('on', a.dataset.sec === id));
  const ids = ['p1', 'p2', 'p3', 'p4', 'close'];
  if (animate) {
    ids.forEach(id => ScrollTrigger.create({
      trigger: '#' + id, start: 'top center', end: 'bottom center',
      onToggle: self => self.isActive ? mark(id) : (id === 'p1' && self.direction < 0 && mark(null)),
    }));
  } else {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && mark(e.target.id)), { rootMargin: '-45% 0px -45% 0px' });
    ids.forEach(id => io.observe(document.getElementById(id)));
  }
  if (lenis) links.forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); lenis.scrollTo(a.getAttribute('href')); }));

  if (animate) ScrollTrigger.refresh();
})();
