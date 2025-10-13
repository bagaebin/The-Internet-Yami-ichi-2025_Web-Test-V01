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
function setupLogoFallbacks(){
  document.querySelectorAll('.js-logo').forEach(logo => {
    const wrap = logo.closest('.logo-wrap');
    const fallback = wrap ? wrap.querySelector('.logo-fallback') : null;
    if (!fallback) return;

    const toggleFallback = (show) => {
      fallback.style.display = show ? 'grid' : 'none';
      fallback.classList.toggle('is-visible', show);
    };

    logo.addEventListener('error', () => toggleFallback(true));
    logo.addEventListener('load', () => toggleFallback(false));

    if (!logo.complete || logo.naturalWidth === 0) {
      toggleFallback(true);
    } else {
      toggleFallback(false);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLogoFallbacks);
} else {
  setupLogoFallbacks();
}

// --- (기존 코드 위에 있어도 되고, 맨 아래에 있어도 됩니다) ---

// rAF-throttled scheduler to avoid layout thrashing
let __rafScheduled = false;
function scheduleLayoutUpdate(){
  if (__rafScheduled) return;
  __rafScheduled = true;
  requestAnimationFrame(() => {
    updateAllGridLayouts();
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

const CHAOS_JITTER_RANGE = 24;

const chaosState = {
  active: false,
  originalStyles: new Map(),
  drags: new Map(),
  zIndex: 1000,
  gridStyles: new Map(),
  grids: new Set(),
  cardToGrid: new Map()
};

let gridResizeObserver = null;

function getCardMaxWidth() {
  const root = getComputedStyle(document.documentElement);
  const value = parseFloat(root.getPropertyValue('--card-max'));
  return Number.isFinite(value) ? value : 480;
}

function updateAllGridLayouts(){
  if (chaosState.active) return;
  const grids = document.querySelectorAll('.grid');
  grids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll('.card'));
    if (cards.length === 0) return;

    const rows = groupRowsByOffsetTop(cards);
    if (rows.size === 0) return;

    const rowLengths = Array.from(rows.values()).map(r => r.length);
    const maxPerRow = Math.max(...rowLengths);
    const shouldStack = maxPerRow <= 1 && window.innerWidth < getCardMaxWidth();

    grid.classList.toggle('is-stack', shouldStack);
  });
}

function setupChaosToggle(){
  const toggle = document.getElementById('hate-html-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    if (chaosState.active) {
      exitChaos(toggle);
    } else {
      enterChaos(toggle);
    }
  });

  document.addEventListener('pointerdown', onChaosPointerDown);
  document.addEventListener('pointermove', onChaosPointerMove);
  document.addEventListener('pointerup', onChaosPointerEnd);
  document.addEventListener('pointercancel', onChaosPointerEnd);
}

function getChaosGrids(){
  return Array.from(document.querySelectorAll('.grid')).filter(grid => grid.querySelector('.card'));
}

function captureCardStyles(card){
  chaosState.originalStyles.set(card, {
    position: card.style.position,
    left: card.style.left,
    top: card.style.top,
    width: card.style.width,
    height: card.style.height,
    zIndex: card.style.zIndex,
    cursor: card.style.cursor
  });
}

