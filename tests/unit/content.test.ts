import { describe, expect, it } from 'vitest';
import { pathFor, pageFromPath, pages } from '../../src/lib/routes';
import { contactLinks, bookingTarget, approvedReviews, validateUnits, validateCoordinates, siteOrigin, seoFor } from '../../src/lib/content';

const empty = { phone: null, email: null, whatsapp: null, viber: null, messenger: null, bookingCom: null, airbnb: null };

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
    const contacts = { ...empty, phone: '+359 888 123 456', email: 'owner@example.org', bookingCom: 'https://www.booking.com/test' };
    expect(contactLinks(contacts)).toEqual(expect.arrayContaining([
      expect.objectContaining({ href: 'tel:+359888123456' }),
      expect.objectContaining({ href: 'mailto:owner@example.org' }),
    ]));
    expect(bookingTarget(contacts, 'en')).toBe(contacts.bookingCom);
    expect(bookingTarget({ ...empty, airbnb: 'https://airbnb.com/rooms/1' }, 'en')).toContain('airbnb');
    expect(bookingTarget({ ...empty, phone: '+359888123456' }, 'en')).toBe('tel:+359888123456');
  });
  it('rejects unsafe links and malformed personal contact details', () => {
    expect(() => contactLinks({ ...empty, messenger: 'javascript:alert(1)' })).toThrow();
    expect(() => contactLinks({ ...empty, whatsapp: 'http://example.org' })).toThrow();
    expect(() => contactLinks({ ...empty, email: 'bad\nBcc:x@y.z' })).toThrow();
    expect(() => contactLinks({ ...empty, phone: 'call me' })).toThrow();
  });
  it('accepts verified HTTPS messaging destinations', () => {
    expect(contactLinks({ ...empty, whatsapp: 'https://wa.me/123', viber: 'https://vb.me/example', messenger: 'https://m.me/example' })).toHaveLength(3);
  });
});

describe('partial and approved business data', () => {
  it('only shows owner-approved attributed reviews', () => {
    const base = { id: 'r1', author: 'A', text: { bg: 'Текст', en: 'Text' }, source: 'Google', sourceUrl: 'https://maps.google.com', approved: true };
    expect(approvedReviews([base, { ...base, approved: false }, { ...base, sourceUrl: null }])).toEqual([base]);
  });
  it('accepts empty units and checks numeric boundaries', () => {
    expect(validateUnits([])).toEqual([]);
    const unit = { id: 'unit-1', name: null, description: null, capacity: null, beds: null, bedrooms: null, bathrooms: null, amenities: [], gallery: [], bookingUrl: null };
    expect(validateUnits([unit])).toEqual([unit]);
    expect(() => validateUnits([{ ...unit, capacity: 0 }])).toThrow();
    expect(() => validateUnits([{ ...unit, bedrooms: -1 }])).toThrow();
    expect(() => validateUnits([{ ...unit, id: '../bad' }])).toThrow();
    expect(() => validateUnits([unit, unit])).toThrow();
    expect(() => validateUnits([{ ...unit, bookingUrl: 'javascript:bad' }])).toThrow();
    expect(validateUnits([{ ...unit, bedrooms: 0, capacity: 2 }])).toHaveLength(1);
  });
  it('validates coordinate ranges without inventing a position', () => {
    expect(validateCoordinates(null)).toBe(null);
    expect(validateCoordinates({ latitude: 0, longitude: 0 })).toEqual({ latitude: 0, longitude: 0 });
    expect(() => validateCoordinates({ latitude: 91, longitude: 0 })).toThrow();
    expect(() => validateCoordinates({ latitude: 0, longitude: NaN })).toThrow();
  });
});

describe('SEO without a made-up domain', () => {
  it('omits canonical URLs and disallows indexing when origin is absent', () => {
    expect(siteOrigin('')).toBe(null);
    expect(seoFor('gallery', 'en', null, false)).toMatchObject({ canonical: null, indexable: false });
  });
  it('builds reciprocal localized canonical URLs for an approved origin', () => {
    expect(siteOrigin('https://example.org/')).toBe('https://example.org');
    expect(seoFor('gallery', 'en', 'https://example.org', true)).toEqual({ canonical: 'https://example.org/en/gallery', bg: 'https://example.org/gallery', en: 'https://example.org/en/gallery', indexable: true });
    expect(seoFor('home', 'bg', 'https://example.org', false).indexable).toBe(false);
  });
  it.each(['http://example.org', 'https://example.org/path', 'not-a-url', 'https://user:pass@example.org', 'https://localhost', 'https://example.org?foo=1'])('rejects invalid production origin %s', (origin) => {
    expect(() => siteOrigin(origin)).toThrow();
  });
});
