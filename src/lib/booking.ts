import { t } from '../i18n';

export type BookingIntent = 'stay' | 'question';

export interface BookingEnquiry {
  intent: BookingIntent;
  checkIn?: string; // YYYY-MM-DD (required for stay)
  checkOut?: string; // YYYY-MM-DD (required for stay)
  guests?: number; // 1 to 18 (required for stay)
  rooms?: number;
  accommodationId?: string;
  name: string;
  phone: string;
  email: string;
  pets: boolean;
  message?: string;
  locale: 'bg' | 'en';
  honeypot?: string;
  turnstileToken?: string;
}

export interface ValidationSuccess {
  valid: true;
  data: BookingEnquiry;
}

export interface ValidationError {
  valid: false;
  errors: Record<string, string>;
}

export type ValidationResult = ValidationSuccess | ValidationError;

export interface BookingResponse {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  simulated?: boolean;
  duplicate?: boolean;
}

// In-memory rate limiting and deduplication cache (30 second window)
const recentSubmissions = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 30_000;

function cleanupCache() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      recentSubmissions.delete(key);
    }
  }
}

export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// In-memory IP rate limiting (best-effort on single isolate)
const recentByIp = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

export function checkIpRateLimit(ip: string | undefined): boolean {
  if (!ip || ip === 'unknown') return true;
  const now = Date.now();
  const stamps = (recentByIp.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (stamps.length >= RATE_LIMIT_MAX) {
    recentByIp.set(ip, stamps);
    return false;
  }
  stamps.push(now);
  recentByIp.set(ip, stamps);
  return true;
}

export function isValidISODate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const parts = str.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    !Number.isInteger(d) ||
    y < 2024 ||
    y > 2100 ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    return false;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function isDateInPast(
  dateStr: string,
  referenceDate = new Date(),
): boolean {
  // Format reference date to YYYY-MM-DD in local time
  const y = referenceDate.getFullYear();
  const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const d = String(referenceDate.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  return dateStr < todayStr;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function validateBookingEnquiry(
  input: unknown,
  referenceDate = new Date(),
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: { form: 'Invalid request payload.' } };
  }

  const raw = input as Record<string, unknown>;

  // 1. Honeypot check (anti-spam)
  const honeypot =
    typeof raw.website_trap === 'string' ? raw.website_trap.trim() : '';
  if (honeypot.length > 0) {
    // Return invalid without detail or treat as spam
    return { valid: false, errors: { spam: 'Spam detected.' } };
  }

  // 2. Locale
  const locale: 'bg' | 'en' = raw.locale === 'en' ? 'en' : 'bg';
  const messages = t(locale).booking.server;

  // 3. Intent (stay enquiry vs general question)
  const intent: BookingIntent =
    raw.intent === 'question' ||
    raw.intent === 'ask' ||
    raw.intent === 'message'
      ? 'question'
      : 'stay';
  const isQuestion = intent === 'question';

  // 4. Dates (required for stay enquiries only)
  const checkIn = typeof raw.checkIn === 'string' ? raw.checkIn.trim() : '';
  const checkOut = typeof raw.checkOut === 'string' ? raw.checkOut.trim() : '';

  if (!isQuestion) {
    if (!checkIn || !isValidISODate(checkIn)) {
      errors.checkIn = messages.checkInInvalid;
    } else if (isDateInPast(checkIn, referenceDate)) {
      errors.checkIn = messages.checkInPast;
    }

    if (!checkOut || !isValidISODate(checkOut)) {
      errors.checkOut = messages.checkOutInvalid;
    } else if (isValidISODate(checkIn) && checkOut <= checkIn) {
      errors.checkOut = messages.checkOutAfter;
    }
  } else if (checkIn || checkOut) {
    if (checkIn && !isValidISODate(checkIn)) {
      errors.checkIn = messages.checkInInvalid;
    } else if (checkIn && isDateInPast(checkIn, referenceDate)) {
      errors.checkIn = messages.checkInPast;
    }

    if (checkOut && !isValidISODate(checkOut)) {
      errors.checkOut = messages.checkOutInvalid;
    } else if (
      checkIn &&
      checkOut &&
      isValidISODate(checkIn) &&
      isValidISODate(checkOut) &&
      checkOut <= checkIn
    ) {
      errors.checkOut = messages.checkOutAfter;
    }
  }

  // 5. Guests (required for stay enquiries only)
  let guestsNum: number | undefined;
  if (!isQuestion) {
    guestsNum =
      typeof raw.guests === 'number'
        ? raw.guests
        : parseInt(String(raw.guests ?? ''), 10);

    if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 18) {
      errors.guests = messages.guestsRange;
    }
  } else if (
    raw.guests !== undefined &&
    raw.guests !== null &&
    raw.guests !== ''
  ) {
    guestsNum =
      typeof raw.guests === 'number'
        ? raw.guests
        : parseInt(String(raw.guests), 10);
    if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 18) {
      errors.guests = messages.guestsRange;
    }
  }

  // 6. Name
  const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
  const cleanName = sanitizeText(rawName);
  if (!cleanName || cleanName.length < 2) {
    errors.name = messages.nameMin;
  } else if (cleanName.length > 100) {
    errors.name = messages.nameTooLong;
  }

  // 7. Phone
  const rawPhone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const phoneDigits = rawPhone.replace(/\D/g, '');
  const phoneRegex = /^[\d\s\+\-\(\)\.]{7,25}$/;
  if (!rawPhone || !phoneRegex.test(rawPhone) || phoneDigits.length < 7) {
    errors.phone = messages.phoneInvalid;
  }

  // 8. Email
  const rawEmail =
    typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  if (!rawEmail || !emailRegex.test(rawEmail) || rawEmail.length > 120) {
    errors.email = messages.emailInvalid;
  }

  // 9. Pets
  const pets =
    raw.pets === true ||
    raw.pets === 'true' ||
    raw.pets === 'yes' ||
    raw.pets === 'da';

  // 10. Message (required for general questions)
  const rawMessage = typeof raw.message === 'string' ? raw.message.trim() : '';
  const cleanMessage = sanitizeText(rawMessage);
  if (isQuestion) {
    if (!cleanMessage || cleanMessage.length < 5) {
      errors.message = messages.messageRequired;
    } else if (cleanMessage.length > 1000) {
      errors.message = messages.messageTooLong;
    }
  } else if (cleanMessage.length > 1000) {
    errors.message = messages.messageTooLong;
  }

  // 11. Rooms (optional: 1 to 6)
  let roomsNum: number | undefined;
  if (raw.rooms !== undefined && raw.rooms !== null && raw.rooms !== '') {
    roomsNum =
      typeof raw.rooms === 'number'
        ? raw.rooms
        : parseInt(String(raw.rooms), 10);
    if (isNaN(roomsNum) || roomsNum < 1 || roomsNum > 6) {
      errors.rooms = messages.roomsRange;
    }
  }

  // 12. Accommodation ID
  const accommodationId =
    typeof raw.accommodationId === 'string'
      ? sanitizeText(raw.accommodationId)
      : isQuestion
        ? undefined
        : 'bungalow-room';

  // 13. Turnstile Token (optional anti-spam token)
  const turnstileToken =
    typeof raw.turnstileToken === 'string'
      ? raw.turnstileToken.trim()
      : typeof raw['cf-turnstile-response'] === 'string'
        ? String(raw['cf-turnstile-response']).trim()
        : undefined;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      intent,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guestsNum,
      rooms: roomsNum,
      accommodationId,
      name: cleanName,
      phone: rawPhone,
      email: rawEmail,
      pets,
      message: cleanMessage,
      locale,
      honeypot,
      turnstileToken,
    },
  };
}

