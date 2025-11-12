/** [F1] Bootstraps weekday badges for elements declaring ISO dates. */
function initDateBadges(){
  const targets = [];
  const legacy = document.getElementById('date-value');
  if (legacy) targets.push(legacy);
  targets.push(...document.querySelectorAll('.js-date, time[datetime]'));

  targets.forEach(el => {
    const iso =
      el.getAttribute('data-date') ||
      (el.tagName === 'TIME' ? el.getAttribute('datetime') : null);
    if (!iso) return;

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!match) return;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(parsed.getTime())) return;

    const weekday = WEEKDAYS[parsed.getUTCDay()];
    const dowEl = el.querySelector('.dow');
    if (dowEl) dowEl.textContent = `(${weekday})`;
  });
}

/** [C1] Abbreviated weekday names used by {@link initDateBadges}. */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

document.addEventListener('DOMContentLoaded', initDateBadges);

/** [F2] Ensures a fallback block is shown whenever logos fail to load. */
function setupLogoFallbacks(){
  document.querySelectorAll('.js-logo').forEach(logo => {
    const wrap = logo.closest('.logo-wrap');
    const fallback = wrap ? wrap.querySelector('.logo-fallback') : null;
    if (!fallback) return;

    const toggleFallback = show => {
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

/** [S1] Internal flag preventing redundant layout recalculations. */
let rafScheduled = false;

/** [F3] Debounces expensive grid layout calculations with rAF. */
function scheduleLayoutUpdate(){
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    updateAllGridLayouts();
    rafScheduled = false;
  });
}

/** [F4] Clusters grid items that share the same vertical offset. */
function groupRowsByOffsetTop(items){
  const rows = new Map();
  items.forEach(el => {
    const top = el.offsetTop;
    if (!rows.has(top)) rows.set(top, []);
    rows.get(top).push(el);
  });
  return rows;
}

/** [C2] Maximum chaos jitter distance for draggable cards. */
const CHAOS_JITTER_RANGE = 24;

/** [S2] Mutable state backing chaos mode interactions. */
const chaosState = {
  active: false,
  originalStyles: new Map(),
  drags: new Map(),
  zIndex: 1000,
  gridStyles: new Map(),
  grids: new Set(),
  cardToGrid: new Map()
};

/** [S3] Lazily created ResizeObserver shared across grids. */
let gridResizeObserver = null;

/** [F5] Reads the CSS custom property representing card width limit. */
function getCardMaxWidth(){
  const root = getComputedStyle(document.documentElement);
  const value = parseFloat(root.getPropertyValue('--card-max'));
  return Number.isFinite(value) ? value : 480;
}

/** [F6] Applies responsive stacking classes across all grids. */
function updateAllGridLayouts(){
  if (chaosState.active) return;
  document.querySelectorAll('.grid').forEach(grid => {
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

/** [F7] Wires chaos mode toggle and pointer listeners. */
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

/** [F8] Collects grids that contain draggable cards. */
function getChaosGrids(){
  return Array.from(document.querySelectorAll('.grid')).filter(grid => grid.querySelector('.card'));
}

/** [F9] Saves inline styles prior to chaos mode mutation. */
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

/** [F10] Activates chaos mode, converting grids to draggable canvases. */
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

/** [F11] Restores original grid layout and pointer bindings. */
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

/** [F12] Begins tracking a pointer drag in chaos mode. */
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

/** [F13] Updates a dragged card's position on pointer move. */
function onChaosPointerMove(event){
  const drag = chaosState.drags.get(event.pointerId);
  if (!drag) return;

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  drag.card.style.left = `${drag.baseLeft + dx}px`;
  drag.card.style.top = `${drag.baseTop + dy}px`;

  updateChaosBounds(drag.card);
}

/** [F14] Finalizes a drag interaction and cleans up state. */
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

/** [F15] Extends chaos grid bounds whenever a card moves beyond limits. */
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

/** [F16] Animates illustrated hands so they follow the user's pointer. */
function initHandOverlays(){
  const pointerNodes = Array.from(document.querySelectorAll('.hand-overlay__pointer'));
  if (pointerNodes.length === 0) return;

  const hands = pointerNodes.map(createHandModel);
  let pointer = null;
  let raf = 0;

  const prefersReducedMotion = matchMediaSafe('(prefers-reduced-motion: reduce)');
  let motionPaused = prefersReducedMotion ? prefersReducedMotion.matches : false;

  const applyAllRest = () => {
    hands.forEach(applyRestState);
  };

  const refreshMetrics = () => {
    hands.forEach(hand => {
      applyRestState(hand);
      refreshHandMetrics(hand);
    });
    scheduleStep();
  };

  const step = () => {
    raf = 0;
    if (motionPaused) return;
    hands.forEach(hand => updateHandPointer(hand, pointer));
  };

  const scheduleStep = () => {
    if (motionPaused) {
      applyAllRest();
      return;
    }
    if (!raf) raf = requestAnimationFrame(step);
  };

  const handlePointerMove = event => {
    pointer = { x: event.clientX, y: event.clientY };
    scheduleStep();
  };

  const handlePointerLeave = () => {
    pointer = null;
    scheduleStep();
  };

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

/** [F17] Builds an interactive hand model from DOM state. */
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

/** [F18] Updates hand anchor coordinates based on layout metrics. */
function refreshHandMetrics(hand){
  const rect = hand.el.getBoundingClientRect();
  const style = getComputedStyle(hand.el);
  const originParts = style.transformOrigin.split(' ');
  const computedOriginX = readOriginValue(originParts[0], rect.width, rect.width * 0.82);
  const computedOriginY = readOriginValue(originParts[1], rect.height, rect.height * 0.46);
  const originInline = style.getPropertyValue('--hand-origin-inline');
  const originBlock = style.getPropertyValue('--hand-origin-block');
  const originX = readOriginValue(originInline, rect.width, computedOriginX);
  const originY = readOriginValue(originBlock, rect.height, computedOriginY);
  hand.anchor.x = rect.left + originX;
  hand.anchor.y = rect.top + originY;
}

/** [C3] Degrees represented by a single radian, used for conversion. */
const DEG_PER_RAD = 180 / Math.PI;

/** [F19] Rotates a hand toward the pointer while respecting constraints. */
function updateHandPointer(hand, pointer){
  if (!pointer) {
    applyRestState(hand);
    return;
  }

  const angle = Math.atan2(pointer.y - hand.anchor.y, pointer.x - hand.anchor.x);
  const clampedDeg = clampHandAngle(hand, angle);
  hand.el.style.setProperty('--hand-rotation', `${clampedDeg}deg`);
  hand.el.style.setProperty('--hand-translate-x', `${hand.rest.translateX}px`);
  hand.el.style.setProperty('--hand-translate-y', `${hand.rest.translateY}px`);
}

/** [F20] Limits hand rotation so illustrations remain readable. */
function clampHandAngle(hand, angle){
  const centerDeg = hand.direction === 'left' ? 0 : 180;
  const range = 110;
  const rawDeg = angle * DEG_PER_RAD;
  const delta = normalizeAngleDeg(rawDeg - centerDeg);
  const clampedDelta = Math.max(-range, Math.min(range, delta));
  return centerDeg + clampedDelta;
}

/** [F21] Restores a hand element to its resting transform. */
function applyRestState(hand){
  hand.el.style.setProperty('--hand-rotation', `${hand.rest.rotation}deg`);
  hand.el.style.setProperty('--hand-translate-x', `${hand.rest.translateX}px`);
  hand.el.style.setProperty('--hand-translate-y', `${hand.rest.translateY}px`);
}

/** [F22] Parses origin values expressed as px or percentages. */
function readOriginValue(value, size, fallback){
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.endsWith('%')) {
    const pct = parseFloat(trimmed.slice(0, -1));
    if (Number.isFinite(pct)) {
      return (pct / 100) * size;
    }
    return fallback;
  }
  const num = parseFloat(trimmed);
  return Number.isFinite(num) ? num : fallback;
}

/** [F23] Safely converts numeric-like CSS values to floats. */
function readNumeric(value, fallback){
  const num = parseFloat((value || '').trim());
  return Number.isFinite(num) ? num : fallback;
}

/** [F24] Extracts a numeric angle, falling back when parsing fails. */
function readAngle(value, fallback){
  if (!value) return fallback;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
}

/** [F25] Normalizes angles to the range [-180, 180]. */
function normalizeAngleDeg(value){
  let deg = value % 360;
  if (deg > 180) deg -= 360;
  if (deg < -180) deg += 360;
  return deg;
}

/** [F26] Guards against unsupported matchMedia environments. */
function matchMediaSafe(query){
  if (typeof window.matchMedia !== 'function') return null;
  try {
    return window.matchMedia(query);
  } catch (error) {
    return null;
  }
}

/** [F27] Adds a change listener that supports legacy APIs. */
function addChangeListener(mql, listener){
  if (!mql) return;
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', listener);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(listener);
  }
}
