import gsap from 'gsap';

export function setupAudioPlayer(getMeowlController) {
  const audio = new Audio('/audio/hao-xiang-ni.mp3');
  audio.preload = 'auto';

  const playBtn = document.getElementById('player-play-btn');
  const playIcon = document.getElementById('player-play-icon');
  const waveform = document.getElementById('player-waveform');
  const lyricLine = document.getElementById('player-lyric-line');
  const progressBar = document.getElementById('player-progress-fill');
  const progressContainer = document.getElementById('player-progress-track');
  const timeCurrent = document.getElementById('player-time-current');
  const timeTotal = document.getElementById('player-time-total');

  let isPlaying = false;
  let currentIndex = -1;

  // Ultra-precise verified timestamped lyrics for Joyce Chu - 好想你 ("How's your knee")
  const lyrics = [
    { time: 0.0, text: "🎶 [Ukulele Intro] — Get ready for Saray..." },
    { time: 2.7, text: "I wanna send a text to ask your knee" },
    { time: 5.6, text: "How's your knee, how's your knee... 🦉" },
    { time: 8.2, text: "I wanna call you now to check your knee" },
    { time: 10.8, text: "How's your knee, how's your knee... 🎶" },
    { time: 13.3, text: "First thing in the morning when I wake up" },
    { time: 16.1, text: "Is: how's your knee, how's your knee!" },
    { time: 18.8, text: "Whether it's sunny or it's pouring rain" },
    { time: 21.5, text: "All I care is: how's your knee!" },
    { time: 24.2, text: "Every time I ask you: How's your knee?" },
    { time: 27.2, text: "You never quite believe me..." },
    { time: 29.6, text: "Yet you keep on asking if I miss your knee!" },
    { time: 35.0, text: "I don't know fancy lines or poetry" },
    { time: 37.6, text: "So I just ask: how's your knee!" },
    { time: 40.3, text: "All I really want is making you smile 😊" },
    { time: 42.3, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!" },
    { time: 47.5, text: "Really, truly, how's your knee! ❤️" },
    { time: 49.8, text: "For real, no cap, how's your knee! ✨" },
    { time: 52.3, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!" },
    { time: 57.4, text: "Super duper intensely: how's your knee!" },
    { time: 59.7, text: "From the bottom of my heart: how's your knee!" },
    { time: 62.1, text: "How's your knee... 🦉" },
    { time: 64.5, text: "🎶 [Ukulele Whistle Interlude] 🎶" },
    { time: 74.5, text: "Every single day and every night..." },
    { time: 77.2, text: "I wonder if your knee is doing alright!" },
    { time: 82.5, text: "Even in my dreams, I ask your knee..." },
    { time: 85.2, text: "How's your knee, how's your knee! 🎶" },
    { time: 94.0, text: "I don't know fancy lines or poetry" },
    { time: 96.6, text: "So I just ask: how's your knee!" },
    { time: 99.3, text: "All I really want is making you smile 😊" },
    { time: 101.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!" },
    { time: 106.7, text: "Really, truly, how's your knee! ❤️" },
    { time: 109.0, text: "For real, no cap, how's your knee! ✨" },
    { time: 111.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!" },
    { time: 116.6, text: "Super duper intensely: how's your knee!" },
    { time: 118.9, text: "From the bottom of my heart: how's your knee!" },
    { time: 121.3, text: "How's your knee... 🦉" },
    { time: 124.0, text: "🎸 [Guitar & Whistle Solo] 🎸" },
    { time: 131.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!" },
    { time: 136.7, text: "Really, truly, how's your knee! ❤️" },
    { time: 139.0, text: "For real, no cap, how's your knee! ✨" },
    { time: 141.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!" },
    { time: 146.6, text: "Super intensely: HOW'S YOUR KNEE!" },
    { time: 148.9, text: "Saray, forever: HOW'S YOUR KNEE!" },
    { time: 151.4, text: "How's your knee... ❤️" },
    { time: 154.5, text: "How's your knee... ✨" }
  ];

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateLyrics(currentTime) {
    if (!lyricLine) return;

    let activeIdx = 0;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx !== currentIndex) {
      currentIndex = activeIdx;
      const current = lyrics[currentIndex];

      // Kinetic Apple Music style lyric pop transition with motion blur
      gsap.timeline()
        .to(lyricLine, {
          y: -8,
          autoAlpha: 0.15,
          filter: 'blur(3px)',
          duration: 0.13,
          ease: 'power2.in',
          onComplete: () => {
            lyricLine.textContent = current.text;
          }
        })
        .fromTo(lyricLine, 
          { y: 8, autoAlpha: 0.15, filter: 'blur(3px)', scale: 0.96 },
          { y: 0, autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: 0.35, ease: 'back.out(1.8)' }
        );
    }
  }

  function updateProgress() {
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (timeCurrent) {
      timeCurrent.textContent = formatTime(audio.currentTime);
    }
    if (timeTotal && (!timeTotal.textContent || timeTotal.textContent === '0:00')) {
      timeTotal.textContent = formatTime(audio.duration);
    }
  }

  async function togglePlay() {
    const meowl = getMeowlController();

    // Tactile button spring pulse
    if (playBtn) {
      gsap.timeline()
        .to(playBtn, { scale: 0.86, duration: 0.08, ease: 'power2.in' })
        .to(playBtn, { scale: 1.08, duration: 0.18, ease: 'back.out(2.2)' })
        .to(playBtn, { scale: 1, duration: 0.16, ease: 'power2.out' });
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      if (playIcon) playIcon.innerHTML = '▶';
      if (waveform) waveform.classList.remove('playing');
      if (meowl) meowl.stopBeatBobbing();
    } else {
      try {
        await audio.play();
        isPlaying = true;
        if (playIcon) playIcon.innerHTML = '❚❚';
        if (waveform) waveform.classList.add('playing');
        if (meowl) meowl.startBeatBobbing();
      } catch (err) {
        console.warn('Audio play error:', err);
      }
    }
  }

  async function play() {
    if (isPlaying) return;
    await togglePlay();
  }

  function prime() {
    try {
      audio.load();
    } catch (e) {}
  }

  if (playBtn) {
    playBtn.addEventListener('click', togglePlay);
  }

  // Interactive scrubbing on progress bar
  if (progressContainer) {
    progressContainer.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressContainer.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = clickRatio * audio.duration;
      updateProgress();
      updateLyrics(audio.currentTime);
    });
  }

  audio.addEventListener('timeupdate', () => {
    updateLyrics(audio.currentTime);
    updateProgress();
  });

  audio.addEventListener('loadedmetadata', () => {
    if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    const meowl = getMeowlController();
    isPlaying = false;
    if (playIcon) playIcon.innerHTML = '▶';
    if (waveform) waveform.classList.remove('playing');
    if (meowl) meowl.stopBeatBobbing();
    if (progressBar) progressBar.style.width = '0%';
  });

  return {
    togglePlay,
    play,
    prime,
    isPlaying: () => isPlaying,
    audio
  };
}
