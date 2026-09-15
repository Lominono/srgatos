import gsap from 'gsap';

export function setupFlappyMeowl() {
  const modal = document.getElementById('flappy-modal');
  const canvas = document.getElementById('flappy-canvas');
  const openBtn = document.getElementById('btn-open-flappy');
  const closeBtn = document.getElementById('btn-close-flappy');

  if (!modal || !canvas) return;

  const ctx = canvas.getContext('2d');

  // Load Flappy Cat Sprite
  const catImg = new Image();
  catImg.src = '/images/flappy-cat.png';

  let animationFrameId = null;
  let isRunning = false;
  let isPaused = false;
  let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'

  // Web Audio SFX
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playFlapSound() {
    try {
      const c = getAudioContext();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, c.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.1);
    } catch(e) {}
  }

  function playScoreSound() {
    try {
      const c = getAudioContext();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, c.currentTime); // D5
      osc.frequency.setValueAtTime(880, c.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.18, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.23);
    } catch(e) {}
  }

  function playCoinSound() {
    try {
      const c = getAudioContext();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, c.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, c.currentTime + 0.07); // E6
      gain.gain.setValueAtTime(0.25, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.32);
    } catch(e) {}
  }

  function playHitSound() {
    try {
      const c = getAudioContext();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, c.currentTime + 0.28);
      gain.gain.setValueAtTime(0.28, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.33);
    } catch(e) {}
  }

  // Dimensions & Responsive sizing
  let width = 360;
  let height = 580;

  function resizeCanvas() {
    width = Math.min(420, window.innerWidth - 32);
    height = Math.min(620, window.innerHeight - 110);
    canvas.width = width;
    canvas.height = height;
  }

  // Bird & Physics
  const gravity = 0.36;
  const jumpImpulse = -7.4;
  const birdSize = 46;

  let bird = {
    x: 70,
    y: 220,
    vy: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  };

  // Parallax layers
  let mountainOffset = 0;
  let hillsOffset = 0;

  // Starfield
  const stars = [];
  for (let i = 0; i < 35; i++) {
    stars.push({
      x: Math.random() * 440,
      y: Math.random() * 320,
      size: Math.random() * 1.8 + 0.7,
      blink: Math.random() * Math.PI * 2
    });
  }

  // Feathers & Confetti particles
  let particles = [];
  let screenShake = 0;

  function emitFeathers(x, y) {
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: x - 12 + (Math.random() - 0.5) * 8,
        y: y + 4 + (Math.random() - 0.5) * 8,
        vx: -Math.random() * 2.5 - 1.2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 2,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.15,
        alpha: 0.85,
        color: Math.random() > 0.5 ? '#f5e8d5' : '#e08a9f'
      });
    }
  }

  function emitConfetti(x, y, count = 8) {
    const colors = ['#FFD60A', '#FF375F', '#0A84FF', '#30D158', '#BF5AF2'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 4 + 3,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        alpha: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  // Floating text notifications (+1, +5, etc)
  let floatTexts = [];
  function addFloatingText(text, x, y, color = '#FFD60A') {
    floatTexts.push({
      text,
      x,
      y,
      vy: -1.8,
      alpha: 1,
      color
    });
  }

  // Pipes & Bonus Fish
  let pipes = [];
  let bonusFish = [];
  const pipeWidth = 56;
  const pipeGap = 155;
  let pipeSpawnTimer = 0;
  const pipeSpawnInterval = 105;

  // Score
  let score = 0;
  let highScore = parseInt(localStorage.getItem('meowl_flappy_highscore') || '0', 10);
  let isNewRecord = false;

  function resetGame() {
    bird.x = width * 0.25;
    bird.y = height * 0.45;
    bird.vy = 0;
    bird.rotation = 0;
    bird.scaleX = 1;
    bird.scaleY = 1;

    pipes = [];
    bonusFish = [];
    particles = [];
    floatTexts = [];
    pipeSpawnTimer = 0;
    score = 0;
    isNewRecord = false;
    gameState = 'START';
  }

  function triggerJump() {
    if (gameState === 'START') {
      gameState = 'PLAYING';
      bird.vy = jumpImpulse;
      bird.scaleX = 0.82;
      bird.scaleY = 1.25;
      emitFeathers(bird.x, bird.y);
      playFlapSound();
      if (navigator.vibrate) navigator.vibrate(15);
    } else if (gameState === 'PLAYING') {
      bird.vy = jumpImpulse;
      bird.scaleX = 0.82;
      bird.scaleY = 1.25;
      emitFeathers(bird.x, bird.y);
      playFlapSound();
      if (navigator.vibrate) navigator.vibrate(15);
    } else if (gameState === 'GAMEOVER') {
      resetGame();
    }
  }

  function spawnPipe() {
    const minHeight = 65;
    const maxHeight = height - pipeGap - minHeight - 30;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;

    pipes.push({
      x: width,
      top: topHeight,
      bottom: height - (topHeight + pipeGap),
      passed: false
    });

    // 45% chance to spawn a golden fish bonus in gap
    if (Math.random() > 0.55) {
      bonusFish.push({
        x: width + pipeWidth / 2,
        y: topHeight + pipeGap / 2,
        size: 16,
        collected: false,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  function update() {
    if (isPaused) return;

    // Background parallax scroll
    mountainOffset = (mountainOffset + 0.4) % width;
    hillsOffset = (hillsOffset + 1.1) % width;

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.alpha -= 0.024;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const ft = floatTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) floatTexts.splice(i, 1);
    }

    if (gameState === 'PLAYING') {
      // Bird physics & scale spring
      bird.vy += gravity;
      bird.y += bird.vy;

      // Spring scales back to 1
      bird.scaleX += (1 - bird.scaleX) * 0.12;
      bird.scaleY += (1 - bird.scaleY) * 0.12;

      // Rotation
      bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 6, (bird.vy / 9)));

      // Floor & Ceiling collision
      if (bird.y + birdSize / 2 >= height - 20) {
        bird.y = height - 20 - birdSize / 2;
        gameOver();
      }
      if (bird.y - birdSize / 2 <= 0) {
        bird.y = birdSize / 2;
        bird.vy = 0;
      }

      // Pipes spawn & movement
      pipeSpawnTimer++;
      if (pipeSpawnTimer >= pipeSpawnInterval) {
        pipeSpawnTimer = 0;
        spawnPipe();
      }

      // Move pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= 2.6;

        // Score
        if (!p.passed && p.x + pipeWidth < bird.x) {
          p.passed = true;
          score++;
          playScoreSound();
          emitConfetti(p.x + pipeWidth, p.top + pipeGap / 2, 7);
          addFloatingText('+1', bird.x, bird.y - 20, '#ffffff');

          if (score > highScore) {
            highScore = score;
            localStorage.setItem('meowl_flappy_highscore', highScore.toString());
            if (!isNewRecord) {
              isNewRecord = true;
              emitConfetti(width / 2, 80, 14);
              addFloatingText('¡RÉCORD!', width / 2, 90, '#FFD60A');
            }
          }
        }

        // Collision detection
        const hitMargin = 8;
        const hitTop = (bird.x + birdSize / 2 - hitMargin > p.x &&
                        bird.x - birdSize / 2 + hitMargin < p.x + pipeWidth &&
                        bird.y - birdSize / 2 + hitMargin < p.top);

        const hitBottom = (bird.x + birdSize / 2 - hitMargin > p.x &&
                           bird.x - birdSize / 2 + hitMargin < p.x + pipeWidth &&
                           bird.y + birdSize / 2 - hitMargin > height - p.bottom);

        if (hitTop || hitBottom) {
          gameOver();
        }

        if (p.x + pipeWidth < -30) {
          pipes.splice(i, 1);
        }
      }

      // Move bonus fish
      for (let i = bonusFish.length - 1; i >= 0; i--) {
        const f = bonusFish[i];
        f.x -= 2.6;
        f.wobble += 0.08;

        // Collision with cat
        const dist = Math.hypot(bird.x - f.x, bird.y - (f.y + Math.sin(f.wobble) * 6));
        if (!f.collected && dist < birdSize / 2 + f.size / 2) {
          f.collected = true;
          score += 5;
          playCoinSound();
          emitConfetti(f.x, f.y, 10);
          addFloatingText('+5 🐟', f.x, f.y - 15, '#FFD60A');
          if (navigator.vibrate) navigator.vibrate([15, 30, 20]);
          bonusFish.splice(i, 1);
          continue;
        }

        if (f.x < -30) {
          bonusFish.splice(i, 1);
        }
      }
    } else if (gameState === 'START') {
      // Gentle floating hover
      bird.y = height * 0.45 + Math.sin(Date.now() / 240) * 9;
      bird.rotation = 0;
      bird.scaleX = 1;
      bird.scaleY = 1;
    }
  }

  function gameOver() {
    if (gameState === 'GAMEOVER') return;
    gameState = 'GAMEOVER';
    screenShake = 16;
    playHitSound();
    if (navigator.vibrate) navigator.vibrate([40, 40, 50]);

    // Canvas shake
    gsap.timeline()
      .to(canvas, { x: 9, duration: 0.04, repeat: 5, yoyo: true })
      .to(canvas, { x: 0, duration: 0.04 });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
      screenShake *= 0.86;
      if (screenShake < 0.2) screenShake = 0;
    }

    // Deep Twilight Gradient Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0a0a12');
    skyGrad.addColorStop(0.5, '#121124');
    skyGrad.addColorStop(1, '#21162c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    for (let s of stars) {
      s.blink += 0.03;
      const alpha = 0.35 + Math.sin(s.blink) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(s.x % width, s.y, s.size, s.size);
    }

    // Parallax Layer 1: Distant Mountains Silhouette
    ctx.fillStyle = '#151322';
    ctx.beginPath();
    ctx.moveTo(-mountainOffset, height - 70);
    for (let i = 0; i <= 3; i++) {
      const baseX = i * 220 - mountainOffset;
      ctx.lineTo(baseX + 110, height - 160);
      ctx.lineTo(baseX + 220, height - 70);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Parallax Layer 2: Rolling Hills Silhouette
    ctx.fillStyle = '#1c192e';
    ctx.beginPath();
    ctx.moveTo(-hillsOffset, height - 40);
    for (let i = 0; i <= 4; i++) {
      const baseX = i * 160 - hillsOffset;
      ctx.quadraticCurveTo(baseX + 80, height - 95, baseX + 160, height - 40);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Ground line
    ctx.fillStyle = '#262238';
    ctx.fillRect(0, height - 20, width, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, height - 20, width, 1.5);

    // Draw Pipes
    for (let p of pipes) {
      // Top Pipe
      const topGrad = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
      topGrad.addColorStop(0, '#2e2c3b');
      topGrad.addColorStop(0.5, '#48445c');
      topGrad.addColorStop(1, '#232130');
      ctx.fillStyle = topGrad;
      ctx.fillRect(p.x, 0, pipeWidth, p.top);

      // Top Pipe Lip
      ctx.fillStyle = '#5c5874';
      ctx.fillRect(p.x - 3, p.top - 18, pipeWidth + 6, 18);
      ctx.fillStyle = '#FF7597';
      ctx.fillRect(p.x - 3, p.top - 2, pipeWidth + 6, 2); // Pink neon accent

      // Bottom Pipe
      const btmY = height - p.bottom;
      ctx.fillStyle = topGrad;
      ctx.fillRect(p.x, btmY, pipeWidth, p.bottom);

      // Bottom Pipe Lip
      ctx.fillStyle = '#5c5874';
      ctx.fillRect(p.x - 3, btmY, pipeWidth + 6, 18);
      ctx.fillStyle = '#0A84FF';
      ctx.fillRect(p.x - 3, btmY, pipeWidth + 6, 2); // Blue neon accent
    }

    // Draw Bonus Fish snacks
    for (let f of bonusFish) {
      ctx.save();
      const fishY = f.y + Math.sin(f.wobble) * 6;
      ctx.translate(f.x, fishY);

      // Golden aura
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#FFD60A';

      ctx.fillStyle = '#FFD60A';
      // Fish body
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fish tail
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(15, -6);
      ctx.lineTo(15, 6);
      ctx.closePath();
      ctx.fill();

      // Fish eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-5, -2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Draw Feathers particles
    for (let pt of particles) {
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rotation);
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.ellipse(0, 0, pt.size, pt.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Cat Sprite with squash & stretch
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    ctx.scale(bird.scaleX, bird.scaleY);

    if (catImg.complete && catImg.naturalWidth > 0) {
      ctx.drawImage(
        catImg,
        -birdSize / 2,
        -birdSize / 2,
        birdSize,
        birdSize
      );
    } else {
      ctx.fillStyle = '#FF7597';
      ctx.beginPath();
      ctx.arc(0, 0, birdSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Floating Score Texts
    for (let ft of floatTexts) {
      ctx.save();
      ctx.font = 'bold 18px -apple-system, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Live HUD Score during play
    if (gameState === 'PLAYING') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 38px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 10;
      ctx.fillText(score.toString(), width / 2, 65);
      ctx.shadowBlur = 0;

      if (highScore > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '600 12px -apple-system, sans-serif';
        ctx.fillText(`TOP: ${highScore}`, width / 2, 88);
      }
    } else if (gameState === 'START') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 24px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FLAPPY MEOWL', width / 2, height * 0.32);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillText('Toca la pantalla para aletear', width / 2, height * 0.62);

      ctx.fillStyle = '#FFD60A';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('✨ Atrapa los pescados dorados (+5 pts)', width / 2, height * 0.67);

      if (highScore > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText(`Récord actual: ${highScore}`, width / 2, height * 0.72);
      }
    } else if (gameState === 'GAMEOVER') {
      // Game Over Glass Card
      ctx.fillStyle = 'rgba(10, 10, 16, 0.8)';
      const cardW = width * 0.84;
      const cardH = 200;
      const cardX = (width - cardW) / 2;
      const cardY = height * 0.28;

      ctx.roundRect ? ctx.roundRect(cardX, cardY, cardW, cardH, 20) : ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#FF375F';
      ctx.font = '800 24px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, cardY + 45);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px -apple-system, sans-serif';
      ctx.fillText(`${score} Puntos`, width / 2, cardY + 85);

      ctx.fillStyle = '#FFD60A';
      ctx.font = '600 14px -apple-system, sans-serif';
      ctx.fillText(`👑 Mejor Récord: ${highScore}`, width / 2, cardY + 120);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText('Toca para revivir', width / 2, cardY + 165);
    }

    ctx.restore();
  }

  function loop() {
    if (!isRunning) return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  function openGame() {
    modal.style.display = 'flex';
    resizeCanvas();
    resetGame();
    isRunning = true;
    isPaused = false;

    gsap.fromTo(modal, 
      { autoAlpha: 0, scale: 0.88, y: 35 }, 
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.42, ease: 'back.out(1.5)' }
    );

    loop();
  }

  function closeGame() {
    isRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    gsap.to(modal, {
      autoAlpha: 0,
      scale: 0.95,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        modal.style.display = 'none';
      }
    });
  }

  // Event Listeners
  if (openBtn) openBtn.addEventListener('click', openGame);
  if (closeBtn) closeBtn.addEventListener('click', closeGame);

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    triggerJump();
  });

  window.addEventListener('keydown', (e) => {
    if (isRunning && (e.code === 'Space' || e.code === 'ArrowUp')) {
      e.preventDefault();
      triggerJump();
    }
  });

  window.addEventListener('resize', () => {
    if (isRunning) resizeCanvas();
  });
}
