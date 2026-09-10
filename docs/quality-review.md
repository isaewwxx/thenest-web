# The Nest / Гнездото — architecture and quality review

**Repo:** [isaewwxx/thenest-web](https://github.com/isaewwxx/thenest-web)  
**Default branch:** `main` (single commit `661a6fe` — *Initial commit after Codex generation*, 9 Sep 2026)  
**Review date:** 10 Sep 2026  
**Scope:** read-only. No application/runtime code was changed. This file is the only artifact.

**Verdict for Georgi’s Chief of Staff:** this is a careful *content-honesty foundation* wrapped in an unfinished marketing site. The data/i18n/SEO-safety design is the real craft. The UI, gallery, legal pages, and release tooling do not yet consume that design. README’s “production-ready” line oversells a scaffold that still cannot run its own launch gate. Compared with Cursor-built `prikluchenia`, this repo looks like one compressed generation pass (Codex, then likely Antigravity visual work, then squash) rather than iterated product craft.

---

## 1. Architecture map

```
src/
  pages/[...path].astro     all 5 public pages (BG + EN) in one catch-all
  pages/robots.txt.ts       index lock
  pages/sitemap-index.xml.ts  urlset (misnamed)
  layouts/BaseLayout.astro  document shell, SEO tags, Header/Footer
  components/               Header, Footer, PageShell, SectionHeading,
                            DevelopmentImage, PropertyGallery, Lightbox,
                            AccommodationCards, ContactMethods
  data/                     site, accommodation, gallery, reviews, types
  i18n/                     bg.ts (source of truth), en.ts (same shape)
  lib/                      routes.ts, content.ts (validation + SEO helpers)
  assets/development/       AI mood studies (hero + interior art)
  assets/property/          6 JPEGs, byte-identical to research-images dumps
scripts/                    check-release.ts, build-headers.mjs
tests/unit                  lib contracts
tests/e2e                   axe, overflow, lightbox, no-JS, reduced motion
```

### Pages and routing

Bulgarian is unprefixed; English lives under `/en`. Five keys: `home`, `accommodation`, `gallery`, `location`, `contact`. Implemented as one `getStaticPaths()` catch-all, not five page files.

Static build (verified 10 Sep 2026) emits 10 HTML pages plus `robots.txt` and `sitemap-index.xml`. Unknown paths have no custom `404.astro`; `notFound` copy in i18n is unused.

### Data

Typed, nullable, bilingual records in `src/data/`. Contacts, coordinates, arrival, cancellation, privacy, Instagram, and reviews are explicitly null or empty until owners confirm them. `contentApproved: false` is a first-class flag.

### i18n

`t(locale)` returns `bg` or `en`. English is typed as `Translation = typeof bg`, so missing keys fail the typecheck. Copy is provisional (comments say owner review pending). Many keys exist that the UI never reads (privacy, policies, categories, bathrooms, amenities, reviews, 404).

### Components

Small presentational pieces with scoped CSS. `PageShell` is a one-line wrapper. Almost all page layout and CSS lives in `[...path].astro` (two huge `<style>` blocks). Tailwind 4 is imported in `global.css` but markup uses almost no utilities — custom CSS variables and component styles do the work.

### Release gates (as designed)

| Gate | What it is supposed to do | What it actually does today |
|---|---|---|
| `PUBLIC_INDEXABLE=false` | noindex + robots Disallow | Works. Build emits `noindex,nofollow` and `Disallow: /`. |
| `PUBLIC_SITE_URL` empty | no canonical / empty sitemap | Works. Sitemap is an empty urlset. |
| `site.contentApproved` | block indexing until owners sign off | Intended, but `test:release` currently **crashes** before it can enforce this. |
| `npm run check` | `astro check` | Passes (0 diagnostics). |
| `npm test` | vitest on `src/lib` | Passes (21 tests). |
| `npm run test:e2e` | Playwright + axe | Spec is ambitious; not executed in this review (Playwright browsers not installed). |
| `npm run test:release` | fail if indexable while incomplete | **Broken:** Node ESM cannot resolve `./site` from `accommodation.ts`. |
| Cloudflare `_headers` | security + long-cache hashed assets | Security headers exist. Cache rule targets `/assets/*`; Astro emits `/_astro/*`. |

There is no `.github/` workflow, no `wrangler` config, no ESLint, no privacy/cookies pages.

---

## 2. Strengths (with evidence)

These are the parts that look *intentional*, not generic AI page-fill.

1. **Nullability as a product rule, not a TODO comment.**  
   `Contacts`, `Coordinates`, `Unit` fields, `Review.sourceUrl`, `policies.privacy` / `cancellation` are `T | null`. README states the policy in plain language. Location copy refuses a map pin until hosts confirm (`googleMapsUrl` is null; UI only renders the Maps button if it exists). Reviews start as `[]` with a comment that empty collections stay hidden.

2. **Contact construction refuses unsafe URLs.**  
   `httpsUrl()` rejects non-HTTPS and credentialed URLs. Phone must be E.164. `contactLinks()` returns `[]` when everything is null. Unit tests cover `javascript:`, `http://`, malformed email, and missing contacts (`tests/unit/content.test.ts`). This is the strongest code in the repo.

3. **Indexing cannot accidentally turn on.**  
   `seoFor()` requires both origin and `PUBLIC_INDEXABLE`. Robots and meta robots agree. Default `.env.example` is `PUBLIC_INDEXABLE=false` and empty origin. Build confirmed: `noindex,nofollow` + `Disallow: /`.

4. **Development art is labelled as non-evidence.**  
   `DevelopmentImage` always shows “Atmosphere illustration, not a property photograph.” Hero has a visible note. `src/assets/development/README.md` and `PROMPTS.md` document the images as imaginary. That honesty is rare in generated hospitality sites.

5. **Bilingual route contract is small and correct.**  
   `pathFor` / `pageFromPath` round-trip, strip query strings, treat trailing slash, BG home = `/`, EN home = `/en`. Tests lock this.

6. **No fake enquiry form.**  
   README and contact note both say an enquiry is not a booking. There is no form that pretends to send mail. Matches the “don’t invent a backend” rule.

7. **Accessibility intent in e2e, not just a Lighthouse badge.**  
   Spec covers axe wcag2a/aa + 2.1 aa, skip link, one `h1`, `lang`, language switch, keyboard lightbox, Escape + focus restore on the mobile menu, no-JS navigation via `<details>`, `prefers-reduced-motion`, and nine viewport widths. Whether all of that is maintainable is a separate question; the *intent* is real.

8. **Cyrillic-capable fonts are actually shipped.**  
   Build emits Lora and Source Sans 3 `cyrillic` / `cyrillic-ext` woff2 files. That is a concrete localization choice, not a Latin-only default.

9. **`astro check` is clean** on the current tree (31 files, 0 diagnostics) with `astro/tsconfigs/strict` and `noUncheckedIndexedAccess`.

---

## 3. Weaknesses / risks / incomplete areas

Severity: **Critical** = blocks an honest launch or the claimed process. **High** = user-visible or legal. **Medium** = polish / maintainability. **Low** = nits.

### Critical

| Issue | Evidence |
|---|---|
| **`npm run test:release` crashes** | `node --experimental-strip-types scripts/check-release.ts` imports `site.ts`, which pulls `accommodation.ts`, which does `import { site } from './site'` without an extension. Node 22 ESM: `ERR_MODULE_NOT_FOUND`. README lists this as a launch command. The gate never reaches `contentApproved`. |
| **README says “Production-ready”** while `contentApproved` is false, photos are unapproved, privacy is null, and the release script does not run | First line of `README.md` vs `src/data/site.ts` line 7. |
| **Public repo ships ~18 MB of Airbnb listing photos** plus a manifest of `muscache.com` originals | `research-images/` (67 JPEGs) + `airbnb-photo-manifest.json`. Property “originals” in `src/assets/property/` are byte-identical to `research-images/airbnb1-room-*.jpeg` / `airbnb2-room-*.jpeg`. Platform ToS / copyright risk on a **public** repo. |

### High

| Issue | Evidence |
|---|---|
| **Gallery data is disconnected from the gallery UI** | `src/data/gallery.ts` defines 6 photos (`approved: false`). `PropertyGallery.astro` never imports it. It renders `coastal-study.png` / `veranda-study.png`. Built `dist/gallery/index.html` contains no property JPEGs. Visitors see AI illustrations captioned as atmosphere, plus copy that talks about “photographs of the bungalows”. |
| **`development: false` on platform copies** | Same six files are flagged `development: false` while the comment says “Platform-derived development copies” and `docs/image-sources.md` is missing. Flag and comment contradict each other. |
| **LCP hero is a 3.6 MB PNG** | `[...path].astro` uses raw `<img src={hero.src}>` instead of `astro:assets` `Image`. Build: `/_astro/coastal-study.IEIC8Wqs.png` (3,715,078 bytes) with `fetchpriority="high"`. Adjacent images correctly become ~300–400 KB webp. |
| **Contact subtitles leak TypeScript keys** | Built contact page: `<small>facebook</small>`, `<small>bookingCom</small>`, `<small>airbnb</small>`. `contactLinks()` sets `label: kind` for non-phone/email. Phone is fine (`+359 877 116 050`). |
| **“Make an enquiry” goes to Booking.com** | `AccommodationCards` uses `bookingTarget()`, which prefers `bookingCom`. Button copy is `copy.ui.enquire`. Direct OTA handover while the site claims enquiries are not bookings. |
| **No privacy page; privacy copy is null** | `site.policies.privacy === null`. Footer has `copy.footer.privacy` unused. README launch list requires “privacy wording”. `prikluchenia` has `/privacy` and `/cookies`. |
| **No custom 404** | `notFound` strings exist; no `src/pages/404.astro`. |
| **`_headers` cache path is wrong** | `Cache-Control: ... /assets/*` but hashed files live under `/_astro/*`. Long-cache rule never matches. |
| **No CI** | No `.github/workflows`. Format check, unit tests, `astro check`, and the broken release script never run on push. |

### Medium

| Issue | Evidence |
|---|---|
| **Data model outruns the UI** | Unused at runtime: `gallery` / `heroPhoto`, `reviews` + `approvedReviews()`, `validateUnits()` / `validateCoordinates()` (tests only), `site.location.address` / `parking` / `beach` / `arrival` (address appears only inside location *prose*), `site.policies.*`, `site.amenities` except as copied onto the one unit, `unit.gallery`, `unit.bathrooms`, `unit.amenities`, `site.social`. |
| **One catch-all page file** | `[...path].astro` is 26 lines of packed markup + two enormous CSS lines. Hard to review, format, or own. |
| **Prettier is configured and unused** | `prettier --check .` failed on **27 files**. Formatting was never applied. |
| **Dead dependencies** | `@lucide/astro` unused. `lighthouse` unused and requires Node `>=22.19`; project `engines` is `>=22.12.0`; this environment is 22.14.0 → `EBADENGINE`. Tailwind imported, almost no utility classes. `.reveal` animation unused. |
| **SEO leftovers** | Duplicate `hreflang` logic in `BaseLayout` (seo.bg/en plus a third “other” tag). No `hreflang="x-default"`. No `og:image`. Relative hreflang when origin is unset (`href="/en"`). File named `sitemap-index.xml` emits a `urlset`, not a sitemap index. `astro.config.mjs` has no `site`. |
| **Lightbox is a global script** | `document.querySelector('.lightbox')` + `querySelectorAll('a[data-lightbox]')`. Empty `alt=""` until JS runs. No focus trap beyond native `<dialog>`. |
| **Dark-mode tokens vs hardcoded hero** | `global.css` has `prefers-color-scheme: dark` variables. Hero colors are hardcoded `#f9f7ed` / `#21362a`. Half a theme. |
| **Node version drift** | `.node-version` is `24`. `engines` is `>=22.12.0`. Lighthouse wants `>=22.19`. |
| **Playwright preview assumes a prior build** | `webServer.command` is `npm run preview`. `reuseExistingServer: true` can hide a stale `dist`. Chromium only. ~46 tests for ~400 lines of app TS/Astro. |
| **`check-release` would be a weak gate even if it ran** | It warns on unapproved content and empty reviews, then **exits 0** unless `PUBLIC_INDEXABLE=true`. It does not check development images still in the hero, `approved: false` photos, null privacy, or missing email. |

### Low

- `PageShell.astro` is `<div class="page-shell"><slot /></div>`.
- `facebook?` is optional on `Contacts` while siblings are required `| null`.
- Facebook URL duplicated on `contacts.facebook` and `social.facebook`.
- Footer copyright uses `new Date().getFullYear()` at build time (fine for Pages if you rebuild yearly).
- Experimental warning on `--experimental-strip-types`.
- `trailingSlash: 'never'` still emits `accommodation/index.html` (normal for static hosts; worth confirming on Pages).

---

## 4. How Codex / Antigravity origin shows up

Git cannot separate the two tools: **one squashed commit**, message *Initial commit after Codex generation*. Quality still splits cleanly inside the tree.

### Signals of AI scaffolding (Codex-shaped)

- Commit message and `$CODEX_HOME/generated_images/...` paths in `PROMPTS.md`.
- A complete *schema* (types, validators, i18n keys, SEO helpers, release script, axe e2e) with the **product UI not wired to it**. Classic “design the contracts, stub the pages”.
- Packed one-line Astro/CSS (`BaseLayout`, Footer, `[...path].astro` styles) — compressed to look finished, painful to diff.
- Unused keys left “for later”: `notFound`, `footer.privacy`, `gallery.categories`, `ui.amenities` / `reviews` / `bathrooms`.
- Dependencies added as capability badges (`lighthouse`, Lucide, Tailwind, Playwright html reporter) without being integrated.
- README voice: “Production-ready bilingual Astro foundation” on a repo whose own flag says content is not approved.
- Missing `docs/image-sources.md` referenced from `gallery.ts` — leftover of a planned doc that was never written.

### Signals that look like a later visual pass (Antigravity-shaped)

- Strong mood: forest/paper tokens, Lora display type, full-bleed hero, gouache studies, schematic “map” blob.
- Huge inline CSS in the catch-all, mobile breakpoint at 700px, hover translations — a design pass dropped onto the scaffold rather than components grown one page at a time.
- Property JPEGs imported into `gallery.ts` but the visible gallery still uses illustrations — two art systems, neither finished.

### Contrast with Cursor-built `prikluchenia` (private, sampled 10 Sep 2026)

`prikluchenia` is a different product (Next 16, admin, Formspree, R2, legal routes), so this is about *operating quality*, not stack envy.

| | thenest-web | prikluchenia |
|---|---|---|
| History | 1 squashed Codex commit | Multiple Cursor co-authored commits with reasons |
| Pages | One catch-all | App Router routes including `privacy`, `cookies`, `not-found` |
| Owner workflow | Typed TS files + TODOs | `/admin` editor, uploads, seed/mirror scripts |
| Tooling | Prettier (unapplied), no ESLint, no CI, broken release script | `eslint-config-next`, wrangler, deploy script |
| README | Claims production-ready, then a checklist | Stack, forms, admin, Cloudflare, folder map — operational |
| Legal | Privacy string unused, policy null | Dedicated privacy/cookies/regulations routes |

The quality gap Georgi feels is not “Astro vs Next”. It is **iterated ownership vs a single generated snapshot**. `prikluchenia` has seams of real decisions (cookie consent vs lint rule, R2 vs local uploads). The Nest has a beautiful honesty layer and an unfinished face.

---

## 5. Launch checklist vs README claims

README launch paragraph: set `PUBLIC_SITE_URL` after DNS; keep `PUBLIC_INDEXABLE=false` until owner content, original photos, contacts, and privacy wording are approved; then `test:release`, `check`, `test`, `build`, `test:e2e`.

| README claim | Status |
|---|---|
| Production-ready foundation | **Overclaim.** Honest as a *pre-launch* scaffold only. |
| Missing info never produces broken/fabricated UI | **Mostly true** for null contacts/coords/reviews. **False** for contact labels (`bookingCom`) and gallery copy that describes photographs while showing illustrations. |
| Development artwork labelled and replace-before-launch | Labelled: yes. Replaced: no. Release script does not check this. |
| Add only owner-confirmed details | Phone, Facebook, Booking, Airbnb, address, parking, beach distance, amenities, check-in/out, pets policy are filled from public listings / brief. `contentApproved` is still false — consistent, but the site already presents them as facts. |
| Keep `PUBLIC_INDEXABLE=false` until approval | **Honoured** in env and build. |
| Then run `test:release` | **Cannot.** Script crashes. |
| `check` / `test` / `build` | Work (verified). |
| `test:e2e` | Configured; needs Playwright browsers + a prior `build`. No CI. |
| No fake enquiry form | **True.** |
| Cloudflare Pages: `npm run build` → `dist` | Build works. Missing: Pages project config, `_redirects`, correct asset cache path, `site` in Astro config. |

**Content still explicitly incomplete (matches Georgi’s known state):** `contentApproved false`, `PUBLIC_INDEXABLE=false`, email/WhatsApp/Viber/Messenger null, coordinates null, privacy null, cancellation null, reviews empty, three houses not inventoried (`accommodation.ts` says representative room type only).

---

## 6. Test / release tooling quality

**Unit tests (good).** 21 tests, all passing. They lock the *interesting* contracts: bilingual routes, unsafe URL rejection, review approval, unit ID/capacity bounds, origin validation. Coverage thresholds exist for `src/lib` only (80%). They do not import real `site` / `gallery` data, so they cannot catch the UI disconnect.

**`astro check` (good).** Strict TS, clean.

**Release script (bad).** Wrong runtime for path aliases / extensionless TS imports. Even if fixed, it is a warning printer unless indexing is on. It would currently fail indexing because `contentApproved` is false and reviews are empty — that part of the design is sound.

**Prettier (aspirational).** Plugin for Astro is present; 27 files fail `--check`. No format CI.

**Playwright (ambitious, expensive, unverified here).** Axe on every locale×page, overflow at 9 widths, lightbox, reduced motion, no-JS. Chromium only. `lighthouse` is in `package.json` and never called. e2e does **not** assert: contact labels, that gallery uses `src/data/gallery.ts`, privacy link, 404 page, or that development captions remain if photos go live.

**Headers (partial).** nosniff, SAMEORIGIN, referrer, permissions-policy: useful. No CSP. Wrong cache path.

**Engine mismatch.** Lighthouse 13.4.1 wants Node ≥22.19; repo claims ≥22.12.0.

---

## 7. What to prioritize toward production

Order is for a bungalow site that must not lie to guests, not a framework rewrite.

1. **Treat the public repo as sensitive.** Move `research-images/` out of git history or make the repo private until licensed originals exist. Do not ship Airbnb CDN dumps.
2. **Fix the release gate** so `test:release` actually runs (and fails closed on `contentApproved`, unapproved photos, development assets still in the hero, null privacy). Add GitHub Actions: `check`, `test`, `format:check`, `test:release`, `build`.
3. **Owner content session.** Approve or delete each fact already in `site.ts` (phone, OTAs, address, 200 m beach claim, pets, hours). Set `contentApproved` only after that. Write privacy (and cookies if any analytics appear).
4. **Wire `src/data/gallery.ts` to `PropertyGallery`** with `approved` / `development` flags. Until owner photos exist, keep illustrations and stop calling them photographs in `gallery.notice`.
5. **Replace hero `<img>` with `Image`** (or a real photo) so LCP is not 3.6 MB.
6. **Contact polish:** human labels (not `bookingCom`); enquire vs Book on Booking.com as two actions; add email when the owners have one.
7. **Split `[...path].astro` into real pages** and run Prettier. Delete unused deps (Lucide, Lighthouse until used). Point cache headers at `/_astro/*`.
8. **Legal + 404 + `og:image` + `hreflang="x-default"`** once `PUBLIC_SITE_URL` is real. Then, and only then, flip `PUBLIC_INDEXABLE`.

Do not start with a CMS, a form provider, or a visual redesign. The Nest already has a better honesty model than most generated hotel sites. Production means **connecting that model to the pixels, the photos, and a gate that runs**.

---

## Appendix — commands run in this review

```
npm install --ignore-scripts
npx vitest run          # 21 passed
node --experimental-strip-types scripts/check-release.ts
                        # ERR_MODULE_NOT_FOUND ./site
npx prettier --check .  # 27 files
npx astro check         # 0 diagnostics
npx astro build         # 10 pages, robots Disallow, empty sitemap
```

Playwright e2e was not executed (no browser install in this pass).
