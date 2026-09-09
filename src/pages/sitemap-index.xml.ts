import type { APIRoute } from 'astro';
import { siteOrigin } from '../lib/content';
import { pages, pathFor } from '../lib/routes';
const origin = siteOrigin(import.meta.env.PUBLIC_SITE_URL);
export const GET: APIRoute = () => {
  const urls = origin ? pages.flatMap((page) => ['bg','en'].map((locale) => `<url><loc>${origin}${pathFor(page, locale as 'bg'|'en')}</loc><xhtml:link rel="alternate" hreflang="bg" href="${origin}${pathFor(page,'bg')}"/><xhtml:link rel="alternate" hreflang="en" href="${origin}${pathFor(page,'en')}"/></url>`)).join('') : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
