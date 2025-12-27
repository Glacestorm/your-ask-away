import { useGeoLanguageDetection } from '@/hooks/useGeoLanguageDetection';

/**
 * Component that handles automatic language detection based on user's IP/location.
 * This component doesn't render anything visible - it only triggers the detection
 * and shows a toast suggestion if a different language is detected.
 * 
 * It should be included once in the app, typically near the root.
 */
export function GeoLanguageDetector() {
  // Just initialize the hook - it handles everything internally
  useGeoLanguageDetection();
  
  return null;
}

export default GeoLanguageDetector;
