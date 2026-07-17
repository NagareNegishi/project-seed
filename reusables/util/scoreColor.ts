// Perceptually uniform 0–100 score → colour using OKLCH.
// L and C are fixed so brightness and saturation stay constant across the range.
export function scoreColor(value: number, alpha = 1): string {
  const hue = 25 + (value / 100) * 120
  return alpha < 1
    ? `oklch(62% 0.18 ${hue} / ${alpha})`
    : `oklch(62% 0.18 ${hue})`
}
