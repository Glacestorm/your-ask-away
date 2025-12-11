/**
 * AVIF/WebP Automatic Image Optimization Utilities
 * Priority 3 - Core Web Vitals Optimization
 */

// Check browser support for modern image formats
export const supportsAvif = (): boolean => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').startsWith('data:image/avif');
};

export const supportsWebP = (): boolean => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

// Cached format detection
let cachedFormat: 'avif' | 'webp' | 'original' | null = null;

export const getBestImageFormat = async (): Promise<'avif' | 'webp' | 'original'> => {
  if (cachedFormat) return cachedFormat;
  
  // Test AVIF support
  const avifSupport = await testImageFormat('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgADlAgIGkyCR/wAABAAACvcA==');
  if (avifSupport) {
    cachedFormat = 'avif';
    return 'avif';
  }
  
  // Test WebP support
  const webpSupport = await testImageFormat('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');
  if (webpSupport) {
    cachedFormat = 'webp';
    return 'webp';
  }
  
  cachedFormat = 'original';
  return 'original';
};

const testImageFormat = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

// Convert image URL to optimized format
export const getOptimizedImageUrl = async (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<string> => {
  // Skip data URLs and blob URLs
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return originalUrl;
  }
  
  const format = await getBestImageFormat();
  
  // If using a CDN that supports format transformation
  if (originalUrl.includes('supabase.co/storage')) {
    const url = new URL(originalUrl);
    const params = new URLSearchParams(url.search);
    
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.quality) params.set('quality', options.quality.toString());
    if (format !== 'original') params.set('format', format);
    
    url.search = params.toString();
    return url.toString();
  }
  
  return originalUrl;
};

// Generate srcset for responsive images
export const generateSrcSet = async (
  originalUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920]
): Promise<string> => {
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return '';
  }
  
  const srcSetEntries = await Promise.all(
    widths.map(async (width) => {
      const url = await getOptimizedImageUrl(originalUrl, { width });
      return `${url} ${width}w`;
    })
  );
  
  return srcSetEntries.join(', ');
};

// Picture element sources generator
export interface ImageSource {
  srcSet: string;
  type: string;
  sizes?: string;
}

export const generatePictureSources = async (
  originalUrl: string,
  sizes: string = '100vw'
): Promise<ImageSource[]> => {
  const sources: ImageSource[] = [];
  const widths = [320, 640, 768, 1024, 1280, 1920];
  
  // Check AVIF support
  const avifSupported = await testImageFormat('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgADlAgIGkyCR/wAABAAACvcA==');
  
  if (avifSupported) {
    const avifSrcSet = widths.map(w => {
      const url = originalUrl.includes('supabase.co/storage') 
        ? `${originalUrl}?width=${w}&format=avif` 
        : originalUrl;
      return `${url} ${w}w`;
    }).join(', ');
    
    sources.push({
      srcSet: avifSrcSet,
      type: 'image/avif',
      sizes
    });
  }
  
  // Check WebP support
  const webpSupported = await testImageFormat('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==');
  
  if (webpSupported) {
    const webpSrcSet = widths.map(w => {
      const url = originalUrl.includes('supabase.co/storage') 
        ? `${originalUrl}?width=${w}&format=webp` 
        : originalUrl;
      return `${url} ${w}w`;
    }).join(', ');
    
    sources.push({
      srcSet: webpSrcSet,
      type: 'image/webp',
      sizes
    });
  }
  
  return sources;
};

// Image loading optimization
export const preloadCriticalImage = (src: string, format?: 'avif' | 'webp'): void => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = 'high';
  
  if (format) {
    link.type = `image/${format}`;
  }
  
  document.head.appendChild(link);
};

// Lazy loading with IntersectionObserver
export const createLazyImageObserver = (
  onVisible: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onVisible(entry);
        }
      });
    },
    {
      rootMargin: '200px',
      threshold: 0,
      ...options
    }
  );
};

export default {
  supportsAvif,
  supportsWebP,
  getBestImageFormat,
  getOptimizedImageUrl,
  generateSrcSet,
  generatePictureSources,
  preloadCriticalImage,
  createLazyImageObserver
};