export function checkDuplicate(enquiry: BookingEnquiry): boolean {
  cleanupCache();
  const key =
    enquiry.intent === 'question'
      ? `question_${enquiry.email}_${(enquiry.message || '').slice(0, 80)}`
      : `${enquiry.email}_${enquiry.checkIn}_${enquiry.checkOut}_${enquiry.guests}`;
  const now = Date.now();
  if (recentSubmissions.has(key)) {
    return true;
  }
  recentSubmissions.set(key, now);
  return false;
}

export function buildOwnerEmail(enquiry: BookingEnquiry): {
  subject: string;
  text: string;
  html: string;
} {
  const isQuestion = enquiry.intent === 'question';
  const nights =
    enquiry.checkIn && enquiry.checkOut
      ? calculateNights(enquiry.checkIn, enquiry.checkOut)
      : 0;

  const subject = isQuestion
    ? `Нов въпрос от сайта · ${enquiry.name}`
    : `Ново запитване: ${enquiry.checkIn} – ${enquiry.checkOut} (${nights} нощ.) · ${enquiry.guests} гости`;

  const roomLabel =
    enquiry.accommodationId === 'bungalow-room'
      ? 'Самостоятелна стая в бунгало (до 3 гости)'
      : enquiry.accommodationId || 'Всички свободни стаи';

  const roomsRequestedText = enquiry.rooms
    ? `${enquiry.rooms} ${enquiry.rooms === 1 ? 'стая' : 'стаи'} (${roomLabel})`
    : roomLabel;

  const petsText = enquiry.pets ? 'Да (с домашен любимец)' : 'Не';
  const safeName = escapeHtml(enquiry.name);
  const safePhone = escapeHtml(enquiry.phone);
  const safeEmail = escapeHtml(enquiry.email);
  const safeMessage = enquiry.message
    ? escapeHtml(enquiry.message)
    : '<em>Гостът не е оставил допълнително съобщение.</em>';
  const safeRooms = escapeHtml(roomsRequestedText);
  const sentAt = new Date().toLocaleString('bg-BG', {
    timeZone: 'Europe/Sofia',
  });

  if (isQuestion) {
    const text = `
НОВ ВЪПРОС ОТ САЙТА НА БУНГАЛА „ГНЕЗДОТО“
========================================

ДАННИ ЗА КОНТАКТ:
-----------------
• Име: ${enquiry.name}
• Телефон: ${enquiry.phone}
• Имейл: ${enquiry.email}
• Език на формата: ${enquiry.locale.toUpperCase()}

ВЪПРОС / СЪОБЩЕНИЕ:
-------------------
${enquiry.message || '— Няма въведено съобщение —'}

Време на изпращане: ${sentAt} (Българско време)
`.trim();

    const html = `
<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #213529; background-color: #f7f5ed; margin: 0; padding: 24px; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #dcd8c8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .header { background: #254d3a; color: #f5f2e9; padding: 24px 28px; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
  .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
  .content { padding: 0 24px 24px; }
  .grid { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .grid td { padding: 10px 12px; border-bottom: 1px solid #edebe1; font-size: 14px; }
  .grid td.label { width: 38%; font-weight: 600; color: #566359; }
  .grid td.value { color: #1a2a20; font-weight: 500; }
  .message-box { background: #f9f8f2; border: 1px solid #e5e2d5; border-radius: 6px; padding: 16px; margin-top: 16px; font-size: 14px; white-space: pre-wrap; }
  .actions { display: flex; gap: 12px; margin-top: 24px; }
  .btn { display: inline-block; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .btn-call { background: #254d3a; color: #ffffff; }
  .btn-email { background: #f5f2e9; color: #254d3a; border: 1px solid #254d3a; }
  .footer { border-top: 1px solid #edebe1; padding: 16px 24px; font-size: 12px; color: #768379; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Бунгала „Гнездото“ · Лозенец</h1>
    <p>Нов въпрос от уебсайта</p>
  </div>
  <div class="content">
    <table class="grid">
      <tr><td class="label">Име:</td><td class="value"><strong>${safeName}</strong></td></tr>
      <tr><td class="label">Телефон:</td><td class="value"><a href="tel:${safePhone}">${safePhone}</a></td></tr>
      <tr><td class="label">Имейл:</td><td class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
      <tr><td class="label">Език на формата:</td><td class="value">${enquiry.locale.toUpperCase()}</td></tr>
    </table>

    <div style="margin-top: 20px;">
      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; color: #566359; letter-spacing: 0.05em;">Въпрос / съобщение:</div>
      <div class="message-box">${safeMessage}</div>
    </div>

    <div class="actions">
      <a class="btn btn-call" href="tel:${safePhone}">Обади се: ${safePhone}</a>
      <a class="btn btn-email" href="mailto:${safeEmail}?subject=${encodeURIComponent(`Относно вашия въпрос към бунгала Гнездото`)}">Отговори по имейл</a>
    </div>
  </div>
  <div class="footer">
    Гнездото, ул. Осогово 12, 8277 Лозенец · Изпратено през официалния сайт
  </div>
</div>
</body>
</html>
`.trim();

    return { subject, text, html };
  }

  const text = `
НОВО ДИРЕКТНО ЗАПИТВАНЕ ЗА НАСТАНЯВАНЕ В БУНГАЛА „ГНЕЗДОТО“
===========================================================

ВАЖНО: Това е запитване за наличност, НЕ е потвърдена резервация!
Свържете се с госта, за да уточните свободни стаи, актуална цена и капаро.

ДЕТАЙЛИ НА ЗАПИТВАНЕТО:
------------------------
• Период: ${enquiry.checkIn} до ${enquiry.checkOut} (${nights} нощувки)
• Брой гости: ${enquiry.guests}
• Заявени стаи / помещение: ${roomsRequestedText}
• Домашни любимци: ${petsText}

ДАННИ ЗА КОНТАКТ С ГОСТА:
-------------------------
• Име: ${enquiry.name}
• Телефон: ${enquiry.phone}
• Имейл: ${enquiry.email}
• Език на запитването: ${enquiry.locale.toUpperCase()}

СЪОБЩЕНИЕ ОТ ГОСТА:
-------------------
${enquiry.message || '— Няма въведено допълнително съобщение —'}

Време на изпращане: ${sentAt} (Българско време)
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #213529; background-color: #f7f5ed; margin: 0; padding: 24px; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #dcd8c8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .header { background: #254d3a; color: #f5f2e9; padding: 24px 28px; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
  .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
  .alert-box { background: #fef7e7; border-left: 4px solid #b87438; padding: 14px 20px; margin: 20px 24px; font-size: 14px; color: #6d4118; border-radius: 2px; }
  .content { padding: 0 24px 24px; }
  .grid { width: 100%; border-collapse: collapse; margin-top: 12px; }
  .grid td { padding: 10px 12px; border-bottom: 1px solid #edebe1; font-size: 14px; }
  .grid td.label { width: 38%; font-weight: 600; color: #566359; }
  .grid td.value { color: #1a2a20; font-weight: 500; }
  .message-box { background: #f9f8f2; border: 1px solid #e5e2d5; border-radius: 6px; padding: 16px; margin-top: 16px; font-size: 14px; white-space: pre-wrap; }
  .actions { display: flex; gap: 12px; margin-top: 24px; }
  .btn { display: inline-block; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .btn-call { background: #254d3a; color: #ffffff; }
  .btn-email { background: #f5f2e9; color: #254d3a; border: 1px solid #254d3a; }
  .footer { border-top: 1px solid #edebe1; padding: 16px 24px; font-size: 12px; color: #768379; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Бунгала „Гнездото“ · Лозенец</h1>
    <p>Ново директно запитване от уебсайта</p>
  </div>
  <div class="alert-box">
    <strong>Това е запитване за наличност, не автоматична резервация.</strong><br>
    Моля, свържете се с госта, за да потвърдите дали датите са свободни и актуалната цена.
  </div>
  <div class="content">
    <table class="grid">
      <tr><td class="label">Дати на престоя:</td><td class="value"><strong>${enquiry.checkIn}</strong> до <strong>${enquiry.checkOut}</strong> (${nights} нощувки)</td></tr>
      <tr><td class="label">Брой гости:</td><td class="value">${enquiry.guests}</td></tr>
      <tr><td class="label">Заявени стаи:</td><td class="value">${safeRooms}</td></tr>
      <tr><td class="label">Домашни любимци:</td><td class="value">${petsText}</td></tr>
      <tr><td class="label">Име на госта:</td><td class="value"><strong>${safeName}</strong></td></tr>
      <tr><td class="label">Телефон:</td><td class="value"><a href="tel:${safePhone}">${safePhone}</a></td></tr>
      <tr><td class="label">Имейл:</td><td class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
      <tr><td class="label">Език на формата:</td><td class="value">${enquiry.locale.toUpperCase()}</td></tr>
    </table>

    <div style="margin-top: 20px;">
      <div style="font-weight: 600; font-size: 13px; text-transform: uppercase; color: #566359; letter-spacing: 0.05em;">Съобщение от госта:</div>
      <div class="message-box">${safeMessage}</div>
    </div>

    <div class="actions">
      <a class="btn btn-call" href="tel:${safePhone}">Обади се: ${safePhone}</a>
      <a class="btn btn-email" href="mailto:${safeEmail}?subject=${encodeURIComponent(`Относно вашето запитване за бунгала Гнездото (${enquiry.checkIn} – ${enquiry.checkOut})`)}">Отговори по имейл</a>
    </div>
  </div>
  <div class="footer">
    Гнездото, ул. Осогово 12, 8277 Лозенец · Изпратено през официалния сайт
  </div>
</div>
</body>
</html>
`.trim();

  return { subject, text, html };
}

