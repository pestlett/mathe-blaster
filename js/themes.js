// themes.js - per-theme canvas renderers

const Themes = (() => {
  // ---- Shared star field (reused) ----
  let stars = null;
  function initStars(w, h) {
    stars = [];
    const layers = [{ count: 120, r: 1, speed: 8 }, { count: 60, r: 1.5, speed: 18 }, { count: 30, r: 2.5, speed: 32 }];
    for (const l of layers) {
      for (let i = 0; i < l.count; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: l.r, speed: l.speed, alpha: 0.5 + Math.random() * 0.5 });
      }
    }
  }

  // ---- Ocean fish ----
  let fish = null;
  function initFish(w, h) {
    fish = [];
    for (let i = 0; i < 5; i++) {
      fish.push({ x: Math.random() * w, y: 80 + Math.random() * (h - 200), speed: 20 + Math.random() * 30, size: 12 + Math.random() * 20, dir: Math.random() > 0.5 ? 1 : -1 });
    }
  }

  // ---- Sky clouds ----
  let clouds = null;
  function initClouds(w, h) {
    clouds = [];
    for (let i = 0; i < 7; i++) {
      clouds.push({ x: Math.random() * w, y: 40 + Math.random() * (h * 0.45), speed: 10 + Math.random() * 15, w: 80 + Math.random() * 80, h: 30 + Math.random() * 25 });
    }
  }

  function init(theme, w, h) {
    if (theme === 'space') initStars(w, h);
    if (theme === 'ocean') initFish(w, h);
    if (theme === 'sky') initClouds(w, h);
  }

  // ========================
  //  BACKGROUND RENDERERS
  // ========================

  function drawSpaceBackground(ctx, w, h, t) {
    // Nebula gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#06020f');
    grad.addColorStop(0.5, '#120430');
    grad.addColorStop(1, '#0a0220');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Distant nebula blob
    const ng = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, w * 0.4);
    ng.addColorStop(0, 'rgba(80,0,120,0.18)');
    ng.addColorStop(1, 'rgba(80,0,120,0)');
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, w, h);

    if (!stars) initStars(w, h);
    // Update + draw stars (parallax via t)
    for (const s of stars) {
      const ty = (s.y + s.speed * t * 0.001) % h;
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, ty, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawOceanBackground(ctx, w, h, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#001233');
    grad.addColorStop(0.6, '#023e8a');
    grad.addColorStop(1, '#c19a6b'); // sandy bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Caustic ripple patterns
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 6; i++) {
      const cx = (w * 0.15 * i + t * 8) % w;
      const cy = (h * 0.1 * i + t * 4) % (h * 0.8);
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + 20 * Math.sin(t * 0.5 + i));
      rg.addColorStop(0, '#90e0ef');
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    // Fish
    if (!fish) initFish(w, h);
    for (const f of fish) {
      f.x += f.speed * f.dir * 0.016;
      if (f.x > w + 40) f.x = -40;
      if (f.x < -40) f.x = w + 40;
      drawFish(ctx, f.x, f.y, f.size, f.dir);
    }
  }

  function drawFish(ctx, x, y, size, dir) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#48cae4';
    ctx.translate(x, y);
    if (dir < 0) ctx.scale(-1, 1);
    // body
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // tail
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(-size - size * 0.7, -size * 0.5);
    ctx.lineTo(-size - size * 0.7, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSkyBackground(ctx, w, h, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#339af0');
    grad.addColorStop(0.7, '#a9d8ff');
    grad.addColorStop(1, '#74c69d'); // grass
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Sun
    ctx.save();
    ctx.globalAlpha = 0.9;
    const sg = ctx.createRadialGradient(w - 80, 60, 0, w - 80, 60, 50);
    sg.addColorStop(0, '#ffe066');
    sg.addColorStop(0.7, '#ffd43b');
    sg.addColorStop(1, 'rgba(255,212,59,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(w - 80, 60, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Clouds
    if (!clouds) initClouds(w, h);
    for (const c of clouds) {
      c.x += c.speed * 0.016;
      if (c.x > w + c.w) c.x = -c.w;
      drawCloud(ctx, c.x, c.y, c.w, c.h);
    }
  }

  function drawCloud(ctx, x, y, cw, ch) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y, cw * 0.5, ch * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(x - cw * 0.25, y + ch * 0.1, cw * 0.35, ch * 0.35, 0, 0, Math.PI * 2);
    ctx.ellipse(x + cw * 0.25, y + ch * 0.1, cw * 0.35, ch * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ========================
  //  OBJECT RENDERERS
  // ========================

  function drawObject(ctx, obj, theme) {
    if (obj.destroyed) {
      drawParticles(ctx, obj.particles);
      if (obj.destroyTimer < 0.5) {
        ctx.save();
        ctx.globalAlpha = 1 - obj.destroyTimer * 2;
        if (obj.isLifeUp) drawLifeUp(ctx, obj, false);
        else if (obj.isFreeze) drawFreezeItem(ctx, obj, false);
        else if (obj.isBoss) drawBossObject(ctx, obj, theme, false);
        else drawThemeObject(ctx, obj, theme, false);
        ctx.restore();
      }
      return;
    }
    if (obj.dying) {
      if (obj.isLifeUp || obj.isFreeze) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - obj.dieTimer / 1.2);
        if (obj.isLifeUp) drawLifeUp(ctx, obj, false);
        else drawFreezeItem(ctx, obj, false);
        ctx.restore();
      } else {
        drawDyingObject(ctx, obj, theme);
      }
      return;
    }
    if (obj.isLifeUp) drawLifeUp(ctx, obj, true);
    else if (obj.isFreeze) drawFreezeItem(ctx, obj, true);
    else if (obj.isBoss) drawBossObject(ctx, obj, theme, true);
    else drawThemeObject(ctx, obj, theme, true);
  }

  function drawThemeObject(ctx, obj, theme, showQuestion) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const targeted = obj.isTargeted;

    if (theme === 'space') drawMeteor(ctx, x, y, obj, targeted, showQuestion);
    else if (theme === 'ocean') drawBubble(ctx, x, y, obj, targeted, showQuestion);
    else if (theme === 'sky') drawBalloon(ctx, x, y, obj, targeted, showQuestion);

    if (obj.hintActive) drawHintGrid(ctx, obj);
    if (obj._answerRevealed) drawAnswerReveal(ctx, obj);
  }

  // Draws a glowing answer badge on the object (used by SOS help)
  function drawAnswerReveal(ctx, obj) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y + 32;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#f7c948';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(30,20,0,0.82)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 22, y - 14, 44, 26, 8) : ctx.rect(x - 22, y - 14, 44, 26);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f7c948';
    ctx.font = 'bold 17px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('= ' + obj.answer, x, y);
    ctx.restore();
  }

  // Draws a dot grid hint (a×b visual) below the object
  function drawHintGrid(ctx, obj) {
    const parts = (obj.key || '').split('x');
    if (parts.length !== 2) return;
    const rows = parseInt(parts[0]);
    const cols = parseInt(parts[1]);
    if (!rows || !cols || rows > 12 || cols > 12) return;

    const maxW = 78, maxH = 78;
    const gap = Math.min(maxW / cols, maxH / rows, 10);
    const dotR = Math.max(1.5, gap * 0.32);
    const gridW = cols * gap;
    const gridH = rows * gap;
    const bx = obj.x + obj.wobbleX - gridW / 2 + gap / 2;
    const by = obj.y + 50;

    ctx.save();
    ctx.shadowColor = '#f7c948';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#f7c948';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.arc(bx + c * gap, by + r * gap, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawMeteor(ctx, x, y, obj, targeted, showQuestion) {
    // Fire trail
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const alpha = (1 - i / 8) * 0.6;
      const r = 22 - i * 2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = i < 4 ? '#ff6b35' : '#ffca3a';
      ctx.beginPath();
      ctx.ellipse(x, y - i * 10, r * 0.6, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Rock body
    ctx.save();
    if (targeted) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 40;
    }
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    // Texture bumps
    ctx.fillStyle = '#6b3410';
    [[x - 10, y - 8, 7], [x + 10, y + 5, 5], [x - 5, y + 10, 4]].forEach(([bx, by, br]) => {
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    });
    // Targeted glow rings (double ring, bright cyan)
    if (targeted) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 30;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.4;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(x, y, 44, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#fff', 15);
  }

  function drawBubble(ctx, x, y, obj, targeted, showQuestion) {
    ctx.save();
    if (targeted) { ctx.shadowColor = '#ffe566'; ctx.shadowBlur = 40; }
    // Bubble body
    const grad = ctx.createRadialGradient(x - 10, y - 10, 2, x, y, 34);
    grad.addColorStop(0, 'rgba(180,220,255,0.7)');
    grad.addColorStop(0.7, 'rgba(0,150,200,0.35)');
    grad.addColorStop(1, 'rgba(0,100,180,0.5)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    // Shimmer highlight
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - 10, y - 12, 10, 6, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Outline
    if (targeted) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
      ctx.shadowColor = '#ffe566';
      ctx.shadowBlur = 30;
      ctx.strokeStyle = '#ffe566';
      ctx.lineWidth = 4;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(x, y, 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.35;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(x, y, 43, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(0,180,220,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#e0f4ff', 15);
  }

  function drawBalloon(ctx, x, y, obj, targeted, showQuestion) {
    // Colour per object (deterministic from answer)
    const COLOURS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#f77f00', '#c77dff'];
    const col = COLOURS[obj.answer % COLOURS.length];

    ctx.save();
    if (targeted) { ctx.shadowColor = col; ctx.shadowBlur = 20; }

    // String
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 34);
    ctx.quadraticCurveTo(x + 8, y + 60, x, y + 70);
    ctx.stroke();

    // Balloon body
    const grad = ctx.createRadialGradient(x - 12, y - 12, 2, x, y, 34);
    grad.addColorStop(0, lighten(col, 60));
    grad.addColorStop(0.6, col);
    grad.addColorStop(1, darken(col, 30));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - 9, y - 10, 9, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Knot
    ctx.fillStyle = darken(col, 40);
    ctx.beginPath();
    ctx.arc(x, y + 34, 4, 0, Math.PI * 2);
    ctx.fill();

    if (targeted) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.ellipse(x, y, 40, 45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.35;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.ellipse(x, y, 46, 51, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (showQuestion) drawQuestionText(ctx, x, y - 2, obj.question, '#fff', 14);
  }

  function drawDyingObject(ctx, obj, theme) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const alpha = Math.max(0, 1 - obj.dieTimer / 1.8);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (theme === 'space') {
      // Crater cracks
      ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40); ctx.stroke();
      }
    } else if (theme === 'ocean') {
      // Sinking bubble - smaller as it dies
      const r = 34 * (1 - obj.dieTimer * 0.3);
      ctx.fillStyle = 'rgba(0,150,200,0.3)';
      ctx.beginPath(); ctx.arc(x, y, Math.max(4, r), 0, Math.PI * 2); ctx.fill();
    } else {
      // Deflating balloon
      const scaleY = Math.max(0.1, 1 - obj.dieTimer * 0.5);
      ctx.save(); ctx.translate(x, y); ctx.scale(1, scaleY);
      const COLOURS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#f77f00', '#c77dff'];
      ctx.fillStyle = COLOURS[obj.answer % COLOURS.length];
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Fact flash: show full equation in large readable text
    ctx.globalAlpha = alpha;
    const factText = `${obj.question} = ${obj.answer}`;
    ctx.font = 'bold 22px Segoe UI, sans-serif';
    const tw = ctx.measureText(factText).width;
    // Dark background for readability
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - 10, y - 16, tw + 20, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#ff4757';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(factText, x, y);

    ctx.restore();
  }

  function drawParticles(ctx, particles) {
    for (const p of particles) {
      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawQuestionText(ctx, x, y, text, color, size) {
    ctx.save();
    ctx.font = `bold ${size}px Segoe UI, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // ========================
  //  LIFE-UP ITEM
  // ========================

  function drawLifeUp(ctx, obj, showLabel) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.005);
    const targeted = obj.isTargeted;

    ctx.save();

    // Outer glow ring
    ctx.shadowColor = '#2ed573';
    ctx.shadowBlur = targeted ? 50 : 28;
    const ringR = 36 + (targeted ? 6 * pulse : 0);
    ctx.strokeStyle = targeted ? '#ffffff' : '#2ed573';
    ctx.lineWidth = targeted ? 4 : 2.5;
    ctx.globalAlpha = targeted ? (0.55 + 0.45 * pulse) : 0.7;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    if (targeted) {
      ctx.globalAlpha = 0.2 * pulse;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(x, y, ringR + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Filled circle background
    ctx.globalAlpha = 0.88;
    ctx.shadowBlur = 20;
    const bg = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, 30);
    bg.addColorStop(0, '#a8ffb0');
    bg.addColorStop(0.6, '#2ed573');
    bg.addColorStop(1, '#0aab44');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Heart icon (top of the circle)
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❤', x, y - 16);

    if (showLabel) {
      // Show the question
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 5;
      ctx.fillText(obj.question, x, y + 2);
      // "+1 life" badge below
      ctx.fillStyle = targeted ? '#fff' : '#b8ffcc';
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.shadowBlur = 3;
      ctx.fillText('+1 life', x, y + 20);
    }

    ctx.restore();
  }

  // ========================
  //  BOSS OBJECT
  // ========================

  function drawBossObject(ctx, obj, theme, showQuestion) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const t = Date.now() * 0.001;
    const scale = obj.scale ?? 1.0;
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    const r = Math.max(28, 64 * scale); // body radius scales with boss health

    // Theme-coloured body
    const colours = { space: ['#8b0000', '#ff4500'], ocean: ['#002266', '#0066ff'], sky: ['#4b0082', '#9932cc'] };
    const [dark, bright] = colours[theme] || colours.space;

    ctx.save();
    ctx.shadowColor = bright;
    ctx.shadowBlur = (30 + 15 * pulse) * scale;

    // Pulsing outer ring
    ctx.strokeStyle = bright;
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.5 + 0.3 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.12 + 6 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.globalAlpha = 1;
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.08, x, y, r);
    grad.addColorStop(0, bright);
    grad.addColorStop(0.5, dark);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // "BOSS" label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0';
    ctx.font = `bold ${Math.max(8, Math.round(12 * scale))}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS', x, y - r * 0.45);

    // Progress dots (one dot per question; filled = answered, hollow = remaining)
    if ((obj.questionsTotal ?? 1) > 1) {
      const dotR = Math.max(3, 5 * scale);
      const spacing = dotR * 3;
      const total = obj.questionsTotal;
      const done  = obj.questionIndex;
      const startX = x - ((total - 1) * spacing) / 2;
      for (let i = 0; i < total; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * spacing, y + r * 0.55, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i < done ? '#ff0' : 'rgba(255,255,255,0.3)';
        ctx.fill();
      }
    }

    ctx.restore();

    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#ffffff', Math.max(14, Math.round(22 * scale)));
  }

  // ========================
  //  FREEZE ITEM
  // ========================

  function drawFreezeItem(ctx, obj, showLabel) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.006);
    const targeted = obj.isTargeted;

    ctx.save();
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = targeted ? 55 : 30;

    // Outer ring
    const ringR = 36 + (targeted ? 6 * pulse : 0);
    ctx.strokeStyle = targeted ? '#ffffff' : '#00d4ff';
    ctx.lineWidth = targeted ? 4 : 2.5;
    ctx.globalAlpha = targeted ? (0.55 + 0.45 * pulse) : 0.7;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.globalAlpha = 0.88;
    const bg = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, 30);
    bg.addColorStop(0, '#a8f0ff');
    bg.addColorStop(0.6, '#00d4ff');
    bg.addColorStop(1, '#0077aa');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Snowflake ❄
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄', x, y - 15);

    if (showLabel) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 5;
      ctx.fillText(obj.question, x, y + 2);
      ctx.fillStyle = targeted ? '#fff' : '#b0eeff';
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.fillText('freeze 5s', x, y + 20);
    }

    ctx.restore();
  }

  // Blue tint overlay drawn when freeze is active
  function drawFreezeOverlay(ctx, w, h, secondsLeft) {
    const alpha = Math.min(0.18, secondsLeft * 0.04);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(0, 0, w, h);
    // Ice crystal border effect
    ctx.globalAlpha = Math.min(0.6, secondsLeft * 0.12);
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.restore();
  }

  // ========================
  //  WEAPON RENDERERS
  // ========================

  function drawWeapon(ctx, w, h, theme, targetX, targetY) {
    if (theme === 'space') drawCannon(ctx, w, h, targetX, targetY);
    else if (theme === 'ocean') drawSubmarine(ctx, w, h, targetX, targetY);
    else if (theme === 'sky') drawSlingshot(ctx, w, h, targetX, targetY);
  }

  function drawCannon(ctx, w, h, tx, ty) {
    const bx = w / 2, by = h - 158;
    const angle = Math.atan2(ty - by, tx - bx);
    ctx.save();
    // Base
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.ellipse(bx, by, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Barrel
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.fillStyle = '#888';
    ctx.fillRect(0, -8, 55, 16);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(45, -9, 16, 18);
    ctx.restore();

    // Laser beam — bright glowing line to target
    ctx.save();
    // Outer glow
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // Core line
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
  }

  function drawSubmarine(ctx, w, h, tx, ty) {
    const bx = w / 2, by = h - 155;
    const angle = Math.atan2(ty - by, tx - bx);
    ctx.save();
    // Sub body
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath();
    ctx.ellipse(bx, by, 55, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4a261';
    ctx.fillRect(bx - 55, by - 8, 110, 8);
    // Conning tower
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(bx - 12, by - 36, 24, 28);
    // Periscope rotation
    ctx.translate(bx, by - 36);
    ctx.rotate(angle - Math.PI / 2);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -28); ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(0, -28, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Sonar rings
    ctx.save();
    const elapsed = Date.now() * 0.001;
    for (let i = 0; i < 3; i++) {
      const phase = (elapsed * 0.8 + i * 0.33) % 1;
      ctx.globalAlpha = (1 - phase) * 0.3;
      ctx.strokeStyle = '#90e0ef';
      ctx.lineWidth = 2;
      const dist = Math.hypot(tx - bx, ty - (by - 36));
      ctx.beginPath();
      ctx.arc(bx, by - 36, dist * phase, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Laser beam to target
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#ffe566';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#ffe566';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(bx, by - 36);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(bx, by - 36);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.restore();
  }

  function drawSlingshot(ctx, w, h, tx, ty) {
    const bx = w / 2, by = h - 148;
    ctx.save();
    // Fork
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 20, by - 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 20, by - 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + 20); ctx.stroke();
    // Elastic
    ctx.strokeStyle = '#c0a060';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 20, by - 50);
    ctx.lineTo(bx, by - 10);
    ctx.lineTo(bx + 20, by - 50);
    ctx.stroke();

    // Dotted arc trajectory (decorative)
    ctx.strokeStyle = '#ffd93d';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([6, 8]);
    const midX = (bx + tx) / 2;
    const midY = Math.min(by - 10, ty) - Math.abs(tx - bx) * 0.4;
    ctx.beginPath();
    ctx.moveTo(bx, by - 10);
    ctx.quadraticCurveTo(midX, midY, tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    // Laser beam — straight bright line to target
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#f7c948';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#f7c948';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(bx, by - 10);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(bx, by - 10);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.restore();
  }

  // ========================
  //  BACKGROUND DISPATCH
  // ========================

  function drawBackground(ctx, w, h, theme, t) {
    if (theme === 'space') drawSpaceBackground(ctx, w, h, t);
    else if (theme === 'ocean') drawOceanBackground(ctx, w, h, t);
    else if (theme === 'sky') drawSkyBackground(ctx, w, h, t);
  }

  // ========================
  //  HELPERS
  // ========================

  function particleColorForTheme(theme) {
    if (theme === 'space') return '#ff6b35';
    if (theme === 'ocean') return '#90e0ef';
    return '#ffd93d';
  }

  function lighten(hex, amt) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + amt);
    const g = Math.min(255, ((num >> 8) & 0xff) + amt);
    const b = Math.min(255, (num & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }

  function darken(hex, amt) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amt);
    const g = Math.max(0, ((num >> 8) & 0xff) - amt);
    const b = Math.max(0, (num & 0xff) - amt);
    return `rgb(${r},${g},${b})`;
  }

  return { init, drawBackground, drawObject, drawWeapon, drawFreezeOverlay, particleColorForTheme };
})();
