/* 02 · AI Job Search Agent: postings arrive, rule breakers are struck and removed,
   survivors get a fit score, and the shortlist lands in Telegram. */
window.initJobs = async function (animate) {
  if (!animate) return;
  const jobs = [...document.querySelectorAll('#feed .job')];
  const fails = jobs.filter(j => j.classList.contains('fail'));
  const keep = jobs.filter(j => !j.classList.contains('fail'));
  const rule = k => document.querySelector(`#p2 .rule[data-k="${k}"]`);

  const tl = gsap.timeline({ scrollTrigger: sectionST('#p2') });
  tl.addLabel('start').from(jobs, { opacity: 0, x: -40, duration: .4, stagger: .04 }).addLabel('in');
  fails.forEach(j => {
    const r = rule(j.dataset.rule), chip = r.querySelector('i');
    tl.to(r, { color: '#ff5d5d', duration: .06 })
      .to(chip, { backgroundColor: '#ff5d5d', duration: .06 }, '<')
      .from(j.querySelector('.why'), { opacity: 0, duration: .08 })
      .from(j.querySelector('.strike'), { scaleX: 0, transformOrigin: 'left center', duration: .12 })
      .to(j, { opacity: .3, duration: .1 })
      .to(r, { color: '#ece9e1', duration: .06 })
      .to(chip, { backgroundColor: '#3fd0ff', duration: .06 }, '<')
      .addLabel('fail' + j.dataset.rule);
  });
  tl.to(fails, { height: 0, paddingTop: 0, paddingBottom: 0, marginTop: -7, opacity: 0, duration: .25 })
    .from(keep.map(j => j.querySelector('.fit')), { opacity: 0, scale: 0, duration: .2, stagger: .08, ease: 'back.out(3)' })
    .addLabel('scored');
  if (!isWide) tl.to('#feed', { opacity: 0, duration: .15 });  /* phones: the chat takes the feed's place */
  tl.from('#tg-jobs', { opacity: 0, y: 30, duration: .25 })
    .from('#tg-jobs .ln', { opacity: 0, duration: .15, stagger: .1 })
    .addLabel('done')
    .to({}, { duration: .15 });
};
