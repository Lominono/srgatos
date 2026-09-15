import * as THREE from 'three';
import gsap from 'gsap';

export function setupMeowl360() {
  const container = document.getElementById('meowl-360-container');
  const canvas = document.getElementById('meowl-360-canvas');
  const open360Btn = document.getElementById('btn-open-360');
  const close360Btn = document.getElementById('btn-close-360');
  const gyroBtn = document.getElementById('btn-toggle-gyro');
  const playPause360Btn = document.getElementById('btn-play-360');
  const soundToggleBtn = document.getElementById('btn-sound-360');
  const statusMsg = document.getElementById('meowl-360-status');
  const orientationPrompt = document.getElementById('meowl-orientation-prompt');
  const dismissOrientationBtn = document.getElementById('btn-dismiss-orientation');

  if (!container || !canvas) return;

  let scene, camera, renderer, video, videoTexture, sphereMesh;
  let isUserInteracting = false;
  let lon = 0, lat = 0;
  let phi = 0, theta = 0;
  let onPointerDownPointerX = 0, onPointerDownPointerY = 0;
  let onPointerDownLon = 0, onPointerDownLat = 0;
  let animId = null;
  let useGyro = false;
  let gyroAlpha = 0, gyroBeta = 0, gyroGamma = 0;
  let touchStartDist = 0;
  let isOpen = false;
  let orientationDismissed = false;

  function initThree() {
    if (renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 1, 1200);
    camera.position.set(0, 0, 0.1);
    camera.target = new THREE.Vector3(0, 0, 0);

    // Create Local 360 Video element with full mobile Safari/Chrome support
    video = document.createElement('video');
    video.src = '/video/meowl-360-perfect.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true; // Muted by default to ensure immediate autoplay on mobile
    video.preload = 'auto';
    video.load();

    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;

    // Standard Inverted Equirectangular Sphere
    const geometry = new THREE.SphereGeometry(500, 64, 32);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: videoTexture });
    sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // Touch & Pointer Controls
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });

    window.addEventListener('resize', () => {
      onWindowResize();
      checkOrientation();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        onWindowResize();
        checkOrientation();
      }, 150);
    });
  }

  function checkOrientation() {
    if (!isOpen) return;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (orientationPrompt) {
      if (isPortrait && !orientationDismissed) {
        orientationPrompt.style.display = 'flex';
      } else {
        orientationPrompt.style.display = 'none';
      }
    }
  }

  function onPointerDown(event) {
    if (event.isPrimary === false) return;
    isUserInteracting = true;
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
  }

  function onPointerMove(event) {
    if (event.isPrimary === false || !isUserInteracting) return;
    lon = (onPointerDownPointerX - event.clientX) * 0.2 + onPointerDownLon;
    lat = (event.clientY - onPointerDownPointerY) * 0.2 + onPointerDownLat;
  }

  function onPointerUp() {
    isUserInteracting = false;
  }

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2 && touchStartDist > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - touchStartDist;
      if (camera) {
        camera.fov = THREE.MathUtils.clamp(camera.fov - diff * 0.05, 45, 95);
        camera.updateProjectionMatrix();
      }
      touchStartDist = dist;
    }
  }

  function onWindowResize() {
    if (!renderer || !camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function handleOrientation(event) {
    if (!useGyro) return;
    gyroAlpha = event.alpha || 0;
    gyroBeta = event.beta || 0;
    gyroGamma = event.gamma || 0;
  }

  function animate() {
    animId = requestAnimationFrame(animate);

    if (useGyro) {
      lat = THREE.MathUtils.clamp(gyroBeta - 90, -85, 85);
      lon = -gyroAlpha - gyroGamma;
    } else {
      lat = Math.max(-85, Math.min(85, lat));
    }

    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    const x = 500 * Math.sin(phi) * Math.cos(theta);
    const y = 500 * Math.cos(phi);
    const z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(x, y, z);

    if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
      videoTexture.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  function open360Mode() {
    isOpen = true;
    orientationDismissed = false;
    container.style.display = 'flex';
    initThree();
    onWindowResize();

    // Request screen orientation lock if available
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      screen.orientation.lock('landscape').catch(() => {
        // Ignored if user hasn't engaged fullscreen or unsupported
      });
    }

    checkOrientation();

    if (camera) {
      camera.fov = 125;
      camera.updateProjectionMatrix();
      gsap.to(camera, {
        fov: 75,
        duration: 0.9,
        ease: 'power3.out',
        onUpdate: () => camera.updateProjectionMatrix()
      });
    }

    gsap.fromTo(container, 
      { autoAlpha: 0, scale: 0.96 }, 
      { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power2.out' }
    );

    gsap.fromTo(['.hud-top', '.hud-controls'],
      { y: -16, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.1, delay: 0.15, ease: 'power2.out' }
    );

    if (video) {
      video.play().catch(err => console.log('360 video autoplay prevented:', err));
      if (playPause360Btn) playPause360Btn.textContent = 'Pausar';
    }

    if (!animId) {
      animate();
    }
  }

  function close360Mode() {
    isOpen = false;
    if (orientationPrompt) orientationPrompt.style.display = 'none';

    if (screen.orientation && typeof screen.orientation.unlock === 'function') {
      screen.orientation.unlock();
    }

    if (video) video.pause();
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }

    if (camera) {
      gsap.to(camera, {
        fov: 115,
        duration: 0.3,
        ease: 'power2.in',
        onUpdate: () => camera.updateProjectionMatrix()
      });
    }

    gsap.to(container, {
      autoAlpha: 0,
      scale: 0.96,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        container.style.display = 'none';
        if (camera) {
          camera.fov = 75;
          camera.updateProjectionMatrix();
        }
      }
    });
  }

  if (open360Btn) {
    open360Btn.addEventListener('click', open360Mode);
  }

  if (close360Btn) {
    close360Btn.addEventListener('click', close360Mode);
  }

  if (dismissOrientationBtn) {
    dismissOrientationBtn.addEventListener('click', () => {
      orientationDismissed = true;
      if (orientationPrompt) orientationPrompt.style.display = 'none';
    });
  }

  if (playPause360Btn) {
    playPause360Btn.addEventListener('click', () => {
      if (!video) return;
      if (video.paused) {
        video.play();
        playPause360Btn.textContent = 'Pausar';
      } else {
        video.pause();
        playPause360Btn.textContent = 'Reproducir';
      }
    });
  }

  // Audio mute/unmute toggle
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (!video) return;
      video.muted = !video.muted;
      soundToggleBtn.textContent = video.muted ? 'Sonido: OFF' : 'Sonido: ON';
      soundToggleBtn.classList.toggle('active', !video.muted);
    });
  }

  // Gyroscope toggle for mobile
  if (gyroBtn) {
    gyroBtn.addEventListener('click', async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const res = await DeviceOrientationEvent.requestPermission();
          if (res === 'granted') {
            useGyro = !useGyro;
            window.addEventListener('deviceorientation', handleOrientation);
            gyroBtn.classList.toggle('active', useGyro);
            gyroBtn.textContent = useGyro ? 'Giroscopio: ON' : 'Giroscopio: OFF';
          }
        } catch (e) {
          console.warn('Gyroscope permission error:', e);
        }
      } else if (window.DeviceOrientationEvent) {
        useGyro = !useGyro;
        window.addEventListener('deviceorientation', handleOrientation);
        gyroBtn.classList.toggle('active', useGyro);
        gyroBtn.textContent = useGyro ? 'Giroscopio: ON' : 'Giroscopio: OFF';
      } else {
        alert('Giroscopio no soportado en este navegador. Puedes arrastrar con el dedo.');
      }
    });
  }
}
