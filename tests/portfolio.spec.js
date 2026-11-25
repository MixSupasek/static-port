import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

test('homepage serves the portfolio and all four projects', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'ศุภเสก สังเกตุ' })).toBeVisible();
  for (const name of ['Static Website CI/CD on AWS S3', 'GitOps Release Pipeline', 'Bar Mai FoodHub App', 'KUQuest']) {
    await expect(page.getByRole('heading', { level: 3, name, exact: true })).toBeVisible();
  }
});

test('contact and project links point to usable destinations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'mix.supasek@gmail.com' }))
    .toHaveAttribute('href', 'mailto:mix.supasek@gmail.com');
  await expect(page.getByRole('link', { name: '0954847401' }))
    .toHaveAttribute('href', 'tel:+66954847401');
  const projectLinks = page.locator('.project-heading a');
  await expect(projectLinks).toHaveCount(5);
  for (const link of await projectLinks.all()) {
    const destination = new URL(await link.getAttribute('href'));
    expect(destination.protocol).toBe('https:');
    expect(destination.hostname).toBe('github.com');
    expect(destination.pathname.split('/').filter(Boolean).length).toBe(2);
  }
});

test('page fits the viewport without horizontal scrolling', async ({ page }) => {
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test('portrait loads alongside the resume heading', async ({ page }) => {
  await page.goto('/');
  const portrait = page.getByRole('img', { name: 'ศุภเสก สังเกตุ', exact: true });
  await expect(portrait).toBeVisible();
  expect(await portrait.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const photoBounds = await portrait.boundingBox();
  const nameBounds = await page.getByRole('heading', { level: 1 }).boundingBox();
  expect(photoBounds.x).toBeGreaterThanOrEqual(nameBounds.x + nameBounds.width);
});

test('resume sections follow one column in reading order', async ({ page }) => {
  await page.goto('/');
  const sections = page.locator('.resume-body > section');
  await expect(sections).toHaveCount(5);
  expect(await sections.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-labelledby'))))
    .toEqual(['profile', 'education', 'skills', 'projects', 'credentials']);
  const bounds = await sections.evaluateAll(nodes => nodes.map(node => {
    const { x, y, width, bottom } = node.getBoundingClientRect();
    return { x, y, width, bottom };
  }));
  for (const [index, section] of bounds.entries()) {
    expect(Math.abs(section.x - bounds[0].x)).toBeLessThan(1);
    expect(Math.abs(section.width - bounds[0].width)).toBeLessThan(1);
    if (index > 0) {
      expect(section.y).toBeGreaterThanOrEqual(bounds[index - 1].bottom);
    }
  }
});

test('version endpoint identifies the exact source revision', async ({ request }) => {
  const response = await request.get('/version.json');
  expect(response.status()).toBe(200);
  const version = await response.json();
  const revision = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  expect(version.revision).toBe(revision);
  expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(Number.isNaN(Date.parse(version.builtAt))).toBe(false);
});
