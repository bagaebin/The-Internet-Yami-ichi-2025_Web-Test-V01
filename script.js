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

function clampNumber(value, min, max){
  return Math.min(Math.max(value, min), max);
}

document.addEventListener('DOMContentLoaded', initDateBadges);
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('is-landing-active');
});

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
const CHAOS_JITTER_RANGE = 16;

/** [S2] Mutable state backing chaos mode interactions. */
const chaosState = {
  active: false,
  originalStyles: new Map(),
  drags: new Map(),
  zIndex: 1000,
  gridStyles: new Map(),
  grids: new Set(),
  entityToGrid: new Map()
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
    const cards = getDirectCards(grid);
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
  return Array.from(document.querySelectorAll('.grid')).filter(grid => getDirectCards(grid).length > 0);
}

/** [F8a] Returns only the direct child cards of a grid element. */
function getDirectCards(grid){
  return Array.from(grid.children).filter(child => child.classList && child.classList.contains('card'));
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
    cursor: card.style.cursor,
    overflow: card.style.overflow
  });
}

/** [F10] Activates chaos mode, converting grids to draggable canvases. */
function enterChaos(toggle){
  const grids = getChaosGrids();
  if (grids.length === 0) return;

  const snapshots = grids.map(grid => ({
    grid,
    rect: grid.getBoundingClientRect(),
    cards: getDirectCards(grid).map(card => ({
      card,
      rect: card.getBoundingClientRect(),
      gallery: Array.from(card.querySelectorAll('.card-gallery__item')).map(item => ({
        item,
        rect: item.getBoundingClientRect()
      }))
    }))
  }));

  chaosState.originalStyles.clear();
  chaosState.gridStyles.clear();
  chaosState.entityToGrid.clear();
  chaosState.drags.clear();
  chaosState.grids = new Set(grids);
  chaosState.zIndex = 1000;

  document.body.classList.add('is-chaos');

  snapshots.forEach(({ grid, rect: gridRect, cards }) => {
    chaosState.gridStyles.set(grid, {
      height: grid.style.height,
      minHeight: grid.style.minHeight,
      maxHeight: grid.style.maxHeight,
      position: grid.style.position,
      overflow: grid.style.overflow,
      display: grid.style.display
    });

    grid.classList.add('is-chaos');
    grid.classList.remove('is-stack');
    grid.style.position = 'relative';
    grid.style.overflow = 'visible';
    grid.style.display = 'block';

    let maxBottom = 0;

    cards.forEach(({ card, rect, gallery }) => {
      captureCardStyles(card);
      const galleryContainer = card.querySelector('.card-gallery');
      const galleryRect = galleryContainer ? galleryContainer.getBoundingClientRect() : null;
      if (galleryContainer && galleryRect) {
        captureCardStyles(galleryContainer);
        const galleryHeight = `${galleryRect.height}px`;
        galleryContainer.style.height = galleryHeight;
        galleryContainer.style.minHeight = galleryHeight;
      }
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
      card.style.overflow = 'visible';
      card.classList.add('is-chaos-card', 'chaos-draggable', 'is-chaos-entity');
      chaosState.entityToGrid.set(card, grid);
      maxBottom = Math.max(maxBottom, jitteredTop + rect.height);

      const firstItemRect = gallery.length > 0 ? gallery[0].rect : null;
      const firstOffsetLeft = firstItemRect ? firstItemRect.left - rect.left : null;
      const firstOffsetTop = firstItemRect ? firstItemRect.top - rect.top : null;

      const clampHeight = galleryRect ? galleryRect.height : rect.height;

      gallery.forEach(({ item, rect: itemRect }) => {
        captureCardStyles(item);
        const baseLeft = firstOffsetLeft !== null
          ? jitteredLeft + firstOffsetLeft
          : jitteredLeft + (itemRect.left - rect.left);
        const baseTop = firstOffsetTop !== null
          ? jitteredTop + firstOffsetTop
          : jitteredTop + (itemRect.top - rect.top);
        const angle = Math.random() * Math.PI * 2;
        const cardLongSide = Math.max(rect.width, rect.height);
        const maxOffset = clampNumber(cardLongSide * 0.1, 8, 16);
        const minOffset = clampNumber(maxOffset * 0.6, 6, maxOffset);
        const distance = minOffset + Math.random() * (maxOffset - minOffset);
        const offsetX = distance * Math.cos(angle);
        const offsetY = distance * Math.sin(angle) * 0.6 - itemRect.height * 0.18;

        const anchorLeft = jitteredLeft;
        const anchorTop = jitteredTop;
        const tetherMargin = clampNumber(cardLongSide * 0.12, 10, 22);
        const minX = Math.max(0, anchorLeft - tetherMargin);
        const minY = Math.max(0, anchorTop - tetherMargin);
        const maxX = Math.max(minX, Math.min(gridRect.width - itemRect.width, anchorLeft + rect.width + tetherMargin - itemRect.width));
        const maxY = Math.max(minY, anchorTop + clampHeight + tetherMargin - itemRect.height);

        const finalLeft = clampNumber(baseLeft + offsetX, minX, maxX);
        const finalTop = clampNumber(baseTop + offsetY, minY, maxY);

        item.style.position = 'absolute';
        item.style.left = `${finalLeft}px`;
        item.style.top = `${finalTop}px`;
        item.style.width = `${itemRect.width}px`;
        item.style.height = `${itemRect.height}px`;
        item.style.zIndex = `${++chaosState.zIndex}`;
        item.style.cursor = 'grab';
        item.style.touchAction = 'none';
        item.style.pointerEvents = 'auto';
        item.style.overflow = 'visible';
        item.classList.add('is-chaos-gallery', 'chaos-draggable', 'is-chaos-entity');
        chaosState.entityToGrid.set(item, grid);
        maxBottom = Math.max(maxBottom, finalTop + itemRect.height);
      });
    });

    const canvasHeight = Math.max(maxBottom, gridRect.height);
    const heightPx = `${Math.ceil(canvasHeight)}px`;
    grid.style.height = heightPx;
    grid.style.minHeight = heightPx;
    grid.style.maxHeight = heightPx;
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
    if (drag.node && drag.node.releasePointerCapture) {
      drag.node.releasePointerCapture(pointerId);
    }
  });
  chaosState.drags.clear();

  chaosState.gridStyles.forEach((styles, grid) => {
    grid.style.height = styles.height || '';
    grid.style.minHeight = styles.minHeight || '';
    grid.style.maxHeight = styles.maxHeight || '';
    grid.style.position = styles.position || '';
    grid.style.overflow = styles.overflow || '';
    grid.style.display = styles.display || '';
  });
  chaosState.gridStyles.clear();

  chaosState.originalStyles.forEach((styles, card) => {
    ['position', 'left', 'top', 'width', 'height', 'zIndex', 'cursor', 'overflow'].forEach(prop => {
      card.style[prop] = styles[prop] || '';
    });
    card.classList.remove('is-chaos-card', 'is-chaos-gallery', 'chaos-draggable', 'is-chaos-entity', 'is-dragging');
  });
  chaosState.originalStyles.clear();
  chaosState.entityToGrid.clear();
  chaosState.grids.clear();

  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = 'I HATE HTML';

  requestAnimationFrame(() => scheduleLayoutUpdate());
}

