import { describe, expect, it, vi } from 'vitest';
import {
  validateBookingEnquiry,
  calculateNights,
  isValidISODate,
  corsHeaders,
  verifyTurnstileToken,
  buildOwnerEmail,
  buildGuestEmail,
  checkDuplicate,
  handleBookingEnquiry,
  processBookingRequest,
  escapeHtml,
  checkIpRateLimit,
  sendEmailViaResend,
  type BookingEnquiry,
} from '../../src/lib/booking';

describe('Booking enquiry validation and formatting', () => {
  const refDate = new Date('2026-07-01T12:00:00Z');

  const validPayload: BookingEnquiry = {
    intent: 'stay',
    checkIn: '2026-07-15',
    checkOut: '2026-07-20',
    guests: 2,
    accommodationId: 'bungalow-room',
    name: 'Иван Иванов',
    phone: '+359 888 123 456',
    email: 'ivan@example.com',
    pets: true,
    message: 'Пристигаме около 15:00 часа.',
    locale: 'bg',
  };

  it('accepts a general question without stay dates', () => {
    const res = validateBookingEnquiry(
      {
        intent: 'question',
        name: 'Мария Петрова',
        phone: '+359 877 111 222',
        email: 'maria@example.com',
        message: 'Имате ли паркинг за два автомобила?',
        locale: 'bg',
      },
      refDate,
    );
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.intent).toBe('question');
      expect(res.data.message).toContain('паркинг');
      expect(res.data.checkIn).toBeUndefined();
      expect(res.data.checkOut).toBeUndefined();
      expect(res.data.guests).toBeUndefined();
    }
  });

  it('requires a message for general questions', () => {
    const res = validateBookingEnquiry(
      {
        intent: 'question',
        name: 'Maria Petrova',
        phone: '+359 877 111 222',
        email: 'maria@example.com',
        message: '',
        locale: 'en',
      },
      refDate,
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.errors.message).toBeDefined();
    }
  });

  it('defaults missing intent to stay and still requires dates', () => {
    const res = validateBookingEnquiry(
      {
        name: 'Иван Иванов',
        phone: '+359 888 123 456',
        email: 'ivan@example.com',
        locale: 'bg',
      },
      refDate,
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.errors.checkIn).toBeDefined();
    }
  });

  it('builds question-focused owner and guest emails', () => {
    const question: BookingEnquiry = {
      intent: 'question',
      name: 'Maria Petrova',
      phone: '+359 877 111 222',
      email: 'maria@example.com',
      message: 'Do you allow late check-in after 21:00?',
      locale: 'en',
      pets: false,
    };

    const owner = buildOwnerEmail(question);
    expect(owner.subject).toMatch(/въпрос|question/i);
    expect(owner.text).toContain('Do you allow late check-in after 21:00?');
    expect(owner.text).not.toContain('нощувки');

    const guest = buildGuestEmail(question);
    expect(guest.subject).toMatch(/question|въпрос|message|съобщение/i);
    expect(guest.text).toContain('Do you allow late check-in after 21:00?');
  });

  it('accepts valid booking enquiry', () => {
    const res = validateBookingEnquiry(validPayload, refDate);
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.name).toBe('Иван Иванов');
      expect(res.data.guests).toBe(2);
      expect(res.data.pets).toBe(true);
    }
  });

  it('calculates nights accurately', () => {
    expect(calculateNights('2026-07-15', '2026-07-20')).toBe(5);
    expect(calculateNights('2026-08-01', '2026-08-02')).toBe(1);
    expect(calculateNights('2026-07-20', '2026-07-15')).toBe(0);
  });

  it('rejects past check-in dates', () => {
    const res = validateBookingEnquiry(
      { ...validPayload, checkIn: '2026-06-30' },
      refDate,
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.errors.checkIn).toBeDefined();
    }
  });

  it('allows same-day check-in', () => {
    const res = validateBookingEnquiry(
      { ...validPayload, checkIn: '2026-07-01', checkOut: '2026-07-05' },
      refDate,
    );
    expect(res.valid).toBe(true);
  });

  it('rejects check-out on or before check-in', () => {
    const resSame = validateBookingEnquiry(
      { ...validPayload, checkIn: '2026-07-15', checkOut: '2026-07-15' },
      refDate,
    );
    expect(resSame.valid).toBe(false);
    if (!resSame.valid) {
      expect(resSame.errors.checkOut).toBeDefined();
    }

    const resBefore = validateBookingEnquiry(
      { ...validPayload, checkIn: '2026-07-15', checkOut: '2026-07-10' },
      refDate,
    );
    expect(resBefore.valid).toBe(false);
  });

  it('rejects invalid guest counts', () => {
    const resZero = validateBookingEnquiry(
      { ...validPayload, guests: 0 },
      refDate,
    );
    expect(resZero.valid).toBe(false);

    const resOver = validateBookingEnquiry(
      { ...validPayload, guests: 25 },
      refDate,
    );
    expect(resOver.valid).toBe(false);

    const resValid = validateBookingEnquiry(
      { ...validPayload, guests: 18 },
      refDate,
    );
    expect(resValid.valid).toBe(true);
  });

  it('sanitizes HTML tags from name and message', () => {
    const res = validateBookingEnquiry(
      {
        ...validPayload,
        name: '<script>alert("hack")</script>Георги',
        message: '<b>Моля за тихо бунгало</b>',
      },
      refDate,
    );
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.name).not.toContain('<');
      expect(res.data.name).not.toContain('>');
      expect(res.data.name).toContain('Георги');
      expect(res.data.message).toBe('Моля за тихо бунгало');
    }
  });

  it('rejects malformed email and short phone numbers', () => {
    const badEmail = validateBookingEnquiry(
      { ...validPayload, email: 'not-an-email' },
      refDate,
    );
    expect(badEmail.valid).toBe(false);

    const badPhone = validateBookingEnquiry(
      { ...validPayload, phone: '123' },
      refDate,
    );
    expect(badPhone.valid).toBe(false);
  });

  it('detects honeypot submission as spam', () => {
    const honeypot = validateBookingEnquiry(
      { ...validPayload, website_trap: 'http://spam-bot.xyz' },
      refDate,
    );
    expect(honeypot.valid).toBe(false);
    if (!honeypot.valid) {
      expect(honeypot.errors.spam).toBeDefined();
    }
  });

  it('builds clear owner notification email containing guest contacts and disclaimer', () => {
    const email = buildOwnerEmail(validPayload);
    expect(email.subject).toContain('Ново запитване');
    expect(email.subject).toContain('5 нощ.');
    expect(email.subject).toContain('2 гости');
    expect(email.text).toContain(
      'ВАЖНО: Това е запитване за наличност, НЕ е потвърдена резервация!',
    );
    expect(email.text).toContain('Иван Иванов');
    expect(email.text).toContain('+359 888 123 456');
    expect(email.text).toContain('ivan@example.com');
    expect(email.html).toContain('tel:+359 888 123 456');
    expect(email.html).toContain('mailto:ivan@example.com');
  });

  it('builds warm guest confirmation email in Bulgarian and English', () => {
    const bgEmail = buildGuestEmail(validPayload);
    expect(bgEmail.subject).toContain('Получихме запитването ви');
    expect(bgEmail.text).toContain(
      'Това все още не е автоматично потвърдена резервация',
    );
    expect(bgEmail.html).toContain('+359 877 116 050');

    const enEmail = buildGuestEmail({ ...validPayload, locale: 'en' });
    expect(enEmail.subject).toContain('We received your enquiry');
    expect(enEmail.text).toContain(
      'This is an enquiry request and not yet an automated confirmed booking',
    );
  });

  it('handles simulated dev mode without failing when RESEND_API_KEY is missing', async () => {
    const res = await handleBookingEnquiry(validPayload, {});
    expect(res.ok).toBe(true);
    expect(res.simulated).toBe(true);
  });

  it('detects duplicate submissions within short time window', () => {
    const p = { ...validPayload, email: `test-${Date.now()}@example.com` };
    expect(checkDuplicate(p)).toBe(false);
    expect(checkDuplicate(p)).toBe(true);
  });

  it('processBookingRequest returns 400 on invalid input and 200 on valid input', async () => {
    const badRes = await processBookingRequest(
      { guests: 'invalid' },
      {},
      refDate,
    );
    expect(badRes.status).toBe(400);

    const goodRes = await processBookingRequest(validPayload, {}, refDate);
    expect(goodRes.status).toBe(200);
    const body = await goodRes.json();
    expect(body.ok).toBe(true);
  });

  it('processBookingRequest silently returns 200 on spam honeypot', async () => {
    const spamRes = await processBookingRequest({
      ...validPayload,
      website_trap: 'i am bot',
    });
    expect(spamRes.status).toBe(200);
    const body = await spamRes.json();
    expect(body.ok).toBe(true);
  });

  it('validates ISO dates strictly without date rollover', () => {
    expect(isValidISODate('2026-07-15')).toBe(true);
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(isValidISODate('2025-02-29')).toBe(false);
    expect(isValidISODate('2026-02-31')).toBe(false);
    expect(isValidISODate('2026-04-31')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('random-string')).toBe(false);
  });

  it('validates optional rooms parameter accurately', () => {
    const resWithoutRooms = validateBookingEnquiry(validPayload, refDate);
    expect(resWithoutRooms.valid).toBe(true);

    const resWithValidRooms = validateBookingEnquiry(
      { ...validPayload, rooms: 3 },
      refDate,
    );
    expect(resWithValidRooms.valid).toBe(true);
    if (resWithValidRooms.valid) {
      expect(resWithValidRooms.data.rooms).toBe(3);
    }

    const resWithZeroRooms = validateBookingEnquiry(
      { ...validPayload, rooms: 0 },
      refDate,
    );
    expect(resWithZeroRooms.valid).toBe(false);
    if (!resWithZeroRooms.valid) {
      expect(resWithZeroRooms.errors.rooms).toBeDefined();
    }

    const resWithTooManyRooms = validateBookingEnquiry(
      { ...validPayload, rooms: 7 },
      refDate,
    );
    expect(resWithTooManyRooms.valid).toBe(false);
    if (!resWithTooManyRooms.valid) {
      expect(resWithTooManyRooms.errors.rooms).toBeDefined();
    }
  });

  it('provides CORS headers for preflight and standard responses', () => {
    const cors = corsHeaders();
    expect(cors['Access-Control-Allow-Origin']).toBe('*');
    expect(cors['Access-Control-Allow-Methods']).toContain('POST');
    expect(cors['Access-Control-Allow-Methods']).toContain('OPTIONS');
    expect(cors['Access-Control-Allow-Headers']).toContain('Content-Type');
  });

  it('escapes untrusted content for HTML email bodies', () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
    const poisoned = {
      ...validPayload,
      name: '<script>alert(1)</script>',
      message: 'Hello <b>there</b>',
    };
    const owner = buildOwnerEmail(poisoned);
    expect(owner.html).not.toContain('<script>');
    expect(owner.html).toContain('&lt;script&gt;');
    expect(owner.html).toContain('Hello &lt;b&gt;there&lt;/b&gt;');
  });

  it('verifies Cloudflare Turnstile token validation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    try {
      const isHuman = await verifyTurnstileToken(
        'secret-key',
        'valid-token',
        '127.0.0.1',
      );
      expect(isHuman).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({ method: 'POST' }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('covers booking transport failure and CORS branches', async () => {
    const originalOrigin = process.env.PUBLIC_SITE_URL;
    process.env.PUBLIC_SITE_URL = 'https://example.com/';
    try {
      expect(
        corsHeaders('https://example.com/')['Access-Control-Allow-Origin'],
      ).toBe('https://example.com/');
      expect(
        corsHeaders('https://other.example')['Access-Control-Allow-Origin'],
      ).toBe('https://example.com');
    } finally {
      if (originalOrigin === undefined) delete process.env.PUBLIC_SITE_URL;
      else process.env.PUBLIC_SITE_URL = originalOrigin;
    }

    expect(checkIpRateLimit(undefined)).toBe(true);
    expect(checkIpRateLimit('unknown')).toBe(true);
    const ip = `coverage-${Date.now()}`;
    for (let index = 0; index < 8; index += 1) {
      expect(checkIpRateLimit(ip)).toBe(true);
    }
    expect(checkIpRateLimit(ip)).toBe(false);

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'temporary failure',
      }) as unknown as typeof fetch;
      await expect(
        sendEmailViaResend('secret', {
          from: 'from@example.com',
          to: 'to@example.com',
          subject: 'Test',
          text: 'Test',
          html: '<p>Test</p>',
        }),
      ).resolves.toMatchObject({
        ok: false,
        error: expect.stringContaining('503'),
      });

      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
      await expect(
        sendEmailViaResend('secret', {
          from: 'from@example.com',
          to: 'to@example.com',
          subject: 'Test',
          text: 'Test',
          html: '<p>Test</p>',
        }),
      ).resolves.toMatchObject({
        ok: false,
        error: expect.stringContaining('offline'),
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      }) as unknown as typeof fetch;
      await expect(
        sendEmailViaResend('secret', {
          from: 'from@example.com',
          to: 'to@example.com',
          subject: 'Test',
          text: 'Test',
          html: '<p>Test</p>',
        }),
      ).resolves.toEqual({ ok: true, id: 'email-id' });

      expect(await verifyTurnstileToken('', 'token')).toBe(false);
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false }) as unknown as typeof fetch;
      expect(await verifyTurnstileToken('secret', 'token')).toBe(false);
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(
          new Error('turnstile offline'),
        ) as unknown as typeof fetch;
      expect(await verifyTurnstileToken('secret', 'token')).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles HTML form POST redirect for no-JS progressive enhancement', async () => {
    const res = await processBookingRequest(
      validPayload,
      {},
      refDate,
      '127.0.0.1',
      'text/html,application/xhtml+xml',
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toContain('/booking?status=success');
    expect(res.headers.get('Set-Cookie')).toContain('nest_enquiry_ok=1');

    const errRes = await processBookingRequest(
      { ...validPayload, checkIn: '2026-06-01' },
      {},
      refDate,
      '127.0.0.1',
      'text/html,application/xhtml+xml',
    );
    expect(errRes.status).toBe(303);
    expect(errRes.headers.get('Location')).toContain('/booking?status=error');
  });

  describe('Query parameter alias resolution (?room= and ?unit=)', () => {
    const resolveRoomQuery = (search: string) => {
      const params = new URLSearchParams(search);
      return params.get('room') || params.get('unit') || null;
    };

    it('prefers ?room= when provided', () => {
      expect(resolveRoomQuery('?room=bungalow-room')).toBe('bungalow-room');
    });

    it('falls back to ?unit= for backwards compatibility', () => {
      expect(resolveRoomQuery('?unit=bungalow-room')).toBe('bungalow-room');
    });

    it('prioritizes ?room= over ?unit= if both are present', () => {
      expect(resolveRoomQuery('?room=bungalow-room&unit=all')).toBe(
        'bungalow-room',
      );
    });

    it('handles encoded values in ?room= and ?unit=', () => {
      expect(resolveRoomQuery('?room=bungalow%2Droom')).toBe('bungalow-room');
      expect(resolveRoomQuery('?unit=bungalow%2Droom')).toBe('bungalow-room');
    });

    it('returns null when neither ?room= nor ?unit= is present', () => {
      expect(resolveRoomQuery('?guests=2&rooms=1')).toBe(null);
    });
  });

  describe('Turnstile anti-spam token payload handling', () => {
    it('extracts turnstileToken directly from payload', () => {
      const res = validateBookingEnquiry(
        {
          ...validPayload,
          turnstileToken: 'direct-turnstile-token-123',
        },
        refDate,
      );
      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.turnstileToken).toBe('direct-turnstile-token-123');
      }
    });

    it('extracts cf-turnstile-response and maps to turnstileToken', () => {
      const res = validateBookingEnquiry(
        {
          ...validPayload,
          'cf-turnstile-response': 'cf-widget-response-456',
        },
        refDate,
      );
      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.turnstileToken).toBe('cf-widget-response-456');
      }
    });

    it('trims whitespace on Turnstile tokens', () => {
      const res = validateBookingEnquiry(
        {
          ...validPayload,
          'cf-turnstile-response': '   spaced-token-789   ',
        },
        refDate,
      );
      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.turnstileToken).toBe('spaced-token-789');
      }
    });

    it('rejects booking when TURNSTILE_SECRET_KEY is set and token is missing', async () => {
      const env = { TURNSTILE_SECRET_KEY: 'test-secret-key' };
      const res = await processBookingRequest(validPayload, env, refDate);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.errors?.turnstile).toBeDefined();
    });

    it('rejects booking when TURNSTILE_SECRET_KEY is set and token verification fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      try {
        const env = { TURNSTILE_SECRET_KEY: 'test-secret-key' };
        const res = await processBookingRequest(
          { ...validPayload, turnstileToken: 'invalid-token' },
          env,
          refDate,
        );
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.ok).toBe(false);
        expect(json.errors?.turnstile).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('accepts booking when TURNSTILE_SECRET_KEY is set and token verification succeeds', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      try {
        const env = { TURNSTILE_SECRET_KEY: 'test-secret-key' };
        const res = await processBookingRequest(
          { ...validPayload, 'cf-turnstile-response': 'valid-cf-token' },
          env,
          refDate,
        );
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.ok).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
