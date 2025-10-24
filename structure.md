# Structure Overview

## High-level Architecture
- Static single-page site served as plain HTML with linked CSS and JavaScript.
- `index.html` is the main document orchestrating layout and content.
- Assets (images, icons) live under `assets/`, referenced directly by the markup.

## DOM Structure
- `<header class="site-header bevel">` containing the event title.
- `.hand-overlay` fixed-position layer with left/right clusters of pointer images positioned underneath interactive content.
- `<main class="wrap">` containing three grid sections:
  - `.grid--branding`: cards displaying logos.
  - `.grid--venue`: cards for venue location, date, time.
  - `.grid--artists`: intro card plus artist profile cards with action links.
- `<footer class="site-footer bevel">` for legal copy.
- `#hate-html-toggle` floating button enabling "chaos" mode.

## Component Responsibilities
- **Cards (`.card` variants)**: Present discrete content blocks, styled with bevel effect.
- **Grids (`.grid` variants)**: Flexbox containers managing responsive arrangement of cards; toggled between normal, stacked, and chaos layouts by JS.
- **Hand overlay**: Decorative layer reacting to pointer movement via script-controlled CSS custom properties.
- **Chaos mode toggle (`#hate-html-toggle`)**: Button that switches between tidy layout and draggable absolute-positioned cards.

## JavaScript Modules (script.js)
- Date enhancement: On DOM ready, populates weekday labels for elements with `data-date` or `<time>` attributes.
- Logo fallback handling: Replaces broken/missing logos with text fallback layer.
- Layout management:
  - Measures grid rows to decide when to apply `.is-stack` class (single-column layout for narrow viewports).
  - Schedules layout recalculations via `requestAnimationFrame` and listens to resize/orientation/load events.
- Chaos mode system:
  - Captures original inline styles before activating.
  - Applies absolute positioning with random jitter, enables dragging via Pointer Events, and ensures grid containers expand to fit moved cards.
  - Restores original styles when toggled off.
- Hand overlay controller:
  - Builds hand model metadata (rest transforms, anchors).
  - Tracks pointer movement to rotate hands toward cursor unless reduced-motion preference is active.
  - Responds to viewport changes to refresh anchor positions.

## CSS Organization (style.css)
- Root custom properties defining color palette and sizing.
- Global resets and typography settings using Google Fonts (Space Grotesk).
- Layout styles for wrappers, header/footer, grids, cards, and interactive elements.
- Bevel effect mixin applied via `.bevel` class.
- Styles for chaos mode (`body.is-chaos`, `.grid.is-chaos`, `.card.is-chaos-card`).
- Hand overlay positioning and transform defaults using CSS variables for runtime control.
