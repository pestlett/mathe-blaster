const { makeContext, loadModule } = require('./helpers/context');

const ALL_LAB_IDS = [
  'numberline',
  'placevalue',
  'neighbors',
  'rounding',
  'area',
  'written-addsub',
  'written-mul',
  'written-div',
  'units',
  'geometry',
  'charts',
];

function loadWalkthroughEnv() {
  const ctx = makeContext();
  loadModule(ctx, 'i18n.js');
  loadModule(ctx, 'labs/lab-host.js');
  loadModule(ctx, 'labs/walkthrough-data.js');
  loadModule(ctx, 'labs/walkthrough-data-2.js');
  loadModule(ctx, 'labs/walkthrough.js');
  return ctx;
}

describe('Grade 4 Worked-Example Walkthroughs (PIKAS)', () => {
  test('all 11 Grade 4 labs are registered in LabWalkthroughData', () => {
    const ctx = loadWalkthroughEnv();
    const ids = ctx.LabWalkthroughData.listIds();
    for (const id of ALL_LAB_IDS) {
      expect(ids).toContain(id);
    }
    expect(ids.length).toBe(11);
  });

  test('every lab has 3 tiers, 2 contrasting examples per tier, >=2 beats per example, and complete DE/EN/ES strings', () => {
    const ctx = loadWalkthroughEnv();
    for (const id of ALL_LAB_IDS) {
      const data = ctx.LabWalkthroughData.get(id);
      expect(data).toBeTruthy();
      expect(Array.isArray(data.tiers)).toBe(true);
      expect(data.tiers.length).toBe(3);

      for (const tier of data.tiers) {
        expect(tier.label.de.length).toBeGreaterThan(0);
        expect(tier.label.en.length).toBeGreaterThan(0);
        expect(tier.label.es.length).toBeGreaterThan(0);
        expect(tier.examples.length).toBe(2);

        for (const ex of tier.examples) {
          expect(ex.label.de.length).toBeGreaterThan(0);
          expect(ex.label.en.length).toBeGreaterThan(0);
          expect(ex.label.es.length).toBeGreaterThan(0);
          expect(ex.goal.de.length).toBeGreaterThan(0);
          expect(ex.goal.en.length).toBeGreaterThan(0);
          expect(ex.goal.es.length).toBeGreaterThan(0);
          expect(ex.beats.length).toBeGreaterThanOrEqual(2);

          for (const beat of ex.beats) {
            expect(beat.title.de.length).toBeGreaterThan(0);
            expect(beat.title.en.length).toBeGreaterThan(0);
            expect(beat.title.es.length).toBeGreaterThan(0);
            expect(beat.text.de.length).toBeGreaterThan(0);
            expect(beat.text.en.length).toBeGreaterThan(0);
            expect(beat.text.es.length).toBeGreaterThan(0);
            expect(beat.visual).toBeTruthy();
            const html = ctx.LabWalkthrough.renderVisualHtml(beat.visual);
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(20);
          }
        }
      }
    }
  });

  test('written-addsub strictly separates Abziehverfahren (Entbündeln) from Ergänzungsverfahren (Erweitern)', () => {
    const ctx = loadWalkthroughEnv();
    const abzieh = ctx.LabWalkthroughData.get('written-addsub', { method: 'abzieh' });
    const ergaenz = ctx.LabWalkthroughData.get('written-addsub', { method: 'ergaenz' });

    const abziehLabel = abzieh.tiers[1].label.de;
    const ergaenzLabel = ergaenz.tiers[1].label.de;
    expect(abziehLabel).toMatch(/Abzieh/i);
    expect(ergaenzLabel).toMatch(/Ergänz/i);

    const abziehText = abzieh.tiers[1].examples[1].beats.map(b => b.title.de + ' ' + b.text.de).join(' ');
    const ergaenzText = ergaenz.tiers[1].examples[1].beats.map(b => b.title.de + ' ' + b.text.de).join(' ');
    expect(abziehText).toMatch(/entbündel/i);
    expect(ergaenzText).toMatch(/ergänz/i);

    // Every beat renders cleanly in both modes
    for (const data of [abzieh, ergaenz]) {
      for (const tier of data.tiers) {
        for (const ex of tier.examples) {
          for (const beat of ex.beats) {
            expect(ctx.LabWalkthrough.renderVisualHtml(beat.visual).length).toBeGreaterThan(20);
          }
        }
      }
    }
  });

  test('never teaches rote shortcut "Null anhängen" or "Komma verschieben" in walkthrough narration', () => {
    const ctx = loadWalkthroughEnv();
    for (const id of ALL_LAB_IDS) {
      const data = ctx.LabWalkthroughData.get(id);
      const allDe = JSON.stringify(data).toLowerCase();
      expect(allDe).not.toMatch(/null anhängen|komma verschieben/);
    }
  });

  test('state navigation advances through beats, transitions to Example 2, and switches tiers cleanly', () => {
    const ctx = loadWalkthroughEnv();
    expect(ctx.LabWalkthrough.open('numberline', 0)).toBe(true);
    expect(ctx.LabWalkthrough._getState()).toMatchObject({ open: true, labId: 'numberline', tierIdx: 0, exIdx: 0, beatIdx: 0 });

    ctx.LabWalkthrough.nextStep();
    expect(ctx.LabWalkthrough._getState().beatIdx).toBe(1);
    ctx.LabWalkthrough.prevStep();
    expect(ctx.LabWalkthrough._getState().beatIdx).toBe(0);

    // Advance past all beats in Example 1 -> should jump to Example 2 beat 0
    const ex1Beats = ctx.LabWalkthroughData.get('numberline').tiers[0].examples[0].beats.length;
    for (let i = 0; i < ex1Beats; i++) ctx.LabWalkthrough.nextStep();
    expect(ctx.LabWalkthrough._getState()).toMatchObject({ exIdx: 1, beatIdx: 0 });

    // Switch tier resets exIdx & beatIdx
    ctx.LabWalkthrough.setTier(2);
    expect(ctx.LabWalkthrough._getState()).toMatchObject({ tierIdx: 2, exIdx: 0, beatIdx: 0 });

    ctx.LabWalkthrough.close();
    expect(ctx.LabWalkthrough._getState().open).toBe(false);
  });
});
