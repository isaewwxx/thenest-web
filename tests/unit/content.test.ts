import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { pathFor, pageFromPath, pages } from '../../src/lib/routes';
import {
  contactLinks,
  bookingTarget,
  approvedReviews,
  validateUnits,
  validateCoordinates,
  siteOrigin,
  seoFor,
} from '../../src/lib/content';
import { bg } from '../../src/i18n/bg';
import { en } from '../../src/i18n/en';
import { t } from '../../src/i18n';

const empty = {
  phone: null,
  email: null,
  whatsapp: null,
  viber: null,
  messenger: null,
  bookingCom: null,
  airbnb: null,
};

describe('bilingual route contract', () => {
  it.each(pages)('roundtrips %s in both languages', (page) => {
    expect(pageFromPath(pathFor(page, 'bg'))).toBe(page);
    expect(pageFromPath(pathFor(page, 'en') + '/')).toBe(page);
  });
  it('uses unprefixed Bulgarian and an English home', () => {
    expect(pathFor('home', 'bg')).toBe('/');
    expect(pathFor('home', 'en')).toBe('/en');
    expect(pageFromPath('/missing')).toBe(null);
    expect(pageFromPath('/en/gallery?x=1')).toBe('gallery');
  });
});

describe('verified contact destinations', () => {
  it('handles missing contacts without fake links', () => {
    expect(contactLinks(empty)).toEqual([]);
    expect(bookingTarget(empty, 'bg')).toBe('/contact');
    expect(bookingTarget(empty, 'en')).toBe('/en/contact');
  });
  it('constructs usable contacts and prioritizes a booking destination', () => {
    const contacts = {
      ...empty,
      phone: '+359 888 123 456',
      email: 'owner@example.org',
      bookingCom: 'https://www.booking.com/test',
    };
    expect(contactLinks(contacts)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: 'tel:+359888123456' }),
        expect.objectContaining({ href: 'mailto:owner@example.org' }),
      ]),
    );
    expect(bookingTarget(contacts, 'en')).toBe(contacts.bookingCom);
    expect(
      bookingTarget({ ...empty, airbnb: 'https://airbnb.com/rooms/1' }, 'en'),
    ).toContain('airbnb');
    expect(bookingTarget({ ...empty, phone: '+359888123456' }, 'en')).toBe(
      'tel:+359888123456',
    );
  });
  it('rejects unsafe links and malformed personal contact details', () => {
    expect(() =>
      contactLinks({ ...empty, messenger: 'javascript:alert(1)' }),
    ).toThrow();
    expect(() =>
      contactLinks({ ...empty, whatsapp: 'http://example.org' }),
    ).toThrow();
    expect(() => contactLinks({ ...empty, email: 'bad\nBcc:x@y.z' })).toThrow();
    expect(() => contactLinks({ ...empty, phone: 'call me' })).toThrow();
  });
  it('accepts verified HTTPS messaging destinations', () => {
    expect(
      contactLinks({
        ...empty,
        whatsapp: 'https://wa.me/123',
        viber: 'https://vb.me/example',
        messenger: 'https://m.me/example',
      }),
    ).toHaveLength(3);
  });
});

describe('partial and approved business data', () => {
  it('only shows owner-approved attributed reviews', () => {
    const base = {
      id: 'r1',
      author: 'A',
      text: { bg: 'Текст', en: 'Text' },
      source: 'Google',
      sourceUrl: 'https://maps.google.com',
      approved: true,
    };
    expect(
      approvedReviews([
        base,
        { ...base, approved: false },
        { ...base, sourceUrl: null },
      ]),
    ).toEqual([base]);
  });
  it('accepts empty units and checks numeric boundaries', () => {
    expect(validateUnits([])).toEqual([]);
    const unit = {
      id: 'unit-1',
      name: null,
      description: null,
      capacity: null,
      beds: null,
      bedrooms: null,
      bathrooms: null,
      amenities: [],
      gallery: [],
      bookingUrl: null,
    };
    expect(validateUnits([unit])).toEqual([unit]);
    expect(() => validateUnits([{ ...unit, capacity: 0 }])).toThrow();
    expect(() => validateUnits([{ ...unit, bedrooms: -1 }])).toThrow();
    expect(() => validateUnits([{ ...unit, id: '../bad' }])).toThrow();
    expect(() => validateUnits([unit, unit])).toThrow();
    expect(() =>
      validateUnits([{ ...unit, bookingUrl: 'javascript:bad' }]),
    ).toThrow();
    expect(validateUnits([{ ...unit, bedrooms: 0, capacity: 2 }])).toHaveLength(
      1,
    );
  });
  it('validates coordinate ranges without inventing a position', () => {
    expect(validateCoordinates(null)).toBe(null);
    expect(validateCoordinates({ latitude: 0, longitude: 0 })).toEqual({
      latitude: 0,
      longitude: 0,
    });
    expect(() => validateCoordinates({ latitude: 91, longitude: 0 })).toThrow();
    expect(() =>
      validateCoordinates({ latitude: 0, longitude: NaN }),
    ).toThrow();
  });
});

