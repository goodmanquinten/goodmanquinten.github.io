/* motion shell: decides whether to animate, then starts each section */
(async function () {
  const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap && window.ScrollTrigger;
  if (animate) {
    document.documentElement.classList.add('anim');
    gsap.registerPlugin(ScrollTrigger);
  }
  await initOptions(animate);
  await initJobs(animate);
  await initNews(animate);
  if (animate) ScrollTrigger.refresh();
})();
