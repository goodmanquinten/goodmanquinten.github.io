/* 04 · Stock pitch: marks the call to market from data/marks.json (updated daily by a GitHub job). */
window.initPitch = async function (animate) {
  const box = document.getElementById('mtm');
  const { ticker } = box.dataset;
  const [entry, target, stop] = ['entry', 'target', 'stop'].map(k => +box.dataset[k]);
  const res = await fetch('data/marks.json', { cache: 'no-cache' });
  if (res.ok) {
    const m = (await res.json())[ticker];
    const ret = m.close / entry - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, mo, d] = m.date.split('-').map(Number);
    document.getElementById('mtm-asof').textContent = `· close ${months[mo - 1]} ${d}, ${y}`;
    document.getElementById('mtm-px').textContent = `$${m.close.toFixed(2)}`;
    const r = document.getElementById('mtm-ret');
    r.textContent = `${ret >= 0 ? '+' : '−'}${Math.abs(ret * 100).toFixed(1)}%`;
    r.className = ret >= 0 ? 'up' : 'down';
    /* position on a stop → target track */
    const at = p => Math.min(100, Math.max(0, (p - stop) / (target - stop) * 100));
    box.querySelector('.tick').style.left = box.querySelector('.m').style.left = at(entry) + '%';
    box.querySelector('.seg').style.background = `linear-gradient(90deg, var(--red) 0 ${at(entry)}%, #2a3140 ${at(entry)}% 100%)`;
    document.getElementById('mtm-dot').style.left = at(m.close) + '%';
  }
  if (animate) {
    gsap.from('#p4 .head, #p4 .drivers li, #p4 .side > *', {
      opacity: 0, y: 24, duration: .7, stagger: .08, ease: 'power2.out',
      scrollTrigger: { trigger: '#p4', start: 'top 70%' },
    });
  }
};
