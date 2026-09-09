import { bg } from './bg';
import { en } from './en';
import type { Locale } from '../data/types';
export const translations = { bg, en };
export const t = (locale: Locale) => translations[locale];
