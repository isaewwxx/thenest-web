import type { Photo } from './types';
import entrance from '../assets/property/entrance/nest-entrance-sign-01.jpeg';
import eveningExterior from '../assets/property/exterior/bungalow-exterior-evening-01.jpeg';
import gardenExterior from '../assets/property/exterior/bungalow-exterior-garden-01.jpeg';
import daylightExterior from '../assets/property/exterior/bungalow-exterior-daylight-01.jpeg';
import woodExterior from '../assets/property/exterior/bungalow-exterior-wood-01.jpeg';
import coveredVeranda from '../assets/property/shared/covered-veranda-01.jpeg';

// Platform-derived development copies. See docs/image-sources.md before replacing.
export const gallery: readonly Photo[] = [
  { id: 'bungalow-evening', src: eveningExterior, category: 'exterior', development: false, approved: false, alt: { bg: 'Дървено бунгало на Гнездото сред зеленина привечер', en: 'A wooden Nest bungalow among greenery at dusk' }, caption: { bg: 'Бунгалата сред зеленината', en: 'Bungalows among the greenery' } },
  { id: 'bungalow-garden', src: gardenExterior, category: 'exterior', development: false, approved: false, alt: { bg: 'Бунгала Гнездото сред градина и зеленина', en: 'The Nest bungalows among garden greenery' }, caption: { bg: 'Дърво, веранда и лято', en: 'Wood, verandas and summer' } },
  { id: 'entrance-sign', src: entrance, category: 'entrance', development: false, approved: false, alt: { bg: 'Дървеният знак на входа на Гнездото', en: 'The wooden sign at The Nest entrance' }, caption: { bg: 'Добре дошли в Гнездото', en: 'Welcome to The Nest' } },
  { id: 'covered-veranda', src: coveredVeranda, category: 'shared', development: false, approved: false, alt: { bg: 'Покрита веранда с маса в Гнездото', en: 'A covered veranda with a table at The Nest' }, caption: { bg: 'Време навън', en: 'Time outdoors' } },
  { id: 'bungalow-daylight', src: daylightExterior, category: 'exterior', development: false, approved: false, alt: { bg: 'Дървено бунгало в градината на Гнездото през деня', en: 'A wooden bungalow in The Nest garden during the day' }, caption: { bg: 'Зеленина около бунгалата', en: 'Greenery around the bungalows' } },
  { id: 'bungalow-wood', src: woodExterior, category: 'exterior', development: false, approved: false, alt: { bg: 'Дървено бунгало и веранда в Гнездото', en: 'A wooden bungalow and veranda at The Nest' }, caption: { bg: 'Своето място за лятото', en: 'A place of your own for summer' } },
];

export const heroPhoto = gallery[0]!;
