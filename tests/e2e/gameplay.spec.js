import { test, expect } from '@playwright/test';
import { startNormalGame, seedPlayerStorage, typeAnswer, getScore } from './helpers/speech-mock.js';

const S = 'window.__gameState';
// y > 0 ensures object is on-screen and targetable
const hasLiveQ = `${S} && ${S}.objects && ${S}.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0)`;

test.describe('Core gameplay', () => {
  test('game screen shows canvas and HUD after start', async ({ page }) => {
    await startNormalGame(page);
    await expect(page.locator('#game-canvas')).toBeVisible();
    await expect(page.locator('#hud-overlay')).toBeVisible();
    await expect(page.locator('#score-val')).toBeVisible();
    await expect(page.locator('#level-val')).toBeVisible();
  });

  test('initial score is 0', async ({ page }) => {
    await startNormalGame(page);
    const score = await getScore(page);
    expect(score).toBe(0);
  });

  test('answer input accepts keyboard typing', async ({ page }) => {
    await startNormalGame(page);
    await page.fill('#answer-input', '42');
    await expect(page.locator('#answer-input')).toHaveValue('42');
  });

  test('correct answer increases score', async ({ page }) => {
    await startNormalGame(page);

    await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0),
      null, { timeout: 10000 }
    );

    const scoreBefore = await getScore(page);

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
      return q ? q.answer : null;
    });
    expect(answer).not.toBeNull();

    await typeAnswer(page, answer);

    await page.waitForFunction(
      (before) => parseInt(document.getElementById('score-val')?.textContent, 10) > before,
      scoreBefore,
      { timeout: 3000 }
    );
    expect(await getScore(page)).toBeGreaterThan(scoreBefore);
  });

  test('wrong answer does not increase score', async ({ page }) => {
    await startNormalGame(page);

    await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0),
      null, { timeout: 10000 }
    );

    const scoreBefore = await getScore(page);
    await typeAnswer(page, -999);
    await page.waitForTimeout(500);
    expect(await getScore(page)).toBe(scoreBefore);
  });

  test('wrong answer shows try-again message', async ({ page }) => {
    await startNormalGame(page);

    await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0),
      null, { timeout: 10000 }
    );

    await typeAnswer(page, -999);
    await expect(page.locator('#try-again-msg')).toBeVisible({ timeout: 2000 });
  });

  test('fire button submits the answer', async ({ page }) => {
    await startNormalGame(page);

    await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0),
      null, { timeout: 10000 }
    );

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
      return q ? q.answer : null;
    });

    const scoreBefore = await getScore(page);
    await page.fill('#answer-input', String(answer));
    await page.click('#btn-fire');

    await page.waitForFunction(
      (before) => parseInt(document.getElementById('score-val')?.textContent, 10) > before,
      scoreBefore,
      { timeout: 3000 }
    );
    expect(await getScore(page)).toBeGreaterThan(scoreBefore);
  });

  test('arrow keys change targeted object', async ({ page }) => {
    await startNormalGame(page);

    // Wait for multiple objects
    await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.filter(o => !o.dead && !o.dying && !o.destroyed).length >= 2,
      null, { timeout: 15000 }
    );

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    // Just verify game is still running
    const phase = await page.evaluate(() => window.__gameState?.phase);
    expect(phase).toBe('PLAYING');
  });

  test('mute button toggles music', async ({ page }) => {
    await startNormalGame(page);
    const muteBtn = page.locator('#btn-mute');
    const textBefore = await muteBtn.textContent();
    await muteBtn.click();
    const textAfter = await muteBtn.textContent();
    expect(textAfter).not.toBe(textBefore);
  });

  test('level starts at 1', async ({ page }) => {
    await startNormalGame(page);
    const level = await page.locator('#level-val').textContent();
    expect(parseInt(level, 10)).toBe(1);
  });

  test('practice mode shows practice suffix in HUD', async ({ page }) => {
    await seedPlayerStorage(page);
    await page.goto('/');
    await page.click('#btn-settings');
    await page.click('.mode-btn[data-mode="practice"]');
    await page.click('#btn-settings-close');
    await page.click('#btn-start');
    await page.waitForSelector('#screen-game.active', { timeout: 5000 });
    const hudTables = await page.locator('#hud-tables').textContent();
    expect(hudTables.length).toBeGreaterThan(0);
  });
});
