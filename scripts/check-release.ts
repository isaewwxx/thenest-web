import { site } from '../src/data/site.ts';
import { accommodation } from '../src/data/accommodation.ts';
import { reviews } from '../src/data/reviews.ts';
const indexable = process.env.PUBLIC_INDEXABLE === 'true';
const origin = process.env.PUBLIC_SITE_URL?.trim();
const issues = [
  ...(indexable && !origin
    ? ['PUBLIC_INDEXABLE=true requires PUBLIC_SITE_URL']
    : []),
  ...(!site.contentApproved ? ['Owner content approval is still pending'] : []),
  ...(accommodation.length === 0
    ? ['No owner-verified accommodation units are configured']
    : []),
  ...(reviews.length === 0 ? ['No owner-approved reviews are configured'] : []),
];
console.log(
  issues.length
    ? `Release readiness: ${issues.length} item(s)\n- ${issues.join('\n- ')}`
    : 'Release readiness: ready',
);
if (indexable && issues.length) process.exit(1);
