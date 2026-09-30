import { expect, test } from '@playwright/test';

for (const locale of ['bg', 'en'] as const) {
  test(`${locale} shows sourced licence and third-party recognition`, async ({
    page,
  }) => {
    await page.goto(locale === 'en' ? '/en' : '/');
    const trust = page.locator('.trust-information');
    await expect(trust).toBeVisible();
    await expect(trust).toContainText('Ц2-0ФА-Г33-С0');
    await expect(
      trust.locator('a[href="https://www.orliturizum.eu/city-3311-lozenec"]'),
    ).toHaveCount(1);
    await expect(
      trust.locator('a[href="https://www.orlihoteli.eu/city-3311-lozenec"]'),
    ).toHaveCount(1);
    await expect(trust).not.toContainText(
      /\b(?:[1-5](?:\.\d)?\s?stars?|звезди)\b/i,
    );
    const externalLinks = trust.locator('a[target="_blank"]');
    await expect(externalLinks).toHaveCount(3);
    for (const link of await externalLinks.all()) {
      await expect(link).toHaveAttribute('rel', /noopener noreferrer/);
    }
  });
}
