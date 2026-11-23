// Klasse 4 Walkthrough Data — Part 1 (Registry + Chapter 1: 5 Labs)
// Every tier of every lab has 2 contrasting PIKAS-aligned worked examples (clean archetype + classic trap)
// with 4 child-friendly beats (DE / EN / ES) synced to visual descriptors.

const LabWalkthroughData = (() => {
  'use strict';

  const L = (de, en, es) => ({ de, en, es });
  const labs = {};

  function register(labId, dataOrFn) {
    labs[labId] = dataOrFn;
  }

  function get(labId, options) {
    const entry = labs[labId];
    if (!entry) return null;
    return typeof entry === 'function' ? entry(options || {}) : entry;
  }

  function listIds() {
    return Object.keys(labs);
  }

  // =========================================================================
  // 1. ZAHLENSTRAHL-LABOR (numberline)
  // =========================================================================
  register('numberline', {
    tiers: [
      // Tier 0: Equal steps
      {
        label: L('Stufe 1 · Schritte erkennen', 'Level 1 · Spot the steps', 'Nivel 1 · Ver los pasos'),
        examples: [
          {
            label: L('Beispiel 1: 20 000 bis 30 000', 'Example 1: 20 000 to 30 000', 'Ejemplo 1: 20 000 a 30 000'),
            goal: L('Finde zuerst die Schrittgröße und dann die Zahl bei A.', 'Find the step size first, then the number at A.', 'Encuentra primero el tamaño del paso y luego el número en A.'),
            beats: [
              {
                title: L('1. Unterschied ausrechnen', '1. Find the distance', '1. Calcula la distancia'),
                text: L('Schau dir die beiden beschrifteten Zahlen an: 20 000 und 30 000. Wie weit sind sie auseinander?', 'Look at the two labelled numbers: 20 000 and 30 000. How far apart are they?', 'Mira los dos números marcados: 20 000 y 30 000. ¿Qué distancia hay entre ellos?'),
                formula: '30 000 − 20 000 = 10 000',
                visual: { type: 'numberline', start: 20000, step: 2000, totalSteps: 5, aIdx: 3, showSpan: true, highlightGaps: 0, showJumpToA: false },
              },
              {
                title: L('2. Sprünge (Lücken) zählen — nicht Striche!', '2. Count jumps (gaps) — not ticks!', '2. Cuenta los saltos (huecos), ¡no las rayas!'),
                text: L('Zwischen 20 000 und 30 000 liegen genau 5 grüne Sprünge (Lücken). Achtung: Es sind 6 Striche, aber nur 5 Sprünge!', 'Between 20 000 and 30 000 there are 5 green jumps (gaps). Careful: 6 ticks make 5 jumps!', 'Entre 20 000 y 30 000 hay exactamente 5 saltos verdes. ¡Cuidado: 6 rayas forman 5 saltos!'),
                formula: L('5 Sprünge (Lücken)', '5 jumps (gaps)', '5 saltos (huecos)'),
                visual: { type: 'numberline', start: 20000, step: 2000, totalSteps: 5, aIdx: 3, showSpan: true, highlightGaps: 5, showJumpToA: false },
              },
              {
                title: L('3. Einen Schritt berechnen', '3. Find one step', '3. Calcula un paso'),
                text: L('Teile den Unterschied gleichmäßig auf die 5 Sprünge auf. Jeder Sprung ist 2 000 groß.', 'Share the distance equally across the 5 jumps. Each jump is 2 000.', 'Reparte la distancia por igual entre los 5 saltos. Cada salto vale 2 000.'),
                formula: '10 000 ÷ 5 = 2 000',
                visual: { type: 'numberline', start: 20000, step: 2000, totalSteps: 5, aIdx: 3, showSpan: false, highlightGaps: 5, showStepVal: true, showJumpToA: false },
              },
              {
                title: L('4. Zu A springen & Probe machen', '4. Jump to A & check (Probe)', '4. Salta hasta A y comprueba'),
                text: L('A liegt 3 Sprünge rechts von 20 000: 22 000 → 24 000 → 26 000. Probe mit Umkehraufgabe: 5 · 2 000 = 10 000 ✓', 'A is 3 jumps right of 20 000: 22 000 → 24 000 → 26 000. Inverse check: 5 · 2 000 = 10 000 ✓', 'A está a 3 saltos a la derecha de 20 000: 22 000 → 24 000 → 26 000. Prueba: 5 · 2 000 = 10 000 ✓'),
                formula: '20 000 + 3 · 2 000 = 26 000 ✓',
                visual: { type: 'numberline', start: 20000, step: 2000, totalSteps: 5, aIdx: 3, showJumpToA: true, solved: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: Falle 4 Sprünge (2 500er)', 'Example 2: 4-jump trap (2 500 steps)', 'Ejemplo 2: Trampa de 4 saltos (de 2 500)'),
            goal: L('Manchmal teilen 4 Sprünge einen 10 000er in 2 500er-Schritte.', 'Sometimes 4 jumps split 10 000 into 2 500-steps.', 'A veces 4 saltos dividen 10 000 en pasos de 2 500.'),
            beats: [
              {
                title: L('1. Abstand ablesen', '1. Read the span', '1. Lee la distancia'),
                text: L('Von 450 000 bis 460 000 sind es wieder genau 10 000.', 'From 450 000 to 460 000 is again 10 000.', 'De 450 000 a 460 000 hay de nuevo 10 000.'),
                formula: '460 000 − 450 000 = 10 000',
                visual: { type: 'numberline', start: 450000, step: 2500, totalSteps: 4, aIdx: 1, showSpan: true, highlightGaps: 0 },
              },
              {
                title: L('2. Genau 4 Lücken zählen', '2. Count 4 gaps carefully', '2. Cuenta bien los 4 huecos'),
                text: L('Hier sind es 5 Striche, also nur 4 Sprünge! Teile 10 000 in 4 gleiche Teile: die Hälfte ist 5 000, die Hälfte davon ist 2 500.', 'There are 5 ticks, so only 4 jumps! Split 10 000 in 4: half is 5 000, half again is 2 500.', 'Hay 5 rayas, ¡así que solo 4 saltos! La mitad de 10 000 es 5 000, y su mitad es 2 500.'),
                formula: '10 000 ÷ 4 = 2 500',
                visual: { type: 'numberline', start: 450000, step: 2500, totalSteps: 4, aIdx: 1, highlightGaps: 4, showStepVal: true },
              },
              {
                title: L('3. Ein Sprung zu A', '3. One jump to A', '3. Un salto hasta A'),
                text: L('A liegt 1 Sprung rechts von 450 000. Also rechnen wir 450 000 + 2 500 = 452 500.', 'A is 1 jump right of 450 000, so 450 000 + 2 500 = 452 500.', 'A está 1 salto a la derecha de 450 000: 450 000 + 2 500 = 452 500.'),
                formula: '450 000 + 2 500 = 452 500',
                visual: { type: 'numberline', start: 450000, step: 2500, totalSteps: 4, aIdx: 1, showJumpToA: true, solved: true },
              },
              {
                title: L('4. Probe (Umkehraufgabe)', '4. Inverse check (Probe)', '4. Prueba inversa'),
                text: L('Stimmt es wirklich? 4 · 2 500 = 10 000 und 450 000 + 10 000 = 460 000. Alles passt!', 'Does it really check out? 4 · 2 500 = 10 000 and 450 000 + 10 000 = 460 000. Spot on!', '¿Coincide? 4 · 2 500 = 10 000 y 450 000 + 10 000 = 460 000. ¡Exacto!'),
                formula: '4 · 2 500 = 10 000 ✓',
                visual: { type: 'numberline', start: 450000, step: 2500, totalSteps: 4, aIdx: 1, showJumpToA: true, solved: true },
              },
            ],
          },
        ],
      },
      // Tier 1: Crossing boundaries & backward counting
      {
        label: L('Stufe 2 · Übergänge & Rückwärts', 'Level 2 · Boundaries & Backward', 'Nivel 2 · Límites y hacia atrás'),
        examples: [
          {
            label: L('Beispiel 1: Rückwärts von rechts', 'Example 1: Count backwards from right', 'Ejemplo 1: Contar hacia atrás'),
            goal: L('Wenn A ganz nah an der rechten Zahl liegt, ist rückwärts springen viel schneller!', 'When A is close to the right number, jumping backwards is much faster!', 'Cuando A está cerca del número derecho, ¡saltar hacia atrás es mucho más rápido!'),
            beats: [
              {
                title: L('1. Schrittgröße bestimmen', '1. Find the step size', '1. Halla el tamaño del paso'),
                text: L('Zwischen 190 000 und 200 000 liegen 10 000 und 5 Sprünge. Ein Sprung ist 2 000.', 'Between 190 000 and 200 000 there are 10 000 and 5 jumps. One jump is 2 000.', 'Entre 190 000 y 200 000 hay 10 000 y 5 saltos. Un salto es 2 000.'),
                formula: '10 000 ÷ 5 = 2 000',
                visual: { type: 'numberline', start: 190000, step: 2000, totalSteps: 5, aIdx: 4, highlightGaps: 5, showStepVal: true },
              },
              {
                title: L('2. Schlauer Startpunkt!', '2. Pick the closer anchor!', '2. ¡Elige el ancla más cercana!'),
                text: L('A ist nur 1 Sprung links von 200 000! Statt 4-mal vorwärts zu zählen, springen wir einfach 1-mal rückwärts.', 'A is only 1 jump left of 200 000! Instead of 4 jumps forward, just jump 1 step back.', 'A está a solo 1 salto a la izquierda de 200 000. En vez de 4 saltos adelante, da 1 salto atrás.'),
                formula: '200 000 − 2 000 = ?',
                visual: { type: 'numberline', start: 190000, step: 2000, totalSteps: 5, aIdx: 4, backwardFromRight: true },
              },
              {
                title: L('3. Übergang über den Hunderttausender', '3. Cross the 100 000 boundary', '3. Cruza la frontera de 100 000'),
                text: L('200 Tausender minus 2 Tausender sind 198 Tausender, also 198 000.', '200 thousands minus 2 thousands is 198 thousands, so 198 000.', '200 mil menos 2 mil son 198 mil: 198 000.'),
                formula: '200 000 − 2 000 = 198 000',
                visual: { type: 'numberline', start: 190000, step: 2000, totalSteps: 5, aIdx: 4, backwardFromRight: true, solved: true },
              },
              {
                title: L('4. Probe vorwärts', '4. Forward check (Probe)', '4. Prueba hacia adelante'),
                text: L('198 000 + 2 000 = 200 000 — wir landen genau wieder am rechten Anker ✓', '198 000 + 2 000 = 200 000 — we land right back on the right anchor ✓', '198 000 + 2 000 = 200 000 — volvemos justo al ancla derecha ✓'),
                formula: '198 000 + 2 000 = 200 000 ✓',
                visual: { type: 'numberline', start: 190000, step: 2000, totalSteps: 5, aIdx: 4, backwardFromRight: true, solved: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: Über 100 000 springen', 'Example 2: Crossing 100 000', 'Ejemplo 2: Cruzando 100 000'),
            goal: L('Bleib beim Übergang von 5-stellig auf 6-stellig ganz ruhig in Tausendern!', 'Stay calm in thousands when crossing from 5 digits to 6 digits!', '¡Mantén la calma en miles al pasar de 5 a 6 cifras!'),
            beats: [
              {
                title: L('1. Abstand über die Grenze', '1. Span across the boundary', '1. Distancia a través del límite'),
                text: L('Von 98 000 bis 102 000 sind es 2 000 bis zur 100 000 und noch 2 000 weiter = 4 000.', 'From 98 000 to 102 000 is 2 000 to reach 100 000 plus 2 000 more = 4 000.', 'De 98 000 a 102 000 hay 2 000 hasta 100 000 y 2 000 más = 4 000.'),
                formula: '102 000 − 98 000 = 4 000',
                visual: { type: 'numberline', start: 98000, step: 1000, totalSteps: 4, aIdx: 3, showSpan: true },
              },
              {
                title: L('2. Sprünge zählen & teilen', '2. Count jumps & divide', '2. Cuenta saltos y divide'),
                text: L('Es gibt 4 Sprünge. Also ist jeder Sprung 4 000 ÷ 4 = 1 000 groß.', 'There are 4 jumps, so each jump is 4 000 ÷ 4 = 1 000.', 'Hay 4 saltos, así que cada salto vale 4 000 ÷ 4 = 1 000.'),
                formula: '4 000 ÷ 4 = 1 000',
                visual: { type: 'numberline', start: 98000, step: 1000, totalSteps: 4, aIdx: 3, highlightGaps: 4, showStepVal: true },
              },
              {
                title: L('3. Laut weiterzählen über 100 000', '3. Count aloud across 100 000', '3. Cuenta en voz alta pasando 100 000'),
                text: L('98 000 → 99 000 → 100 000 → 101 000. Bei A steht 101 000!', '98 000 → 99 000 → 100 000 → 101 000. A is at 101 000!', '98 000 → 99 000 → 100 000 → 101 000. ¡En A está 101 000!'),
                formula: 'A = 101 000',
                visual: { type: 'numberline', start: 98000, step: 1000, totalSteps: 4, aIdx: 3, showJumpToA: true, solved: true },
              },
              {
                title: L('4. Probe rückwärts', '4. Check from the right', '4. Prueba desde la derecha'),
                text: L('102 000 − 1 000 = 101 000 ✓ Beide Wege geben dieselbe Zahl!', '102 000 − 1 000 = 101 000 ✓ Both ways give the exact same number!', '102 000 − 1 000 = 101 000 ✓ ¡Ambos caminos dan el mismo número!'),
                formula: '102 000 − 1 000 = 101 000 ✓',
                visual: { type: 'numberline', start: 98000, step: 1000, totalSteps: 4, aIdx: 3, showJumpToA: true, solved: true },
              },
            ],
          },
        ],
      },
      // Tier 2: Interior anchors
      {
        label: L('Stufe 3 · Zahlen mitten drin', 'Level 3 · Interior anchors', 'Nivel 3 · Anclas interiores'),
        examples: [
          {
            label: L('Beispiel 1: A liegt rechts außen', 'Example 1: A outside to the right', 'Ejemplo 1: A fuera a la derecha'),
            goal: L('Die beschrifteten Zahlen sitzen innen — die Schrittgröße gilt aber für den ganzen Strahl!', 'The labelled numbers sit inside, but the step size is the same across the whole line!', 'Los números están en el interior, ¡pero el paso es igual en toda la recta!'),
            beats: [
              {
                title: L('1. Nur zwischen den zwei Ankern zählen', '1. Count only between the two anchors', '1. Cuenta solo entre las dos anclas'),
                text: L('Zwischen 32 000 und 35 000 liegen 3 Sprünge. Ignoriere kurz die Striche außen herum!', 'Between 32 000 and 35 000 there are 3 jumps. Ignore the outer ticks for a moment!', 'Entre 32 000 y 35 000 hay 3 saltos. ¡Ignora por ahora las rayas de los extremos!'),
                formula: '(35 000 − 32 000) ÷ 3 = 1 000',
                visual: { type: 'numberline', start: 30000, step: 1000, totalSteps: 6, anchor1: 2, anchor2: 5, aIdx: 6, highlightGaps: 3, showStepVal: true },
              },
              {
                title: L('2. Vom nächsten Anker weiterhüpfen', '2. Hop from the nearest anchor', '2. Salta desde el ancla más cercana'),
                text: L('A liegt 1 Sprung rechts von 35 000. Nicht vom linken Rand zählen — starte direkt bei 35 000!', 'A is 1 jump right of 35 000. Never count from the blank left edge — start right at 35 000!', 'A está 1 salto a la derecha de 35 000. ¡No cuentes desde el borde vacío, empieza en 35 000!'),
                formula: '35 000 + 1 000 = 36 000',
                visual: { type: 'numberline', start: 30000, step: 1000, totalSteps: 6, anchor1: 2, anchor2: 5, aIdx: 6, showJumpToA: true, solved: true },
              },
              {
                title: L('3. Probe mit Schrittgröße', '3. Check with the step size', '3. Comprueba con el paso'),
                text: L('32 000 → 33 000 → 34 000 → 35 000 → 36 000 ✓ Alle Schritte sind gleich groß!', '32 000 → 33 000 → 34 000 → 35 000 → 36 000 ✓ Every single step is equal!', '32 000 → 33 000 → 34 000 → 35 000 → 36 000 ✓ ¡Todos los pasos son iguales!'),
                formula: '32 000 + 4 · 1 000 = 36 000 ✓',
                visual: { type: 'numberline', start: 30000, step: 1000, totalSteps: 6, anchor1: 2, anchor2: 5, aIdx: 6, showJumpToA: true, solved: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: A liegt links vom Anker!', 'Example 2: A to the left of the anchor!', 'Ejemplo 2: ¡A a la izquierda del ancla!'),
            goal: L('Wenn A links vom ersten Anker liegt, musst du rückwärts (minus) zählen!', 'When A sits to the left of the first anchor, count backwards (subtract)!', 'Cuando A está a la izquierda del primer ancla, ¡cuenta hacia atrás (resta)!'),
            beats: [
              {
                title: L('1. Schrittgröße zwischen den Ankern', '1. Step size between anchors', '1. Tamaño del paso entre anclas'),
                text: L('Zwischen 64 000 und 70 000 liegen 3 Sprünge. Unterschied 6 000 ÷ 3 = 2 000 pro Sprung.', 'Between 64 000 and 70 000 are 3 jumps. Span 6 000 ÷ 3 = 2 000 per jump.', 'Entre 64 000 y 70 000 hay 3 saltos. Distancia 6 000 ÷ 3 = 2 000 por salto.'),
                formula: '6 000 ÷ 3 = 2 000',
                visual: { type: 'numberline', start: 60000, step: 2000, totalSteps: 5, anchor1: 2, anchor2: 5, aIdx: 0, highlightGaps: 3, showStepVal: true },
              },
              {
                title: L('2. Richtung prüfen: links = kleiner!', '2. Check direction: left = smaller!', '2. Mira la dirección: ¡izquierda = menor!'),
                text: L('A liegt 2 Sprünge LINKS von 64 000. Nach links werden die Zahlen kleiner!', 'A is 2 jumps LEFT of 64 000. Moving left makes numbers smaller!', 'A está 2 saltos a la IZQUIERDA de 64 000. ¡Hacia la izquierda los números disminuyen!'),
                formula: '64 000 − 2 · 2 000 = ?',
                visual: { type: 'numberline', start: 60000, step: 2000, totalSteps: 5, anchor1: 2, anchor2: 5, aIdx: 0, backwardFromAnchor1: true },
              },
              {
                title: L('3. Rückwärts zählen & Probe', '3. Count backwards & check', '3. Cuenta atrás y prueba'),
                text: L('64 000 → 62 000 → 60 000. Probe: 60 000 + 4 000 = 64 000 ✓', '64 000 → 62 000 → 60 000. Probe: 60 000 + 4 000 = 64 000 ✓', '64 000 → 62 000 → 60 000. Prueba: 60 000 + 4 000 = 64 000 ✓'),
                formula: 'A = 60 000 ✓',
                visual: { type: 'numberline', start: 60000, step: 2000, totalSteps: 5, anchor1: 2, anchor2: 5, aIdx: 0, backwardFromAnchor1: true, solved: true },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 2. STELLENWERT-LABOR (placevalue)
  // =========================================================================
  register('placevalue', {
    tiers: [
      {
        label: L('Stufe 1 · Stellenwert & Null als Platzhalter', 'Level 1 · Place Value & Zero Placeholder', 'Nivel 1 · Valor posicional y cero'),
        examples: [
          {
            label: L('Beispiel 1: Leere Spalten = 0 (403 050)', 'Example 1: Empty columns = 0 (403 050)', 'Ejemplo 1: Columnas vacías = 0 (403 050)'),
            goal: L('Jede leere Spalte in der Stellenwerttafel braucht eine 0 als Platzhalter!', 'Every empty column in the place-value table needs a 0 placeholder!', '¡Cada columna vacía necesita un 0 como marcador de lugar!'),
            beats: [
              {
                title: L('1. In zwei Pakete teilen', '1. Split into two packs', '1. Divide en dos bloques'),
                text: L('Hör auf das Wort „tausend“: „vierhundertdreitausend | fünfzig“. Links steht das Tausenderpaket (403), rechts das Einerpaket (050).', 'Listen for "thousand": "403 thousand | 50". Left is the thousands pack (403), right is the ones pack (050).', 'Separa en miles y unidades: 403 mil | 50. A la izquierda va 403 y a la derecha 050.'),
                formula: '403 Tausender | 50 Einer',
                visual: { type: 'placevalue', cols: ['HT', 'ZT', 'T', 'H', 'Z', 'E'], digits: ['4', '?', '3', '?', '5', '?'], hi: [0, 2, 4] },
              },
              {
                title: L('2. Leere Spalten mit 0 füllen', '2. Fill empty columns with 0', '2. Rellena columnas vacías con 0'),
                text: L('Bei ZT, H und E gibt es keine Plättchen. Wir schreiben eine 0 als Platzhalter — sonst rutschen alle Ziffern falsch zusammen!', 'There are no counters in ZT, H, or E. Write 0 as a placeholder so the big digits keep their place!', 'En ZT, H y E no hay fichas. Pon un 0 para que las demás cifras no se corran.'),
                formula: '4 HT · 0 ZT · 3 T · 0 H · 5 Z · 0 E',
                visual: { type: 'placevalue', cols: ['HT', 'ZT', 'T', 'H', 'Z', 'E'], digits: ['4', '0', '3', '0', '5', '0'], hi: [1, 3, 5] },
              },
              {
                title: L('3. Zahl mit Lücke schreiben', '3. Write with a clear gap', '3. Escribe con espacio'),
                text: L('Die Dreierlücke trennt Tausender und Einer: 403 050. Nie 4350 schreiben!', 'The space separates thousands and ones: 403 050. Never drop the zeros to 4350!', 'El espacio separa miles y unidades: 403 050. ¡Nunca quites los ceros!'),
                formula: '400 000 + 3 000 + 50 = 403 050 ✓',
                visual: { type: 'placevalue', cols: ['HT', 'ZT', 'T', 'H', 'Z', 'E'], digits: ['4', '0', '3', '0', '5', '0'], hi: [0, 1, 2, 3, 4, 5] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Kein Zahlendreher! (60 074)', 'Example 2: Avoid digit swaps! (60 074)', 'Ejemplo 2: ¡Sin girar cifras! (60 074)'),
            goal: L('Im Deutschen sprechen wir erst die Einer, schreiben aber zuerst die Zehner!', 'In German we speak ones first ("vierundsiebzig"), but write tens first (74)!', 'En alemán se dicen primero las unidades, pero siempre se escriben primero las decenas.'),
            beats: [
              {
                title: L('1. Zahlwort genau hören', '1. Listen carefully to the word', '1. Escucha bien la palabra'),
                text: L('„Sechzigtausend-vierundsiebzig“: 60 Tausender und 74 Einer (7 Zehner, 4 Einer).', '"Sechzigtausend-vierundsiebzig": 60 thousands and 74 ones (7 tens, 4 ones).', '60 mil y 74 (7 decenas y 4 unidades).'),
                formula: '60 T + 7 Z + 4 E',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['6', '0', '0', '?', '?'], hi: [3, 4] },
              },
              {
                title: L('2. Erst Zehner, dann Einer!', '2. Tens first, ones last!', '2. ¡Primero decenas, luego unidades!'),
                text: L('„Vier-und-siebzig“ hat 7 Zehner und 4 Einer → 74 (nicht 47!). Die Hunderter-Spalte bekommt die Platzhalter-0.', '"Vier-und-siebzig" has 7 tens and 4 ones → 74 (not 47!). Hundreds gets a placeholder 0.', '74 tiene 7 decenas y 4 unidades (¡no 47!). Las centenas llevan un 0.'),
                formula: '60 000 + 70 + 4 = 60 074 ✓',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['6', '0', '0', '7', '4'], hi: [2, 3, 4] },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Bündeln & Entbündeln', 'Level 2 · Bundling & Unbundling', 'Nivel 2 · Agrupar y desagrupar'),
        examples: [
          {
            label: L('Beispiel 1: 4 T + 15 H + 3 Z + 6 E', 'Example 1: 4 T + 15 H + 3 Z + 6 E', 'Ejemplo 1: 4 T + 15 H + 3 Z + 6 E'),
            goal: L('In jede Spalte passen nur 0 bis 9 Plättchen — 10 werden nach links gebündelt!', 'Each column only holds 0–9 counters — bundle every 10 to the left!', 'En cada columna solo caben 0–9 fichas: ¡agrupa cada 10 hacia la izquierda!'),
            beats: [
              {
                title: L('1. Übervolle Spalte entdecken', '1. Spot the overflowing column', '1. Detecta la columna llena'),
                text: L('In der H-Spalte liegen 15 Hunderter! Man darf NICHT einfach 41536 zusammenschreiben.', 'There are 15 hundreds in the H column! Never just glue the numbers into 41536.', '¡Hay 15 centenas en la columna H! Nunca pegues las cifras como 41536.'),
                formula: '4 T · [15 H] · 3 Z · 6 E',
                visual: { type: 'placevalue', cols: ['T', 'H', 'Z', 'E'], digits: ['4', '15', '3', '6'], overflow: [1] },
              },
              {
                title: L('2. 10 Hunderter = 1 Tausender bündeln', '2. Bundle 10 H = 1 T', '2. Agrupa 10 H = 1 T'),
                text: L('Wir tauschen 10 H gegen 1 T. Bei H bleiben 5 übrig, bei T kommen +1 dazu (4 + 1 = 5 T).', 'Trade 10 H for 1 T. That leaves 5 H and gives 4 + 1 = 5 T!', 'Cambia 10 H por 1 T. Quedan 5 H y en T ahora hay 4 + 1 = 5 T.'),
                formula: '15 H = 1 T + 5 H',
                visual: { type: 'placevalue', cols: ['T', 'H', 'Z', 'E'], digits: ['5', '5', '3', '6'], hi: [0, 1] },
              },
              {
                title: L('3. Fertige Zahl ablesen & Probe', '3. Read the number & check', '3. Lee el número y comprueba'),
                text: L('Jetzt steht in jeder Spalte eine einzelne Ziffer: 5 536! Probe: 4 000 + 1 500 + 30 + 6 = 5 536 ✓', 'Now every column has one digit: 5 536! Check: 4 000 + 1 500 + 30 + 6 = 5 536 ✓', 'Ahora cada columna tiene una cifra: 5 536. Prueba: 4 000 + 1 500 + 30 + 6 = 5 536 ✓'),
                formula: '5 536 ✓',
                visual: { type: 'placevalue', cols: ['T', 'H', 'Z', 'E'], digits: ['5', '5', '3', '6'], hi: [0, 1, 2, 3] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Zweimal bündeln (3 ZT + 12 T + 14 H)', 'Example 2: Double bundling', 'Ejemplo 2: Doble agrupación'),
            goal: L('Bündle immer von rechts nach links — Spalte für Spalte!', 'Always bundle from right to left, column by column!', '¡Agrupa siempre de derecha a izquierda, columna por columna!'),
            beats: [
              {
                title: L('1. Rechts starten: 14 H bündeln', '1. Start on the right: bundle 14 H', '1. Empieza a la derecha: agrupa 14 H'),
                text: L('14 H = 1 T + 4 H. Die 1 T wandert zu den 12 T → jetzt sind es 13 T.', '14 H = 1 T + 4 H. The 1 T moves to 12 T → now 13 T!', '14 H = 1 T + 4 H. El 1 T se suma a 12 T → ¡ahora son 13 T!'),
                formula: '3 ZT · 13 T · 4 H · 0 Z · 5 E',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['3', '13', '4', '0', '5'], overflow: [1] },
              },
              {
                title: L('2. Weiter nach links: 13 T bündeln', '2. Next left: bundle 13 T', '2. Sigue a la izquierda: agrupa 13 T'),
                text: L('13 T = 1 ZT + 3 T. Zusammen mit 3 ZT werden es 4 ZT.', '13 T = 1 ZT + 3 T. Added to 3 ZT that makes 4 ZT!', '13 T = 1 ZT + 3 T. Con los 3 ZT son 4 ZT.'),
                formula: '4 ZT · 3 T · 4 H · 0 Z · 5 E',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['4', '3', '4', '0', '5'], hi: [0, 1] },
              },
              {
                title: L('3. Zahl ablesen (0 bei Z nicht vergessen!)', '3. Read number (keep the 0 in Z!)', '3. Lee el número (¡mantén el 0 en Z!)'),
                text: L('In Z liegt kein Plättchen → 0 als Platzhalter! Ergebnis: 43 405 ✓', 'Z is empty → write 0! Final number: 43 405 ✓', 'Z está vacía → pon 0. Resultado: 43 405 ✓'),
                formula: '30 000 + 12 000 + 1 400 + 5 = 43 405 ✓',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['4', '3', '4', '0', '5'], hi: [0, 1, 2, 3, 4] },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · Plättchen verschieben', 'Level 3 · Shifting counters', 'Nivel 3 · Mover fichas'),
        examples: [
          {
            label: L('Beispiel 1: 1 Plättchen von T nach ZT', 'Example 1: Move 1 counter T → ZT', 'Ejemplo 1: Mover 1 ficha de T a ZT'),
            goal: L('Ein Plättchen eine Spalte nach links wird 10-mal so viel wert!', 'Moving 1 counter one column left makes it worth 10× as much!', '¡Mover 1 ficha una columna a la izquierda vale 10 veces más!'),
            beats: [
              {
                title: L('1. Startzahl in der Tafel ansehen', '1. Look at the start number', '1. Mira el número inicial'),
                text: L('Startzahl: 35 420. Wir nehmen 1 Plättchen aus T (Wert 1 000) weg.', 'Start: 35 420. Take 1 counter out of T (worth 1 000).', 'Inicio: 35 420. Quitamos 1 ficha de T (vale 1 000).'),
                formula: '35 420 − 1 000 = 34 420',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['3', '5→4', '4', '2', '0'], hi: [1] },
              },
              {
                title: L('2. In die neue Spalte legen', '2. Place it in the new column', '2. Colócala en la nueva columna'),
                text: L('Wir legen das Plättchen in ZT (Wert 10 000). Aus 3 ZT werden 4 ZT.', 'Put the counter in ZT (worth 10 000). 3 ZT becomes 4 ZT!', 'Pon la ficha en ZT (vale 10 000). 3 ZT pasa a ser 4 ZT.'),
                formula: '34 420 + 10 000 = 44 420',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['4', '4', '4', '2', '0'], hi: [0, 1] },
              },
              {
                title: L('3. Veränderung verstehen (Probe)', '3. Understand the change', '3. Entiende el cambio'),
                text: L('−1 000 und +10 000 sind zusammen +9 000! 35 420 + 9 000 = 44 420 ✓', '−1 000 and +10 000 together make +9 000! 35 420 + 9 000 = 44 420 ✓', '−1 000 y +10 000 son +9 000 en total. 35 420 + 9 000 = 44 420 ✓'),
                formula: '35 420 + 9 000 = 44 420 ✓',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['4', '4', '4', '2', '0'], hi: [0, 1] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Nach rechts verschieben (H → Z)', 'Example 2: Shift right (H → Z)', 'Ejemplo 2: Mover a la derecha (H → Z)'),
            goal: L('Wandert ein Plättchen nach rechts, wird die Zahl KLEINER!', 'Moving a counter to the right makes the number SMALLER!', '¡Al mover una ficha a la derecha, el número se hace MENOR!'),
            beats: [
              {
                title: L('1. Von H nach Z wird es kleiner', '1. H to Z makes it smaller', '1. De H a Z se hace menor'),
                text: L('Startzahl 24 350: Wir nehmen 1 H (−100) weg und legen es bei Z (+10) dazu.', 'Start 24 350: remove 1 H (−100) and put it in Z (+10).', 'Inicio 24 350: quitamos 1 H (−100) y la ponemos en Z (+10).'),
                formula: '−100 + 10 = −90',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['2', '4', '3→2', '5→6', '0'], hi: [2, 3] },
              },
              {
                title: L('2. Neue Zahl ablesen', '2. Read the new number', '2. Lee el nuevo número'),
                text: L('H sinkt von 3 auf 2, Z steigt von 5 auf 6 → 24 260! Probe: 24 350 − 90 = 24 260 ✓', 'H drops from 3 to 2, Z rises from 5 to 6 → 24 260! Check: 24 350 − 90 = 24 260 ✓', 'H baja de 3 a 2, Z sube de 5 a 6 → 24 260. Prueba: 24 350 − 90 = 24 260 ✓'),
                formula: '24 260 ✓',
                visual: { type: 'placevalue', cols: ['ZT', 'T', 'H', 'Z', 'E'], digits: ['2', '4', '2', '6', '0'], hi: [2, 3] },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 3. NACHBAR- & ORDNUNGS-LABOR (neighbors)
  // =========================================================================
  register('neighbors', {
    tiers: [
      {
        label: L('Stufe 1 · Vergleichen & Ordnen', 'Level 1 · Comparing & Ordering', 'Nivel 1 · Comparar y ordenar'),
        examples: [
          {
            label: L('Beispiel 1: Stellenanzahl zuerst! (98 765 vs. 100 002)', 'Example 1: Count digits first!', 'Ejemplo 1: ¡Cuenta cifras primero!'),
            goal: L('Lass dich nicht von der großen 9 vorne täuschen — zähle immer zuerst die Stellen!', 'Don\'t let the big 9 in front trick you — always count digits first!', '¡No te dejes engañar por el 9 delante: cuenta primero las cifras!'),
            beats: [
              {
                title: L('1. Stellen zählen', '1. Count the digits', '1. Cuenta las cifras'),
                text: L('98 765 hat 5 Stellen (bis ZT). 100 002 hat 6 Stellen (bis HT).', '98 765 has 5 digits (up to ZT). 100 002 has 6 digits (up to HT).', '98 765 tiene 5 cifras. 100 002 tiene 6 cifras.'),
                formula: L('5 Stellen < 6 Stellen', '5 digits < 6 digits', '5 cifras < 6 cifras'),
                visual: { type: 'neighbors', mode: 'compare', a: '98 765', b: '100 002', sign: '?', noteA: '5', noteB: '6' },
              },
              {
                title: L('2. Mehr Stellen = immer größer!', '2. More digits = always bigger!', '2. ¡Más cifras = siempre mayor!'),
                text: L('Eine 6-stellige Zahl ist IMMER größer als jede 5-stellige Zahl. Also: 98 765 < 100 002 („ist kleiner als“).', 'A 6-digit number is ALWAYS bigger than any 5-digit number. So 98 765 < 100 002 ("is less than").', 'Un número de 6 cifras siempre es mayor que uno de 5. Por tanto: 98 765 < 100 002.'),
                formula: '98 765 < 100 002 ✓',
                visual: { type: 'neighbors', mode: 'compare', a: '98 765', b: '100 002', sign: '<', noteA: '5', noteB: '6' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Gleiche Stellenanzahl (45 090 vs. 45 900)', 'Example 2: Same digit count', 'Ejemplo 2: Mismo número de cifras'),
            goal: L('Bei gleicher Stellenanzahl vergleichen wir von links nach rechts!', 'When digit counts match, compare from left to right!', 'Con las mismas cifras, compara de izquierda a derecha.'),
            beats: [
              {
                title: L('1. Von links starten', '1. Start on the left', '1. Empieza por la izquierda'),
                text: L('Beide Zahlen haben 5 Stellen. ZT = 4 (gleich), T = 5 (gleich). Wir gehen weiter zur H-Spalte!', 'Both have 5 digits. ZT = 4 (tie), T = 5 (tie). Move right to the H column!', 'Ambos tienen 5 cifras. ZT = 4, T = 5 (iguales). ¡Mira ahora las centenas (H)!'),
                formula: '45 [0]90  vs.  45 [9]00',
                visual: { type: 'neighbors', mode: 'compare', a: '45 090', b: '45 900', sign: '?', noteA: 'H=0', noteB: 'H=9' },
              },
              {
                title: L('2. Erste verschiedene Stelle entscheidet', '2. First differing digit decides', '2. Decide la primera cifra distinta'),
                text: L('0 Hunderter sind kleiner als 9 Hunderter. Also: 45 090 < 45 900 ✓', '0 hundreds is less than 9 hundreds. So 45 090 < 45 900 ✓', '0 centenas es menor que 9 centenas. Así: 45 090 < 45 900 ✓'),
                formula: '45 090 < 45 900 ✓',
                visual: { type: 'neighbors', mode: 'compare', a: '45 090', b: '45 900', sign: '<', noteA: 'H=0', noteB: 'H=9' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Nachbarzahlen (VT / NT)', 'Level 2 · Place-Value Neighbors', 'Nivel 2 · Vecinos de valor posicional'),
        examples: [
          {
            label: L('Beispiel 1: VT und NT von 43 267', 'Example 1: VT and NT of 43 267', 'Ejemplo 1: VT y NT de 43 267'),
            goal: L('Nachbartausender (VT / NT) sind immer glatte Tausender — die letzten 3 Stellen sind 000!', 'Neighbor thousands (VT/NT) always end in 000!', 'Los miles vecinos siempre terminan en 000.'),
            beats: [
              {
                title: L('1. Tausender-Stelle finden', '1. Find the thousands digit', '1. Encuentra los miles'),
                text: L('In 43 267 stecken 43 volle Tausender (43 000) und noch 267 dazu.', 'In 43 267 there are 43 full thousands (43 000) plus 267 more.', 'En 43 267 hay 43 miles completos (43 000) y 267 más.'),
                formula: '43 000 < 43 267 < ?',
                visual: { type: 'neighbors', mode: 'ladder', leftL: 'VT', leftV: '43 000', centerV: '43 267', rightL: 'NT', rightV: '?' },
              },
              {
                title: L('2. Alle kleineren Stellen werden 0!', '2. All smaller digits become 0!', '2. ¡Las cifras menores pasan a 0!'),
                text: L('Der kleinere Nachbartausender (VT) ist 43 000 (nicht 43 200!). Der nächste Tausender (NT) ist 1 T mehr: 44 000.', 'The smaller neighbor thousand (VT) is 43 000 (not 43 200!). The next thousand (NT) is 1 T more: 44 000.', 'El mil vecino menor es 43 000 (¡no 43 200!). El mayor es 1 000 más: 44 000.'),
                formula: 'VT = 43 000 · NT = 44 000 ✓',
                visual: { type: 'neighbors', mode: 'ladder', leftL: 'VT', leftV: '43 000', centerV: '43 267', rightL: 'NT', rightV: '44 000' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Falle glatte Zahl (40 000)', 'Example 2: Already-round trap (40 000)', 'Ejemplo 2: Trampa de número redondo (40 000)'),
            goal: L('Eine Zahl ist niemals ihr eigener Nachbar!', 'A number is never its own neighbor!', '¡Un número nunca es su propio vecino!'),
            beats: [
              {
                title: L('1. 40 000 ist schon ein glatter Tausender!', '1. 40 000 is already an exact thousand!', '1. ¡40 000 ya es un mil exacto!'),
                text: L('Deshalb ist VT NICHT 40 000. Wir gehen einen ganzen Tausender zurück und einen ganzen vor!', 'So VT is NOT 40 000! Step one full thousand back and one full thousand forward.', 'Por eso VT no es 40 000: resta 1 000 hacia atrás y suma 1 000 hacia adelante.'),
                formula: '40 000 − 1 000 | 40 000 + 1 000',
                visual: { type: 'neighbors', mode: 'ladder', leftL: 'VT', leftV: '39 000', centerV: '40 000', rightL: 'NT', rightV: '41 000' },
              },
              {
                title: L('2. Übergang prüfen', '2. Check the boundary', '2. Comprueba el límite'),
                text: L('40 Tausender minus 1 Tausender = 39 Tausender (39 000). Und plus 1 Tausender = 41 000 ✓', '40 thousands minus 1 thousand = 39 000; plus 1 thousand = 41 000 ✓', '40 mil menos 1 mil = 39 000; más 1 mil = 41 000 ✓'),
                formula: '39 000 < 40 000 < 41 000 ✓',
                visual: { type: 'neighbors', mode: 'ladder', leftL: 'VT', leftV: '39 000', centerV: '40 000', rightL: 'NT', rightV: '41 000' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · 9→0 Übergänge & Folgen', 'Level 3 · 9→0 Boundaries & Sequences', 'Nivel 3 · Límites 9→0 y secuencias'),
        examples: [
          {
            label: L('Beispiel 1: Vorgänger & Nachfolger von 100 000', 'Example 1: Neighbors of 100 000', 'Ejemplo 1: Vecinos de 100 000'),
            goal: L('Beim Schritt über viele Nullen kippen alle Nullen gleichzeitig zu Neunen!', 'Stepping back across zeros flips every zero into a 9!', 'Al retroceder por ceros, ¡todos los ceros cambian a nueves!'),
            beats: [
              {
                title: L('1. Eins zurück von 100 000', '1. One step back from 100 000', '1. Uno atrás desde 100 000'),
                text: L('Stell dir einen Kilometerzähler vor: 1 vor 100 000 sind fünf Neunen → 99 999!', 'Picture a car odometer: 1 before 100 000 is five nines → 99 999!', 'Imagina un cuentakilómetros: 1 antes de 100 000 son cinco nueves → 99 999.'),
                formula: '100 000 − 1 = 99 999',
                visual: { type: 'neighbors', mode: 'ladder', leftL: 'V', leftV: '99 999', centerV: '100 000', rightL: 'N', rightV: '?' },
              },
              {
                title: L('2. Eins weiter & Probe', '2. One step forward & check', '2. Uno adelante y prueba'),
                text: L('Und 1 nach 100 000 ist 100 001 (nicht die 4 Nullen dazwischen vergessen!). Probe: 99 999 + 1 = 100 000 ✓', 'And 1 after 100 000 is 100 001 (keep all 4 interior zeros!). Check: 99 999 + 1 = 100 000 ✓', 'Y 1 después es 100 001 (¡mantén los 4 ceros!). Prueba: 99 999 + 1 = 100 000 ✓'),
                formula: '99 999 < 100 000 < 100 001 ✓',
                visual: { type: 'neighbors', mode: 'ladder', leftL: 'V', leftV: '99 999', centerV: '100 000', rightL: 'N', rightV: '100 001' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Zahlenfolge über 100 000', 'Example 2: Sequence across 100 000', 'Ejemplo 2: Secuencia cruzando 100 000'),
            goal: L('Finde zuerst die gleichmäßige Schrittregel zwischen zwei Nachbarzahlen!', 'First spot the steady rule between two adjacent numbers!', 'Primero descubre la regla constante entre dos números seguidos.'),
            beats: [
              {
                title: L('1. Regel erkennen', '1. Spot the rule', '1. Descubre la regla'),
                text: L('99 700 → 99 800 → 99 900: Jedes Mal kommen genau +100 dazu.', '99 700 → 99 800 → 99 900: each jump adds exactly +100.', '99 700 → 99 800 → 99 900: cada salto suma exactamente +100.'),
                formula: '+100 pro Schritt',
                visual: { type: 'neighbors', mode: 'seq', items: ['99 700', '99 800', '99 900', '?'], step: '+100' },
              },
              {
                title: L('2. Bündeln über 100 000', '2. Bundle across 100 000', '2. Agrupa pasando 100 000'),
                text: L('9 Hunderter + 1 Hunderter = 10 Hunderter = 1 Tausender → 99 900 + 100 = 100 000 ✓', '9 hundreds + 1 hundred = 10 hundreds = 1 thousand → 99 900 + 100 = 100 000 ✓', '9 centenas + 1 centena = 1 mil → 99 900 + 100 = 100 000 ✓'),
                formula: '99 900 + 100 = 100 000 ✓',
                visual: { type: 'neighbors', mode: 'seq', items: ['99 700', '99 800', '99 900', '100 000'], step: '+100' },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 4. RUNDUNGS-LABOR (rounding)
  // =========================================================================
  register('rounding', {
    tiers: [
      {
        label: L('Stufe 1 · Runden auf Z & H', 'Level 1 · Round to Z & H', 'Nivel 1 · Redondear a Z y H'),
        examples: [
          {
            label: L('Beispiel 1: Abrunden (4 364 auf Z)', 'Example 1: Round down (4 364 to Z)', 'Ejemplo 1: Redondeo hacia abajo'),
            goal: L('Bei 0, 1, 2, 3, 4 runden wir ab — die Rundungsstelle bleibt einfach stehen!', 'For 0–4 we round down — the rounding digit stays the same!', 'Con 0–4 redondeamos abajo: ¡la cifra objetivo se queda igual!'),
            beats: [
              {
                title: L('1. Rundungsstelle & Nachbar markieren', '1. Mark rounding & decision digit', '1. Marca la cifra y su vecina'),
                text: L('Wir runden 4 364 auf Zehner (grün: 6). Die Entscheidungsziffer rechts daneben ist 4 (gelb).', 'We round 4 364 to tens (green: 6). The decision digit to its right is 4 (yellow).', 'Redondeamos 4 364 a decenas (verde: 6). La cifra vecina a la derecha es 4 (amarillo).'),
                formula: '4 3[6](4)',
                visual: { type: 'rounding', n: 4364, lo: 4360, mid: 4365, hi: 4370, targetIdx: 2, decIdx: 3, snap: null },
              },
              {
                title: L('2. 4 → abrunden (bleibt 6!)', '2. 4 → round down (stays 6!)', '2. 4 → redondea abajo (¡sigue 6!)'),
                text: L('4 gehört zu 0–4 → abrunden! Wichtig: Die 6 wird NICHT zu 5, sie bleibt 6 — nur die 4 wird zu 0: 4 360 ✓', '4 is in 0–4 → round down! Remember: 6 stays 6 (never minus 1) — only the 4 turns into 0: 4 360 ✓', '4 está en 0–4 → redondeo abajo. El 6 NO baja a 5, solo el 4 pasa a 0: 4 360 ✓'),
                formula: '4 364 ≈ 4 360 ✓',
                visual: { type: 'rounding', n: 4364, lo: 4360, mid: 4365, hi: 4370, targetIdx: 2, decIdx: 3, snap: 'lo' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Genau in der Mitte — 5 rundet auf!', 'Example 2: Midpoint 5 rounds UP!', 'Ejemplo 2: ¡El 5 redondea arriba!'),
            goal: L('Steht als Entscheidungsziffer eine 5, runden wir in Mathe immer AUF!', 'When the decision digit is 5, we always round UP!', 'Si la cifra vecina es 5, ¡siempre redondeamos hacia ARRIBA!'),
            beats: [
              {
                title: L('1. Auf Hunderter (H) schauen', '1. Look at hundreds (H)', '1. Mira las centenas (H)'),
                text: L('18 452 auf H runden: Die Hunderterstelle ist 4 (grün), die rechte Nachbarziffer ist 5 (gelb).', 'Round 18 452 to H: hundreds digit is 4 (green), decision digit to its right is 5 (yellow).', 'Redondear 18 452 a H: centenas es 4 (verde), vecina derecha es 5 (amarillo).'),
                formula: '18 [4](5)2',
                visual: { type: 'rounding', n: 18452, lo: 18400, mid: 18450, hi: 18500, targetIdx: 2, decIdx: 3, snap: null },
              },
              {
                title: L('2. Ab 5 aufrunden → +1 H', '2. 5 or more → +1 H', '2. 5 o más → +1 H'),
                text: L('5 gehört zu 5–9 → aufrunden! Aus 4 H werden 5 H, alle Stellen rechts werden 0: 18 500 ✓', '5 is in 5–9 → round up! 4 H becomes 5 H, all digits right become 0: 18 500 ✓', '5 está en 5–9 → redondea arriba: 4 H pasa a 5 H y el resto a 0: 18 500 ✓'),
                formula: '18 452 ≈ 18 500 ✓',
                visual: { type: 'rounding', n: 18452, lo: 18400, mid: 18450, hi: 18500, targetIdx: 2, decIdx: 3, snap: 'hi' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · T / ZT / HT & 9er-Übertrag', 'Level 2 · T / ZT / HT & Carry-9', 'Nivel 2 · T / ZT / HT y llevar 9'),
        examples: [
          {
            label: L('Beispiel 1: Keine Kettenrundung! (43 449 auf T)', 'Example 1: Never chain-round! (43 449)', 'Ejemplo 1: ¡Sin redondeo en cadena!'),
            goal: L('Schau IMMER nur auf die eine Entscheidungsziffer rechts neben der Rundungsstelle!', 'Look ONLY at the one decision digit directly to the right!', '¡Mira SOLO la cifra vecina inmediatamente a la derecha!'),
            beats: [
              {
                title: L('1. Falle Kettenrundung vermeiden', '1. Avoid the chain-rounding trap', '1. Evita la trampa en cadena'),
                text: L('43 449 auf T runden: Rundungsstelle = 3 T (grün), Entscheidungsziffer = 4 H (gelb). Die 9 ganz hinten zählt NICHT!', 'Round 43 449 to T: target = 3 T (green), decision digit = 4 H (yellow). Ignore the 9 at the end!', 'Redondear 43 449 a T: objetivo = 3 T, vecina = 4 H. ¡El 9 del final NO cuenta!'),
                formula: '4[3](4)49 → nur die 4 zählt!',
                visual: { type: 'rounding', n: 43449, lo: 43000, mid: 43500, hi: 44000, targetIdx: 1, decIdx: 2, snap: null },
              },
              {
                title: L('2. Auf dem Zahlenstrahl prüfen', '2. Verify on the number line', '2. Verifica en la recta'),
                text: L('43 449 liegt noch links von der Mitte 43 500! Deshalb rundet es sicher ab auf 43 000 ✓', '43 449 is still left of the midpoint 43 500! So it cleanly rounds down to 43 000 ✓', '43 449 está a la izquierda de 43 500, así que redondea abajo a 43 000 ✓'),
                formula: '43 449 ≈ 43 000 ✓',
                visual: { type: 'rounding', n: 43449, lo: 43000, mid: 43500, hi: 44000, targetIdx: 1, decIdx: 2, snap: 'lo' },
              },
            ],
          },
          {
            label: L('Beispiel 2: 9er-Übertrag (299 720 auf T)', 'Example 2: Carry across 9 (299 720)', 'Ejemplo 2: Llevada con 9 (299 720)'),
            goal: L('Wenn beim Aufrunden eine 9 erhöht wird, bündeln wir wie gewohnt nach links!', 'When rounding up bumps a 9, bundle to the left as usual!', 'Cuando al subir se incrementa un 9, ¡agrupamos hacia la izquierda!'),
            beats: [
              {
                title: L('1. Entscheidungsziffer = 7 → aufrunden', '1. Decision digit = 7 → round up', '1. Cifra vecina = 7 → sube'),
                text: L('299 720 auf T: T-Stelle ist 9, H-Stelle ist 7 → aufrunden (+1 Tausender)!', '299 720 to T: T digit is 9, H digit is 7 → round up (+1 thousand)!', '299 720 a T: los miles son 9, las centenas son 7 → ¡sube (+1 mil)!'),
                formula: '299 T + 1 T = ?',
                visual: { type: 'rounding', n: 299720, lo: 299000, mid: 299500, hi: 300000, targetIdx: 2, decIdx: 3, snap: null },
              },
              {
                title: L('2. Bündeln: 299 T + 1 T = 300 T', '2. Bundle: 299 T + 1 T = 300 T', '2. Agrupa: 299 T + 1 T = 300 T'),
                text: L('9 T + 1 T = 10 T = 1 ZT, und 9 ZT + 1 ZT = 1 HT → 300 000! Alle Nullen bleiben erhalten ✓', '9 T + 1 T = 10 T = 1 ZT, and 9 ZT + 1 ZT = 1 HT → 300 000! Keep all zeros ✓', '299 mil + 1 mil = 300 mil → 300 000. ¡Mantén todos los ceros!'),
                formula: '299 720 ≈ 300 000 ✓',
                visual: { type: 'rounding', n: 299720, lo: 299000, mid: 299500, hi: 300000, targetIdx: 2, decIdx: 3, snap: 'hi' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · Umkehrrunden', 'Level 3 · Inverse Rounding', 'Nivel 3 · Redondeo inverso'),
        examples: [
          {
            label: L('Beispiel 1: Kleinste Zahl für 40 000 (auf T)', 'Example 1: Smallest number for 40 000', 'Ejemplo 1: Menor número para 40 000'),
            goal: L('Zeichne dir im Kopf das Rundungsfenster rund um 40 000!', 'Picture the rounding window around 40 000!', '¡Imagina la ventana de redondeo alrededor de 40 000!'),
            beats: [
              {
                title: L('1. Halben Schritt nach links gehen', '1. Step half a unit left', '1. Retrocede medio paso'),
                text: L('Ein Tausender ist 1 000, ein halber Tausender ist 500. Ab der Mitte 39 500 wird auf 40 000 aufgerundet!', 'One thousand is 1 000, half is 500. Starting right at 39 500, numbers round UP to 40 000!', 'La mitad de 1 000 es 500. ¡Desde 39 500 justo se redondea ARRIBA a 40 000!'),
                formula: '40 000 − 500 = 39 500',
                visual: { type: 'rounding', inverse: true, target: 40000, lo: 39500, hi: 40499, highlight: 'lo' },
              },
              {
                title: L('2. Probe mit 1 weniger', '2. Test 1 smaller', '2. Prueba con 1 menos'),
                text: L('39 499 hat H = 4 → rundet ab auf 39 000. Also ist 39 500 wirklich die kleinste Zahl ✓', '39 499 has H = 4 → rounds down to 39 000. So 39 500 really is the smallest ✓', '39 499 tiene H = 4 → baja a 39 000. ¡Así que 39 500 es el menor!'),
                formula: 'Kleinste Zahl = 39 500 ✓',
                visual: { type: 'rounding', inverse: true, target: 40000, lo: 39500, hi: 40499, highlight: 'lo' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Größte Zahl für 40 000 (auf T)', 'Example 2: Largest number for 40 000', 'Ejemplo 2: Mayor número para 40 000'),
            goal: L('Warum ist 40 500 schon 1 zu groß?', 'Why is 40 500 already 1 too big?', '¿Por qué 40 500 ya es 1 demasiado grande?'),
            beats: [
              {
                title: L('1. Knapp unter der Mitte bleiben!', '1. Stay 1 below the midpoint!', '1. ¡Quédate 1 por debajo de la mitad!'),
                text: L('40 500 hat H = 5 und rundet schon AUF zu 41 000! Also müssen wir genau 1 darunter bleiben: 40 499.', '40 500 has H = 5 so it already rounds UP to 41 000! Stay exactly 1 below: 40 499.', '40 500 tiene H = 5 y ya sube a 41 000. Quédate 1 por debajo: 40 499.'),
                formula: '40 500 − 1 = 40 499',
                visual: { type: 'rounding', inverse: true, target: 40000, lo: 39500, hi: 40499, highlight: 'hi' },
              },
              {
                title: L('2. Das komplette Rundungsfenster', '2. The full rounding window', '2. La ventana completa'),
                text: L('Alle Zahlen von 39 500 bis 40 499 runden auf 40 000 ✓', 'Every number from 39 500 to 40 499 rounds to 40 000 ✓', 'Todos los números de 39 500 a 40 499 redondean a 40 000 ✓'),
                formula: '39 500 … 40 499 → 40 000 ✓',
                visual: { type: 'rounding', inverse: true, target: 40000, lo: 39500, hi: 40499, highlight: 'hi' },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 5. FLÄCHEN- & UMFANGS-LABOR (area)
  // =========================================================================
  register('area', {
    tiers: [
      {
        label: L('Stufe 1 · Flächeninhalt (cm²)', 'Level 1 · Area (cm²)', 'Nivel 1 · Área (cm²)'),
        examples: [
          {
            label: L('Beispiel 1: Rechteck auslegen (5 × 3)', 'Example 1: Tile a 5 × 3 rectangle', 'Ejemplo 1: Rectángulo 5 × 3'),
            goal: L('Flächeninhalt = wie viele Einheitsquadrate (1 cm²) innen hineinpassen!', 'Area = how many 1 cm² squares fit INSIDE the figure!', 'Área = ¡cuántos cuadrados de 1 cm² caben DENTRO!'),
            beats: [
              {
                title: L('1. In Reihen zählen', '1. Count row by row', '1. Cuenta fila por fila'),
                text: L('In der ersten Reihe liegen 5 Kästchen. Insgesamt sind es 3 gleich lange Reihen.', 'The top row has 5 squares. There are 3 equal rows in total.', 'La primera fila tiene 5 cuadrados. En total hay 3 filas iguales.'),
                formula: '5 + 5 + 5 = 3 · 5',
                visual: { type: 'area', mode: 'area', grid: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]], highlightRows: true },
              },
              {
                title: L('2. Fläche in cm² angeben', '2. Write area in cm²', '2. Escribe el área en cm²'),
                text: L('3 · 5 = 15 Quadrate → Flächeninhalt A = 15 cm² (Quadratzentimeter für Quadrate!).', '3 · 5 = 15 squares → Area A = 15 cm² (square centimetres for squares!).', '3 · 5 = 15 cuadrados → Área A = 15 cm².'),
                formula: 'A = 15 cm² ✓',
                visual: { type: 'area', mode: 'area', grid: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]], numbered: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: Halbe Kästchen paaren (½ + ½ = 1)', 'Example 2: Pair half-squares (½ + ½ = 1)', 'Ejemplo 2: Empareja mitades (½ + ½ = 1)'),
            goal: L('Zwei halbe Dreiecke ergeben zusammen genau 1 ganzes Quadrat!', 'Two half-square triangles together make 1 whole square!', '¡Dos triángulos mitad forman juntos 1 cuadrado entero!'),
            beats: [
              {
                title: L('1. Zuerst alle ganzen Kästchen zählen', '1. Count whole squares first', '1. Cuenta primero los enteros'),
                text: L('Unten im Haus liegen 2 Reihen mit je 4 ganzen Kästchen = 8 ganze cm².', 'The base has 2 rows of 4 whole squares = 8 whole cm².', 'La base tiene 2 filas de 4 cuadrados = 8 cm² enteros.'),
                formula: L('8 ganze Quadrate', '8 whole squares', '8 cuadrados enteros'),
                visual: { type: 'area', mode: 'area', grid: [[0,2,2,0],[1,1,1,1],[1,1,1,1]], numbered: true },
              },
              {
                title: L('2. Halbe zu Ganzen verbinden', '2. Pair the halves into wholes', '2. Junta las mitades en enteros'),
                text: L('Oben im Dach sind 2 halbe Quadrate: ½ + ½ = 1 ganzes cm²! Zusammen: 8 + 1 = 9 cm² ✓', 'On the roof are 2 half-squares: ½ + ½ = 1 whole cm²! Total: 8 + 1 = 9 cm² ✓', 'En el tejado hay 2 mitades: ½ + ½ = 1 cm². Total: 8 + 1 = 9 cm² ✓'),
                formula: '8 + ½ + ½ = 9 cm² ✓',
                visual: { type: 'area', mode: 'area', grid: [[0,2,2,0],[1,1,1,1],[1,1,1,1]], numbered: true, pairHalves: true },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Umfang & Innenkanten (cm)', 'Level 2 · Perimeter & Inner Edges', 'Nivel 2 · Perímetro y bordes interiores'),
        examples: [
          {
            label: L('Beispiel 1: Zaun ums Rechteck (5 × 3)', 'Example 1: Fence around a 5 × 3 rectangle', 'Ejemplo 1: Valla alrededor de 5 × 3'),
            goal: L('Umfang = einmal mit dem Finger die äußere Zaunkante komplett ablaufen!', 'Perimeter = walk all the way around the outer fence edge!', 'Perímetro = ¡recorrer toda la valla exterior!'),
            beats: [
              {
                title: L('1. Alle 4 Seiten abgehen', '1. Walk all 4 sides', '1. Recorre los 4 lados'),
                text: L('Oben 5 cm, rechts 3 cm, unten 5 cm, links 3 cm. Vergiss keine Seite (nicht nach der Hälfte stoppen)!', 'Top 5 cm, right 3 cm, bottom 5 cm, left 3 cm. Don\'t stop halfway around!', 'Arriba 5 cm, derecha 3 cm, abajo 5 cm, izquierda 3 cm. ¡Cierra la vuelta!'),
                formula: '5 + 3 + 5 + 3 = 16 cm',
                visual: { type: 'area', mode: 'perim', grid: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]], numberedEdges: true },
              },
              {
                title: L('2. Einheit cm (Länge, kein Quadrat!)', '2. Unit is cm (length, not square!)', '2. Unidad en cm (¡longitud!)'),
                text: L('Der Zaun ist eine Länge → U = 16 cm (nicht cm²!).', 'A fence is a length → U = 16 cm (not cm²!).', 'Una valla es longitud → P = 16 cm (¡no cm²!).'),
                formula: 'U = 16 cm ✓',
                visual: { type: 'area', mode: 'perim', grid: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]], numberedEdges: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: Falle Innenkanten bei der U-Form!', 'Example 2: Concave inner edges on a U-shape!', 'Ejemplo 2: ¡Bordes interiores en forma de U!'),
            goal: L('Der Zaun läuft auch IN die Einbuchtung hinein — zähle jede einzelne Kante!', 'The fence walks INTO the cutout too — count every edge segment!', '¡La valla también entra en la muesca: cuenta cada segmento!'),
            beats: [
              {
                title: L('1. Außenkanten + Innenkanten sehen', '1. See outer + inner edges', '1. Mira bordes exteriores e interiores'),
                text: L('Ein 4×3-Rechteck hätte Umfang 14 cm. Aber in der U-Form geht der Zaun 2 cm hinein und 2 cm wieder heraus!', 'A 4×3 box would have perimeter 14 cm, but the U-notch adds 2 cm going in and 2 cm coming back out!', 'Un rectángulo 4×3 tendría 14 cm, ¡pero la muesca suma 2 cm al bajar y 2 cm al subir!'),
                formula: '14 cm + 2 cm + 2 cm = 18 cm',
                visual: { type: 'area', mode: 'perim', grid: [[1,0,0,1],[1,0,0,1],[1,1,1,1]], numberedEdges: true },
              },
              {
                title: L('2. Kanten zählen — nicht Kästchen!', '2. Count edges — not border squares!', '2. ¡Cuenta bordes, no cuadrados!'),
                text: L('Die Figur hat nur 8 Kästchen (A = 8 cm²), aber 18 Zaunstücke (U = 18 cm) ✓', 'The shape only has 8 squares (A = 8 cm²), yet 18 fence edges (U = 18 cm) ✓', 'La figura tiene solo 8 cuadrados (A = 8 cm²), ¡pero 18 tramos de valla (P = 18 cm)!'),
                formula: 'A = 8 cm² · U = 18 cm ✓',
                visual: { type: 'area', mode: 'perim', grid: [[1,0,0,1],[1,0,0,1],[1,1,1,1]], numberedEdges: true },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · Flächengleich, anderer Umfang', 'Level 3 · Same Area, Different Perimeter', 'Nivel 3 · Misma área, distinto perímetro'),
        examples: [
          {
            label: L('Beispiel 1: 6 cm² als 2×3-Rechteck (U = 10 cm)', 'Example 1: 6 cm² compact (U = 10 cm)', 'Ejemplo 1: 6 cm² compacto (P = 10 cm)'),
            goal: L('Kompakte Figuren teilen viele Innenkanten — ihr Umfang ist KLEIN!', 'Compact shapes share many inner edges — their perimeter is SMALL!', '¡Las figuras compactas tienen un perímetro PEQUEÑO!'),
            beats: [
              {
                title: L('1. 6 Quadrate eng zusammenlegen', '1. Pack 6 squares tightly', '1. Junta 6 cuadrados'),
                text: L('Wir legen 6 Kästchen als kompaktes 2×3-Rechteck. Die Fläche innen ist A = 6 cm².', 'Arrange 6 squares into a compact 2×3 rectangle. The area inside is A = 6 cm².', 'Coloca 6 cuadrados en un rectángulo 2×3. El área interior es A = 6 cm².'),
                formula: 'A = 2 · 3 = 6 cm²',
                visual: { type: 'area', mode: 'area', grid: [[1,1,1],[1,1,1]], numbered: true },
              },
              {
                title: L('2. Zaun drumherum zählen: nur 10 cm!', '2. Walk the fence: only 10 cm!', '2. Recorre la valla: ¡solo 10 cm!'),
                text: L('Weil viele Kästchen aneinander liegen, bleiben außen nur U = 3 + 2 + 3 + 2 = 10 cm Zaun übrig!', 'Because the squares share many inner sides, the outer fence is only U = 3 + 2 + 3 + 2 = 10 cm!', 'Como comparten muchos lados internos, el perímetro exterior es solo 10 cm.'),
                formula: 'A = 6 cm² · U = 10 cm ✓',
                visual: { type: 'area', mode: 'perim', grid: [[1,1,1],[1,1,1]], numberedEdges: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: 6 cm² langgestreckt (U = 14 cm)', 'Example 2: 6 cm² stretched (U = 14 cm)', 'Ejemplo 2: 6 cm² alargado (P = 14 cm)'),
            goal: L('Dieselben 6 Quadrate in einer langen Reihe ergeben einen viel GRÖSSEREN Umfang!', 'The exact same 6 squares in one long strip give a much BIGGER perimeter!', '¡Los mismos 6 cuadrados en fila dan un perímetro mucho MAYOR!'),
            beats: [
              {
                title: L('1. Immer noch genau 6 Quadrate!', '1. Still exactly 6 squares!', '1. ¡Siguen siendo 6 cuadrados!'),
                text: L('Jetzt legen wir dieselben 6 Kästchen in eine lange 1×6-Reihe. Der Flächeninhalt bleibt A = 6 cm²!', 'Now lay the same 6 squares in one long 1×6 strip. The area is still A = 6 cm²!', 'Ahora pon los mismos 6 cuadrados en fila 1×6. El área sigue siendo 6 cm².'),
                formula: 'A = 6 cm²',
                visual: { type: 'area', mode: 'area', grid: [[1,1,1,1,1,1]], numbered: true },
              },
              {
                title: L('2. Gleiche Fläche — mehr Zaun!', '2. Same area — longer fence!', '2. ¡Misma área, valla más larga!'),
                text: L('Aber der Zaun außen wächst auf U = 6 + 1 + 6 + 1 = 14 cm! Merke: Gleiche Fläche heißt NICHT gleicher Umfang.', 'Yet the outer fence grows to U = 6 + 1 + 6 + 1 = 14 cm! Same area does NOT mean same perimeter.', '¡Pero el perímetro crece hasta 14 cm! Misma área NO significa mismo perímetro.'),
                formula: 'A = 6 cm² · U = 14 cm ✓',
                visual: { type: 'area', mode: 'perim', grid: [[1,1,1,1,1,1]], numberedEdges: true },
              },
            ],
          },
        ],
      },
    ],
  });

  return { L, register, get, listIds };
})();
