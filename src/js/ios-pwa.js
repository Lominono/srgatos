import gsap from 'gsap';

export function setupIOSPWA() {
  const modal = document.getElementById('ios-install-modal');
  const backdrop = document.getElementById('ios-install-backdrop');
  const closeBtn = document.getElementById('btn-close-ios-install');
  const dismissBtn = document.getElementById('btn-dismiss-ios-install');
  const hubInstallBtn = document.getElementById('hub-btn-install');

  // Register service worker for offline & PWA criteria
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  if (isStandalone) {
    document.body.classList.add('is-standalone');
    if (hubInstallBtn) hubInstallBtn.style.display = 'none';
    return {
      openInstallModal: () => {},
      closeInstallModal: () => {}
    };
  }

  function openInstallModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    const sheet = modal.querySelector('.ios-install-sheet');
    if (sheet) {
      gsap.fromTo(sheet,
        { y: 80, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out' }
      );
    }
    if (backdrop) {
      gsap.fromTo(backdrop,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25 }
      );
    }
  }

  function closeInstallModal() {
    if (!modal) return;
    const sheet = modal.querySelector('.ios-install-sheet');
    if (sheet) {
      gsap.to(sheet, {
        y: 80,
        autoAlpha: 0,
        duration: 0.22,
        ease: 'power2.in'
      });
    }
    if (backdrop) {
      gsap.to(backdrop, {
        autoAlpha: 0,
        duration: 0.2,
        onComplete: () => {
          modal.style.display = 'none';
        }
      });
    } else {
      modal.style.display = 'none';
    }
    try {
      localStorage.setItem('srgatos_ios_prompt_dismissed', 'true');
    } catch (_) {}
  }

  if (closeBtn) closeBtn.addEventListener('click', closeInstallModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closeInstallModal);
  if (backdrop) backdrop.addEventListener('click', closeInstallModal);
  if (hubInstallBtn) hubInstallBtn.addEventListener('click', openInstallModal);

  // Auto prompt after 6 seconds on iOS Safari if never seen before
  if (isIOS) {
    try {
      const dismissed = localStorage.getItem('srgatos_ios_prompt_dismissed');
      if (!dismissed) {
        setTimeout(() => {
          const introActive = document.getElementById('video-overlay')?.style.display !== 'none';
          if (!introActive && !isStandalone) {
            openInstallModal();
          }
        }, 7000);
      }
    } catch (_) {}
  }

  return {
    openInstallModal,
    closeInstallModal
  };
}
