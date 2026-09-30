import type { BookingEnquiry } from './booking';

type EmailCopy = {
  guest: string;
  email: string;
  phone: string;
  dates: string;
  guests: string;
  preference: string;
  message: string;
  submitted: string;
  missing: string;
  intro: string;
  notice: string;
  signoff: string;
  ownerStayTitle: string;
  ownerQuestionTitle: string;
  guestStayTitle: string;
  guestQuestionTitle: string;
};

const copy: Record<'bg' | 'en', EmailCopy> = {
  bg: {
    guest: 'Име',
    email: 'Имейл',
    phone: 'Телефон',
    dates: 'Предпочитани дати',
    guests: 'Брой гости',
    preference: 'Предпочитание за помещение',
    message: 'Съобщение',
    submitted: 'Получено на',
    missing: 'Не е посочено',
    intro:
      'Получихме вашето запитване. Домакините ще се свържат с вас за наличността и останалите подробности.',
    notice:
      'Това съобщение потвърждава получаването на запитването, а не самата резервация.',
    signoff: 'Сърдечни поздрави,\nЕкипът на Бунгала „Гнездото“',
    ownerStayTitle: 'Ново запитване за престой',
    ownerQuestionTitle: 'Ново запитване към The Nest',
    guestStayTitle: 'Получихме запитването ви',
    guestQuestionTitle: 'Получихме съобщението ви',
  },
  en: {
    guest: 'Name',
    email: 'Email',
    phone: 'Phone',
    dates: 'Preferred dates',
    guests: 'Number of guests',
    preference: 'Accommodation preference',
    message: 'Message',
    submitted: 'Received at',
    missing: 'Not provided',
    intro:
      'We have received your enquiry. The hosts will contact you about availability and the remaining details.',
    notice:
      'This email confirms receipt of your enquiry, not the reservation itself.',
    signoff: 'Warm regards,\nThe Nest Bungalows team',
    ownerStayTitle: 'New stay enquiry',
    ownerQuestionTitle: 'New enquiry for The Nest',
    guestStayTitle: 'We received your enquiry',
    guestQuestionTitle: 'We received your message',
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeText(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function submittedAt(locale: 'bg' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'bg' ? 'bg-BG' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Sofia',
  }).format(new Date());
}

function getRows(enquiry: BookingEnquiry, labels: EmailCopy, date: string) {
  const rows: Array<[string, string]> = [
    [labels.guest, enquiry.name],
    [labels.email, enquiry.email],
    [labels.phone, enquiry.phone || labels.missing],
  ];
  if (enquiry.checkIn && enquiry.checkOut) {
    rows.push([labels.dates, `${enquiry.checkIn} – ${enquiry.checkOut}`]);
  }
  if (enquiry.guests !== undefined) {
    rows.push([labels.guests, String(enquiry.guests)]);
  }
  if (enquiry.accommodationPreference) {
    rows.push([labels.preference, enquiry.accommodationPreference]);
  }
  rows.push([labels.submitted, date]);
  return rows;
}

function buildEmailHtml(
  title: string,
  intro: string,
  notice: string,
  rows: Array<[string, string]>,
  message: string | undefined,
  locale: 'bg' | 'en',
): string {
  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" valign="top" style="padding:10px 12px;border-bottom:1px solid #e6e5df;color:#59645c;font-size:13px;font-weight:600;text-align:left;">${escapeHtml(label)}</th><td valign="top" style="padding:10px 12px;border-bottom:1px solid #e6e5df;color:#1f2d23;font-size:14px;overflow-wrap:anywhere;">${safeText(value)}</td></tr>`,
    )
    .join('');
  const messageBlock = message
    ? `<tr><td colspan="2" style="padding:14px 12px 4px;color:#59645c;font-size:13px;font-weight:600;">${escapeHtml(locale === 'bg' ? 'Съобщение от госта' : 'Guest message')}</td></tr><tr><td colspan="2" style="padding:10px 12px 14px;background:#f6f6f1;color:#1f2d23;font-size:14px;line-height:1.55;overflow-wrap:anywhere;">${safeText(message)}</td></tr>`
    : '';

  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:20px;background:#f3f3ed;color:#1f2d23;font-family:Arial,Helvetica,sans-serif;line-height:1.5;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;border:1px solid #dedfd7;border-radius:10px;background:#ffffff;border-collapse:separate;border-spacing:0;overflow:hidden;"><tr><td style="padding:22px 24px;background:#254d3a;color:#ffffff;"><p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;">The Nest Bungalows · Lozenets</p><h1 style="margin:0;font-size:21px;line-height:1.3;font-weight:600;">${escapeHtml(title)}</h1></td></tr><tr><td style="padding:20px 24px 10px;color:#344238;font-size:14px;">${escapeHtml(intro)}</td></tr><tr><td style="padding:4px 24px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${tableRows}${messageBlock}</table></td></tr><tr><td style="padding:14px 24px 20px;border-top:1px solid #e6e5df;color:#59645c;font-size:13px;line-height:1.5;">${escapeHtml(notice)}</td></tr></table></td></tr></table></body></html>`;
}

