import gsap from 'gsap';
import confetti from 'canvas-confetti';

export function setupAudioPlayer(getMeowlController) {
  const audio = new Audio('/audio/hao-xiang-ni.mp3');
  audio.preload = 'auto';
  audio.volume = 0.9;

  const stateListeners = new Set();
  function notifyState(playing) {
    for (const cb of stateListeners) {
      try { cb(playing); } catch (e) {}
    }
  }

  audio.addEventListener('play', () => {
    isPlaying = true;
    notifyState(true);
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    notifyState(false);
  });

  const playBtn = document.getElementById('player-play-btn');
  const playIcon = document.getElementById('player-play-icon');
  const waveform = document.getElementById('player-waveform');
  const lyricBox = document.getElementById('player-lyric-box');
  const lyricLine = document.getElementById('player-lyric-line');
  const lyricComment = document.getElementById('player-lyric-comment');
  const progressBar = document.getElementById('player-progress-fill');
  const progressContainer = document.getElementById('player-progress-track');
  const timeCurrent = document.getElementById('player-time-current');
  const timeTotal = document.getElementById('player-time-total');
  const easterToast = document.getElementById('lyric-easter-toast');
  const easterToastIcon = document.getElementById('easter-toast-icon');
  const easterToastText = document.getElementById('easter-toast-text');

  const likeBtn = document.getElementById('player-like-btn');
  const likeCountEl = document.getElementById('player-like-count');

  let isPlaying = false;
  let currentIndex = -1;
  let tapCount = 0;
  let toastTimeout = null;
  let likeCount = parseInt(localStorage.getItem('saray-like-count') || '0', 10);
  let isLiked = localStorage.getItem('saray-is-liked') === 'true';

  if (likeBtn && isLiked) {
    likeBtn.classList.add('liked');
  }
  if (likeCountEl) {
    likeCountEl.textContent = likeCount;
  }

  if (lyricBox) {
    lyricBox.classList.add('is-empty');
    lyricLine.textContent = 'Toca ▶ para que empiece la magia 🎶';
    lyricComment.textContent = 'Tu canción te está esperando, Saray 🦉';
  }

  function showLikeToast(message) {
    const existingToast = document.getElementById('like-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'like-toast';
    toast.className = 'like-toast';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  function spawnLikeBurst(x, y) {
    const colors = ['#FF375F', '#FF7597', '#FFD60A', '#FFB4C8'];
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 / 8) * i;
      const dist = 40 + Math.random() * 30;
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${colors[i % colors.length]};
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(particle);
      gsap.to(particle, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        autoAlpha: 0,
        scale: 0,
        duration: 0.6,
        ease: 'power3.out',
        onComplete: () => particle.remove()
      });
    }
  }

  // Ultra-precise timestamped lyrics with colloquial Spanish commentary & easter eggs
  const lyrics = [
    { time: 0.0, text: "[Intro de ukelele] — Todo listo para Saray...", comment: "(Ponte cómodo que empieza lo bueno)" },
    { time: 2.7, text: "I wanna send a text to ask your knee", comment: "(Mensajito de rigor: ¿te tomaste el ibuprofeno?)" },
    { time: 5.6, text: "How's your knee, how's your knee...", comment: "(0 crujidos hoy, confirmamos 🦵)" },
    { time: 8.2, text: "I wanna call you now to check your knee", comment: "(Llamada de urgencia médica: chequeo de menisco)" },
    { time: 10.8, text: "How's your knee, how's your knee...", comment: "(Esa rótula aguanta hasta el festival)" },
    { time: 13.3, text: "First thing in the morning when I wake up", comment: "(Abro los ojos y las prioridades claras)" },
    { time: 16.1, text: "Is: how's your knee, how's your knee!", comment: "(Antes del café va el chequeo de tu rodilla)" },
    { time: 18.8, text: "Whether it's sunny or it's pouring rain", comment: "(Haga solazo o caiga el diluvio)" },
    { time: 21.5, text: "All I care is: how's your knee!", comment: "(El clima me da igual, tu rodilla no)" },
    { time: 24.2, text: "Every time I ask you: How's your knee?", comment: "(Cada vez que pregunto me miras raro)" },
    { time: 27.2, text: "You never quite believe me...", comment: "(Pero te lo digo 100% en serio)" },
    { time: 29.6, text: "Yet you keep on asking if I miss your knee!", comment: "(¿Que si la echo de menos? Obvio)" },
    { time: 35.0, text: "I don't know fancy lines or poetry", comment: "(No me sé poemas intensos de filósofo)" },
    { time: 37.6, text: "So I just ask: how's your knee!", comment: "(Así que voy al grano: ¿cómo va eso?)" },
    { time: 40.3, text: "All I really want is making you smile", comment: "(Con sacarte una sonrisa ya coroné)" },
    { time: 42.3, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!", comment: "(Spam de rodilla modo intenso activado)", isChorus: true },
    { time: 47.5, text: "Really, truly, how's your knee!", comment: "(De verdad de la buena, ¿te duele o qué?)" },
    { time: 49.8, text: "For real, no cap, how's your knee!", comment: "(Literalmente cero cap, rodilla de titanio)" },
    { time: 52.3, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!", comment: "(A grito pelado en el estribillo)", isChorus: true },
    { time: 57.4, text: "Super duper intensely: how's your knee!", comment: "(Intensidad médica 10/10)" },
    { time: 59.7, text: "From the bottom of my heart: how's your knee!", comment: "(Desde lo más profundo del corazón)" },
    { time: 62.1, text: "How's your knee...", comment: "(Aflojamos un poco el ritmo...)" },
    { time: 64.5, text: "[Solo de silbido y ukelele]", comment: "(Pausa para estirar la pierna con calma)" },
    { time: 74.5, text: "Every single day and every night...", comment: "(De día y de noche sin descanso)" },
    { time: 77.2, text: "I wonder if your knee is doing alright!", comment: "(Esperando que no cruja nada)" },
    { time: 82.5, text: "Even in my dreams, I ask your knee...", comment: "(Hasta soñando me sale la resonancia)" },
    { time: 85.2, text: "How's your knee, how's your knee!", comment: "(Menisco en calidad 4K ultra nítido)" },
    { time: 94.0, text: "I don't know fancy lines or poetry", comment: "(Cero cursilerías, pura realidad)" },
    { time: 96.6, text: "So I just ask: how's your knee!", comment: "(La pregunta del millón de dólares)" },
    { time: 99.3, text: "All I really want is making you smile", comment: "(Si te ríes, misión cumplida)" },
    { time: 101.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!", comment: "(Segunda ronda de descontrol)", isChorus: true },
    { time: 106.7, text: "Really, truly, how's your knee!", comment: "(Confirmando el estado del cartílago)" },
    { time: 109.0, text: "For real, no cap, how's your knee!", comment: "(Ni un crujido, certificadísimo)" },
    { time: 111.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!", comment: "(Joyce Chu compuso esto para ti, fijo)", isChorus: true },
    { time: 116.6, text: "Super duper intensely: how's your knee!", comment: "(Hasta que te canses de escuchar 'knee')" },
    { time: 118.9, text: "From the bottom of my heart: how's your knee!", comment: "(Con todo el cariño del mundo)" },
    { time: 121.3, text: "How's your knee...", comment: "(Respiro antes del solo de guitarra...)" },
    { time: 124.0, text: "[Solo de guitarra]", comment: "(Momento rockero, rodilla descansando)" },
    { time: 131.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!", comment: "(¡ÚLTIMO ESTRIBILLO A TOPE!)", isChorus: true },
    { time: 136.7, text: "Really, truly, how's your knee!", comment: "(Saray, por favor dime que estás al 100%)" },
    { time: 139.0, text: "For real, no cap, how's your knee!", comment: "(Rodilla nivel diamante biónico)" },
    { time: 141.5, text: "HOW'S YOUR KNEE! HOW'S YOUR KNEE! HOW'S YOUR KNEE!", comment: "(Ya casi se acaba el temazo)", isChorus: true },
    { time: 146.6, text: "Super intensely: HOW'S YOUR KNEE!", comment: "(El remate final)" },
    { time: 148.9, text: "Saray, forever: HOW'S YOUR KNEE!", comment: "(Saray: patrimonio de rodillas sanas)" },
    { time: 151.4, text: "How's your knee...", comment: "(Se apaga la música poco a poco...)" },
    { time: 154.5, text: "How's your knee...", comment: "(Y esa rodilla quedó intacta 🦉)" }
  ];

  const easterToastMessages = [
    { icon: "🦴", text: "Diagnóstico: 0 crujidos. Rodilla 100% biónica." },
    { icon: "⚡", text: "¿Te tomaste el colágeno hoy? Pregunta seria." },
    { icon: "🎶", text: "Joyce Chu mandó a decir que tu rodilla es top." },
    { icon: "🥇", text: "Medalla de oro a la mejor rodilla." },
    { icon: "🦾", text: "Aleación de titanio y buena vibra." },
    { icon: "🩺", text: "Chequeo express superado sin observaciones." },
    { icon: "💃", text: "Esa articulación está lista para darlo todo." }
  ];

  function showEasterToast(icon, text) {
    if (!easterToast) return;
    easterToastIcon.textContent = icon;
    easterToastText.textContent = text;
    easterToast.classList.add('visible');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      easterToast.classList.remove('visible');
    }, 2500);
  }

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

      // Smooth kinetic lyric pop transition
      gsap.timeline()
        .to([lyricLine, lyricComment], {
          y: -6,
          autoAlpha: 0.2,
          duration: 0.12,
          ease: 'power2.in',
          onComplete: () => {
            lyricLine.textContent = current.text;
            if (lyricComment) {
              lyricComment.textContent = current.comment;
            }
          }
        })
        .fromTo([lyricLine, lyricComment], 
          { y: 6, autoAlpha: 0.2 },
          { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.3, ease: 'power2.out' }
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
        .to(playBtn, { scale: 0.88, duration: 0.08, ease: 'power2.in' })
        .to(playBtn, { scale: 1.08, duration: 0.16, ease: 'back.out(2)' })
        .to(playBtn, { scale: 1, duration: 0.14, ease: 'power2.out' });
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      if (playIcon) playIcon.innerHTML = '<polygon points="7,4 20,12 7,20"/>';
      if (waveform) waveform.classList.remove('playing');
      if (meowl) meowl.stopBeatBobbing();
    } else {
      try {
        await audio.play();
        isPlaying = true;
        if (playIcon) playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/>';
        if (waveform) waveform.classList.add('playing');
        if (meowl) meowl.startBeatBobbing();
        if (lyricBox) {
          lyricBox.classList.remove('is-empty');
          lyricBox.classList.remove('is-finished');
        }
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

  // Like toggle logic con persistencia y feedback
  if (likeBtn) {
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = likeBtn.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      isLiked = !isLiked;
      likeBtn.classList.toggle('liked', isLiked);
      likeBtn.classList.remove('pop');
      void likeBtn.offsetWidth;
      likeBtn.classList.add('pop');

      likeCount = isLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
      localStorage.setItem('saray-like-count', likeCount.toString());
      localStorage.setItem('saray-is-liked', isLiked.toString());

      if (likeCountEl) {
        likeCountEl.textContent = likeCount;
        likeCountEl.classList.remove('bump');
        void likeCountEl.offsetWidth;
        likeCountEl.classList.add('bump');
      }

      spawnLikeBurst(clickX, clickY);
      showLikeToast(isLiked ? '✨ Guardado en favoritos' : '🗑️ Quitado de favoritos');
    });
  }

  // Cuando termina la canción — estado final con invitación
  audio.addEventListener('ended', () => {
    const meowl = getMeowlController();
    isPlaying = false;
    if (playIcon) playIcon.innerHTML = '<polygon points="7,4 20,12 7,20"/>';
    if (waveform) waveform.classList.remove('playing');
    if (meowl) meowl.stopBeatBobbing();
    if (progressBar) progressBar.style.width = '0%';
    if (lyricBox) {
      lyricBox.classList.add('is-finished');
      lyricBox.classList.remove('is-empty');
      lyricLine.textContent = 'Ya se acabó el temazo 🎶';
      lyricComment.textContent = '¿Quieres repetir? Saray siempre vuelve 🦉';
    }
  });

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

  // Interactive Easter Egg Trigger on Lyric Box Tap
  if (lyricBox) {
    lyricBox.addEventListener('click', () => {
      tapCount++;
      const meowl = getMeowlController();
      const current = lyrics[currentIndex] || lyrics[0];

      // Bounce the lyric box
      gsap.timeline()
        .to(lyricBox, { scale: 0.96, duration: 0.08, ease: 'power2.in' })
        .to(lyricBox, { scale: 1.02, duration: 0.15, ease: 'back.out(2)' })
        .to(lyricBox, { scale: 1, duration: 0.12, ease: 'power2.out' });

      // Check special easter egg: 3 rapid taps unlocks Sunglasses!
      if (tapCount % 3 === 0 && meowl && typeof meowl.toggleSunglasses === 'function') {
        const hasGlasses = meowl.toggleSunglasses();
        if (hasGlasses) {
          showEasterToast("🕶️", "¡Modo Thug Life activado! Flow 100%");
        } else {
          showEasterToast("✨", "Gafas guardadas en el estuche.");
        }
        return;
      }

      // If tapped during intense chorus
      if (current.isChorus) {
        showEasterToast("🔥", "¡Spam de rodilla modo legendario!");
        if (meowl && typeof meowl.triggerChorusReaction === 'function') {
          meowl.triggerChorusReaction();
        }
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#FF7597', '#64D2FF', '#FFD60A']
        });
        return;
      }

      // Normal easter egg tap: show random colloquial status & make Meowl bounce
      const msg = easterToastMessages[(tapCount - 1) % easterToastMessages.length];
      showEasterToast(msg.icon, msg.text);

      if (meowl && typeof meowl.triggerEasterReaction === 'function') {
        meowl.triggerEasterReaction();
      }
    });
  }

  audio.addEventListener('timeupdate', () => {
    updateLyrics(audio.currentTime);
    updateProgress();
  });

  audio.addEventListener('loadedmetadata', () => {
    if (timeTotal) timeTotal.textContent = formatTime(audio.duration);
  });

  return {
    togglePlay,
    play,
    pause: () => {
      if (isPlaying) {
        togglePlay();
      }
    },
    prime,
    isPlaying: () => isPlaying,
    onStateChange: (cb) => {
      stateListeners.add(cb);
      cb(isPlaying);
      return () => stateListeners.delete(cb);
    },
    audio
  };
}

