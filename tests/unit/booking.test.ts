import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateNights,
  checkDuplicate,
  checkIpRateLimit,
  corsHeaders,
  escapeHtml,
  handleBookingEnquiry,
  isDateInPast,
  isValidISODate,
  processBookingRequest,
  sendEmailViaResend,
  validateBookingEnquiry,
  verifyTurnstileToken,
  type BookingEnquiry,
} from '../../src/lib/booking';

const referenceDate = new Date('2026-07-01T12:00:00Z');
const emailEnvironment = {
  RESEND_API_KEY: 'test-api-key',
  BOOKING_RECIPIENT_EMAIL: 'owner@example.com',
  BOOKING_FROM_EMAIL: 'The Nest <verified@example.com>',
};

const stay: BookingEnquiry = {
  intent: 'stay',
  checkIn: '2026-07-15',
  checkOut: '2026-07-20',
  guests: 2,
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  locale: 'bg',
  privacyAcknowledged: true,
  accommodationPreference: 'Quiet garden side',
  message: 'Пристигаме около 15:00 часа.',
};

const question: BookingEnquiry = {
  intent: 'question',
  name: 'Sarah Jenkins',
  email: 'sarah@example.com',
  message: 'Can we arrive after 21:00?',
  locale: 'en',
  privacyAcknowledged: true,
};

