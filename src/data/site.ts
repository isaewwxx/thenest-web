import type { Contacts, Coordinates, Localized, Amenity } from './types';

// Known facts from the project brief. TODO: owners approve all editorial wording.
// Unknown business facts must stay null until verified by the owners.
export const site = {
  name: { bg: 'Бунгала Гнездото', en: 'The Nest Bungalows' },
  contentApproved: false,
  contacts: {
    phone: '+359 877 116 050', email: null, whatsapp: null, viber: null,
    messenger: null,
    facebook: 'https://www.facebook.com/bungalagnezdoto/',
    bookingCom: 'https://www.booking.com/hotel/bg/bungala-gnezdoto-bungalows-the-nest.bg.html',
    airbnb: 'https://www.airbnb.com/rooms/1518207915595474183',
  } satisfies Contacts as Contacts,
  location: {
    locality: { bg: 'Лозенец', en: 'Lozenets' },
    region: { bg: 'Южно Черноморие', en: 'Southern Black Sea coast' },
    country: { bg: 'България', en: 'Bulgaria' },
    address: { bg: 'ул. „Осогово“ 12, 8277 Лозенец, България', en: '12 Osogovo Street, 8277 Lozenets, Bulgaria' } as Localized,
    coordinates: null as Coordinates | null,
    googleMapsUrl: null as string | null,
    arrival: null as Localized | null,
    parking: { bg: 'Безплатен паркинг на място', en: 'Free on-site parking' } as Localized,
    beach: { bg: 'Публикувано е разстояние около 200 м до Малкия плаж, Пристанището и Хасиенда.', en: 'Public listings state approximately 200 m to Small Beach, the Port and Hacienda.' } as Localized,
  },
  amenities: [
    { id: 'air-conditioning', label: { bg: 'Климатик', en: 'Air conditioning' } },
    { id: 'wifi', label: { bg: 'Безплатен Wi-Fi', en: 'Free Wi-Fi' } },
    { id: 'parking', label: { bg: 'Безплатен паркинг', en: 'Free parking' } },
    { id: 'private-veranda', label: { bg: 'Самостоятелна веранда', en: 'Private veranda' } },
    { id: 'pets', label: { bg: 'Домашни любимци са добре дошли', en: 'Pets welcome' } },
  ] as readonly Amenity[],
  social: { facebook: 'https://www.facebook.com/bungalagnezdoto/', instagram: null as string | null },
  policies: {
    checkIn: { bg: 'След 14:00 ч.', en: 'After 14:00' } as Localized,
    checkOut: { bg: 'Преди 10:00 ч.', en: 'Before 10:00' } as Localized,
    cancellation: null as Localized | null,
    pets: { bg: 'Домашните любимци са добре дошли без допълнителна такса. Не бива да остават сами без стопаните си.', en: 'Pets are welcome at no extra fee. They should not be left alone while guests are away.' } as Localized,
    privacy: null as Localized | null,
  },
} as const;
