import { describe, expect, it } from 'vitest';
import { lodgingBusinessJsonLd } from '../../src/lib/structured-data';

describe('lodging business structured data', () => {
  const image = 'https://example.org/share.jpg';

  it('uses the localized name and canonical home URL', () => {
    expect(
      lodgingBusinessJsonLd('https://example.org', 'bg', image),
    ).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      name: 'Бунгала Гнездото',
      url: 'https://example.org/',
      image: [image],
    });
    expect(
      lodgingBusinessJsonLd('https://example.org', 'en', image),
    ).toMatchObject({
      name: 'The Nest Bungalows',
      url: 'https://example.org/en',
    });
  });

  it('includes only configured business identity and location facts', () => {
    const data = lodgingBusinessJsonLd('https://example.org', 'en', image);
    expect(data).toMatchObject({
      telephone: '+359 877 116 050',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '12 Osogovo Street',
        postalCode: '8277',
        addressLocality: 'Lozenets',
        addressCountry: 'BG',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 42.20708,
        longitude: 27.81049,
      },
    });
    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('review');
    expect(data).not.toHaveProperty('priceRange');
  });
});