function mockedEmailResponse(id: string) {
  return {
    ok: true,
    json: async () => ({ id }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('booking enquiry validation', () => {
  it('requires requested dates and guest count for a stay enquiry', () => {
    const result = validateBookingEnquiry(stay, referenceDate);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.intent).toBe('stay');
      expect(result.data.guests).toBe(2);
      expect(result.data.checkIn).toBe('2026-07-15');
      expect(result.data.phone).toBeUndefined();
    }

    const missing = validateBookingEnquiry(
      { ...stay, checkIn: '', checkOut: '', guests: '' },
      referenceDate,
    );
    expect(missing.valid).toBe(false);
    if (!missing.valid) {
      expect(missing.errors.checkIn).toBeDefined();
      expect(missing.errors.checkOut).toBeDefined();
      expect(missing.errors.guests).toBeDefined();
    }
  });

  it('allows general questions without stay dates, guests or a phone number', () => {
    const result = validateBookingEnquiry(question, referenceDate);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.intent).toBe('question');
      expect(result.data.checkIn).toBeUndefined();
      expect(result.data.checkOut).toBeUndefined();
      expect(result.data.guests).toBeUndefined();
      expect(result.data.phone).toBeUndefined();
    }
  });

  it('requires a privacy acknowledgement at the server boundary', () => {
    expect(
      validateBookingEnquiry(
        { ...stay, privacyAcknowledged: undefined },
        referenceDate,
      ),
    ).toMatchObject({
      valid: false,
      errors: { privacyAcknowledged: expect.any(String) },
    });
    expect(
      validateBookingEnquiry(
        { ...question, privacyAcknowledged: 'true' },
        referenceDate,
      ).valid,
    ).toBe(true);
    expect(
      validateBookingEnquiry(
        { ...question, privacyAcknowledged: 'on' },
        referenceDate,
      ).valid,
    ).toBe(true);
  });

  it('rejects malformed payloads and treats the honeypot as spam', () => {
    expect(validateBookingEnquiry(null, referenceDate)).toMatchObject({
      valid: false,
      errors: { form: expect.any(String) },
    });
    expect(
      validateBookingEnquiry(
        { ...stay, website_trap: '  bot  ' },
        referenceDate,
      ),
    ).toMatchObject({ valid: false, errors: { spam: expect.any(String) } });
    expect(
      validateBookingEnquiry({ ...stay, website_trap: 42 }, referenceDate)
        .valid,
    ).toBe(true);
  });

  it('validates partial dates and optional guest counts on general questions', () => {
    expect(
      validateBookingEnquiry(
        { ...question, checkIn: 'not-a-date' },
        referenceDate,
      ),
    ).toMatchObject({
      valid: false,
      errors: { checkIn: expect.any(String) },
    });
    expect(
      validateBookingEnquiry(
        { ...question, checkOut: 'not-a-date' },
        referenceDate,
      ),
    ).toMatchObject({
      valid: false,
      errors: { checkOut: expect.any(String) },
    });
    expect(
      validateBookingEnquiry(
        { ...question, checkIn: '2026-07-15', guests: 19 },
        referenceDate,
      ),
    ).toMatchObject({
      valid: false,
      errors: { guests: expect.any(String) },
    });
  });

  it('requires whole guest counts rather than parsing a valid numeric prefix', () => {
    for (const guests of ['2abc', '2.9', 2.5]) {
      expect(
        validateBookingEnquiry({ ...stay, guests }, referenceDate),
      ).toMatchObject({
        valid: false,
        errors: { guests: expect.any(String) },
      });
    }
    expect(
      validateBookingEnquiry({ ...stay, guests: ' 2 ' }, referenceDate).valid,
    ).toBe(true);
  });

  it('requires a message for a general question but permits an empty stay message', () => {
    expect(
      validateBookingEnquiry({ ...question, message: '' }, referenceDate),
    ).toMatchObject({ valid: false, errors: { message: expect.any(String) } });
    const result = validateBookingEnquiry(
      { ...stay, message: '' },
      referenceDate,
    );
    expect(result.valid).toBe(true);
  });

  it('normalizes email and accepts an optional accommodation preference', () => {
    const result = validateBookingEnquiry(
      {
        ...stay,
        email: '  IVAN@EXAMPLE.COM  ',
        accommodationPreference: '  Quiet garden side  ',
      },
      referenceDate,
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.email).toBe('ivan@example.com');
      expect(result.data.accommodationPreference).toBe('Quiet garden side');
    }
  });

  it('validates an optional phone only when supplied', () => {
    expect(
      validateBookingEnquiry({ ...stay, phone: '' }, referenceDate).valid,
    ).toBe(true);
    const result = validateBookingEnquiry(
      { ...stay, phone: '123' },
      referenceDate,
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.phone).toBeDefined();
  });

  it('rejects invalid email, past dates, invalid ranges and out-of-range guest counts', () => {
    expect(
      validateBookingEnquiry({ ...stay, email: 'not-an-email' }, referenceDate)
        .valid,
    ).toBe(false);
    expect(
      validateBookingEnquiry({ ...stay, checkIn: '2026-06-30' }, referenceDate),
    ).toMatchObject({ valid: false, errors: { checkIn: expect.any(String) } });
    expect(
      validateBookingEnquiry(
        { ...stay, checkOut: '2026-07-15' },
        referenceDate,
      ),
    ).toMatchObject({ valid: false, errors: { checkOut: expect.any(String) } });
    expect(
      validateBookingEnquiry({ ...stay, guests: 0 }, referenceDate),
    ).toMatchObject({ valid: false, errors: { guests: expect.any(String) } });
  });

  it('limits messages and free-text preferences and strips HTML tags', () => {
    const result = validateBookingEnquiry(
      {
        ...stay,
        name: '<b>Мария Петрова</b>',
        message: '<script>hello</script>Keep this',
        accommodationPreference: 'Garden <em>side</em>',
      },
      referenceDate,
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe('Мария Петрова');
      expect(result.data.message).toBe('helloKeep this');
      expect(result.data.accommodationPreference).toBe('Garden side');
    }
    expect(
      validateBookingEnquiry(
        { ...stay, accommodationPreference: 'x'.repeat(301) },
        referenceDate,
      ),
    ).toMatchObject({
      valid: false,
      errors: { accommodationPreference: expect.any(String) },
    });
  });

  it('validates calendar dates and date math without rollover', () => {
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(isValidISODate('2025-02-29')).toBe(false);
    expect(isValidISODate('2026-02-31')).toBe(false);
    expect(isValidISODate('2026-2-01')).toBe(false);
    expect(isValidISODate('2101-01-01')).toBe(false);
    expect(isDateInPast('2026-06-30', referenceDate)).toBe(true);
    expect(isDateInPast('2026-07-01', referenceDate)).toBe(false);
    expect(calculateNights('2026-07-15', '2026-07-20')).toBe(5);
  });
});

