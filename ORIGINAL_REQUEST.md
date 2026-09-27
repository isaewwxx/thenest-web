# Original User Request

## 2026-09-09T18:52:33Z

Transform the existing The Nest / Гнездото website into a production-ready, photographic boutique hospitality frontend with an end-to-end direct booking enquiry system, bilingual BG/EN support, and zero generic AI aesthetics.

Requested team: Specialized subagents for Visual Design, Mobile UX, Accessibility, Booking Flow, Performance, Content/Localization, and QA

Working directory: c:\Users\PC\Documents\Coding Projects\thenest-bungala
Integrity mode: development

## Requirements

### R1. Boutique Visual Polish & Anti-AI Refinement

Eliminate all generic AI frontend patterns (giant rounded cards, unnecessary pill badges, floating blobs, stock SaaS buttons, excessive card nesting). Establish an authentic, warm visual hierarchy centered on verified property photography (greenery, wood, verandas, natural shade, seaside Lozenets atmosphere). Curate image roles with intentional responsive focal points and crops across mobile (320px–430px), tablet (768px–1024px), and desktop (1440px+). Ensure typography (Lora and Source Sans 3) delivers an intimate editorial feel and native Bulgarian Cyrillic rendering.

### R2. Direct Booking Enquiry System & Handoff

Implement a high-trust direct booking enquiry flow as the primary conversion path (distinct from instant automated booking, clearly communicating manual owner confirmation of availability and rates). Include arrival/departure date selection with validation, guest counter, pet field, and contact details with proper HTML autocomplete. Support prefilling accommodation selection when navigating from room details (`?room=...`). Keep Booking.com and Airbnb visible but secondary.

### R3. Serverless Form Action, Resend Transactional Emails & Anti-Spam

Process booking submissions server-side with strict validation and sanitization. Protect the endpoint with Cloudflare Turnstile verification, honeypot fields, duplicate submission prevention, and rate limiting. Deliver structured, actionable notification emails to the owners (with guest contact actions and direct `Reply-To`) and warm, reassuring confirmation emails to guests via Resend without leaking credentials to client bundles. Provide resilient UI states for progress, success, and graceful error recovery.

### R4. Accessibility, Performance, and SEO Preservation

Ensure the entire booking and gallery/lightbox flow meets WCAG 2.2 Level AA (keyboard navigation, focus trapping and return, real form labels, contrast, reduced motion). Maintain static crawlability and SEO metadata for all property pages. Optimize asset delivery (responsive image sizing, no unnecessary heavy dependencies, clean hydration) to protect LCP, CLS, and INP metrics.

## Acceptance Criteria

### Visual & Mobile Experience

- [ ] No generic AI cards, glassmorphism, or SaaS templates remain; design reflects real greenery/wood property textures.
- [ ] Tested and cleanly rendered across 320px, 375px, 390px, 430px, 768px, and 1440px+ without awkward crops or horizontal overflow.
- [ ] Hero features verified property photography, readable typography, and primary direct booking CTA.
- [ ] Gallery supports keyboard navigation (arrows, ESC), touch swipe, focus handling, and accessible labels.

### Direct Booking & Resend Integration

- [ ] Form validates required fields (valid future dates, guest count, valid phone, valid email, sanitized message).
- [ ] Submissions successfully trigger Resend API sending dual emails (owner alert with Reply-To + guest acknowledgment).
- [ ] Anti-spam protections (honeypot + Turnstile token validation) reject bot and duplicate spam attempts.
- [ ] No database is introduced; sensitive credentials (`RESEND_API_KEY`, etc.) remain server-side only.
- [ ] Pre-filling works seamlessly when arriving via room link parameters.

### Localization & Copy

- [ ] Bulgarian copy reads naturally with correct Cyrillic typography and Bulgarian hospitality terminology; English copy is independently natural without machine-translation artifacts.
- [ ] UI labels and CTAs are consistent across header, hero, rooms, sticky mobile bar, and footer.

### Verification & Quality Gate

- [ ] `npm run check` (Astro check) passes with 0 errors.
- [ ] `npm run test` (Vitest unit/integration suite) passes with 100% success for booking validation and utilities.
- [ ] `npm run test:e2e` (Playwright) passes for navigation, booking submission, and lightbox interaction.
- [ ] `npm run build` succeeds cleanly producing static pages and serverless API endpoints.

## Follow-up — 2026-09-09T19:13:29Z

Server restarted. Please resume orchestrating and executing the milestones from PROJECT.md. Keep agent concurrency controlled to avoid 429 quota limits. Proceed with Milestone 1 review/approval and then Milestone 2-5 implementation and verification.
