import gsap from 'gsap';
import { sfx } from './audio-fx.js';

export function setupExperienceHub({ onSelectProfile, onOpenShowcase }) {
  const hubContainer = document.getElementById('experience-hub');
  if (!hubContainer) return;

  const btnThiago = document.getElementById('hub-btn-thiago');
  const btnSaray = document.getElementById('hub-btn-saray');
  const btnShowcase = document.getElementById('hub-btn-showcase');

  function openHub() {
    hubContainer.style.display = 'flex';
    gsap.killTweensOf(hubContainer);
    gsap.fromTo(hubContainer,
      { autoAlpha: 0, scale: 0.96 },
      { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
    );

    // Animate the two big cards
    gsap.fromTo([btnThiago, btnSaray],
      { y: 30, autoAlpha: 0, scale: 0.94 },
      { y: 0, autoAlpha: 1, scale: 1, stagger: 0.12, duration: 0.5, ease: 'back.out(1.4)' }
    );
  }

  function closeHub(callback) {
    gsap.to(hubContainer, {
      autoAlpha: 0,
      scale: 1.02,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        hubContainer.style.display = 'none';
        if (typeof callback === 'function') callback();
      }
    });
  }

  if (btnThiago) {
    btnThiago.addEventListener('click', () => {
      sfx.click();
      closeHub(() => {
        if (typeof onSelectProfile === 'function') {
          onSelectProfile('thiago');
        }
      });
    });
  }

  if (btnSaray) {
    btnSaray.addEventListener('click', () => {
      sfx.click();
      closeHub(() => {
        if (typeof onSelectProfile === 'function') {
          onSelectProfile('saray');
        }
      });
    });
  }

  if (btnShowcase) {
    btnShowcase.addEventListener('click', () => {
      sfx.click();
      closeHub(() => {
        if (typeof onOpenShowcase === 'function') {
          onOpenShowcase();
        }
      });
    });
  }

  return {
    show: openHub,
    hide: closeHub
  };
}
