import type {
  Contacts,
  Coordinates,
  Locale,
  Review,
  Unit,
} from '../data/types';
import { pathFor, type PageKey } from './routes';

export function httpsUrl(value: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
    throw new Error('Use an HTTPS URL without credentials.');
  return value;
}
export function contactLinks(contacts: Contacts) {
  return Object.entries(contacts).flatMap(([kind, value]) => {
    if (!value) return [];
    if (kind === 'phone') {
      const number = value.replace(/[ ()-]/g, '');
      if (!/^\+[1-9]\d{6,14}$/.test(number))
        throw new Error('Phone must use international format.');
      return [{ kind, label: value, href: `tel:${number}` }];
    }
    if (kind === 'email') {
      if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value))
        throw new Error('Invalid email.');
      return [{ kind, label: value, href: `mailto:${value}` }];
    }
    return [{ kind, label: kind, href: httpsUrl(value) }];
  });
}
export function bookingTarget(contacts: Contacts, locale: Locale): string {
  const links = contactLinks(contacts);
  return (
    links.find((link) => link.kind === 'bookingCom')?.href ??
    links.find((link) => link.kind === 'airbnb')?.href ??
    links[0]?.href ??
    pathFor('contact', locale)
  );
}
export function approvedReviews(reviews: readonly Review[]): readonly Review[] {
  return reviews.filter(
    (review) =>
      review.approved &&
      review.author.trim() &&
      review.source.trim() &&
      review.text.bg.trim() &&
      review.text.en.trim() &&
      review.sourceUrl &&
      httpsUrl(review.sourceUrl),
  );
}
export function validateUnits(units: readonly Unit[]): readonly Unit[] {
  const ids = units.map((unit) => unit.id);
  if (new Set(ids).size !== ids.length)
    throw new Error('Unit IDs must be unique.');
  for (const unit of units) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(unit.id))
      throw new Error('Invalid unit ID.');
    for (const key of ['capacity', 'bedrooms', 'bathrooms'] as const) {
      const value = unit[key];
      if (
        value !== null &&
        (!Number.isInteger(value) || value < (key === 'capacity' ? 1 : 0))
      )
        throw new Error(`Invalid ${key}.`);
    }
    if (unit.bookingUrl) httpsUrl(unit.bookingUrl);
  }
  return [...units];
}
export function validateCoordinates(
  value: Coordinates | null,
): Coordinates | null {
  if (
    value &&
    (!Number.isFinite(value.latitude) ||
      !Number.isFinite(value.longitude) ||
      Math.abs(value.latitude) > 90 ||
      Math.abs(value.longitude) > 180)
  )
    throw new Error('Invalid coordinates.');
  return value;
}
export function siteOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const parsed = new URL(httpsUrl(value.trim()));
  if (
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    parsed.hostname === 'localhost' ||
    !parsed.hostname.includes('.')
  )
    throw new Error('Set a production origin without a path.');
  return parsed.origin;
}
export function seoFor(
  page: PageKey,
  locale: Locale,
  origin: string | null,
  indexable: boolean,
) {
  return {
    canonical: origin ? `${origin}${pathFor(page, locale)}` : null,
    bg: origin ? `${origin}${pathFor(page, 'bg')}` : null,
    en: origin ? `${origin}${pathFor(page, 'en')}` : null,
    indexable: Boolean(origin && indexable),
  };
}
