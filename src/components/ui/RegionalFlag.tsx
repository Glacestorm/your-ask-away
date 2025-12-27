import React from 'react';
import { cn } from '@/lib/utils';

interface RegionalFlagProps {
  code: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// SVG paths for Spanish regional flags
const REGIONAL_FLAGS: Record<string, React.ReactNode> = {
  // Catalunya - Senyera (barras rojas y amarillas)
  ca: (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      <rect fill="#FCDD09" width="48" height="32"/>
      <rect fill="#DA121A" y="3.5" width="48" height="3.5"/>
      <rect fill="#DA121A" y="10.5" width="48" height="3.5"/>
      <rect fill="#DA121A" y="17.5" width="48" height="3.5"/>
      <rect fill="#DA121A" y="24.5" width="48" height="3.5"/>
    </svg>
  ),
  // País Vasco - Ikurriña
  eu: (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      <rect fill="#D52B1E" width="48" height="32"/>
      <path fill="#009B48" d="M0 14h20V0h8v14h20v4H28v14h-8V18H0z"/>
      <path fill="#FFFFFF" d="M0 13h21V0h6v13h21v6H27v13h-6V19H0z"/>
    </svg>
  ),
  // Galicia
  gl: (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      <rect fill="#FFFFFF" width="48" height="32"/>
      <rect fill="#0073CE" opacity="0.15" x="0" y="0" width="24" height="16"/>
      <rect fill="#0073CE" opacity="0.15" x="24" y="16" width="24" height="16"/>
    </svg>
  ),
  // Val d'Aran (Occitano) - Cruz de Tolosa
  oc: (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      <rect fill="#DA121A" width="48" height="32"/>
      <path fill="#FCDD09" d="M24 4l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
    </svg>
  ),
  // Asturias
  ast: (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      <rect fill="#0066B3" width="48" height="32"/>
      <path fill="#FCDD09" d="M24 8l2 5h5l-4 3 1.5 5-4.5-3-4.5 3 1.5-5-4-3h5z"/>
    </svg>
  ),
  // Aragón
  an: (
    <svg viewBox="0 0 48 32" className="w-full h-full">
      <rect fill="#FCDD09" width="48" height="32"/>
      <rect fill="#DA121A" y="3.5" width="48" height="3.5"/>
      <rect fill="#DA121A" y="10.5" width="48" height="3.5"/>
      <rect fill="#DA121A" y="17.5" width="48" height="3.5"/>
      <rect fill="#DA121A" y="24.5" width="48" height="3.5"/>
      <rect fill="#FFFFFF" x="2" y="2" width="12" height="10" rx="1"/>
      <path fill="#DA121A" d="M8 4l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3-2.5-2h3z"/>
    </svg>
  ),
};

// Fallback emoji flags for countries
const EMOJI_FLAGS: Record<string, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
  it: '🇮🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
  cs: '🇨🇿',
  ro: '🇷🇴',
  hu: '🇭🇺',
  sv: '🇸🇪',
  da: '🇩🇰',
  no: '🇳🇴',
  fi: '🇫🇮',
  el: '🇬🇷',
  tr: '🇹🇷',
  uk: '🇺🇦',
  ru: '🇷🇺',
  bg: '🇧🇬',
  hr: '🇭🇷',
  sk: '🇸🇰',
  sl: '🇸🇮',
  et: '🇪🇪',
  lv: '🇱🇻',
  lt: '🇱🇹',
  ga: '🇮🇪',
  is: '🇮🇸',
  mt: '🇲🇹',
  lb: '🇱🇺',
  bs: '🇧🇦',
  sr: '🇷🇸',
  mk: '🇲🇰',
  sq: '🇦🇱',
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  ja: '🇯🇵',
  ko: '🇰🇷',
  th: '🇹🇭',
  vi: '🇻🇳',
  id: '🇮🇩',
  ms: '🇲🇾',
  hi: '🇮🇳',
  bn: '🇧🇩',
  tl: '🇵🇭',
  ne: '🇳🇵',
  si: '🇱🇰',
  my: '🇲🇲',
  km: '🇰🇭',
  lo: '🇱🇦',
  ka: '🇬🇪',
  hy: '🇦🇲',
  az: '🇦🇿',
  kk: '🇰🇿',
  uz: '🇺🇿',
  ar: '🇸🇦',
  he: '🇮🇱',
  fa: '🇮🇷',
  ur: '🇵🇰',
  am: '🇪🇹',
  sw: '🇰🇪',
  ha: '🇳🇬',
  yo: '🇳🇬',
  ig: '🇳🇬',
  af: '🇿🇦',
  'pt-BR': '🇧🇷',
  'es-MX': '🇲🇽',
  'es-AR': '🇦🇷',
  'en-US': '🇺🇸',
  'fr-CA': '🇨🇦',
};

const SIZE_CLASSES = {
  sm: 'w-5 h-3.5',
  md: 'w-7 h-5',
  lg: 'w-9 h-6',
};

export function RegionalFlag({ code, className, size = 'md' }: RegionalFlagProps) {
  const regionalSvg = REGIONAL_FLAGS[code];
  
  if (regionalSvg) {
    return (
      <span 
        className={cn(
          SIZE_CLASSES[size],
          'inline-flex items-center justify-center rounded-sm overflow-hidden shadow-sm border border-border/30',
          className
        )}
        role="img"
        aria-label={`Bandera de ${code}`}
      >
        {regionalSvg}
      </span>
    );
  }
  
  // Fallback to emoji
  const emoji = EMOJI_FLAGS[code];
  if (emoji) {
    return (
      <span 
        className={cn('text-lg', size === 'sm' && 'text-base', size === 'lg' && 'text-xl', className)}
        role="img"
        aria-label={`Bandera de ${code}`}
      >
        {emoji}
      </span>
    );
  }
  
  // Default fallback
  return (
    <span 
      className={cn('text-lg', className)}
      role="img"
      aria-label="Bandera"
    >
      🌐
    </span>
  );
}

// Check if a code has a regional SVG flag
export function hasRegionalFlag(code: string): boolean {
  return code in REGIONAL_FLAGS;
}

export default RegionalFlag;
