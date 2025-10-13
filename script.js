/* 작게 유용한 스크립트: data-date 속성에서 요일을 자동 계산해 표시합니다. */
document.addEventListener('DOMContentLoaded', () => {
  // Support: legacy #date-value, .js-date nodes, and <time datetime="YYYY-MM-DD">
  const targets = [];
  const legacy = document.getElementById('date-value');
  if (legacy) targets.push(legacy);
  targets.push(...document.querySelectorAll('.js-date, time[datetime]'));

  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  targets.forEach(el => {
    let iso =
      el.getAttribute('data-date') ||
      (el.tagName === 'TIME' ? el.getAttribute('datetime') : null);
    if (!iso) return;

    // Normalize YYYY-MM-DD → Date.UTC to avoid TZ drift
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return;
    const y = Number(m[1]), mo = Number(m[2]), da = Number(m[3]);
    const d = new Date(Date.UTC(y, mo - 1, da));
    if (isNaN(d)) return;

    const w = weekdays[d.getUTCDay()];
    const dowEl = el.querySelector('.dow');
    if (dowEl) dowEl.textContent = `(${w})`;
  });
});

/* 로고가 없을 때 대체 표시 유지 */
const logo = document.getElementById('logo');
if (logo){
  const fb = document.querySelector('.logo-fallback');
  const toggleFallback = (show) => {
    if (!fb) return;
    fb.style.display = show ? 'grid' : 'none';
    fb.classList.toggle('is-visible', show);
  };
  logo.addEventListener('error', () => toggleFallback(true));
  logo.addEventListener('load',  () => toggleFallback(false));
  // 초기 상태 결정
  if (!logo.complete || logo.naturalWidth === 0) toggleFallback(true);
}

// --- (기존 코드 위에 있어도 되고, 맨 아래에 있어도 됩니다) ---

// rAF-throttled scheduler to avoid layout thrashing
let __rafScheduled = false;
function scheduleLayoutUpdate(){
  if (__rafScheduled) return;
  __rafScheduled = true;
  requestAnimationFrame(() => {
    updateGridLayout();
    __rafScheduled = false;
  });
}

function groupRowsByOffsetTop(items){
  const rows = new Map();
  items.forEach(el => {
    const top = el.offsetTop; // integer px per row in CSS Grid
    if (!rows.has(top)) rows.set(top, []);
    rows.get(top).push(el);
  });
  return rows;
}

function updateGridLayout(){
  const grid = document.querySelector('.grid');
  if (!grid) return;

  // Reset per run
  const allCards = Array.from(grid.querySelectorAll('.card'));
  allCards.forEach(el => el.classList.remove('card--single-row'));

  // Exclude intentional wide cards from row math
  const cardsForRowCalc = allCards.filter(el => !el.classList.contains('card--wide'));
  if (cardsForRowCalc.length === 0) {
    grid.classList.remove('is-single-column');
    return;
  }

  const rows = groupRowsByOffsetTop(cardsForRowCalc);
  if (rows.size === 0) {
    grid.classList.remove('is-single-column');
    return;
  }

  // Determine true single-column mode: every row has exactly 1 card
  const rowLengths = Array.from(rows.values()).map(r => r.length);
  const isSingleColumn = rowLengths.every(len => len === 1);

  if (isSingleColumn) {
    // In true single-column, don't force-expand the last card
    grid.classList.add('is-single-column');
    return;
  } else {
    grid.classList.remove('is-single-column');
  }

  // Multi-column: if the last row has a single card, expand it
  const tops = Array.from(rows.keys());
  const lastTop = Math.max(...tops);
  const lastRow = rows.get(lastTop);
  if (lastRow && lastRow.length === 1) {
    lastRow[0].classList.add('card--single-row');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Ensure layout is stabilized before first measurement
  requestAnimationFrame(() => requestAnimationFrame(scheduleLayoutUpdate));

  const grid = document.querySelector('.grid');
  // Recalculate on grid size changes
  if (grid && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => scheduleLayoutUpdate());
    ro.observe(grid);
  }

  // Recalculate when images inside the grid finish loading
  if (grid) {
    grid.querySelectorAll('img').forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', scheduleLayoutUpdate, { once: true });
      }
    });
  }
});

window.addEventListener('load', scheduleLayoutUpdate);
window.addEventListener('resize', scheduleLayoutUpdate);
window.addEventListener('orientationchange', scheduleLayoutUpdate);