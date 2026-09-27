import type { Review } from './types';
// Researched guest feedback and platform ratings from official listings.
// Kept as approved: false until formal written owner confirmation.
export const reviews: readonly Review[] = [
  {
    id: 'booking-the-nest-1',
    author: 'Гост в Booking.com',
    rating: '10.0 / 10',
    date: 'Сезон 2024 / 2025',
    text: {
      bg: 'Оценка 10.0 / 10 (Фантастичен) в Booking.com. Отлични 10.0 оценки за чистота, удобства, комфорт, съотношение цена/качество и местоположение на крачки от плажа.',
      en: 'Rated 10.0 / 10 (Exceptional) on Booking.com with top 10.0 scores for cleanliness, facilities, comfort, value and location just steps from the beach.',
    },
    source: 'Booking.com — The Nest 1',
    sourceUrl:
      'https://www.booking.com/hotel/bg/bungala-gnezdoto-bungalows-the-nest.bg.html',
    approved: false,
  },
  {
    id: 'booking-the-nest-2',
    author: 'Гост в Booking.com',
    rating: '10.0 / 10',
    date: 'Сезон 2024 / 2025',
    text: {
      bg: 'Оценка 10.0 / 10 (Фантастичен) в Booking.com. Спокойно място сред богата зеленина, близост до Малкия плаж и прекрасна лятна атмосфера.',
      en: 'Rated 10.0 / 10 (Exceptional) on Booking.com. Peaceful accommodation in lush greenery, near Small Beach with a wonderful summer atmosphere.',
    },
    source: 'Booking.com — The Nest Lozenets 2',
    sourceUrl:
      'https://www.booking.com/hotel/bg/bungala-gnezdoto-bungalows-the-nest-lozenets.bg.html',
    approved: false,
  },
  {
    id: 'airbnb-host-hospitality',
    author: 'Гост в Airbnb',
    rating: '5.0 / 5.0',
    date: 'Сезон 2024 / 2025',
    text: {
      bg: '100% максимална оценка (5.0 звезди) за гостоприемство в Airbnb. Уютни дървени бунгала, зелена градина и отлично отношение на домакините.',
      en: '100% top 5.0-star rating for hospitality on Airbnb. Cozy wooden cabins, lush green garden and welcoming host communication.',
    },
    source: 'Airbnb — The Nest Lozenets 2',
    sourceUrl: 'https://www.airbnb.com/rooms/1528123016093480745',
    approved: false,
  },
  {
    id: 'facebook-community',
    author: 'Бунгала „Гнездото“',
    rating: '4 500+ харесвания',
    date: 'Официална страница',
    text: {
      bg: '„Винаги сме радостни да станем част от приятната Ви почивка!“ — Официален девиз на домакините от страницата на обекта (над 340 отбелязвания).',
      en: '“We are always happy to be part of your pleasant vacation!” — The official host motto from The Nest Facebook page (over 340 guest check-ins).',
    },
    source: 'Facebook — Бунгала „Гнездото“',
    sourceUrl: 'https://www.facebook.com/bungalagnezdoto/',
    approved: false,
  },
];
