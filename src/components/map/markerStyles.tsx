export type MarkerStyle = 'classic' | 'modern' | 'minimal';

export interface MarkerStyleConfig {
  id: MarkerStyle;
  name: string;
  description: string;
  renderSVG: (color: string, width: number, height: number, vinculacionPct?: number) => string;
}

export const markerStyles: Record<MarkerStyle, MarkerStyleConfig> = {
  classic: {
    id: 'classic',
    name: 'Clásica',
    description: 'Chincheta tradicional con punta',
    renderSVG: (color: string, width: number, height: number, vinculacionPct?: number) => `
      <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-classic" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z" 
              fill="${color}" 
              stroke="white" 
              stroke-width="1.5" 
              filter="url(#shadow-classic)"/>
        <circle cx="12" cy="8" r="3" fill="white" opacity="0.9"/>
        ${vinculacionPct ? `
          <text x="12" y="10" text-anchor="middle" fill="black" font-size="5" font-weight="bold">
            ${vinculacionPct}%
          </text>
        ` : ''}
      </svg>
    `
  },
  modern: {
    id: 'modern',
    name: 'Moderna',
    description: 'Diseño geométrico contemporáneo',
    renderSVG: (color: string, width: number, height: number, vinculacionPct?: number) => `
      <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-modern" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:0.7" />
          </linearGradient>
          <filter id="shadow-modern" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="M12 2 L20 10 L20 18 C20 22 16 26 12 32 C8 26 4 22 4 18 L4 10 Z" 
              fill="url(#grad-modern)" 
              stroke="white" 
              stroke-width="1.2" 
              filter="url(#shadow-modern)"/>
        <rect x="8" y="8" width="8" height="8" rx="1" fill="white" opacity="0.9"/>
        ${vinculacionPct ? `
          <text x="12" y="14" text-anchor="middle" fill="black" font-size="5" font-weight="600">
            ${vinculacionPct}%
          </text>
        ` : ''}
      </svg>
    `
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Diseño simple y limpio',
    renderSVG: (color: string, width: number, height: number, vinculacionPct?: number) => `
      <svg width="${width}" height="${height}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-minimal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
            <feOffset dx="0" dy="1" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="8" 
                fill="${color}" 
                stroke="white" 
                stroke-width="2" 
                filter="url(#shadow-minimal)"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.95"/>
        ${vinculacionPct ? `
          <text x="12" y="14.5" text-anchor="middle" fill="black" font-size="5" font-weight="500">
            ${vinculacionPct}%
          </text>
        ` : ''}
        <line x1="12" y1="20" x2="12" y2="28" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
      </svg>
    `
  }
};

export const getMarkerStyle = (styleId: MarkerStyle): MarkerStyleConfig => {
  return markerStyles[styleId] || markerStyles.classic;
};
