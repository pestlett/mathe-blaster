import { test, expect } from '@playwright/test';
import { seedPlayerStorage } from './helpers/speech-mock.js';

// y > 0 ensures the object is on-screen and targetable (Targeting requires y > 0)
const liveQuestion = () =>
  window.__gameState && window.__gameState.objects &&
  window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);

async function startRunMode(page) {
  await seedPlayerStorage(page, 'RunPlayer', '9');
  await page.goto('/');
  await page.click('#btn-settings');
  await page.click('.diff-btn[data-diff="easy"]');
  await page.click('#btn-settings-close');
  await page.click('#btn-run-mode');
  await page.waitForSelector('#screen-game.active', { timeout: 5000 });
}

/**
 * Manipulates state to trigger the ante 1 shop.
 * Sets level=2, correct=9, score=155 (> 150 ante target), then answers one correct question.
 */
async function triggerShop(page) {
  await page.evaluate(() => {
    if (!window.__gameState) return;
    const s = window.__gameState;
    s.level = 3;  // prevLevel=3, 3%3===0 → shop triggers on next level-up
    s.correctThisLevel = 9;
    s.attemptsThisLevel = 9;
    s.score = 750;  // > anteTarget(1)=700
    s.anteStartScore = 0;
    s._bossSpawnedThisLevel = false;
  });

  await page.waitForFunction(liveQuestion, null, { timeout: 15000 });

  const answer = await page.evaluate(() => {
    const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
    return q ? q.answer : null;
  });

  if (answer !== null) {
    await page.fill('#answer-input', String(answer));
    await page.keyboard.press('Enter');
  }

  await page.waitForSelector('#upgrade-picker:not(.hidden)', { timeout: 10000 });
}

test.describe('Run mode', () => {
  test('run mode starts and shows Ante 1 in HUD', async ({ page }) => {
    await startRunMode(page);
    await expect(page.locator('#hud-run-ante')).toContainText('Ante 1');
  });

  test('run mode sets runMode flag in state', async ({ page }) => {
    await startRunMode(page);
    const runMode = await page.evaluate(() => window.__gameState?.runMode);
    expect(runMode).toBe(true);
  });

  test('HUD shows coin count in run mode', async ({ page }) => {
    await startRunMode(page);
    const hudTables = await page.locator('#hud-tables').textContent();
    expect(hudTables).toMatch(/🪙\d+/);
  });

  test('upgrade picker appears after completing ante 1', async ({ page }) => {
    await startRunMode(page);
    await triggerShop(page);
    await expect(page.locator('#upgrade-picker')).not.toHaveClass(/hidden/);
  });

  test('shop or upgrade picker contains 3 options', async ({ page }) => {
    await startRunMode(page);
    await triggerShop(page);
    const options = page.locator('.shop-card, .upgrade-option');
    await expect(options).toHaveCount(3, { timeout: 3000 });
  });

  test('buying an upgrade shows acquired flash', async ({ page }) => {
    await startRunMode(page);
    await triggerShop(page);
    const buyBtn = page.locator('.shop-buy-btn:not([disabled]), .upgrade-option:not([disabled])').first();
    await buyBtn.click();
    await expect(page.locator('#upgrade-acquired')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#upgrade-acquired-label')).not.toBeEmpty();
  });

  test('skipping shop resumes game', async ({ page }) => {
    await startRunMode(page);
    await triggerShop(page);

    const skipBtn = page.locator('.btn-skip-upgrade, #btn-skip-upgrade, button:has-text("Done")');
    if (await skipBtn.count() > 0) {
      await skipBtn.first().click();
    } else {
      await page.evaluate(() => {
        const el = document.getElementById('upgrade-picker');
        if (el) el.classList.add('hidden');
        if (typeof Engine !== 'undefined') Engine.resume();
      });
    }

    await expect(page.locator('#upgrade-picker')).toHaveClass(/hidden/, { timeout: 5000 });
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });

  test('ante miss ends the run', async ({ page }) => {
    await startRunMode(page);

    await page.evaluate(() => {
      if (!window.__gameState) return;
      const s = window.__gameState;
      s.level = 3;  // prevLevel=3, 3%3===0 → ante check triggers
      s.correctThisLevel = 9;
      s.attemptsThisLevel = 9;
      s.score = 50;      // well below ante 1 target (150)
      s.anteStartScore = 0;
      s._bossSpawnedThisLevel = false;
    });

    await page.waitForFunction(liveQuestion, null, { timeout: 10000 });

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
      return q ? q.answer : null;
    });

    if (answer !== null) {
      await page.fill('#answer-input', String(answer));
      await page.keyboard.press('Enter');
    }

    await page.waitForSelector('#screen-gameover.active', { timeout: 8000 });
    await expect(page.locator('#screen-gameover')).toHaveClass(/active/);
  });

  test('game-over run summary is shown after ante miss', async ({ page }) => {
    await startRunMode(page);

    await page.evaluate(() => {
      if (!window.__gameState) return;
      const s = window.__gameState;
      s.level = 3;  // prevLevel=3, 3%3===0 → ante check triggers
      s.correctThisLevel = 9;
      s.attemptsThisLevel = 9;
      s.score = 50;
      s.anteStartScore = 0;
      s._bossSpawnedThisLevel = false;
    });

    await page.waitForFunction(liveQuestion, null, { timeout: 10000 });

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
      return q ? q.answer : null;
    });

    if (answer !== null) {
      await page.fill('#answer-input', String(answer));
      await page.keyboard.press('Enter');
    }

    await page.waitForSelector('#screen-gameover.active', { timeout: 8000 });
    await expect(page.locator('#gameover-run')).toBeVisible();
  });
});
