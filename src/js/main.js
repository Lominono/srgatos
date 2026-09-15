import '../styles/main.css';
import { setupVideoIntro } from './intro.js';
import { revealSarayPresentation } from './presentation.js';
import { setupMeowlInteractive } from './meowl-interactive.js';
import { setupAudioPlayer } from './audio-player.js';
import { setupMeowl360 } from './meowl-360.js';
import { setupFlappyMeowl } from './flappy-meowl.js';
import { setupAmbientCanvas } from './ambient-canvas.js';

document.addEventListener('DOMContentLoaded', () => {
  let meowlController = null;
  let audioPlayer = null;

  // Initialize Ambient Canvas Particles
  setupAmbientCanvas();

  // Initialize Meowl Interactive
  meowlController = setupMeowlInteractive(() => {
    if (audioPlayer) {
      audioPlayer.togglePlay();
    }
  });

  // Initialize Audio Player
  audioPlayer = setupAudioPlayer(() => meowlController);

  // Initialize 360 Panoramic Experience
  setupMeowl360();

  // Initialize Flappy Meowl Game
  setupFlappyMeowl();

  // Setup Epic Video Intro
  setupVideoIntro(() => {
    // When video finishes fading out:
    revealSarayPresentation();
    if (audioPlayer) {
      audioPlayer.play();
    }
  }, () => {
    // When user taps "TOCAR PARA ENTRAR"
    if (audioPlayer) {
      audioPlayer.prime();
    }
  });
});
