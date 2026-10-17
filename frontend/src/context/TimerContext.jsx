import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createSession, updateAssembly } from '../api';

const TimerContext = createContext();

const STORAGE_KEY = 'puzzledex_puzzle_timers';

export function TimerProvider({ children }) {
  // Map des timers par puzzleId : { [puzzleId]: { assemblyId, accumulatedSeconds, lastResumeTime, isRunning } }
  const [timers, setTimers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });

  const [wakeLockEnabled, setWakeLockEnabled] = useState(true);
  const [tick, setTick] = useState(0);
  const wakeLockRef = useRef(null);

  // Synchronisation avec localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

  // Vérifier si au moins un puzzle a son chronomètre actif
  const hasRunningTimer = Object.values(timers).some(t => t.isRunning);

  // Horloge de rafraîchissement (chaque seconde quand au moins un chrono tourne)
  useEffect(() => {
    if (!hasRunningTimer) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [hasRunningTimer]);

  // Gestion du WakeLock (écran toujours allumé sur mobile/tablette)
  useEffect(() => {
    async function requestWakeLock() {
      if ('wakeLock' in navigator && hasRunningTimer && wakeLockEnabled) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (_) {}
      }
    }

    if (hasRunningTimer && wakeLockEnabled) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && hasRunningTimer && wakeLockEnabled) {
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
  }, [hasRunningTimer, wakeLockEnabled]);

  // Récupérer le temps et l'état courant pour un puzzle donné
  const getPuzzleTimer = (puzzleId, fallbackInitialSeconds = 0) => {
    const pTimer = timers[puzzleId];
    if (!pTimer) {
      return {
        seconds: fallbackInitialSeconds,
        isRunning: false,
        hasTimerInMemory: false,
      };
    }

    let currentSec = pTimer.accumulatedSeconds || 0;
    if (pTimer.isRunning && pTimer.lastResumeTime) {
      const segment = Math.floor((Date.now() - pTimer.lastResumeTime) / 1000);
      currentSec += segment;
    }

    return {
      seconds: currentSec,
      isRunning: Boolean(pTimer.isRunning),
      hasTimerInMemory: true,
    };
  };

  // Démarrer ou reprendre le chronomètre pour un puzzle
  const startPuzzleTimer = (puzzleId, assemblyId, initialSeconds = 0) => {
    const now = Date.now();
    setTimers(prev => {
      const existing = prev[puzzleId];
      if (existing) {
        return {
          ...prev,
          [puzzleId]: {
            ...existing,
            assemblyId,
            lastResumeTime: now,
            isRunning: true,
          },
        };
      }
      return {
        ...prev,
        [puzzleId]: {
          assemblyId,
          accumulatedSeconds: initialSeconds,
          lastResumeTime: now,
          isRunning: true,
        },
      };
    });
  };

  // Mettre en pause le chronomètre d'un puzzle (conserve le temps en mémoire)
  const pausePuzzleTimer = (puzzleId) => {
    const now = Date.now();
    setTimers(prev => {
      const existing = prev[puzzleId];
      if (!existing || !existing.isRunning) return prev;

      const segment = Math.floor((now - (existing.lastResumeTime || now)) / 1000);
      return {
        ...prev,
        [puzzleId]: {
          ...existing,
          accumulatedSeconds: (existing.accumulatedSeconds || 0) + segment,
          lastResumeTime: null,
          isRunning: false,
        },
      };
    });
  };

  // Réinitialiser le chronomètre d'un puzzle à zéro
  const resetPuzzleTimer = (puzzleId) => {
    setTimers(prev => {
      const existing = prev[puzzleId];
      if (!existing) return prev;
      return {
        ...prev,
        [puzzleId]: {
          ...existing,
          accumulatedSeconds: 0,
          lastResumeTime: null,
          isRunning: false,
        },
      };
    });
  };

  // Terminer l'assemblage : enregistre le temps en cours dans la base de données et clôture la réalisation
  const finishPuzzleAssembly = async (puzzleId, assemblyId, notes = '') => {
    const currentTimer = getPuzzleTimer(puzzleId, 0);
    const finalSeconds = currentTimer.seconds;

    // Si du temps a été chronométré, on l'enregistre comme session d'assemblage
    if (finalSeconds > 0) {
      const now = new Date();
      const startedAt = new Date(now.getTime() - finalSeconds * 1000).toISOString();
      const endedAt = now.toISOString();

      await createSession(assemblyId, {
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: finalSeconds,
        notes: notes || null,
      });
    }

    // Clôturer la réalisation comme terminée
    const updated = await updateAssembly(assemblyId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: notes || null,
    });

    // Supprimer le timer en mémoire pour ce puzzle
    setTimers(prev => {
      const copy = { ...prev };
      delete copy[puzzleId];
      return copy;
    });

    return updated;
  };

  return (
    <TimerContext.Provider
      value={{
        timers,
        tick,
        wakeLockEnabled,
        setWakeLockEnabled,
        getPuzzleTimer,
        startPuzzleTimer,
        pausePuzzleTimer,
        resetPuzzleTimer,
        finishPuzzleAssembly,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}

// Utilitaires de formatage
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
