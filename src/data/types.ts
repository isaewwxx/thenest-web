import type { ImageMetadata } from 'astro';
export type Locale = 'bg' | 'en';
export type Localized = Readonly<Record<Locale, string>>;
export type Contacts = Readonly<{
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  viber: string | null;
  messenger: string | null;
  facebook?: string | null;
  bookingCom: string | null;
  airbnb: string | null;
}>;
export type Coordinates = Readonly<{ latitude: number; longitude: number }>;
export type Photo = Readonly<{
  id: string;
  src: ImageMetadata;
  alt: Localized;
  caption: Localized;
  category:
    | 'exterior'
    | 'rooms'
    | 'kitchenette'
    | 'bathroom'
    | 'shared'
    | 'garden'
    | 'entrance'
    | 'brand'
    | 'location';
  development: boolean;
  approved: boolean;
}>;
export type Amenity = Readonly<{ id: string; label: Localized }>;
export type Unit = Readonly<{
  id: string;
  name: Localized | null;
  description: Localized | null;
  capacity: number | null;
  beds: Localized | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: readonly Amenity[];
  gallery: readonly string[];
  bookingUrl: string | null;
}>;
export type Review = Readonly<{
  id: string;
  author: string;
  rating?: number | string | null;
  date?: string | null;
  text: Localized;
  source: string;
  sourceUrl: string | null;
  approved: boolean;
}>;
