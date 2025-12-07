# Structure Overview

## High-level Architecture
- **Static single-page application** served as raw HTML/CSS/JS without build tooling or bundlers.
- `index.html` is the sole entry document; it links `style.css` and `script.js` and inlines no critical styles.
- Decorative and branding assets live in `assets/`; subdirectories separate logos from hand overlays to simplify swaps.
- JavaScript executes after DOMContentLoaded, progressively enhancing the baseline semantic markup.
- The landing hero now treats partner logos, date, and venue chips as orbiting "pop-up" cards that animate around the central logo.

## DOM Topology
### Global Regions
1. `<header class="site-header bevel">` – introduces the event name.
2. `.hand-overlay` – fixed-position layer containing two clusters (`--left`, `--right`) of pointer images that track pointer movement.
3. `<main class="wrap">` – houses three semantically grouped `section.grid` collections.
4. `<footer class="site-footer bevel">` – retains attribution copy.
5. `#hate-html-toggle` – floating action button that toggles chaos mode.

### Section Breakdown
| Section | Purpose | Key children |
| `.grid--branding` | Showcase primary and alternate logos with image fallback layers. | Two `.card--logo` articles each wrapping `.logo-wrap` with `.js-logo` image and `.logo-fallback` div. |
| `.grid--venue` | Communicate venue address, event date (with weekday), and opening hours. | `.card--wide` for address text, `.card` with `#date-value[data-date]` for date auto-labeling, `.card` for time range. |
| `.grid--artists` | Introduce the artist roster and individual bios. | `.card--section` for intro copy, multiple `.card--profile` entries containing heading, blurb, and `.card-actions` icon buttons. |
| `.logo-orbit` | Landing-only radial cluster that spins partner logos plus venue/time chips. | Multiple `.orbit-item` nodes that host `.card` wrappers; some spin clockwise, others counter-clockwise for visual variety. |

### Component Contracts
- **Cards (`.card`, variants)**
  - Accept child content slots (`.card-title`, `.card-text`, `.card-actions`).
  - Provide bevel styling via shared `.bevel` class and rely on CSS variables for background/edge colors.
  - Event cards can opt into a **gallery layout** that splits the card into two equal-width columns: left text stack and right media rail. These cards expand their max width to double the standard card to preserve breathing room for both columns, while the gallery column caps its height and enables vertical scrolling when multiple images are present.
  - **Grids (`.grid`, modifiers)**
  - Flexbox containers toggling between row and column layouts (`.is-stack`) based on viewport height/width heuristics.
  - When `body.is-chaos` is active, grids gain `.is-chaos` class enabling absolute-positioned children while preserving min-height.
- **Logo wrap (`.logo-wrap--card`)**
  - Contains an image and fallback text. JavaScript toggles `.is-visible` on `.logo-fallback` if an image load fails.
- **Chaos toggle (`#hate-html-toggle`)**
  - Floating button anchored bottom-right; script attaches click handler to flip layout state.
- **Hand overlay**
  - Each `img.hand-overlay__pointer` registers anchor coordinates and transforms via CSS custom properties.
- **Landing orbit system**
  - Reads viewport ratio to size the central logo and assign an `--orbit-radius` custom property so orbiting cards never occlude the centerpiece.
  - Textual chips (date and "FOCUS Arnhem") share the same pop-from-center motion as logos and join the rotation around the center.

## JavaScript System (`script.js`)
### Module Layout
1. **Utility hooks**
   - `ready(fn)` registers DOMContentLoaded listener.
   - `createLogoFallback(image)` binds error handlers for logos.
2. **Date enhancer**
   - Uses `Intl.DateTimeFormat` to derive weekday label from `data-date` or `<time datetime>` attributes and injects `<span class="dow">` content.
3. **Responsive layout manager**
   - Calculates row count for each `.grid` via `getComputedStyle` and toggles `.is-stack` class when cards wrap to multiple lines.
   - Deploys `ResizeObserver` for grids and listens to `window` resize/orientationchange.
4. **Chaos mode engine**
   - Maintains `chaosState` snapshot of original inline styles and transform offsets.
   - On activation, applies `position:absolute` with randomized translation offsets, updates z-index on drag start, and restores on exit. Grids switch to `position:relative` canvases so drags never push siblings.
   - Pointer event handlers (`pointerdown`, `pointermove`, `pointerup/cancel`) enable dragging with pointer capture, honoring `touch-action:none` styles.
5. **Hand overlay controller**
  - Pre-computes anchor metadata (bounding rect, rest rotation) for each pointer image.
  - On pointer move, computes vector toward cursor and updates CSS variables (`--hand-rotate`, `--hand-translate-x/y`).
  - Respects `prefers-reduced-motion` by short-circuiting listeners when matched.
6. **Chaos draggables layer**
  - Expands chaos mode beyond cards to include gallery images inside event cards. On activation, gallery tiles pop outward from their host cards with slight jitter and gain independent drag handles. Both cards and gallery tiles bump to the frontmost z-index when clicked or dragged, preventing occlusion while users rearrange the layout.

### Lifecycle Timeline
1. **DOMContentLoaded**: ready handler runs date enhancer, logo fallback attachments, hand controller initialization, chaos toggle wiring, and initial layout measurement.
2. **Window load**: layout manager re-evaluates to account for late-loading assets.
3. **Resize/orientation**: layout manager recalculates stack state, hand controller refreshes anchors.
4. **User interactions**:
   - Clicking toggle triggers chaos engine state switch.
   - Dragging chaos cards updates inline transforms.
   - Pointer move updates hand overlay transforms when animations permitted.

## CSS Organization (`style.css`)
### File Sections
1. **Foundations**: CSS custom property definitions for palette, spacing, bevel depth, motion durations.
2. **Resets & Typography**: Normalize styles, assign `Space Grotesk`, `Nunito`, `Quicksand` fallback stack, configure base font sizing.
3. **Layout & Containers**: `.wrap`, `.grid`, `.site-header/footer`, `.hand-overlay` structural rules.
4. **Components**: `.card` family, `.icon-button`, `.logo-wrap`, `.card-actions` alignment.
5. **State Modifiers**: `.is-stack`, `.is-chaos`, `.is-chaos-card`, focus-visible handling.
6. **Animations & Effects**: Bevel pseudo-elements, transition timings, pointer hover states.

### Token & Responsive Strategy
- Root variables drive theme (e.g., `--bg`, `--fg`, `--accent`).
- Media queries: prefers-reduced-motion, max-width breakpoints for stacking logic, pointer-coarse adjustments.
- Chaos mode adjusts cursor to custom URL and applies high-contrast background to maintain readability.

## Data Sources & Content Mapping
- Date string stored in `data-date` attribute within `index.html`; script derives weekday for localization without server calls.
- Artist bios and links are static in markup; no runtime fetching.
- Asset paths are relative, enabling deployment under the same directory without routing concerns.

## Observability Hooks
- No analytics instrumentation included; to add telemetry, hook into chaos toggle or pointer handlers.
- Console logging is absent by default, keeping production output clean.
