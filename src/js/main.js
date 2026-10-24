import '../styles/main.css';
import { setupVideoIntro } from './intro.js';
import { revealSarayPresentation } from './presentation.js';
import { setupMeowlInteractive } from './meowl-interactive.js';
import { setupAudioPlayer } from './audio-player.js';
import { setupFlappyMeowl } from './flappy-meowl.js';
import { setupMeowlCatcher } from './games/meowl-catcher.js';
import { setupMeowlJump } from './games/meowl-jump.js';
import { setupAmbientCanvas } from './ambient-canvas.js';
import { setupExperienceHub } from './hub.js';
import { PetStateManager } from './pet/pet-state.js';
import { createPetGame } from './pet/pet-game.js';

document.addEventListener('DOMContentLoaded', () => {
  let meowlController = null;
  let audioPlayer = null;
  let flappyController = null;
  let catcherController = null;
  let jumpController = null;
  let activePetGame = null;
  let currentProfile = 'thiago';

  const petContainer = document.getElementById('pet-container');
  const mainApp = document.getElementById('main-app');
  const returnHubBtn = document.getElementById('btn-return-hub');
  const open360Btn = document.getElementById('btn-open-360');

  // Initialize Ambient Canvas Particles (paused on tab hidden)
  setupAmbientCanvas();

  // Initialize Meowl Interactive (Showcase)
  meowlController = setupMeowlInteractive(() => {
    if (audioPlayer) {
      audioPlayer.togglePlay();
    }
  });

  // Initialize Audio Player
  audioPlayer = setupAudioPlayer(() => meowlController);

  // Initialize Mini-Games
  flappyController = setupFlappyMeowl();
  catcherController = setupMeowlCatcher();
  jumpController = setupMeowlJump();

  // Lazy-load Three.js for 360 viewer only when requested
  if (open360Btn) {
    let threeInitialized = false;
    open360Btn.addEventListener('click', async () => {
      if (!threeInitialized) {
        threeInitialized = true;
        const { setupMeowl360 } = await import('./meowl-360.js');
        setupMeowl360(true);
      }
    });
  }

  // Pet State Managers
  const petManagers = {
    thiago: new PetStateManager('thiago'),
    saray: new PetStateManager('saray')
  };

  // Launch Pet Screen for a profile
  function launchPet(profile) {
    currentProfile = profile;
    petManagers[profile].processOfflineProgression();

    if (mainApp) mainApp.style.display = 'none';
    if (audioPlayer && typeof audioPlayer.pause === 'function') {
      audioPlayer.pause();
    }

    if (activePetGame) {
      activePetGame.destroy();
      activePetGame = null;
    }

    if (petContainer) {
      petContainer.style.display = 'flex';
      activePetGame = createPetGame(
        petContainer,
        petManagers[profile],
        // onExit callback: returns to hub
        () => {
          if (activePetGame) {
            activePetGame.destroy();
            activePetGame = null;
          }
          petContainer.style.display = 'none';
          hub.show();
        },
        // onOpenFlappy callback: opens Flappy Meowl and rewards coins
        (onScoreCb) => {
          if (flappyController) {
            flappyController.openGame(onScoreCb);
          }
        },
        // onOpenCatcher callback: opens Meowl Catcher and rewards coins
        (onScoreCb) => {
          if (catcherController) {
            catcherController.openGame(onScoreCb);
          }
        },
        // onOpenJump callback: opens Meowl Jump and rewards coins
        (onScoreCb) => {
          if (jumpController) {
            jumpController.openGame(onScoreCb);
          }
        },
        audioPlayer
      );
    }
  }

  // Setup Experience Hub (Thiago vs Saray vs Showcase)
  const hub = setupExperienceHub({
    onSelectProfile: (profile) => {
      launchPet(profile);
    },
    onOpenShowcase: () => {
      if (petContainer) petContainer.style.display = 'none';
      if (mainApp) {
        mainApp.style.display = '';
        revealSarayPresentation();
      }
      if (audioPlayer) {
        audioPlayer.play();
      }
    }
  });

  // Return to hub from Showcase
  if (returnHubBtn) {
    returnHubBtn.addEventListener('click', () => {
      if (mainApp) mainApp.style.display = 'none';
      if (audioPlayer && typeof audioPlayer.pause === 'function') {
        audioPlayer.pause();
      }
      hub.show();
    });
  }

  // Setup Video Intro
  setupVideoIntro(
    () => {
      // When video finishes or is dismissed, show the Experience Hub!
      hub.show();
    },
    () => {
      // When user clicks "ENTRAR" to start video
      if (audioPlayer) {
        audioPlayer.prime();
      }
    }
  );
});
