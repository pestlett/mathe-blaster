// Klasse 4 Walkthrough Data — Part 2 (Chapter 2 & Chapter 3: 6 Labs)
// Written +/− (with separate Abziehverfahren & Ergänzungsverfahren), Written ×, Written ÷,
// Units & Time, Geometry II, and Charts & Estimation.

(() => {
  'use strict';

  if (typeof LabWalkthroughData === 'undefined') return;
  const L = LabWalkthroughData.L;

  // =========================================================================
  // 6. SCHRIFTLICH +/− LABOR (written-addsub) — separates Abzieh & Ergänz!
  // =========================================================================
  LabWalkthroughData.register('written-addsub', (options) => {
    const method = (options && options.method) || 'abzieh';
    const isAbzieh = method !== 'ergaenz';

    return {
      tiers: [
        {
          label: L('Stufe 1 · Aufgabenblick & ohne Übertrag', 'Level 1 · Aufgabenblick & No Regrouping', 'Nivel 1 · Estrategia y sin llevadas'),
          examples: [
            {
              label: L('Beispiel 1: Aufgabenblick (40 000 − 2)', 'Example 1: Smart look first (40 000 − 2)', 'Ejemplo 1: Mirar antes (40 000 − 2)'),
              goal: L('Erst schauen, dann rechnen — manche Aufgaben gehen im Kopf viel schneller!', 'Look first before computing — some problems are much faster mentally!', '¡Mira primero: algunas cuentas son mucho más rápidas de cabeza!'),
              beats: [
                {
                  title: L('1. Zahlen genau anschauen (Aufgabenblick)', '1. Inspect the numbers first', '1. Observa primero los números'),
                  text: L('40 000 − 2: 40 000 ist glatt und 2 ist winzig! Schriftlich müsstest du über vier Nullen entbündeln — da passieren leicht Fehler!', '40 000 − 2: 40 000 is round and 2 is tiny! Written columns would borrow across 4 zeros — easy to slip!', '40 000 es redondo y 2 es diminuto. En columnas habría que cruzar 4 ceros.'),
                  formula: '40 000 − 2 → Kopfrechnen!',
                  visual: { type: 'addsub', op: '−', a: 40000, b: 2, ans: '?', mentalBadge: true },
                },
                {
                  title: L('2. Blitzschnell 2 Schritte zurück zählen!', '2. Count 2 steps back in a flash!', '2. ¡Cuenta 2 pasos atrás!'),
                  text: L('40 000 → 39 999 → 39 998! Merke: Vor jedem schriftlichen Rechnen kurz prüfen, ob es im Kopf viel leichter geht ✓', '40 000 → 39 999 → 39 998! Always check before writing columns if mental maths is faster ✓', '40 000 → 39 999 → 39 998. ¡Antes de escribir, comprueba si es más rápido de cabeza!'),
                  formula: '40 000 → 39 999 → 39 998 ✓',
                  visual: { type: 'addsub', op: '−', a: 40000, b: 2, ans: 39998, mentalBadge: true },
                },
              ],
            },
            {
              label: L('Beispiel 2: Stellenwertgerecht addieren (23 415 + 14 263)', 'Example 2: Column addition (23 415 + 14 263)', 'Ejemplo 2: Suma en columnas'),
              goal: L('Einer unter Einer, Zehner unter Zehner — wir rechnen von rechts nach links!', 'Ones under ones, tens under tens — work right to left!', 'Unidades bajo unidades — ¡calcula de derecha a izquierda!'),
              beats: [
                {
                  title: L('1. Rechts bei den Einern starten', '1. Start on the right (ones)', '1. Empieza por la derecha (E)'),
                  text: L('Wir schreiben die Zahlen genau untereinander. Rechts bei E: 5 + 3 = 8.', 'Align the digits cleanly from the right. Ones column: 5 + 3 = 8.', 'Alinea las cifras desde la derecha. Unidades: 5 + 3 = 8.'),
                  formula: 'E: 5 + 3 = 8',
                  visual: { type: 'addsub', op: '+', a: 23415, b: 14263, ans: '····8', hiCol: 4 },
                },
                {
                  title: L('2. Spalte für Spalte nach links & Überschlag', '2. Column by column + estimate', '2. Columna por columna + estimación'),
                  text: L('Z: 1+6=7 · H: 4+2=6 · T: 3+4=7 · ZT: 2+1=3 → 37 678. Überschlag: 23 000 + 14 000 = 37 000 ✓', 'Z: 7 · H: 6 · T: 7 · ZT: 3 → 37 678. Estimate: 23 000 + 14 000 = 37 000 ✓', 'Z: 7 · H: 6 · T: 7 · ZT: 3 → 37 678. Estimación: 37 000 ✓'),
                  formula: '23 415 + 14 263 = 37 678 ✓',
                  visual: { type: 'addsub', op: '+', a: 23415, b: 14263, ans: '37678', hiCol: -1 },
                },
              ],
            },
          ],
        },
        {
          label: isAbzieh
            ? L('Stufe 2 · Übertrag & Entbündeln (Abziehverfahren)', 'Level 2 · Carry & Unbundling (Abziehverfahren)', 'Nivel 2 · Llevadas y desagrupar')
            : L('Stufe 2 · Übertrag & Erweitern (Ergänzungsverfahren)', 'Level 2 · Carry & Ergänzungsverfahren', 'Nivel 2 · Llevadas (Ergänzungsverfahren)'),
          examples: [
            {
              label: L('Beispiel 1: Addition mit Übertrag (36 748 + 28 594)', 'Example 1: Addition with carry', 'Ejemplo 1: Suma con llevadas'),
              goal: L('Ab 10 bündeln wir 10 zu 1 Übertrag in die nächste linke Spalte!', 'At 10 or more, bundle 10 into 1 carry in the next column left!', 'Al llegar a 10, ¡lleva 1 a la columna de la izquierda!'),
              beats: [
                {
                  title: L('1. Einer addieren: 8 + 4 = 12', '1. Add ones: 8 + 4 = 12', '1. Suma unidades: 8 + 4 = 12'),
                  text: L('12 Einer = 1 Zehner + 2 Einer. Schreibe 2 bei E und den kleinen Übertrag 1 in die Z-Spalte!', '12 ones = 1 ten + 2 ones. Write 2 in E and jot the small carry 1 in the Z column!', '12 = 1 decena + 2 unidades. Escribe 2 en E y lleva 1 a Z.'),
                  formula: '8 + 4 = 12 → 2, Übertrag 1',
                  visual: { type: 'addsub', op: '+', a: 36748, b: 28594, carries: ['', '', '', '1', ''], ans: '····2', hiCol: 4 },
                },
                {
                  title: L('2. Übertrag immer mitzählen!', '2. Always include the carry!', '2. ¡Suma siempre la llevada!'),
                  text: L('Bei Z: 4 + 9 + 1 = 14 → 4, Übertrag 1. Weiter so durch H, T und ZT → 65 342!', 'At Z: 4 + 9 + 1 = 14 → 4, carry 1. Keep going through H, T, ZT → 65 342!', 'En Z: 4 + 9 + 1 = 14 → 4, lleva 1. Sigue así → 65 342.'),
                  formula: '36 748 + 28 594 = 65 342 ✓',
                  visual: { type: 'addsub', op: '+', a: 36748, b: 28594, carries: ['1', '1', '1', '1', ''], ans: '65342', hiCol: -1 },
                },
              ],
            },
            {
              label: isAbzieh
                ? L('Beispiel 2: Abziehen mit Entbündeln (7 425 − 2 849)', 'Example 2: Subtraction by unbundling', 'Ejemplo 2: Resta desagrupando')
                : L('Beispiel 2: Ergänzungsverfahren (7 425 − 2 849)', 'Example 2: Subtraction (Ergänzungsverfahren)', 'Ejemplo 2: Resta (Ergänzungsverfahren)'),
              goal: isAbzieh
                ? L('Nie „unten minus oben“ rechnen — lieber 1 aus der linken Spalte entbündeln!', 'Never flip digits — unbundle 1 from the column to the left!', 'Nunca inviertas cifras: ¡desagrupa 1 de la columna izquierda!')
                : L('Rechne von unten nach oben („Wie viel fehlt von 9 bis 15?“) und notiere den Übertrag!', 'Count up from bottom to top and jot the carry!', 'Cuenta de abajo hacia arriba y anota la llevada.'),
              beats: [
                {
                  title: isAbzieh
                    ? L('1. Bei E: 5 − 9 geht nicht → entbündeln!', '1. Ones: 5 − 9 → unbundle 1 Z!', '1. Unidades: 5 − 9 → ¡desagrupa 1 Z!')
                    : L('1. Bei E: von 9 bis 15 ergänzen', '1. Ones: count from 9 up to 15', '1. Unidades: de 9 hasta 15'),
                  text: isAbzieh
                    ? L('Wir tauschen 1 Zehner in 10 Einer um: Aus 2 Z wird 1 Z, aus 5 E werden 15 E. Jetzt: 15 − 9 = 6!', 'Trade 1 ten for 10 ones: 2 Z becomes 1 Z, 5 E becomes 15 E. Now 15 − 9 = 6!', 'Cambia 1 decena por 10 unidades: 15 − 9 = 6.')
                    : L('Von 9 bis 5 geht nicht, also von 9 bis 15: es fehlen 6! Dafür schreiben wir unten bei Z den Übertrag 1.', '9 up to 15 needs 6! Write carry 1 in the Z column below.', 'De 9 a 15 faltan 6. Anota la llevada 1 en la columna Z.'),
                  formula: isAbzieh ? '15 E − 9 E = 6 E' : '9 + 6 = 15 (Übertrag 1)',
                  visual: { type: 'addsub', op: '−', method, a: 7425, b: 2849, carries: isAbzieh ? ['', '', '1', '15'] : ['', '', '1', ''], ans: '···6', hiCol: 3 },
                },
                {
                  title: L('2. Weiter nach links & Probe!', '2. Finish left & check (Probe)!', '2. Sigue a la izquierda y prueba'),
                  text: L('So rechnen wir Z, H und T fertig → 4 576. Probe (Umkehraufgabe): 4 576 + 2 849 = 7 425 ✓', 'Finish Z, H, T → 4 576. Inverse check (Probe): 4 576 + 2 849 = 7 425 ✓', 'Termina Z, H y T → 4 576. Prueba inversa: 4 576 + 2 849 = 7 425 ✓'),
                  formula: 'Probe: 4 576 + 2 849 = 7 425 ✓',
                  visual: { type: 'addsub', op: '−', method, a: 7425, b: 2849, ans: '4576', hiCol: -1 },
                },
              ],
            },
          ],
        },
        {
          label: L('Stufe 3 · Nullen im Minuenden', 'Level 3 · Zeros in the Minuend', 'Nivel 3 · Ceros en el minuendo'),
          examples: [
            {
              label: L('Beispiel 1: Eine Null (4 052 − 1 385)', 'Example 1: One zero (4 052 − 1 385)', 'Ejemplo 1: Un cero (4 052 − 1 385)'),
              goal: L('Wenn die Nachbarspalte 0 ist, entbündeln wir eine Stelle weiter links!', 'When the neighbor column is 0, unbundle from one step further left!', 'Si la columna vecina es 0, desagrupa desde más a la izquierda.'),
              beats: [
                {
                  title: L('1. Über die 0 bei H hinweg entbündeln', '1. Unbundle across the 0 in H', '1. Desagrupa pasando el 0 en H'),
                  text: isAbzieh
                    ? L('Bei H steht 0 — dort können wir nichts wegnehmen! Also entbündeln wir 1 T → 10 H. Davon geben wir bei Bedarf 1 H weiter, sodass 9 H bleiben.', 'H has 0 — so we unbundle 1 T into 10 H! Passing 1 H right leaves 9 H cleanly.', 'H tiene 0, así que cambiamos 1 T en 10 H. Si pasamos 1 H, quedan 9 H.')
                    : L('Mit dem Ergänzungsverfahren schreiben wir bei jeder Stelle mit Zehnerübergang einfach den Übertrag 1 unten in die nächste Spalte — auch unter der 0!', 'In Ergänzungsverfahren, just write carry 1 under the next column — even when the top digit is 0!', 'En Ergänzungsverfahren, anota la llevada 1 debajo de la siguiente columna, incluso bajo el 0.'),
                  formula: '1 T = 10 H = 9 H + 10 Z',
                  visual: { type: 'addsub', op: '−', method, a: 4052, b: 1385, carries: isAbzieh ? ['3', '9', '14', '12'] : ['1', '1', '1', ''], ans: '2667', hiCol: 1 },
                },
                {
                  title: L('2. Immer Probe rechnen!', '2. Always do the Probe!', '2. ¡Haz siempre la prueba!'),
                  text: L('Bei Nullen hilft die Umkehraufgabe sofort: 2 667 + 1 385 = 4 052 ✓', 'The inverse addition immediately proves it: 2 667 + 1 385 = 4 052 ✓', 'La suma inversa lo demuestra al instante: 2 667 + 1 385 = 4 052 ✓'),
                  formula: 'Probe: 2 667 + 1 385 = 4 052 ✓',
                  visual: { type: 'addsub', op: '−', method, a: 4052, b: 1385, ans: '2667', hiCol: -1 },
                },
              ],
            },
            {
              label: L('Beispiel 2: Viele Nullen (100 000 − 43 268)', 'Example 2: Many zeros (100 000 − 43 268)', 'Ejemplo 2: Varios ceros (100 000 − 43 268)'),
              goal: L('Tipp: 100 000 = 99 999 + 1 — so siehst du sofort, warum aus den Nullen Neunen werden!', 'Insight: 100 000 = 99 999 + 1 — that\'s why every middle zero turns into a 9!', 'Truco: 100 000 = 99 999 + 1 — por eso los ceros intermedios se vuelven nueves.'),
              beats: [
                {
                  title: L('1. Warum werden die Nullen zu Neunen?', '1. Why do zeros become 9s?', '1. ¿Por qué los ceros se vuelven 9?'),
                  text: L('1 HT = 9 ZT + 9 T + 9 H + 9 Z + 10 E! Jede mittlere 0 gibt 1 nach rechts weiter und behält 9.', '1 HT = 9 ZT + 9 T + 9 H + 9 Z + 10 E! Each middle 0 passes 1 right and keeps 9.', '1 HT = 9 ZT + 9 T + 9 H + 9 Z + 10 E. Cada 0 intermedio pasa 1 y queda en 9.'),
                  formula: '99 99(10) − 43 268',
                  visual: { type: 'addsub', op: '−', method, a: 100000, b: 43268, carries: ['', '9', '9', '9', '9', '10'], ans: '56732', hiCol: 5 },
                },
                {
                  title: L('2. Ergebnis & Probe', '2. Result & Probe', '2. Resultado y prueba'),
                  text: L('10−8=2 · 9−6=3 · 9−2=7 · 9−3=6 · 9−4=5 → 56 732! Probe: 56 732 + 43 268 = 100 000 ✓', '10−8=2 · 9−6=3 · 9−2=7 · 9−3=6 · 9−4=5 → 56 732! Probe: 56 732 + 43 268 = 100 000 ✓', '10−8=2 · 9−6=3 · 9−2=7 · 9−3=6 · 9−4=5 → 56 732. Prueba: 56 732 + 43 268 = 100 000 ✓'),
                  formula: '56 732 + 43 268 = 100 000 ✓',
                  visual: { type: 'addsub', op: '−', method, a: 100000, b: 43268, ans: '56732', hiCol: -1 },
                },
              ],
            },
          ],
        },
      ],
    };
  });

  // =========================================================================
  // 7. SCHRIFTLICHE MULTIPLIKATION LABOR (written-mul)
  // =========================================================================
  LabWalkthroughData.register('written-mul', {
    tiers: [
      {
        label: L('Stufe 1 · 1-stellig & Überschlag', 'Level 1 · 1-Digit & Estimation', 'Nivel 1 · 1 cifra y estimación'),
        examples: [
          {
            label: L('Beispiel 1: 436 · 7 (erst mal, dann Übertrag!)', 'Example 1: 436 · 7 (multiply first, then carry!)', 'Ejemplo 1: 436 · 7'),
            goal: L('Beginne mit dem Überschlag — und rechne IMMER erst mal, dann addiere den Übertrag!', 'Start with an estimation — always multiply FIRST, then add the carry!', '¡Empieza estimando y multiplica PRIMERO antes de sumar la llevada!'),
            beats: [
              {
                title: L('1. Überschlag zuerst', '1. Estimate first (Überschlag)', '1. Estima primero'),
                text: L('436 liegt nah bei 400. 400 · 7 = 2 800 — unser Ergebnis muss also knapp über 2 800 liegen!', '436 is close to 400. 400 · 7 = 2 800 — so our answer must be just above 2 800!', '436 está cerca de 400. 400 · 7 = 2 800 — ¡el resultado estará cerca de 2 800!'),
                formula: 'Überschlag: 400 · 7 = 2 800',
                visual: { type: 'mul', a: 436, b: 7, est: '400 · 7 = 2 800', rows: [], ans: '?' },
              },
              {
                title: L('2. Einer: 7 · 6 = 42', '2. Ones: 7 · 6 = 42', '2. Unidades: 7 · 6 = 42'),
                text: L('Schreibe 2, merke 4 (Übertrag). Jetzt kommt der wichtigste Trick:', 'Write 2, carry 4. Now comes the most important rule:', 'Escribe 2, lleva 4. Ahora viene la regla clave:'),
                formula: '7 · 6 = 42 → schreibe 2, merke 4',
                visual: { type: 'mul', a: 436, b: 7, est: '≈ 2 800', rows: ['···2  (Übertrag 4)'], ans: '?' },
              },
              {
                title: L('3. Erst malnehmen, DANN Übertrag dazu!', '3. Multiply FIRST, THEN add carry!', '3. ¡Multiplica PRIMERO, luego suma la llevada!'),
                text: L('Bei Z: erst 7 · 3 = 21, DANN + 4 = 25 (schreibe 5, merke 2). Bei H: 7 · 4 = 28, + 2 = 30 → 3 052 ✓', 'At Z: first 7 · 3 = 21, THEN + 4 = 25 (write 5, carry 2). At H: 7 · 4 = 28, + 2 = 30 → 3 052 ✓', 'En Z: primero 7 · 3 = 21, luego + 4 = 25. En H: 7 · 4 = 28, + 2 = 30 → 3 052 ✓'),
                formula: '436 · 7 = 3 052 (≈ 2 800 ✓)',
                visual: { type: 'mul', a: 436, b: 7, est: '≈ 2 800 ✓', rows: [], ans: '3 052' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Falle Null im Faktor (2 308 · 6)', 'Example 2: Interior zero trap (2 308 · 6)', 'Ejemplo 2: Trampa del cero interior (2 308 · 6)'),
            goal: L('0 mal irgendeine Zahl ist immer 0 — plus den gemerkten Übertrag!', '0 times any number is always 0 — plus any carry!', '¡0 por cualquier número es 0, más la llevada!'),
            beats: [
              {
                title: L('1. Einer: 6 · 8 = 48', '1. Ones: 6 · 8 = 48', '1. Unidades: 6 · 8 = 48'),
                text: L('Schreibe 8, merke 4. Jetzt kommt die 0 bei Z!', 'Write 8, carry 4. Next comes the 0 at Z!', 'Escribe 8, lleva 4. ¡Ahora viene el 0 en Z!'),
                formula: '6 · 8 = 48 → 8, merke 4',
                visual: { type: 'mul', a: 2308, b: 6, est: '2 000 · 6 = 12 000', rows: ['····8 (Übertrag 4)'], ans: '?' },
              },
              {
                title: L('2. Zehner: 6 · 0 = 0, plus 4 = 4!', '2. Tens: 6 · 0 = 0, plus 4 = 4!', '2. Decenas: 6 · 0 = 0, más 4 = 4'),
                text: L('Achtung: 6 · 0 ist 0 (nicht 6!), plus Übertrag 4 ergibt 4. Weiter: 6 · 3 = 18, 6 · 2 + 1 = 13 → 13 848 ✓', 'Careful: 6 · 0 is 0 (not 6!), plus carry 4 makes 4. Then 6 · 3 = 18, 6 · 2 + 1 = 13 → 13 848 ✓', 'Cuidado: 6 · 0 = 0 (¡no 6!), más 4 = 4. Resultado: 13 848 ✓'),
                formula: '2 308 · 6 = 13 848 ✓',
                visual: { type: 'mul', a: 2308, b: 6, est: '≈ 12 000 ✓', rows: [], ans: '13 848' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Zehnerzahlen & Malkreuz', 'Level 2 · Tens & Malkreuz', 'Nivel 2 · Decenas y Malkreuz'),
        examples: [
          {
            label: L('Beispiel 1: 348 · 20 im Malkreuz', 'Example 1: 348 · 20 in the Malkreuz', 'Ejemplo 1: 348 · 20 con Malkreuz'),
            goal: L('Mal 20 heißt: mal 2 Zehner — deshalb gibt es 0 Einer am Ende!', 'Times 20 means times 2 tens — that\'s why there are 0 ones at the end!', 'Por 20 significa por 2 decenas: ¡por eso hay 0 unidades al final!'),
            beats: [
              {
                title: L('1. In Stellenwerte zerlegen', '1. Break into place values', '1. Descompón en valores posicionales'),
                text: L('348 = 300 + 40 + 8. Wir nehmen jedes Teil mit 20 mal: 6 000 + 800 + 160.', '348 = 300 + 40 + 8. Multiply each part by 20: 6 000 + 800 + 160.', '348 = 300 + 40 + 8. Multiplica cada parte por 20: 6 000 + 800 + 160.'),
                formula: '6 000 + 800 + 160 = 6 960',
                visual: { type: 'mul', malkreuz: { cols: [300, 40, 8], rows: [20] }, a: 348, b: 20, ans: '6 960' },
              },
              {
                title: L('2. Warum steht rechts eine 0?', '2. Why is there a 0 on the right?', '2. ¿Por qué hay un 0 a la derecha?'),
                text: L('348 · 2 = 696, also sind 348 · 2 Zehner = 696 Zehner = 6 960! Die 0 zeigt: es sind Zehner, keine Einer ✓', '348 · 2 = 696, so 348 · 2 tens = 696 tens = 6 960! The 0 shows these are tens ✓', '348 · 2 = 696, así que 348 · 2 decenas = 696 decenas = 6 960 ✓'),
                formula: '348 · 20 = 6 960 ✓',
                visual: { type: 'mul', a: 348, b: 20, est: '350 · 20 = 7 000 ✓', rows: [], ans: '6 960' },
              },
            ],
          },
          {
            label: L('Beispiel 2: 407 · 30', 'Example 2: 407 · 30', 'Ejemplo 2: 407 · 30'),
            goal: L('Auch mit einer 0 in der Mitte hilft das Malkreuz sofort!', 'Even with a 0 in the middle, the Malkreuz keeps every place crystal clear!', '¡Incluso con un 0 en medio, el Malkreuz mantiene todo clarísimo!'),
            beats: [
              {
                title: L('1. In Stellenwerte zerlegen: 407 = 400 + 7', '1. Break into place values: 407 = 400 + 7', '1. Descompón: 407 = 400 + 7'),
                text: L('Da die Zehnerstelle 0 ist, brauchen wir im Malkreuz nur zwei Spalten: 400 und 7!', 'Since the tens digit is 0, our Malkreuz only needs two columns: 400 and 7!', 'Como las decenas son 0, el Malkreuz solo necesita dos columnas: 400 y 7.'),
                formula: '400 · 30 = 12 000 · 7 · 30 = 210',
                visual: { type: 'mul', malkreuz: { cols: [400, 7], rows: [30] }, a: 407, b: 30, ans: '?' },
              },
              {
                title: L('2. Addieren & Überschlag prüfen', '2. Add & check your estimate', '2. Suma y comprueba tu estimación'),
                text: L('12 000 + 210 = 12 210! Überschlag: 400 · 30 = 12 000 — passt genau ✓', '12 000 + 210 = 12 210! Estimate: 400 · 30 = 12 000 — spot on ✓', '12 000 + 210 = 12 210. Estimación: 12 000 — ¡exacto!'),
                formula: '12 000 + 210 = 12 210 ✓',
                visual: { type: 'mul', a: 407, b: 30, est: '400 · 30 = 12 000 ✓', rows: [], ans: '12 210' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · 2-stelliger Faktor', 'Level 3 · 2-Digit Multiplier', 'Nivel 3 · Factor de 2 cifras'),
        examples: [
          {
            label: L('Beispiel 1: 348 · 27 (Zehner-Null verstehen!)', 'Example 1: 348 · 27 (why the tens 0?)', 'Ejemplo 1: 348 · 27 (¡por qué el 0!)'),
            goal: L('Zerlege 27 in 20 + 7 — die erste Zeile ist 348 · 20, deshalb steht rechts die 0!', 'Split 27 into 20 + 7 — row 1 is 348 · 20, that\'s why it ends in 0!', 'Separa 27 en 20 + 7: ¡la primera fila es 348 · 20, por eso lleva el 0!'),
            beats: [
              {
                title: L('1. Überschlag: 350 · 30 ≈ 10 500', '1. Estimate: 350 · 30 ≈ 10 500', '1. Estimación: 350 · 30 ≈ 10 500'),
                text: L('Unser Ergebnis muss rund 9 000 bis 10 500 groß sein — auf keinen Fall nur 3 000!', 'Our answer must be around 9 000–10 500 — never down near 3 000!', 'El resultado rondará 9 000–10 500, ¡nunca cerca de 3 000!'),
                formula: 'Überschlag ≈ 10 500',
                visual: { type: 'mul', a: 348, b: 27, est: '350 · 30 = 10 500', rows: ['· · · 0', '+ · · · ·'], ans: '?' },
              },
              {
                title: L('2. Erst mit 20 (Zehner) multiplizieren', '2. First multiply by 20 (tens)', '2. Primero multiplica por 20 (decenas)'),
                text: L('348 · 20 = 6 960! Weil wir mit Zehnern malnehmen, ist die Einer-Stelle 0 (Platzhalter).', '348 · 20 = 6 960! Because we multiply by tens, the ones place is 0 (placeholder).', '348 · 20 = 6 960. Al multiplicar por decenas, las unidades llevan 0.'),
                formula: '348 · 20 = 6 960',
                visual: { type: 'mul', a: 348, b: 27, est: '≈ 10 500', rows: ['6 960  (348 · 20)', '+ · · · ·'], ans: '?' },
              },
              {
                title: L('3. Dann mit 7 (Einer) & addieren', '3. Then by 7 (ones) & add', '3. Luego por 7 (unidades) y suma'),
                text: L('348 · 7 = 2 436. Beide Teilprodukte untereinander addieren: 6 960 + 2 436 = 9 396 ✓', '348 · 7 = 2 436. Add both partial products: 6 960 + 2 436 = 9 396 ✓', '348 · 7 = 2 436. Suma ambos productos: 6 960 + 2 436 = 9 396 ✓'),
                formula: '6 960 + 2 436 = 9 396 ✓',
                visual: { type: 'mul', a: 348, b: 27, est: '≈ 10 500 ✓', rows: ['6 960', '+ 2 436'], ans: '9 396' },
              },
            ],
          },
          {
            label: L('Beispiel 2: 407 · 36 (mit Null im Faktor)', 'Example 2: 407 · 36 (interior zero)', 'Ejemplo 2: 407 · 36 (cero interior)'),
            goal: L('Kombiniere beide Tricks: Zehner-0 in Zeile 1 und 0 · Zahl = 0!', 'Combine both skills: tens 0 in row 1 and 0 · n = 0!', '¡Combina ambos: el 0 de las decenas y 0 · n = 0!'),
            beats: [
              {
                title: L('1. Zwei Teilprodukte berechnen', '1. Compute both partial products', '1. Calcula los dos productos parciales'),
                text: L('Überschlag: 400 · 40 = 16 000. Zeile 1: 407 · 30 = 12 210. Zeile 2: 407 · 6 = 2 442.', 'Estimate: 400 · 40 = 16 000. Row 1: 407 · 30 = 12 210. Row 2: 407 · 6 = 2 442.', 'Estimación: 16 000. Fila 1: 407 · 30 = 12 210. Fila 2: 407 · 6 = 2 442.'),
                formula: '12 210 + 2 442',
                visual: { type: 'mul', a: 407, b: 36, est: '400 · 40 = 16 000', rows: ['12 210', '+ 2 442'], ans: '?' },
              },
              {
                title: L('2. Addieren & gegen Überschlag prüfen', '2. Add & verify against estimate', '2. Suma y comprueba la estimación'),
                text: L('12 210 + 2 442 = 14 652 — passt super zum Überschlag 16 000 ✓', '12 210 + 2 442 = 14 652 — right next to our estimate 16 000 ✓', '12 210 + 2 442 = 14 652 — ¡encaja perfecto con 16 000!'),
                formula: '407 · 36 = 14 652 ✓',
                visual: { type: 'mul', a: 407, b: 36, est: '≈ 16 000 ✓', rows: ['12 210', '+ 2 442'], ans: '14 652' },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 8. SCHRIFTLICHE DIVISION LABOR (written-div)
  // =========================================================================
  LabWalkthroughData.register('written-div', {
    tiers: [
      {
        label: L('Stufe 1 · Glatt 1-stellig dividieren', 'Level 1 · Clean 1-Digit Division', 'Nivel 1 · División exacta de 1 cifra'),
        examples: [
          {
            label: L('Beispiel 1: 9 468 : 3', 'Example 1: 9 468 : 3', 'Ejemplo 1: 9 468 : 3'),
            goal: L('Immer in 4 Takten: Teilen → Malnehmen → Abziehen → nächste Ziffer herunterholen!', 'Always 4 beats: Divide → Multiply → Subtract → Pull down next digit!', 'Siempre 4 pasos: Dividir → Multiplicar → Restar → Bajar cifra.'),
            beats: [
              {
                title: L('1. Überschlag & Stellenanzahl prüfen', '1. Estimate & count result digits', '1. Estima y cuenta cifras del resultado'),
                text: L('9 000 : 3 = 3 000 → unser Ergebnis hat 4 Stellen (T, H, Z, E)!', '9 000 : 3 = 3 000 → our quotient has 4 digits (T, H, Z, E)!', '9 000 : 3 = 3 000 → ¡el cociente tiene 4 cifras!'),
                formula: 'Überschlag: 9 000 : 3 = 3 000',
                visual: { type: 'div', dividend: '9 468', divisor: 3, q: '____', lines: ['Überschlag ≈ 3 000 (4 Stellen)'] },
              },
              {
                title: L('2. Schritt für Schritt von links', '2. Step by step from the left', '2. Paso a paso desde la izquierda'),
                text: L('9 : 3 = 3 (Rest 0). 4 herunter → 4 : 3 = 1 (Rest 1). 6 herunter → 16 : 3 = 5 (Rest 1). 8 herunter → 18 : 3 = 6.', '9 : 3 = 3 (R 0). Pull 4 → 4 : 3 = 1 (R 1). Pull 6 → 16 : 3 = 5 (R 1). Pull 8 → 18 : 3 = 6.', '9:3=3 (R 0), 4:3=1 (R 1), 16:3=5 (R 1), 18:3=6.'),
                formula: '9 468 : 3 = 3 156',
                visual: { type: 'div', dividend: '9 468', divisor: 3, q: '3 156', lines: ['9 : 3 = 3 (−9, R 0)', '4 : 3 = 1 (−3, R 1)', '16 : 3 = 5 (−15, R 1)', '18 : 3 = 6 (−18, R 0)'] },
              },
              {
                title: L('3. Probe mit Umkehraufgabe', '3. Check with inverse multiplication', '3. Prueba con multiplicación'),
                text: L('3 156 · 3 = 9 468 ✓ Alles stimmt aufs Haar!', '3 156 · 3 = 9 468 ✓ Exact match!', '3 156 · 3 = 9 468 ✓ ¡Exacto!'),
                formula: 'Probe: 3 156 · 3 = 9 468 ✓',
                visual: { type: 'div', dividend: '9 468', divisor: 3, q: '3 156', lines: ['Probe: 3 156 · 3 = 9 468 ✓'] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Erste Ziffer zu klein (2 848 : 4)', 'Example 2: First digit too small (2 848 : 4)', 'Ejemplo 2: Primera cifra menor (2 848 : 4)'),
            goal: L('Passt der Divisor nicht in die erste Ziffer, nimmst du am Anfang die ersten ZWEI Ziffern!', 'If the divisor doesn\'t fit into the first digit, take the first TWO digits to start!', 'Si el divisor no cabe en la primera cifra, toma las DOS primeras al inicio.'),
            beats: [
              {
                title: L('1. 28 Hunderter teilen', '1. Divide 28 hundreds', '1. Divide 28 centenas'),
                text: L('4 passt nicht in 2, also starten wir mit 28 Hundertern: 28 : 4 = 7 (H). Das Ergebnis hat 3 Stellen!', '4 doesn\'t fit in 2, so start with 28 hundreds: 28 : 4 = 7 (H). So the answer has 3 digits!', '4 no cabe en 2, empieza con 28: 28 : 4 = 7. ¡El cociente tiene 3 cifras!'),
                formula: '28 : 4 = 7 (Rest 0)',
                visual: { type: 'div', dividend: '2 848', divisor: 4, q: '7__', lines: ['28 : 4 = 7 (−28, R 0)'] },
              },
              {
                title: L('2. Zehner & Einer teilen + Probe', '2. Divide tens & ones + Probe', '2. Divide decenas y unidades + prueba'),
                text: L('4 : 4 = 1 und 8 : 4 = 2 → 712! Probe: 712 · 4 = 2 848 ✓', '4 : 4 = 1 and 8 : 4 = 2 → 712! Probe: 712 · 4 = 2 848 ✓', '4 : 4 = 1 y 8 : 4 = 2 → 712. Prueba: 712 · 4 = 2 848 ✓'),
                formula: 'Probe: 712 · 4 = 2 848 ✓',
                visual: { type: 'div', dividend: '2 848', divisor: 4, q: '712', lines: ['28 : 4 = 7', '4 : 4 = 1', '8 : 4 = 2', 'Probe: 712 · 4 = 2 848 ✓'] },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Null im Quotienten!', 'Level 2 · Zero in the Quotient!', 'Nivel 2 · ¡Cero en el cociente!'),
        examples: [
          {
            label: L('Beispiel 1: 8 160 : 4 = 2 040 (nicht 240!)', 'Example 1: 8 160 : 4 = 2 040 (not 240!)', 'Ejemplo 1: 8 160 : 4 = 2 040 (¡no 240!)'),
            goal: L('JEDE heruntergeholte Ziffer bekommt eine eigene Ziffer im Ergebnis — auch wenn es 0 ist!', 'EVERY pulled-down digit earns its own digit in the answer — even 0!', '¡CADA cifra que bajas tiene su cifra en el resultado, aunque sea 0!'),
            beats: [
              {
                title: L('1. Überschlag rettet vor vergessenen Nullen!', '1. Estimate catches missing zeros!', '1. ¡La estimación evita olvidar ceros!'),
                text: L('8 000 : 4 = 2 000! Deshalb weißt du sofort: 240 oder 204 kann niemals stimmen — es müssen 4 Stellen sein!', '8 000 : 4 = 2 000! So you immediately know 240 or 204 is impossible — it MUST have 4 digits!', '8 000 : 4 = 2 000. ¡Así sabes que 240 es imposible: debe tener 4 cifras!'),
                formula: 'Überschlag: 8 000 : 4 = 2 000',
                visual: { type: 'div', dividend: '8 160', divisor: 4, q: '2 _ _ _', lines: ['8 : 4 = 2 (−8, R 0)'] },
              },
              {
                title: L('2. Die wichtige 0-Stelle: 1 H : 4 = 0!', '2. The key 0-beat: 1 H : 4 = 0!', '2. El paso del 0: ¡1 H : 4 = 0!'),
                text: L('Wir holen die 1 herunter. 1 Hunderter : 4 geht 0-mal → schreibe eine 0 ins Ergebnis! Erst DANN holen wir die 6 herunter → 16 : 4 = 4.', 'Pull down 1. 1 hundred ÷ 4 fits 0 times → write 0 in the quotient! ONLY THEN pull down 6 → 16 : 4 = 4.', 'Baja el 1. 1 : 4 cabe 0 veces → ¡escribe 0! Solo después baja el 6 → 16 : 4 = 4.'),
                formula: '1 : 4 = 0 → schreibe 0!',
                visual: { type: 'div', dividend: '8 160', divisor: 4, q: '2 04_', highlightZero: true, lines: ['8 : 4 = 2', '1 : 4 = 0  ← 0 notieren!', '16 : 4 = 4 (−16, R 0)'] },
              },
              {
                title: L('3. Endnull nicht vergessen & Probe!', '3. Don\'t forget the final 0 + Probe!', '3. ¡No olvides el 0 final + prueba!'),
                text: L('Die letzte 0 herunterholen: 0 : 4 = 0 → 2 040! Probe: 2 040 · 4 = 8 160 ✓', 'Pull down the last 0: 0 : 4 = 0 → 2 040! Probe: 2 040 · 4 = 8 160 ✓', 'Baja el último 0: 0 : 4 = 0 → 2 040. Prueba: 2 040 · 4 = 8 160 ✓'),
                formula: '2 040 · 4 = 8 160 ✓',
                visual: { type: 'div', dividend: '8 160', divisor: 4, q: '2 040', highlightZero: true, lines: ['0 : 4 = 0  ← 0 notieren!', 'Probe: 2 040 · 4 = 8 160 ✓'] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Doppelte Null (6 018 : 6 = 1 003)', 'Example 2: Double zero (6 018 : 6 = 1 003)', 'Ejemplo 2: Doble cero (6 018 : 6 = 1 003)'),
            goal: L('Auch zwei Nullen hintereinander werden brav einzeln notiert!', 'Even two zeros in a row are written carefully one by one!', '¡Incluso dos ceros seguidos se anotan uno por uno!'),
            beats: [
              {
                title: L('1. Beide Nullen brav aufschreiben!', '1. Write BOTH zeros carefully!', '1. ¡Escribe AMBOS ceros!'),
                text: L('6 : 6 = 1. Dann 0 herunter → 0 : 6 = 0! Dann 1 herunter → 1 : 6 = 0! Jetzt erst die 8 dazu → 18.', '6 : 6 = 1. Pull 0 → 0 : 6 = 0! Pull 1 → 1 : 6 = 0! Only now pull 8 → 18.', '6:6=1. Baja 0 → 0:6=0. Baja 1 → 1:6=0. ¡Ahora baja el 8 → 18!'),
                formula: '6:6=1 · 0:6=0 · 1:6=0',
                visual: { type: 'div', dividend: '6 018', divisor: 6, q: '1 00_', highlightZero: true, lines: ['6 : 6 = 1', '0 : 6 = 0 ← 0!', '1 : 6 = 0 ← 0!'] },
              },
              {
                title: L('2. Letzter Schritt 18 : 6 = 3 & Probe', '2. Final beat 18 : 6 = 3 & Probe', '2. Paso final 18 : 6 = 3 y prueba'),
                text: L('18 : 6 = 3 → 1 003! Probe: 1 003 · 6 = 6 018 ✓ (Hätten wir Nullen vergessen, wäre 13 · 6 nur 78!)', '18 : 6 = 3 → 1 003! Probe: 1 003 · 6 = 6 018 ✓', '18 : 6 = 3 → 1 003. Prueba: 1 003 · 6 = 6 018 ✓'),
                formula: 'Probe: 1 003 · 6 = 6 018 ✓',
                visual: { type: 'div', dividend: '6 018', divisor: 6, q: '1 003', highlightZero: true, lines: ['18 : 6 = 3 (−18, R 0)', 'Probe: 1 003 · 6 = 6 018 ✓'] },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · Rest + Probe & Zehnerdivisor', 'Level 3 · Remainder & Tens Divisors', 'Nivel 3 · Resto y divisores de decenas'),
        examples: [
          {
            label: L('Beispiel 1: Mit Rest (3 749 : 4)', 'Example 1: With remainder (3 749 : 4)', 'Ejemplo 1: Con resto (3 749 : 4)'),
            goal: L('Der Rest ist IMMER kleiner als der Divisor — und die Probe zählt den Rest wieder dazu!', 'The remainder is ALWAYS smaller than the divisor — and the Probe adds it back!', '¡El resto siempre es menor que el divisor, y la prueba lo suma de vuelta!'),
            beats: [
              {
                title: L('1. Bis zum Rest teilen', '1. Divide down to the remainder', '1. Divide hasta el resto'),
                text: L('37 : 4 = 9 (R 1) · 14 : 4 = 3 (R 2) · 29 : 4 = 7 (R 1). Rest 1 < 4 ✓ (Wäre Rest ≥ 4, passt die 4 noch einmal hinein!)', '37 : 4 = 9 (R 1) · 14 : 4 = 3 (R 2) · 29 : 4 = 7 (R 1). Rest 1 < 4 ✓', '37:4=9 (R 1) · 14:4=3 (R 2) · 29:4=7 (R 1). ¡Resto 1 < 4!'),
                formula: '937 Rest 1 (1 < 4 ✓)',
                visual: { type: 'div', dividend: '3 749', divisor: 4, q: '937 R 1', lines: ['37:4=9 (R1) · 14:4=3 (R2) · 29:4=7 (R1)'] },
              },
              {
                title: L('2. Probe mit Rest!', '2. Probe with remainder!', '2. ¡Prueba con resto!'),
                text: L('937 · 4 = 3 748, plus Rest 1 = 3 749 ✓ Genau unsere Startzahl!', '937 · 4 = 3 748, plus remainder 1 = 3 749 ✓ Back to our start number!', '937 · 4 = 3 748, más resto 1 = 3 749 ✓ ¡Exacto!'),
                formula: '937 · 4 + 1 = 3 749 ✓',
                visual: { type: 'div', dividend: '3 749', divisor: 4, q: '937 R 1', lines: ['Probe: 937 · 4 + 1 = 3 749 ✓'] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Glatter Zehnerdivisor (14 400 : 30)', 'Example 2: Clean tens divisor (14 400 : 30)', 'Ejemplo 2: Divisor decena (14 400 : 30)'),
            goal: L('Verbinde Zehnerdivision mit der 30er-Reihe — und streiche Nullen NIE bei Aufgaben mit Rest!', 'Link tens division to the 30s table — never cross off zeros when there is a remainder!', 'Relaciona con la tabla del 30 — ¡y nunca taches ceros si hay resto!'),
            beats: [
              {
                title: L('1. In Zehnerpaketen denken', '1. Think in packs of 10', '1. Piensa en paquetes de 10'),
                text: L('14 400 sind 1 440 Zehner, 30 sind 3 Zehner. Wie oft passen 3 Zehner in 1 440 Zehner?', '14 400 is 1 440 tens, 30 is 3 tens. How many times do 3 tens fit in 1 440 tens?', '14 400 son 1 440 decenas y 30 son 3 decenas.'),
                formula: '1 440 Zehner : 3 Zehner',
                visual: { type: 'div', dividend: '14 400', divisor: 30, q: '___', lines: ['1 440 Zehner : 3 Zehner = ?'] },
              },
              {
                title: L('2. Teilen & mit Probe prüfen', '2. Divide & verify with Probe', '2. Divide y comprueba'),
                text: L('1 440 : 3 = 480! Probe: 480 · 30 = 14 400 ✓ Merke: Bei Rest darfst du NIE einfach Nullen streichen!', '1 440 : 3 = 480! Probe: 480 · 30 = 14 400 ✓ Remember: NEVER cross off zeros if there is a remainder!', '1 440 : 3 = 480. Prueba: 480 · 30 = 14 400 ✓'),
                formula: '480 · 30 = 14 400 ✓',
                visual: { type: 'div', dividend: '14 400', divisor: 30, q: '480', lines: ['1 440 : 3 = 480', 'Probe: 480 · 30 = 14 400 ✓'] },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 9. GRÖSSEN-LABOR (units)
  // =========================================================================
  LabWalkthroughData.register('units', {
    tiers: [
      {
        label: L('Stufe 1 · Alltagsbrüche & Umwandeln', 'Level 1 · Everyday Fractions & Units', 'Nivel 1 · Fracciones cotidianas y unidades'),
        examples: [
          {
            label: L('Beispiel 1: ½ l, ¼ kg, ¾ h', 'Example 1: ½ l, ¼ kg, ¾ h', 'Ejemplo 1: ½ l, ¼ kg, ¾ h'),
            goal: L('Verbinde Brüche immer mit echten Mengen: 1 l = 1 000 ml, 1 kg = 1 000 g, 1 h = 60 min!', 'Always ground fractions in real measures: 1 l = 1 000 ml, 1 kg = 1 000 g, 1 h = 60 min!', 'Conecta las fracciones con medidas reales: 1 l = 1 000 ml, 1 kg = 1 000 g, 1 h = 60 min.'),
            beats: [
              {
                title: L('1. Erst ein Viertel oder die Hälfte finden', '1. Find a half or a quarter first', '1. Halla primero la mitad o un cuarto'),
                text: L('1 l = 1 000 ml → die Hälfte ½ l = 500 ml. 1 kg = 1 000 g → ein Viertel ¼ kg = 250 g.', '1 l = 1 000 ml → half ½ l = 500 ml. 1 kg = 1 000 g → quarter ¼ kg = 250 g.', '1 l = 1 000 ml → ½ l = 500 ml. 1 kg = 1 000 g → ¼ kg = 250 g.'),
                formula: '½ l = 500 ml · ¼ kg = 250 g',
                visual: { type: 'units', mode: 'table', cols: ['kg', '100g', '10g', 'g'], vals: ['0', '2', '5', '0'], banner: '¼ kg = 250 g' },
              },
              {
                title: L('2. Bei der Uhr: 1 Stunde = 60 Minuten!', '2. On the clock: 1 hour = 60 minutes!', '2. En el reloj: ¡1 hora = 60 minutos!'),
                text: L('¼ h = 60 ÷ 4 = 15 min. Also sind ¾ h = 3 · 15 = 45 min ✓', '¼ h = 60 ÷ 4 = 15 min. So ¾ h = 3 · 15 = 45 min ✓', '¼ h = 15 min, así que ¾ h = 3 · 15 = 45 min ✓'),
                formula: '¾ h = 3 · 15 min = 45 min ✓',
                visual: { type: 'units', mode: 'time', start: '00:00', mid: '00:15', end: '00:45', j1: '+15 min (¼ h)', j2: '+30 min (½ h)' },
              },
            ],
          },
          {
            label: L('Beispiel 2: 1 000er vs. 100er (km/m vs. m/cm)', 'Example 2: 1 000 vs. 100 factor', 'Ejemplo 2: Factor 1 000 frente a 100'),
            goal: L('„Kilo“ bedeutet immer 1 000 — „Zenti“ bedeutet 100!', '"Kilo" always means 1 000 — "centi" means 100!', '"Kilo" siempre es 1 000 — "centi" es 100.'),
            beats: [
              {
                title: L('1. Merksatz: Kilo = 1 000 (3 Stellen!)', '1. Remember: Kilo = 1 000 (3 places!)', '1. Recuerda: Kilo = 1 000 (3 cifras)'),
                text: L('1 km = 1 000 m und 1 kg = 1 000 g! Deshalb hat die km/m-Tabelle genau 3 Meter-Spalten: 100 m, 10 m, m.', '1 km = 1 000 m and 1 kg = 1 000 g! That\'s why km/m has 3 metre columns: 100 m, 10 m, m.', '1 km = 1 000 m y 1 kg = 1 000 g: por eso tiene 3 columnas.'),
                formula: '3 km = 3 000 m',
                visual: { type: 'units', mode: 'table', cols: ['km', '100m', '10m', 'm'], vals: ['3', '0', '0', '0'], banner: '3 km = 3 000 m' },
              },
              {
                title: L('2. Aber: Zenti = 100 (nur 2 Stellen!)', '2. But: Centi = 100 (only 2 places!)', '2. Pero: Centi = 100 (solo 2 cifras)'),
                text: L('1 m = 100 cm und 1 € = 100 ct — hier gibt es nur 2 Spalten (10 cm, cm)! Deshalb ist 3 m = 300 cm (nicht 3 000 cm!) ✓', '1 m = 100 cm and 1 € = 100 ct — only 2 columns! So 3 m = 300 cm (not 3 000 cm!) ✓', '1 m = 100 cm y 1 € = 100 ct — ¡solo 2 columnas! 3 m = 300 cm ✓'),
                formula: '3 m = 300 cm ✓',
                visual: { type: 'units', mode: 'table', cols: ['m', '10cm', 'cm'], vals: ['3', '0', '0'], banner: '3 m = 300 cm' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Kommaschreibweise & Platzhalternull', 'Level 2 · Comma Notation & Zero Placeholder', 'Nivel 2 · Coma y cero de posición'),
        examples: [
          {
            label: L('Beispiel 1: 2 km 50 m = 2 050 m (nicht 250 m!)', 'Example 1: 2 km 50 m = 2 050 m', 'Ejemplo 1: 2 km 50 m = 2 050 m'),
            goal: L('Die Größen-Stellenwerttafel schützt vor vergessenen Nullen!', 'The unit place-value table protects against missing zeros!', '¡La tabla de unidades evita que se pierdan ceros!'),
            beats: [
              {
                title: L('1. Bekannte Stellen eintragen', '1. Fill in the given values', '1. Coloca las cifras conocidas'),
                text: L('2 kommt in die km-Spalte, 50 m sind 5 Zehner-Meter und 0 Einer-Meter. Schau auf die 100-m-Spalte — sie ist noch leer!', 'Put 2 in km, 5 in 10 m, and 0 in m. Look at the 100 m column — it\'s still empty!', 'Pon 2 en km, 5 en 10 m y 0 en m. ¡La columna de 100 m está vacía!'),
                formula: '2 km · ? · 5 · 0 m',
                visual: { type: 'units', mode: 'table', cols: ['km', '100m', '10m', 'm'], vals: ['2', '?', '5', '0'], hi: [1], banner: '2 km 50 m = ? m' },
              },
              {
                title: L('2. Leere Spalte mit 0 füllen!', '2. Fill the empty column with 0!', '2. ¡Rellena el hueco con un 0!'),
                text: L('In die leere 100-m-Spalte gehört die Platzhalternull 0! Jetzt liest du die Zahl einfach ab: 2 050 m ✓ (niemals 250 m!)', 'Write placeholder 0 in the empty 100 m column! Now read straight across: 2 050 m ✓ (never 250 m!)', 'Pon el 0 en la columna de 100 m y lee de seguido: ¡2 050 m!'),
                formula: '2 km | 0 · 5 · 0 m = 2 050 m ✓',
                visual: { type: 'units', mode: 'table', cols: ['km', '100m', '10m', 'm'], vals: ['2', '0', '5', '0'], hi: [1], banner: '2 km 50 m = 2 050 m' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Das Komma trennt die Einheiten (2,05 km)', 'Example 2: Comma separates units (2,05 km)', 'Ejemplo 2: La coma separa unidades (2,05 km)'),
            goal: L('Das Komma trennt große und kleine Einheit — 2,05 km ≠ 2,5 km!', 'The comma separates big and small unit — 2,05 km ≠ 2,5 km!', '¡La coma separa unidad grande y pequeña: 2,05 km ≠ 2,5 km!'),
            beats: [
              {
                title: L('1. Komma genau hinter der großen Einheit', '1. Comma goes right after the big unit', '1. Pon la coma tras la unidad grande'),
                text: L('Links vom Komma stehen die ganzen km (2), rechts davon stehen die Meter: 050.', 'Left of the comma sit whole km (2), right of it sit the metres: 050.', 'A la izquierda los km enteros (2) y a la derecha los metros: 050.'),
                formula: '2 km 50 m → 2,050 km',
                visual: { type: 'units', mode: 'table', cols: ['km ,', '100m', '10m', 'm'], vals: ['2 ,', '0', '5', '0'], hi: [0], banner: '2,050 km' },
              },
              {
                title: L('2. Warum 2,05 km ≠ 2,5 km!', '2. Why 2,05 km ≠ 2,5 km!', '2. ¡Por qué 2,05 km ≠ 2,5 km!'),
                text: L('Die 0 hinter dem Komma darf NIE wegfallen — sie hält den 100-m-Platz frei! 2,5 km wären 2 500 m, aber 2,05 km sind 2 050 m ✓', 'Never drop the 0 right after the comma — it holds the 100 m place! 2,5 km = 2 500 m, while 2,05 km = 2 050 m ✓', '¡Nunca borres el 0 tras la coma! 2,5 km son 2 500 m, pero 2,05 km son 2 050 m ✓'),
                formula: '2 km 50 m = 2,05 km ✓',
                visual: { type: 'units', mode: 'table', cols: ['km ,', '100m', '10m', 'm'], vals: ['2 ,', '0', '5', '0'], hi: [0, 1], banner: '2,05 km (≠ 2,5 km!)' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · Zeitstrahl & 60er-System', 'Level 3 · Timeline & Base-60 Time', 'Nivel 3 · Línea de tiempo (base 60)'),
        examples: [
          {
            label: L('Beispiel 1: 1 h 35 min = 95 min (nie 135!)', 'Example 1: 1 h 35 min = 95 min (never 135!)', 'Ejemplo 1: 1 h 35 min = 95 min'),
            goal: L('Zeit zählt in 60er-Schritten, niemals in 100er-Schritten!', 'Time counts in 60s, never in 100s!', '¡El tiempo va de 60 en 60, nunca de 100 en 100!'),
            beats: [
              {
                title: L('1. Erst die Stunde in 60 Minuten tauschen', '1. Trade 1 hour for 60 minutes first', '1. Cambia 1 hora por 60 minutos'),
                text: L('1 volle Stunde hat genau 60 Minuten (NICHT 100!). Wir springen zuerst +60 min.', '1 full hour has exactly 60 minutes (NOT 100!). First jump +60 min.', '1 hora tiene exactamente 60 minutos (¡NO 100!). Salta +60 min.'),
                formula: '1 h = 60 min',
                visual: { type: 'units', mode: 'time', start: '0 min', mid: '60 min (1 h)', end: '? min', j1: '+60 min', j2: '+35 min' },
              },
              {
                title: L('2. Restliche Minuten dazu: 60 + 35 = 95!', '2. Add remaining minutes: 60 + 35 = 95!', '2. Suma los minutos: 60 + 35 = 95'),
                text: L('60 min + 35 min = 95 min ✓ Merk dir: 1 h 35 min ist niemals 135 min!', '60 min + 35 min = 95 min ✓ Remember: 1 h 35 min is never 135 min!', '60 min + 35 min = 95 min ✓ ¡Nunca 135 min!'),
                formula: '60 min + 35 min = 95 min ✓',
                visual: { type: 'units', mode: 'time', start: '0 min', mid: '60 min (1 h)', end: '95 min', j1: '+60 min', j2: '+35 min' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Zeitspanne 14:35 bis 16:15', 'Example 2: Elapsed time 14:35 to 16:15', 'Ejemplo 2: Duración 14:35 a 16:15'),
            goal: L('Springe auf dem Zeitstrahl immer zuerst bis zur nächsten vollen Stunde!', 'On the timeline, always jump to the next full hour first!', '¡En la línea de tiempo salta primero a la hora en punto!'),
            beats: [
              {
                title: L('1. Erst bis 15:00 Uhr springen', '1. First jump to 15:00', '1. Salta primero a las 15:00'),
                text: L('Von 14:35 bis 15:00 fehlen 25 Minuten (weil 35 + 25 = 60!).', 'From 14:35 to 15:00 is 25 minutes (because 35 + 25 = 60!).', 'De 14:35 a 15:00 van 25 minutos (porque 35 + 25 = 60).'),
                formula: '14:35 → 15:00 = +25 min',
                visual: { type: 'units', mode: 'time', start: '14:35', mid: '15:00', end: '16:15', j1: '+25 min', j2: '+? min' },
              },
              {
                title: L('2. Weiter bis 16:15 & addieren', '2. Continue to 16:15 & add', '2. Sigue hasta 16:15 y suma'),
                text: L('Von 15:00 bis 16:15 sind es 1 h 15 min = 75 min. Zusammen: 25 + 75 = 100 min ✓', 'From 15:00 to 16:15 is 1 h 15 min = 75 min. Total: 25 + 75 = 100 min ✓', 'De 15:00 a 16:15 son 75 min. Total: 25 + 75 = 100 min ✓'),
                formula: '25 min + 75 min = 100 min ✓',
                visual: { type: 'units', mode: 'time', start: '14:35', mid: '15:00', end: '16:15', j1: '+25 min', j2: '+75 min' },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 10. GEOMETRIE-LABOR II (geometry)
  // =========================================================================
  LabWalkthroughData.register('geometry', {
    tiers: [
      {
        label: L('Stufe 1 · Achsensymmetrie', 'Level 1 · Mirror Symmetry', 'Nivel 1 · Simetría axial'),
        examples: [
          {
            label: L('Beispiel 1: Abstand zur Spiegelachse zählen', 'Example 1: Count distance to mirror axis', 'Ejemplo 1: Distancia al eje'),
            goal: L('Jedes gespiegelte Kästchen hat genau denselben Abstand zur gelben Spiegelachse!', 'Every mirrored tile sits at the exact same distance from the yellow mirror axis!', '¡Cada casilla reflejada está a la misma distancia del eje amarillo!'),
            beats: [
              {
                title: L('1. Kästchen links ansehen', '1. Look at each tile on the left', '1. Mira cada casilla de la izquierda'),
                text: L('Zähle für jedes lila Kästchen den Abstand zur gelben Spiegelachse: oben 1 Feld, in der Mitte 2 Felder, unten 3 Felder.', 'Count how far each purple tile sits from the yellow mirror axis: top 1 square, middle 2 squares, bottom 3 squares.', 'Cuenta la distancia de cada cuadro morado al eje amarillo: arriba 1, medio 2, abajo 3.'),
                formula: L('Abstand messen: 1, 2, 3', 'Measure distance: 1, 2, 3', 'Mide distancias: 1, 2, 3'),
                visual: { type: 'geometry', mode: 'sym', left: [[0,2],[1,1],[2,0]], right: [] },
              },
              {
                title: L('2. Gleicher Abstand auf der anderen Seite!', '2. Same distance on the right side!', '2. ¡Misma distancia al otro lado!'),
                text: L('Setze die grünen Spiegel-Kästchen im genau gleichen Abstand rechts der Achse: 1 Feld, 2 Felder, 3 Felder ✓', 'Place the green mirror tiles at the exact same distances to the right: 1, 2, and 3 squares ✓', 'Coloca los cuadros verdes a la misma distancia a la derecha: 1, 2 y 3 ✓'),
                formula: L('Abstand links = Abstand rechts ✓', 'Distance left = Distance right ✓', 'Distancia izq. = Distancia der. ✓'),
                visual: { type: 'geometry', mode: 'sym', left: [[0,2],[1,1],[2,0]], right: [[0,0],[1,1],[2,2]] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Spiegeln ≠ Verschieben! (Falttest)', 'Example 2: Reflection ≠ Shift! (Fold test)', 'Ejemplo 2: ¡Reflejar ≠ desplazar!'),
            goal: L('Mach den Falttest im Kopf: Klappt das Blatt an der gelben Linie genau aufeinander?', 'Do the mental fold test: do both halves land right on top of each other?', 'Haz la prueba del doblez: ¿coinciden ambas mitades al doblar por la línea?'),
            beats: [
              {
                title: L('1. Was liegt nah an der Achse?', '1. Which tiles sit closest to the axis?', '1. ¿Qué cuadros están cerca del eje?'),
                text: L('Oben und in der Mitte liegen lila Kästchen DIREKT an der gelben Linie (Abstand 1). Dort landen sie auch nach dem Falten!', 'Top and middle purple tiles sit RIGHT against the yellow line (distance 1). They stay right against it when folded!', 'Los cuadros de arriba y el medio tocan el eje: ¡al doblar siguen tocando el eje!'),
                formula: L('Nah bleibt nah!', 'Near stays near!', '¡Cerca sigue cerca!'),
                visual: { type: 'geometry', mode: 'sym', left: [[0,2],[1,2],[2,0]], right: [[0,0],[1,0]] },
              },
              {
                title: L('2. Fern bleibt fern — Falttest bestanden!', '2. Far stays far — fold test passed!', '2. ¡Lejos sigue lejos — prueba superada!'),
                text: L('Das untere Kästchen ganz außen (Abstand 3) landet rechts auch ganz außen! Verschieben wäre falsch — Spiegeln dreht die Figur um ✓', 'The far-left bottom tile (distance 3) lands far-right too! Sliding fails — reflecting flips it cleanly ✓', 'El cuadro lejano de abajo va también al extremo derecho. ¡Prueba del doblez superada!'),
                formula: L('Falttest bestanden ✓', 'Fold test passed ✓', 'Prueba del doblez ✓'),
                visual: { type: 'geometry', mode: 'sym', left: [[0,2],[1,2],[2,0]], right: [[0,0],[1,0],[2,2]] },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Maßstab (Vergrößern & Verkleinern)', 'Level 2 · Scale (Enlarge & Shrink)', 'Nivel 2 · Escala'),
        examples: [
          {
            label: L('Beispiel 1: Vergrößern 2 : 1', 'Example 1: Enlarge 2 : 1', 'Ejemplo 1: Ampliar 2 : 1'),
            goal: L('Maßstab verändert IMMER Breite UND Höhe mit demselben Faktor!', 'Scaling ALWAYS changes BOTH width and height by the same factor!', '¡La escala cambia SIEMPRE el ancho Y el alto por el mismo factor!'),
            beats: [
              {
                title: L('1. Erst die Breite verdoppeln', '1. Double the width first', '1. Duplica primero el ancho'),
                text: L('2 : 1 heißt: jede Seite wird doppelt so lang (×2). Aus Breite 3 cm werden 3 · 2 = 6 cm!', '2 : 1 means every side becomes twice as long (×2). Width 3 cm becomes 3 · 2 = 6 cm!', '2 : 1 significa el doble (×2). El ancho de 3 cm pasa a 6 cm.'),
                formula: 'Breite: 3 · 2 = 6 cm',
                visual: { type: 'geometry', mode: 'scale', ow: 3, oh: 2, nw: 6, nh: '?', label: '2 : 1' },
              },
              {
                title: L('2. Höhe nicht vergessen!', '2. Don\'t forget the height!', '2. ¡No olvides el alto!'),
                text: L('Auch die Höhe wird verdoppelt: 2 · 2 = 4 cm → das neue Rechteck ist 6 cm × 4 cm groß ✓', 'Double the height too: 2 · 2 = 4 cm → the new rectangle is 6 cm × 4 cm ✓', 'Duplica también el alto: 2 · 2 = 4 cm → el nuevo rectángulo mide 6 × 4 cm ✓'),
                formula: '3×2 cm → 6×4 cm ✓',
                visual: { type: 'geometry', mode: 'scale', ow: 3, oh: 2, nw: 6, nh: 4, label: '2 : 1' },
              },
            ],
          },
          {
            label: L('Beispiel 2: Verkleinern 1 : 2', 'Example 2: Shrink 1 : 2', 'Ejemplo 2: Reducir 1 : 2'),
            goal: L('Steht die 1 vorne (1 : 2), wird die Figur verkleinert (geteilt durch 2)!', 'When 1 comes first (1 : 2), shrink both sides (divide by 2)!', 'Cuando el 1 va primero (1 : 2), reduce ambos lados (divide entre 2).'),
            beats: [
              {
                title: L('1. Plan : Wirklichkeit erkennen', '1. Spot Plan : Reality', '1. Distingue Plano : Realidad'),
                text: L('1 : 2 heißt: 1 cm im Plan entspricht 2 cm in Wirklichkeit — wir teilen also durch 2! Breite: 8 ÷ 2 = 4 cm.', '1 : 2 means 1 cm on the plan is 2 cm in reality — so divide by 2! Width: 8 ÷ 2 = 4 cm.', '1 : 2 significa dividir entre 2. Ancho: 8 ÷ 2 = 4 cm.'),
                formula: '8 cm ÷ 2 = 4 cm',
                visual: { type: 'geometry', mode: 'scale', ow: 8, oh: 6, nw: 4, nh: '?', label: '1 : 2' },
              },
              {
                title: L('2. Auch die Höhe halbieren!', '2. Halve the height too!', '2. ¡Divide el alto también!'),
                text: L('Höhe: 6 cm ÷ 2 = 3 cm → das verkleinerte Rechteck ist 4 cm × 3 cm groß ✓', 'Height: 6 cm ÷ 2 = 3 cm → the shrunk rectangle is 4 cm × 3 cm ✓', 'Alto: 6 ÷ 2 = 3 cm → rectángulo reducido: 4 × 3 cm ✓'),
                formula: '8×6 cm → 4×3 cm ✓',
                visual: { type: 'geometry', mode: 'scale', ow: 8, oh: 6, nw: 4, nh: 3, label: '1 : 2' },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · Bauplan & Würfelnetze', 'Level 3 · Cube Buildings & Cube Nets', 'Nivel 3 · Planos de cubos y redes'),
        examples: [
          {
            label: L('Beispiel 1: Versteckte Würfel im Bauplan', 'Example 1: Hidden cubes in a Bauplan', 'Ejemplo 1: Cubos ocultos en el plano'),
            goal: L('Ein 3er-Turm schwebt nicht in der Luft — unten drunter stehen versteckte Stützwürfel!', 'A 3-cube tower doesn\'t float — hidden cubes sit underneath it!', 'Una torre de 3 no flota: ¡hay cubos ocultos debajo!'),
            beats: [
              {
                title: L('1. Jede Zahl ist eine Turmhöhe', '1. Each number is a tower height', '1. Cada número es la altura de una torre'),
                text: L('Hinten links steht eine 3: das sind 3 Würfel übereinander (auch wenn man den untersten von vorne nicht sieht!).', 'Top-left shows 3: that\'s 3 cubes stacked up (even if the bottom ones are hidden from view!).', 'Arriba a la izquierda hay un 3: son 3 cubos apilados (aunque los de abajo no se vean).'),
                formula: 'Reihe 1: 3 + 2 + 1 = 6',
                visual: { type: 'geometry', mode: 'bauplan', heights: [[3,2,1],[1,2,0]] },
              },
              {
                title: L('2. Alle Bauplan-Zahlen addieren', '2. Add every number in the Bauplan', '2. Suma todos los números del plano'),
                text: L('Reihe 1 hat 3 + 2 + 1 = 6 Würfel. Reihe 2 hat 1 + 2 + 0 = 3 Würfel. Zusammen: 6 + 3 = 9 Würfel ✓', 'Row 1 has 3 + 2 + 1 = 6 cubes. Row 2 has 1 + 2 + 0 = 3 cubes. Total: 6 + 3 = 9 cubes ✓', 'Fila 1: 3+2+1=6. Fila 2: 1+2+0=3. Total: 6 + 3 = 9 cubos ✓'),
                formula: '3 + 2 + 1 + 1 + 2 = 9 Würfel ✓',
                visual: { type: 'geometry', mode: 'bauplan', heights: [[3,2,1],[1,2,0]] },
              },
            ],
          },
          {
            label: L('Beispiel 2: Würfelnetz im Kopf falten', 'Example 2: Fold a cube net mentally', 'Ejemplo 2: Doblar una red de cubo'),
            goal: L('Lege die gelbe Grundfläche B auf den Tisch und klappe alle Seitenwände 90° hoch!', 'Place the yellow base B flat and fold the side walls up 90°!', 'Deja fija la base amarilla B y dobla las paredes 90° hacia arriba.'),
            beats: [
              {
                title: L('1. Boden B festlegen & 4 Wände hochklappen', '1. Fix base B & fold up 4 walls', '1. Fija la base B y sube 4 paredes'),
                text: L('Stell dir vor, das gelbe Feld B bleibt auf dem Tisch liegen. Die 4 Felder rund um B klappen nach oben als Seitenwände!', 'Imagine yellow square B stays flat on the table. The 4 squares touching B fold up to form the 4 walls!', 'Imagina la base B quieta en la mesa. Los 4 cuadros que la rodean suben como paredes.'),
                formula: L('1 Boden + 4 Seitenwände', '1 base + 4 side walls', '1 base + 4 paredes'),
                visual: { type: 'geometry', mode: 'net', coords: [[0,1],[1,0],[1,1],[1,2],[2,1]] },
              },
              {
                title: L('2. Das 6. Feld schließt oben als Deckel!', '2. The 6th square closes the top lid!', '2. ¡El 6.º cuadro cierra la tapa!'),
                text: L('Das letzte Quadrat ganz rechts klappt oben drüber als Deckel — keine zwei Flächen überlappen sich ✓ (Ein 2×2-Block überlappt immer ✗)', 'The rightmost square folds over the top as the lid — zero overlaps ✓ (A 2×2 block always overlaps ✗)', 'El último cuadrado cierra arriba como tapa sin solaparse ✓ (Un bloque 2×2 siempre se solapa ✗)'),
                formula: L('1 Boden + 4 Wände + 1 Deckel = Würfel ✓', '1 base + 4 walls + 1 lid = cube ✓', '1 base + 4 paredes + 1 tapa = cubo ✓'),
                visual: { type: 'geometry', mode: 'net', coords: [[0,1],[1,0],[1,1],[1,2],[1,3],[2,1]] },
              },
            ],
          },
        ],
      },
    ],
  });

  // =========================================================================
  // 11. DIAGRAMM- & ÜBERSCHLAGS-LABOR (charts)
  // =========================================================================
  LabWalkthroughData.register('charts', {
    tiers: [
      {
        label: L('Stufe 1 · Säulendiagramme lesen', 'Level 1 · Reading Scaled Bar Charts', 'Nivel 1 · Leer gráficos de barras'),
        examples: [
          {
            label: L('Beispiel 1: Erst die Achse prüfen!', 'Example 1: Check the y-axis scale first!', 'Ejemplo 1: ¡Mira primero la escala del eje!'),
            goal: L('Schritt 1 bei jedem Diagramm: Wofür steht EIN Kästchen auf der linken Achse?', 'Step 1 on every chart: what is ONE grid step worth on the left axis?', 'Paso 1 en todo gráfico: ¿cuánto vale UN cuadro en el eje izquierdo?'),
            beats: [
              {
                title: L('1. Skalierung links ablesen', '1. Read the scale on the left', '1. Lee la escala a la izquierda'),
                text: L('Links steht 0 · 1 000 · 2 000 · 3 000 … Also steht 1 Kästchen für 1 000 (nicht für 1!).', 'The left axis reads 0 · 1 000 · 2 000 · 3 000 … So 1 grid box = 1 000 (not 1!).', 'A la izquierda pone 0 · 1 000 · 2 000… ¡Cada cuadro vale 1 000, no 1!'),
                formula: L('1 Kästchen = 1 000', '1 grid box = 1 000', '1 cuadro = 1 000'),
                visual: { type: 'charts', scale: 1000, units: [3, 5, 2, 6], hi: 1, trace: false },
              },
              {
                title: L('2. Waagerecht zur Achse fahren', '2. Trace horizontally to the axis', '2. Sigue la línea hasta el eje'),
                text: L('Die Säule „Di“ ist 5 Kästchen hoch → 5 · 1 000 = 5 000 ✓', 'The "Di" bar is 5 boxes tall → 5 · 1 000 = 5 000 ✓', 'La barra "Di" mide 5 cuadros → 5 · 1 000 = 5 000 ✓'),
                formula: '5 · 1 000 = 5 000 ✓',
                visual: { type: 'charts', scale: 1000, units: [3, 5, 2, 6], hi: 1, trace: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: Halbe Kästchen (4½ · 2 000)', 'Example 2: Halfway ticks (4½ · 2 000)', 'Ejemplo 2: Medios cuadros (4½ · 2 000)'),
            goal: L('Steht eine Säule genau zwischen zwei Linien, rechne ein halbes Kästchen dazu!', 'When a bar stops halfway between two lines, add half a scale step!', 'Si una barra queda a mitad, ¡suma medio paso de la escala!'),
            beats: [
              {
                title: L('1. Volle Kästchen zählen: 4 · 2 000 = 8 000', '1. Count full boxes: 4 · 2 000 = 8 000', '1. Cuenta cuadros enteros: 4 · 2 000 = 8 000'),
                text: L('1 Kästchen = 2 000. Bis zur 4. Linie sind es 8 000 — aber die Säule ragt noch ein Stück weiter hoch!', '1 box = 2 000. Up to line 4 is 8 000 — and the bar sticks out halfway into the next box!', '1 cuadro = 2 000. Hasta la línea 4 son 8 000, ¡y sobresale medio cuadro!'),
                formula: '4 · 2 000 = 8 000',
                visual: { type: 'charts', scale: 2000, units: [2, 4.5, 3, 5], hi: 1, trace: false },
              },
              {
                title: L('2. Halbes Kästchen dazu: +1 000!', '2. Add half a box: +1 000!', '2. Suma medio cuadro: ¡+1 000!'),
                text: L('Ein halbes Kästchen ist die Hälfte von 2 000, also 1 000! Zusammen: 8 000 + 1 000 = 9 000 ✓', 'Half a box is half of 2 000 = 1 000! Together: 8 000 + 1 000 = 9 000 ✓', 'Medio cuadro es 1 000. En total: 8 000 + 1 000 = 9 000 ✓'),
                formula: '8 000 + 1 000 = 9 000 ✓',
                visual: { type: 'charts', scale: 2000, units: [2, 4.5, 3, 5], hi: 1, trace: true },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 2 · Säulen bauen', 'Level 2 · Building Bars', 'Nivel 2 · Construir barras'),
        examples: [
          {
            label: L('Beispiel 1: 7 000 bei Skalierung 2 000', 'Example 1: 7 000 at scale 2 000', 'Ejemplo 1: 7 000 con escala 2 000'),
            goal: L('Teile den Zielwert durch den Wert eines Kästchens!', 'Divide the target value by the value of one grid step!', '¡Divide el objetivo entre el valor de un cuadro!'),
            beats: [
              {
                title: L('1. Erst volle Kästchen bauen: 3 · 2 000 = 6 000', '1. Build whole boxes first: 3 · 2 000 = 6 000', '1. Construye primero cuadros enteros: 6 000'),
                text: L('Mit 3 vollen Kästchen erreichen wir 6 000. Bis 7 000 fehlen noch genau 1 000!', '3 full boxes reach 6 000. We still need 1 000 more to hit 7 000!', '3 cuadros llegan a 6 000. ¡Aún faltan 1 000 para llegar a 7 000!'),
                formula: '3 · 2 000 = 6 000 (fehlen 1 000)',
                visual: { type: 'charts', scale: 2000, units: [3], singleBar: true, hi: 0, trace: false },
              },
              {
                title: L('2. Noch ½ Kästchen drauf → 3½!', '2. Add ½ a box on top → 3½!', '2. Añade ½ cuadro → ¡3½!'),
                text: L('1 000 ist genau die Hälfte von 2 000 — also bauen wir noch ½ Kästchen dazu → 3½ Kästchen hoch = 7 000 ✓', '1 000 is exactly half of 2 000 — add ½ a box on top → 3½ boxes tall = 7 000 ✓', '1 000 es la mitad de 2 000: sube ½ cuadro más → 3½ cuadros = 7 000 ✓'),
                formula: '3½ · 2 000 = 7 000 ✓',
                visual: { type: 'charts', scale: 2000, units: [3.5], singleBar: true, hi: 0, trace: true },
              },
            ],
          },
          {
            label: L('Beispiel 2: 30 000 bei Skalierung 5 000', 'Example 2: 30 000 at scale 5 000', 'Ejemplo 2: 30 000 con escala 5 000'),
            goal: L('Nutze die 5er-Reihe: 30 000 : 5 000 = 6 Kästchen!', 'Use the 5s table: 30 000 ÷ 5 000 = 6 boxes!', 'Usa la tabla del 5: 30 000 ÷ 5 000 = 6 cuadros.'),
            beats: [
              {
                title: L('1. Durch 5 000 teilen', '1. Divide by 5 000', '1. Divide entre 5 000'),
                text: L('Wie oft passt 5 000 in 30 000? Denk an 30 : 5 = 6! Wir brauchen genau 6 Kästchen.', 'How many times does 5 000 fit in 30 000? Think 30 ÷ 5 = 6! We need 6 boxes.', '¿Cuántas veces cabe 5 000 en 30 000? Piensa 30 ÷ 5 = 6 cuadros.'),
                formula: '30 000 : 5 000 = 6',
                visual: { type: 'charts', scale: 5000, units: [3], singleBar: true, hi: 0, trace: false },
              },
              {
                title: L('2. 6 Schritte hoch bis 30 000!', '2. Climb 6 steps up to 30 000!', '2. ¡Sube 6 pasos hasta 30 000!'),
                text: L('Zähle 6 Linien an der Achse hoch: 5 000, 10 000, 15 000, 20 000, 25 000, 30 000 ✓', 'Count 6 steps up: 5 000, 10 000, 15 000, 20 000, 25 000, 30 000 ✓', 'Cuenta 6 líneas hacia arriba hasta 30 000 ✓'),
                formula: '6 · 5 000 = 30 000 ✓',
                visual: { type: 'charts', scale: 5000, units: [6], singleBar: true, hi: 0, trace: true },
              },
            ],
          },
        ],
      },
      {
        label: L('Stufe 3 · Überschlag prüfen', 'Level 3 · Estimation Plausibility', 'Nivel 3 · Comprobar estimaciones'),
        examples: [
          {
            label: L('Beispiel 1: 39 840 + 21 150', 'Example 1: 39 840 + 21 150', 'Ejemplo 1: 39 840 + 21 150'),
            goal: L('Runde VOR dem Rechnen auf günstige Nachbarzahlen — so entlarvst du falsche Ergebnisse sofort!', 'Round to friendly neighbors BEFORE computing — fake answers stand out immediately!', '¡Redondea ANTES de calcular para detectar errores al instante!'),
            beats: [
              {
                title: L('1. Günstig runden: 40 000 + 20 000', '1. Round to friendly numbers: 40 000 + 20 000', '1. Redondea: 40 000 + 20 000'),
                text: L('39 840 liegt ganz nah bei 40 000 und 21 150 bei 20 000. Im Kopf sofort: 40 000 + 20 000 = 60 000!', '39 840 is right next to 40 000 and 21 150 near 20 000. In your head: 40 000 + 20 000 = 60 000!', '39 840 ≈ 40 000 y 21 150 ≈ 20 000. De cabeza: 60 000.'),
                formula: 'Überschlag = 60 000',
                visual: { type: 'charts', mode: 'est', expr: '39 840 + 21 150', est: '40 000 + 20 000 = 60 000', choices: ['60 990', '6 099', '40 990'] },
              },
              {
                title: L('2. Unmögliche Antworten streichen!', '2. Cross out impossible answers!', '2. ¡Descarta respuestas imposibles!'),
                text: L('6 099 ist 10-mal zu klein, 40 990 liegt 20 000 daneben — nur 60 990 passt zum Überschlag 60 000 ✓', '6 099 is 10× too small, 40 990 is 20 000 off — only 60 990 matches our 60 000 estimate ✓', '6 099 es 10 veces menor y 40 990 se queda muy corto: ¡solo 60 990 encaja!'),
                formula: '60 990 ≈ 60 000 ✓',
                visual: { type: 'charts', mode: 'est', expr: '39 840 + 21 150', est: '40 000 + 20 000 = 60 000', choices: ['60 990 ✓', '6 099 ✗', '40 990 ✗'] },
              },
            ],
          },
          {
            label: L('Beispiel 2: 498 · 19 (Richtung erkennen!)', 'Example 2: 498 · 19 (spot direction!)', 'Ejemplo 2: 498 · 19 (¡mira la dirección!)'),
            goal: L('Wenn beide Zahlen aufgerundet werden, ist das echte Ergebnis etwas KLEINER als der Überschlag!', 'When both numbers round UP, the exact answer is slightly SMALLER than the estimate!', 'Si ambos redondean ARRIBA, ¡el resultado exacto es un poco MENOR!'),
            beats: [
              {
                title: L('1. Beide Zahlen aufrunden: 500 · 20', '1. Round both numbers up: 500 · 20', '1. Redondea arriba: 500 · 20'),
                text: L('498 ≈ 500 und 19 ≈ 20. Im Kopf: 500 · 20 = 10 000!', '498 ≈ 500 and 19 ≈ 20. In your head: 500 · 20 = 10 000!', '498 ≈ 500 y 19 ≈ 20. De cabeza: 500 · 20 = 10 000.'),
                formula: 'Überschlag: 500 · 20 = 10 000',
                visual: { type: 'charts', mode: 'est', expr: '498 · 19', est: '500 · 20 = 10 000', choices: ['9 462', '94 620', '4 462'] },
              },
              {
                title: L('2. Etwas KLEINER als 10 000!', '2. Slightly SMALLER than 10 000!', '2. ¡Un poco MENOR que 10 000!'),
                text: L('Weil 498 < 500 und 19 < 20, liegt das echte Ergebnis knapp UNTER 10 000 → 9 462 ✓ (nie 94 620 oder 4 462!)', 'Because 498 < 500 and 19 < 20, the exact product is just UNDER 10 000 → 9 462 ✓', 'Como 498 < 500 y 19 < 20, el producto está justo debajo de 10 000 → 9 462 ✓'),
                formula: '498 · 19 < 10 000 → 9 462 ✓',
                visual: { type: 'charts', mode: 'est', expr: '498 · 19', est: '500 · 20 = 10 000', choices: ['9 462 ✓', '94 620 ✗', '4 462 ✗'] },
              },
            ],
          },
        ],
      },
    ],
  });
})();