describe('booking emails', () => {
  it('builds a table-based owner email with contact, dates, preference and inquiry notice', async () => {
    const { buildOwnerEmail } = await import('../../src/lib/booking');
    const email = buildOwnerEmail(stay);
    expect(email.subject).toContain('Ново запитване за престой');
    expect(email.text).toContain('Иван Иванов');
    expect(email.text).toContain('2026-07-15 – 2026-07-20');
    expect(email.text).toContain('Quiet garden side');
    expect(email.text).toContain('не потвърждава наличност или резервация');
    expect(email.html).toContain('<table role="presentation"');
    expect(email.html).toContain('Иван Иванов');
    expect(email.html).toContain('Иван Иванов');
  });

  it('escapes user content in owner and guest HTML, with a plain-text fallback', async () => {
    const { buildOwnerEmail, buildGuestEmail } =
      await import('../../src/lib/booking');
    const poisoned = {
      ...stay,
      name: '<script>alert(1)</script>',
      message: 'Hello <img src=x onerror="alert(1)">',
    };
    const owner = buildOwnerEmail(poisoned);
    const guest = buildGuestEmail(poisoned);
    expect(owner.html).not.toContain('<script>');
    expect(owner.html).not.toContain('<img src=x');
    expect(owner.html).toContain('&lt;script&gt;');
    expect(guest.html).toContain('&lt;img src=x');
    expect(owner.text).toContain('Hello <img src=x');
    expect(guest.text).toContain('Hello <img src=x');
    expect(escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#39;');
  });

  it('sends a localized guest receipt that confirms receipt, not the reservation', async () => {
    const { buildGuestEmail } = await import('../../src/lib/booking');
    const bgReceipt = buildGuestEmail(stay);
    const enReceipt = buildGuestEmail(question);
    expect(bgReceipt.text).toContain('получаването на запитването');
    expect(bgReceipt.text).toContain('2026-07-15 – 2026-07-20');
    expect(bgReceipt.text).toContain('Пристигаме около 15:00 часа.');
    expect(enReceipt.text).toContain('We have received your enquiry');
    expect(enReceipt.text).toContain('not the reservation itself');
    expect(enReceipt.text).toContain('Can we arrive after 21:00?');
  });

  it('builds Bulgarian question emails and English stay emails without a message block', async () => {
    const { buildOwnerEmail, buildGuestEmail } =
      await import('../../src/lib/booking');
    const bulgarianQuestion = buildOwnerEmail({ ...question, locale: 'bg' });
    const bulgarianReceipt = buildGuestEmail({ ...question, locale: 'bg' });
    const englishStay = buildOwnerEmail({ ...stay, locale: 'en', message: '' });

    expect(bulgarianQuestion.subject).toContain('Ново запитване към The Nest');
    expect(bulgarianQuestion.text).toContain('Получено е ново съобщение');
    expect(bulgarianQuestion.html).toContain('Съобщение от госта');
    expect(bulgarianReceipt.text).toContain('Получихме вашето запитване');
    expect(englishStay.subject).toContain('New stay enquiry');
    expect(englishStay.text).toContain('This enquiry does not confirm');
    expect(englishStay.text).not.toContain('\n\nMessage:');
    expect(englishStay.html).not.toContain('Guest message');
  });
});

describe('email delivery behavior', () => {
  it('does not report success when delivery configuration is absent', async () => {
    const result = await handleBookingEnquiry(stay, {});
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('simulated');
  });

  it('sends the owner email from the configured sender with the guest as Reply-To', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockedEmailResponse('owner-id'))
      .mockResolvedValueOnce(mockedEmailResponse('guest-id'));
    vi.stubGlobal('fetch', fetchMock);

    const enquiry = { ...stay, email: `owner-route-${Date.now()}@example.com` };
    const result = await handleBookingEnquiry(enquiry, emailEnvironment);
    expect(result.ok).toBe(true);
    const ownerRequest = fetchMock.mock.calls.at(0)?.[1];
    expect(ownerRequest).toBeDefined();
    const ownerPayload = JSON.parse(ownerRequest?.body as string);
    expect(ownerPayload).toMatchObject({
      from: emailEnvironment.BOOKING_FROM_EMAIL,
      to: emailEnvironment.BOOKING_RECIPIENT_EMAIL,
      reply_to: enquiry.email,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('allows retry after owner delivery fails and never sends a guest receipt', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'private response details must not be logged',
    });
    vi.stubGlobal('fetch', fetchMock);
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const enquiry = { ...stay, email: `owner-fail-${Date.now()}@example.com` };

    const failed = await handleBookingEnquiry(enquiry, emailEnvironment);
    expect(failed.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(errorLog.mock.calls.flat().join(' ')).not.toContain(enquiry.email);
    expect(errorLog.mock.calls.flat().join(' ')).not.toContain(
      'private response',
    );

    fetchMock.mockResolvedValueOnce(mockedEmailResponse('owner-retry'));
    fetchMock.mockResolvedValueOnce(mockedEmailResponse('guest-retry'));
    const retried = await handleBookingEnquiry(enquiry, emailEnvironment);
    expect(retried.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('keeps the accepted owner enquiry successful if the guest receipt fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockedEmailResponse('owner-accepted'))
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'no',
      });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const enquiry = { ...stay, email: `guest-fail-${Date.now()}@example.com` };

    const result = await handleBookingEnquiry(enquiry, emailEnvironment);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const duplicate = await handleBookingEnquiry(enquiry, emailEnvironment);
    expect(duplicate).toMatchObject({ ok: true, duplicate: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not expose Resend error bodies or network exception details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => 'response includes private message text',
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      sendEmailViaResend('secret', {
        from: 'verified@example.com',
        to: 'owner@example.com',
        subject: 'Test',
        text: 'Test',
        html: '<p>Test</p>',
      }),
    ).resolves.toEqual({ ok: false, error: 'Resend API error (502)' });
    const requestOptions = fetchMock.mock.calls.at(0)?.[1];
    expect(requestOptions).toBeDefined();
    expect(requestOptions?.headers?.Authorization).toBe('Bearer secret');
  });
});

describe('booking request endpoint safeguards', () => {
  it('returns 400 for invalid input and no success without an accepted email', async () => {
    const invalid = await processBookingRequest(
      { ...stay, guests: 99 },
      {},
      referenceDate,
    );
    expect(invalid.status).toBe(400);

    const unavailable = await processBookingRequest(stay, {}, referenceDate);
    expect(unavailable.status).toBe(500);
    await expect(unavailable.json()).resolves.toMatchObject({ ok: false });
  });

  it('returns success only after the owner email is accepted', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockedEmailResponse('owner'))
      .mockResolvedValueOnce(mockedEmailResponse('guest'));
    vi.stubGlobal('fetch', fetchMock);
    const response = await processBookingRequest(
      { ...stay, email: `request-${Date.now()}@example.com` },
      emailEnvironment,
      referenceDate,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it('preserves the English booking route for HTML validation errors', async () => {
    const response = await processBookingRequest(
      { ...stay, locale: 'en', guests: 0 },
      {},
      referenceDate,
      undefined,
      'text/html',
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/en/booking?status=error');
  });

  it('fails closed when Turnstile is enabled without its server secret', async () => {
    const response = await processBookingRequest(
      { ...stay, email: `turnstile-${Date.now()}@example.com` },
      { ...emailEnvironment, PUBLIC_TURNSTILE_SITE_KEY: 'public-site-key' },
      referenceDate,
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { turnstile: expect.any(String) },
    });
  });

  it('verifies a Turnstile token with the Cloudflare siteverify endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifyTurnstileToken('secret', 'valid-token')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns a calm success to honeypot submissions without sending email', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await processBookingRequest(
      { ...stay, website_trap: 'bot' },
      emailEnvironment,
      referenceDate,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sets strict CORS headers and rate-limits known IP addresses', () => {
    const headers = corsHeaders(undefined, 'https://example.org');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://example.org');
    expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
    expect(checkIpRateLimit(undefined)).toBe(true);
    const ip = `test-${Date.now()}`;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect(checkIpRateLimit(ip)).toBe(true);
    }
    expect(checkIpRateLimit(ip)).toBe(false);
  });

  it('deduplicates accepted enquiries without resending', () => {
    const enquiry = { ...stay, email: `dedupe-${Date.now()}@example.com` };
    expect(checkDuplicate(enquiry)).toBe(false);
    expect(checkDuplicate(enquiry)).toBe(true);
  });
});
