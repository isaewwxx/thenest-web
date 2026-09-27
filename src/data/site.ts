import type { Contacts, Coordinates, Localized, Amenity } from './types';

// Known facts verified from public channels (Booking.com, Airbnb, Pochivka.bg, Facebook).
// TODO: Owners review and confirm final editorial phrasing.
export const site = {
  name: { bg: 'Бунгала Гнездото', en: 'The Nest Bungalows' },
  contentApproved: false,
  contacts: {
    phone: '+359 877 116 050',
    email: null,
    whatsapp: null,
    viber: null,
    messenger: null,
    facebook: 'https://www.facebook.com/bungalagnezdoto/',
    bookingCom:
      'https://www.booking.com/hotel/bg/bungala-gnezdoto-bungalows-the-nest.bg.html',
    airbnb: 'https://www.airbnb.com/rooms/1518207915595474183',
  } satisfies Contacts as Contacts,
  location: {
    locality: { bg: 'Лозенец', en: 'Lozenets' },
    region: { bg: 'Южно Черноморие', en: 'Southern Black Sea coast' },
    country: { bg: 'България', en: 'Bulgaria' },
    address: {
      bg: 'ул. „Осогово“ 12, 8277 Лозенец, България',
      en: '12 Osogovo Street, 8277 Lozenets, Bulgaria',
    } as Localized,
    coordinates: {
      latitude: 42.20708,
      longitude: 27.81049,
    } as Coordinates | null,
    googleMapsUrl: 'https://www.google.com/maps?q=42.20708,27.81049' as
      string | null,
    arrival: {
      bg: 'След влизане в Лозенец, следвайте посоката към Малкия плаж и Рибарското пристанище. Обектът се намира на ул. Осогово 12 в спокойна и зелена част на селото.',
      en: 'Upon entering Lozenets, head toward Small Beach and the Fishing Port. The property is located at 12 Osogovo Street in a calm and green part of the village.',
    } as Localized | null,
    parking: {
      bg: 'Безплатен частен паркинг на място за гостите',
      en: 'Free private on-site parking for guests',
    } as Localized,
    beach: {
      bg: 'Около 200 м пеша (3–4 минути) до Малкия плаж, Рибарското пристанище и Hacienda Beach. Централният плаж на Лозенец е на около 800 м.',
      en: 'Approximately 200 m walk (3–4 minutes) to Small Beach, the Fishing Port and Hacienda Beach. Lozenets Central Beach is around 800 m away.',
    } as Localized,
  },
  amenities: [
    {
      id: 'air-conditioning',
      label: { bg: 'Климатик', en: 'Air conditioning' },
    },
    {
      id: 'tv-cable',
      label: {
        bg: 'Телевизор с кабелна телевизия',
        en: 'Flat-screen TV with cable',
      },
    },
    { id: 'wifi', label: { bg: 'Безплатен Wi-Fi', en: 'Free Wi-Fi' } },
    { id: 'parking', label: { bg: 'Безплатен паркинг', en: 'Free parking' } },
    {
      id: 'private-veranda',
      label: { bg: 'Самостоятелна веранда', en: 'Private veranda' },
    },
    {
      id: 'kitchenette',
      label: { bg: 'Кухненски бокс в стаята', en: 'In-room kitchenette' },
    },
    {
      id: 'appliances',
      label: {
        bg: 'Хладилник с камера, кана и тостер',
        en: 'Fridge with freezer, kettle & toaster',
      },
    },
    {
      id: 'private-bathroom',
      label: {
        bg: 'Самостоятелна баня (150 л бойлер)',
        en: 'Private bathroom (150L boiler)',
      },
    },
    {
      id: 'shared-kitchen',
      label: {
        bg: 'Покрита лятна кухня с барбекю',
        en: 'Covered summer kitchen & BBQ',
      },
    },
    {
      id: 'garden',
      label: { bg: 'Озеленен двор и морава', en: 'Landscaped garden & lawn' },
    },
    {
      id: 'pets',
      label: { bg: 'Домашни любимци без такса', en: 'Pets welcome (free)' },
    },
  ] as readonly Amenity[],
  sharedFacilities: [
    {
      id: 'bbq',
      label: {
        bg: 'Съоръжения за готвене на открито',
        en: 'Outdoor cooking facilities',
      },
    },
    {
      id: 'stove-oven',
      label: { bg: 'Готварска печка с фурна', en: 'Stove & oven' },
    },
    {
      id: 'microwave',
      label: { bg: 'Микровълнова фурна', en: 'Microwave oven' },
    },
    {
      id: 'coffee-machine',
      label: { bg: 'Кафе машина', en: 'Coffee machine' },
    },
    {
      id: 'shared-fridge',
      label: { bg: 'Общ хладилник с фризер', en: 'Communal fridge & freezer' },
    },
    {
      id: 'dining-tables',
      label: {
        bg: 'Големи маси и пейки под навеса',
        en: 'Shaded dining tables & benches',
      },
    },
    {
      id: 'cookware',
      label: {
        bg: 'Пълен набор кухненски съдове и прибори',
        en: 'Cookware, tableware & utensils',
      },
    },
  ] as readonly Amenity[],
  social: {
    facebook: 'https://www.facebook.com/bungalagnezdoto/',
    instagram: null as string | null,
  },
  policies: {
    checkIn: {
      bg: 'От 14:00 до 20:00 ч.',
      en: 'From 14:00 to 20:00',
    } as Localized,
    checkOut: {
      bg: 'От 07:00 до 10:00 ч.',
      en: 'From 07:00 to 10:00',
    } as Localized,
    quietHours: {
      bg: '14:00 – 16:00 ч. и 23:00 – 08:00 ч. (тихи часове за спокойствието на всички почиващи)',
      en: '14:00 – 16:00 and 23:00 – 08:00 (quiet hours for the tranquility of all guests)',
    } as Localized,
    cancellation: {
      bg: 'Анулационните условия зависят от канала за резервация. При директно запитване условията се уточняват предварително с домакините.',
      en: 'Cancellation conditions depend on the booking channel. For direct enquiries, terms are agreed in advance with the hosts.',
    } as Localized | null,
    pets: {
      bg: 'Домашните любимци са добре дошли без допълнителна такса. Изисква се да не се оставят сами без надзор в стаите или градината, както и стопаните да почистват след тях.',
      en: 'Pets are welcome free of charge. They must not be left unattended in rooms or garden, and owners are expected to clean up after them.',
    } as Localized,
    smoking: {
      bg: 'Пушенето в стаите е абсолютно забранено; разрешено е на открито на верандите и в градината.',
      en: 'Smoking is strictly forbidden inside rooms; allowed outdoors on verandas and in the garden.',
    } as Localized,
    privacy: null as Localized | null,
  },
  provisionalPricing: {
    status: 'OWNER_CONFIRMATION_REQUIRED',
    lowSeason: {
      period: '01.06 – 14.06 & 14.09 – 30.10',
      bgnPerNight: 97.79,
      eurPerNight: 50,
    },
    highSeason: {
      period: '15.06 – 13.09',
      bgnPerNight: 132.99,
      eurPerNight: 68,
    },
    earlyBookingPromo:
      '15.05 – 14.06: 5+ нощувки с 1 безплатна / 5+ nights with 1 free',
    deposit: '2 нощувки по банков път / 2 nights via bank transfer',
    notes:
      'Цените подлежат на потвърждение от собствениците. Налице е разминаване между Pochivka.bg (97.79/132.99 лв) и Bizneskarta.net (100/130 лв с граници 15.05-24.06, 25.06-05.09, 06.09-30.10).',
  },
} as const;