function enterChaos(toggle){
  const grids = getChaosGrids();
  if (grids.length === 0) return;

  const snapshots = grids.map(grid => ({
    grid,
    rect: grid.getBoundingClientRect(),
    cards: Array.from(grid.querySelectorAll('.card')).map(card => ({
      card,
      rect: card.getBoundingClientRect()
    }))
  }));

  chaosState.originalStyles.clear();
  chaosState.gridStyles.clear();
  chaosState.cardToGrid.clear();
  chaosState.drags.clear();
  chaosState.grids = new Set(grids);
  chaosState.zIndex = 1000;

  document.body.classList.add('is-chaos');

  snapshots.forEach(({ grid, rect: gridRect, cards }) => {
    chaosState.gridStyles.set(grid, {
      height: grid.style.height,
      minHeight: grid.style.minHeight
    });

    grid.classList.add('is-chaos');
    grid.classList.remove('is-stack');

    let maxBottom = 0;

    cards.forEach(({ card, rect }) => {
      captureCardStyles(card);
      const left = rect.left - gridRect.left;
      const top = rect.top - gridRect.top;
      const jitterX = (Math.random() - 0.5) * 2 * CHAOS_JITTER_RANGE;
      const jitterY = (Math.random() - 0.5) * 2 * CHAOS_JITTER_RANGE;
      const jitteredLeft = Math.max(0, left + jitterX);
      const jitteredTop = Math.max(0, top + jitterY);
      card.style.position = 'absolute';
      card.style.left = `${jitteredLeft}px`;
      card.style.top = `${jitteredTop}px`;
      card.style.width = `${rect.width}px`;
      card.style.height = `${rect.height}px`;
      card.style.zIndex = `${++chaosState.zIndex}`;
      card.style.cursor = 'grab';
      card.classList.add('is-chaos-card');
      chaosState.cardToGrid.set(card, grid);
      maxBottom = Math.max(maxBottom, jitteredTop + rect.height);
    });

    const canvasHeight = Math.max(maxBottom, gridRect.height);
    const heightPx = `${Math.ceil(canvasHeight)}px`;
    grid.style.height = heightPx;
    grid.style.minHeight = heightPx;
  });

  toggle.setAttribute('aria-pressed', 'true');
  toggle.textContent = 'I LOVE HTML';
  chaosState.active = true;
}

function exitChaos(toggle){
  if (!chaosState.active) return;
  chaosState.active = false;

  document.body.classList.remove('is-chaos');
  chaosState.grids.forEach(grid => grid.classList.remove('is-chaos'));

  chaosState.drags.forEach((drag, pointerId) => {
    if (drag.card && drag.card.releasePointerCapture) {
      drag.card.releasePointerCapture(pointerId);
    }
  });
  chaosState.drags.clear();

  chaosState.gridStyles.forEach((styles, grid) => {
    grid.style.height = styles.height || '';
    grid.style.minHeight = styles.minHeight || '';
  });
  chaosState.gridStyles.clear();

  chaosState.originalStyles.forEach((styles, card) => {
    ['position', 'left', 'top', 'width', 'height', 'zIndex', 'cursor'].forEach(prop => {
      card.style[prop] = styles[prop] || '';
    });
    card.classList.remove('is-chaos-card', 'is-dragging');
  });
  chaosState.originalStyles.clear();
  chaosState.cardToGrid.clear();
  chaosState.grids.clear();

  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = 'I HATE HTML';

  requestAnimationFrame(() => scheduleLayoutUpdate());
}

function onChaosPointerDown(event){
  if (!chaosState.active || event.button !== 0) return;

  const card = event.target.closest('.card');
  if (!card || !chaosState.originalStyles.has(card)) return;

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
  event.preventDefault();
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
  const grid = chaosState.cardToGrid.get(card) || card.closest('.grid');
  if (!grid) return;

  const top = parseFloat(card.style.top) || 0;
  const height = card.offsetHeight;
  const bottom = top + height;
  const currentHeight = parseFloat(grid.style.height) || 0;

  if (bottom > currentHeight) {
    const heightPx = `${Math.ceil(bottom)}px`;
    grid.style.height = heightPx;
    grid.style.minHeight = heightPx;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Ensure layout is stabilized before first measurement
  requestAnimationFrame(() => requestAnimationFrame(scheduleLayoutUpdate));

  const grids = Array.from(document.querySelectorAll('.grid'));

  if ('ResizeObserver' in window && !gridResizeObserver) {
    gridResizeObserver = new ResizeObserver(() => scheduleLayoutUpdate());
    grids.forEach(grid => gridResizeObserver.observe(grid));
  }

  grids.forEach(grid => {
    grid.querySelectorAll('img').forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', scheduleLayoutUpdate, { once: true });
      }
    });
  });

  setupChaosToggle();
});

window.addEventListener('load', scheduleLayoutUpdate);
window.addEventListener('resize', scheduleLayoutUpdate);
window.addEventListener('orientationchange', scheduleLayoutUpdate);

document.addEventListener('DOMContentLoaded', initHandOverlays);

