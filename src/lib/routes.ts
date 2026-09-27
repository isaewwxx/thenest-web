import type { Locale } from '../data/types';
export const pages = [
  'home',
  'accommodation',
  'gallery',
  'location',
  'booking',
  'contact',
] as const;
export type PageKey = (typeof pages)[number];
export function pathFor(page: PageKey, locale: Locale): string {
  const prefix = locale === 'en' ? '/en' : '';
  return `${prefix}${page === 'home' ? '' : `/${page}`}` || '/';
}
export function pageFromPath(path: string): PageKey | null {
  const clean = path.split('?')[0]!.replace(/\/+$/, '') || '/';
  return (
    pages.find(
      (page) => pathFor(page, 'bg') === clean || pathFor(page, 'en') === clean,
    ) ?? null
  );
}
