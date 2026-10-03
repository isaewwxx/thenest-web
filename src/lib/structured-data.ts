import type { Locale } from '../data/types';
import { site } from '../data/site';
import { pathFor } from './routes';
import { siteOrigin } from './content';

export function lodgingBusinessJsonLd(
  origin: string,
  locale: Locale,
  image: string,
) {
  const canonicalOrigin = siteOrigin(origin);
  if (!canonicalOrigin)
    throw new Error('A production site origin is required.');

  const location = site.location.coordinates;
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${canonicalOrigin}/#lodging-business`,
    name: site.name[locale],
    url: new URL(pathFor('home', locale), canonicalOrigin).href,
    image: [new URL(image, canonicalOrigin).href],
    telephone: site.contacts.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: locale === 'bg' ? 'ул. „Осогово“ 12' : '12 Osogovo Street',
      postalCode: '8277',
      addressLocality: site.location.locality[locale],
      addressCountry: 'BG',
    },
    ...(location
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      : {}),
    sameAs: [
      site.contacts.facebook,
      site.contacts.bookingCom,
      site.contacts.airbnb,
    ].filter((url): url is string => Boolean(url)),
  };
}
