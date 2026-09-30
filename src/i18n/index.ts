import { bg } from './bg.ts';
import { en } from './en.ts';
import type { Locale } from '../data/types';
export const translations = { bg, en };
export const t = (locale: Locale) => translations[locale];
