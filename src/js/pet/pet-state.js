/**
 * LocalStorage state manager for Thiago and Saray's Meowl virtual pet.
 * Handles offline progression, passive coin earnings, coin shop purchases, and skins.
 */

const STORAGE_PREFIX = 'srgatos_pet_';

function getDefaultState(profile) {
  const isThiago = profile === 'thiago';

  return {
    profile,
    name: isThiago ? 'Thiago' : 'Saray',
    petName: isThiago ? 'Michi Thiago' : 'Michi Saray',
    stats: {
      hunger: 80,
      hygiene: 85,
      energy: 90,
      fun: 75
    },
    level: 1,
    xp: 0,
    coins: 70,
    activeOutfit: 'skin_default',
    unlockedOutfits: ['skin_default'],
    isSleeping: false,
    history: [
      { id: 1, text: isThiago ? 'Thiago adoptó a Meowl' : 'Saray adoptó a Meowl', time: Date.now() }
    ],
    lastTimestamp: Date.now()
  };
}

export class PetStateManager {
  constructor(profile = 'thiago') {
    this.profile = profile;
    this.listeners = new Set();
    this.autoDecayInterval = null;
    this.offlineSummary = null;
    this.state = this.load();
    this.processOfflineProgression();
    this.startAutoDecay();
  }

  getStorageKey() {
    return `${STORAGE_PREFIX}${this.profile}`;
  }