export function buildGuestEmail(enquiry: BookingEnquiry): {
  subject: string;
  text: string;
  html: string;
} {
  const isBg = enquiry.locale === 'bg';
  const isQuestion = enquiry.intent === 'question';
  const nights =
    enquiry.checkIn && enquiry.checkOut
      ? calculateNights(enquiry.checkIn, enquiry.checkOut)
      : 0;
  const safeName = escapeHtml(enquiry.name);
  const safeMessage = enquiry.message
    ? escapeHtml(enquiry.message)
    : isBg
      ? '<em>Няма въведено съобщение.</em>'
      : '<em>No message provided.</em>';

  if (isQuestion) {
    const subject = isBg
      ? 'Получихме съобщението ви за Гнездото, Лозенец'
      : 'We received your message for The Nest, Lozenets';

    const text = isBg
      ? `
Здравейте, ${enquiry.name}!

Благодарим ви, че ни писахте.

Получихме вашето съобщение:
„${enquiry.message || '—'}“

Ще се свържем с вас скоро по телефон или имейл.

Ако предпочитате да се чуем веднага:
Телефон: +359 877 116 050

Сърдечни поздрави,
Екипът на бунгала „Гнездото“
ул. „Осогово“ 12, 8277 с. Лозенец, България
`.trim()
      : `
Hello, ${enquiry.name}!

Thank you for writing to us.

We received your message:
"${enquiry.message || '—'}"

We will get back to you shortly by phone or email.

If you prefer to talk right away:
Telephone: +359 877 116 050

Warm regards,
The Nest Bungalows
12 Osogovo Street, 8277 Lozenets, Bulgaria
`.trim();

    const html = isBg
      ? `
<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #213529; background-color: #f7f5ed; margin: 0; padding: 24px; }
  .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #dcd8c8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .header { background: #254d3a; color: #f5f2e9; padding: 28px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
  .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
  .content { padding: 28px; }
  .message-box { background: #fbfaf6; border: 1px solid #ece8db; border-radius: 6px; padding: 18px 20px; margin: 20px 0; font-size: 14px; white-space: pre-wrap; }
  .phone-cta { text-align: center; margin: 28px 0 12px; }
  .btn { display: inline-block; padding: 12px 24px; background: #254d3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .footer { border-top: 1px solid #edebe1; padding: 18px 24px; font-size: 12px; color: #768379; text-align: center; background: #fbfaf6; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Бунгала „Гнездото“ · Лозенец</h1>
    <p>Вашето спокойно място край морето</p>
  </div>
  <div class="content">
    <p style="font-size: 16px; margin-top: 0;"><strong>Здравейте, ${safeName}!</strong></p>
    <p>Благодарим ви, че ни писахте. Получихме вашето съобщение и ще ви отговорим скоро.</p>
    <div class="message-box">${safeMessage}</div>
    <p>Ако предпочитате директен разговор, можете да ни потърсите по всяко време:</p>
    <div class="phone-cta">
      <a class="btn" href="tel:+359877116050">Обадете ни се: 0877 116 050</a>
    </div>
  </div>
  <div class="footer">
    Бунгала „Гнездото“ · ул. Осогово 12, с. Лозенец, Община Царево, България<br>
    <a href="tel:+359877116050" style="color: #254d3a; text-decoration: none;">+359 877 116 050</a>
  </div>
</div>
</body>
</html>
`.trim()
      : `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #213529; background-color: #f7f5ed; margin: 0; padding: 24px; }
  .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #dcd8c8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .header { background: #254d3a; color: #f5f2e9; padding: 28px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
  .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
  .content { padding: 28px; }
  .message-box { background: #fbfaf6; border: 1px solid #ece8db; border-radius: 6px; padding: 18px 20px; margin: 20px 0; font-size: 14px; white-space: pre-wrap; }
  .phone-cta { text-align: center; margin: 28px 0 12px; }
  .btn { display: inline-block; padding: 12px 24px; background: #254d3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .footer { border-top: 1px solid #edebe1; padding: 18px 24px; font-size: 12px; color: #768379; text-align: center; background: #fbfaf6; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>The Nest Bungalows · Lozenets</h1>
    <p>Your quiet place by the sea</p>
  </div>
  <div class="content">
    <p style="font-size: 16px; margin-top: 0;"><strong>Hello, ${safeName}!</strong></p>
    <p>Thank you for writing to us. We received your message and will reply shortly.</p>
    <div class="message-box">${safeMessage}</div>
    <p>If you prefer to talk directly, you can call us anytime:</p>
    <div class="phone-cta">
      <a class="btn" href="tel:+359877116050">Call us: +359 877 116 050</a>
    </div>
  </div>
  <div class="footer">
    The Nest Bungalows · 12 Osogovo Street, 8277 Lozenets, Bulgaria<br>
    <a href="tel:+359877116050" style="color: #254d3a; text-decoration: none;">+359 877 116 050</a>
  </div>
</div>
</body>
</html>
`.trim();

    return { subject, text, html };
  }

  const subject = isBg
    ? `Получихме запитването ви за Гнездото, Лозенец (${enquiry.checkIn} – ${enquiry.checkOut})`
    : `We received your enquiry for The Nest, Lozenets (${enquiry.checkIn} – ${enquiry.checkOut})`;

  const petsText = isBg
    ? enquiry.pets
      ? 'Да (с домашен любимец)'
      : 'Не'
    : enquiry.pets
      ? 'Yes (with pet)'
      : 'No';

  const text = isBg
    ? `
Здравейте, ${enquiry.name}!

Благодарим ви за интереса към бунгала „Гнездото“ в с. Лозенец.

Получихме вашето директно запитване за следния престой:
• Дати: ${enquiry.checkIn} до ${enquiry.checkOut} (${nights} нощувки)
• Брой гости: ${enquiry.guests}
${enquiry.rooms ? `• Брой стаи: ${enquiry.rooms}\n` : ''}• Домашни любимци: ${petsText}

ВАЖНА ИНФОРМАЦИЯ:
Това все още не е автоматично потвърдена резервация.
Ние управляваме резервациите лично и внимателно. В най-кратък срок ще се свържем с вас (по телефон или имейл), за да потвърдим:
1. Наличността на свободни бунгала за избраните от вас дати
2. Актуалната крайна цена за сезон 2026
3. Условията за капаро и детайлите по вашето пристигане

Ако имате спешни въпроси или предпочитате да се чуем веднага, можете да ни потърсите на:
Телефон: +359 877 116 050

Очакваме ви с радост край морето!

Сърдечни поздрави,
Екипът на бунгала „Гнездото“
ул. „Осогово“ 12, 8277 с. Лозенец, България
`.trim()
    : `
Hello, ${enquiry.name}!

Thank you for your interest in The Nest Bungalows in Lozenets.

We have received your direct stay enquiry:
• Dates: ${enquiry.checkIn} to ${enquiry.checkOut} (${nights} nights)
• Guests: ${enquiry.guests}
${enquiry.rooms ? `• Rooms: ${enquiry.rooms}\n` : ''}• Pets: ${petsText}

IMPORTANT NOTE:
This is an enquiry request and not yet an automated confirmed booking.
We personally manage all bookings to ensure the highest care. We will contact you shortly by phone or email to confirm:
1. Availability of cabins for your desired dates
2. Current seasonal rate for 2026
3. Deposit terms and arrival details

If you prefer to reach us right away, feel free to call us directly:
Telephone: +359 877 116 050

We look forward to welcoming you by the sea!

Warm regards,
The Nest Bungalows
12 Osogovo Street, 8277 Lozenets, Bulgaria
`.trim();

  const html = isBg
    ? `
<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #213529; background-color: #f7f5ed; margin: 0; padding: 24px; }
  .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #dcd8c8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .header { background: #254d3a; color: #f5f2e9; padding: 28px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
  .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
  .content { padding: 28px; }
  .notice { background: #f4f7f2; border: 1px solid #cfddcb; border-radius: 6px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #254d3a; }
  .details-box { background: #fbfaf6; border: 1px solid #ece8db; border-radius: 6px; padding: 18px 20px; margin: 20px 0; }
  .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e5e1d3; font-size: 14px; }
  .details-row:last-child { border-bottom: none; }
  .phone-cta { text-align: center; margin: 28px 0 12px; }
  .btn { display: inline-block; padding: 12px 24px; background: #254d3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .footer { border-top: 1px solid #edebe1; padding: 18px 24px; font-size: 12px; color: #768379; text-align: center; background: #fbfaf6; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Бунгала „Гнездото“ · Лозенец</h1>
    <p>Вашето спокойно място край морето</p>
  </div>
  <div class="content">
    <p style="font-size: 16px; margin-top: 0;"><strong>Здравейте, ${safeName}!</strong></p>
    <p>Благодарим ви, че се свързахте с нас. Получихме вашето запитване за почивка в Гнездото.</p>

    <div class="details-box">
      <div style="font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #566359; margin-bottom: 8px;">Данни от вашето запитване:</div>
      <div class="details-row"><span>Настаняване:</span><strong>${enquiry.checkIn}</strong></div>
      <div class="details-row"><span>Напускане:</span><strong>${enquiry.checkOut}</strong></div>
      <div class="details-row"><span>Нощувки:</span><strong>${nights}</strong></div>
      <div class="details-row"><span>Брой гости:</span><strong>${enquiry.guests}</strong></div>
      ${enquiry.rooms ? `<div class="details-row"><span>Брой стаи:</span><strong>${enquiry.rooms}</strong></div>` : ''}
      <div class="details-row"><span>Домашни любимци:</span><strong>${petsText}</strong></div>
    </div>

    <div class="notice">
      <strong>Това все още не е потвърдена резервация.</strong><br>
      Ние управляваме настаняването лично. Ще се свържем с вас в най-кратък срок по телефон или имейл, за да потвърдим свободните места и актуалната цена за сезон 2026.
    </div>

    <p>Ако предпочитате директен разговор или имате спешен въпрос, можете да ни потърсите по всяко време:</p>

    <div class="phone-cta">
      <a class="btn" href="tel:+359877116050">Обадете ни се: 0877 116 050</a>
    </div>
  </div>
  <div class="footer">
    Бунгала „Гнездото“ · ул. Осогово 12, с. Лозенец, Община Царево, България<br>
    <a href="tel:+359877116050" style="color: #254d3a; text-decoration: none;">+359 877 116 050</a>
  </div>
</div>
</body>
</html>
`.trim()
    : `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #213529; background-color: #f7f5ed; margin: 0; padding: 24px; }
  .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #dcd8c8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .header { background: #254d3a; color: #f5f2e9; padding: 28px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
  .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
  .content { padding: 28px; }
  .notice { background: #f4f7f2; border: 1px solid #cfddcb; border-radius: 6px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #254d3a; }
  .details-box { background: #fbfaf6; border: 1px solid #ece8db; border-radius: 6px; padding: 18px 20px; margin: 20px 0; }
  .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e5e1d3; font-size: 14px; }
  .details-row:last-child { border-bottom: none; }
  .phone-cta { text-align: center; margin: 28px 0 12px; }
  .btn { display: inline-block; padding: 12px 24px; background: #254d3a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .footer { border-top: 1px solid #edebe1; padding: 18px 24px; font-size: 12px; color: #768379; text-align: center; background: #fbfaf6; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>The Nest Bungalows · Lozenets</h1>
    <p>Your quiet place by the sea</p>
  </div>
  <div class="content">
    <p style="font-size: 16px; margin-top: 0;"><strong>Hello, ${safeName}!</strong></p>
    <p>Thank you for reaching out to us. We have received your stay enquiry for The Nest.</p>

    <div class="details-box">
      <div style="font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #566359; margin-bottom: 8px;">Your Enquiry Summary:</div>
      <div class="details-row"><span>Check-in:</span><strong>${enquiry.checkIn}</strong></div>
      <div class="details-row"><span>Check-out:</span><strong>${enquiry.checkOut}</strong></div>
      <div class="details-row"><span>Nights:</span><strong>${nights}</strong></div>
      <div class="details-row"><span>Guests:</span><strong>${enquiry.guests}</strong></div>
      ${enquiry.rooms ? `<div class="details-row"><span>Rooms:</span><strong>${enquiry.rooms}</strong></div>` : ''}
      <div class="details-row"><span>Pets:</span><strong>${petsText}</strong></div>
    </div>

    <div class="notice">
      <strong>This is not yet a confirmed booking.</strong><br>
      We handle reservations personally. We will contact you shortly by phone or email to confirm available cabins and the rate for season 2026.
    </div>

    <p>If you prefer to talk directly or have urgent questions, you can call us anytime:</p>

    <div class="phone-cta">
      <a class="btn" href="tel:+359877116050">Call us: +359 877 116 050</a>
    </div>
  </div>
  <div class="footer">
    The Nest Bungalows · 12 Osogovo Street, 8277 Lozenets, Bulgaria<br>
    <a href="tel:+359877116050" style="color: #254d3a; text-decoration: none;">+359 877 116 050</a>
  </div>
</div>
</body>
</html>
`.trim();

  return { subject, text, html };
}