describe('SEO without a made-up domain', () => {
  it('uses distinct property and location search snippets in both languages', () => {
    expect(bg.meta.accommodation.title).toContain('Бунгала');
    expect(bg.meta.accommodation.description).toContain('веранда');
    expect(bg.meta.location.title).toContain('Малкия плаж');
    expect(en.meta.accommodation.title).toContain('Bungalows');
    expect(en.meta.accommodation.description).toContain('kitchenette');
    expect(en.meta.location.title).toContain('Small Beach');
  });

  it('omits canonical URLs and disallows indexing when origin is absent', () => {
    expect(siteOrigin('')).toBe(null);
    expect(seoFor('gallery', 'en', null, false)).toMatchObject({
      canonical: null,
      indexable: false,
    });
  });
  it('builds reciprocal localized canonical URLs for an approved origin', () => {
    expect(siteOrigin('https://example.org/')).toBe('https://example.org');
    expect(seoFor('gallery', 'en', 'https://example.org', true)).toEqual({
      canonical: 'https://example.org/en/gallery',
      bg: 'https://example.org/gallery',
      en: 'https://example.org/en/gallery',
      indexable: true,
    });
    expect(seoFor('home', 'bg', 'https://example.org', false)).toEqual({
      canonical: null,
      bg: null,
      en: null,
      indexable: false,
    });
  });
  it.each([
    'http://example.org',
    'https://example.org/path',
    'not-a-url',
    'https://user:pass@example.org',
    'https://localhost',
    'https://example.org?foo=1',
  ])('rejects invalid production origin %s', (origin) => {
    expect(() => siteOrigin(origin)).toThrow();
  });
});

function leafKeys(value: unknown, prefix = ''): string[] {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, nested]) => leafKeys(nested, prefix ? `${prefix}.${key}` : key),
    );
  }
  return prefix ? [prefix] : [];
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(full) : [full];
  });
}

describe('bilingual dictionary contract', () => {
  const bgKeys = leafKeys(bg).sort();
  const enKeys = leafKeys(en).sort();

  it('keeps 100% key parity between Bulgarian and English dictionaries', () => {
    expect(enKeys).toEqual(bgKeys);
  });

  it('exposes every nested namespace used by templates and booking validation', () => {
    const required = [
      'meta.ogLocale',
      'ui.quickActions',
      'ui.callAria',
      'reviews.label',
      'reviews.body',
      'reviews.bookingLink',
      'reviews.airbnbLink',
      'booking.legendDates',
      'booking.legendContact',
      'booking.fields.namePlaceholder',
      'booking.sidebar.directContactTitle',
      'booking.sidebar.quietHoursValue',
      'booking.validation.checkInRequired',
      'booking.server.checkInInvalid',
      'booking.server.checkInPast',
      'booking.server.duplicate',
      'booking.server.sent',
      'booking.server.turnstileFailed',
      'booking.server.rateLimited',
      'booking.error.network',
      'location.places.smallBeachDistance',
      'accommodation.pagePhotoAlt',
      'home.brand',
      'footer.brandName',
    ];
    for (const key of required) {
      expect(bgKeys).toContain(key);
      expect(enKeys).toContain(key);
    }
  });

  it('uses authentic Bulgarian hospitality phrasing and quotation marks', () => {
    expect(bg.footer.brandName).toBe('Бунгала „Гнездото“');
    expect(bg.nav.booking).toBe('Запитване');
    expect(bg.booking.disclaimerText).toMatch(/запитване/);
    expect(bg.accommodation.lead).toMatch(/кухненски бокс/);
    expect(bg.home.atmosphereKitchen).toMatch(/лятна кухня/);
    expect(bg.booking.sidebar.checkInLabel).toMatch(/Настаняване/);
    expect(bg.booking.sidebar.checkOutLabel).toMatch(/Напускане/);
    expect(t('bg').home.brand).toBe('Гнездото');
  });

  it('keeps English copy independently idiomatic', () => {
    expect(en.nav.booking).toBe('Enquire');
    expect(en.booking.disclaimerText).toMatch(/enquiry/i);
    expect(en.booking.disclaimerText).not.toMatch(/запитване/);
    expect(en.accommodation.lead).toMatch(/kitchenette/i);
    expect(en.footer.brandName).toBe('The Nest Bungalows');
    expect(en.home.brand).toBe('The Nest');
  });

  it('does not leave inline locale copy ternaries in Astro templates', () => {
    const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../../src');
    const copyTernary =
      /(?:locale|lang)\s*===\s*['"]bg['"]\s*\?\s*['"`](?!en['"`])/s;
    const offenders = walkFiles(srcRoot)
      .filter((file) => file.endsWith('.astro'))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        return copyTernary.test(source) ? [file.replace(srcRoot, 'src')] : [];
      });
    expect(offenders).toEqual([]);
  });
});
