import type { Unit } from './types';
import { site } from './site.ts';

// Verified property configuration from public listings:
// The property consists of 3 wooden bungalow houses, each divided into 2 independent guest rooms (6 rooms total, capacity 18).
// Each room has a private veranda, ensuite bathroom (150L boiler), and private kitchenette.
export const accommodation: readonly Unit[] = [
  {
    id: 'bungalow-room',
    name: {
      bg: 'Самостоятелна стая в дървено бунгало',
      en: 'Private Room in a Wooden Bungalow',
    },
    description: {
      bg: 'Уютна стая от естествено дърво със самостоятелна веранда, индивидуален кухненски бокс и собствена баня с тоалетна. Разположена в една от трите къщички сред зелена градина.',
      en: 'Cozy natural wood room with private veranda, individual kitchenette and private ensuite bathroom. Situated in one of the three cabins amidst a green garden.',
    },
    capacity: 3,
    beds: {
      bg: '2 единични легла (с възможност за събиране) + 1 разтегателен диван',
      en: '2 single beds (combinable) + 1 pull-out sofa bed',
    },
    bedrooms: 1,
    bathrooms: 1,
    amenities: site.amenities,
    gallery: [
      'room-interior-wide',
      'room-twin-beds-close',
      'room-twin-beds-tv-view',
      'room-sofa-tv-area',
      'kitchenette-counter',
      'bathroom-full-view',
      'bungalow-wood-facade',
      'bungalow-daylight-lawn',
      'shared-communal-kitchen',
      'shared-outdoor-cooking-gazebo',
      'shared-covered-veranda',
      'garden-veranda-walkway',
      'garden-veranda-geraniums',
    ],
    bookingUrl: null,
  },
];