/** [F12] Begins tracking a pointer drag in chaos mode. */
function onChaosPointerDown(event){
  if (!chaosState.active || event.button !== 0) return;

  const node = event.target.closest('.chaos-draggable');
  if (!node || !chaosState.originalStyles.has(node)) return;

  const baseLeft = parseFloat(node.style.left) || 0;
  const baseTop = parseFloat(node.style.top) || 0;

  if (node.setPointerCapture) {
    node.setPointerCapture(event.pointerId);
  }

  chaosState.drags.set(event.pointerId, {
    node,
    startX: event.clientX,
    startY: event.clientY,
    baseLeft,
    baseTop
  });

  node.classList.add('is-dragging');
  node.style.cursor = 'grabbing';
  node.style.zIndex = `${++chaosState.zIndex}`;
  event.preventDefault();
}

/** [F13] Updates a dragged card's position on pointer move. */
function onChaosPointerMove(event){
  const drag = chaosState.drags.get(event.pointerId);
  if (!drag) return;

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  drag.node.style.left = `${drag.baseLeft + dx}px`;
  drag.node.style.top = `${drag.baseTop + dy}px`;

  updateChaosBounds(drag.node);
}

/** [F14] Finalizes a drag interaction and cleans up state. */
function onChaosPointerEnd(event){
  const drag = chaosState.drags.get(event.pointerId);
  if (!drag) return;

  if (drag.node.releasePointerCapture) {
    drag.node.releasePointerCapture(event.pointerId);
  }

  drag.node.classList.remove('is-dragging');
  drag.node.style.cursor = 'grab';

  chaosState.drags.delete(event.pointerId);
}

