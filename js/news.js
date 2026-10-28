/* 03 · AI Market News Digest: real Sept 13 headlines stream in, filings / listicles /
   repeats are struck, the two stories the digest used light up, then the digest lands. */
window.initNews = async function (animate) {
  if (!animate) return;
  const heads = [...document.querySelectorAll('#stream .hl')];
  const drops = heads.filter(h => h.classList.contains('drop'));
  const keys = heads.filter(h => h.classList.contains('key'));

  const tl = gsap.timeline({ scrollTrigger: sectionST('#p3') });
  ghostBuild(tl, document.querySelector('#p3'));
  tl.addLabel('start').fromTo(heads, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: .4, stagger: .05 }).addLabel('in');
  drops.forEach(h => {
    tl.from(h.querySelector('.dtag'), { opacity: 0, duration: .08 })
      .from(h.querySelector('.strike'), { scaleX: 0, transformOrigin: 'left center', duration: .1 })
      .fromTo(h, { opacity: 1 }, { opacity: .3, duration: .08, immediateRender: false });
  });
  tl.addLabel('dropped');
  tl.fromTo(keys, { borderColor: '#222a38', backgroundColor: '#121620' },
    { borderColor: '#3fd0ff', backgroundColor: '#10222c', duration: .15 })
    .addLabel('keys');
  if (!isWide) tl.to('#stream', { opacity: 0, duration: .15 });  /* phones: the digest takes the stream's place */
  tl.from('#tg-news', { opacity: 0, y: 30, duration: .2 })
    .from('#tg-news .ln', { opacity: 0, duration: .15, stagger: .1 })
    .addLabel('done')
    .to({}, { duration: .15 });
};