  load() {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...getDefaultState(this.profile),
          ...parsed,
          stats: {
            ...getDefaultState(this.profile).stats,
            ...(parsed.stats || {})
          },
          unlockedOutfits: Array.isArray(parsed.unlockedOutfits)
            ? parsed.unlockedOutfits
            : ['skin_default']
        };
      }
    } catch (e) {
      console.warn('Error loading pet state:', e);
    }
    return getDefaultState(this.profile);
  }

  save() {
    try {
      this.state.lastTimestamp = Date.now();
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
    } catch (e) {
      console.warn('Error saving pet state:', e);
    }
    this.notify();
  }

  setProfile(profile) {
    if (this.profile === profile) return;
    this.save();
    this.profile = profile;
    this.state = this.load();
    this.processOfflineProgression();
    this.notify();
  }

  // Real-time Offline Progression (calculates what happened while away)
  processOfflineProgression() {
    this.state = this.load();
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - (this.state.lastTimestamp || now)) / 60000);

    if (elapsedMinutes < 4) {
      this.offlineSummary = null;
      return;
    }

    const elapsedHours = elapsedMinutes / 60;

    if (this.state.isSleeping) {
      // Meowl was left sleeping: recovers 100% energy and finds sleep coins!
      this.state.stats.energy = 100;
      const coinsFound = Math.min(35, Math.max(3, Math.floor(elapsedMinutes / 12)));
      this.state.coins += coinsFound;
      this.state.isSleeping = false; // wakes up refreshed

      this.offlineSummary = {
        type: 'sleep',
        hours: Math.round(elapsedHours * 10) / 10,
        coins: coinsFound,
        message: `¡Meowl descansó plácidamente y recolectó ${coinsFound} monedas mientras dormía!`
      };
      this.addHistory(`Descanso offline: +${coinsFound} monedas`);
    } else {
      // Meowl was awake: gentle decay
      const decay = Math.floor(Math.min(36, elapsedHours * 3.5));
      this.state.stats.hunger = Math.max(15, this.state.stats.hunger - decay);
      this.state.stats.hygiene = Math.max(20, this.state.stats.hygiene - Math.floor(decay * 0.6));
      this.state.stats.energy = Math.max(20, this.state.stats.energy - Math.floor(decay * 0.7));
      this.state.stats.fun = Math.max(15, this.state.stats.fun - decay);

      if (elapsedHours >= 1.5) {
        this.offlineSummary = {
          type: 'awake',
          hours: Math.round(elapsedHours * 10) / 10,
          message: `¡Meowl te extrañaba! Ha pasado un tiempo desde tu última visita.`
        };
      }
    }

    this.save();
  }

  getOfflineSummary() {
    const summary = this.offlineSummary;
    this.offlineSummary = null; // consume once
    return summary;
  }

  setSleeping(sleeping) {
    this.state.isSleeping = sleeping;
    this.save();
  }

  startAutoDecay() {
    if (this.autoDecayInterval) clearInterval(this.autoDecayInterval);
    // Faster, realistic decay (every 45s while playing)
    this.autoDecayInterval = setInterval(() => {
      if (this.state.stats.hunger > 10) this.state.stats.hunger -= 1;
      if (this.state.stats.fun > 10) this.state.stats.fun -= 1;
      if (this.state.stats.hygiene > 10) this.state.stats.hygiene -= 0.5;
      this.save();
    }, 45000);
  }

  canPlayGame() {
    if (this.state.stats.energy < 15) {
      return { can: false, reason: '¡Meowl está agotado! Llévalo a dormir.' };
    }
    if (this.state.stats.hunger < 20) {
      return { can: false, reason: '¡Meowl tiene hambre! Dale de comer antes de jugar.' };
    }
    return { can: true };
  }

  consumeGameEffort(energyCost = 12, hungerCost = 8) {
    this.state.stats.energy = Math.max(10, this.state.stats.energy - energyCost);
    this.state.stats.hunger = Math.max(10, this.state.stats.hunger - hungerCost);
    this.save();
  }

  destroy() {
    if (this.autoDecayInterval) {
      clearInterval(this.autoDecayInterval);
      this.autoDecayInterval = null;
    }
    this.listeners.clear();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  addXP(amount) {
    this.state.xp += amount;
    const requiredXP = this.state.level * 40;
    let leveledUp = false;

    while (this.state.xp >= requiredXP) {
      this.state.xp -= requiredXP;
      this.state.level += 1;
      this.state.coins += 25;
      this.addHistory(`Nivel ${this.state.level} (+25 monedas)`);
      leveledUp = true;
    }

    this.save();
    return { leveledUp, newLevel: this.state.level };
  }

  addCoins(amount) {
    this.state.coins += amount;
    this.save();
  }

  addHistory(text) {
    if (!this.state.history) this.state.history = [];
    this.state.history.unshift({
      id: Date.now() + Math.random(),
      text,
      time: Date.now()
    });
    if (this.state.history.length > 15) {
      this.state.history = this.state.history.slice(0, 15);
    }
  }

  feed(food) {
    if (this.state.stats.hunger >= 100) return false;

    // Check if food costs coins
    if (food.cost && food.cost > 0) {
      if (this.state.coins < food.cost) {
        return { success: false, reason: 'Sin monedas suficientes' };
      }
      this.state.coins -= food.cost;
    } else {
      this.addCoins(2); // Free food rewards small coins
    }

    this.state.stats.hunger = Math.min(100, this.state.stats.hunger + food.hunger);
    this.state.stats.hygiene = Math.max(10, this.state.stats.hygiene - 2);

    const xpResult = this.addXP(food.xp);
    this.addHistory(`Comió ${food.name}`);
    this.save();

    return { success: true, ...xpResult };
  }

  usePotion(potion) {
    if (this.state.coins < potion.cost) {
      return { success: false, reason: 'Sin monedas suficientes' };
    }

    this.state.coins -= potion.cost;

    if (potion.effect === 'energy_max') {
      this.state.stats.energy = 100;
      this.addHistory('Poción de energía');
    } else if (potion.effect === 'hygiene_max') {
      this.state.stats.hygiene = 100;
      this.addHistory('Jabón dorado mágico');
    } else if (potion.effect === 'fun_max') {
      this.state.stats.fun = 100;
      this.addHistory('Elixir de felicidad');
    }

    const xpResult = this.addXP(15);
    this.save();
    return { success: true, ...xpResult };
  }

  unlockOutfit(outfit) {
    if (this.state.unlockedOutfits.includes(outfit.id)) {
      this.state.activeOutfit = outfit.id;
      this.save();
      return { success: true, alreadyOwned: true };
    }

    if (this.state.coins < outfit.cost) {
      return { success: false, reason: 'Sin monedas suficientes' };
    }

    this.state.coins -= outfit.cost;
    this.state.unlockedOutfits.push(outfit.id);
    this.state.activeOutfit = outfit.id;
    this.addHistory(`Desbloqueó ${outfit.name}`);
    this.save();
    return { success: true };
  }

  wash(amount = 25) {
    if (this.state.stats.hygiene >= 100) return false;
    this.state.stats.hygiene = Math.min(100, this.state.stats.hygiene + amount);
    this.addCoins(1);
    const xpResult = this.addXP(8);
    this.addHistory('Baño limpio');
    this.save();
    return { success: true, ...xpResult };
  }

  rest(amount = 20) {
    if (this.state.stats.energy >= 100) return false;
    this.state.stats.energy = Math.min(100, this.state.stats.energy + amount);
    const xpResult = this.addXP(4);
    this.save();
    return { success: true, ...xpResult };
  }

  pet() {
    if (this.state.stats.fun >= 100) return false;
    this.state.stats.fun = Math.min(100, this.state.stats.fun + 6);
    this.state.stats.energy = Math.max(10, this.state.stats.energy - 1);
    const xpResult = this.addXP(3);
    this.save();
    return { success: true, ...xpResult };
  }
}
