import confetti from "canvas-confetti";

export function fireRewardConfetti(options?: confetti.Options) {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    ...options,
  });
}

export function fireCelebrationBurst() {
  const end = Date.now() + 800;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}
