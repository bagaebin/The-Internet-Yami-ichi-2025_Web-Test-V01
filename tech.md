# Technology & Patterns

## Stack Summary
- **HTML5**: Semantic structure with accessibility considerations (ARIA labels, visually hidden headings).
- **CSS3**: Custom properties, Flexbox, aspect-ratio, prefers-reduced-motion media query, Google Fonts integration.
- **JavaScript (Vanilla ES6+)**: DOM APIs, `requestAnimationFrame`, `ResizeObserver`, Pointer Events, `matchMedia` with graceful fallback.
- **Assets**: Static PNG images for logos and decorative hands under `assets/`.

## Key Patterns
- **Progressive enhancement**: Core content rendered in HTML; scripts augment interactivity (weekday labels, chaos mode, hand tracking).
- **Feature detection**: Checks for `ResizeObserver`, pointer capture, `matchMedia` before usage.
- **State encapsulation**: `chaosState` object persists layout/drag state and snapshots for toggling modes.
- **Animation throttling**: Layout updates batched via `requestAnimationFrame` to avoid thrashing.
- **CSS variable binding**: JS writes to `--hand-rotation` and translation custom properties for smooth hardware-accelerated transforms.

## Technical Constraints & Considerations
- Static hosting environment (no build tooling) implies assets must be optimized manually and scripts remain self-contained.
- Pointer Events required for drag interactions; fallback behavior unspecified (touch/mouse supported via Pointer Events).
- Chaos mode relies on absolute positioning and inline styles; resizing while active is not recalculated until manual drag or exit.
- Hand overlay visuals assume available PNG assets sized <= 240px; missing assets would leave empty decorative layer.
- Reduced motion preference halts hand animation; system respects user settings via `prefers-reduced-motion`.
- Custom cursor references remote URL; offline usage depends on external resource availability.
