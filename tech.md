# Technology & Patterns

## Stack Summary
- **HTML5**: Landed in `index.html` with semantic `<section>` and `<article>` usage, ARIA labelling for hidden headings, and `data-*` attributes to store dynamic metadata.
- **CSS3**: Author-level styles in `style.css` leveraging custom properties, Flexbox, logical properties, `aspect-ratio`, and prefers-reduced-motion media queries. Fonts sourced from Google Fonts (Space Grotesk primary, Nunito/Quicksand support).
- **Vanilla JavaScript (ES2018+)**: Runs client-side enhancements via DOM APIs, `Intl.DateTimeFormat`, `requestAnimationFrame`, `ResizeObserver`, and Pointer Events.
- **Static assets**: PNG logos and illustrative hands located under `assets/`; no runtime optimization pipeline.

## Integration Points & Dependencies
- **External services**: Google Fonts CDN and a remote custom cursor asset referenced in CSS.
- **Browser APIs**: Relies on Pointer Events and ResizeObserver support; feature detection implemented with fallbacks (e.g., bail when API missing).
- **No third-party libraries**: No bundler, transpiler, or package manager; deployable to any static host (GitHub Pages, Netlify drop-in, S3, etc.).

## Architectural Patterns
- **Progressive enhancement**: Content remains accessible without JS; enhancements (weekday labels, chaos mode) layer on top.
- **Functional decomposition**: Distinct helper functions for layout measurement, chaos state management, and hand animation; avoids global namespace pollution except for intentionally scoped state objects.
- **State snapshotting**: Chaos engine caches original inline styles in `chaosState.cache` before mutation, enabling reversible toggles.
- **Event-driven updates**: `ResizeObserver`, `pointermove`, and button `click` events orchestrate dynamic behaviors.
- **CSS Variable binding**: JavaScript writes to CSS custom properties for performant transform updates instead of manipulating inline transforms directly.

## Performance Considerations
- **Animation throttling**: Layout recalculations run inside `requestAnimationFrame` and `setTimeout` debouncing to avoid layout thrash.
- **Asset weight**: Hand PNGs (multiple 100–200px files) and dual logos should remain optimized; lacking lazy-loading so overall page weight should be monitored.
- **Reflow hotspots**: Chaos mode toggles `position:absolute` and sets inline transforms; dragging invokes style recalculation but limited to active element.
- **Font loading**: Three font families requested; consider `font-display: swap` in CSS for better perceived performance.

## Accessibility & Internationalization
- **Reduced motion**: Hand animation disabled when `prefers-reduced-motion` matches true.
- **Focus management**: `.icon-button` and toggle button maintain visible focus states via CSS outlines.
- **Localization hooks**: Date formatter uses browser locale for weekday abbreviation, enabling automatic localization. All copy currently English; translation would require duplicating markup text nodes.
- **Assistive semantics**: Hidden headings ensure screen readers can navigate sections; icon buttons carry descriptive `aria-label`s.

## Testing & Tooling Status
- **Automated tests**: None present; regression testing manual.
- **Linting/formatting**: No ESLint/Prettier/Stylelint configured; maintainers must enforce conventions manually.
- **Build pipeline**: Absent—changes ship directly as static assets.

## Deployment & Hosting Assumptions
- Designed for distribution as a single directory; root-relative paths avoided to ease subdirectory hosting.
- Requires HTTPS for font/CDN resources; offline mirror would need fonts bundled locally and cursor asset mirrored or replaced.
- Cache strategy unspecified; rely on host defaults (Netlify/GitHub Pages typically set long-lived caching for assets).

## Known Limitations & Risks
- **Pointer Events fallback**: Older browsers without Pointer Events will not support chaos dragging; consider mouse/touch alternative handlers if needed.
- **ResizeObserver absence**: In browsers lacking ResizeObserver, layout fallback may not reflow elegantly; script guards but grid stacking may be stale.
- **Chaos state persistence**: Layout snapshot is not stored between sessions; toggling reload resets. Acceptable but notable for repeat visitors.
- **Error handling**: Logo fallback covers image load errors; other asset failures (hand PNGs, fonts) show as invisible elements without messaging.
- **Security**: No user input, so XSS surface minimal; ensure all outbound links use `rel="noreferrer"` if privacy required.
