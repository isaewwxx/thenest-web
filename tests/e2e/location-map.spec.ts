import { expect, test } from '@playwright/test';

const embedUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d47297.94793607472!2d27.82833753897559!3d42.19046432100702!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40a12d0042cdea91%3A0xdb38ee5bb53e0b1c!2z0JHRg9C90LPQsNC70LAg0JPQvdC10LfQtNC-0YLQviAtINCb0L7Qt9C10L3QtdGG!5e0!3m2!1sen!2sbg!4v1790791380524!5m2!1sen!2sbg';

for (const locale of ['bg', 'en'] as const) {
  test(`${locale} location embeds the verified Google map lazily`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(locale === 'en' ? '/en/location' : '/location');

    const map = page.locator('[data-google-map]');
    await expect(map).toBeVisible();
    await expect(
      map.getByRole('button', { name: /load map|зареди картата/i }),
    ).toHaveCount(0);

    const frame = map.locator('iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', embedUrl);
    await expect(frame).toHaveAttribute(
      'title',
      locale === 'bg'
        ? 'Карта с местоположението на Бунгала Гнездото'
        : 'Map showing the location of The Nest Bungalows',
    );
    await expect(frame).toHaveAttribute('loading', 'lazy');
    await expect(frame).toHaveAttribute(
      'referrerpolicy',
      'strict-origin-when-cross-origin',
    );
    await expect(frame).not.toHaveAttribute('width', /.+/);
    await expect(frame).not.toHaveAttribute('height', /.+/);

    for (const width of [390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      const dimensions = await map.locator('.map-frame').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const iframe = element.querySelector('iframe');
        const iframeRect = iframe?.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          iframeWidth: iframeRect?.width ?? 0,
          iframeHeight: iframeRect?.height ?? 0,
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        };
      });
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.iframeWidth).toBeCloseTo(dimensions.width, 0);
      expect(dimensions.iframeHeight).toBeCloseTo(dimensions.height, 0);
      expect(dimensions.width / dimensions.height).toBeGreaterThan(1.2);
      expect(dimensions.width / dimensions.height).toBeLessThan(1.75);
      expect(dimensions.pageWidth).toBeLessThanOrEqual(
        dimensions.viewportWidth + 1,
      );
    }

    await expect(
      map.getByRole('link', {
        name: locale === 'bg' ? 'Отвори в Google Maps' : 'Open in Google Maps',
      }),
    ).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=42.20708,27.81049',
    );
  });
}