function buildEmailText(
  intro: string,
  notice: string,
  rows: Array<[string, string]>,
  message: string | undefined,
  labels: EmailCopy,
): string {
  const details = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const messageBlock = message ? `\n\n${labels.message}:\n${message}` : '';
  return `The Nest Bungalows · Lozenets\n\n${intro}\n\n${details}${messageBlock}\n\n${notice}`;
}

export function buildOwnerEmail(enquiry: BookingEnquiry): {
  subject: string;
  text: string;
  html: string;
} {
  const labels = copy[enquiry.locale];
  const isQuestion = enquiry.intent === 'question';
  const title = isQuestion ? labels.ownerQuestionTitle : labels.ownerStayTitle;
  const message = enquiry.message;
  const intro = isQuestion
    ? enquiry.locale === 'bg'
      ? 'Получено е ново съобщение през формата на сайта.'
      : 'A new message was received through the website enquiry form.'
    : labels.notice;
  const notice = isQuestion
    ? labels.notice
    : enquiry.locale === 'bg'
      ? 'Запитването не потвърждава наличност или резервация. Домакините уточняват датите и условията лично.'
      : 'This enquiry does not confirm availability or a reservation. The hosts will confirm dates and terms personally.';
  const rows = getRows(enquiry, labels, submittedAt(enquiry.locale));
  return {
    subject: isQuestion
      ? `The Nest · ${labels.ownerQuestionTitle}`
      : `The Nest · ${labels.ownerStayTitle}`,
    text: buildEmailText(intro, notice, rows, message, labels),
    html: buildEmailHtml(title, intro, notice, rows, message, enquiry.locale),
  };
}

export function buildGuestEmail(enquiry: BookingEnquiry): {
  subject: string;
  text: string;
  html: string;
} {
  const labels = copy[enquiry.locale];
  const isQuestion = enquiry.intent === 'question';
  const title = isQuestion ? labels.guestQuestionTitle : labels.guestStayTitle;
  const rows = getRows(enquiry, labels, submittedAt(enquiry.locale)).filter(
    ([label]) =>
      label !== labels.submitted &&
      label !== labels.guest &&
      label !== labels.email,
  );
  const intro = isQuestion
    ? enquiry.locale === 'bg'
      ? 'Получихме вашето запитване. Домакините ще ви отговорят лично.'
      : 'We have received your enquiry. The hosts will reply personally.'
    : labels.intro;
  return {
    subject: `The Nest · ${title}`,
    text: buildEmailText(intro, labels.notice, rows, enquiry.message, labels),
    html: buildEmailHtml(
      title,
      intro,
      labels.notice,
      rows,
      enquiry.message,
      enquiry.locale,
    ),
  };
}
