import { t } from '../i18n/index.ts';
import { buildGuestEmail, buildOwnerEmail } from './booking-email.ts';
export { buildGuestEmail, buildOwnerEmail } from './booking-email.ts';

export type BookingIntent = 'stay' | 'question';

export interface BookingEnquiry {
  intent: BookingIntent;
  checkIn?: string; // YYYY-MM-DD (required for stay)
  checkOut?: string; // YYYY-MM-DD (required for stay)
  guests?: number; // 1 to 18 (required for stay)
  accommodationPreference?: string;
  name: string;
  phone?: string;
  email: string;
  message?: string;
  locale: 'bg' | 'en';
  privacyAcknowledged: boolean;
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
  duplicate?: boolean;
}

// In-memory rate limiting and deduplication cache (30 second window)
const recentSubmissions = new Map<
  string,
  { timestamp: number; status: 'pending' | 'accepted' }
>();
const DEDUPLICATION_WINDOW_MS = 30_000;

function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of recentSubmissions.entries()) {
    if (now - entry.timestamp > DEDUPLICATION_WINDOW_MS) {
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

function parseGuestCount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return Number.NaN;
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
    guestsNum = parseGuestCount(raw.guests);

    if (!Number.isInteger(guestsNum) || guestsNum < 1 || guestsNum > 18) {
      errors.guests = messages.guestsRange;
    }
  } else if (
    raw.guests !== undefined &&
    raw.guests !== null &&
    raw.guests !== ''
  ) {
    guestsNum = parseGuestCount(raw.guests);
    if (!Number.isInteger(guestsNum) || guestsNum < 1 || guestsNum > 18) {
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

  // 7. Phone is optional, but validate it when the guest provides one.
  const rawPhone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const phoneDigits = rawPhone.replace(/\D/g, '');
  const phoneRegex = /^[\d\s\+\-\(\)\.]{7,25}$/;
  if (rawPhone && (!phoneRegex.test(rawPhone) || phoneDigits.length < 7)) {
    errors.phone = messages.phoneInvalid;
  }

  // 8. Email
  const rawEmail =
    typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  if (!rawEmail || !emailRegex.test(rawEmail) || rawEmail.length > 120) {
    errors.email = messages.emailInvalid;
  }

  // 9. Message is optional for stay enquiries and required for questions.
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

  const privacyAcknowledged =
    raw.privacyAcknowledged === true ||
    raw.privacyAcknowledged === 'true' ||
    raw.privacyAcknowledged === 'on';
  if (!privacyAcknowledged) {
    errors.privacyAcknowledged = messages.privacyRequired;
  }

  // 10. Optional free-text accommodation preference.
  const rawPreference =
    typeof raw.accommodationPreference === 'string'
      ? raw.accommodationPreference.trim()
      : '';
  const accommodationPreference = sanitizeText(rawPreference);
  if (accommodationPreference.length > 300) {
    errors.accommodationPreference = messages.preferenceTooLong;
  }

  // 11. Turnstile Token (optional anti-spam token)
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
      accommodationPreference: accommodationPreference || undefined,
      name: cleanName,
      phone: rawPhone || undefined,
      email: rawEmail,
      message: cleanMessage,
      locale,
      privacyAcknowledged,
      honeypot,
      turnstileToken,
    },
  };
}

export function checkDuplicate(enquiry: BookingEnquiry): boolean {
  cleanupCache();
  const key = submissionKey(enquiry);
  const now = Date.now();
  if (recentSubmissions.has(key)) {
    return true;
  }
  recentSubmissions.set(key, { timestamp: now, status: 'accepted' });
  return false;
}

function submissionKey(enquiry: BookingEnquiry): string {
  return enquiry.intent === 'question'
    ? `question_${enquiry.email}_${(enquiry.message || '').slice(0, 80)}`
    : `${enquiry.email}_${enquiry.checkIn}_${enquiry.checkOut}_${enquiry.guests}`;
}

function claimSubmission(
  enquiry: BookingEnquiry,
): 'new' | 'pending' | 'accepted' {
  cleanupCache();
  const key = submissionKey(enquiry);
  const existing = recentSubmissions.get(key);
  if (existing) return existing.status;
  recentSubmissions.set(key, { timestamp: Date.now(), status: 'pending' });
  return 'new';
}

function markSubmissionAccepted(enquiry: BookingEnquiry): void {
  recentSubmissions.set(submissionKey(enquiry), {
    timestamp: Date.now(),
    status: 'accepted',
  });
}

function releaseSubmission(enquiry: BookingEnquiry): void {
  recentSubmissions.delete(submissionKey(enquiry));
}

export function corsHeaders(
  requestOrigin?: string,
  configuredOriginValue?: string,
): Record<string, string> {
  const runtimeSiteUrl =
    typeof process === 'undefined' ? undefined : process.env?.PUBLIC_SITE_URL;
  const configuredOrigin = (
    configuredOriginValue ??
    runtimeSiteUrl ??
    ''
  ).replace(/\/$/, '');
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
      return {
        ok: false,
        error: `Resend API error (${res.status})`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: 'Network error sending email' };
  }
}

