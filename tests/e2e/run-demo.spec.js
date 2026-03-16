import { test, expect } from '@playwright/test';
import { seedPlayerStorage } from './helpers/speech-mock.js';

async function startRunDemo(page) {
  await seedPlayerStorage(page, 'DemoPlayer', '9');
  await page.goto('/');
  await page.click('#btn-run-demo');
  await page.waitForSelector('#screen-game.active', { timeout: 8000 });
}

test.describe('Run mode demo', () => {
  test('btn-run-demo is visible on the onboarding screen', async ({ page }) => {
    await seedPlayerStorage(page, 'DemoPlayer', '9');
    await page.goto('/');
    await expect(page.locator('#btn-run-demo')).toBeVisible();
  });

  test('clicking the demo button starts the game screen', async ({ page }) => {
    await startRunDemo(page);
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });

  test('demo sets runDemoMode flag in state', async ({ page }) => {
    await startRunDemo(page);
    const runDemoMode = await page.evaluate(() => window.__gameState?.runDemoMode);
    expect(runDemoMode).toBe(true);
  });

  test('demo exit button is visible during demo', async ({ page }) => {
    await startRunDemo(page);
    await expect(page.locator('#btn-tutorial-exit')).toBeVisible();
  });

  test('demo exit button returns to onboarding', async ({ page }) => {
    await startRunDemo(page);
    await page.waitForTimeout(500);
    await page.click('#btn-tutorial-exit');
    await page.waitForSelector('#screen-onboarding.active', { timeout: 5000 });
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/);
  });

  test('shop opens and then closes automatically after demo auto-buy', async ({ page }) => {
    await startRunDemo(page);

    // Fast-forward game state so the ante-1 shop triggers immediately
    await page.evaluate(() => {
      if (!window.__gameState) return;
      const s = window.__gameState;
      s.level = 3;
      s.correctThisLevel = 9;
      s.attemptsThisLevel = 9;
      s.score = 200;          // above ante-1 target of 150
      s.anteStartScore = 0;
      s._bossSpawnedThisLevel = false;
    });

    // Shop should open (upgrade-picker becomes visible)
    await page.waitForSelector('#upgrade-picker:not(.hidden)', { timeout: 15000 });

    // Shop must then close automatically without any player interaction
    await page.waitForFunction(
      () => document.getElementById('upgrade-picker')?.classList.contains('hidden'),
      null, { timeout: 15000 }
    );

    // After the shop closes the game screen should still be active
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });

  test('RunDemoRun.skip() returns to onboarding', async ({ page }) => {
    await startRunDemo(page);
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      if (window.RunDemoRun) window.RunDemoRun.skip();
    });

    await page.waitForSelector('#screen-onboarding.active', { timeout: 5000 });
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/);
  });
});
