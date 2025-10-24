# Product Notes

## Business Context
- **Event positioning**: Promotes *The Internet Yami-ichi Arnhem 2025*, a playful marketplace for internet-inspired art and experiences.
- **Brand tone**: Irreverent, experimental, nostalgic for early web aesthetics while celebrating contemporary creative tech.
- **Stakeholders**: Organizing collective, participating artists, potential attendees, and sponsors seeking visibility.
- **Value proposition**: Provide essential logistical details while immersing visitors in the event's chaotic, net-art spirit.

## Target Audiences
| Persona | Goals | Needs from site |
| --- | --- | --- |
| Local visitors & tourists | Decide whether to attend; note date, time, location. | Clear schedule, map-ready address, sense of vibe. |
| Artists & collaborators | Validate inclusion, share with networks. | Personal bios, outbound links, visually rich presentation. |
| Sponsors/press | Assess brand alignment, capture highlights quickly. | Immediate access to logos, succinct event summary, unique differentiators. |

## Existing Features
- **Event overview**: Prominent header and venue section outlining address, date (with JS-generated weekday), and hours.
- **Brand assets**: Dual logo presentation ensures press-ready visuals; fallback text ensures resilience.
- **Artist roster**: Six artist cards with micro-bios and icon buttons linking to external profiles (placeholder URLs currently).
- **Interactive chaos mode**: "I HATE HTML" toggle introduces draggable, randomized layout reinforcing experiential theme.
- **Animated hand overlay**: Cursor-tracking hands create kinetic energy; respects reduced-motion users.
- **Accessibility affordances**: Visually hidden headings, focus-visible styling, button labels, and locale-aware weekday text.

## User Workflow
1. **Arrival** – Visitor loads page, greeted by logo grid and animated hands conveying brand vibe.
2. **Orientation** – Venue grid presents address/time. Weekday label clarifies scheduling without mental conversion.
3. **Exploration** – Users scroll through artist profiles, optionally opening outbound links.
4. **Engagement** – Curious visitors activate chaos mode, dragging cards to explore playful UX.
5. **Conversion** – With logistics captured, visitor shares page or plans attendance; no ticketing integration yet.

## Content Governance
- **Update cadence**: Artist roster and schedule likely to change closer to event; updates require manual HTML edits.
- **Source of truth**: Organizer spreadsheet or CMS not integrated; repository content considered canonical.
- **Localization**: Page language set to Korean (`lang="ko"`), but textual content currently English—determine translation strategy before launch.
- **Legal/attribution**: Footer currently minimal; confirm any sponsor requirements or licenses for imagery.

## Success Metrics (Hypothetical)
- **Engagement**: Chaos mode activation rate, outbound link clicks per artist, time on page.
- **Awareness**: Unique visitors, social shares referencing the event.
- **Conversion**: Click-through to ticketing or calendar exports once implemented.

## Future Opportunities & Open Questions
- Should we integrate a ticket CTA, calendar `.ics` download, or map embed for deeper conversion support?
- Do we need localized content (Korean/Dutch/English) or multilingual toggle for international visitors?
- Could we surface schedule programming details (talks, workshops) beyond the current single time range?
- What is the plan for day-of updates (e.g., weather, lineup changes) without CMS support?
- Are there accessibility audits planned to validate motion controls and contrast ratios?
