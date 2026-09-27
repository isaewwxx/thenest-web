# Deployment Runbook

The Nest is a static Astro site with a Cloudflare Pages Function for booking enquiries.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node version: `22.12.0` or newer
- Runtime function: `functions/api/booking.ts`, exposed at `POST /api/booking`
- Static security headers: generated at `dist/_headers`

The project does not require a separate adapter. Keep the existing static Astro output and Pages Functions directory. Do not deploy the research archive as application content.

## Required environment variables

| Variable                    | Required for                  | Notes                                                     |
| --------------------------- | ----------------------------- | --------------------------------------------------------- |
| `PUBLIC_SITE_URL`           | Canonical URLs and indexing   | Production HTTPS origin, no trailing slash                |
| `PUBLIC_INDEXABLE`          | Indexing control              | Keep `false` until domain and owner approval are complete |
| `RESEND_API_KEY`            | Live enquiry delivery         | Server-side secret only                                   |
| `BOOKING_RECIPIENT_EMAIL`   | Owner notifications           | Defaults locally to the owner inbox                       |
| `BOOKING_FROM_EMAIL`        | Outgoing mail                 | Must be verified in Resend for production                 |
| `TURNSTILE_SECRET_KEY`      | Server anti-spam verification | Pair with the public site key                             |
| `PUBLIC_TURNSTILE_SITE_KEY` | Client anti-spam widget       | Optional; do not configure only the public key            |

## Release sequence

1. Configure Pages variables and secrets.
2. Deploy with the repository's existing Cloudflare Pages integration.
3. Verify the production origin, HTTPS, `/robots.txt`, `/sitemap-index.xml`, localized routes, `/api/booking` OPTIONS/POST behavior, and a real test enquiry.
4. Confirm Resend delivery and reply-to behavior.
5. Set `PUBLIC_INDEXABLE=true` only after owner content approval and domain verification.

Live email delivery and DNS cannot be verified from local tests without the production credentials and domain.