export function corsHeaders(requestOrigin?: string): Record<string, string> {
  const configuredOrigin = (process.env.PUBLIC_SITE_URL || '').replace(
    /\/$/,
    '',
  );
  let allowOrigin = '*';
  if (configuredOrigin) {
    allowOrigin =
      requestOrigin && requestOrigin.replace(/\/$/, '') === configuredOrigin
        ? requestOrigin
        : configuredOrigin;
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function verifyTurnstileToken(
  secretKey: string,
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  if (!token || !secretKey) return false;
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      },
    );

    if (!res.ok) return false;
    const outcome = (await res.json()) as { success?: boolean };
    return outcome.success === true;
  } catch {
    return false;
  }
}

export async function sendEmailViaResend(
  apiKey: string,
  payload: {
    from: string;
    to: string;
    reply_to?: string;
    subject: string;
    text: string;
    html: string;
  },
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        error: `Resend API error (${res.status}): ${errText}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Network error sending email: ${msg}` };
  }
}

export async function handleBookingEnquiry(
  enquiry: BookingEnquiry,
  env: {
    RESEND_API_KEY?: string;
    BOOKING_RECIPIENT_EMAIL?: string;
    BOOKING_FROM_EMAIL?: string;
  } = {},
): Promise<BookingResponse> {
  const messages = t(enquiry.locale).booking.server;

  // Check duplicate
  if (checkDuplicate(enquiry)) {
    return {
      ok: true,
      duplicate: true,
      message: messages.duplicate,
    };
  }

  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const ownerRecipient =
    env.BOOKING_RECIPIENT_EMAIL ||
    process.env.BOOKING_RECIPIENT_EMAIL ||
    'bungala.gnezdoto@gmail.com';
  const fromEmail =
    env.BOOKING_FROM_EMAIL ||
    process.env.BOOKING_FROM_EMAIL ||
    'The Nest <onboarding@resend.dev>';

  const ownerEmail = buildOwnerEmail(enquiry);
  const guestEmail = buildGuestEmail(enquiry);

  if (!apiKey) {
    // Development / Test mode: log and return success without failing
    console.log('[The Nest Booking Dev] Simulated enquiry dispatch:');
    console.log(`- To Owner (${ownerRecipient}): ${ownerEmail.subject}`);
    console.log(`- To Guest (${enquiry.email}): ${guestEmail.subject}`);
    return {
      ok: true,
      simulated: true,
      message: messages.sentDev,
    };
  }

  // Send to owner
  const ownerResult = await sendEmailViaResend(apiKey, {
    from: fromEmail,
    to: ownerRecipient,
    reply_to: enquiry.email,
    subject: ownerEmail.subject,
    text: ownerEmail.text,
    html: ownerEmail.html,
  });

  if (!ownerResult.ok) {
    console.error(
      '[The Nest Booking] Failed to send owner email:',
      ownerResult.error,
    );
    return {
      ok: false,
      message: messages.sendFailed,
    };
  }

  // Send guest confirmation with reply_to set to the owner so direct replies go to host
  sendEmailViaResend(apiKey, {
    from: fromEmail,
    to: enquiry.email,
    reply_to: ownerRecipient,
    subject: guestEmail.subject,
    text: guestEmail.text,
    html: guestEmail.html,
  }).catch((err) => {
    console.warn(
      '[The Nest Booking] Failed to send guest confirmation email:',
      err,
    );
  });

  return {
    ok: true,
    message: messages.sent,
  };
}

