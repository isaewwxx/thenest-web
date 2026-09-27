import type { Photo } from './types';

// Exterior
import aerialCabinsExterior from '../assets/property/exterior/three-bungalows-aerial.jpg';
import gardenExterior from '../assets/property/exterior/bungalow-flowering-veranda.jpeg';
import woodExterior from '../assets/property/exterior/bungalow-wooden-facade.jpeg';
import daylightExterior from '../assets/property/exterior/bungalow-daylight-garden.jpeg';
import twilightExterior from '../assets/property/exterior/bungalow-twilight-veranda.jpeg';

// Rooms
import roomInteriorWide from '../assets/property/rooms/room-interior-wide.jpeg';
import roomSofaTvArea from '../assets/property/rooms/room-sofa-tv-area.jpg';
import roomTwinBedsClose from '../assets/property/rooms/room-twin-beds-close.jpg';
import roomTwinBedsTvView from '../assets/property/rooms/room-twin-beds-tv-view.jpg';

// Kitchenette
import kitchenetteCounter from '../assets/property/kitchenette/kitchenette-counter.jpg';

// Bathroom
import bathroomFullView from '../assets/property/bathroom/bathroom-full-view.jpeg';

// Shared
import sharedCommunalKitchen from '../assets/property/shared/shared-communal-kitchen.jpg';
import sharedOutdoorCookingGazebo from '../assets/property/shared/shared-outdoor-cooking-gazebo.jpeg';
import sharedCoveredVeranda from '../assets/property/shared/shared-covered-veranda.jpeg';

// Garden
import gardenVerandaWalkway from '../assets/property/garden/garden-veranda-walkway.jpeg';
import gardenVerandaGeraniums from '../assets/property/garden/veranda-geraniums.jpeg';

// Brand & Entrance
import brandWoodSign from '../assets/property/brand/brand-entrance-sign.jpeg';
import brandRoomKeychain from '../assets/property/brand/brand-bungalow-keychain.jpeg';

// Location
import locationSeaViewAerial from '../assets/property/location/location-sea-view-aerial.jpg';

