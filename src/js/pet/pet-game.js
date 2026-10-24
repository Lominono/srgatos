import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { BASIC_FOODS, GOURMET_FOODS, POTIONS, OUTFITS } from './pet-items.js';
import { sfx } from '../audio-fx.js';

export function createPetGame(containerEl, petState, onExit, onOpenFlappy, onOpenCatcher, onOpenJump, audioPlayer) {
  let currentRoom = 'kitchen'; // 'kitchen', 'bath', 'bedroom', 'play'
  let isSleeping = petState.state.isSleeping || false;
  let sleepInterval = null;
  let unsubscribeState = null;
  let unsubscribeAudio = null;
  let activeParticleTimeouts = [];
  let bubbleTimeout = null;
  let actionTimeout = null;

  // DOM Structure (Mobile-First, Clean Apple Aesthetic)
  containerEl.innerHTML = `
    <div class="pet-screen" id="pet-screen">
      <!-- Minimal Apple Top Bar with Music Toggle & Coins -->
      <header class="pet-topbar">
        <button class="pet-nav-back" id="pet-back-btn" aria-label="Volver al selector">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Salir</span>
        </button>

        <div class="pet-profile-pill" id="pet-profile-pill">
          <span class="pet-name-label" id="pet-name-label">${petState.state.name}</span>
          <span class="pet-level-badge" id="pet-level-badge">Nv. ${petState.state.level}</span>
        </div>

        <!-- Music Button (Hao Xiang Ni) -->
        <button class="pet-music-pill" id="pet-music-btn" aria-label="Música">
          <div class="mini-eq" id="pet-music-eq">
            <span></span><span></span><span></span>
          </div>
          <span class="music-label">Música</span>
        </button>

        <div class="pet-coins-pill" id="pet-coins-pill">
          <span class="coin-icon">🪙</span>
          <span id="pet-coins-count">${petState.state.coins}</span>
        </div>
      </header>

      <!-- Room Navigation Tabs (Cocina, Baño, Dormitorio, Juegos) -->
      <nav class="pet-room-tabs" aria-label="Habitaciones">
        <button class="room-tab active" data-room="kitchen">🍽️ Cocina</button>
        <button class="room-tab" data-room="bath">🧼 Baño</button>
        <button class="room-tab" data-room="bedroom">🛏️ Dormir</button>
        <button class="room-tab" data-room="play">🎾 Juegos</button>
      </nav>

      <!-- Center Stage: Meowl Virtual Pet using Real Images -->
      <div class="pet-stage-viewport" id="pet-stage-viewport">
        <!-- Night Sky for Bedroom -->
        <div class="pet-night-overlay" id="pet-night-overlay">
          <div class="night-moon">🌙</div>
        </div>

        <!-- Speech / Thought Bubble -->
        <div class="pet-bubble" id="pet-bubble"></div>

        <!-- Meowl Main Character -->
        <div class="pet-character-wrap" id="pet-character-wrap">
          <div class="pet-aura" id="pet-aura"></div>
          
          <div class="pet-avatar-box" id="pet-avatar-box">
            <!-- Dynamic Expressions: gato.png, flappy-cat.png, meowl-blep.png, meowl-screaming.png, frame1.jpg -->
            <img src="/images/gato.png" alt="Gato Meowl" class="pet-meowl-img" id="pet-meowl-img" draggable="false">

            <!-- Dirt overlay when hygiene is low -->
            <div class="pet-dirt-overlay" id="pet-dirt-overlay"></div>
          </div>
        </div>

        <!-- Room Interactive Tools Area (Bottom Sheet Dock) -->
        <div class="pet-interactive-dock" id="pet-interactive-dock">
          <!-- Dynamically filled without duplicating -->
        </div>
      </div>

      <!-- Bottom Vitals (Status Bars) -->
      <footer class="pet-vitals-dock">
        <div class="vital-item" title="Hambre">
          <div class="vital-header">
            <span class="vital-name">Comida</span>
            <span class="vital-val" id="vital-val-hunger">80%</span>
          </div>
          <div class="vital-track">
            <div class="vital-fill hunger" id="vital-fill-hunger" style="width: 80%"></div>
          </div>
        </div>

        <div class="vital-item" title="Higiene">
          <div class="vital-header">
            <span class="vital-name">Baño</span>
            <span class="vital-val" id="vital-val-hygiene">85%</span>
          </div>
          <div class="vital-track">
            <div class="vital-fill hygiene" id="vital-fill-hygiene" style="width: 85%"></div>
          </div>
        </div>

        <div class="vital-item" title="Energía">
          <div class="vital-header">
            <span class="vital-name">Energía</span>
            <span class="vital-val" id="vital-val-energy">90%</span>
          </div>
          <div class="vital-track">
            <div class="vital-fill energy" id="vital-fill-energy" style="width: 90%"></div>
          </div>
        </div>

        <div class="vital-item" title="Ánimo">
          <div class="vital-header">
            <span class="vital-name">Ánimo</span>
            <span class="vital-val" id="vital-val-fun">75%</span>
          </div>
          <div class="vital-track">
            <div class="vital-fill fun" id="vital-fill-fun" style="width: 75%"></div>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Selectors
  const screenEl = containerEl.querySelector('#pet-screen');
  const backBtn = containerEl.querySelector('#pet-back-btn');
  const musicBtn = containerEl.querySelector('#pet-music-btn');
  const musicEq = containerEl.querySelector('#pet-music-eq');
  const nameLabel = containerEl.querySelector('#pet-name-label');
  const levelBadge = containerEl.querySelector('#pet-level-badge');
  const coinsCount = containerEl.querySelector('#pet-coins-count');
  const roomTabs = containerEl.querySelectorAll('.room-tab');
  const viewport = containerEl.querySelector('#pet-stage-viewport');
  const nightOverlay = containerEl.querySelector('#pet-night-overlay');
  const bubble = containerEl.querySelector('#pet-bubble');
  const avatarBox = containerEl.querySelector('#pet-avatar-box');
  const meowlImg = containerEl.querySelector('#pet-meowl-img');
  const dirtOverlay = containerEl.querySelector('#pet-dirt-overlay');
  const interactiveDock = containerEl.querySelector('#pet-interactive-dock');

  // Vitals elements
  const fillHunger = containerEl.querySelector('#vital-fill-hunger');
  const valHunger = containerEl.querySelector('#vital-val-hunger');
  const fillHygiene = containerEl.querySelector('#vital-fill-hygiene');
  const valHygiene = containerEl.querySelector('#vital-val-hygiene');
  const fillEnergy = containerEl.querySelector('#vital-fill-energy');
  const valEnergy = containerEl.querySelector('#vital-val-energy');
  const fillFun = containerEl.querySelector('#vital-fill-fun');
  const valFun = containerEl.querySelector('#vital-val-fun');

  // Apply profile theme
  screenEl.classList.toggle('theme-thiago', petState.profile === 'thiago');
  screenEl.classList.toggle('theme-saray', petState.profile === 'saray');

  // Base idle image based on hygiene and active outfit
  function getBaseIdleImage() {
    if (petState.state.stats && petState.state.stats.hygiene < 30) {
      return '/images/meowl-wet.png';
    }
    const outfit = petState.state.activeOutfit;
    if (outfit === 'skin_propeller') return '/images/meowl-propeller.png';
    if (outfit === 'skin_gentleman') return '/images/meowl-gentleman.png';
    if (outfit === 'skin_wild') return '/images/meowl-wild.png';
    return '/images/gato.png';
  }

  // Dynamic Image Expression Switcher
  function setExpression(mode = 'normal', duration = 0) {
    if (actionTimeout) {
      clearTimeout(actionTimeout);
      actionTimeout = null;
    }

    if (mode === 'sleep') {
      meowlImg.src = '/images/frame1.jpg';
      meowlImg.classList.add('is-sleeping');
    } else if (mode === 'blep') {
      meowlImg.src = '/images/meowl-blep.png';
      meowlImg.classList.remove('is-sleeping');
      if (duration > 0) {
        actionTimeout = setTimeout(() => {
          if (!isSleeping) meowlImg.src = getBaseIdleImage();
        }, duration);
      }
    } else if (mode === 'scream') {
      meowlImg.src = '/images/meowl-screaming.png';
      meowlImg.classList.remove('is-sleeping');
      if (duration > 0) {
        actionTimeout = setTimeout(() => {
          if (!isSleeping) meowlImg.src = getBaseIdleImage();
        }, duration);
      }
    } else if (mode === 'wet') {
      meowlImg.src = '/images/meowl-wet.png';
      meowlImg.classList.remove('is-sleeping');
      if (duration > 0) {
        actionTimeout = setTimeout(() => {
          if (!isSleeping) meowlImg.src = getBaseIdleImage();
        }, duration);
      }
    } else if (mode === 'action') {
      meowlImg.src = '/images/flappy-cat.png';
      meowlImg.classList.remove('is-sleeping');
      if (duration > 0) {
        actionTimeout = setTimeout(() => {
          if (!isSleeping) meowlImg.src = getBaseIdleImage();
        }, duration);
      }
    } else {
      meowlImg.src = getBaseIdleImage();
      meowlImg.classList.remove('is-sleeping');
    }
  }

  // Music Sync
  function updateMusicUI(isPlaying) {
    if (!musicBtn) return;
    musicBtn.classList.toggle('playing', !!isPlaying);
    musicEq.classList.toggle('active', !!isPlaying);
  }

  if (musicBtn && audioPlayer) {
    if (typeof audioPlayer.onStateChange === 'function') {
      unsubscribeAudio = audioPlayer.onStateChange(updateMusicUI);
    } else {
      updateMusicUI(audioPlayer.isPlaying());
    }

    musicBtn.addEventListener('click', async () => {
      sfx.click();
      if (typeof audioPlayer.togglePlay === 'function') {
        await audioPlayer.togglePlay();
      }
    });
  }

  // Speech bubble helper
  function say(text, duration = 1600) {
    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubble.textContent = text;
    bubble.style.display = 'block';
    gsap.killTweensOf(bubble);
    gsap.fromTo(bubble,
      { autoAlpha: 0, scale: 0.8, y: 10 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.22, ease: 'back.out(1.8)' }
    );

    bubbleTimeout = setTimeout(() => {
      gsap.to(bubble, {
        autoAlpha: 0,
        scale: 0.85,
        duration: 0.18,
        onComplete: () => { bubble.style.display = 'none'; }
      });
    }, duration);
  }

  // Floating particle helper (cleaned up safely)
  function spawnParticle(content, x, y) {
    const el = document.createElement('div');
    el.className = 'pet-fx-particle';
    el.textContent = content;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    viewport.appendChild(el);

    const destX = x + (Math.random() - 0.5) * 50;
    const destY = y - 55 - Math.random() * 35;

    gsap.to(el, {
      x: destX - x,
      y: destY - y,
      scale: 1.3,
      autoAlpha: 0,
      duration: 1.0,
      ease: 'power2.out',
      onComplete: () => el.remove()
    });

    const timeout = setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 1100);
    activeParticleTimeouts.push(timeout);
  }

  function clearParticles() {
    viewport.querySelectorAll('.pet-fx-particle').forEach(p => p.remove());
    activeParticleTimeouts.forEach(t => clearTimeout(t));
    activeParticleTimeouts = [];
  }

  // Check Offline Progression Summary
  const offlineInfo = petState.getOfflineSummary();
  if (offlineInfo) {
    setTimeout(() => {
      sfx.levelUp();
      confetti({ particleCount: 30, spread: 55, origin: { y: 0.5 } });
      say(offlineInfo.message, 3500);
    }, 400);
  }

  // Update UI stats
  function updateUI(state) {
    nameLabel.textContent = state.name;
    levelBadge.textContent = `Nv. ${state.level}`;
    coinsCount.textContent = state.coins;

    const h = Math.round(state.stats.hunger);
    const hy = Math.round(state.stats.hygiene);
    const en = Math.round(state.stats.energy);
    const fu = Math.round(state.stats.fun);

    fillHunger.style.width = `${h}%`;
    valHunger.textContent = `${h}%`;

    fillHygiene.style.width = `${hy}%`;
    valHygiene.textContent = `${hy}%`;

    fillEnergy.style.width = `${en}%`;
    valEnergy.textContent = `${en}%`;

    fillFun.style.width = `${fu}%`;
    valFun.textContent = `${fu}%`;

    if (hy < 45) {
      dirtOverlay.style.display = 'block';
      dirtOverlay.style.opacity = `${(45 - hy) / 45}`;
    } else {
      dirtOverlay.style.display = 'none';
    }

    if (!isSleeping && !actionTimeout) {
      meowlImg.src = getBaseIdleImage();
    }
  }

  // Petting interaction on Meowl (alternates cute blep and purr)
  let petPressTime = 0;
  avatarBox.addEventListener('pointerdown', (e) => {
    petPressTime = Date.now();
    avatarBox.setPointerCapture(e.pointerId);

    if (isSleeping) {
      say('Zzz...', 900);
      return;
    }

    sfx.purr();
    // 50% chance of blep expression or action
    setExpression(Math.random() > 0.4 ? 'blep' : 'action', 750);
    gsap.to(avatarBox, { scale: 1.06, duration: 0.12, ease: 'power1.out' });
  });

  avatarBox.addEventListener('pointerup', (e) => {
    try { avatarBox.releasePointerCapture(e.pointerId); } catch (_) {}
    gsap.to(avatarBox, { scale: 1, duration: 0.2, ease: 'back.out(2)' });

    if (isSleeping) return;

    const dur = Date.now() - petPressTime;
    if (dur >= 80) {
      const res = petState.pet();
      const rect = avatarBox.getBoundingClientRect();
      spawnParticle('💖', rect.left + rect.width / 2, rect.top + 20);

      const phrases = ['¡Miau!', 'Prrr...', '¡Qué mimos!', '😋 Blep!'];
      say(phrases[Math.floor(Math.random() * phrases.length)], 1100);

      if (res && res.leveledUp) {
        handleLevelUp(res.newLevel);
      }
    }
  });

  function handleLevelUp(newLevel) {
    sfx.levelUp();
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 }
    });
    say(`¡Nivel ${newLevel}! 🎉`, 2200);
  }

  // Clean room switching
  function switchRoom(room) {
    if (isSleeping && room !== 'bedroom') {
      wakeUpMeowl();
    }

    currentRoom = room;
    sfx.click();
    clearParticles();

    roomTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.room === room);
    });

    renderRoomTools();
  }

  // Render Tools inside dock
  function renderRoomTools() {
    interactiveDock.innerHTML = '';

    if (currentRoom === 'kitchen') {
      renderKitchen();
    } else if (currentRoom === 'bath') {
      renderBath();
    } else if (currentRoom === 'bedroom') {
      renderBedroom();
    } else if (currentRoom === 'play') {
      renderPlay();
    }
  }

  // 1. KITCHEN: Basic Free Foods + Gourmet Treats bought with Coins!
  function renderKitchen() {
    const kitchenWrap = document.createElement('div');
    kitchenWrap.className = 'dock-kitchen-wrap';

    // Section 1: Basic Foods (Free)
    const basicTitle = document.createElement('div');
    basicTitle.className = 'dock-section-title';
    basicTitle.textContent = 'Alimentos Diarios';
    kitchenWrap.appendChild(basicTitle);

    const basicShelf = document.createElement('div');
    basicShelf.className = 'dock-food-shelf';

    BASIC_FOODS.forEach(food => {
      const btn = document.createElement('button');
      btn.className = 'food-card-btn';
      btn.innerHTML = `
        <span class="food-emoji">${food.emoji}</span>
        <span class="food-label">${food.name}</span>
        <span class="food-benefit">+${food.hunger}%</span>
      `;
      btn.addEventListener('click', () => handleFeed(food));
      basicShelf.appendChild(btn);
    });
    kitchenWrap.appendChild(basicShelf);

    // Section 2: Gourmet Foods (Bought with Coins)
    const gourmetTitle = document.createElement('div');
    gourmetTitle.className = 'dock-section-title';
    gourmetTitle.textContent = 'Delicias Gourmet (Monedas 🪙)';
    kitchenWrap.appendChild(gourmetTitle);

    const gourmetShelf = document.createElement('div');
    gourmetShelf.className = 'dock-food-shelf';

    GOURMET_FOODS.forEach(food => {
      const btn = document.createElement('button');
      btn.className = 'food-card-btn gourmet';
      const visualHtml = food.img
        ? `<img src="${food.img}" alt="${food.name}" class="food-thumb-img" />`
        : `<span class="food-emoji">${food.emoji}</span>`;
      btn.innerHTML = `
        ${visualHtml}
        <span class="food-label">${food.name}</span>
        <span class="food-cost">${food.cost} 🪙</span>
      `;
      btn.addEventListener('click', () => handleFeed(food));
      gourmetShelf.appendChild(btn);
    });
    kitchenWrap.appendChild(gourmetShelf);

    interactiveDock.appendChild(kitchenWrap);
  }

  function handleFeed(food) {
    if (isSleeping) {
      say('Zzz...', 900);
      return;
    }

    if (petState.state.stats.hunger >= 100) {
      say('¡Estoy lleno!', 1200);
      setExpression('blep', 800);
      gsap.fromTo(avatarBox, { rotation: -6 }, { rotation: 6, repeat: 3, yoyo: true, duration: 0.08 });
      return;
    }

    const res = petState.feed(food);
    if (!res || !res.success) {
      say(res ? res.reason : 'No alcanza las monedas', 1400);
      return;
    }

    sfx.feed();
    if (food.cost && food.cost > 0) {
      sfx.coin();
      // Screaming delighted expression on eating gourmet food!
      setExpression('scream', 600);
      setTimeout(() => setExpression('blep', 600), 600);
    } else {
      setExpression('action', 600);
      setTimeout(() => setExpression('blep', 500), 600);
    }

    // Chew animation
    gsap.timeline()
      .to(avatarBox, { scaleY: 0.88, scaleX: 1.1, duration: 0.1, ease: 'power2.in' })
      .to(avatarBox, { scaleY: 1.08, scaleX: 0.92, duration: 0.14, ease: 'power2.out' })
      .to(avatarBox, { scaleY: 1, scaleX: 1, duration: 0.1 });

    const rect = avatarBox.getBoundingClientRect();
    spawnParticle(food.emoji, rect.left + rect.width / 2, rect.top + 30);
    spawnParticle('✨', rect.left + rect.width / 2 + 20, rect.top + 15);

    say('¡Qué rico! 😋', 1200);

    if (res.leveledUp) {
      handleLevelUp(res.newLevel);
    }
  }

  // 2. BATH: Sponge, Shower + Magic Golden Soap (Bought with Coins)
  function renderBath() {
    const bathWrap = document.createElement('div');
    bathWrap.className = 'dock-bath-wrap';

    bathWrap.innerHTML = `
      <div class="bath-actions-row">
        <button class="bath-tool-btn" id="btn-sponge" aria-label="Enjabonar">
          <span class="tool-emoji">🧽</span>
          <span class="tool-name">Esponja</span>
        </button>
        <button class="bath-tool-btn" id="btn-shower" aria-label="Ducha">
          <span class="tool-emoji">🚿</span>
          <span class="tool-name">Ducha</span>
        </button>
        <button class="bath-tool-btn golden" id="btn-gold-soap" aria-label="Jabón Dorado">
          <span class="tool-emoji">🧼</span>
          <div class="tool-col">
            <span class="tool-name">Jabón Oro</span>
            <small class="tool-cost">14 🪙</small>
          </div>
        </button>
      </div>
    `;

    const spongeBtn = bathWrap.querySelector('#btn-sponge');
    const showerBtn = bathWrap.querySelector('#btn-shower');
    const goldSoapBtn = bathWrap.querySelector('#btn-gold-soap');

    spongeBtn.addEventListener('click', () => {
      if (isSleeping) return;
      sfx.soap();
      sfx.pop();
      setExpression('wet', 1200);

      const rect = avatarBox.getBoundingClientRect();
      for (let i = 0; i < 4; i++) {
        spawnParticle('🫧', rect.left + Math.random() * rect.width, rect.top + Math.random() * rect.height * 0.7);
      }
      say('Espumita...', 1100);
      gsap.fromTo(avatarBox, { rotation: -3 }, { rotation: 3, duration: 0.1, repeat: 2, yoyo: true });
    });

    showerBtn.addEventListener('click', () => {
      if (isSleeping) return;
      sfx.shower();
      setExpression('wet', 1400);
      setTimeout(() => {
        if (!isSleeping) setExpression('blep', 800);
      }, 1400);

      const rect = avatarBox.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        spawnParticle('💧', rect.left + Math.random() * rect.width, rect.top - 10);
      }
      setTimeout(() => spawnParticle('✨', rect.left + rect.width / 2, rect.top + 20), 200);

      const res = petState.wash(35);
      say('¡Limpito!', 1300);

      if (res && res.leveledUp) handleLevelUp(res.newLevel);
    });

    goldSoapBtn.addEventListener('click', () => {
      if (isSleeping) return;
      const soapPotion = POTIONS.find(p => p.id === 'potion_soap');
      const res = petState.usePotion(soapPotion);
      if (res && res.success) {
        sfx.levelUp();
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
        setExpression('blep', 1200);
        say('¡100% Reluciente!', 1600);
      } else {
        say(res ? res.reason : 'Sin monedas', 1300);
      }
    });

    interactiveDock.appendChild(bathWrap);
  }

  // 3. BEDROOM: Lamp + Instant Energy Potion (Bought with Coins)
  function renderBedroom() {
    const bedWrap = document.createElement('div');
    bedWrap.className = 'dock-bedroom-wrap';

    bedWrap.innerHTML = `
      <div class="bedroom-actions-row">
        <button class="lamp-toggle-btn ${isSleeping ? 'sleeping' : ''}" id="btn-lamp" aria-label="Lámpara">
          <span class="lamp-icon" id="lamp-icon-state">${isSleeping ? '🌙' : '💡'}</span>
          <span class="lamp-label" id="lamp-label-state">${isSleeping ? 'Despertar' : 'Apagar luz'}</span>
        </button>

        <button class="potion-quick-btn" id="btn-potion-energy" aria-label="Poción de Energía">
          <span class="potion-emoji">🧪</span>
          <div class="potion-col">
            <span class="potion-title">Poción Energía</span>
            <small class="potion-cost">18 🪙</small>
          </div>
        </button>
      </div>
      <p class="bedroom-hint" id="bedroom-hint-state">
        ${isSleeping ? 'Descansando plácidamente...' : 'Toca la lámpara para que Meowl duerma'}
      </p>
    `;

    const lampBtn = bedWrap.querySelector('#btn-lamp');
    const lampIcon = bedWrap.querySelector('#lamp-icon-state');
    const lampLabel = bedWrap.querySelector('#lamp-label-state');
    const lampHint = bedWrap.querySelector('#bedroom-hint-state');
    const energyPotionBtn = bedWrap.querySelector('#btn-potion-energy');

    lampBtn.addEventListener('click', () => {
      sfx.lamp();
      isSleeping = !isSleeping;
      petState.setSleeping(isSleeping);

      if (isSleeping) {
        setExpression('sleep');
        nightOverlay.style.display = 'block';
        gsap.to(nightOverlay, { autoAlpha: 1, duration: 0.45 });

        lampBtn.classList.add('sleeping');
        lampIcon.textContent = '🌙';
        lampLabel.textContent = 'Despertar';
        lampHint.textContent = 'Descansando plácidamente...';

        say('Zzz...', 1200);

        if (sleepInterval) clearInterval(sleepInterval);
        sleepInterval = setInterval(() => {
          if (!isSleeping) {
            clearInterval(sleepInterval);
            return;
          }
          if (petState.state.stats.energy < 100) {
            petState.rest(8);
          }
          const rect = avatarBox.getBoundingClientRect();
          spawnParticle('💤', rect.left + rect.width / 2 + 20, rect.top + 10);
        }, 1800);
      } else {
        wakeUpMeowl();
        lampBtn.classList.remove('sleeping');
        lampIcon.textContent = '💡';
        lampLabel.textContent = 'Apagar luz';
        lampHint.textContent = 'Toca la lámpara para que Meowl duerma';
      }
    });

    energyPotionBtn.addEventListener('click', () => {
      const potion = POTIONS.find(p => p.id === 'potion_energy');
      const res = petState.usePotion(potion);
      if (res && res.success) {
        sfx.levelUp();
        wakeUpMeowl();
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
        say('¡100% Energía al instante!', 1800);
        setExpression('scream', 1000);
      } else {
        say(res ? res.reason : 'Sin monedas', 1300);
      }
    });

    interactiveDock.appendChild(bedWrap);
  }

  function wakeUpMeowl() {
    if (sleepInterval) {
      clearInterval(sleepInterval);
      sleepInterval = null;
    }
    isSleeping = false;
    petState.setSleeping(false);
    setExpression('normal');

    gsap.to(nightOverlay, {
      autoAlpha: 0,
      duration: 0.35,
      onComplete: () => {
        nightOverlay.style.display = 'none';
      }
    });

    sfx.purr();
    say('¡Despierto!', 1400);
    gsap.fromTo(avatarBox, { scale: 0.92 }, { scale: 1, duration: 0.28, ease: 'back.out(2)' });
  }

  // 4. PLAYROOM: Flappy Meowl + NUEVO JUEGO Atrapa-Comida + NUEVO JUEGO Salto Michi + Pelota + Apariencias
  function renderPlay() {
    const playWrap = document.createElement('div');
    playWrap.className = 'dock-play-wrap';

    playWrap.innerHTML = `
      <div class="play-options">
        <button class="play-action-card" id="btn-play-flappy">
          <span class="play-card-icon">🎮</span>
          <div class="play-card-text">
            <strong>Flappy Meowl</strong>
            <small>Esquiva tubos y gana monedas</small>
          </div>
        </button>

        <button class="play-action-card highlight" id="btn-play-catcher">
          <span class="play-card-icon">🧺</span>
          <div class="play-card-text">
            <strong>Atrapa-Comida</strong>
            <small>Atrapa delicias y monedas</small>
          </div>
        </button>

        <button class="play-action-card highlight" id="btn-play-jump">
          <span class="play-card-icon">🦘</span>
          <div class="play-card-text">
            <strong>Salto Michi</strong>
            <small>Rebota hacia el cielo</small>
          </div>
        </button>

        <button class="play-action-card" id="btn-yarn-ball">
          <span class="play-card-icon">🎾</span>
          <div class="play-card-text">
            <strong>Pelota de lana</strong>
            <small>Juega y sube ánimo</small>
          </div>
        </button>
      </div>

      <!-- Outfits / Apariencias del gato (comprables con monedas) -->
      <div class="outfits-shelf-wrap">
        <div class="dock-section-title">Apariencias de Meowl</div>
        <div class="outfits-row" id="outfits-row"></div>
      </div>
    `;

    const flappyBtn = playWrap.querySelector('#btn-play-flappy');
    const catcherBtn = playWrap.querySelector('#btn-play-catcher');
    const jumpBtn = playWrap.querySelector('#btn-play-jump');
    const yarnBtn = playWrap.querySelector('#btn-yarn-ball');
    const outfitsRow = playWrap.querySelector('#outfits-row');

    function launchGameWithCheck(gameLauncher) {
      if (isSleeping) {
        say('Zzz...', 900);
        return;
      }
      const check = petState.canPlayGame();
      if (!check.can) {
        say(check.reason, 2200);
        setExpression('blep', 1200);
        return;
      }
      petState.consumeGameEffort(12, 8);
      gameLauncher();
    }

    flappyBtn.addEventListener('click', () => {
      sfx.click();
      launchGameWithCheck(() => {
        if (typeof onOpenFlappy === 'function') {
          onOpenFlappy((earnedScore) => {
            if (earnedScore > 0) {
              const coinsEarned = earnedScore * 2;
              petState.addCoins(coinsEarned);
              petState.addXP(earnedScore * 5);
              say(`+${coinsEarned} monedas! 🪙`, 2000);
            }
          });
        }
      });
    });

    catcherBtn.addEventListener('click', () => {
      sfx.click();
      launchGameWithCheck(() => {
        if (typeof onOpenCatcher === 'function') {
          onOpenCatcher((earnedScore, earnedCoins) => {
            if (earnedCoins > 0) {
              petState.addCoins(earnedCoins);
              petState.addXP(earnedScore);
              say(`¡Genial! +${earnedCoins} monedas 🪙`, 2200);
            }
          });
        }
      });
    });

    jumpBtn.addEventListener('click', () => {
      sfx.click();
      launchGameWithCheck(() => {
        if (typeof onOpenJump === 'function') {
          onOpenJump((earnedScore, earnedCoins) => {
            if (earnedCoins > 0) {
              petState.addCoins(earnedCoins);
              petState.addXP(Math.round(earnedScore / 2));
              say(`¡Gran salto! +${earnedCoins} monedas 🪙`, 2200);
            }
          });
        }
      });
    });

    yarnBtn.addEventListener('click', () => {
      if (isSleeping) return;
      sfx.purr();
      setExpression('action', 800);

      const rect = avatarBox.getBoundingClientRect();
      spawnParticle('🎾', rect.left + rect.width / 2, rect.top - 10);
      spawnParticle('✨', rect.left + rect.width / 2 + 25, rect.top + 20);

      const res = petState.pet();
      say('¡Qué bien!', 1200);

      gsap.fromTo(avatarBox,
        { y: 0, rotation: 0 },
        { y: -26, rotation: 8, yoyo: true, repeat: 1, duration: 0.22, ease: 'power2.out' }
      );

      if (res && res.leveledUp) handleLevelUp(res.newLevel);
    });

    function updateOutfitCardsUI() {
      const cards = outfitsRow.querySelectorAll('.outfit-card');
      cards.forEach(card => {
        const id = card.dataset.outfitId;
        const isOwned = petState.state.unlockedOutfits.includes(id);
        const isActive = petState.state.activeOutfit === id;
        card.classList.toggle('active', isActive);
        const tag = card.querySelector('.outfit-tag');
        if (tag) {
          const out = OUTFITS.find(o => o.id === id);
          tag.textContent = isActive ? 'Puesto' : isOwned ? 'Usar' : `${out ? out.cost : 0} 🪙`;
        }
      });
    }

    // Render Outfits (No recursive renderPlay, updates cards in-place)
    OUTFITS.forEach(outfit => {
      const isOwned = petState.state.unlockedOutfits.includes(outfit.id);
      const isActive = petState.state.activeOutfit === outfit.id;

      const outfitCard = document.createElement('button');
      outfitCard.className = `outfit-card ${isActive ? 'active' : ''}`;
      outfitCard.dataset.outfitId = outfit.id;
      outfitCard.innerHTML = `
        <div class="outfit-preview-img-wrap">
          <img src="${outfit.img}" alt="${outfit.name}" class="outfit-thumb-img" />
        </div>
        <span class="outfit-name">${outfit.name}</span>
        <span class="outfit-tag">${isActive ? 'Puesto' : isOwned ? 'Usar' : `${outfit.cost} 🪙`}</span>
      `;

      outfitCard.addEventListener('click', () => {
        const res = petState.unlockOutfit(outfit);
        if (res && res.success) {
          sfx.coin();
          setExpression('normal');
          say(`¡Estilo ${outfit.name}!`, 1400);
          updateOutfitCardsUI();
          meowlImg.src = getBaseIdleImage();
        } else {
          say(res ? res.reason : 'Sin monedas', 1300);
        }
      });

      outfitsRow.appendChild(outfitCard);
    });

    interactiveDock.appendChild(playWrap);
  }

  // Hook tab buttons
  roomTabs.forEach(tab => {
    tab.addEventListener('click', () => switchRoom(tab.dataset.room));
  });

  // Back button
  backBtn.addEventListener('click', () => {
    sfx.click();
    wakeUpMeowl();
    if (typeof onExit === 'function') {
      onExit();
    }
  });

  // Subscribe to state updates
  unsubscribeState = petState.subscribe(updateUI);

  // Initial Room Setup
  switchRoom('kitchen');

  // Idle animation for Meowl (gentle breathing)
  const idleAnim = gsap.to(avatarBox, {
    scaleY: 0.98,
    scaleX: 1.02,
    y: 2,
    repeat: -1,
    yoyo: true,
    duration: 1.8,
    ease: 'sine.inOut'
  });

  // Random cute blep every 25 seconds while idle
  const idleBlepInterval = setInterval(() => {
    if (!isSleeping && currentRoom !== 'bedroom') {
      setExpression('blep', 900);
    }
  }, 25000);

  return {
    destroy() {
      if (unsubscribeState) unsubscribeState();
      if (unsubscribeAudio) unsubscribeAudio();
      if (sleepInterval) clearInterval(sleepInterval);
      if (actionTimeout) clearTimeout(actionTimeout);
      if (bubbleTimeout) clearTimeout(bubbleTimeout);
      if (idleBlepInterval) clearInterval(idleBlepInterval);
      clearParticles();
      if (idleAnim) idleAnim.kill();
      containerEl.innerHTML = '';
    }
  };
}
