import { test, expect } from '@playwright/test';
import { seedPlayerStorage } from './helpers/speech-mock.js';

test.describe('Onboarding screen', () => {
  test.beforeEach(async ({ page }) => {
    // Seed storage so the settings modal doesn't auto-open and inputs are pre-filled
    await seedPlayerStorage(page);
    await page.goto('/');
    await page.waitForSelector('#screen-onboarding.active');
  });

  test('onboarding screen is visible on load', async ({ page }) => {
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/);
    await expect(page.locator('#btn-start')).toBeVisible();
  });

  test('language buttons switch UI language', async ({ page }) => {
    await page.click('[data-lang="de"]');
    const startBtn = page.locator('#btn-start');
    await expect(startBtn).toBeVisible();
    await page.click('[data-lang="en"]');
    await expect(startBtn).toBeVisible();
  });

  test('theme selection highlights the chosen card', async ({ page }) => {
    await page.click('.theme-card[data-theme="ocean"]');
    await expect(page.locator('.theme-card[data-theme="ocean"]')).toHaveClass(/active/);
    await expect(page.locator('.theme-card[data-theme="space"]')).not.toHaveClass(/active/);
  });

  test('operation selector switches to divide', async ({ page }) => {
    await page.click('.op-btn[data-op="divide"]');
    await expect(page.locator('.op-btn[data-op="divide"]')).toHaveClass(/active/);
  });

  test('start is blocked when name is empty', async ({ page }) => {
    // Clear the DOM value of #input-name (which is inside the closed modal)
    await page.evaluate(() => { document.getElementById('input-name').value = ''; });
    await page.click('#btn-start');
    // Game screen should NOT become active
    await page.waitForTimeout(500);
    await expect(page.locator('#screen-game')).not.toHaveClass(/active/);
  });

  test('start is blocked when age is empty', async ({ page }) => {
    // Clear the DOM value of #input-age
    await page.evaluate(() => { document.getElementById('input-age').value = ''; });
    await page.click('#btn-start');
    await page.waitForTimeout(500);
    await expect(page.locator('#screen-game')).not.toHaveClass(/active/);
  });

  test('valid form transitions to game screen', async ({ page }) => {
    // Inputs are pre-filled from seeded storage — click start directly
    await page.click('#btn-start');
    await page.waitForSelector('#screen-game.active', { timeout: 5000 });
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });

  test('HUD shows player name after game starts', async ({ page }) => {
    await page.click('#btn-start');
    await page.waitForSelector('#screen-game.active', { timeout: 5000 });
    await expect(page.locator('#hud-name')).toContainText('TestPlayer');
  });

  test('settings modal opens and closes', async ({ page }) => {
    await page.click('#btn-settings');
    await expect(page.locator('#settings-modal')).toHaveClass(/open/);
    await page.click('#btn-settings-close');
    await expect(page.locator('#settings-modal')).not.toHaveClass(/open/);
  });

  test('practice mode can be selected in settings', async ({ page }) => {
    await page.click('#btn-settings');
    await page.click('.mode-btn[data-mode="practice"]');
    await expect(page.locator('.mode-btn[data-mode="practice"]')).toHaveClass(/active/);
    await page.click('#btn-settings-close');
  });

  test('difficulty buttons work', async ({ page }) => {
    await page.click('#btn-settings');
    await page.click('.diff-btn[data-diff="easy"]');
    await expect(page.locator('.diff-btn[data-diff="easy"]')).toHaveClass(/active/);
    await page.click('#btn-settings-close');
  });

  test('add operation shows number range group', async ({ page }) => {
    await page.click('.op-btn[data-op="add"]');
    await expect(page.locator('#numrange-group')).toBeVisible();
  });

  test('multiply operation shows zehner group', async ({ page }) => {
    // Multiply is default, so zehner group should be visible
    await expect(page.locator('#zehner-group')).toBeVisible();
  });
});
