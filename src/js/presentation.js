import gsap from 'gsap';

export function revealSarayPresentation() {
  const mainApp = document.getElementById('main-app');
  if (!mainApp) return;

  mainApp.style.visibility = 'visible';

  // Spawn celebratory welcoming micro-sparks around the Meowl stage
  const stage = document.getElementById('meowl-stage');
  function spawnEntranceSparks() {
    if (!stage) return;
    const items = ['✨', '🦉', '💖', '✨', '🎶'];
    const rect = stage.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    items.forEach((emoji, i) => {
      const el = document.createElement('span');
      el.textContent = emoji;
      el.style.position = 'absolute';
      el.style.left = `${centerX}px`;
      el.style.top = `${centerY}px`;
      el.style.fontSize = `${Math.floor(Math.random() * 8 + 18)}px`;
      el.style.pointerEvents = 'none';
      el.style.zIndex = '30';
      stage.appendChild(el);

      const angle = (i / items.length) * Math.PI * 2 + (Math.random() - 0.5);
      const dist = 70 + Math.random() * 60;
      const targetX = Math.cos(angle) * dist;
      const targetY = Math.sin(angle) * dist - 25;

      gsap.fromTo(el,
        { x: 0, y: 0, autoAlpha: 1, scale: 0.4, rotation: 0 },
        {
          x: targetX,
          y: targetY,
          autoAlpha: 0,
          scale: 1.35,
          rotation: (Math.random() - 0.5) * 80,
          duration: 1.3,
          delay: 0.3 + i * 0.08,
          ease: 'power2.out',
          onComplete: () => el.remove()
        }
      );
    });
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' }
  });

  tl.to(mainApp, {
    autoAlpha: 1,
    duration: 0.5
  })
  // 1. Cinematic Title: Blur-to-sharp expansion
  .fromTo('.saray-title',
    { y: 45, autoAlpha: 0, filter: 'blur(16px)', scale: 1.12 },
    { y: 0, autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: 1.0, ease: 'power3.out' },
    '-=0.2'
  )
  // 2. Subtitle with elegant fade
  .fromTo('.saray-sub',
    { y: 16, autoAlpha: 0, filter: 'blur(4px)' },
    { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power2.out' },
    '-=0.7'
  )
  // 3. Iconic Centerpiece Meowl Stage Entrance
  .fromTo('.meowl-stage',
    { scale: 0.68, y: 35, autoAlpha: 0 },
    {
      scale: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.95,
      ease: 'back.out(1.8)',
      onStart: () => spawnEntranceSparks()
    },
    '-=0.6'
  )
  // 4. Luminous Aura Ignition
  .fromTo('#meowl-ambient-aura',
    { scale: 0.25, autoAlpha: 0 },
    { scale: 1, autoAlpha: 0.85, duration: 1.2, ease: 'power2.out' },
    '-=0.8'
  )
  // 5. Staggered Action Pills Cascade with 3D Flip
  .fromTo(['.action-pill', '.action-pill-featured'],
    { y: 32, autoAlpha: 0, scale: 0.9, rotationX: -14 },
    { y: 0, autoAlpha: 1, scale: 1, rotationX: 0, stagger: 0.08, duration: 0.65, ease: 'back.out(1.5)' },
    '-=0.5'
  )
  // 6. Floating Player Dock - Apple Dynamic Island slide-up
  .fromTo('.player-dock',
    { y: 60, autoAlpha: 0, scale: 0.92 },
    { y: 0, autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
    '-=0.5'
  )
  // 7. Album Artwork Pop
  .fromTo('.player-artwork',
    { scale: 0.65, rotation: -15, autoAlpha: 0 },
    { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.55, ease: 'back.out(2)' },
    '-=0.6'
  );

  return tl;
}

