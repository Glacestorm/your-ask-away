/**
 * Hook para Device Fingerprinting - Fase 2 del Sistema de Licencias
 * Genera identificadores únicos de dispositivo para validación de licencias
 */

import { useState, useCallback, useEffect } from 'react';

export interface DeviceFingerprint {
  cpuHash: string;
  screenFingerprint: string;
  timezoneHash: string;
  languageHash: string;
  webGLHash: string;
  canvasHash: string;
  audioHash: string;
  storageQuotaHash: string;
  userAgentHash: string;
  platformHash: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  touchSupport: boolean;
  colorDepth: number;
  pixelRatio: number;
}

export interface FingerprintResult {
  fingerprint: string;
  components: DeviceFingerprint;
  confidence: number;
  generatedAt: string;
}

// Utility to hash a string using SHA-256
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Get WebGL fingerprint
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';
    
    const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return `${vendor}|${renderer}`;
  } catch {
    return 'webgl-error';
  }
}

// Get Canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    // Draw unique patterns
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Obelixia License', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device ID', 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

// Get Audio fingerprint
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return 'no-audio-context';
    
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0; // Mute
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);
    
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start(0);
    
    return new Promise((resolve) => {
      scriptProcessor.onaudioprocess = (event) => {
        const output = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < output.length; i++) {
          sum += Math.abs(output[i]);
        }
        oscillator.stop();
        context.close();
        resolve(sum.toString());
      };
      
      // Timeout fallback
      setTimeout(() => {
        try {
          oscillator.stop();
          context.close();
        } catch { /* ignore */ }
        resolve('audio-timeout');
      }, 1000);
    });
  } catch {
    return 'audio-error';
  }
}

// Get storage quota fingerprint
async function getStorageQuotaFingerprint(): Promise<string> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return `${estimate.quota || 0}|${estimate.usage || 0}`;
    }
    return 'no-storage-api';
  } catch {
    return 'storage-error';
  }
}

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<FingerprintResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFingerprint = useCallback(async (): Promise<FingerprintResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Collect all fingerprint components
      const [
        webGLFingerprint,
        canvasFingerprint,
        audioFingerprint,
        storageQuota
      ] = await Promise.all([
        Promise.resolve(getWebGLFingerprint()),
        Promise.resolve(getCanvasFingerprint()),
        getAudioFingerprint(),
        getStorageQuotaFingerprint()
      ]);

      // Screen info
      const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio}`;
      
      // System info
      const nav = navigator as Navigator & {
        deviceMemory?: number;
        hardwareConcurrency?: number;
      };
      
      const hardwareConcurrency = nav.hardwareConcurrency || 0;
      const deviceMemory = nav.deviceMemory || 0;
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Generate hashes for each component
      const [
        cpuHash,
        screenHash,
        timezoneHash,
        languageHash,
        webGLHash,
        canvasHash,
        audioHash,
        storageHash,
        userAgentHash,
        platformHash
      ] = await Promise.all([
        hashString(`${hardwareConcurrency}|${deviceMemory}`),
        hashString(screenInfo),
        hashString(Intl.DateTimeFormat().resolvedOptions().timeZone),
        hashString(navigator.language + '|' + navigator.languages.join(',')),
        hashString(webGLFingerprint),
        hashString(canvasFingerprint),
        hashString(audioFingerprint),
        hashString(storageQuota),
        hashString(navigator.userAgent),
        hashString(navigator.platform)
      ]);

      const components: DeviceFingerprint = {
        cpuHash,
        screenFingerprint: screenHash,
        timezoneHash,
        languageHash,
        webGLHash,
        canvasHash,
        audioHash,
        storageQuotaHash: storageHash,
        userAgentHash,
        platformHash,
        hardwareConcurrency,
        deviceMemory,
        touchSupport,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio
      };

      // Generate master fingerprint from all components
      const masterString = Object.values(components).join('|');
      const masterFingerprint = await hashString(masterString);

      // Calculate confidence based on available components
      let confidence = 100;
      if (webGLFingerprint.includes('error') || webGLFingerprint.includes('no-')) confidence -= 15;
      if (canvasFingerprint.includes('error') || canvasFingerprint.includes('no-')) confidence -= 15;
      if (audioFingerprint.includes('error') || audioFingerprint.includes('no-')) confidence -= 10;
      if (hardwareConcurrency === 0) confidence -= 10;
      if (deviceMemory === 0) confidence -= 10;

      const result: FingerprintResult = {
        fingerprint: masterFingerprint,
        components,
        confidence: Math.max(0, confidence),
        generatedAt: new Date().toISOString()
      };

      setFingerprint(result);
      
      // Cache in localStorage for offline validation
      try {
        localStorage.setItem('obelixia_device_fp', JSON.stringify({
          fingerprint: result.fingerprint,
          generatedAt: result.generatedAt
        }));
      } catch { /* localStorage might be disabled */ }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating fingerprint';
      setError(message);
      console.error('[useDeviceFingerprint] Error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Get cached fingerprint from localStorage
  const getCachedFingerprint = useCallback((): { fingerprint: string; generatedAt: string } | null => {
    try {
      const cached = localStorage.getItem('obelixia_device_fp');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Check if fingerprint is stale (older than 24 hours)
  const isFingerprintStale = useCallback((generatedAt: string): boolean => {
    const generated = new Date(generatedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - generated.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24;
  }, []);

  // Auto-generate on mount if no cached fingerprint
  useEffect(() => {
    const cached = getCachedFingerprint();
    if (!cached || isFingerprintStale(cached.generatedAt)) {
      generateFingerprint();
    } else {
      // Use cached fingerprint temporarily
      setFingerprint({
        fingerprint: cached.fingerprint,
        components: {} as DeviceFingerprint,
        confidence: 80, // Lower confidence for cached
        generatedAt: cached.generatedAt
      });
    }
  }, [generateFingerprint, getCachedFingerprint, isFingerprintStale]);

  return {
    fingerprint,
    isGenerating,
    error,
    generateFingerprint,
    getCachedFingerprint,
    isFingerprintStale
  };
}

export default useDeviceFingerprint;
