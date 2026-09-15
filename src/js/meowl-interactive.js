import gsap from 'gsap';

export function setupMeowlInteractive(onToggleMusic) {
  const stage = document.getElementById('meowl-stage');
  const wrapper = document.getElementById('meowl-wrapper');
  const aura = document.getElementById('meowl-ambient-aura');
  const spinBtn = document.getElementById('btn-spin-neck');
  const howsKneeBtn = document.getElementById('btn-hows-knee');

  if (!stage || !wrapper) return;

  // 3D Perspective Setup
  stage.style.perspective = '1100px';

  const xTo = gsap.quickTo(wrapper, 'x', { duration: 0.3, ease: 'power2.out' });
  const yTo = gsap.quickTo(wrapper, 'y', { duration: 0.3, ease: 'power2.out' });
  const rotZTo = gsap.quickTo(wrapper, 'rotation', { duration: 0.35, ease: 'power2.out' });
  const rotYTo = gsap.quickTo(wrapper, 'rotationY', { duration: 0.3, ease: 'power2.out' });
  const rotXTo = gsap.quickTo(wrapper, 'rotationX', { duration: 0.3, ease: 'power2.out' });

  let isDancing = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentDragX = 0;
  let currentDragY = 0;
  let lastClientX = 0;
  let lastClientY = 0;
  let velX = 0;
  let velY = 0;
  let curiosityTimer = null;

  let danceTimeline = null;
  let idleBreathingTimeline = null;

  // Speech bubble element
  const bubble = document.createElement('div');
  bubble.className = 'meowl-speech-bubble';
  bubble.style.display = 'none';
  stage.appendChild(bubble);

  // Floating sparks / notes container
  const fxContainer = document.createElement('div');
  fxContainer.className = 'meowl-fx-container';
  fxContainer.style.position = 'absolute';
  fxContainer.style.inset = '0';
  fxContainer.style.pointerEvents = 'none';
  fxContainer.style.overflow = 'visible';
  stage.appendChild(fxContainer);

  const kneePhrases = [
    "MY KNEE IS 10/10! 🦵✨",
    "HOW'S YOUR KNEE, SARAY? 🦉",
    "NO KNEE PAIN DETECTED! ⚡",
    "MISSING YOUR KNEE 24/7! 🎶",
    "100% HEALTHY KNEE FLEX! 💪"
  ];
  let phraseIdx = 0;

  function spawnFloatingEmoji(emoji, x, y) {
    const el = document.createElement('span');
    el.textContent = emoji;
    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.fontSize = `${Math.floor(Math.random() * 8 + 18)}px`;
    el.style.pointerEvents = 'none';
    el.style.userSelect = 'none';
    el.style.zIndex = '25';
    fxContainer.appendChild(el);

    const destX = x + (Math.random() - 0.5) * 80;
    const destY = y - 70 - Math.random() * 50;

    gsap.fromTo(el,
      { autoAlpha: 1, scale: 0.5, rotation: (Math.random() - 0.5) * 30 },
      {
        x: destX - x,
        y: destY - y,
        autoAlpha: 0,
        scale: 1.3,
        rotation: (Math.random() - 0.5) * 60,
        duration: 1.2,
        ease: 'power2.out',
        onComplete: () => el.remove()
      }
    );
  }

  function showBubble(text, duration = 2.0) {
    bubble.textContent = text;
    bubble.style.display = 'block';

    gsap.killTweensOf(bubble);
    gsap.fromTo(bubble,
      { autoAlpha: 0, y: 15, scale: 0.75 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' }
    );

    gsap.to(bubble, {
      autoAlpha: 0,
      y: -12,
      scale: 0.9,
      duration: 0.3,
      delay: duration,
      ease: 'power2.in',
      onComplete: () => {
        bubble.style.display = 'none';
      }
    });
  }



  // 1. Natural Organic Idle Breathing & Living Curiosity
  function startIdleBreathing() {
    if (idleBreathingTimeline) idleBreathingTimeline.kill();
    idleBreathingTimeline = gsap.timeline({ repeat: -1, yoyo: true })
      .to(wrapper, {
        scaleY: 1.025,
        scaleX: 0.985,
        duration: 2.2,
        ease: 'sine.inOut'
      })
      .to(wrapper, {
        scaleY: 0.99,
        scaleX: 1.01,
        duration: 2.0,
        ease: 'sine.inOut'
      });

    resetCuriosityTimer();
  }

  function resetCuriosityTimer() {
    clearTimeout(curiosityTimer);
    curiosityTimer = setTimeout(() => {
      triggerCuriosityTwitch();
    }, 6000 + Math.random() * 4000);
  }

  function triggerCuriosityTwitch() {
    if (isDancing || isDragging) {
      resetCuriosityTimer();
      return;
    }
    const tilt = Math.random() > 0.5 ? 9 : -9;
    gsap.timeline({
      onComplete: () => resetCuriosityTimer()
    })
      .to(wrapper, { rotation: tilt, scaleY: 1.04, duration: 0.25, ease: 'power2.out' })
      .to(wrapper, { rotation: tilt, duration: 0.8 })
      .to(wrapper, { rotation: 0, scaleY: 1, duration: 0.35, ease: 'elastic.out(1.1, 0.4)' });
  }

  function pauseIdleBreathing() {
    clearTimeout(curiosityTimer);
    if (idleBreathingTimeline) {
      idleBreathingTimeline.pause();
    }
  }

  function resumeIdleBreathing() {
    if (idleBreathingTimeline && !isDancing && !isDragging) {
      idleBreathingTimeline.resume();
      resetCuriosityTimer();
    }
  }

  startIdleBreathing();

  // 2. Interactive Pointer Follow, Directional Poke & Fling Drag
  function handlePointerDown(e) {
    if (isDancing) return;
    isDragging = true;
    pauseIdleBreathing();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartX = clientX;
    dragStartY = clientY;
    lastClientX = clientX;
    lastClientY = clientY;
    velX = 0;
    velY = 0;
    currentDragX = 0;
    currentDragY = 0;

    gsap.to(wrapper, { scale: 1.06, duration: 0.15, ease: 'power2.out' });
  }

  function handlePointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (isDragging) {
      velX = clientX - lastClientX;
      velY = clientY - lastClientY;
      lastClientX = clientX;
      lastClientY = clientY;

      currentDragX = (clientX - dragStartX) * 0.75;
      currentDragY = (clientY - dragStartY) * 0.75;

      // Bound drag limits
      currentDragX = Math.max(-110, Math.min(110, currentDragX));
      currentDragY = Math.max(-85, Math.min(85, currentDragY));

      xTo(currentDragX);
      yTo(currentDragY);
      rotZTo(currentDragX * 0.18 + velX * 0.12);
      rotYTo(currentDragX * 0.25);
      rotXTo(-currentDragY * 0.2);
      return;
    }

    if (isDancing) return;

    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (clientX - centerX) / (rect.width / 2);
    const deltaY = (clientY - centerY) / (rect.height / 2);

    const clampedX = Math.max(-1.4, Math.min(1.4, deltaX));
    const clampedY = Math.max(-1.4, Math.min(1.4, deltaY));

    // 3D Parallax Tilt & Follow Gaze
    rotZTo(clampedX * 12);
    rotYTo(clampedX * 20);
    rotXTo(-clampedY * 16);
    xTo(clampedX * 14);
    yTo(clampedY * 10);
  }

  function handlePointerUp() {
    if (isDragging) {
      isDragging = false;

      // Inertia fling overshoot before snapping back
      const flingX = Math.max(-40, Math.min(40, velX * 3));
      const flingY = Math.max(-30, Math.min(30, velY * 2.5));

      gsap.timeline({
        onComplete: () => {
          resumeIdleBreathing();
        }
      })
        .to(wrapper, {
          x: currentDragX + flingX,
          y: currentDragY + flingY,
          duration: 0.12,
          ease: 'power1.out'
        })
        .to(wrapper, {
          x: 0,
          y: 0,
          rotation: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.85,
          ease: 'elastic.out(1.2, 0.4)'
        });

      return;
    }

    if (!isDancing) {
      rotZTo(0);
      rotYTo(0);
      rotXTo(0);
      xTo(0);
      yTo(0);
      resumeIdleBreathing();
    }
  }

  stage.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);

  stage.addEventListener('touchstart', handlePointerDown, { passive: true });
  window.addEventListener('touchmove', handlePointerMove, { passive: true });
  window.addEventListener('touchend', handlePointerUp);

  // Directional Poke & Squish when tapping Meowl
  stage.addEventListener('click', (e) => {
    if (isDragging) return;

    const rect = stage.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;

    const relX = (x - rect.width / 2) / (rect.width / 2);
    const relY = (y - rect.height / 2) / (rect.height / 2);

    spawnFloatingEmoji('✨', x, y);

    // Direction-aware squishy elasticity
    const tiltDirection = relX > 0 ? -12 : 12;
    const squishY = relY > 0 ? 0.82 : 1.15;
    const squishX = relY > 0 ? 1.18 : 0.88;

    gsap.timeline({
      onComplete: () => resumeIdleBreathing()
    })
      .to(wrapper, {
        scaleY: squishY,
        scaleX: squishX,
        rotation: tiltDirection,
        y: relY * 18,
        duration: 0.12,
        ease: 'power2.in'
      })
      .to(wrapper, {
        scaleY: 1.12,
        scaleX: 0.92,
        rotation: -tiltDirection * 0.4,
        y: -22,
        duration: 0.2,
        ease: 'power2.out'
      })
      .to(wrapper, {
        scaleY: 1,
        scaleX: 1,
        rotation: 0,
        y: 0,
        duration: 0.45,
        ease: 'elastic.out(1.2, 0.4)'
      });
  });

  // Action 1: Ultra-Dynamic 360° Neck Spin (Anticipation, Hyper Speed, Dizzy Settle)
  if (spinBtn) {
    spinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pauseIdleBreathing();
      showBubble("🌪️ 360° HYPER-SPIN!", 2.0);

      const rect = wrapper.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const centerX = rect.left - stageRect.left + rect.width / 2;
      const centerY = rect.top - stageRect.top + rect.height / 2;

      // Burst of wind vortex sparkles
      for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnFloatingEmoji(i % 2 === 0 ? '🌪️' : '✨', centerX + (Math.random() - 0.5) * 60, centerY), i * 110);
      }

      gsap.timeline({
        onComplete: () => resumeIdleBreathing()
      })
        // 1. Anticipation wind-up
        .to(wrapper, {
          rotation: -45,
          scaleY: 0.84,
          scaleX: 1.16,
          duration: 0.22,
          ease: 'power2.in'
        })
        // 2. Hyper-speed full 720 double rotation with motion blur
        .to(wrapper, {
          rotation: 720,
          filter: 'blur(3.5px)',
          duration: 0.65,
          ease: 'power3.inOut'
        })
        // 3. Landing overshoot & clear blur
        .to(wrapper, {
          rotation: 728,
          filter: 'blur(0px)',
          scaleY: 1.1,
          scaleX: 0.92,
          duration: 0.15,
          ease: 'power1.out'
        })
        // 4. Comedic dizzy head shake
        .to(wrapper, { rotation: 712, duration: 0.12, ease: 'power1.inOut' })
        .to(wrapper, { rotation: 724, duration: 0.1, ease: 'power1.inOut' })
        .to(wrapper, {
          rotation: 0,
          scaleY: 1,
          scaleX: 1,
          duration: 0.38,
          ease: 'elastic.out(1.15, 0.45)'
        });
    });
  }

  // Shockwave ring for Knee Reaction
  function triggerKneeShockwave(x, y) {
    const ring = document.createElement('div');
    ring.style.position = 'absolute';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.width = '30px';
    ring.style.height = '30px';
    ring.style.borderRadius = '50%';
    ring.style.border = '2px solid rgba(255, 117, 151, 0.8)';
    ring.style.boxShadow = '0 0 16px rgba(255, 117, 151, 0.6)';
    ring.style.transform = 'translate(-50%, -50%)';
    ring.style.pointerEvents = 'none';
    ring.style.zIndex = '22';
    stage.appendChild(ring);

    gsap.to(ring, {
      scale: 5,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: () => ring.remove()
    });
  }

  // Action 2: How's your knee button with Shockwave, Joyful Hop & floating notes
  if (howsKneeBtn) {
    howsKneeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pauseIdleBreathing();

      const phrase = kneePhrases[phraseIdx % kneePhrases.length];
      phraseIdx++;
      showBubble(phrase, 2.2);

      const rect = wrapper.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const centerX = rect.left - stageRect.left + rect.width / 2;
      const centerY = rect.top - stageRect.top + rect.height * 0.68; // Knee level

      triggerKneeShockwave(centerX, centerY);

      spawnFloatingEmoji('🦵', centerX - 30, centerY - 20);
      spawnFloatingEmoji('🎶', centerX + 30, centerY - 20);
      spawnFloatingEmoji('✨', centerX, centerY - 40);

      // Joyful double hop wiggle with squash & stretch
      gsap.timeline({
        onComplete: () => resumeIdleBreathing()
      })
        .to(wrapper, { y: -30, rotation: -9, scaleY: 1.12, scaleX: 0.9, duration: 0.16, ease: 'power2.out' })
        .to(wrapper, { y: 0, rotation: 9, scaleY: 0.92, scaleX: 1.08, duration: 0.14, ease: 'power1.in' })
        .to(wrapper, { y: -18, rotation: -4, scaleY: 1.06, scaleX: 0.95, duration: 0.14, ease: 'power2.out' })
        .to(wrapper, { y: 0, rotation: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: 'elastic.out(1.15, 0.45)' });

      if (typeof onToggleMusic === 'function') {
        onToggleMusic();
      }
    });
  }

  // 3. Groovy Beat Dancing (Sync with 120 BPM song tempo = 0.5s cycle)
  return {
    startBeatBobbing() {
      isDancing = true;
      pauseIdleBreathing();
      if (danceTimeline) danceTimeline.kill();

      danceTimeline = gsap.timeline({ repeat: -1, yoyo: true })
        .to(wrapper, {
          y: -16,
          rotation: 6,
          rotationY: 8,
          scaleY: 1.05,
          scaleX: 0.96,
          duration: 0.25,
          ease: 'power1.out'
        })
        .to(wrapper, {
          y: 0,
          rotation: -6,
          rotationY: -8,
          scaleY: 0.95,
          scaleX: 1.04,
          duration: 0.25,
          ease: 'power1.in'
        });

      // Pulse background aura with music
      if (aura) {
        gsap.to(aura, {
          scale: 1.3,
          opacity: 0.9,
          duration: 0.25,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }
    },
    stopBeatBobbing() {
      isDancing = false;
      if (danceTimeline) {
        danceTimeline.kill();
        danceTimeline = null;
      }
      if (aura) {
        gsap.killTweensOf(aura);
        gsap.to(aura, { scale: 1, opacity: 0.6, duration: 0.5 });
      }
      gsap.to(wrapper, {
        y: 0,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => resumeIdleBreathing()
      });
    }
  };
}
