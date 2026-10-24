import gsap from 'gsap';
import { sfx } from '../audio-fx.js';

export function setupMeowlJump() {
  const modal = document.getElementById('jump-modal');
  const canvas = document.getElementById('jump-canvas');
  const closeBtn = document.getElementById('btn-close-jump');

  if (!modal || !canvas) return;

  const ctx = canvas.getContext('2d');

  // Load Meowl Jump Sprite
  const catImg = new Image();
  catImg.src = '/images/flappy-cat.png';

  let animId = null;
  let isRunning = false;
  let onGameOverCb = null;

  let width = 0;
  let height = 0;

  // Game variables
  let score = 0;
  let heightReached = 0;
  let coinsCollected = 0;
  let isGameOver = false;

  // Meowl Jumper
  const player = {
    x: 0,
    y: 0,
    w: 50,
    h: 50,
    vx: 0,
    vy: 0,
    targetX: 0,
    speed: 0.32,
    jumpPower: -10.5
  };

  const gravity = 0.32;
  let platforms = [];
  let cameraY = 0;

  function resizeCanvas() {
    const isLandscape = window.innerWidth > window.innerHeight && window.innerHeight < 550;
    if (isLandscape) {
      width = Math.min(480, window.innerWidth - 48);
      height = Math.min(300, window.innerHeight - 80);
    } else {
      width = Math.min(390, window.innerWidth - 32);
      height = Math.min(520, window.innerHeight - 150);
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetGame() {
    score = 0;
    heightReached = 0;
    coinsCollected = 0;
    isGameOver = false;
    cameraY = 0;

    player.x = width / 2;
    player.targetX = width / 2;
    player.y = height - 120;
    player.vy = player.jumpPower;

    // Generate initial platforms
    platforms = [];
    // Base platform
    platforms.push({ x: width / 2 - 40, y: height - 50, w: 80, h: 12, type: 'normal' });

    let currentY = height - 110;
    while (currentY > -height * 2) {
      spawnPlatform(currentY);
      currentY -= 55 + Math.random() * 25;
    }
  }

  function spawnPlatform(y) {
    const platW = 60 + Math.random() * 20;
    const platX = 10 + Math.random() * (width - platW - 20);
    const rand = Math.random();

    let type = 'normal';
    let hasCoin = false;

    if (rand < 0.15) {
      type = 'spring'; // High jump booster
    } else if (rand < 0.35) {
      hasCoin = true;
    }

    platforms.push({
      x: platX,
      y,
      w: platW,
      h: 10,
      type,
      hasCoin
    });
  }

  function update() {
    if (isGameOver) return;

    // Horizontal smooth tracking
    player.x += (player.targetX - player.x) * player.speed;

    // Screen wrapping (wrap around left/right edges)
    if (player.x < -player.w / 2) player.x = width + player.w / 2;
    if (player.x > width + player.w / 2) player.x = -player.w / 2;

    // Vertical physics
    player.vy += gravity;
    player.y += player.vy;

    // Check collision with platforms (only when falling downward)
    if (player.vy > 0) {
      for (const p of platforms) {
        if (
          player.x + player.w / 3 > p.x &&
          player.x - player.w / 3 < p.x + p.w &&
          player.y + player.h / 2 >= p.y &&
          player.y + player.h / 2 <= p.y + p.h + player.vy + 2
        ) {
          // Landed on platform!
          if (p.type === 'spring') {
            player.vy = player.jumpPower * 1.5;
            sfx.coin();
            if (navigator.vibrate) navigator.vibrate(25);
          } else {
            player.vy = player.jumpPower;
            sfx.feed();
            if (navigator.vibrate) navigator.vibrate(12);
          }
          player.y = p.y - player.h / 2;

          // Collect coin if present
          if (p.hasCoin) {
            p.hasCoin = false;
            coinsCollected++;
            sfx.coin();
          }
          break;
        }
      }
    }

    // Camera scrolling when player jumps higher than middle of screen
    const midScreen = height * 0.45;
    if (player.y < midScreen) {
      const diff = midScreen - player.y;
      player.y = midScreen;
      cameraY += diff;
      score = Math.floor(cameraY / 10);

      // Move platforms down
      for (const p of platforms) {
        p.y += diff;
      }

      // Remove platforms that scrolled off bottom & spawn new ones at top
      platforms = platforms.filter(p => p.y < height + 40);

      const highestPlat = platforms.reduce((min, p) => p.y < min ? p.y : min, height);
      if (highestPlat > -60) {
        spawnPlatform(highestPlat - (55 + Math.random() * 25));
      }
    }

    // Check game over (fell off bottom)
    if (player.y > height + 40) {
      triggerGameOver();
    }
  }

  function triggerGameOver() {
    isGameOver = true;
    sfx.click();
    if (navigator.vibrate) navigator.vibrate(40);

    const prevHigh = parseInt(localStorage.getItem('srgatos_jump_high') || '0', 10);
    if (score > prevHigh) {
      localStorage.setItem('srgatos_jump_high', score.toString());
    }

    if (typeof onGameOverCb === 'function') {
      onGameOverCb(score, coinsCollected);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Deep Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#0d1326');
    sky.addColorStop(0.5, '#191b35');
    sky.addColorStop(1, '#2c1e30');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Altura: ${score}m`, 16, 28);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD60A';
    ctx.fillText(`🪙 +${coinsCollected}`, width - 16, 28);

    // Draw Platforms
    for (const p of platforms) {
      if (p.type === 'spring') {
        // High jump spring platform (gold)
        ctx.fillStyle = '#FFD60A';
        ctx.shadowColor = 'rgba(255, 214, 10, 0.4)';
        ctx.shadowBlur = 8;
      } else {
        // Normal platform (emerald green)
        ctx.fillStyle = '#30D158';
        ctx.shadowColor = 'rgba(48, 209, 88, 0.3)';
        ctx.shadowBlur = 4;
      }

      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Platform Coin
      if (p.hasCoin) {
        ctx.font = '16px system-ui, apple-color-emoji, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪙', p.x + p.w / 2, p.y - 8);
      }
    }

    // Draw Player (Meowl Sprite)
    ctx.save();
    ctx.translate(player.x, player.y);
    if (catImg.complete && catImg.naturalWidth > 0) {
      ctx.drawImage(catImg, -player.w / 2, -player.h / 2, player.w, player.h);
    } else {
      ctx.font = '36px system-ui, apple-color-emoji, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐱', 0, 0);
    }
    ctx.restore();

    // Game Over Overlay
    if (isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡CAÍSTE!', width / 2, height * 0.38);

      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64D2FF';
      ctx.fillText(`Altura alcanzada: ${score} m`, width / 2, height * 0.46);

      ctx.fillStyle = '#FFD60A';
      ctx.fillText(`Monedas recogidas: +${coinsCollected} 🪙`, width / 2, height * 0.52);

      const high = localStorage.getItem('srgatos_jump_high') || score;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Récord de salto: ${high} m`, width / 2, height * 0.58);

      ctx.fillStyle = '#30D158';
      ctx.font = '700 15px system-ui, -apple-system, sans-serif';
      ctx.fillText('Toca para volver a saltar', width / 2, height * 0.68);
    }
  }

  function loop() {
    if (!isRunning) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function openGame(cb) {
    onGameOverCb = cb || null;
    modal.style.display = 'flex';
    resizeCanvas();
    resetGame();
    isRunning = true;

    gsap.fromTo(modal,
      { autoAlpha: 0, scale: 0.9 },
      { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }
    );

    loop();
  }

  function closeGame() {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);

    gsap.to(modal, {
      autoAlpha: 0,
      scale: 0.95,
      duration: 0.2,
      onComplete: () => {
        modal.style.display = 'none';
      }
    });
  }

  // Pointer and Touch controls (Ultra-responsive mobile dragging & side-steering)
  let isPointerActive = false;

  function handlePointer(clientX) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = clientX - rect.left;
    player.targetX = touchX;
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    isPointerActive = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}

    if (isGameOver) {
      resetGame();
      return;
    }
    handlePointer(e.clientX);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isPointerActive && e.buttons === 0) return;
    e.preventDefault();
    handlePointer(e.clientX);
  });

  canvas.addEventListener('pointerup', (e) => {
    isPointerActive = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  canvas.addEventListener('pointercancel', () => {
    isPointerActive = false;
  });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isGameOver) {
      resetGame();
      return;
    }
    if (e.touches && e.touches[0]) {
      handlePointer(e.touches[0].clientX);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches && e.touches[0]) {
      handlePointer(e.touches[0].clientX);
    }
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (!isRunning) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      player.targetX = Math.max(20, player.x - 70);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      player.targetX = Math.min(width - 20, player.x + 70);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeGame);

  window.addEventListener('resize', () => {
    if (isRunning) resizeCanvas();
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (isRunning) resizeCanvas();
    }, 150);
  });

  return {
    openGame,
    closeGame
  };
}
