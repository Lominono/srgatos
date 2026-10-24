import gsap from 'gsap';

export function revealSarayPresentation() {
  const mainApp = document.getElementById('main-app');
  if (!mainApp) return;

  mainApp.style.visibility = 'visible';

  // Spawn cinematic luminous aura ripples around the Meowl
  const stage = document.getElementById('meowl-stage');
  function spawnEntranceGleam() {
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.style.position = 'absolute';
      ring.style.left = `${centerX}px`;
      ring.style.top = `${centerY}px`;
      ring.style.width = '60px';
      ring.style.height = '60px';
      ring.style.borderRadius = '50%';
      ring.style.border = i % 2 === 0 ? '1px solid rgba(255, 117, 151, 0.45)' : '1px solid rgba(100, 210, 255, 0.35)';
      ring.style.boxShadow = i % 2 === 0 ? '0 0 25px rgba(255, 117, 151, 0.3)' : '0 0 25px rgba(10, 132, 255, 0.25)';
      ring.style.transform = 'translate(-50%, -50%)';
      ring.style.pointerEvents = 'none';
      ring.style.zIndex = '5';
      stage.appendChild(ring);

      gsap.fromTo(ring,
        { scale: 0.3, autoAlpha: 0.8 },
        {
          scale: 3.8 + i * 0.8,
          autoAlpha: 0,
          duration: 1.4 + i * 0.2,
          delay: i * 0.18,
          ease: 'power2.out',
          onComplete: () => ring.remove()
        }
      );
    }
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' }
  });

  tl.to(mainApp, {
    autoAlpha: 1,
    duration: 0.5
  })
  // 1. Cinematic Title: Clean vertical glide with contrast settle
  .fromTo('.saray-title',
    { y: 35, autoAlpha: 0, filter: 'blur(12px)', scale: 1.08 },
    { y: 0, autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: 0.9, ease: 'power3.out' },
    '-=0.2'
  )
  // 2. Subtitle with subtle precision fade
  .fromTo('.saray-sub',
    { y: 12, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' },
    '-=0.6'
  )
  // 3. Iconic Centerpiece Meowl Entrance
  .fromTo('.meowl-stage',
    { scale: 0.85, y: 25, autoAlpha: 0 },
    {
      scale: 1,
      y: 0,
      autoAlpha: 1,
      duration: 0.85,
      ease: 'back.out(1.4)',
      onStart: () => spawnEntranceGleam()
    },
    '-=0.5'
  )
  // 4. Ambient Aura bloom
  .fromTo('#meowl-ambient-aura',
    { scale: 0.4, autoAlpha: 0 },
    { scale: 1, autoAlpha: 0.85, duration: 1.1, ease: 'power2.out' },
    '-=0.7'
  )
  // 5. Staggered Action Pills Entrance
  .fromTo(['.action-pill', '.action-pill-featured'],
    { y: 24, autoAlpha: 0, scale: 0.94 },
    { y: 0, autoAlpha: 1, scale: 1, stagger: 0.06, duration: 0.55, ease: 'power2.out' },
    '-=0.45'
  )
  // 6. Floating Player Dock - Apple Dynamic Island slide-up
  .fromTo('.player-dock',
    { y: 45, autoAlpha: 0, scale: 0.96 },
    { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out' },
    '-=0.45'
  )
  // 7. Album Artwork Pop
  .fromTo('.player-artwork',
    { scale: 0.75, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(1.8)' },
    '-=0.5'
  );

  return tl;
}


