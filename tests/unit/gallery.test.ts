import { describe, expect, it } from 'vitest';
import { gallery, heroPhoto } from '../../src/data/gallery';

const retiredIds = new Set([
  'bungalow-golden-hour',
  'room-twin-beds',
  'garden-path-walkway',
  'garden-pets-welcome',
  'kitchenette-utensils',
  'shared-evening-atmosphere',
]);

describe('approved production photography set', () => {
  it('contains exactly the 19 approved active photographs', () => {
    expect(gallery).toHaveLength(19);
    expect(gallery.every((photo) => photo.development === false)).toBe(true);
  });

  it('uses the approved flowering-veranda image as the homepage hero', () => {
    expect(heroPhoto.id).toBe('bungalow-garden-veranda');
  });

  it('does not expose retired photograph records', () => {
    expect(gallery.some((photo) => retiredIds.has(photo.id))).toBe(false);
  });

  it('keeps distinct approved role coverage', () => {
    expect(gallery.map((photo) => photo.id)).toEqual(
      expect.arrayContaining([
        'bungalow-daylight-lawn',
        'three-cabins-aerial',
        'location-sea-view-aerial',
        'garden-veranda-walkway',
        'bungalow-wood-facade',
        'bungalow-twilight-lights',
        'room-interior-wide',
        'room-twin-beds-close',
        'room-twin-beds-tv-view',
        'room-sofa-tv-area',
        'kitchenette-counter',
        'bathroom-full-view',
        'shared-communal-kitchen',
        'shared-outdoor-cooking-gazebo',
        'shared-covered-veranda',
        'garden-veranda-geraniums',
        'brand-wood-sign',
        'brand-room-keychain',
      ]),
    );
  });
});
