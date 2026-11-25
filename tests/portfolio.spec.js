import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';

test('homepage serves the portfolio and all three projects', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Supasek Sangket' })).toBeVisible();
  for (const name of ['GitOps Release Pipeline', 'Bar Mai FoodHub App', 'KUQuest']) {
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
  await expect(projectLinks).toHaveCount(4);
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

test('version endpoint identifies the exact source revision', async ({ request }) => {
  const response = await request.get('/version.json');
  expect(response.status()).toBe(200);
  const version = await response.json();
  const revision = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  expect(version.revision).toBe(revision);
  expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(Number.isNaN(Date.parse(version.builtAt))).toBe(false);
});