export async function handleBookingEnquiry(
  enquiry: BookingEnquiry,
  env: {
    RESEND_API_KEY?: string;
    BOOKING_RECIPIENT_EMAIL?: string;
    BOOKING_FROM_EMAIL?: string;
    PUBLIC_SITE_URL?: string;
  } = {},
): Promise<BookingResponse> {
  const messages = t(enquiry.locale).booking.server;
  const apiKey = env.RESEND_API_KEY;
  const ownerRecipient = env.BOOKING_RECIPIENT_EMAIL;
  const fromEmail = env.BOOKING_FROM_EMAIL;
  const addressPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  const senderAddress = fromEmail?.match(/<([^<>]+)>/)?.[1] ?? fromEmail;

  if (
    !apiKey ||
    !ownerRecipient ||
    !addressPattern.test(ownerRecipient) ||
    !fromEmail ||
    /[\r\n]/.test(fromEmail) ||
    !senderAddress ||
    !addressPattern.test(senderAddress)
  ) {
    return { ok: false, message: messages.configuration };
  }

  const submissionState = claimSubmission(enquiry);
  if (submissionState === 'accepted') {
    return { ok: true, duplicate: true, message: messages.duplicate };
  }
  if (submissionState === 'pending') {
    return { ok: false, message: messages.pending };
  }

  const ownerEmail = buildOwnerEmail(enquiry);
  const guestEmail = buildGuestEmail(enquiry);

  const ownerResult = await sendEmailViaResend(apiKey, {
    from: fromEmail,
    to: ownerRecipient,
    reply_to: enquiry.email,
    subject: ownerEmail.subject,
    text: ownerEmail.text,
    html: ownerEmail.html,
  });

  if (!ownerResult.ok) {
    releaseSubmission(enquiry);
    console.error(
      '[The Nest Booking] Owner email delivery failed:',
      ownerResult.error,
    );
    return {
      ok: false,
      message: messages.sendFailed,
    };
  }

  markSubmissionAccepted(enquiry);
  const guestResult = await sendEmailViaResend(apiKey, {
    from: fromEmail,
    to: enquiry.email,
    reply_to: ownerRecipient,
    subject: guestEmail.subject,
    text: guestEmail.text,
    html: guestEmail.html,
  });
  if (!guestResult.ok) {
    console.warn(
      '[The Nest Booking] Guest receipt delivery failed:',
      guestResult.error,
    );
  }

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
    ...corsHeaders(undefined, env.PUBLIC_SITE_URL),
    'Content-Type': 'application/json',
  };
  const requestLocale: 'bg' | 'en' =
    typeof body === 'object' &&
    body !== null &&
    'locale' in body &&
    (body as { locale?: string }).locale === 'en'
      ? 'en'
      : 'bg';
  const bookingPath = (
    status: 'success' | 'error',
    locale: 'bg' | 'en' = requestLocale,
  ) => `${locale === 'en' ? '/en' : ''}/booking?status=${status}`;

  const isHtmlRequest =
    Boolean(acceptHeader) &&
    acceptHeader!.includes('text/html') &&
    !acceptHeader!.includes('application/json');

  const successCookie = 'nest_enquiry_ok=1; Path=/; Max-Age=300; SameSite=Lax';

  if (!checkIpRateLimit(clientIp)) {
    const rateLimitMessage = t(requestLocale).booking.server.rateLimited;
    if (isHtmlRequest) {
      return new Response(null, {
        status: 303,
        headers: { ...baseHeaders, Location: bookingPath('error') },
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
            Location: bookingPath('success'),
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
        headers: { ...baseHeaders, Location: bookingPath('error') },
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

  // If either Turnstile setting is configured, require both sides of the check.
  const turnstileSecret =
    env.TURNSTILE_SECRET_KEY || env.CF_TURNSTILE_SECRET_KEY;
  const turnstileSiteKey = env.PUBLIC_TURNSTILE_SITE_KEY;
  if (turnstileSecret || turnstileSiteKey) {
    const token = validation.data.turnstileToken;
    const isHuman =
      turnstileSecret && turnstileSiteKey && token
        ? await verifyTurnstileToken(turnstileSecret, token, clientIp)
        : false;
    if (!isHuman) {
      if (isHtmlRequest) {
        return new Response(null, {
          status: 303,
          headers: { ...baseHeaders, Location: bookingPath('error') },
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
      const redirectPath = bookingPath(
        result.ok ? 'success' : 'error',
        validation.data.locale,
      );
      return new Response(null, {
        status: 303,
        headers: result.ok
          ? {
              ...baseHeaders,
              Location: redirectPath,
              'Set-Cookie': successCookie,
            }
          : { ...baseHeaders, Location: redirectPath },
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
        headers: {
          ...baseHeaders,
          Location: bookingPath(
            'error',
            validation.valid ? validation.data.locale : requestLocale,
          ),
        },
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
