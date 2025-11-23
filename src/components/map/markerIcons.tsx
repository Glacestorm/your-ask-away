import {
  Building2,
  Factory,
  Store,
  Utensils,
  Hotel,
  Heart,
  GraduationCap,
  Car,
  Truck,
  Wrench,
  Laptop,
  Users,
  Briefcase,
  Home,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

// Mapping of sectors to icons
const sectorIconMap: Record<string, LucideIcon> = {
  // Construcción y Real Estate
  'construcción': Building2,
  'inmobiliaria': Home,
  'real estate': Home,
  
  // Industria y Manufactura
  'industria': Factory,
  'manufactura': Factory,
  'fabricación': Factory,
  
  // Comercio
  'comercio': Store,
  'retail': ShoppingCart,
  'tienda': Store,
  
  // Hostelería y Restauración
  'restaurante': Utensils,
  'hostelería': Hotel,
  'hotel': Hotel,
  'bar': Utensils,
  
  // Salud
  'salud': Heart,
  'sanidad': Heart,
  'farmacia': Heart,
  
  // Educación
  'educación': GraduationCap,
  'formación': GraduationCap,
  
  // Automoción
  'automoción': Car,
  'taller': Wrench,
  'mecánica': Wrench,
  
  // Transporte y Logística
  'transporte': Truck,
  'logística': Truck,
  
  // Tecnología
  'tecnología': Laptop,
  'informática': Laptop,
  'software': Laptop,
  
  // Servicios Profesionales
  'consultoría': Briefcase,
  'servicios': Users,
  'asesoría': Briefcase,
};

// Get icon based on sector or default
export function getSectorIcon(sector: string | null): LucideIcon {
  if (!sector) return Building2;
  
  const normalized = sector.toLowerCase().trim();
  
  // Try exact match first
  if (sectorIconMap[normalized]) {
    return sectorIconMap[normalized];
  }
  
  // Try partial match
  const partialMatch = Object.keys(sectorIconMap).find(key => 
    normalized.includes(key) || key.includes(normalized)
  );
  
  if (partialMatch) {
    return sectorIconMap[partialMatch];
  }
  
  return Building2;
}

// Convert Lucide icon to SVG string for use in markers
export function iconToSVGString(
  Icon: LucideIcon,
  color: string,
  size: number = 16
): string {
  // Create a temporary container to render the icon
  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);
  
  // Create React element and render to get SVG
  const iconSVG = `
    <svg 
      width="${size}" 
      height="${size}" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="${color}" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    >
      ${getIconPath(Icon)}
    </svg>
  `;
  
  container.remove();
  return iconSVG;
}

// Get the icon path for common Lucide icons
function getIconPath(Icon: LucideIcon): string {
  const iconName = Icon.displayName || Icon.name;
  
  // Map of icon names to their SVG paths
  const iconPaths: Record<string, string> = {
    'Building2': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    'Factory': '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
    'Store': '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>',
    'Utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    'Hotel': '<path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect x="4" y="2" width="16" height="20" rx="2"/>',
    'Heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'GraduationCap': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    'Car': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    'Truck': '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    'Wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'Laptop': '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
    'Users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'Briefcase': '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'Home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'ShoppingCart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  };
  
  return iconPaths[iconName] || iconPaths['Building2'];
}
