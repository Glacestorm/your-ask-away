import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingPattern {
  avgKeyInterval: number;
  keyHoldDuration: number;
  stdDeviation: number;
  digraphTimings: Record<string, number>;
  commonErrors: string[];
}

interface MouseBehavior {
  avgSpeed: number;
  avgAcceleration: number;
  clickPatterns: string[];
  hoverDuration: number;
  scrollVelocity: number;
  movementEntropy: number;
}

interface TouchBehavior {
  avgPressure: number;
  swipeVelocity: number;
  pinchFrequency: number;
  tapDuration: number;
  multiTouchUsage: boolean;
}

interface NavigationPattern {
  pageSequences: string[];
  avgTimeOnPage: number;
  backButtonUsage: number;
  searchUsage: number;
  menuInteraction: string;
}

interface BiometricProfile {
  typing: TypingPattern;
  mouse: MouseBehavior;
  touch: TouchBehavior | null;
  navigation: NavigationPattern;
  sessionMetrics: {
    totalDuration: number;
    activeTime: number;
    idleTime: number;
    focusLostCount: number;
  };
}

interface BiometricAnomaly {
  type: 'typing' | 'mouse' | 'touch' | 'navigation' | 'session';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  timestamp: Date;
  rawData?: any;
}

interface UseBehavioralBiometricsReturn {
  isCollecting: boolean;
  currentProfile: BiometricProfile | null;
  anomalies: BiometricAnomaly[];
  matchScore: number;
  startCollection: () => void;
  stopCollection: () => void;
  getTypingDNA: () => TypingPattern | null;
  getMouseDNA: () => MouseBehavior | null;
  compareWithBaseline: () => Promise<{ match: boolean; score: number; anomalies: BiometricAnomaly[] }>;
}

