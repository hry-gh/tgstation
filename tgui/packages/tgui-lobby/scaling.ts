export function updateScaling() {
  document.documentElement.style.setProperty(
    '--lobby-scale',
    `${window.devicePixelRatio}`,
  );
}