export async function processBookingRequest(
  body: unknown,
  env: Record<string, string | undefined> = {},
  referenceDate = new Date(),
  clientIp?: string,
  acceptHeader?: string,
): Promise<Response> {
  const validation = validateBookingEnquiry(body, referenceDate);
  const baseHeaders = {
    ...corsHeaders(),
    'Content-Type': 'application/json',
  };

  const isHtmlRequest =
    Boolean(acceptHeader) &&
    acceptHeader!.includes('text/html') &&
    !acceptHeader!.includes('application/json');

  const successCookie = 'nest_enquiry_ok=1; Path=/; Max-Age=300; SameSite=Lax';

  if (!checkIpRateLimit(clientIp)) {
    const localeGuess =
      typeof body === 'object' &&
      body !== null &&
      'locale' in body &&
      (body as { locale?: string }).locale === 'en'
        ? 'en'
        : 'bg';
    const rateLimitMessage = t(localeGuess).booking.server.rateLimited;
    if (isHtmlRequest) {
      return new Response(null, {
        status: 303,
        headers: { ...baseHeaders, Location: '/booking?status=error' },
      });
    }
    return new Response(
      JSON.stringify({
        ok: false,
        message: rateLimitMessage,
      }),
      { status: 429, headers: baseHeaders },
    );
  }

  if (!validation.valid) {
    // If honeypot caught spam, return polite 200 without doing work
    if (validation.errors.spam) {
      if (isHtmlRequest) {
        return new Response(null, {
          status: 303,
          headers: {
            ...baseHeaders,
            Location: '/booking?status=success',
            'Set-Cookie': successCookie,
          },
        });
      }
      return new Response(
        JSON.stringify({ ok: true, message: 'Enquiry received.' }),
        { status: 200, headers: baseHeaders },
      );
    }
    if (isHtmlRequest) {
      return new Response(null, {
        status: 303,
        headers: { ...baseHeaders, Location: '/booking?status=error' },
      });
    }
    return new Response(
      JSON.stringify({
        ok: false,
        message: 'Validation failed',
        errors: validation.errors,
      }),
      { status: 400, headers: baseHeaders },
    );
  }

  // Turnstile verification if secret key is present in env
  const turnstileSecret =
    env.TURNSTILE_SECRET_KEY || env.CF_TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const token = validation.data.turnstileToken;
    const isHuman = token
      ? await verifyTurnstileToken(turnstileSecret, token, clientIp)
      : false;
    if (!isHuman) {
      if (isHtmlRequest) {
        return new Response(null, {
          status: 303,
          headers: { ...baseHeaders, Location: '/booking?status=error' },
        });
      }
      return new Response(
        JSON.stringify({
          ok: false,
          message: 'Anti-spam verification failed',
          errors: {
            turnstile: t(validation.data.locale).booking.server.turnstileFailed,
          },
        }),
        { status: 400, headers: baseHeaders },
      );
    }
  }

  try {
    const result = await handleBookingEnquiry(validation.data, env);
    if (isHtmlRequest) {
      const redirectPath =
        validation.data.locale === 'en'
          ? '/en/booking?status=success'
          : '/booking?status=success';
      return new Response(null, {
        status: 303,
        headers: {
          ...baseHeaders,
          Location: redirectPath,
          'Set-Cookie': successCookie,
        },
      });
    }
    return new Response(JSON.stringify(result), {
      status: result.ok ? 200 : 500,
      headers: baseHeaders,
    });
  } catch (err: unknown) {
    console.error('[The Nest Booking] Unhandled booking error:', err);
    if (isHtmlRequest) {
      return new Response(null, {
        status: 303,
        headers: { ...baseHeaders, Location: '/booking?status=error' },
      });
    }
    return new Response(
      JSON.stringify({
        ok: false,
        message: 'Internal server error while processing booking request.',
      }),
      { status: 500, headers: baseHeaders },
    );
  }
}
