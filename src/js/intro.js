import gsap from 'gsap';

export function setupVideoIntro(onIntroComplete, onUserStart) {
  const videoOverlay = document.getElementById('video-overlay');
  const video = document.getElementById('intro-video');
  const startGate = document.getElementById('video-gate');
  const startBtn = document.getElementById('start-experience-btn');
  const dismissBtn = document.getElementById('dismiss-intro-btn');
  const welcomeSeq = document.getElementById('welcome-sequence');
  const triggerWrap = document.querySelector('.epic-trigger-wrap');
  const lensFlare = document.querySelector('.lens-flare-sweep');

  let fadeOutTriggered = false;
  let isComplete = false;

  // Ultra-Cinematic Web Audio Synthesizer (Sub-Bass Drop & Cosmic Shimmer)
  function playCinematicAudio(type = 'start') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'start') {
        // Deep Cinema Sub-Bass Impact
        const oscSub = ctx.createOscillator();
        const gainSub = ctx.createGain();
        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(110, ctx.currentTime);
        oscSub.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 1.2);

        gainSub.gain.setValueAtTime(0.01, ctx.currentTime);
        gainSub.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.08);
        gainSub.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

        oscSub.connect(gainSub);
        gainSub.connect(ctx.destination);
        oscSub.start();
        oscSub.stop(ctx.currentTime + 1.7);

        // High Harmonic Chime
        const oscHigh = ctx.createOscillator();
        const gainHigh = ctx.createGain();
        oscHigh.type = 'triangle';
        oscHigh.frequency.setValueAtTime(880, ctx.currentTime);
        oscHigh.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.4);
        gainHigh.gain.setValueAtTime(0.12, ctx.currentTime);
        gainHigh.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

        oscHigh.connect(gainHigh);
        gainHigh.connect(ctx.destination);
        oscHigh.start();
        oscHigh.stop(ctx.currentTime + 0.75);
      }
    } catch (e) {
      console.log('Audio suppressed:', e);
    }
  }

  // Pre-video Welcome Refined Cinematic Animation
  if (welcomeSeq && triggerWrap) {
    gsap.set(triggerWrap, { autoAlpha: 0, scale: 0.92, y: 10 });
    gsap.set('.welcome-hero-name', { autoAlpha: 0, scale: 0.96, filter: 'blur(10px)' });
    gsap.set('.welcome-hero-sub', { autoAlpha: 0, y: 6 });
    gsap.set('.welcome-credit', { autoAlpha: 0, y: 6 });

    const welcomeTl = gsap.timeline({ delay: 0.25 });

    welcomeTl
      .to('.welcome-hero-name', {
        autoAlpha: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.0,
        ease: 'power3.out'
      })
      .to('.welcome-hero-sub', {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.4')
      .to('.welcome-credit', {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.3')
      .to(triggerWrap, {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out'
      }, '-=0.2')
      // Subtle pulse hint on trigger to invite interaction
      .to(triggerWrap, {
        scale: 1.03,
        duration: 0.3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 2,
        repeatDelay: 0.5
      }, '-=0.2');
  }

  function startFadeOut(duration = 2.5) {
    if (fadeOutTriggered) return;
    fadeOutTriggered = true;

    // Smooth sound fade out
    if (video && !video.paused) {
      gsap.to(video, {
        volume: 0,
        duration: duration,
        ease: 'power1.out'
      });
    }

    // Smooth cinematic visual fade out to black with Apple spring feel
    gsap.to(videoOverlay, {
      autoAlpha: 0,
      scale: 1.04,
      duration: duration,
      ease: 'power2.inOut',
      onComplete: () => {
        if (video) video.pause();
        videoOverlay.style.display = 'none';
        if (!isComplete) {
          isComplete = true;
          if (typeof onIntroComplete === 'function') {
            onIntroComplete();
          }
        }
      }
    });
  }

  // Epic tactile trigger con spring Apple
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      playCinematicAudio('start');

      if (typeof onUserStart === 'function') {
        onUserStart();
      }

      // Apple-style spring shockwave
      const blastTl = gsap.timeline();

      blastTl
        .to('.epic-trigger-halo', {
          scale: 3.2,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out'
        })
        .to(startBtn, {
          scale: 0.92,
          duration: 0.08,
          ease: 'power2.in'
        }, '-=0.5')
        .to(startBtn, {
          scale: 1.08,
          duration: 0.16,
          ease: 'back.out(2)'
        }, '-=0.08')
        .to(startBtn, {
          scale: 1,
          duration: 0.14,
          ease: 'power2.out'
        }, '-=0.14')
        .to(startGate, {
          autoAlpha: 0,
          scale: 1.04,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            startGate.style.display = 'none';
          }
        }, '-=0.3');

      try {
        video.volume = 1;
        await video.play();
      } catch (err) {
        console.warn('Video play prevented, fallback:', err);
        video.muted = true;
        await video.play();
        video.muted = false;
      }
    });
  }

  if (video) {
    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const remainingTime = video.duration - video.currentTime;
      if (remainingTime <= 2.5 && remainingTime > 0 && !fadeOutTriggered) {
        startFadeOut(remainingTime);
      }
    });

    video.addEventListener('ended', () => {
      startFadeOut(0.5);
    });

    video.addEventListener('error', () => {
      startFadeOut(0.5);
    });
  }

  // Discreet exit in case user wants to jump
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      startFadeOut(0.8);
    });
  }
}