/** [F15] Extends chaos grid bounds whenever a card moves beyond limits. */
function updateChaosBounds(card){
  const grid = chaosState.entityToGrid.get(card) || card.closest('.grid');
  if (!grid) return;
  grid.style.overflow = 'visible';
}

/** [F29] Calculates orbit radius and center logo sizing to avoid overlap. */
function computeOrbitLayout(){
  const centerLogo = document.querySelector('.logo-center__image');
  const orbitItems = Array.from(document.querySelectorAll('.orbit-item'));
  if (!centerLogo || orbitItems.length === 0) return;

  const centerRect = centerLogo.getBoundingClientRect();
  const largestOrbit = orbitItems.reduce((max, item) => {
    const rect = item.getBoundingClientRect();
    return Math.max(max, rect.width || rect.height || 0);
  }, 0) || centerRect.width * 0.4;

  const viewportShort = Math.min(window.innerWidth, window.innerHeight);
  const isPortrait = window.innerHeight > window.innerWidth;
  const baseGap = Math.max(24, centerRect.width * 0.08, viewportShort * 0.03);
  const radiusFromSizes = centerRect.width / 2 + largestOrbit / 2 + baseGap;
  const portraitBoost = isPortrait ? Math.max(baseGap, centerRect.height * 0.12) : 0;
  const radius = clampNumber(radiusFromSizes + portraitBoost, 180, viewportShort * 0.6);

  const centerMax = isPortrait
    ? Math.min(480, window.innerWidth * 0.8, window.innerHeight * 0.42)
    : Math.min(520, window.innerWidth * 0.82, window.innerHeight * 0.5);

  document.documentElement.style.setProperty('--orbit-radius', `${radius}px`);
  document.documentElement.style.setProperty('--center-logo-max', `${centerMax}px`);
}

/** [F30] Wires responsive observers for orbit sizing. */
function initLandingOrbit(){
  const recompute = () => requestAnimationFrame(() => computeOrbitLayout());
  recompute();

  ['resize', 'orientationchange'].forEach(eventName => {
    window.addEventListener(eventName, recompute);
  });

  const centerLogo = document.querySelector('.logo-center__image');
  if (centerLogo && !centerLogo.complete) {
    centerLogo.addEventListener('load', recompute, { once: true });
  }
}

/** [F31] Ensures landing orbit cards open their partner links even when wrappers intercept clicks. */
function enableLandingOrbitLinks(){
  document.querySelectorAll('.logo-orbit .landing-card').forEach(card => {
    const link = card.querySelector('.logo-link');
    if (!link || !link.href) return;

    card.classList.add('landing-card--linkable');

    card.addEventListener('click', event => {
      if (event.defaultPrevented) return;
      if (event.target.closest('a')) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      const target = link.target && link.target.trim() ? link.target : '_blank';
      window.open(link.href, target, 'noopener,noreferrer');
    });
  });
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

  initLandingOrbit();
  enableLandingOrbitLinks();
  setupChaosToggle();
});

window.addEventListener('load', scheduleLayoutUpdate);
window.addEventListener('resize', scheduleLayoutUpdate);
window.addEventListener('orientationchange', scheduleLayoutUpdate);

/** [F28] Handles navigation from landing page to main content */
function showMainContent(event) {
  event.preventDefault();
  const landingPage = document.querySelector('.landing-page');
  const mainContent = document.querySelector('.main-content');
  const footer = document.querySelector('.site-footer');
  const footerGrid = document.querySelector('.grid--footer');
  const hateHtmlButton = document.getElementById('hate-html-toggle');

  if (landingPage) landingPage.classList.add('is-hidden');
  if (mainContent) mainContent.classList.remove('is-hidden');
  if (footer) footer.classList.remove('is-hidden');
  if (footerGrid) footerGrid.classList.remove('is-hidden');
  if (hateHtmlButton) hateHtmlButton.classList.remove('is-hidden');
  document.body.classList.remove('is-landing-active');
  
  // Scroll to top of main content
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Trigger layout update for the main content
  requestAnimationFrame(() => {
    scheduleLayoutUpdate();
  });
}

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
