import { test, expect } from '@playwright/test';
import { seedPlayerStorage } from './helpers/speech-mock.js';

const liveQuestion = () =>
  window.__gameState && window.__gameState.objects &&
  window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed);

test.describe('Game over screen', () => {
  async function burnLives(page) {
    // Lives are lost when objects fall off screen, not from wrong answers.
    // Directly trigger game over by setting lives to 0 and calling endGame.
    await page.evaluate(() => {
      if (window.__gameState) window.__gameState.lives = 0;
      if (window.__endGame) window.__endGame();
    });
  }

  async function startEasyGame(page) {
    await seedPlayerStorage(page);
    await page.goto('/');
    await page.click('#btn-settings');
    await page.click('.diff-btn[data-diff="easy"]');
    await page.click('#btn-settings-close');
    await page.click('#btn-start');
    await page.waitForSelector('#screen-game.active', { timeout: 5000 });
  }

  test('game-over screen appears after losing all lives (easy, 6 lives)', async ({ page }) => {
    await startEasyGame(page);
    await burnLives(page);
    await page.waitForSelector('#screen-gameover.active', { timeout: 8000 });
    await expect(page.locator('#screen-gameover')).toHaveClass(/active/);
  });

  test('game-over screen shows play-again button', async ({ page }) => {
    await startEasyGame(page);
    await burnLives(page);
    await page.waitForSelector('#screen-gameover.active', { timeout: 8000 });
    await expect(page.locator('#btn-play-again')).toBeVisible();
  });

  test('game-over screen shows menu button', async ({ page }) => {
    await startEasyGame(page);
    await burnLives(page);
    await page.waitForSelector('#screen-gameover.active', { timeout: 8000 });
    await expect(page.locator('#btn-menu')).toBeVisible();
  });

  test('play-again returns to game screen', async ({ page }) => {
    await startEasyGame(page);
    await burnLives(page);
    await page.waitForSelector('#screen-gameover.active', { timeout: 8000 });
    await page.click('#btn-play-again');
    await page.waitForSelector('#screen-game.active', { timeout: 5000 });
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });

  test('menu button from game-over returns to onboarding', async ({ page }) => {
    await startEasyGame(page);
    await burnLives(page);
    await page.waitForSelector('#screen-gameover.active', { timeout: 8000 });
    await page.click('#btn-menu');
    await page.waitForSelector('#screen-onboarding.active', { timeout: 3000 });
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/);
  });

  test('practice mode never triggers game-over from wrong answers', async ({ page }) => {
    await seedPlayerStorage(page);
    await page.goto('/');
    await page.click('#btn-settings');
    await page.click('.mode-btn[data-mode="practice"]');
    await page.click('#btn-settings-close');
    await page.click('#btn-start');
    await page.waitForSelector('#screen-game.active', { timeout: 5000 });

    for (let i = 0; i < 10; i++) {
      await page.waitForFunction(liveQuestion, null, { timeout: 10000 });
      await page.fill('#answer-input', '-999');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });
});
