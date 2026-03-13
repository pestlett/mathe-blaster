// i18n.js — translations for EN / DE / ES

const I18n = (() => {
  const STRINGS = {
    en: {
      // Onboarding
      gameTitle:        'Multiplication',
      gameTitleAccent:  'Blaster!',
      yourName:         'Your Name',
      namePlaceholder:  'Enter your name',
      yourAge:          'Your Age',
      agePlaceholder:   'Age',
      chooseTheme:      'Choose Your Theme',
      themeSpace:       'Space',
      themeOcean:       'Ocean',
      themeSky:         'Sky',
      tables:           'Tables',
      tabRange:         'Range',
      tabSingle:        'One Table',
      rangeFrom:        'From',
      rangeTo:          'To',
      singleNote:       'Only questions from the {table}× table',
      mode:             'Mode',
      modeNormal:       'Normal',
      modePractice:     'Practice',
      modeNormalNote:   'Lose lives when objects hit the bottom',
      modePracticeNote: 'No lives — answer at your own pace',
      difficulty:       'Difficulty',
      diffEasy:         'Easy',
      diffMedium:       'Medium',
      diffHard:         'Hard',
      hintAfter:        'Hint after {n} wrong tries',
      hintNote:         'Shows a dot-grid picture when stuck',
      letsGo:           "Let's Go!",
      dailyNew:         '⚡ Daily Challenge — {table}× table · {diff}',
      dailyDone:        '⚡ Daily Challenge ✓ ({table}× · {diff})',
      parentDashboard:  '📊 Parent Dashboard',

      // Help section
      helpTitle:        '❓ How to Play',
      helpIntro:        'Multiplication problems fall from the sky. Answer them before they hit the ground!',
      helpTarget:       'Use ← → arrow keys (or swipe) to target a problem',
      helpType:         'Type the answer and press Enter or tap Fire!',
      helpLives:        'You have 3 lives — lose one each time a problem hits the bottom',
      helpStreak:       'Get answers right in a row for a combo streak and bonus points',
      helpFreeze:       'Catch the ❄️ Freeze item to slow everything for 5s',
      helpLifeUp:       'Catch the 💚 Life Up item to regain a life',
      helpBoss:         'Every 5 levels a Boss appears — defeat it for 50 bonus points',
      helpVoiceTitle:   '🎤 Voice commands',
      helpVoiceNumber:  'Say the number — e.g. "forty-eight" or "48"',
      helpVoiceFire:    'fire / yes / done — submit the answer',
      helpVoiceNext:    'next / forward — switch to the next problem',
      helpVoiceBack:    'back / previous — switch to the previous problem',
      helpVoiceClear:   'clear / delete — clear the answer box',

      // HUD
      levelLabel:        'Level ',
      hintWrongTries:    'wrong tries',

      // In-game
      answerPlaceholder: 'Answer...',
      lifeUpPlaceholder: 'Answer for +1 life!',
      freezePlaceholder: 'Answer to freeze!',
      bossPlaceholder:   'Defeat the boss!',
      fireBtnLabel:      'Fire!',
      hiPlayer:          'Hi {name}!',
      tablesRange:       '{min}–{max} tables',
      tablesFocus:       '{table}× table',
      practiceSuffix:    '· Practice',
      streakDisplay:     '{streak} streak! {mult}',
      tryAgain:          'Try again!',
      paused:            'Paused',
      resume:            'Resume',
      backToMenu:        'Back to Menu',
      levelUpBanner:     'Level {n}!',
      bossDefeated:      'Boss!',

      // Game over
      gameOver:          'Game Over!',
      goScore:           'Score: ',
      goLevel:           'Level reached: ',
      goAccuracy:        'Accuracy: ',
      goTheme:           'Theme: ',
      goMissed:          'Missed: ',
      goNoMissed:        'No missed questions!',
      newAchievements:   '🏆 New Achievements!',
      dailyComplete:     '⚡ Daily Challenge Complete!',
      playAgain:         'Play Again',
      leaderboard:       'Leaderboard',
      achievementsBtn:   'Achievements',

      // Leaderboard
      leaderboardTitle:  'Leaderboard',
      colDate:           'Date',
      colScore:          'Score',
      colLevel:          'Level',
      colAccuracy:       'Accuracy',
      colTheme:          'Theme',
      mostImproved:      'Most Improved! Great job this session!',

      // Achievements
      achievementsTitle: 'Achievements',
      back:              'Back',

      // Dashboard
      dashboardTitle:    'Parent Dashboard',
      dashProgress:      'Progress for {name}',
      dashSessions:      'Sessions',
      dashBestScore:     'Best Score',
      dashAvgAcc:        'Avg Accuracy',
      dashChartLabel:    'Accuracy per table (grey = not yet attempted)',
      dashNeedsPractice: 'Needs practice:',
      dashWeakBadge:     '{table}× table — {acc}%',
      dashAllGood:       'All attempted tables are ≥70% — great work!',
      dashNoData:        'No data yet — play some games first!',

      // Achievement labels & descriptions
      ach_first_correct:  ['First Blood',      'Get your first correct answer'],
      ach_streak_3:       ['On Fire',          'Hit a 3× streak'],
      ach_streak_5:       ['Unstoppable',      'Hit a 5× streak'],
      ach_streak_10:      ['Legendary',        'Hit a 10× streak'],
      ach_level_5:        ['Climber',          'Reach level 5'],
      ach_level_10:       ['High Flyer',       'Reach level 10'],
      ach_boss_slay:      ['Boss Slayer',      'Defeat your first boss round'],
      ach_accuracy_90:    ['Sharp Mind',       'Finish a game with ≥90% accuracy'],
      ach_score_500:      ['Half-Millennium',  'Score 500 points in one game'],
      ach_score_1000:     ['Thousand Club',    'Score 1000 points in one game'],
      ach_no_miss:        ['Flawless',         'Finish a game without missing a question'],
      ach_sessions_5:     ['Regular',          'Play 5 sessions'],
    },

    de: {
      gameTitle:        'Einmaleins',
      gameTitleAccent:  'Blaster!',
      yourName:         'Dein Name',
      namePlaceholder:  'Name eingeben',
      yourAge:          'Dein Alter',
      agePlaceholder:   'Alter',
      chooseTheme:      'Wähle dein Thema',
      themeSpace:       'Weltraum',
      themeOcean:       'Ozean',
      themeSky:         'Himmel',
      tables:           'Tabellen',
      tabRange:         'Bereich',
      tabSingle:        'Eine Tabelle',
      rangeFrom:        'Von',
      rangeTo:          'Bis',
      singleNote:       'Nur Aufgaben aus der {table}×-Tabelle',
      mode:             'Modus',
      modeNormal:       'Normal',
      modePractice:     'Übung',
      modeNormalNote:   'Leben verlieren wenn Objekte unten ankommen',
      modePracticeNote: 'Keine Leben — antworte in deinem Tempo',
      difficulty:       'Schwierigkeit',
      diffEasy:         'Leicht',
      diffMedium:       'Mittel',
      diffHard:         'Schwer',
      hintAfter:        'Hinweis nach {n} Fehlern',
      hintNote:         'Zeigt ein Punktraster wenn du feststeckst',
      letsGo:           "Los geht's!",
      dailyNew:         '⚡ Tages-Challenge — {table}×-Tabelle · {diff}',
      dailyDone:        '⚡ Tages-Challenge ✓ ({table}× · {diff})',
      parentDashboard:  '📊 Eltern-Dashboard',

      // Help section
      helpTitle:        '❓ Wie spielt man',
      helpIntro:        'Rechenaufgaben fallen vom Himmel. Beantworte sie, bevor sie den Boden berühren!',
      helpTarget:       'Mit ← → Pfeiltasten eine Aufgabe anvisieren',
      helpType:         'Antwort eintippen und Enter drücken oder Schießen! tippen',
      helpLives:        'Du hast 3 Leben — eines geht verloren, wenn eine Aufgabe unten ankommt',
      helpStreak:       'Mehrere richtige Antworten hintereinander ergeben einen Combo-Bonus',
      helpFreeze:       'Das ❄️ Einfrieren-Item verlangsamt alles für 5 Sekunden',
      helpLifeUp:       'Das 💚 Leben-Item gibt ein Leben zurück',
      helpBoss:         'Alle 5 Level erscheint ein Boss — besiege ihn für 50 Bonuspunkte',
      helpVoiceTitle:   '🎤 Sprachbefehle',
      helpVoiceNumber:  'Zahl sagen — z.B. "achtundvierzig" oder "48"',
      helpVoiceFire:    'feuer / fertig / ja — Antwort absenden',
      helpVoiceNext:    'weiter / vor — zur nächsten Aufgabe',
      helpVoiceBack:    'zurück — zur vorherigen Aufgabe',
      helpVoiceClear:   'löschen — Eingabefeld leeren',

      // HUD
      levelLabel:        'Level ',
      hintWrongTries:    'falsche Versuche',

      answerPlaceholder: 'Antwort...',
      lifeUpPlaceholder: 'Antwort für +1 Leben!',
      freezePlaceholder: 'Antwort zum Einfrieren!',
      bossPlaceholder:   'Besiege den Boss!',
      fireBtnLabel:      'Schießen!',
      hiPlayer:          'Hallo {name}!',
      tablesRange:       '{min}–{max} Tabellen',
      tablesFocus:       '{table}×-Tabelle',
      practiceSuffix:    '· Übung',
      streakDisplay:     '{streak} Serie! {mult}',
      tryAgain:          'Nochmal!',
      paused:            'Pause',
      resume:            'Weiter',
      backToMenu:        'Zum Menü',
      levelUpBanner:     'Level {n}!',
      bossDefeated:      'Boss!',

      gameOver:          'Spiel vorbei!',
      goScore:           'Punkte: ',
      goLevel:           'Level erreicht: ',
      goAccuracy:        'Genauigkeit: ',
      goTheme:           'Thema: ',
      goMissed:          'Verpasst: ',
      goNoMissed:        'Keine verpassten Aufgaben!',
      newAchievements:   '🏆 Neue Erfolge!',
      dailyComplete:     '⚡ Tages-Challenge abgeschlossen!',
      playAgain:         'Nochmal spielen',
      leaderboard:       'Bestenliste',
      achievementsBtn:   'Erfolge',

      leaderboardTitle:  'Bestenliste',
      colDate:           'Datum',
      colScore:          'Punkte',
      colLevel:          'Level',
      colAccuracy:       'Genauigkeit',
      colTheme:          'Thema',
      mostImproved:      'Beste Verbesserung! Toll gemacht!',

      achievementsTitle: 'Erfolge',
      back:              'Zurück',

      dashboardTitle:    'Eltern-Dashboard',
      dashProgress:      'Fortschritt für {name}',
      dashSessions:      'Runden',
      dashBestScore:     'Bestes Ergebnis',
      dashAvgAcc:        'Ø Genauigkeit',
      dashChartLabel:    'Genauigkeit pro Tabelle (grau = noch nicht versucht)',
      dashNeedsPractice: 'Braucht Übung:',
      dashWeakBadge:     '{table}×-Tabelle — {acc}%',
      dashAllGood:       'Alle versuchten Tabellen ≥70% — super gemacht!',
      dashNoData:        'Noch keine Daten — spiel erst ein paar Runden!',

      ach_first_correct:  ['Erste Antwort',     'Beantworte deine erste Aufgabe richtig'],
      ach_streak_3:       ['Auf Feuer',          '3× Treffer in Folge'],
      ach_streak_5:       ['Unaufhaltbar',       '5× Treffer in Folge'],
      ach_streak_10:      ['Legendär',           '10× Treffer in Folge'],
      ach_level_5:        ['Aufsteiger',         'Erreiche Level 5'],
      ach_level_10:       ['Hochflieger',        'Erreiche Level 10'],
      ach_boss_slay:      ['Boss-Besieger',      'Besiege deinen ersten Boss'],
      ach_accuracy_90:    ['Scharfer Verstand',  'Spiel mit ≥90% Genauigkeit'],
      ach_score_500:      ['Halbes Jahrtausend', '500 Punkte in einem Spiel'],
      ach_score_1000:     ['Tausend-Club',       '1000 Punkte in einem Spiel'],
      ach_no_miss:        ['Makellos',           'Kein Objekt am Boden ankommen lassen'],
      ach_sessions_5:     ['Stammgast',          '5 Runden spielen'],
    },

    es: {
      gameTitle:        'Multiplicación',
      gameTitleAccent:  'Blaster!',
      yourName:         'Tu Nombre',
      namePlaceholder:  'Escribe tu nombre',
      yourAge:          'Tu Edad',
      agePlaceholder:   'Edad',
      chooseTheme:      'Elige tu Tema',
      themeSpace:       'Espacio',
      themeOcean:       'Océano',
      themeSky:         'Cielo',
      tables:           'Tablas',
      tabRange:         'Rango',
      tabSingle:        'Una Tabla',
      rangeFrom:        'Desde',
      rangeTo:          'Hasta',
      singleNote:       'Solo preguntas de la tabla del {table}×',
      mode:             'Modo',
      modeNormal:       'Normal',
      modePractice:     'Práctica',
      modeNormalNote:   'Pierdes vidas cuando los objetos llegan abajo',
      modePracticeNote: 'Sin vidas — responde a tu ritmo',
      difficulty:       'Dificultad',
      diffEasy:         'Fácil',
      diffMedium:       'Medio',
      diffHard:         'Difícil',
      hintAfter:        'Pista tras {n} errores',
      hintNote:         'Muestra un cuadro de puntos si te atascas',
      letsGo:           '¡Vamos!',
      dailyNew:         '⚡ Desafío Diario — tabla del {table}× · {diff}',
      dailyDone:        '⚡ Desafío Diario ✓ ({table}× · {diff})',
      parentDashboard:  '📊 Panel de Padres',

      // Help section
      helpTitle:        '❓ Cómo jugar',
      helpIntro:        '¡Los problemas de multiplicación caen del cielo. ¡Respóndelos antes de que toquen el suelo!',
      helpTarget:       'Usa las teclas ← → para apuntar a un problema',
      helpType:         'Escribe la respuesta y pulsa Enter o toca ¡Disparar!',
      helpLives:        'Tienes 3 vidas — pierdes una cada vez que un problema llega al suelo',
      helpStreak:       'Respuestas seguidas correctas dan un combo con puntos extra',
      helpFreeze:       'El objeto ❄️ Congelar ralentiza todo durante 5s',
      helpLifeUp:       'El objeto 💚 Vida Extra te devuelve una vida',
      helpBoss:         'Cada 5 niveles aparece un Jefe — derrótalo y gana 50 puntos extra',
      helpVoiceTitle:   '🎤 Comandos de voz',
      helpVoiceNumber:  'Di el número — p.ej. "cuarenta y ocho" o "48"',
      helpVoiceFire:    'fuego / listo / sí — enviar la respuesta',
      helpVoiceNext:    'siguiente / adelante — pasar al siguiente problema',
      helpVoiceBack:    'atrás / anterior — volver al problema anterior',
      helpVoiceClear:   'borrar / limpiar — vaciar el cuadro de respuesta',

      // HUD
      levelLabel:        'Nivel ',
      hintWrongTries:    'intentos fallidos',

      answerPlaceholder: 'Respuesta...',
      lifeUpPlaceholder: '¡Responde por +1 vida!',
      freezePlaceholder: '¡Responde para congelar!',
      bossPlaceholder:   '¡Derrota al jefe!',
      fireBtnLabel:      '¡Disparar!',
      hiPlayer:          '¡Hola {name}!',
      tablesRange:       'tablas {min}–{max}',
      tablesFocus:       'tabla del {table}×',
      practiceSuffix:    '· Práctica',
      streakDisplay:     '¡{streak} seguidos! {mult}',
      tryAgain:          '¡Inténtalo de nuevo!',
      paused:            'Pausado',
      resume:            'Continuar',
      backToMenu:        'Volver al Menú',
      levelUpBanner:     '¡Nivel {n}!',
      bossDefeated:      '¡Jefe!',

      gameOver:          '¡Fin del juego!',
      goScore:           'Puntos: ',
      goLevel:           'Nivel alcanzado: ',
      goAccuracy:        'Precisión: ',
      goTheme:           'Tema: ',
      goMissed:          'Falladas: ',
      goNoMissed:        '¡Sin preguntas falladas!',
      newAchievements:   '🏆 ¡Nuevos Logros!',
      dailyComplete:     '⚡ ¡Desafío Diario Completado!',
      playAgain:         'Jugar de nuevo',
      leaderboard:       'Clasificación',
      achievementsBtn:   'Logros',

      leaderboardTitle:  'Clasificación',
      colDate:           'Fecha',
      colScore:          'Puntos',
      colLevel:          'Nivel',
      colAccuracy:       'Precisión',
      colTheme:          'Tema',
      mostImproved:      '¡Más mejorado! ¡Buen trabajo esta sesión!',

      achievementsTitle: 'Logros',
      back:              'Volver',

      dashboardTitle:    'Panel de Padres',
      dashProgress:      'Progreso de {name}',
      dashSessions:      'Sesiones',
      dashBestScore:     'Mejor Puntuación',
      dashAvgAcc:        'Precisión Media',
      dashChartLabel:    'Precisión por tabla (gris = no intentada)',
      dashNeedsPractice: 'Necesita práctica:',
      dashWeakBadge:     'tabla del {table}× — {acc}%',
      dashAllGood:       '¡Todas las tablas ≥70% — excelente trabajo!',
      dashNoData:        '¡Sin datos aún — juega algunas partidas primero!',

      ach_first_correct:  ['Primera Respuesta',  'Consigue tu primera respuesta correcta'],
      ach_streak_3:       ['En Llamas',          'Consigue una racha de 3×'],
      ach_streak_5:       ['Imparable',          'Consigue una racha de 5×'],
      ach_streak_10:      ['Legendario',         'Consigue una racha de 10×'],
      ach_level_5:        ['Escalador',          'Llega al nivel 5'],
      ach_level_10:       ['Volador Alto',       'Llega al nivel 10'],
      ach_boss_slay:      ['Cazajefes',          'Derrota tu primera ronda de jefe'],
      ach_accuracy_90:    ['Mente Aguda',        'Termina con ≥90% de precisión'],
      ach_score_500:      ['Medio Milenio',      'Consigue 500 puntos en una partida'],
      ach_score_1000:     ['Club del Millar',    'Consigue 1000 puntos en una partida'],
      ach_no_miss:        ['Impecable',          'Termina sin dejar caer ninguna pregunta'],
      ach_sessions_5:     ['Habitual',           'Juega 5 sesiones'],
    },
  };

  // Difficulty key → translated label
  const DIFF_KEYS = { easy: 'diffEasy', medium: 'diffMedium', hard: 'diffHard' };

  let lang = localStorage.getItem('multiblaster_lang') || 'en';

  function setLang(l) {
    if (!STRINGS[l]) return;
    lang = l;
    localStorage.setItem('multiblaster_lang', l);
    applyToDOM();
  }

  function getLang() { return lang; }

  // Translate a key with optional variable interpolation: t('hiPlayer', { name: 'Emma' })
  function t(key, vars = {}) {
    const str = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
    if (typeof str !== 'string') return key;
    return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
  }

  // Get achievement label + description for an achievement id
  function achText(id) {
    const key = `ach_${id}`;
    const pair = STRINGS[lang]?.[key] ?? STRINGS.en[key];
    return pair ? { label: pair[0], desc: pair[1] } : { label: id, desc: '' };
  }

  // Translate difficulty key to label
  function diffLabel(key) {
    return t(DIFF_KEYS[key] || key);
  }

  // Apply translations to all [data-i18n] elements in the DOM
  function applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'number')) {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    // Update language button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  return { t, achText, diffLabel, setLang, getLang, applyToDOM };
})();