export function useBehavioralBiometrics(): UseBehavioralBiometricsReturn {
  const { user } = useAuth();
  const [isCollecting, setIsCollecting] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<BiometricProfile | null>(null);
  const [anomalies, setAnomalies] = useState<BiometricAnomaly[]>([]);
  const [matchScore, setMatchScore] = useState(100);

  // Typing metrics
  const keyDownTimes = useRef<Map<string, number>>(new Map());
  const keyIntervals = useRef<number[]>([]);
  const keyHoldDurations = useRef<number[]>([]);
  const digraphTimings = useRef<Map<string, number[]>>(new Map());
  const lastKeyTime = useRef<number>(0);
  const lastKey = useRef<string>('');

  // Mouse metrics
  const mousePositions = useRef<{ x: number; y: number; t: number }[]>([]);
  const mouseClicks = useRef<{ x: number; y: number; t: number; button: number }[]>([]);
  const scrollEvents = useRef<{ delta: number; t: number }[]>([]);
  const hoverEvents = useRef<{ element: string; duration: number }[]>([]);

  // Touch metrics (mobile)
  const touchEvents = useRef<{ pressure: number; radius: number; t: number }[]>([]);
  const swipeVelocities = useRef<number[]>([]);

  // Session metrics
  const sessionStart = useRef<number>(Date.now());
  const activeTime = useRef<number>(0);
  const lastActivity = useRef<number>(Date.now());
  const focusLostCount = useRef<number>(0);
  const pageVisits = useRef<{ path: string; duration: number }[]>([]);

  // Calculate typing DNA (unique typing patterns)
  const getTypingDNA = useCallback((): TypingPattern | null => {
    if (keyIntervals.current.length < 10) return null;

    const intervals = keyIntervals.current;
    const holds = keyHoldDurations.current;
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgHold = holds.length > 0 ? holds.reduce((a, b) => a + b, 0) / holds.length : 0;
    
    // Calculate standard deviation
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Convert digraph timings to averages
    const digraphs: Record<string, number> = {};
    digraphTimings.current.forEach((timings, key) => {
      if (timings.length >= 3) {
        digraphs[key] = timings.reduce((a, b) => a + b, 0) / timings.length;
      }
    });

    return {
      avgKeyInterval: avgInterval,
      keyHoldDuration: avgHold,
      stdDeviation: stdDev,
      digraphTimings: digraphs,
      commonErrors: [] // Could track backspace patterns
    };
  }, []);

  // Calculate mouse behavior DNA
  const getMouseDNA = useCallback((): MouseBehavior | null => {
    if (mousePositions.current.length < 20) return null;

    const positions = mousePositions.current;
    const speeds: number[] = [];
    const accelerations: number[] = [];

    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[i - 1].x;
      const dy = positions[i].y - positions[i - 1].y;
      const dt = positions[i].t - positions[i - 1].t;
      
      if (dt > 0) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / dt;
        speeds.push(speed);
        
        if (i > 1 && speeds.length > 1) {
          const accel = Math.abs(speeds[speeds.length - 1] - speeds[speeds.length - 2]) / dt;
          accelerations.push(accel);
        }
      }
    }

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const avgAccel = accelerations.length > 0 ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0;

    // Calculate movement entropy (randomness/uniqueness)
    const directions = positions.slice(1).map((p, i) => {
      const dx = p.x - positions[i].x;
      const dy = p.y - positions[i].y;
      return Math.atan2(dy, dx);
    });
    
    const directionBins = new Array(8).fill(0);
    directions.forEach(d => {
      const bin = Math.floor(((d + Math.PI) / (2 * Math.PI)) * 8) % 8;
      directionBins[bin]++;
    });
    
    const total = directions.length;
    const entropy = -directionBins.reduce((sum, count) => {
      if (count === 0) return sum;
      const p = count / total;
      return sum + p * Math.log2(p);
    }, 0);

    const scrollDeltas = scrollEvents.current;
    const avgScroll = scrollDeltas.length > 0 
      ? scrollDeltas.reduce((a, b) => a + Math.abs(b.delta), 0) / scrollDeltas.length 
      : 0;

    const avgHover = hoverEvents.current.length > 0
      ? hoverEvents.current.reduce((a, b) => a + b.duration, 0) / hoverEvents.current.length
      : 0;

    return {
      avgSpeed,
      avgAcceleration: avgAccel,
      clickPatterns: mouseClicks.current.slice(-10).map(c => `${c.button}:${c.x}:${c.y}`),
      hoverDuration: avgHover,
      scrollVelocity: avgScroll,
      movementEntropy: entropy
    };
  }, []);

  // Event handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isCollecting) return;
    
    const now = performance.now();
    keyDownTimes.current.set(e.key, now);
    
    if (lastKeyTime.current > 0) {
      const interval = now - lastKeyTime.current;
      if (interval > 0 && interval < 2000) {
        keyIntervals.current.push(interval);
        
        // Track digraph timing
        if (lastKey.current) {
          const digraph = `${lastKey.current}${e.key}`;
          const existing = digraphTimings.current.get(digraph) || [];
          existing.push(interval);
          digraphTimings.current.set(digraph, existing.slice(-10));
        }
      }
    }
    
    lastKey.current = e.key;
    lastKeyTime.current = now;
    lastActivity.current = Date.now();
  }, [isCollecting]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isCollecting) return;
    
    const downTime = keyDownTimes.current.get(e.key);
    if (downTime) {
      const holdDuration = performance.now() - downTime;
      if (holdDuration > 0 && holdDuration < 1000) {
        keyHoldDurations.current.push(holdDuration);
      }
      keyDownTimes.current.delete(e.key);
    }
  }, [isCollecting]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isCollecting) return;
    
    mousePositions.current.push({
      x: e.clientX,
      y: e.clientY,
      t: performance.now()
    });
    
    // Keep only last 500 positions
    if (mousePositions.current.length > 500) {
      mousePositions.current = mousePositions.current.slice(-500);
    }
    
    lastActivity.current = Date.now();
  }, [isCollecting]);

  const handleMouseClick = useCallback((e: MouseEvent) => {
    if (!isCollecting) return;
    
    mouseClicks.current.push({
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      button: e.button
    });
    
    if (mouseClicks.current.length > 100) {
      mouseClicks.current = mouseClicks.current.slice(-100);
    }
  }, [isCollecting]);

  const handleScroll = useCallback((e: Event) => {
    if (!isCollecting) return;
    
    const scrollY = window.scrollY;
    const lastScroll = scrollEvents.current[scrollEvents.current.length - 1];
    const delta = lastScroll ? scrollY - (lastScroll.delta || 0) : scrollY;
    
    scrollEvents.current.push({
      delta: scrollY,
      t: performance.now()
    });
    
    if (scrollEvents.current.length > 100) {
      scrollEvents.current = scrollEvents.current.slice(-100);
    }
  }, [isCollecting]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      focusLostCount.current++;
    } else {
      lastActivity.current = Date.now();
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isCollecting) return;
    
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      touchEvents.current.push({
        pressure: (touch as any).force || 0.5,
        radius: touch.radiusX || 10,
        t: performance.now()
      });
    }
  }, [isCollecting]);

  // Start/stop collection
  const startCollection = useCallback(() => {
    setIsCollecting(true);
    sessionStart.current = Date.now();
    
    // Reset all metrics
    keyIntervals.current = [];
    keyHoldDurations.current = [];
    digraphTimings.current.clear();
    mousePositions.current = [];
    mouseClicks.current = [];
    scrollEvents.current = [];
    touchEvents.current = [];
  }, []);

  const stopCollection = useCallback(() => {
    setIsCollecting(false);
    
    const typing = getTypingDNA();
    const mouse = getMouseDNA();
    
    if (typing || mouse) {
      const profile: BiometricProfile = {
        typing: typing || {
          avgKeyInterval: 0,
          keyHoldDuration: 0,
          stdDeviation: 0,
          digraphTimings: {},
          commonErrors: []
        },
        mouse: mouse || {
          avgSpeed: 0,
          avgAcceleration: 0,
          clickPatterns: [],
          hoverDuration: 0,
          scrollVelocity: 0,
          movementEntropy: 0
        },
        touch: touchEvents.current.length > 0 ? {
          avgPressure: touchEvents.current.reduce((a, b) => a + b.pressure, 0) / touchEvents.current.length,
          swipeVelocity: swipeVelocities.current.length > 0 
            ? swipeVelocities.current.reduce((a, b) => a + b, 0) / swipeVelocities.current.length 
            : 0,
          pinchFrequency: 0,
          tapDuration: 0,
          multiTouchUsage: false
        } : null,
        navigation: {
          pageSequences: pageVisits.current.map(p => p.path),
          avgTimeOnPage: pageVisits.current.length > 0 
            ? pageVisits.current.reduce((a, b) => a + b.duration, 0) / pageVisits.current.length 
            : 0,
          backButtonUsage: 0,
          searchUsage: 0,
          menuInteraction: 'unknown'
        },
        sessionMetrics: {
          totalDuration: Date.now() - sessionStart.current,
          activeTime: activeTime.current,
          idleTime: 0,
          focusLostCount: focusLostCount.current
        }
      };
      
      setCurrentProfile(profile);
    }
  }, [getTypingDNA, getMouseDNA]);

  // Compare current session with stored baseline
  const compareWithBaseline = useCallback(async (): Promise<{
    match: boolean;
    score: number;
    anomalies: BiometricAnomaly[];
  }> => {
    if (!user?.id) {
      return { match: false, score: 0, anomalies: [] };
    }

    const currentTyping = getTypingDNA();
    const currentMouse = getMouseDNA();
    const detectedAnomalies: BiometricAnomaly[] = [];

    try {
      // Get stored baseline from behavior_patterns
      const { data: baseline } = await supabase
        .from('user_behavior_patterns')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const baselineData = baseline as any;

      if (!baselineData) {
        return { match: true, score: 100, anomalies: [] };
      }

      let totalScore = 100;

      // Compare typing patterns
      if (currentTyping && baselineData.avg_typing_speed) {
        const typingDiff = Math.abs(currentTyping.avgKeyInterval - baselineData.avg_typing_speed);
        const typingStd = baselineData.typing_speed_std || 50;
        const typingZScore = typingDiff / typingStd;

        if (typingZScore > 3) {
          totalScore -= 25;
          detectedAnomalies.push({
            type: 'typing',
            severity: 'high',
            description: `Velocidad de escritura muy diferente (z-score: ${typingZScore.toFixed(1)})`,
            confidence: 0.9,
            timestamp: new Date()
          });
        } else if (typingZScore > 2) {
          totalScore -= 10;
          detectedAnomalies.push({
            type: 'typing',
            severity: 'medium',
            description: `Velocidad de escritura inusual (z-score: ${typingZScore.toFixed(1)})`,
            confidence: 0.7,
            timestamp: new Date()
          });
        }
      }

      // Compare mouse behavior
      if (currentMouse && baselineData.typical_actions_per_session) {
        const interactionRate = mouseClicks.current.length / ((Date.now() - sessionStart.current) / 1000);
        const avgRate = baselineData.typical_actions_per_session / (baselineData.avg_session_duration || 1);
        const rateDiff = Math.abs(interactionRate - avgRate);
        
        if (rateDiff > avgRate * 3) {
          totalScore -= 20;
          detectedAnomalies.push({
            type: 'mouse',
            severity: 'high',
            description: 'Patrón de interacción muy diferente del habitual',
            confidence: 0.85,
            timestamp: new Date()
          });
        }

        // Check mouse entropy (bot detection)
        if (currentMouse.movementEntropy < 1.5) {
          totalScore -= 30;
          detectedAnomalies.push({
            type: 'mouse',
            severity: 'critical',
            description: 'Movimiento de ratón sospechosamente lineal (posible bot)',
            confidence: 0.95,
            timestamp: new Date()
          });
        }
      }

      // Compare session duration
      if (baselineData.avg_session_duration) {
        const currentDuration = Date.now() - sessionStart.current;
        const durationRatio = currentDuration / baselineData.avg_session_duration;
        
        if (durationRatio < 0.1 || durationRatio > 10) {
          totalScore -= 10;
          detectedAnomalies.push({
            type: 'session',
            severity: 'medium',
            description: 'Duración de sesión inusual',
            confidence: 0.6,
            timestamp: new Date()
          });
        }
      }

      setMatchScore(Math.max(0, totalScore));
      setAnomalies(detectedAnomalies);

      return {
        match: totalScore >= 50,
        score: totalScore,
        anomalies: detectedAnomalies
      };
    } catch (error) {
      console.error('Error comparing biometrics:', error);
      return { match: true, score: 100, anomalies: [] };
    }
  }, [user?.id, getTypingDNA, getMouseDNA]);

  // Setup event listeners
  useEffect(() => {
    if (isCollecting) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleMouseClick);
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleMouseClick);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isCollecting, handleKeyDown, handleKeyUp, handleMouseMove, handleMouseClick, handleScroll, handleTouchStart, handleVisibilityChange]);

  // Auto-start collection when user is authenticated
  useEffect(() => {
    if (user?.id && !isCollecting) {
      startCollection();
    }
    
    return () => {
      if (isCollecting) {
        stopCollection();
      }
    };
  }, [user?.id]);

  return {
    isCollecting,
    currentProfile,
    anomalies,
    matchScore,
    startCollection,
    stopCollection,
    getTypingDNA,
    getMouseDNA,
    compareWithBaseline
  };
}
