/* 01 · Options Analytics Dashboard: renders the real NBIS snapshot, then builds it on scroll. */
window.initOptions = async function (animate) {
  const res = await fetch('data/nbis.json');
  if (!res.ok) throw new Error(`nbis.json ${res.status}`);
  const d = await res.json();
  const $ = id => document.getElementById(id);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, day] = d.date.split('-').map(Number);
  $('p1-label').textContent = `REAL DATA · ${d.ticker} · ${months[m - 1]} ${day}, ${y}`.toUpperCase();
  $('candhead').textContent = `Candidates · spot ${d.spot.toFixed(2)}`;

  /* grid */
  const grid = $('hmgrid');
  grid.style.gridTemplateColumns = `44px repeat(${d.dtes.length}, minmax(0, 1fr))`;
  grid.insertAdjacentHTML('beforeend', '<div></div>' + d.dtes.map(t => `<div class="h">${t}d</div>`).join(''));
  const max = Math.max(...d.net.flat().map(v => Math.abs(v || 0)));
  const shade = v => {
    if (!v) return '#151a22';
    const x = v / max;
    return x > .5 ? '#c9d34a' : x > .2 ? '#1d9e75' : x > .03 ? '#1f5a45' : x > -.03 ? '#1c2230'
      : x > -.2 ? '#2a2440' : x > -.5 ? '#5b3a9a' : '#9d78e6';
  };
  const cells = [];
  d.strikes.forEach((k, r) => {
    grid.insertAdjacentHTML('beforeend', `<div class="s">${k}</div>`);
    d.dtes.forEach((t, c) => {
      const el = document.createElement('div');
      el.className = 'c';
      el.style.background = shade(d.net[r][c]);
      el.title = `${k} · ${t}d · ${(d.net[r][c] / 1e3).toFixed(0)}K`;
      grid.appendChild(el);
      cells.push(el);
    });
  });
  const cell = (r, c) => cells[r * d.dtes.length + c];
  const row = k => d.strikes.indexOf(k);
  const col = t => d.dtes.indexOf(t);

  /* candidates */
  const pct = a => `${(a * 100).toFixed(0)}%`;
  const line = (p, cls) => `<div class="cand ${cls}"><span>${p.strike}p ${p.dte}d</span>` +
    `<span class="${p.reason && p.reason.includes('2 ·') ? 'bad' : ''}">${p.delta.toFixed(2)}</span>` +
    `<span class="${p.reason && p.reason.includes('3 ·') ? 'bad' : ''}">${pct(p.ann)}</span>` +
    `<span class="${p.reason && p.reason.includes('4 ·') ? 'bad' : ''}">${p.put_wall}</span>` +
    (p.reason ? `<span class="why">${p.reason}</span><span class="x"></span>` : '') + '</div>';
  $('cands').innerHTML = d.losers.map(p => line(p, 'lose')).join('') + line(d.winner, 'win');
  const [lead, ...rest] = d.verdict.split(':');
  $('verdict').innerHTML = `<b>${lead}:</b>${rest.join(':')}`;
  $('spotlbl').textContent = `spot ${d.spot.toFixed(2)}`;
  if (d.flip) $('fliplbl').textContent = `zero-gamma flip ${d.flip.toFixed(2)}`;

  /* overlays, positioned against the rendered cells */
  const inDte = d.dtes.map((t, i) => [t, i]).filter(([t]) => t >= d.limits.dte[0] && t <= d.limits.dte[1]).map(([, i]) => i);
  const px = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v + 'px']));
  function place() {
    /* layout boxes relative to #hm (offsetParent), so in-flight scale tweens don't skew them */
    const at = el => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    const box = (r1, c1, r2, c2) => {
      const a = at(cell(r1, c1)), b = at(cell(r2, c2));
      return { left: a.left - 3, top: a.top - 3, width: b.left + b.width - a.left + 6, height: b.top + b.height - a.top + 6 };
    };
    const yAt = price => {  /* strikes descend; interpolate between rows */
      const ks = d.strikes;
      let i = ks.findIndex(k => k <= price);
      if (i <= 0) i = Math.max(1, i === -1 ? ks.length - 1 : 1);
      const hi = at(cell(i - 1, 0)), lo = at(cell(i, 0));
      const f = (ks[i - 1] - price) / (ks[i - 1] - ks[i]);
      return (hi.top + hi.height / 2) + f * ((lo.top + lo.height / 2) - (hi.top + hi.height / 2));
    };
    const gridLeft = at(cell(0, 0)).left;
    Object.assign($('dteBand').style, px(box(0, inDte[0], d.strikes.length - 1, inDte[inDte.length - 1])));
    Object.assign($('deltaBand').style, px(box(row(d.delta_band[1]), 0, row(d.delta_band[0]), d.dtes.length - 1)));
    for (const id of ['spot', 'flip']) {
      const price = id === 'spot' ? d.spot : d.flip;
      if (price == null) continue;
      Object.assign($(id).style, { left: gridLeft + 'px', top: yAt(price) + 'px' });
    }
    d.losers.forEach((p, i) => Object.assign($('m' + i).style, px(box(row(p.strike), col(p.dte), row(p.strike), col(p.dte)))));
    Object.assign($('mw').style, px(box(row(d.winner.strike), col(d.winner.dte), row(d.winner.strike), col(d.winner.dte))));
  }
  place();
  addEventListener('resize', place);
  document.fonts.ready.then(place);  /* header row height changes once the web fonts arrive */
  if (!animate) return;

  const loseRows = [...document.querySelectorAll('#cands .cand.lose')];
  const tl = gsap.timeline({
    scrollTrigger: sectionST('#p1', { onRefresh: place }),
  });
  tl.from(cells, { opacity: 0, scale: .5, duration: .8, stagger: { each: .8 / cells.length } })
    .from(['#spot', '#flip'], { opacity: 0, scaleX: 0, transformOrigin: 'left center', duration: .3, stagger: .15 })
    .from(['#dteBand', '#deltaBand'], { opacity: 0, duration: .25, stagger: .1 })
    .from(['#m0', '#m1', '#cands .cand'], { opacity: 0, duration: .25, stagger: .05 });
  loseRows.forEach((r, i) => {
    tl.from(r.querySelector('.why'), { opacity: 0, duration: .1 })
      .from(r.querySelector('.x'), { scaleX: 0, transformOrigin: 'left center', duration: .15 })
      .fromTo([r, '#m' + i], { opacity: 1 }, { opacity: .3, duration: .12, immediateRender: false });
  });
  tl.fromTo('#mw', { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: .3, ease: 'back.out(2)' })
    .from('#verdict', { opacity: 0, y: 8, duration: .2 })
    .to({}, { duration: .15 });
};
