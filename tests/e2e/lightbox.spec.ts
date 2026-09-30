import { expect, test, type Locator, type Page } from '@playwright/test';

const route = (locale: 'bg' | 'en') =>
  locale === 'en' ? '/en/gallery' : '/gallery';

async function openTrigger(page: Page, trigger: Locator) {
  const source = await trigger.evaluate(
    (anchor) => (anchor as HTMLAnchorElement).href,
  );
  const alternative = await trigger.getAttribute('data-alt');
  const caption = await trigger.getAttribute('data-caption');
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('src', source ?? '');
  await expect(dialog.locator('img')).toHaveAttribute('alt', alternative ?? '');
  await expect(dialog.locator('figcaption')).toHaveText(caption ?? '');
  await expect
    .poll(() =>
      dialog
        .locator('img')
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  return { trigger, source, dialog };
}

async function openImage(page: Page, index: number) {
  return openTrigger(page, page.locator('a[data-lightbox]').nth(index));
}

for (const locale of ['bg', 'en'] as const) {
  test(`${locale} opens the selected full-size landscape and portrait images`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route(locale));

    const landscapeIndex = await page
      .locator('.gallery-item[data-orientation="landscape"] a[data-lightbox]')
      .first()
      .evaluate((element) =>
        Array.from(document.querySelectorAll('a[data-lightbox]')).indexOf(
          element,
        ),
      );
    const portraitIndex = await page
      .locator('.gallery-item[data-orientation="portrait"] a[data-lightbox]')
      .first()
      .evaluate((element) =>
        Array.from(document.querySelectorAll('a[data-lightbox]')).indexOf(
          element,
        ),
      );
    expect(landscapeIndex).toBeGreaterThanOrEqual(0);
    expect(portraitIndex).toBeGreaterThanOrEqual(0);

    const landscape = await openImage(page, landscapeIndex);
    const landscapeGeometry = await landscape.dialog
      .locator('img')
      .evaluate((image: HTMLImageElement) => {
        const rect = image.getBoundingClientRect();
        return {
          naturalRatio: image.naturalWidth / image.naturalHeight,
          displayRatio: rect.width / rect.height,
          naturalWidth: image.naturalWidth,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      });
    expect(landscapeGeometry.naturalWidth).toBeGreaterThan(1000);
    expect(landscapeGeometry.displayRatio).toBeCloseTo(
      landscapeGeometry.naturalRatio,
      1,
    );
    expect(landscapeGeometry.left).toBeGreaterThanOrEqual(0);
    expect(landscapeGeometry.right).toBeLessThanOrEqual(
      landscapeGeometry.viewportWidth,
    );
    expect(landscapeGeometry.top).toBeGreaterThanOrEqual(0);
    expect(landscapeGeometry.bottom).toBeLessThanOrEqual(
      landscapeGeometry.viewportHeight,
    );
    await landscape.dialog
      .getByRole('button', { name: /close|затвори/i })
      .click();
    await expect(landscape.trigger).toBeFocused();

    const portrait = await openImage(page, portraitIndex);
    const portraitGeometry = await portrait.dialog
      .locator('img')
      .evaluate((image: HTMLImageElement) => {
        const rect = image.getBoundingClientRect();
        return {
          naturalRatio: image.naturalWidth / image.naturalHeight,
          displayRatio: rect.width / rect.height,
          naturalWidth: image.naturalWidth,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      });
    expect(portraitGeometry.naturalWidth).toBeGreaterThan(1000);
    expect(portraitGeometry.displayRatio).toBeCloseTo(
      portraitGeometry.naturalRatio,
      1,
    );
    expect(portraitGeometry.left).toBeGreaterThanOrEqual(0);
    expect(portraitGeometry.right).toBeLessThanOrEqual(
      portraitGeometry.viewportWidth,
    );
    expect(portraitGeometry.top).toBeGreaterThanOrEqual(0);
    expect(portraitGeometry.bottom).toBeLessThanOrEqual(
      portraitGeometry.viewportHeight,
    );
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    test(`${locale} lightbox uses the ${viewport.width}px viewport without covering its image`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(route(locale));
      const { dialog } = await openImage(page, 0);
      const dimensions = await dialog.evaluate((element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const image = element.querySelector('img')!.getBoundingClientRect();
        const previous = element
          .querySelector('.lightbox-prev')!
          .getBoundingClientRect();
        const next = element
          .querySelector('.lightbox-next')!
          .getBoundingClientRect();
        return {
          dialogWidth: rect.width,
          dialogHeight: rect.height,
          imageWidth: image.width,
          imageHeight: image.height,
          imageLeft: image.left,
          imageRight: image.right,
          previousRight: previous.right,
          nextLeft: next.left,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        };
      });

      expect(dimensions.dialogWidth).toBeGreaterThan(viewport.width * 0.9);
      expect(dimensions.dialogHeight).toBeGreaterThan(viewport.height * 0.88);
      expect(dimensions.dialogWidth).toBeLessThanOrEqual(viewport.width);
      expect(dimensions.dialogHeight).toBeLessThanOrEqual(viewport.height);
      expect(dimensions.imageWidth).toBeGreaterThan(100);
      expect(dimensions.imageHeight).toBeGreaterThan(100);
      if (viewport.width > 600) {
        expect(dimensions.previousRight).toBeLessThanOrEqual(
          dimensions.imageLeft + 1,
        );
        expect(dimensions.nextLeft).toBeGreaterThanOrEqual(
          dimensions.imageRight - 1,
        );
      }
    });
  }

  test(`${locale} lightbox navigation stays in the filtered gallery and restores focus`, async ({
    page,
  }) => {
    await page.goto(route(locale));
    await page.locator('[data-category-filter="brand"]').click();
    const visible = page.locator('.gallery-item:visible a[data-lightbox]');
    const sources = await visible.evaluateAll((items) =>
      items.map((item) => (item as HTMLAnchorElement).href),
    );
    expect(sources.length).toBeGreaterThan(1);
    const firstVisibleSource = sources[0] ?? '';
    const secondVisibleSource = sources[1] ?? '';

    const { trigger, dialog } = await openTrigger(page, visible.first());
    const selectedSource = await trigger.evaluate(
      (element) => (element as HTMLAnchorElement).href,
    );
    expect(selectedSource).toBe(firstVisibleSource);
    await dialog
      .getByRole('button', { name: /next image|следваща снимка/i })
      .click();
    await expect(dialog.locator('img')).toHaveAttribute(
      'src',
      secondVisibleSource,
    );
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('img')).toHaveAttribute(
      'src',
      firstVisibleSource,
    );
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();

    await page.locator('[data-category-filter="all"]').click();
    const allGallery = page.locator('a[data-lightbox]');
    const last = allGallery.last();
    const lastSource = await last.evaluate(
      (anchor) => (anchor as HTMLAnchorElement).href,
    );
    await last.click();
    await expect(dialog.locator('img')).toHaveAttribute('src', lastSource);
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('img')).toHaveAttribute(
      'src',
      await allGallery
        .first()
        .evaluate((anchor) => (anchor as HTMLAnchorElement).href),
    );
  });

  test(`${locale} gallery image remains an image link when JavaScript is disabled`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
      baseURL: 'http://localhost:4321',
    });
    const page = await context.newPage();
    await page.goto(route(locale));
    const source = await page
      .locator('a[data-lightbox]')
      .first()
      .getAttribute('href');
    await page.locator('a[data-lightbox]').first().click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(new URL(source ?? '', 'http://localhost:4321').pathname);
    await context.close();
  });
}