function initHandOverlays(){
  const pointerNodes = Array.from(document.querySelectorAll('.hand-overlay__pointer'));
  if (pointerNodes.length === 0) return;

  const hands = pointerNodes.map(createHandModel);
  let pointer = null;
  let raf = 0;

  const prefersReducedMotion = matchMediaSafe('(prefers-reduced-motion: reduce)');
  let motionPaused = prefersReducedMotion ? prefersReducedMotion.matches : false;

  function applyAllRest(){
    hands.forEach(applyRestState);
  }

  function refreshMetrics(){
    hands.forEach(refreshHandMetrics);
    scheduleStep();
  }

  function step(){
    raf = 0;
    if (motionPaused) return;
    hands.forEach(hand => updateHandPointer(hand, pointer));
  }

  function scheduleStep(){
    if (motionPaused) {
      applyAllRest();
      return;
    }
    if (!raf) raf = requestAnimationFrame(step);
  }

  function handlePointerMove(event){
    pointer = { x: event.clientX, y: event.clientY };
    scheduleStep();
  }

  function handlePointerLeave(){
    pointer = null;
    scheduleStep();
  }

  if (prefersReducedMotion) {
    const motionListener = event => {
      motionPaused = event.matches;
      if (motionPaused) {
        pointer = null;
        applyAllRest();
      } else {
        scheduleStep();
      }
    };
    addChangeListener(prefersReducedMotion, motionListener);
  }

  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  window.addEventListener('pointercancel', handlePointerLeave, { passive: true });
  window.addEventListener('resize', refreshMetrics);
  window.addEventListener('orientationchange', refreshMetrics);

  refreshMetrics();
  applyAllRest();
}

function createHandModel(el){
  const style = getComputedStyle(el);
  return {
    el,
    direction: el.closest('.hand-overlay__cluster--right') ? 'right' : 'left',
    rest: {
      rotation: readAngle(style.getPropertyValue('--hand-rest-rotation'), 0),
      translateX: readNumeric(style.getPropertyValue('--hand-rest-translate-x'), 0),
      translateY: readNumeric(style.getPropertyValue('--hand-rest-translate-y'), 0)
    },
    anchor: { x: 0, y: 0 }
  };
}

function refreshHandMetrics(hand){
  const rect = hand.el.getBoundingClientRect();
  const style = getComputedStyle(hand.el);
  const origin = style.transformOrigin.split(' ');
  const originX = parseFloat(origin[0]) || 0;
  const originY = parseFloat(origin[1]) || 0;
  const anchorX = rect.left + originX;
  const anchorY = rect.top + originY;
  hand.anchor.x = anchorX;
  hand.anchor.y = anchorY;
}

const DEG_PER_RAD = 180 / Math.PI;

function updateHandPointer(hand, pointer){
  if (!pointer) {
    applyRestState(hand);
    return;
  }

  const angle = Math.atan2(pointer.y - hand.anchor.y, pointer.x - hand.anchor.x);
  const clamped = clampHandAngle(hand, angle);
  hand.el.style.setProperty('--hand-rotation', `${clamped * DEG_PER_RAD}deg`);
  hand.el.style.setProperty('--hand-translate-x', `${hand.rest.translateX}px`);
  hand.el.style.setProperty('--hand-translate-y', `${hand.rest.translateY}px`);
}

function clampHandAngle(hand, angle){
  const centerDeg = hand.direction === 'left' ? 0 : 180;
  const range = 110; // keeps rotation aiming toward the canvas interior
  const minDeg = centerDeg - range;
  const maxDeg = centerDeg + range;
  const deg = angle * DEG_PER_RAD;
  const clampedDeg = Math.max(minDeg, Math.min(maxDeg, deg));
  return clampedDeg / DEG_PER_RAD;
}

function applyRestState(hand){
  hand.el.style.setProperty('--hand-rotation', `${hand.rest.rotation}deg`);
  hand.el.style.setProperty('--hand-translate-x', `${hand.rest.translateX}px`);
  hand.el.style.setProperty('--hand-translate-y', `${hand.rest.translateY}px`);
}

function readNumeric(value, fallback){
  const num = parseFloat((value || '').trim());
  return Number.isFinite(num) ? num : fallback;
}

function readAngle(value, fallback){
  if (!value) return fallback;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
}

function matchMediaSafe(query){
  if (typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia(query);
  } catch (error) {
    return null;
  }
}

function addChangeListener(mql, listener){
  if (!mql) return;
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', listener);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(listener);
  }
}
