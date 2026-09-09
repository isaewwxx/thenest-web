import type { Unit } from './types';
import { site } from './site';

// A representative room type only. It is not a physical room number or a full inventory.
// The mapping of online listings to the three houses must be confirmed by the owners.
export const accommodation: readonly Unit[] = [{
  id: 'bungalow-room',
  name: { bg: 'Стая в бунгало', en: 'Room in a bungalow' },
  description: { bg: 'Публикуваната информация описва самостоятелна стая с веранда, баня и кухненски бокс.', en: 'Public listing information describes a private room with a veranda, bathroom and kitchenette.' },
  capacity: 3,
  beds: { bg: '2 единични легла и единичен разтегателен диван', en: '2 single beds and a single sofa bed' },
  bedrooms: null,
  bathrooms: 1,
  amenities: site.amenities,
  gallery: ['bungalow-evening', 'covered-veranda'],
  bookingUrl: null,
}];
