import { test, expect } from '@playwright/test';

async function openShop(page, config = {}) {
  const {
    offers = ['chain', 'bomb', 'scoreMultSmall'],
    owned = ['shield', 'slotExpander'],
    coins = 12,
    maxSlots = 5,
  } = config;

  await page.goto('/');
  await page.evaluate(({ offers, owned, coins, maxSlots }) => {
    I18n.setLang('en');
    document.body.dataset.theme = 'space';
    window.__shopResult = null;
    document.getElementById('settings-modal')?.classList.remove('open');
    document.body.style.overflow = '';
    UI.showScreen('game');
    UI.showShop(
      offers.map(id => getUpgradeById(id)),
      coins,
      'space',
      owned.map(id => getUpgradeById(id)),
      false,
      maxSlots,
      result => { window.__shopResult = result; }
    );
  }, { offers, owned, coins, maxSlots });
  await expect(page.locator('#upgrade-picker')).toBeVisible();
}

test.describe('Power shop revamp', () => {
  test('shows owned upgrade details, hover titles, and item-type badges', async ({ page }) => {
    await openShop(page);

    await expect(page.locator('.shop-group-title')).toContainText([
      'Action items',
      'Passive effects',
      'Expansion bays'
    ]);

    const shieldCard = page.locator('.shop-owned-card', { hasText: 'Shield Array' });
    const bayCard = page.locator('.shop-owned-card', { hasText: 'Expansion Bay' });

    await expect(shieldCard).toContainText('An energy shield absorbs the next miss without losing a life.');
    await expect(bayCard).toContainText('Add 1 extra upgrade slot');
    await expect(shieldCard.locator('.shop-kind-badge')).toContainText('Action item');
    await expect(bayCard.locator('.shop-kind-badge')).toContainText('Passive effect');
    await expect(shieldCard).toHaveAttribute('title', /Shield Array — An energy shield absorbs the next miss/);
    await expect(bayCard).toHaveAttribute('title', /Expansion Bay — Add 1 extra upgrade slot/);
  });

  test('protects selling with confirmation and never allows selling the extension bay', async ({ page }) => {
    await openShop(page);

    const shieldCard = page.locator('.shop-owned-card', { hasText: 'Shield Array' });
    const bayCard = page.locator('.shop-owned-card', { hasText: 'Expansion Bay' });
    const shieldSellBtn = shieldCard.locator('.shop-sell-btn');

    await expect(bayCard.locator('.shop-sell-btn')).toHaveCount(0);
    await expect(bayCard).toContainText('stays installed for the whole run');

    await expect(shieldSellBtn).toHaveText('Sell for 🪙3');
    await shieldSellBtn.click();
    await expect(shieldSellBtn).toHaveText('Tap again to sell');
    await page.locator('.shop-done-btn').click();

    const armedOnlyResult = await page.evaluate(() => window.__shopResult);
    expect(armedOnlyResult.sold).toHaveLength(0);
    expect(armedOnlyResult.newCoins).toBe(12);

    await openShop(page);
    const confirmedSellBtn = page.locator('.shop-owned-card', { hasText: 'Shield Array' }).locator('.shop-sell-btn');
    await confirmedSellBtn.click();
    await confirmedSellBtn.click();
    await page.locator('.shop-done-btn').click();

    const soldResult = await page.evaluate(() => window.__shopResult);
    expect(soldResult.sold).toHaveLength(1);
    expect(soldResult.sold[0].id).toBe('shield');
    expect(soldResult.newCoins).toBe(15);
    expect(soldResult.newOrder.map(upg => upg.id)).toEqual(['slotExpander']);
  });

  test('uses internal menu scrolling on mobile when the shop gets long', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 740 });
    await openShop(page, {
      offers: ['chain', 'bomb', 'scoreMultSmall', 'starterBoost', 'replayScore', 'slotExpander'],
      owned: ['shield', 'bomb', 'chain', 'scoreMultSmall', 'starterBoost', 'slowAll', 'slotExpander'],
      coins: 40,
      maxSlots: 7,
    });

    const metrics = await page.locator('.shop-body').evaluate(el => ({
      overflowY: getComputedStyle(el).overflowY,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      scrollTopAfterMove: (() => {
        el.scrollTop = 240;
        return el.scrollTop;
      })()
    }));

    expect(metrics.overflowY).toBe('auto');
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
    expect(metrics.scrollTopAfterMove).toBeGreaterThan(0);
  });
});
