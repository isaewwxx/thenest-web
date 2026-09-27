# Project: The Nest / Гнездото — Boutique Hospitality Frontend Transformation

## Architecture

- **Framework**: Astro 7.3.2 (`output: 'static'`, `trailingSlash: 'never'`) with Tailwind CSS v4, TypeScript 6.0, Fontsource Variable fonts (`Lora Variable`, `Source Sans 3 Variable`), and `@lucide/astro`.
- **Runtime Model**: Pre-rendered static pages (12 localized routes: 6 Bulgarian root routes + 6 English `/en` routes) deployed to CDN edge.
- **Serverless API Layer**: `POST /api/booking` handled by Cloudflare Pages Functions (`functions/api/booking.ts`) in production and custom Vite/Node proxy in local dev/preview (`astro.config.mjs`, `scripts/preview.ts`), delegating to `src/lib/booking.ts`.
- **Email & Anti-Spam Pipeline**: Resend direct HTTP API dispatch (dual emails: owner notification with guest `Reply-To` + guest confirmation with host `Reply-To`), Cloudflare Turnstile token validation, honeypot field, and 30-second in-memory deduplication.
- **Design Reference Alignment**:
  - **21st.dev**: Rich interactive components, asymmetrical responsive bento gallery, micro-interactions, tactile buttons.
  - **Origin UI / OriginKit**: Production-ready accessible UI primitives, stateful inputs, dialog/lightbox focus handling, form validation.
  - **Lightswind**: Modern Tailwind cards, subtle gradients, sleek glass/shadow hierarchy, warm paper/timber tones, tiered elevation shadows.

## Feature Inventory

| #   | Feature                                              | Description                                                                                                                                               | Milestone | Source                                  |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------- |
| 1   | Font Stack & Cyrillic Fix                            | Correct font declarations for `'Lora Variable'` and `'Source Sans 3 Variable'` ensuring native Bulgarian Cyrillic glyph rendering on all OSs              | M1        | survey (explorer_visual)                |
| 2   | Tailwind v4 @theme Token Architecture                | Declare `@theme` block in `global.css` with semantic color tokens (`--color-forest`, `--color-paper`, etc.), radii, Lightswind shadows, and motion curves | M1        | survey (explorer_visual)                |
| 3   | Replace Emojis with Lucide Icons                     | Replace raw platform emojis with crisp, semantic `@lucide/astro` SVG icons across all components                                                          | M1        | survey (explorer_visual)                |
| 4   | Base Button & Badge Anti-AI Refinement               | Replace 9999px stadium pill shapes and stock SaaS styling with 6px-8px architectural radii and 1px tactile borders                                        | M1        | survey (explorer_visual, R1)            |
| 5   | Responsive Photography & Picture Component           | Implement responsive `widths` and `sizes` in `PropertyPhoto.astro` and responsive focal crops                                                             | M1        | survey (explorer_visual, R1)            |
| 6   | Hero Section Redesign                                | Responsive focal points (320px–1440px+), authentic timber/greenery photography, readable typography, direct booking CTA                                   | M2        | survey (explorer_visual, R1)            |
| 7   | Responsive Bento Gallery Grid                        | Asymmetrical responsive grid honoring both 3:2 landscape and 2:3/3:4/9:20 portrait photos without vertical crop loss                                      | M2        | survey (explorer_visual, R1)            |
| 8   | Lightbox Accessibility & UX Polish                   | Accessible controls with contrast protection, image counter ("3 / 25"), remove 3rem mobile margin choking, touch swipe                                    | M2        | survey (explorer_visual, R4)            |
| 9   | Content Section Aesthetic Polish                     | Refine Accommodation cards, Atmosphere, Location, and Reviews sections with warm paper/linen textures and tiered elevation                                | M2        | survey (explorer_visual, R1)            |
| 10  | Direct Booking `?room=...` Prefill                   | Support `?room=...` query parameter prefilling accommodation alongside `?unit=...` across booking form and links                                          | M3        | survey (explorer_booking_tests, R2)     |
| 11  | Client Turnstile Integration                         | Conditionally render Turnstile script and widget when `PUBLIC_TURNSTILE_SITE_KEY` is present in environment                                               | M3        | survey (explorer_booking_tests, R3)     |
| 12  | Environment Variables Documentation                  | Document all booking configuration variables in `.env.example` with clear descriptions                                                                    | M3        | survey (explorer_booking_tests, R3)     |
| 13  | Booking Form Mobile Polish & States                  | Ensure smooth mobile validation, error announcements, guest/pet counter UX, and manual confirmation messaging                                             | M3        | survey (explorer_booking_tests, R2)     |
| 14  | I18n Dictionary Centralization                       | Migrate ~50 inline `locale === 'bg' ? ... : ...` ternaries from components into `src/i18n/bg.ts` and `src/i18n/en.ts`                                     | M4        | survey (explorer_arch, copy)            |
| 15  | Bulgarian Cyrillic & Hospitality Phrasing            | Verify correct low-high quotes `„Гнездото“` and authentic Bulgarian hospitality vocabulary                                                                | M4        | survey (explorer_arch, copy)            |
| 16  | English Copy Polish                                  | Verify natural, idiomatic English copy across all UI elements, links, and email templates                                                                 | M4        | survey (explorer_arch, copy)            |
| 17  | Test Suite Expansion (`?room=...`, Bento, Turnstile) | Add unit and E2E test cases covering `?room=` parameter prefill, gallery responsive layouts, and edge cases                                               | M5        | survey (explorer_booking_tests, R2, R4) |
| 18  | Quality Gate Verification                            | Execute `npm run check` (0 errors), `npm run test` (100%), `npm run test:e2e` (pass), and `npm run build` (clean)                                         | M5        | survey (all, verification)              |
| 19  | Forensic Integrity & Adversarial Hardening           | Forensic audit of authentic implementation (no hardcoded cheats, zero AI slop, WCAG 2.2 AA compliance)                                                    | M5        | survey (verification)                   |

