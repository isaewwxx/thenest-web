import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const globalCssPath = path.resolve(__dirname, '../../src/styles/global.css');
const propertyPhotoPath = path.resolve(
  __dirname,
  '../../src/components/PropertyPhoto.astro',
);

describe('Milestone 1 Design Tokens & Typography in global.css', () => {
  const css = fs.readFileSync(globalCssPath, 'utf-8');

  it('declares @theme block with complete color tokens', () => {
    expect(css).toContain('@theme');
    expect(css).toContain('--color-paper: #eef0eb;');
    expect(css).toContain('--color-paper-deep: #e2e5df;');
    expect(css).toContain('--color-ink: #1a2420;');
    expect(css).toContain('--color-muted: #5a655f;');
    expect(css).toContain('--color-forest: #2c4a3e;');
    expect(css).toContain('--color-forest-dark: #1f362d;');
    expect(css).toContain('--color-moss: #4a6356;');
    expect(css).toContain('--color-wood: #6b5a4c;');
    expect(css).toContain('--color-sea: #3f686b;');
    expect(css).toContain('--color-line: #d4d8d1;');
  });

  it('declares radii, motion, and Lightswind elevation shadow tokens', () => {
    expect(css).toContain('--radius-sm: 4px;');
    expect(css).toContain('--radius: 8px;');
    expect(css).toContain('--radius-md: 10px;');
    expect(css).toContain('--radius-lg: 12px;');

    expect(css).toContain('--motion-fast: 150ms;');
    expect(css).toContain('--motion-normal: 250ms;');
    expect(css).toContain('--motion-slow: 400ms;');
    expect(css).toContain('--ease-out: cubic-bezier(0.16, 1, 0.3, 1);');

    expect(css).toContain('--shadow-subtle:');
    expect(css).toContain('--shadow-card:');
    expect(css).toContain('--shadow-elevated:');
  });

  it('declares variable font stacks for native Cyrillic support', () => {
    expect(css).toContain("'Manrope Variable'");
    expect(css).toContain("'Source Sans 3 Variable'");
    expect(css).toContain(':lang(bg)');
    expect(css).toContain("font-feature-settings: 'locl' 1;");
  });

  it('enforces anti-AI button styling with architectural radius and tactile borders', () => {
    // Should NOT have 9999px stadium pills on base .btn
    expect(css).not.toMatch(/\.btn\s*\{[^}]*border-radius:\s*9999px/);
    expect(css).toContain('border-radius: var(--radius, 8px);');
    expect(css).toContain('transform: scale(0.98);');
  });

  it('keeps body and heading stacks on Variable font-family names first', () => {
    expect(css).toMatch(
      /body\s*\{[^}]*font-family:\s*[\s\S]*?'Source Sans 3 Variable'/,
    );
    expect(css).toMatch(
      /h1[\s\S]*?h6\s*\{[^}]*font-family:\s*'Manrope Variable'/,
    );
  });

  it('provides legacy :root aliases for backward compatibility', () => {
    expect(css).toContain('--paper: var(--color-paper);');
    expect(css).toContain('--forest: var(--color-forest);');
    expect(css).toContain('--line: var(--color-line);');
    expect(css).toContain('--shadow:');
  });

  it('declares shared layout tokens and wires .container to them', () => {
    expect(css).toContain('--container-max: 75rem;');
    expect(css).toContain('--page-gutter: clamp(1.25rem, 4.5vw, 2rem);');
    expect(css).toContain('--section-y: clamp(3.5rem, 7vw, 6.5rem);');
    expect(css).toContain('--section-y-sm: clamp(2.75rem, 5vw, 4.5rem);');
    expect(css).toContain('--grid-gap: clamp(1.75rem, 4.5vw, 4rem);');
    expect(css).toMatch(
      /\.container\s*\{[^}]*width:\s*min\(var\(--container-max\),\s*calc\(100%\s*-\s*2\s*\*\s*var\(--page-gutter\)\)\)/,
    );
  });
});

describe('Milestone 1 PropertyPhoto.astro responsive asset support', () => {
  const component = fs.readFileSync(propertyPhotoPath, 'utf-8');

  it('supports responsive widths and sizes attributes', () => {
    expect(component).toContain('widths?: number[];');
    expect(component).toContain('sizes?: string;');
    expect(component).toContain('widths={widths}');
    expect(component).toContain('sizes={sizes}');
  });

  it('supports focalPoint / objectPosition prop for precise responsive cropping', () => {
    expect(component).toContain('focalPoint?: string;');
    expect(component).toContain('objectPosition?: string;');
    expect(component).toContain('object-position:');
  });

  it('reserves aspect-ratio from image metadata to reduce CLS', () => {
    expect(component).toContain('aspectRatio?: string;');
    expect(component).toContain('aspect-ratio:');
    expect(component).toContain('src.width');
    expect(component).toContain('src.height');
  });
});
