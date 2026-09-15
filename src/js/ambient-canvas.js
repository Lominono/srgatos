export function setupAmbientCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'ambient-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  canvas.style.opacity = '0.7';

  const mainApp = document.getElementById('main-app');
  if (mainApp) {
    document.body.insertBefore(canvas, mainApp);
  } else {
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = Math.min(45, Math.floor(width / 14));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.35 - 0.1,
      alpha: Math.random() * 0.5 + 0.2,
      maxAlpha: Math.random() * 0.5 + 0.3,
      hue: Math.random() > 0.6 ? 340 : 215 // Subtle pink or blue luminescence
    });
  }

  let mouseX = width / 2;
  let mouseY = height / 2;

  window.addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  let animId = null;

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      // Interactive gentle repulse from pointer
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.hypot(dx, dy);
      if (dist < 100) {
        const force = (100 - dist) / 100;
        p.x += (dx / dist) * force * 1.5;
        p.y += (dy / dist) * force * 1.5;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${p.hue}, 80%, 75%, ${p.alpha * 0.8})`;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    animId = requestAnimationFrame(render);
  }

  render();

  return {
    destroy: () => {
      if (animId) cancelAnimationFrame(animId);
      canvas.remove();
    }
  };
}
