/**
 * Dynamically loads Mapbox GL CSS only when map components are needed
 * This prevents loading the CSS in the initial bundle
 */

// Mapbox GL version - update this to match your mapbox-gl package version
// Note: This should be kept in sync with the mapbox-gl version in package.json
const MAPBOX_GL_VERSION = 'v3.8.0';

let isMapboxCSSLoaded = false;

export const loadMapboxCSS = (): Promise<void> => {
  // Return immediately if already loaded
  if (isMapboxCSSLoaded) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Check if already in DOM
    const existingLink = document.querySelector('link[href*="mapbox-gl.css"]');
    if (existingLink) {
      isMapboxCSSLoaded = true;
      resolve();
      return;
    }

    // Create and inject the stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://api.mapbox.com/mapbox-gl-js/${MAPBOX_GL_VERSION}/mapbox-gl.css`;
    
    link.onload = () => {
      isMapboxCSSLoaded = true;
      resolve();
    };
    
    link.onerror = () => {
      reject(new Error('Failed to load Mapbox CSS'));
    };

    document.head.appendChild(link);
  });
};
