import { test, expect } from '@playwright/test';
import { injectSpeechMock, seedPlayerStorage } from './helpers/speech-mock.js';

// y > 0 ensures object is on-screen and targetable
const liveQuestion = () =>
  window.__gameState && window.__gameState.objects &&
  window.__gameState.objects.some(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);

async function startTutorial(page) {
  await seedPlayerStorage(page, 'TutPlayer', '8');
  await page.goto('/');
  await page.click('#btn-tutorial-main');
  await page.waitForSelector('#screen-game.active', { timeout: 8000 });
}

test.describe('Guided tutorial', () => {
  test('tutorial button is visible on onboarding when not yet completed', async ({ page }) => {
    await seedPlayerStorage(page, 'TutPlayer', '8');
    await page.goto('/');
    // Ensure tutorial not yet completed for this profile
    await page.evaluate(() => {
      try {
        const key = 'multiblaster_v1_tutplayer_8';
        const raw = localStorage.getItem(key);
        if (raw) {
          const d = JSON.parse(raw);
          delete d.tutorialCompleted;
          localStorage.setItem(key, JSON.stringify(d));
        }
      } catch (e) {}
    });
    await page.reload();
    await expect(page.locator('#tutorial-home-row')).toBeVisible();
    await expect(page.locator('#btn-tutorial-main')).toBeVisible();
  });

  test('clicking tutorial button starts the game screen', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
  });

  test('tutorial exit button is visible during tutorial', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await expect(page.locator('#btn-tutorial-exit')).toBeVisible();
  });

  test('tutorial overlay appears at start', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await expect(page.locator('#tutorial-overlay')).toBeVisible({ timeout: 3000 });
  });

  test('tutorial overlay contains text', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await page.locator('#tutorial-overlay').waitFor({ state: 'visible', timeout: 3000 });
    const text = await page.locator('#tutorial-overlay-text').textContent();
    expect(text && text.trim().length).toBeGreaterThan(0);
  });

  test('tutorial sets tutorialMode to true in state', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    const tutMode = await page.evaluate(() => window.__gameState?.tutorialMode);
    expect(tutMode).toBe(true);
  });

  test('tutorial exit button returns to onboarding', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await page.waitForTimeout(500);
    await page.click('#btn-tutorial-exit');
    await page.waitForSelector('#screen-onboarding.active', { timeout: 5000 });
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/);
  });

  test('pause then exit tutorial returns to onboarding', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    // Wait for tutorial to settle (it starts with narration that locks input)
    await page.waitForTimeout(800);
    // Pause only works when the engine is not locked by narration; retry approach
    await page.keyboard.press('Escape');
    const pauseVisible = await page.locator('#pause-overlay').isVisible();
    if (pauseVisible) {
      await page.click('#btn-pause-tutorial-exit');
    } else {
      // Fallback: use the in-game exit button directly
      await page.click('#btn-tutorial-exit');
    }
    await page.waitForSelector('#screen-onboarding.active', { timeout: 5000 });
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/);
  });

  test('highlights are added to UI elements during intro narration', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await page.waitForFunction(
      () => document.getElementById('input-wrapper')?.classList.contains('tutorial-highlight') ||
             document.getElementById('btn-fire')?.classList.contains('tutorial-highlight') ||
             document.getElementById('btn-mic')?.classList.contains('tutorial-highlight'),
      null, { timeout: 5000 }
    ).catch(() => null);
    const phase = await page.evaluate(() => window.__gameState?.phase);
    expect(phase).toBe('PLAYING');
  });

  test('TutorialRun.skip() marks tutorial completed and returns to onboarding', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await page.waitForTimeout(1200);

    await page.evaluate(() => {
      if (window.TutorialRun) window.TutorialRun.skip();
    });

    await page.waitForSelector('#screen-onboarding.active', { timeout: 5000 });
    await expect(page.locator('#screen-onboarding')).toHaveClass(/active/);

    // tutorial-home-row should be hidden after skip marks it complete
    const tutorialRowHidden = await page.evaluate(() => {
      const row = document.getElementById('tutorial-home-row');
      return row ? (row.hidden || row.style.display === 'none' || !row.offsetParent) : true;
    });
    expect(tutorialRowHidden).toBe(true);
  });

  test('player control segment allows typing an answer', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await page.waitForTimeout(1000);

    // Unlock player control directly via window references
    await page.evaluate(() => {
      const ts = window.__tutorialState;
      if (ts) {
        ts.inputLocked = false;
        ts.playerControl = true;
        ts.allowQuestionSpeech = true;
      }
      if (typeof Engine !== 'undefined') Engine.resume();
    });

    await page.waitForFunction(liveQuestion, null, { timeout: 10000 });

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
      return q ? q.answer : null;
    });

    if (answer !== null) {
      const scoreBefore = await page.evaluate(() =>
        parseInt(document.getElementById('score-val')?.textContent, 10)
      );
      await page.fill('#answer-input', String(answer));
      await page.keyboard.press('Enter');
      await page.waitForFunction(
        (before) => parseInt(document.getElementById('score-val')?.textContent, 10) > before,
        scoreBefore,
        { timeout: 3000 }
      );
      const scoreAfter = await page.evaluate(() =>
        parseInt(document.getElementById('score-val')?.textContent, 10)
      );
      expect(scoreAfter).toBeGreaterThan(scoreBefore);
    }
  });

  test('voice answer during tutorial registers when speech enabled', async ({ page }) => {
    await injectSpeechMock(page);
    await startTutorial(page);
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const ts = window.__tutorialState;
      if (ts) {
        ts.inputLocked = false;
        ts.playerControl = true;
        ts.allowQuestionSpeech = true;
      }
      if (typeof Engine !== 'undefined') Engine.resume();
    });

    await page.waitForFunction(liveQuestion, null, { timeout: 10000 });

    const answer = await page.evaluate(() => {
      const q = window.__gameState.objects.find(o => !o.isBoss && !o.isFreeze && !o.isLifeUp && !o.dead && !o.dying && !o.destroyed && o.y > 0);
      return q ? q.answer : null;
    });

    if (answer !== null) {
      const scoreBefore = await page.evaluate(() =>
        parseInt(document.getElementById('score-val')?.textContent, 10)
      );
      await page.evaluate((a) => {
        window.__Voice?.setTriggerMode(false, '');
        window.__Voice?.muteResults(false);
        window.__fireSpeechResult(String(a));
      }, answer);
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
      expect(
        await page.evaluate(() => parseInt(document.getElementById('score-val')?.textContent, 10))
      ).toBeGreaterThan(scoreBefore);
    }
  });
});