## Milestones

| #   | Name                                                             | Scope                                                                                                                                   | Dependencies   | Status                    |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------- |
| M1  | Foundations: Design Tokens, Cyrillic Typography & Asset Pipeline | Features 1, 2, 3, 4, 5 (global.css @theme, Fontsource variable font stacks, Lucide icons, PropertyPhoto responsive srcset)              | none           | DONE (restart 2026-09-10) |
| M2  | Visual Polish & Responsive Photography                           | Features 6, 7, 8, 9 (Hero redesign, responsive bento gallery, accessible lightbox, section card styling per 21st.dev/Origin/Lightswind) | M1             | DONE (restart 2026-09-10) |
| M3  | Direct Booking Flow & Serverless Polish                          | Features 10, 11, 12, 13 (`?room=` prefill, Turnstile client widget, `.env.example` documentation, booking form UI states)               | M1             | DONE (restart 2026-09-10) |
| M4  | Bilingual Localization & Copy Harmonization                      | Features 14, 15, 16 (Centralize inline ternaries into `bg.ts` and `en.ts`, verify Cyrillic typography and hospitality terminology)      | M2, M3         | NEXT                      |
| M5  | E2E Verification & Adversarial Quality Hardening                 | Features 17, 18, 19 (Expanded unit/E2E test suite, full test run across 9 viewports, build verification, forensic audit)                | M1, M2, M3, M4 | PLANNED                   |

## Interface Contracts

### Design Tokens & Typography (M1 ↔ M2, M3)

- Global CSS variables declared under `:root` and `@theme`:
  - Font families: `--font-serif: 'Lora Variable', 'Lora', Georgia, serif;`, `--font-sans: 'Source Sans 3 Variable', 'Source Sans 3', sans-serif;`
  - Colors: `--color-paper: #f7f5ed;`, `--color-forest: #234735;`, `--color-wood: #966543;`, `--color-sea: #5f8485;`, `--color-line: #dcd8c8;`, `--color-ink: #1f3025;`, `--color-muted: #566459;`
  - Radii: `--radius: 8px;`, `--radius-sm: 4px;`, `--radius-lg: 12px;`
  - Transitions: `--motion-fast: 150ms;`, `--ease-out: cubic-bezier(0.16, 1, 0.3, 1);`
  - Shadows: `--shadow-subtle: 0 1px 3px rgba(31, 48, 37, 0.05);`, `--shadow-card: 0 4px 12px rgba(31, 48, 37, 0.08);`, `--shadow-elevated: 0 16px 40px rgba(31, 48, 37, 0.12);`

### Booking URL Parameter Contract (M2, M3 ↔ M5)

- Room link format: `${pathFor('booking', locale)}?room=${encodeURIComponent(unit.id)}`
- Backward compatibility: `const requestedUnit = urlParams.get('room') || urlParams.get('unit');`
- Select element `#accommodationId`: when matching value is found, sets `select.value = requestedUnit`.

### Localization Contract (M4 ↔ All)

- All user-facing strings must be retrieved from `copy` object provided by `src/i18n/index.ts`.
- No inline `locale === 'bg' ? '...' : '...'` ternaries in component templates.

## Code Layout

- `src/styles/global.css`: Tailwind v4 directives, `@theme` token definitions, base resets.
- `src/components/`: UI components (`Header.astro`, `Footer.astro`, `BookingForm.astro`, `AccommodationCards.astro`, `PropertyGallery.astro`, `Lightbox.astro`, `PropertyPhoto.astro`, `MobileBottomBar.astro`, `ReviewsSection.astro`, `SectionHeading.astro`).
- `src/pages/[...path].astro`: Core page layout and section composition.
- `src/lib/booking.ts`: Core validation, anti-spam, duplicate prevention, and Resend email generation.
- `src/lib/routes.ts`: Route manifest and URL resolution.
- `src/i18n/`: Bilingual translation dictionaries (`bg.ts`, `en.ts`, `index.ts`).
- `tests/unit/`: Vitest test suites (`booking.test.ts`, `content.test.ts`).
- `tests/e2e/`: Playwright end-to-end tests (`booking.spec.ts`).
