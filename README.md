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

The static build is written to `dist/`, ready for Cloudflare Pages with build command `npm run build` and output directory `dist`.

## Content and photos

Business data lives in `src/data/`. Add only details confirmed by the owners. Contacts, booking links, coordinates, accommodation, reviews and policies are nullable or empty by design, so missing information never produces broken or fabricated UI. Localized copy lives in `src/i18n/bg.ts` and `src/i18n/en.ts`.

Development artwork lives in `src/assets/development/`; it is labelled as illustration and must be replaced with owner-approved originals before launch. Keep original image dimensions and meaningful localized alt text.

## Launch checklist

Set `PUBLIC_SITE_URL` to the real HTTPS domain only after DNS is ready. Keep `PUBLIC_INDEXABLE=false` until owner content, original photos, contacts and privacy wording are approved. Then run `npm run test:release`, `npm run check`, `npm run test`, `npm run build`, and `npm run test:e2e`.

No enquiry form pretends to deliver a message. Add a real provider and spam protection before introducing one.
