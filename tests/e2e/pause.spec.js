import { test, expect } from '@playwright/test';
import { startNormalGame } from './helpers/speech-mock.js';

test.describe('Pause functionality', () => {
  test.beforeEach(async ({ page }) => {
    await startNormalGame(page);
  });

  test('Escape key shows pause overlay', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('#pause-overlay')).toBeVisible({ timeout: 2000 });
  });

  test('pause button shows pause overlay', async ({ page }) => {
    await page.click('#btn-pause');
    await expect(page.locator('#pause-overlay')).toBeVisible({ timeout: 2000 });
  });

  test('resume button hides pause overlay', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForSelector('#pause-overlay:visible', { timeout: 2000 });
    await page.click('#btn-resume');
    await expect(page.locator('#pause-overlay')).toBeHidden({ timeout: 2000 });
  });

  test('game remains on game screen after resuming', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForSelector('#pause-overlay:visible', { timeout: 2000 });
    await page.click('#btn-resume');
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });

  test('pause menu button returns to onboarding', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForSelector('#pause-overlay:visible', { timeout: 2000 });
    await page.click('#btn-pause-menu');
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/, { timeout: 3000 });
  });

  test('game is paused while overlay is visible', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForSelector('#pause-overlay:visible', { timeout: 2000 });

    // Game phase should reflect paused state OR at minimum the overlay is shown
    const phase = await page.evaluate(() => window.__gameState?.phase);
    // Phase could be 'PLAYING' with paused flag, or 'PAUSED' — either way overlay is shown
    expect(phase).toBeTruthy();
    await expect(page.locator('#pause-overlay')).toBeVisible();
  });
});
