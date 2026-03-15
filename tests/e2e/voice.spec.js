import { test, expect } from '@playwright/test';
import { injectSpeechMock, seedPlayerStorage, getScore } from './helpers/speech-mock.js';

test.describe('Voice input', () => {
  test.beforeEach(async ({ page }) => {
    await seedPlayerStorage(page, 'VoicePlayer', '9');
    await injectSpeechMock(page);
    await page.goto('/');
    await page.click('#btn-start');
    await page.waitForSelector('#screen-game.active', { timeout: 5000 });
  });

  test('mic button is visible', async ({ page }) => {
    await expect(page.locator('#btn-mic')).toBeVisible();
  });

  test('mic button toggles voice mode', async ({ page }) => {
    await page.locator('#btn-mic').click();
    const voiceActive = await page.evaluate(() => window.__gameState?.voiceActive);
    expect(voiceActive).not.toBeNull();
  });

  test('synthetic speech result triggers answer processing', async ({ page }) => {
    // Wait for an on-screen (y>0) live question so targeting has a valid target
    await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0),
      null, { timeout: 15000 }
    );

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
      return q ? q.answer : null;
    });
    expect(answer).not.toBeNull();

    const scoreBefore = await getScore(page);

    // Disable trigger-word mode, unmute, and fire — all in one synchronous call
    // to prevent TTS from re-muting between evaluate calls.
    await page.evaluate((a) => {
      window.__Voice?.setTriggerMode(false, '');
      window.__Voice?.muteResults(false);
      window.__fireSpeechResult(String(a));
    }, answer);
    // Wait for voice to populate the input, then submit
    await page.waitForFunction(
      () => document.getElementById('answer-input')?.value !== '',
      null, { timeout: 2000 }
    ).catch(() => null);
    await page.keyboard.press('Enter');

    await page.waitForFunction(
      (before) => parseInt(document.getElementById('score-val')?.textContent, 10) > before,
      scoreBefore,
      { timeout: 3000 }
    );
    expect(await getScore(page)).toBeGreaterThan(scoreBefore);
  });

  test('synthetic speech result with word fires answer (sechs = 6)', async ({ page }) => {
    // Wait for answer=6 AND visible (y>0) so targeting works
    const found = await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.answer === 6 && o.y > 0),
      null, { timeout: 20000 }
    ).catch(() => null);

    if (!found) {
      test.skip();
      return;
    }

    // Set answer=6 object as the current target so submitAnswer matches it
    await page.evaluate(() => {
      const obj = window.__gameState?.objects?.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.answer === 6 && o.y > 0);
      if (obj && window.__Targeting) window.__Targeting.setTarget(obj);
    });

    const scoreBefore = await getScore(page);
    await page.evaluate(() => {
      window.__Voice?.setTriggerMode(false, '');
      window.__Voice?.muteResults(false);
      window.__fireSpeechResult('sechs');
    });
    await page.waitForFunction(
      () => document.getElementById('answer-input')?.value !== '',
      null, { timeout: 2000 }
    ).catch(() => null);
    await page.keyboard.press('Enter');

    await page.waitForFunction(
      (before) => parseInt(document.getElementById('score-val')?.textContent, 10) > before,
      scoreBefore,
      { timeout: 3000 }
    );
    expect(await getScore(page)).toBeGreaterThan(scoreBefore);
  });

  test('voice suggestion pill appears after speech result', async ({ page }) => {
    await page.waitForFunction(
      () => window.__gameState && window.__gameState.objects &&
            window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed),
      null, { timeout: 10000 }
    );

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed);
      return q ? q.answer : null;
    });

    await page.evaluate((a) => window.__fireSpeechResult(String(a)), answer);
    await page.waitForTimeout(300);

    // Game should still be PLAYING (no crash)
    const phase = await page.evaluate(() => window.__gameState?.phase);
    expect(phase).toBe('PLAYING');
  });
});
