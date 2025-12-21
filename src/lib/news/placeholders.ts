// Deterministic, license-safe placeholders for news images (no external assets)

const hashString = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const getNewsImageFallback = (id: string, seed: string) => {
  const h = hashString(`${seed}:${id}`);
  const hue1 = h % 360;
  const hue2 = (hue1 + 50 + (h % 90)) % 360;
  const hue3 = (hue2 + 40 + (h % 70)) % 360;

  const sat1 = clamp(55 + (h % 25), 45, 75);
  const sat2 = clamp(45 + ((h >> 3) % 30), 40, 70);

  const l1 = clamp(20 + ((h >> 5) % 18), 18, 40);
  const l2 = clamp(12 + ((h >> 7) % 16), 10, 32);

  const label = (seed || 'Noticias').toString().slice(0, 28);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue1} ${sat1}% ${l1}%)"/>
      <stop offset="55%" stop-color="hsl(${hue2} ${sat2}% ${l2}%)"/>
      <stop offset="100%" stop-color="hsl(${hue3} ${sat1}% ${l1}%)"/>
    </linearGradient>
    <radialGradient id="r" cx="55%" cy="30%" r="70%">
      <stop offset="0%" stop-color="white" stop-opacity="0.14"/>
      <stop offset="65%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
    <pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M0 48 L48 0" stroke="white" stroke-opacity="0.06" stroke-width="2"/>
    </pattern>
  </defs>

  <rect width="1600" height="900" fill="url(#g)"/>
  <rect width="1600" height="900" fill="url(#r)"/>
  <rect width="1600" height="900" fill="url(#p)"/>

  <g opacity="0.25">
    <circle cx="1280" cy="220" r="260" fill="white" opacity="0.06"/>
    <circle cx="360" cy="720" r="320" fill="white" opacity="0.05"/>
  </g>

  <g>
    <rect x="70" y="710" width="860" height="110" rx="28" fill="black" opacity="0.35"/>
    <text x="110" y="778" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="42" font-weight="700" fill="white" opacity="0.90">${label}</text>
    <text x="110" y="820" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="22" font-weight="500" fill="white" opacity="0.70">Imagen no disponible (placeholder)</text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
