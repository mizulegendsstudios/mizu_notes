export function initGameLoop(pad: HTMLTextAreaElement) {
  let last = performance.now();
  function step(now: number) {
    const dt = now - last;
    last = now;
    // placeholder para lógica de predicción
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}