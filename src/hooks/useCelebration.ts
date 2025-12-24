import { useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { KBStatus, KBError } from './core';

export type CelebrationError = KBError;

const CELEBRATED_GOALS_KEY = 'celebrated_goals';

export function useCelebration() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

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
    // KB 2.0
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    clearError,
    reset,
  };
}
