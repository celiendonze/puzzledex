import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createSession } from '../api';

const TimerContext = createContext();

const STORAGE_KEY = 'puzzledex_active_timer';

export function TimerProvider({ children }) {
  // État du timer
  const [timerState, setTimerState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      puzzleId: null,
      puzzleTitle: null,
      assemblyId: null,
      startTime: null,         // timestamp en ms
      accumulatedSeconds: 0,   // secondes accumulées avant la dernière reprise
      lastResumeTime: null,    // timestamp en ms de la reprise
      isRunning: false,
    };
  });

  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [wakeLockEnabled, setWakeLockEnabled] = useState(true);
  const wakeLockRef = useRef(null);

  // Synchronisation avec localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
  }, [timerState]);

  // Calcul en direct des secondes écoulées
  useEffect(() => {
    const updateElapsed = () => {
      if (!timerState.puzzleId) {
        setDisplaySeconds(0);
        return;
      }
      if (timerState.isRunning && timerState.lastResumeTime) {
        const currentSegment = Math.floor((Date.now() - timerState.lastResumeTime) / 1000);
        setDisplaySeconds(timerState.accumulatedSeconds + currentSegment);
      } else {
        setDisplaySeconds(timerState.accumulatedSeconds);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 500);
    return () => clearInterval(interval);
  }, [timerState]);

  // Gestion du WakeLock (écran toujours allumé)
  useEffect(() => {
    async function requestWakeLock() {
      if ('wakeLock' in navigator && timerState.isRunning && wakeLockEnabled) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (_) {}
      }
    }

    if (timerState.isRunning && wakeLockEnabled) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && timerState.isRunning && wakeLockEnabled) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [timerState.isRunning, wakeLockEnabled]);

  // Actions
  const startTimer = (puzzleId, puzzleTitle, assemblyId) => {
    // Si c'est déjà ce puzzle qui tourne, reprendre
    if (timerState.puzzleId === puzzleId && timerState.assemblyId === assemblyId) {
      if (!timerState.isRunning) {
        resumeTimer();
      }
      return;
    }

    const now = Date.now();
    setTimerState({
      puzzleId,
      puzzleTitle,
      assemblyId,
      startTime: now,
      accumulatedSeconds: 0,
      lastResumeTime: now,
      isRunning: true,
    });
  };

  const pauseTimer = () => {
    if (!timerState.isRunning) return;
    const now = Date.now();
    const currentSegment = Math.floor((now - (timerState.lastResumeTime || now)) / 1000);
    setTimerState(prev => ({
      ...prev,
      accumulatedSeconds: prev.accumulatedSeconds + currentSegment,
      lastResumeTime: null,
      isRunning: false,
    }));
  };

  const resumeTimer = () => {
    if (timerState.isRunning) return;
    setTimerState(prev => ({
      ...prev,
      lastResumeTime: Date.now(),
      isRunning: true,
    }));
  };

  const resetTimer = () => {
    setTimerState({
      puzzleId: null,
      puzzleTitle: null,
      assemblyId: null,
      startTime: null,
      accumulatedSeconds: 0,
      lastResumeTime: null,
      isRunning: false,
    });
    setDisplaySeconds(0);
  };

  const recordAndSaveSession = async (notes = '') => {
    // Calculer la durée finale
    let finalSeconds = timerState.accumulatedSeconds;
    if (timerState.isRunning && timerState.lastResumeTime) {
      finalSeconds += Math.floor((Date.now() - timerState.lastResumeTime) / 1000);
    }

    if (finalSeconds <= 0) {
      throw new Error("La durée de la session doit être supérieure à 0 seconde.");
    }

    const startedAt = new Date(timerState.startTime || Date.now() - finalSeconds * 1000).toISOString();
    const endedAt = new Date().toISOString();

    const created = await createSession(timerState.assemblyId, {
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: finalSeconds,
      notes: notes || null,
    });

    // Remettre le timer à zéro pour la prochaine session
    resetTimer();
    return created;
  };

  return (
    <TimerContext.Provider
      value={{
        ...timerState,
        displaySeconds,
        wakeLockEnabled,
        setWakeLockEnabled,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        recordAndSaveSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}

// Utilitaires de formatage partagés
export function formatDigitalTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatFriendlyDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  if (sec === 0) return '0 min';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (m > 0) {
    return `${m}m`;
  }
  return `${s}s`;
}
