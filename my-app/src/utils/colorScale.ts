export const TEMP_MIN = -5;
export const TEMP_MAX = 35;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function toHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0');
}

// blue (-5°C) → cyan → green → yellow → orange → red (35°C)
export function tempToHex(temp: number): string {
  const t = Math.max(0, Math.min(1, (temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)));

  let r: number, g: number, b: number;

  if (t < 0.25) {
    const tt = t / 0.25;
    r = 0;
    g = lerp(0, 255, tt);
    b = 255;
  } else if (t < 0.5) {
    const tt = (t - 0.25) / 0.25;
    r = 0;
    g = 255;
    b = lerp(255, 0, tt);
  } else if (t < 0.75) {
    const tt = (t - 0.5) / 0.25;
    r = lerp(0, 255, tt);
    g = 255;
    b = 0;
  } else {
    const tt = (t - 0.75) / 0.25;
    r = 255;
    g = lerp(255, 0, tt);
    b = 0;
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
