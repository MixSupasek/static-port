import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

test('homepage serves the portfolio and all five projects', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1, name: 'Supasek Sangket' })).toBeVisible();
  await expect(page.getByText('Thai — Native', { exact: true })).toBeVisible();
  await expect(page.getByText('English — Intermediate', { exact: true })).toBeVisible();
  await expect(page.locator('.credentials li')).toHaveCount(3);
  await expect(page.getByText('AWS Academy Graduate - Cloud Architecting', { exact: true })).toHaveCount(1);
  await expect(page.getByText('AWS Academy Graduate - Microservices and CI/CD Pipeline Builder', { exact: true })).toHaveCount(1);
  for (const name of ['Personal Portfolio Website on AWS S3', 'GitOps Release Pipeline', 'Bar Mai FoodHub App', 'KUQuest', 'Football Player Market Value Data Warehouse']) {
    await expect(page.getByRole('heading', { level: 3, name, exact: true })).toBeVisible();
  }
  await expect(page.locator('.project-summary')).toHaveCount(5);
  for (const project of await page.locator('.project-summary').all()) {
    await expect(project.locator('li')).toHaveCount(2);
    await expect(project.locator('strong')).toHaveCount(0);
  }
});

test('contact links remain usable and projects have no links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'mix.supasek@gmail.com' }))
    .toHaveAttribute('href', 'mailto:mix.supasek@gmail.com');
  await expect(page.getByRole('link', { name: '0954847401' }))
    .toHaveAttribute('href', 'tel:+66954847401');
  const projectLinks = page.locator('section[aria-labelledby="projects"] a');
  await expect(projectLinks).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'github.com/MixSupasek', exact: true }))
    .toHaveAttribute('href', 'https://github.com/MixSupasek');
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
  const portrait = page.getByRole('img', { name: 'Supasek Sangket', exact: true });
  await expect(portrait).toBeVisible();
  expect(await portrait.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const photoBounds = await portrait.boundingBox();
  const nameBounds = await page.getByRole('heading', { level: 1 }).boundingBox();
  expect(photoBounds.x).toBeGreaterThanOrEqual(nameBounds.x + nameBounds.width);
});

test('resume sections follow one column in reading order', async ({ page }) => {
  await page.goto('/');
  const sections = page.locator('.resume-body > section');
  await expect(sections).toHaveCount(6);
  expect(await sections.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-labelledby'))))
    .toEqual(['profile', 'education', 'skills', 'projects', 'credentials', 'languages']);
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
