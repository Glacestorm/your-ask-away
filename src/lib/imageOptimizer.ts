/**
 * Image Optimizer Utility
 * Compresión automática y conversión a WebP/AVIF
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

export interface OptimizedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'webp',
  maintainAspectRatio: true,
};

/**
 * Check if browser supports AVIF
 */
export async function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABUJHkQIxAQA7AgEAAAAaAAAABAAAACAgAg==';
  });
}

/**
 * Check if browser supports WebP
 */
export async function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

/**
 * Get the best supported format
 */
export async function getBestFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
  if (await supportsAVIF()) return 'avif';
  if (await supportsWebP()) return 'webp';
  return 'jpeg';
}

/**
 * Load an image from a file or URL
 */
export function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    if (source instanceof File || source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(originalWidth, maxWidth),
      height: Math.min(originalHeight, maxHeight),
    };
  }

  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Optimize an image with compression and format conversion
 */
export async function optimizeImage(
  source: File | Blob | HTMLImageElement,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Load image if needed
  let img: HTMLImageElement;
  let originalSize: number;
  
  if (source instanceof HTMLImageElement) {
    img = source;
    originalSize = 0; // Can't determine original size from HTMLImageElement
  } else {
    originalSize = source.size;
    img = await loadImage(source);
  }

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth!,
    opts.maxHeight!,
    opts.maintainAspectRatio!
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, 0, 0, width, height);

  // Determine MIME type
  let mimeType: string;
  switch (opts.format) {
    case 'avif':
      mimeType = 'image/avif';
      break;
    case 'webp':
      mimeType = 'image/webp';
      break;
    case 'png':
      mimeType = 'image/png';
      break;
    case 'jpeg':
    default:
      mimeType = 'image/jpeg';
  }

  // Convert to blob with specified quality
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      opts.quality
    );
  });

  const url = URL.createObjectURL(blob);
  const optimizedSize = blob.size;
  const compressionRatio = originalSize > 0 
    ? Math.round((1 - optimizedSize / originalSize) * 100) 
    : 0;

  return {
    blob,
    url,
    width,
    height,
    originalSize,
    optimizedSize,
    compressionRatio,
    format: opts.format!,
  };
}

/**
 * Optimize multiple images in batch
 */
export async function optimizeImageBatch(
  sources: (File | Blob)[],
  options: ImageOptimizationOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<OptimizedImage[]> {
  const results: OptimizedImage[] = [];
  const total = sources.length;

  for (let i = 0; i < sources.length; i++) {
    const result = await optimizeImage(sources[i], options);
    results.push(result);
    onProgress?.(i + 1, total);
  }

  return results;
}

/**
 * Generate responsive image sizes
 */
export async function generateResponsiveSizes(
  source: File | Blob,
  sizes: number[] = [320, 640, 1024, 1920],
  options: Omit<ImageOptimizationOptions, 'maxWidth'> = {}
): Promise<Map<number, OptimizedImage>> {
  const results = new Map<number, OptimizedImage>();
  
  for (const size of sizes) {
    const result = await optimizeImage(source, {
      ...options,
      maxWidth: size,
      maxHeight: Math.round(size * 0.75), // 4:3 aspect ratio max
    });
    results.set(size, result);
  }

  return results;
}

/**
 * Create srcset string from responsive images
 */
export function createSrcSet(responsiveImages: Map<number, OptimizedImage>): string {
  const entries: string[] = [];
  
  responsiveImages.forEach((image, width) => {
    entries.push(`${image.url} ${width}w`);
  });

  return entries.join(', ');
}

/**
 * Cleanup optimized image URLs
 */
export function revokeOptimizedImageUrls(images: OptimizedImage | OptimizedImage[]): void {
  const imageArray = Array.isArray(images) ? images : [images];
  imageArray.forEach((img) => URL.revokeObjectURL(img.url));
}

/**
 * Get optimization statistics
 */
export function getOptimizationStats(images: OptimizedImage[]): {
  totalOriginal: number;
  totalOptimized: number;
  totalSaved: number;
  averageCompressionRatio: number;
} {
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalOptimized = images.reduce((sum, img) => sum + img.optimizedSize, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const averageCompressionRatio = images.length > 0
    ? images.reduce((sum, img) => sum + img.compressionRatio, 0) / images.length
    : 0;

  return {
    totalOriginal,
    totalOptimized,
    totalSaved,
    averageCompressionRatio: Math.round(averageCompressionRatio),
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
