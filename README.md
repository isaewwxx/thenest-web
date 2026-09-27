# The Nest / Гнездото

Production-ready bilingual Astro foundation for a small bungalow property in Lozenets, Bulgaria. Bulgarian is the default language; English mirrors every page at `/en/...`.

## Local development

Requires Node 22.12 or newer.

```bash
npm install
npm run dev
npm run check
npm run test
npm run build
npm run test:release
```

The static build is written to `dist/`, ready for Cloudflare Pages with build command `npm run build` and output directory `dist`. The `functions/` directory contains the Pages Function for `POST /api/booking`.

## Content and photos

Business data lives in `src/data/`. Add only details confirmed by the owners. Contacts, booking links, coordinates, accommodation, reviews and policies are nullable or empty by design, so missing information never produces broken or fabricated UI. Localized copy lives in `src/i18n/bg.ts` and `src/i18n/en.ts`.

Development artwork lives in `src/assets/development/`; it is labelled as illustration and must be replaced with owner-approved originals before launch. Keep original image dimensions and meaningful localized alt text.

## Deployment and launch checklist

Configure the following Cloudflare Pages environment variables before production use:

- `PUBLIC_SITE_URL` — real HTTPS origin without a trailing slash.
- `PUBLIC_INDEXABLE` — keep `false` until the owner approves the content and domain is live; set `true` only with `PUBLIC_SITE_URL` configured.
- `RESEND_API_KEY` — server-side Resend API key.
- `BOOKING_RECIPIENT_EMAIL` — owner inbox receiving enquiries.
- `BOOKING_FROM_EMAIL` — verified Resend sender address.
- `TURNSTILE_SECRET_KEY` — server-side Cloudflare Turnstile secret, if enabled.
- `PUBLIC_TURNSTILE_SITE_KEY` — client-side Turnstile site key, if enabled.

Use Cloudflare Pages build command `npm run build` and output directory `dist`. Configure the Pages project to retain the repository `functions/` directory so `/api/booking` remains available. Set secrets in the Pages dashboard or Wrangler; never commit them.

Before enabling indexing or accepting live enquiries, verify DNS, HTTPS, the production origin, Resend sender-domain verification, Turnstile configuration, and a real end-to-end email delivery.

Run `npm run test:release`, `npm run check`, `npm run test`, `npm run test:coverage`, `npm run build`, and `npm run test:e2e` before deployment.

When `RESEND_API_KEY` is absent, local enquiries intentionally use simulation mode; production must provide the key and a verified sender.
