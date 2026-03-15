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
    for (let i = 0; i < 6; i++) {
      fish.push({ x: Math.random() * w, y: 80 + Math.random() * (h - 200), speed: 20 + Math.random() * 30, size: 28 + Math.random() * 28, dir: Math.random() > 0.5 ? 1 : -1 });
    }
  }

  // ---- Sky clouds ----
  let clouds = null;

  // ---- Cats theme ----
  let yarnBalls = null;
  let pawprints = null;
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
    if (theme === 'cats') initCatsScene(w, h);
  }

  function initCatsScene(w, h) {
    yarnBalls = [];
    for (let i = 0; i < 4; i++) {
      yarnBalls.push({
        x: Math.random() * w,
        y: h * 0.4 + Math.random() * (h * 0.35),
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 20,
        r: 14 + Math.random() * 10,
        color: ['#e63946', '#f4a261', '#a8dadc', '#c77dff'][i % 4],
        angle: 0
      });
    }
    pawprints = [];
    for (let i = 0; i < 8; i++) {
      pawprints.push({
        x: 50 + Math.random() * (w - 100),
        y: h * 0.6 + Math.random() * (h * 0.35),
        angle: (Math.random() - 0.5) * 0.8,
        alpha: 0.05 + Math.random() * 0.1,
        size: 8 + Math.random() * 6
      });
    }
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
    grad.addColorStop(0, '#003a6e');
    grad.addColorStop(0.6, '#0a6ebd');
    grad.addColorStop(1, '#7a5c3a'); // sandy bottom
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
    ctx.globalAlpha = 0.72;
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

  function drawCatsBackground(ctx, w, h, t) {
    // Warm room gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#f5c88a');
    grad.addColorStop(0.55, '#e08850');
    grad.addColorStop(0.8, '#c8834a');
    grad.addColorStop(1, '#8b5e3c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Wooden floor planks
    const floorY = h * 0.78;
    ctx.save();
    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(0, floorY, w, h - floorY);
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = 1.5;
    const plankW = w / 4;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * plankW, floorY);
      ctx.lineTo(i * plankW, h);
      ctx.stroke();
    }
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.moveTo(0, floorY + (h - floorY) * (j + 1) / 3);
      ctx.lineTo(w, floorY + (h - floorY) * (j + 1) / 3);
      ctx.stroke();
    }
    ctx.restore();

    // Window light patch on the wall
    ctx.save();
    const winX = w * 0.15, winY = h * 0.08;
    const winW = w * 0.22, winH = h * 0.28;
    ctx.globalAlpha = 0.18;
    const wg = ctx.createRadialGradient(winX + winW/2, winY + winH/2, 0, winX + winW/2, winY + winH/2, winW * 0.8);
    wg.addColorStop(0, '#fffbe0');
    wg.addColorStop(1, 'rgba(255,251,224,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(winX, winY, winW, winH);
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#c89b5a';
    ctx.lineWidth = 3;
    ctx.strokeRect(winX, winY, winW, winH);
    ctx.beginPath();
    ctx.moveTo(winX + winW/2, winY); ctx.lineTo(winX + winW/2, winY + winH);
    ctx.moveTo(winX, winY + winH/2); ctx.lineTo(winX + winW, winY + winH/2);
    ctx.stroke();
    ctx.restore();

    // Pawprints on floor
    if (!pawprints) initCatsScene(w, h);
    for (const p of pawprints) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      drawPawprint(ctx, 0, 0, p.size, '#5a3620');
      ctx.restore();
    }

    // Yarn balls
    if (!yarnBalls) initCatsScene(w, h);
    const dt = 0.016;
    for (const ball of yarnBalls) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt + Math.sin(t * 0.5 + ball.r) * 0.3;
      ball.angle += ball.vx * dt * 0.05;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x > w - ball.r) { ball.x = w - ball.r; ball.vx = -Math.abs(ball.vx); }
      const floorLine = h * 0.78 - ball.r;
      if (ball.y > floorLine) ball.y = floorLine;
      drawYarnBall(ctx, ball.x, ball.y, ball.r, ball.color, ball.angle);
    }
  }

  function drawPawprint(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    // Main pad (larger oval)
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.3, size * 0.6, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Toe beans (3 small circles on top)
    const toeOffsets = [[-size*0.55, -size*0.1], [0, -size*0.5], [size*0.55, -size*0.1]];
    for (const [tx, ty] of toeOffsets) {
      ctx.beginPath();
      ctx.arc(x + tx, y + ty, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawYarnBall(ctx, x, y, r, color, angle) {
    ctx.save();
    ctx.translate(x, y);
    // Ball body
    const g = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.05, 0, 0, r);
    g.addColorStop(0, lighten(color, 50));
    g.addColorStop(0.7, color);
    g.addColorStop(1, darken(color, 30));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    // Yarn lines (rotated)
    ctx.strokeStyle = lighten(color, 30);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.rotate(angle);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
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
        else if (obj.isLightning) drawLightning(ctx, obj, false);
        else if (obj.isScoreStar) drawScoreStar(ctx, obj, false);
        else if (obj.isShield) drawShield(ctx, obj, false);
        else if (obj.isMagnet) drawMagnet(ctx, obj, false);
        else if (obj.isReveal) drawReveal(ctx, obj, false);
        else if (obj.isBoss) drawBossObject(ctx, obj, theme, false);
        else drawThemeObject(ctx, obj, theme, false);
        ctx.restore();
      }
      return;
    }
    if (obj.dying) {
      if (obj.isLifeUp || obj.isFreeze || obj.isLightning || obj.isScoreStar || obj.isShield || obj.isMagnet || obj.isReveal) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - obj.dieTimer / 1.2);
        if (obj.isLifeUp) drawLifeUp(ctx, obj, false);
        else if (obj.isFreeze) drawFreezeItem(ctx, obj, false);
        else if (obj.isLightning) drawLightning(ctx, obj, false);
        else if (obj.isScoreStar) drawScoreStar(ctx, obj, false);
        else if (obj.isShield) drawShield(ctx, obj, false);
        else if (obj.isMagnet) drawMagnet(ctx, obj, false);
        else drawReveal(ctx, obj, false);
        ctx.restore();
      } else {
        drawDyingObject(ctx, obj, theme);
      }
      return;
    }
    if (obj.isLifeUp) drawLifeUp(ctx, obj, true);
    else if (obj.isFreeze) drawFreezeItem(ctx, obj, true);
    else if (obj.isLightning) drawLightning(ctx, obj, true);
    else if (obj.isScoreStar) drawScoreStar(ctx, obj, true);
    else if (obj.isShield) drawShield(ctx, obj, true);
    else if (obj.isMagnet) drawMagnet(ctx, obj, true);
    else if (obj.isReveal) drawReveal(ctx, obj, true);
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
    else if (theme === 'cats') drawFishObject(ctx, x, y, obj, targeted, showQuestion);

    if (obj.hintActive) drawHintGrid(ctx, obj);
    if (obj._answerRevealed) drawAnswerReveal(ctx, obj);
    if (obj._revealBonus && !obj._answerRevealed) drawRevealBonusAnswer(ctx, obj);
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

  // Draws the answer prominently in teal during the Reveal bonus
  function drawRevealBonusAnswer(ctx, obj) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y + 32;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#55efc4';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(0,30,25,0.82)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 22, y - 14, 44, 26, 8) : ctx.rect(x - 22, y - 14, 44, 26);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#55efc4';
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

    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#ffffff', 18);
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

  function drawFishObject(ctx, x, y, obj, targeted, showQuestion) {
    // Pick a color per answer
    const FISH_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#f77f00', '#c77dff', '#ff9ebc', '#00d4aa'];
    const col = FISH_COLORS[obj.answer % FISH_COLORS.length];
    const t = Date.now() * 0.001;
    const wobble = Math.sin(t * 3 + obj.wobbleOffset) * 0.15;

    ctx.save();
    if (targeted) { ctx.shadowColor = '#fff59d'; ctx.shadowBlur = 35; }
    ctx.translate(x, y);
    ctx.scale(1.5, 1.5);
    ctx.rotate(wobble);

    // Tail fin
    ctx.fillStyle = darken(col, 20);
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-42, -14);
    ctx.lineTo(-42, 14);
    ctx.closePath();
    ctx.fill();

    // Body
    const bg = ctx.createRadialGradient(-5, -6, 3, 0, 0, 22);
    bg.addColorStop(0, lighten(col, 50));
    bg.addColorStop(0.6, col);
    bg.addColorStop(1, darken(col, 25));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Top dorsal fin
    ctx.fillStyle = darken(col, 15);
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.quadraticCurveTo(2, -26, 14, -14);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(16, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(17, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(18, -5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = darken(col, 30);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(24, -1, 4, Math.PI * 0.2, Math.PI * 0.9);
    ctx.stroke();

    // Scales (subtle arcs)
    ctx.strokeStyle = darken(col, 15);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    [[-5, 0, 8], [5, 3, 7], [-12, -3, 7]].forEach(([sx, sy, sr]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Targeted glow ring
    if (targeted) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.008);
      ctx.shadowColor = '#fff59d';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#fff59d';
      ctx.lineWidth = 3;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.35;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 27, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (showQuestion) {
      ctx.save();
      ctx.font = 'bold 18px Segoe UI, sans-serif';
      ctx.fillStyle = '#1a0800';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 8;
      ctx.fillText(obj.question, x, y);
      ctx.restore();
    }
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
    } else if (theme === 'cats') {
      // Fish floats up and fades
      const scaleX = Math.max(0.2, 1 - obj.dieTimer * 0.4);
      ctx.save(); ctx.translate(x, y); ctx.scale(scaleX, scaleX); ctx.rotate(Math.PI / 4);
      const FISH_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#f77f00', '#c77dff', '#ff9ebc', '#00d4aa'];
      const col = FISH_COLORS[obj.answer % FISH_COLORS.length];
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
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
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 10;
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

  function drawRatBoss(ctx, obj, showQuestion) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const t = Date.now() * 0.001;
    const scale = obj.scale ?? 1.0;
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    const r = Math.max(22, 55 * scale);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const rs = r / scale; // base radius before scale

    // Shadow
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = (20 + 10 * pulse);

    // Tail
    ctx.strokeStyle = '#c89b8a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.quadraticCurveTo(60, 30 + Math.sin(t * 2) * 10, 55, 60 + Math.sin(t * 1.5) * 15);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#8b8b8b';
    ctx.beginPath();
    ctx.ellipse(0, 15, 35, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const ratHeadGrad = ctx.createRadialGradient(-5, -15, 3, 0, -10, 30);
    ratHeadGrad.addColorStop(0, '#aaaaaa');
    ratHeadGrad.addColorStop(0.7, '#888888');
    ratHeadGrad.addColorStop(1, '#666666');
    ctx.fillStyle = ratHeadGrad;
    ctx.beginPath();
    ctx.ellipse(0, -10, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.arc(-20, -26, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, -26, 12, 0, Math.PI * 2);
    ctx.fill();
    // Inner ear
    ctx.fillStyle = '#c89b8a';
    ctx.beginPath();
    ctx.arc(-20, -26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, -26, 7, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (red beady)
    [-10, 10].forEach(ex => {
      ctx.fillStyle = '#330000';
      ctx.beginPath();
      ctx.arc(ex, -14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cc0000';
      ctx.beginPath();
      ctx.arc(ex, -14, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(ex, -14, 2, 0, Math.PI * 2);
      ctx.fill();
      // Shine
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + 1.5, -16, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Nose
    ctx.fillStyle = '#cc6677';
    ctx.beginPath();
    ctx.ellipse(0, -4, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouth / fangs
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, -1); ctx.lineTo(-3, 3); ctx.moveTo(5, -1); ctx.lineTo(3, 3);
    ctx.stroke();
    ctx.fillStyle = '#f0f0e0';
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(-2, 0); ctx.lineTo(-3, 5); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 0); ctx.lineTo(2, 0); ctx.lineTo(3, 5); ctx.closePath(); ctx.fill();

    // Whiskers
    ctx.strokeStyle = 'rgba(200,200,200,0.7)';
    ctx.lineWidth = 1;
    [[-8, -6], [-6, -2]].forEach(([wx, wy]) => {
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx - 22, wy - 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-wx, wy); ctx.lineTo(-wx + 22, wy - 3); ctx.stroke();
    });

    // Pulsing outer ring
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.4 + 0.3 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, rs * 1.15 + 5 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // BOSS label above
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0';
    ctx.font = `bold ${Math.max(8, Math.round(11 * scale))}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS', 0, -rs * 0.6 - 5);

    // Progress dots
    if ((obj.questionsTotal ?? 1) > 1) {
      const dotR = Math.max(3, 4 * scale);
      const spacing = dotR * 3;
      const total = obj.questionsTotal;
      const done = obj.questionIndex;
      const startX = -((total - 1) * spacing) / 2;
      for (let i = 0; i < total; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * spacing, rs * 0.7 + 5, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i < done ? '#ff0' : 'rgba(255,255,255,0.3)';
        ctx.fill();
      }
    }

    ctx.restore();

    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#ffffff', Math.max(13, Math.round(20 * scale)));
  }

  function drawAlienBoss(ctx, obj, showQuestion) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const t = Date.now() * 0.001;
    const scale = obj.scale ?? 1.0;
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    const r = Math.max(22, 55 * scale);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const rs = r / scale;

    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20 + 10 * pulse;

    // Antennae
    ctx.strokeStyle = '#44dd77';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -rs * 0.6);
    ctx.quadraticCurveTo(-25, -rs * 1.0, -20, -rs * 1.2 + Math.sin(t * 2) * 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -rs * 0.6);
    ctx.quadraticCurveTo(25, -rs * 1.0, 20, -rs * 1.2 + Math.sin(t * 2 + 1) * 5);
    ctx.stroke();
    // Glowing tips
    ctx.fillStyle = '#aaffcc';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(-20, -rs * 1.2 + Math.sin(t * 2) * 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, -rs * 1.2 + Math.sin(t * 2 + 1) * 5, 5, 0, Math.PI * 2); ctx.fill();

    // Body
    const bodyGrad = ctx.createRadialGradient(-8, -8, 4, 0, 0, rs * 0.85);
    bodyGrad.addColorStop(0, '#77ee99');
    bodyGrad.addColorStop(0.5, '#33aa55');
    bodyGrad.addColorStop(1, '#114422');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.beginPath();
    ctx.ellipse(0, rs * 0.1, rs * 0.7, rs * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head (large, teardrop-ish)
    const headGrad = ctx.createRadialGradient(-6, -rs * 0.4, 4, 0, -rs * 0.35, rs * 0.65);
    headGrad.addColorStop(0, '#88ffaa');
    headGrad.addColorStop(0.5, '#44bb66');
    headGrad.addColorStop(1, '#1a5530');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -rs * 0.35, rs * 0.65, rs * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big almond eyes
    [-rs * 0.25, rs * 0.25].forEach((ex, i) => {
      ctx.fillStyle = '#1a001a';
      ctx.beginPath();
      ctx.ellipse(ex, -rs * 0.38, rs * 0.22, rs * 0.17, i === 0 ? 0.2 : -0.2, 0, Math.PI * 2);
      ctx.fill();
      const irisGrad = ctx.createRadialGradient(ex * 0.8, -rs * 0.42, 1, ex, -rs * 0.38, rs * 0.14);
      irisGrad.addColorStop(0, '#dd88ff');
      irisGrad.addColorStop(0.5, '#8833bb');
      irisGrad.addColorStop(1, '#330055');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.ellipse(ex, -rs * 0.38, rs * 0.14, rs * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(ex - rs * 0.04, -rs * 0.44, rs * 0.04, 0, Math.PI * 2);
      ctx.fill();
    });

    // Mouth (wide grin)
    ctx.strokeStyle = '#1a5530';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -rs * 0.12, rs * 0.25, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = '#ddffd0';
    for (let i = -2; i <= 2; i++) {
      const tx2 = i * rs * 0.1;
      const arcY = -rs * 0.12 + rs * 0.23 * Math.sin(Math.acos(Math.max(-1, Math.min(1, tx2 / (rs * 0.25)))));
      ctx.beginPath();
      ctx.moveTo(tx2 - rs * 0.04, arcY - 1);
      ctx.lineTo(tx2, arcY + rs * 0.07);
      ctx.lineTo(tx2 + rs * 0.04, arcY - 1);
      ctx.closePath();
      ctx.fill();
    }

    // Pulsing ring
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.strokeStyle = '#44dd77';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.4 + 0.3 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, rs * 1.15 + 5 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0';
    ctx.font = `bold ${Math.max(8, Math.round(11 * scale))}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS', 0, -rs * 0.9);

    if ((obj.questionsTotal ?? 1) > 1) {
      const dotR = Math.max(3, 4 * scale);
      const spacing = dotR * 3;
      const total = obj.questionsTotal;
      const done = obj.questionIndex;
      const startX = -((total - 1) * spacing) / 2;
      for (let i = 0; i < total; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * spacing, rs * 0.7 + 5, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i < done ? '#ff0' : 'rgba(255,255,255,0.3)';
        ctx.fill();
      }
    }

    ctx.restore();
    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#ffffff', Math.max(13, Math.round(20 * scale)));
  }

  function drawKrakenBoss(ctx, obj, showQuestion) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const t = Date.now() * 0.001;
    const scale = obj.scale ?? 1.0;
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    const r = Math.max(22, 55 * scale);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const rs = r / scale;

    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 20 + 10 * pulse;

    // Tentacles (behind body)
    const tentacleAngles = [-0.65, -0.3, 0.3, 0.65, Math.PI * 0.55, Math.PI * 0.75, Math.PI * 1.0, Math.PI * 1.25];
    tentacleAngles.forEach((baseAngle, i) => {
      const wave = Math.sin(t * 1.5 + i * 0.7) * 0.3;
      const endAngle = baseAngle + wave;
      const length = rs * 1.45;
      const cx1 = Math.cos(baseAngle + 0.4) * length * 0.5;
      const cy1 = Math.sin(baseAngle + 0.4) * length * 0.5;
      const cx2 = Math.cos(endAngle) * length * 0.85;
      const cy2 = Math.sin(endAngle) * length * 0.85;
      const ex = Math.cos(endAngle) * length;
      const ey = Math.sin(endAngle) * length;
      ctx.strokeStyle = '#003388';
      ctx.lineWidth = Math.max(2, 9 - i * 0.5);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, rs * 0.3);
      ctx.bezierCurveTo(cx1, cy1 + rs * 0.3, cx2, cy2, ex, ey);
      ctx.stroke();
      // Sucker dots
      ctx.fillStyle = '#0055cc';
      ctx.beginPath();
      ctx.arc(cx2 * 0.7, cy2 * 0.7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Body
    const bodyGrad = ctx.createRadialGradient(-8, -8, 4, 0, 0, rs * 0.75);
    bodyGrad.addColorStop(0, '#4488dd');
    bodyGrad.addColorStop(0.5, '#0044aa');
    bodyGrad.addColorStop(1, '#001133');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.beginPath();
    ctx.ellipse(0, 0, rs * 0.7, rs * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Menacing eyes with slit pupils
    [-rs * 0.28, rs * 0.28].forEach(ex => {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.ellipse(ex, -rs * 0.15, rs * 0.2, rs * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000011';
      ctx.beginPath();
      ctx.ellipse(ex, -rs * 0.15, rs * 0.06, rs * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(ex - rs * 0.08, -rs * 0.22, rs * 0.04, 0, Math.PI * 2);
      ctx.fill();
    });

    // Beak
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(-rs * 0.12, rs * 0.1);
    ctx.lineTo(0, rs * 0.22);
    ctx.lineTo(rs * 0.12, rs * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cc7700';
    ctx.beginPath();
    ctx.moveTo(-rs * 0.09, rs * 0.1);
    ctx.lineTo(0, rs * 0.16);
    ctx.lineTo(rs * 0.09, rs * 0.1);
    ctx.closePath();
    ctx.fill();

    // Pulsing ring
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.strokeStyle = '#4499ff';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.4 + 0.3 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, rs * 1.15 + 5 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0';
    ctx.font = `bold ${Math.max(8, Math.round(11 * scale))}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS', 0, -rs * 0.95);

    if ((obj.questionsTotal ?? 1) > 1) {
      const dotR = Math.max(3, 4 * scale);
      const spacing = dotR * 3;
      const total = obj.questionsTotal;
      const done = obj.questionIndex;
      const startX = -((total - 1) * spacing) / 2;
      for (let i = 0; i < total; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * spacing, rs * 0.7 + 5, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i < done ? '#ff0' : 'rgba(255,255,255,0.3)';
        ctx.fill();
      }
    }

    ctx.restore();
    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#ffffff', Math.max(13, Math.round(20 * scale)));
  }

  function drawDragonBoss(ctx, obj, showQuestion) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const t = Date.now() * 0.001;
    const scale = obj.scale ?? 1.0;
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    const r = Math.max(22, 55 * scale);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const rs = r / scale;

    ctx.shadowColor = '#9932cc';
    ctx.shadowBlur = 20 + 10 * pulse;

    // Wings (behind body)
    [-1, 1].forEach(dir => {
      const wFlap = Math.sin(t * 3 + (dir + 1)) * rs * 0.08;
      ctx.save();
      ctx.scale(dir, 1);
      ctx.fillStyle = '#4b0082';
      ctx.beginPath();
      ctx.moveTo(rs * 0.3, -rs * 0.3);
      ctx.bezierCurveTo(rs * 0.8, -rs * 0.9 + wFlap, rs * 1.3, -rs * 0.6 + wFlap, rs * 1.4, rs * 0.1);
      ctx.bezierCurveTo(rs * 1.1, rs * 0.4, rs * 0.7, rs * 0.3, rs * 0.3, rs * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6a1aaa';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      [[rs * 0.7, -rs * 0.6 + wFlap, rs * 1.35, -rs * 0.2], [rs * 0.9, -rs * 0.7 + wFlap, rs * 1.38, 0]].forEach(([cx, cy, ex, ey]) => {
        ctx.beginPath();
        ctx.moveTo(rs * 0.3, -rs * 0.1);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Tail
    ctx.strokeStyle = '#4b0082';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rs * 0.3, rs * 0.5);
    ctx.quadraticCurveTo(rs * 0.8, rs * 0.9 + Math.sin(t * 2) * rs * 0.15, rs * 0.5, rs * 1.3 + Math.sin(t * 2) * rs * 0.2);
    ctx.stroke();

    // Body
    const bodyGrad = ctx.createRadialGradient(-rs * 0.2, -rs * 0.1, rs * 0.1, 0, 0, rs * 0.75);
    bodyGrad.addColorStop(0, '#9932cc');
    bodyGrad.addColorStop(0.5, '#5c0ea8');
    bodyGrad.addColorStop(1, '#200040');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = '#9932cc';
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.beginPath();
    ctx.ellipse(0, rs * 0.1, rs * 0.55, rs * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headGrad = ctx.createRadialGradient(-rs * 0.15, -rs * 0.6, rs * 0.05, 0, -rs * 0.55, rs * 0.45);
    headGrad.addColorStop(0, '#bb44ee');
    headGrad.addColorStop(0.5, '#7a1aaa');
    headGrad.addColorStop(1, '#2d0050');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -rs * 0.55, rs * 0.45, rs * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#cc66ff';
    [-rs * 0.2, rs * 0.2].forEach(hx => {
      ctx.beginPath();
      ctx.moveTo(hx, -rs * 0.82);
      ctx.lineTo(hx - rs * 0.05, -rs * 1.1 + Math.sin(t * 3) * rs * 0.03);
      ctx.lineTo(hx + rs * 0.05, -rs * 0.85);
      ctx.closePath();
      ctx.fill();
    });

    // Fiery eyes
    [-rs * 0.2, rs * 0.2].forEach(ex => {
      ctx.fillStyle = '#110011';
      ctx.beginPath();
      ctx.ellipse(ex, -rs * 0.58, rs * 0.13, rs * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      const eyeGrad = ctx.createRadialGradient(ex, -rs * 0.58, 0.5, ex, -rs * 0.58, rs * 0.1);
      eyeGrad.addColorStop(0, '#ffffa0');
      eyeGrad.addColorStop(0.4, '#ff8800');
      eyeGrad.addColorStop(1, '#cc0000');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.ellipse(ex, -rs * 0.58, rs * 0.1, rs * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(ex - rs * 0.03, -rs * 0.63, rs * 0.03, 0, Math.PI * 2);
      ctx.fill();
    });

    // Maw with fangs
    ctx.fillStyle = '#440066';
    ctx.beginPath();
    ctx.arc(0, -rs * 0.4, rs * 0.2, 0.1, Math.PI - 0.1);
    ctx.fill();
    ctx.fillStyle = '#ffeecc';
    [[-rs * 0.1, 0], [0, 0], [rs * 0.1, 0]].forEach(([fx]) => {
      ctx.beginPath();
      ctx.moveTo(fx - rs * 0.04, -rs * 0.38);
      ctx.lineTo(fx, -rs * 0.3);
      ctx.lineTo(fx + rs * 0.04, -rs * 0.38);
      ctx.closePath();
      ctx.fill();
    });

    // Lightning bolt from mouth
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.strokeStyle = '#ffff88';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -rs * 0.3);
    ctx.lineTo(rs * 0.15, -rs * 0.2);
    ctx.lineTo(-rs * 0.1, -rs * 0.12);
    ctx.lineTo(rs * 0.1, 0);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Pulsing ring
    ctx.shadowColor = '#9932cc';
    ctx.shadowBlur = 20 + 10 * pulse;
    ctx.strokeStyle = '#cc66ff';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.4 + 0.3 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, rs * 1.15 + 5 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0';
    ctx.font = `bold ${Math.max(8, Math.round(11 * scale))}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOSS', 0, -rs * 1.1);

    if ((obj.questionsTotal ?? 1) > 1) {
      const dotR = Math.max(3, 4 * scale);
      const spacing = dotR * 3;
      const total = obj.questionsTotal;
      const done = obj.questionIndex;
      const startX = -((total - 1) * spacing) / 2;
      for (let i = 0; i < total; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * spacing, rs * 0.7 + 5, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i < done ? '#ff0' : 'rgba(255,255,255,0.3)';
        ctx.fill();
      }
    }

    ctx.restore();
    if (showQuestion) drawQuestionText(ctx, x, y, obj.question, '#ffffff', Math.max(13, Math.round(20 * scale)));
  }

  function drawBossObject(ctx, obj, theme, showQuestion) {
    if (theme === 'cats')  { drawRatBoss(ctx, obj, showQuestion);   return; }
    if (theme === 'space') { drawAlienBoss(ctx, obj, showQuestion);  return; }
    if (theme === 'ocean') { drawKrakenBoss(ctx, obj, showQuestion); return; }
    if (theme === 'sky')   { drawDragonBoss(ctx, obj, showQuestion); return; }
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

  // ========================
  //  BONUS ITEMS
  // ========================

  function _drawBonusOrb(ctx, obj, showLabel, glowColor, gradColors, icon, labelText) {
    const x = obj.x + obj.wobbleX;
    const y = obj.y;
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() * 0.005);
    const targeted = obj.isTargeted;

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = targeted ? 55 : 30;

    // Outer ring
    const ringR = 36 + (targeted ? 6 * pulse : 0);
    ctx.strokeStyle = targeted ? '#ffffff' : glowColor;
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
    bg.addColorStop(0, gradColors[0]);
    bg.addColorStop(0.6, gradColors[1]);
    bg.addColorStop(1, gradColors[2]);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y - 16);

    if (showLabel) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 5;
      ctx.fillText(obj.question, x, y + 2);
      ctx.fillStyle = targeted ? '#fff' : '#eee';
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.shadowBlur = 3;
      ctx.fillText(labelText, x, y + 20);
    }

    ctx.restore();
  }

  function drawLightning(ctx, obj, showLabel) {
    _drawBonusOrb(ctx, obj, showLabel, '#ffe066', ['#fff7aa', '#f9ca24', '#f0932b'], '⚡', 'clear all!');
  }

  function drawScoreStar(ctx, obj, showLabel) {
    _drawBonusOrb(ctx, obj, showLabel, '#ffd700', ['#fff9c4', '#ffd700', '#e67e22'], '🌟', '×3 score!');
  }

  function drawShield(ctx, obj, showLabel) {
    _drawBonusOrb(ctx, obj, showLabel, '#a29bfe', ['#d8d4ff', '#a29bfe', '#6c5ce7'], '🛡', 'shield!');
  }

  function drawMagnet(ctx, obj, showLabel) {
    _drawBonusOrb(ctx, obj, showLabel, '#fd79a8', ['#ffd6e7', '#fd79a8', '#e84393'], '🧲', 'magnet 4s!');
  }

  function drawReveal(ctx, obj, showLabel) {
    _drawBonusOrb(ctx, obj, showLabel, '#55efc4', ['#a8f0db', '#55efc4', '#00b894'], '💡', 'reveal 3s!');
  }

  function drawMagnetOverlay(ctx, w, h, secondsLeft) {
    const alpha = Math.min(0.12, secondsLeft * 0.03);
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#fd79a8'; ctx.fillRect(0, 0, w, h); ctx.restore();
  }

  function drawRevealOverlay(ctx, w, h, secondsLeft) {
    const alpha = Math.min(0.10, secondsLeft * 0.04);
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#55efc4'; ctx.fillRect(0, 0, w, h); ctx.restore();
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

  function drawCatPlayer(ctx, w, h, tx, ty) {
    const bx = w / 2;
    const by = h - 80;
    const t = Date.now() * 0.001;

    // Determine which way the cat is looking
    const lookDir = tx < bx ? -1 : 1;
    const angle = Math.atan2(ty - by, tx - bx);

    ctx.save();
    ctx.translate(bx, by);

    // Tail (behind body)
    ctx.save();
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-lookDir * 18, 0);
    ctx.quadraticCurveTo(-lookDir * 50, -20 + Math.sin(t * 2) * 10, -lookDir * 55, -45 + Math.sin(t * 2.5) * 15);
    ctx.stroke();
    // Tail tip
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-lookDir * 50, -38 + Math.sin(t * 2.5) * 15);
    ctx.lineTo(-lookDir * 55, -45 + Math.sin(t * 2.5) * 15);
    ctx.stroke();
    ctx.restore();

    // Body (fluffy oval)
    const bodyGrad = ctx.createRadialGradient(-4, -8, 4, 0, 0, 30);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.7, '#f0f0f0');
    bodyGrad.addColorStop(1, '#d8d8d8');
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head
    const headGrad = ctx.createRadialGradient(-3, -38, 3, 0, -38, 22);
    headGrad.addColorStop(0, '#ffffff');
    headGrad.addColorStop(0.7, '#f0f0f0');
    headGrad.addColorStop(1, '#d8d8d8');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, -38, 22, 0, Math.PI * 2);
    ctx.fill();

    // Ears (triangles)
    ctx.fillStyle = '#f0f0f0';
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-18, -50);
    ctx.lineTo(-28, -68);
    ctx.lineTo(-8, -58);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(18, -50);
    ctx.lineTo(28, -68);
    ctx.lineTo(8, -58);
    ctx.closePath();
    ctx.fill();
    // Inner ear pink
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.moveTo(-17, -53);
    ctx.lineTo(-24, -63);
    ctx.lineTo(-10, -58);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(17, -53);
    ctx.lineTo(24, -63);
    ctx.lineTo(10, -58);
    ctx.closePath();
    ctx.fill();

    // Eyes (blue!)
    [-7, 7].forEach(ex => {
      // Outer eye white
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(ex, -40, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Blue iris
      const irisGrad = ctx.createRadialGradient(ex + lookDir * 1.5, -40, 0.5, ex, -40, 5);
      irisGrad.addColorStop(0, '#74c0fc');
      irisGrad.addColorStop(0.5, '#339af0');
      irisGrad.addColorStop(1, '#1864ab');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.ellipse(ex, -40, 4.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupil
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(ex + lookDir * 1, -40, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + lookDir * 2, -42, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Nose (pink triangle)
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.moveTo(0, -33);
    ctx.lineTo(-3, -30);
    ctx.lineTo(3, -30);
    ctx.closePath();
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(-5, -27, -7, -29);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.quadraticCurveTo(5, -27, 7, -29);
    ctx.stroke();

    // Whiskers
    ctx.strokeStyle = 'rgba(180,180,180,0.8)';
    ctx.lineWidth = 1;
    [[-22, -32, -8, -31], [-22, -29, -8, -29], [-22, -26, -8, -27]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-x1, y1); ctx.lineTo(-x2, y2); ctx.stroke();
    });

    // Paw (extended toward target)
    const pawAngle = angle;
    ctx.save();
    ctx.rotate(pawAngle);
    ctx.translate(32, -5);
    // Arm
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
    // Paw pad
    ctx.fillStyle = '#ffb3ba';
    ctx.beginPath();
    ctx.arc(22, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,180,190,0.6)';
    [[-3, -5], [3, -5], [-5, 0], [5, 0]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(22 + px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();

    // Targeting beam — warm orange glow (like a cat laser pointer!)
    ctx.save();
    const beamStart = { x: bx + Math.cos(angle) * 34, y: by + Math.sin(angle) * 34 - 5 };
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(beamStart.x, beamStart.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(beamStart.x, beamStart.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    // Laser dot at target
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff4000';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAstronautPlayer(ctx, w, h, tx, ty) {
    const bx = w / 2, by = h - 85;
    const t = Date.now() * 0.001;
    const angle = Math.atan2(ty - by, tx - bx);

    ctx.save();
    ctx.translate(bx, by);

    // Jetpack (behind body)
    ctx.fillStyle = '#555';
    ctx.fillRect(-10, -15, 20, 30);
    ctx.fillStyle = '#888';
    ctx.fillRect(-8, 10, 7, 12);
    ctx.fillRect(1, 10, 7, 12);
    // Thruster glow
    const thrust = 0.5 + 0.5 * Math.sin(t * 8);
    ctx.globalAlpha = thrust;
    ctx.fillStyle = '#00aaff';
    ctx.shadowColor = '#00aaff';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(-4, 22, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, 22, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Spacesuit torso
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    const bodyGrad = ctx.createRadialGradient(-4, -5, 3, 0, 0, 26);
    bodyGrad.addColorStop(0, '#e8e8e8');
    bodyGrad.addColorStop(0.7, '#cccccc');
    bodyGrad.addColorStop(1, '#aaaaaa');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 5, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Helmet
    const helmGrad = ctx.createRadialGradient(-6, -42, 3, 0, -38, 22);
    helmGrad.addColorStop(0, '#f5f5f5');
    helmGrad.addColorStop(0.7, '#dddddd');
    helmGrad.addColorStop(1, '#bbbbbb');
    ctx.fillStyle = helmGrad;
    ctx.beginPath();
    ctx.arc(0, -38, 22, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    const visorGrad = ctx.createRadialGradient(-4, -41, 2, 0, -38, 14);
    visorGrad.addColorStop(0, '#6ba3d6');
    visorGrad.addColorStop(0.5, '#1a3a6a');
    visorGrad.addColorStop(1, '#0d1f3c');
    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.ellipse(0, -38, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Visor shine
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-4, -42, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Collar ring
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -18, 14, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Chest panel
    ctx.fillStyle = '#888';
    ctx.fillRect(-8, -8, 16, 12);
    [['#00ff88', -4, -4], ['#ff4444', 0, -4], ['#ffff00', 4, -4]].forEach(([c, px, py]) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    });

    // Arm extended toward target
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(26, -5);
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(22, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.restore();

    // Targeting beam — cyan space glow
    ctx.save();
    const beamStart = { x: bx + Math.cos(angle) * 34, y: by + Math.sin(angle) * 34 - 5 };
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(beamStart.x, beamStart.y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(beamStart.x, beamStart.y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.restore();
  }

  function drawDiverPlayer(ctx, w, h, tx, ty) {
    const bx = w / 2, by = h - 80;
    const t = Date.now() * 0.001;
    const lookDir = tx < bx ? -1 : 1;
    const angle = Math.atan2(ty - by, tx - bx);

    ctx.save();
    ctx.translate(bx, by);

    // Oxygen tank
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.ellipse(lookDir * 20, 0, 8, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(lookDir * 20, -14, 5, 0, Math.PI * 2); ctx.fill();

    // Rising bubbles
    for (let i = 0; i < 3; i++) {
      const phase = (t * 0.6 + i * 0.33) % 1;
      ctx.globalAlpha = (1 - phase) * 0.6;
      ctx.strokeStyle = '#90e0ef';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lookDir * 24 + Math.sin(t + i) * 4, -20 - phase * 40, 3 + i * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Wetsuit body
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#1a1a4e';
    ctx.beginPath();
    ctx.ellipse(0, 5, 22, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#1a1a4e';
    ctx.beginPath(); ctx.arc(0, -35, 20, 0, Math.PI * 2); ctx.fill();

    // Diving mask
    ctx.shadowBlur = 0;
    const lensGrad = ctx.createRadialGradient(-4, -38, 2, 0, -35, 14);
    lensGrad.addColorStop(0, '#aae4ff');
    lensGrad.addColorStop(0.4, '#2299cc');
    lensGrad.addColorStop(1, '#004466');
    ctx.fillStyle = lensGrad;
    ctx.beginPath(); ctx.ellipse(0, -35, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -35, 14, 11, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-4, -39, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Regulator hose + mouthpiece
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-lookDir * 8, -26); ctx.lineTo(-lookDir * 20, -22); ctx.stroke();
    ctx.fillStyle = '#999';
    ctx.beginPath(); ctx.ellipse(-lookDir * 22, -22, 7, 4, 0.3, 0, Math.PI * 2); ctx.fill();

    // Arm with spear gun
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(24, -5);
    ctx.strokeStyle = '#1a1a4e';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.stroke();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(38, 0); ctx.stroke();
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(34, -3); ctx.lineTo(34, 3); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.restore();

    // Targeting beam — teal sonar
    ctx.save();
    const beamStart = { x: bx + Math.cos(angle) * 34, y: by + Math.sin(angle) * 34 - 5 };
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#90e0ef';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#90e0ef';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(beamStart.x, beamStart.y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(beamStart.x, beamStart.y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.restore();
  }

  function drawEaglePlayer(ctx, w, h, tx, ty) {
    const bx = w / 2, by = h - 80;
    const t = Date.now() * 0.001;
    const lookDir = tx < bx ? -1 : 1;
    const wingFlap = Math.sin(t * 4) * 8;

    ctx.save();
    ctx.translate(bx, by);

    // Wings
    [-1, 1].forEach(dir => {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.fillStyle = '#6b3a10';
      ctx.beginPath();
      ctx.moveTo(8, -8);
      ctx.bezierCurveTo(28, -20 + wingFlap, 58, -8 + wingFlap, 62, 12 + wingFlap);
      ctx.bezierCurveTo(55, 18 + wingFlap, 38, 8, 10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(10, -6);
      ctx.bezierCurveTo(28, -14 + wingFlap, 50, -2 + wingFlap, 56, 10 + wingFlap);
      ctx.bezierCurveTo(46, 14 + wingFlap, 32, 6, 10, 2);
      ctx.closePath();
      ctx.fill();
      // Wingtip feather lines
      ctx.strokeStyle = '#3d1c00';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(45 + i * 3, 8 + wingFlap);
        ctx.lineTo(47 + i * 3, 20 + wingFlap + i);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Tail feathers
    ctx.fillStyle = '#6b3a10';
    ctx.beginPath();
    ctx.moveTo(-12, 18); ctx.lineTo(-16, 40); ctx.lineTo(-8, 36);
    ctx.lineTo(0, 42); ctx.lineTo(8, 36); ctx.lineTo(16, 40); ctx.lineTo(12, 18);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#5c2d00';
    ctx.beginPath(); ctx.ellipse(0, 6, 15, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5e8c0';
    ctx.beginPath(); ctx.ellipse(0, 10, 9, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // White head
    ctx.fillStyle = '#f5f0e8';
    ctx.beginPath(); ctx.arc(lookDir * 3, -24, 15, 0, Math.PI * 2); ctx.fill();

    // Eye
    const eyeX = lookDir * 8;
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(eyeX, -26, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8800'; ctx.beginPath(); ctx.arc(eyeX, -26, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(eyeX, -26, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(eyeX + 1, -28, 1, 0, Math.PI * 2); ctx.fill();

    // Beak pointing in lookDir
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(lookDir * 12, -28); ctx.lineTo(lookDir * 28, -24);
    ctx.lineTo(lookDir * 26, -20); ctx.lineTo(lookDir * 12, -22); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cc9900';
    ctx.beginPath();
    ctx.moveTo(lookDir * 12, -25); ctx.lineTo(lookDir * 28, -24);
    ctx.lineTo(lookDir * 26, -20); ctx.lineTo(lookDir * 12, -23); ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Targeting beam — golden wind line to target
    ctx.save();
    const beamOriginX = bx + lookDir * 28;
    const beamOriginY = by - 24;
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#ffd93d';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#ffd93d';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(beamOriginX, beamOriginY); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(beamOriginX, beamOriginY); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.restore();
  }

  function drawWeapon(ctx, w, h, theme, targetX, targetY) {
    if (theme === 'space') drawAstronautPlayer(ctx, w, h, targetX, targetY);
    else if (theme === 'ocean') drawDiverPlayer(ctx, w, h, targetX, targetY);
    else if (theme === 'sky') drawEaglePlayer(ctx, w, h, targetX, targetY);
    else if (theme === 'cats') drawCatPlayer(ctx, w, h, targetX, targetY);
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
    else if (theme === 'cats') drawCatsBackground(ctx, w, h, t);
  }

  // ========================
  //  HELPERS
  // ========================

  function particleColorForTheme(theme) {
    if (theme === 'space') return '#ff6b35';
    if (theme === 'ocean') return '#90e0ef';
    if (theme === 'cats') return '#ff9ebc';
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

  return { init, drawBackground, drawObject, drawWeapon, drawFreezeOverlay, drawMagnetOverlay, drawRevealOverlay, particleColorForTheme };
})();
