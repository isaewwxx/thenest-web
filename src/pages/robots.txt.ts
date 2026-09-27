import type { APIRoute } from 'astro';
import { siteOrigin } from '../lib/content';
const origin = siteOrigin(import.meta.env.PUBLIC_SITE_URL);
const indexable =
  import.meta.env.PUBLIC_INDEXABLE === 'true' && Boolean(origin);
export const GET: APIRoute = () =>
  new Response(
    indexable
      ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap-index.xml\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