export const gallery: readonly Photo[] = [
  // Exterior highlights
  {
    id: 'three-cabins-aerial',
    src: aerialCabinsExterior,
    category: 'exterior',
    development: false,
    approved: false,
    alt: {
      bg: 'Поглед отвисоко към трите дървени къщички на Гнездото сред градината',
      en: 'Elevated view showing the three wooden cabins of The Nest along the garden',
    },
    caption: {
      bg: 'Трите къщички, разположени сред спокойна градина',
      en: 'The three cabins nestled in a peaceful garden setting',
    },
  },
  {
    id: 'bungalow-wood-facade',
    src: woodExterior,
    category: 'exterior',
    development: false,
    approved: false,
    alt: {
      bg: 'Дървена фасада на бунгало с веранда и сенчести пердета',
      en: 'Wooden bungalow facade with private veranda and shaded curtains',
    },
    caption: {
      bg: 'Естествено дърво и уединена веранда',
      en: 'Natural wood and secluded private veranda',
    },
  },
  {
    id: 'bungalow-garden-veranda',
    src: gardenExterior,
    category: 'exterior',
    development: false,
    approved: false,
    alt: {
      bg: 'Бунгало с цветни храсти и дървена веранда',
      en: 'Bungalow with flowering bushes and wooden veranda',
    },
    caption: {
      bg: 'Зеленина и цвят пред всяка стая',
      en: 'Greenery and blossoms outside each room',
    },
  },
  {
    id: 'bungalow-daylight-lawn',
    src: daylightExterior,
    category: 'exterior',
    development: false,
    approved: false,
    alt: {
      bg: 'Бунгала Гнездото в слънчев летен ден над зелената морава',
      en: 'The Nest bungalows on a sunny summer day overlooking the green lawn',
    },
    caption: {
      bg: 'Слънчев летен ден в двора',
      en: 'Sunny summer day in the garden courtyard',
    },
  },
  {
    id: 'bungalow-twilight-lights',
    src: twilightExterior,
    category: 'exterior',
    development: false,
    approved: false,
    alt: {
      bg: 'Бунгалата привечер с включено топло осветление на верандите',
      en: 'Bungalows at dusk with warm glowing lights on the verandas',
    },
    caption: {
      bg: 'Уютна вечерна атмосфера на верандата',
      en: 'Cozy evening atmosphere on the veranda',
    },
  },

  // Rooms
  {
    id: 'room-interior-wide',
    src: roomInteriorWide,
    category: 'rooms',
    development: false,
    approved: false,
    alt: {
      bg: 'Широк поглед към стаята: две легла, разтегателен диван, скрин, телевизор и климатик',
      en: 'Wide view of the room: twin beds, pull-out sofa bed, chest of drawers, TV and air conditioning',
    },
    caption: {
      bg: 'Пространство за до 3 гости с климатик и гардероб',
      en: 'Spacious room accommodating up to 3 guests with AC and storage',
    },
  },
  {
    id: 'room-sofa-tv-area',
    src: roomSofaTvArea,
    category: 'rooms',
    development: false,
    approved: false,
    alt: {
      bg: 'Кът с диван и телевизор в стаята',
      en: 'Room seating area with sofa and television',
    },
    caption: {
      bg: 'Удобен кът за почивка и гледане на телевизия',
      en: 'A comfortable area for relaxing and watching TV',
    },
  },
  {
    id: 'room-twin-beds-close',
    src: roomTwinBedsClose,
    category: 'rooms',
    development: false,
    approved: false,
    alt: {
      bg: 'Близък поглед към двете единични легла в стаята',
      en: 'Close view of the twin beds in the bedroom',
    },
    caption: {
      bg: 'Две удобни легла за спокоен сън',
      en: 'Two comfortable beds for a restful night',
    },
  },
  {
    id: 'room-twin-beds-tv-view',
    src: roomTwinBedsTvView,
    category: 'rooms',
    development: false,
    approved: false,
    alt: {
      bg: 'Две единични легла и телевизор в стаята',
      en: 'Twin beds and television in the bedroom',
    },
    caption: {
      bg: 'Практично обзавеждане за спокоен престой',
      en: 'Practical furnishings for a comfortable stay',
    },
  },

  // Kitchenette
  {
    id: 'kitchenette-counter',
    src: kitchenetteCounter,
    category: 'kitchenette',
    development: false,
    approved: false,
    alt: {
      bg: 'Индивидуален кухненски бокс с хладилник, мивка, кана за вода, тостер и рафтове с чаши',
      en: 'Private kitchenette counter with refrigerator, sink, kettle, toaster and open shelving with glassware',
    },
    caption: {
      bg: 'Самостоятелен кухненски кът в стаята',
      en: 'Private in-room kitchenette for daily essentials',
    },
  },
  // Bathroom
  {
    id: 'bathroom-full-view',
    src: bathroomFullView,
    category: 'bathroom',
    development: false,
    approved: false,
    alt: {
      bg: 'Самостоятелна баня с душ кабина, мивка, огледало, тоалетна и 150-литров бойлер',
      en: 'Private bathroom with shower, washbasin, mirror, toilet and a 150L electric water heater',
    },
    caption: {
      bg: 'Самостоятелна баня с душ и голям 150 л бойлер',
      en: 'Private ensuite bathroom with shower and 150L boiler',
    },
  },

  // Shared Spaces / Communal Kitchen
  {
    id: 'shared-communal-kitchen',
    src: sharedCommunalKitchen,
    category: 'shared',
    development: false,
    approved: false,
    alt: {
      bg: 'Голяма покрита лятна кухня с барбекю, плотове, мивки и маси за хранене сред двора',
      en: 'Spacious covered communal summer kitchen with BBQ grills, sinks and dining tables in the courtyard',
    },
    caption: {
      bg: 'Покрита обща лятна кухня и кът за барбекю',
      en: 'Covered communal summer kitchen and BBQ area',
    },
  },
  {
    id: 'shared-outdoor-cooking-gazebo',
    src: sharedOutdoorCookingGazebo,
    category: 'shared',
    development: false,
    approved: false,
    alt: {
      bg: 'Покрит кът за готвене на открито с газов котлон и маса',
      en: 'Covered outdoor cooking area with gas burner and table',
    },
    caption: {
      bg: 'Практичен навес за споделено готвене',
      en: 'A practical gazebo for shared outdoor cooking',
    },
  },
  {
    id: 'shared-covered-veranda',
    src: sharedCoveredVeranda,
    category: 'shared',
    development: false,
    approved: false,
    alt: {
      bg: 'Сенчеста веранда с дървена маса и пейки за отдих',
      en: 'Shaded wooden veranda with outdoor table and benches for dining and relaxation',
    },
    caption: {
      bg: 'Място за почивка и разговори на чист въздух',
      en: 'Space to relax and dine in the fresh sea air',
    },
  },
  // Garden
  {
    id: 'garden-veranda-walkway',
    src: gardenVerandaWalkway,
    category: 'garden',
    development: false,
    approved: false,
    alt: {
      bg: 'Пътека покрай верандата сред зеленината на градината',
      en: 'Walkway beside the veranda through the garden greenery',
    },
    caption: {
      bg: 'Пътеки и зеленина около верандите',
      en: 'Garden paths and greenery around the verandas',
    },
  },
  {
    id: 'garden-veranda-geraniums',
    src: gardenVerandaGeraniums,
    category: 'garden',
    development: false,
    approved: false,
    alt: {
      bg: 'Цъфтящи червени мушката по парапета на дървената веранда',
      en: 'Flowering red geraniums along the wooden veranda railing overlooking trees',
    },
    caption: {
      bg: 'Цъфтящи цветя и естествена сянка',
      en: 'Blooming flowers and natural garden shade',
    },
  },
  // Brand & Entrance
  {
    id: 'brand-wood-sign',
    src: brandWoodSign,
    category: 'brand',
    development: false,
    approved: false,
    alt: {
      bg: 'Ръчно резбован дървен надпис „ГНЕЗДОТО“ на входа сред бръшлян',
      en: 'Hand-carved wooden sign reading "ГНЕЗДОТО" at the entrance framed by ivy',
    },
    caption: {
      bg: 'Дървеният знак на входа на Гнездото',
      en: 'The hand-carved wooden sign at The Nest entrance',
    },
  },
  {
    id: 'brand-room-keychain',
    src: brandRoomKeychain,
    category: 'brand',
    development: false,
    approved: false,
    alt: {
      bg: 'Ключ от бунгало с резбован дървен ключодържател птица и лого Гнездото',
      en: 'Bungalow room key with hand-carved wooden bird keychain and The Nest logo',
    },
    caption: {
      bg: 'Ръчно изработени дървени детайли с птицата на Гнездото',
      en: 'Handcrafted wooden details featuring The Nest bird emblem',
    },
  },

  // Location
  {
    id: 'location-sea-view-aerial',
    src: locationSeaViewAerial,
    category: 'location',
    development: false,
    approved: false,
    alt: {
      bg: 'Панорамен поглед отвисоко към Гнездото, зеленината на Лозенец и залива на Черно море',
      en: 'Elevated panoramic view of The Nest cabins, Lozenets greenery and the Black Sea bay',
    },
    caption: {
      bg: 'Лозенец: зеленина, спокойствие и Черно море на хоризонта',
      en: 'Lozenets: greenery, tranquility and the Black Sea on the horizon',
    },
  },
];

export const heroPhoto =
  gallery.find((photo) => photo.id === 'bungalow-garden-veranda') ??
  gallery[0]!;
