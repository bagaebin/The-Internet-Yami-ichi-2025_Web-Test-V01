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

const chaosState = {
  active: false,
  originalStyles: new Map(),
  drags: new Map(),
  zIndex: 1000,
  gridStyles: {}
};

function getCardMaxWidth() {
  const root = getComputedStyle(document.documentElement);
  const value = parseFloat(root.getPropertyValue('--card-max'));
  return Number.isFinite(value) ? value : 480;
}

function updateGridLayout(){
  const grid = document.querySelector('.grid');
  if (!grid || chaosState.active) return;

  const cards = Array.from(grid.querySelectorAll('.card'));
  if (cards.length === 0) return;

  const rows = groupRowsByOffsetTop(cards);
  if (rows.size === 0) return;

  const rowLengths = Array.from(rows.values()).map(r => r.length);
  const maxPerRow = Math.max(...rowLengths);
  const shouldStack = maxPerRow <= 1 && window.innerWidth < getCardMaxWidth();

  grid.classList.toggle('is-stack', shouldStack);
}

function setupChaosToggle(grid){
  const toggle = document.getElementById('hate-html-toggle');
  if (!grid || !toggle) return;

  toggle.addEventListener('click', () => {
    if (chaosState.active) {
      exitChaos(grid, toggle);
    } else {
      enterChaos(grid, toggle);
    }
  });

  grid.addEventListener('pointerdown', onChaosPointerDown);
  document.addEventListener('pointermove', onChaosPointerMove);
  document.addEventListener('pointerup', onChaosPointerEnd);
  document.addEventListener('pointercancel', onChaosPointerEnd);
}

function enterChaos(grid, toggle){
  const cards = Array.from(grid.querySelectorAll('.card'));
  if (cards.length === 0) return;

  const gridRect = grid.getBoundingClientRect();
  const snapshots = cards.map(card => ({
    card,
    rect: card.getBoundingClientRect()
  }));

  chaosState.originalStyles.clear();
  snapshots.forEach(({ card }) => {
    chaosState.originalStyles.set(card, {
      position: card.style.position,
      left: card.style.left,
      top: card.style.top,
      width: card.style.width,
      height: card.style.height,
      zIndex: card.style.zIndex,
      cursor: card.style.cursor
    });
  });

  chaosState.gridStyles = {
    height: grid.style.height,
    minHeight: grid.style.minHeight
  };

  chaosState.drags.clear();

  let maxBottom = 0;

  document.body.classList.add('is-chaos');
  grid.classList.add('is-chaos');
  grid.classList.remove('is-stack');

  snapshots.forEach(({ card, rect }) => {
    const left = rect.left - gridRect.left;
    const top = rect.top - gridRect.top;
    card.style.position = 'absolute';
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.zIndex = `${++chaosState.zIndex}`;
    card.style.cursor = 'grab';
    card.classList.add('is-chaos-card');
    maxBottom = Math.max(maxBottom, top + rect.height);
  });

  const canvasHeight = Math.max(maxBottom, grid.offsetHeight);
  grid.style.height = `${Math.ceil(canvasHeight)}px`;
  grid.style.minHeight = grid.style.height;

  toggle.setAttribute('aria-pressed', 'true');
  toggle.textContent = 'LOVE HTML';
  chaosState.active = true;
}

function exitChaos(grid, toggle){
  chaosState.active = false;

  document.body.classList.remove('is-chaos');
  grid.classList.remove('is-chaos');

  chaosState.drags.forEach((drag, pointerId) => {
    if (drag.card && drag.card.releasePointerCapture) {
      drag.card.releasePointerCapture(pointerId);
    }
  });
  chaosState.drags.clear();

  grid.style.height = chaosState.gridStyles.height || '';
  grid.style.minHeight = chaosState.gridStyles.minHeight || '';
  chaosState.gridStyles = {};

  chaosState.originalStyles.forEach((styles, card) => {
    ['position', 'left', 'top', 'width', 'height', 'zIndex', 'cursor'].forEach(prop => {
      card.style[prop] = styles[prop] || '';
    });
    card.classList.remove('is-chaos-card', 'is-dragging');
  });
  chaosState.originalStyles.clear();

  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = 'HATE HTML';

  requestAnimationFrame(() => scheduleLayoutUpdate());
}

function onChaosPointerDown(event){
  if (!chaosState.active || event.button !== 0) return;

  const card = event.target.closest('.card');
  const grid = document.querySelector('.grid');
  if (!card || !grid || !grid.contains(card)) return;

  event.preventDefault();

  const baseLeft = parseFloat(card.style.left) || 0;
  const baseTop = parseFloat(card.style.top) || 0;

  if (card.setPointerCapture) {
    card.setPointerCapture(event.pointerId);
  }

  chaosState.drags.set(event.pointerId, {
    card,
    startX: event.clientX,
    startY: event.clientY,
    baseLeft,
    baseTop
  });

  card.classList.add('is-dragging');
  card.style.cursor = 'grabbing';
  card.style.zIndex = `${++chaosState.zIndex}`;
}

function onChaosPointerMove(event){
  const drag = chaosState.drags.get(event.pointerId);
  if (!drag) return;

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;

  const left = drag.baseLeft + dx;
  const top = drag.baseTop + dy;

  drag.card.style.left = `${left}px`;
  drag.card.style.top = `${top}px`;

  updateChaosBounds(drag.card);
}

function onChaosPointerEnd(event){
  const drag = chaosState.drags.get(event.pointerId);
  if (!drag) return;

  if (drag.card.releasePointerCapture) {
    drag.card.releasePointerCapture(event.pointerId);
  }

  drag.card.classList.remove('is-dragging');
  drag.card.style.cursor = 'grab';

  chaosState.drags.delete(event.pointerId);
}

function updateChaosBounds(card){
  const grid = document.querySelector('.grid');
  if (!grid) return;

  const top = parseFloat(card.style.top) || 0;
  const height = card.offsetHeight;
  const bottom = top + height;
  const currentHeight = parseFloat(grid.style.height) || 0;

  if (bottom > currentHeight) {
    grid.style.height = `${Math.ceil(bottom)}px`;
    grid.style.minHeight = grid.style.height;
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

  setupChaosToggle(grid);
});

window.addEventListener('load', scheduleLayoutUpdate);
window.addEventListener('resize', scheduleLayoutUpdate);
window.addEventListener('orientationchange', scheduleLayoutUpdate);