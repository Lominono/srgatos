import gsap from 'gsap';
import confetti from 'canvas-confetti';

export function setupKneeScanner() {
  const scanBtn = document.getElementById('scan-knee-btn');
  const radar = document.getElementById('scan-radar');
  const metricVal = document.getElementById('scan-metric-value');
  const statusText = document.getElementById('scan-status-text');
  const diagnosisText = document.getElementById('scan-diagnosis-text');

  if (!scanBtn || !radar) return;

  const diagnoses = [
    { metric: "100% Sana", diag: "¡Rodilla en perfecto estado para bailar Hao Xiang Ni! 🦵✨" },
    { metric: "360° Flex", diag: "Flexibilidad nivel Búho desbloqueada. ¡Cero crujidos!" },
    { metric: "Pura Gracia", diag: "Diagnóstico: Saray tiene rodillas de gimnasta olímpica 🥇" },
    { metric: "10/10 Michis", diag: "Aprobada por el Consejo Supremo de Gatos Búho 🦉🐾" },
    { metric: "0% Fatiga", diag: "Recomendación: Seguir sonriendo y viendo memes de gatos." }
  ];

  let isScanning = false;
  let diagIndex = 0;

  scanBtn.addEventListener('click', () => {
    if (isScanning) return;
    isScanning = true;

    statusText.textContent = "Escaneando rodilla de Saray...";
    metricVal.textContent = "⏳ Analizando...";
    diagnosisText.textContent = "Sincronizando con el Meowl...";

    radar.style.opacity = '1';

    // Animate radar beam downward
    gsap.fromTo(radar, 
      { top: 0, opacity: 1 },
      { 
        top: '100%', 
        duration: 0.6, 
        repeat: 3, 
        ease: 'power1.inOut',
        onComplete: () => {
          radar.style.opacity = '0';
          isScanning = false;

          const currentDiag = diagnoses[diagIndex % diagnoses.length];
          diagIndex++;

          // Display result with spring animation
          metricVal.textContent = currentDiag.metric;
          statusText.textContent = "Resultado del Escaneo";
          diagnosisText.textContent = currentDiag.diag;

          gsap.fromTo(metricVal, { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)' });
          gsap.fromTo(diagnosisText, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' });

          // Celebrate with confetti
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#30D158', '#64D2FF', '#FFD60A']
          });
        }
      }
    );
  });
}
