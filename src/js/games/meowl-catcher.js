import gsap from 'gsap';
import { sfx } from '../audio-fx.js';

export function setupMeowlCatcher() {
  const modal = document.getElementById('catcher-modal');
  const canvas = document.getElementById('catcher-canvas');
  const closeBtn = document.getElementById('btn-close-catcher');

  if (!modal || !canvas) return;

  const ctx = canvas.getContext('2d');

  // Load Meowl Catcher Sprites
  const basketImg = new Image();
  basketImg.src = '/images/flappy-cat.png';

  let animId = null;
  let isRunning = false;
  let onGameOverCb = null;

  let width = 0;
  let height = 0;

  // Game State
  let score = 0;
  let coinsCollected = 0;
  let lives = 3;
  let isGameOver = false;

  // Meowl Paddle
  const player = {
    x: 0,
    y: 0,
    targetX: 0,
    w: 64,
    h: 64,
    speed: 0.25
  };

  // Falling Items
  let items = [];
  let spawnTimer = 0;
  let spawnInterval = 45; // Frames between spawns

  const ITEM_TYPES = [
    { type: 'fish', emoji: '🐟', score: 10, isHazard: false, weight: 35 },
    { type: 'cookie', emoji: '🍪', score: 15, isHazard: false, weight: 25 },
    { type: 'pizza', emoji: '🍕', score: 25, isHazard: false, weight: 15 },
    { type: 'coin', emoji: '🪙', score: 5, isCoin: true, isHazard: false, weight: 15 },
    { type: 'rock', emoji: '💣', score: 0, isHazard: true, weight: 15 }
  ];

  function getWeightedRandomItem() {
    const totalWeight = ITEM_TYPES.reduce((acc, i) => acc + i.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of ITEM_TYPES) {
      if (rand < item.weight) return item;
      rand -= item.weight;
    }
    return ITEM_TYPES[0];
  }

  function resizeCanvas() {
    const wrap = document.getElementById('catcher-canvas-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.floor(rect.width);
    height = Math.floor(rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    player.y = height - player.h - 16;
    player.x = width / 2;
    player.targetX = width / 2;
  }

  function resetGame() {
    score = 0;
    coinsCollected = 0;
    lives = 3;
    isGameOver = false;
    items = [];
    spawnTimer = 0;
    spawnInterval = 45;
    player.x = width / 2;
    player.targetX = width / 2;
  }

  function spawnItem() {
    const template = getWeightedRandomItem();
    const fallSpeed = 2.8 + Math.random() * 1.8 + Math.min(score / 150, 3.5);

    items.push({
      ...template,
      x: 30 + Math.random() * (width - 60),
      y: -30,
      vy: fallSpeed,
      size: template.isCoin ? 28 : 32,
      rotation: (Math.random() - 0.5) * 0.4
    });
  }

  function update() {
    if (isGameOver) return;

    // Smooth player drag interpolation
    player.x += (player.targetX - player.x) * player.speed;
    player.x = Math.max(player.w / 2, Math.min(width - player.w / 2, player.x));

    // Spawn items
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnItem();
      // Increase spawn rate slightly over time
      if (spawnInterval > 22) spawnInterval -= 0.15;
    }

    // Update items & collision detection
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy;

      // Check collision with player
      const dx = it.x - player.x;
      const dy = it.y - (player.y + player.h / 2);
      const dist = Math.hypot(dx, dy);

      if (dist < (player.w / 2 + it.size / 2 - 6)) {
        // Caught!
        if (it.isHazard) {
          // Hit rock/bomb
          lives--;
          sfx.click();
          if (navigator.vibrate) navigator.vibrate(60);

          if (lives <= 0) {
            triggerGameOver();
            return;
          }
        } else {
          // Food or Coin caught!
          score += it.score;
          if (it.isCoin) {
            coinsCollected++;
            sfx.coin();
          } else {
            sfx.feed();
          }
        }
        items.splice(i, 1);
        continue;
      }

      // Fell off screen
      if (it.y > height + 40) {
        // If it was food (not hazard or coin), miss penalty? (no penalty, just missed)
        items.splice(i, 1);
      }
    }
  }

  function triggerGameOver() {
    isGameOver = true;
    sfx.click();

    // High score save
    const prevHigh = parseInt(localStorage.getItem('srgatos_catcher_high') || '0', 10);
    if (score > prevHigh) {
      localStorage.setItem('srgatos_catcher_high', score.toString());
    }

    if (typeof onGameOverCb === 'function') {
      onGameOverCb(score, coinsCollected);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Warm Sunset Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#101018');
    sky.addColorStop(0.5, '#1e1628');
    sky.addColorStop(1, '#2c1e24');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // HUD Top Bar
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Puntos: ${score}`, 16, 28);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD60A';
    ctx.fillText(`🪙 +${coinsCollected}`, width / 2, 28);

    ctx.textAlign = 'right';
    let hearts = '';
    for (let h = 0; h < lives; h++) hearts += '❤️';
    ctx.fillText(hearts, width - 16, 28);

    // Draw Falling Items
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const it of items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.font = `${it.size}px system-ui, apple-color-emoji, sans-serif`;
      ctx.fillText(it.emoji, 0, 0);
      ctx.restore();
    }

    // Draw Player (Meowl Sprite)
    ctx.save();
    ctx.translate(player.x, player.y);
    if (basketImg.complete && basketImg.naturalWidth > 0) {
      ctx.drawImage(basketImg, -player.w / 2, 0, player.w, player.h);
    } else {
      ctx.font = '40px system-ui, apple-color-emoji, sans-serif';
      ctx.fillText('🐱', 0, player.h / 2);
    }
    ctx.restore();

    // Game Over Overlay
    if (isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡FIN DEL JUEGO!', width / 2, height * 0.38);

      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFD60A';
      ctx.fillText(`Puntuación: ${score}`, width / 2, height * 0.46);
      ctx.fillText(`Monedas ganadas: +${coinsCollected} 🪙`, width / 2, height * 0.52);

      const high = localStorage.getItem('srgatos_catcher_high') || score;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Récord: ${high}`, width / 2, height * 0.58);

      ctx.fillStyle = '#30D158';
      ctx.font = '700 15px system-ui, -apple-system, sans-serif';
      ctx.fillText('Toca la pantalla para reintentar', width / 2, height * 0.68);
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

  // Pointer controls (1:1 finger tracking)
  function handlePointer(clientX) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    player.targetX = clientX - rect.left;
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);

    if (isGameOver) {
      resetGame();
      return;
    }
    handlePointer(e.clientX);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons > 0) {
      handlePointer(e.clientX);
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  if (closeBtn) closeBtn.addEventListener('click', closeGame);

  window.addEventListener('resize', () => {
    if (isRunning) resizeCanvas();
  });

  return {
    openGame,
    closeGame
  };
}
