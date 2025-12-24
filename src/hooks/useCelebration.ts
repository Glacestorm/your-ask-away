import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// === ERROR TIPADO KB ===
export interface CelebrationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const CELEBRATED_GOALS_KEY = 'celebrated_goals';

export function useCelebration() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // === ESTADO KB ===
  const [error, setError] = useState<CelebrationError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const getCelebratedGoals = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(CELEBRATED_GOALS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const markGoalAsCelebrated = useCallback((goalId: string) => {
    try {
      const celebrated = getCelebratedGoals();
      if (!celebrated.includes(goalId)) {
        celebrated.push(goalId);
        localStorage.setItem(CELEBRATED_GOALS_KEY, JSON.stringify(celebrated));
      }
    } catch (error) {
      console.error('Error marking goal as celebrated:', error);
    }
  }, [getCelebratedGoals]);

  const hasBeenCelebrated = useCallback((goalId: string): boolean => {
    return getCelebratedGoals().includes(goalId);
  }, [getCelebratedGoals]);

  const fireCelebration = useCallback(() => {
    // Fire confetti from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
    });

    // Fire confetti from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
    });

    // Fire confetti from the center after a small delay
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
      });
    }, 200);
  }, []);

  const fireStarBurst = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'],
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star'],
      origin: { x: 0.5, y: 0.5 },
    });

    confetti({
      ...defaults,
      particleCount: 20,
      scalar: 0.75,
      shapes: ['circle'],
      origin: { x: 0.5, y: 0.5 },
    });
  }, []);

  const celebrateGoalAchievement = useCallback((goalId: string) => {
    if (!hasBeenCelebrated(goalId)) {
      // Fire main celebration
      fireCelebration();
      
      // Fire star burst after a delay
      setTimeout(() => {
        fireStarBurst();
      }, 500);

      // Mark as celebrated
      markGoalAsCelebrated(goalId);
      
      return true; // Indicates this was a new celebration
    }
    return false; // Already celebrated
  }, [hasBeenCelebrated, fireCelebration, fireStarBurst, markGoalAsCelebrated]);

  return {
    celebrateGoalAchievement,
    hasBeenCelebrated,
    fireCelebration,
    fireStarBurst,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}
