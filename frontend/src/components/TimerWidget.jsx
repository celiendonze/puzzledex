import React from 'react';
import { useTimer, formatDigitalTime } from '../context/TimerContext';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function TimerWidget({ puzzle, activeAssembly, onFinishClick, onFinishAssemblyClick }) {
  const handleFinish = onFinishClick || onFinishAssemblyClick;
  const {
    getPuzzleTimer,
    startPuzzleTimer,
    pausePuzzleTimer,
    resetPuzzleTimer,
    wakeLockEnabled,
    setWakeLockEnabled,
  } = useTimer();

  // Récupère l'état du timer pour CE puzzle en mémoire (ou les secondes cumulées de l'assembly comme point de départ)
  const timerInfo = getPuzzleTimer(puzzle.id, activeAssembly?.total_duration_seconds || 0);
  const { seconds, isRunning } = timerInfo;

  const handleStartOrPause = () => {
    if (isRunning) {
      pausePuzzleTimer(puzzle.id);
    } else {
      startPuzzleTimer(puzzle.id, activeAssembly.id, seconds);
    }
  };

  const handleReset = () => {
    if (window.confirm("Voulez-vous réinitialiser le chronomètre de ce puzzle à 00:00:00 ?")) {
      resetPuzzleTimer(puzzle.id);
    }
  };

  return (
    <div className="bg-atelier-subtle border-2 border-atelier-border rounded-2xl p-5 sm:p-7 text-center shadow-xs">
      
      {/* Badge de la réalisation en cours */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-atelier-amberLight text-atelier-amber border border-atelier-amber/40 mb-2 sm:mb-3 shadow-2xs">
        <span>⚙️</span>
        <span>Réalisation #{activeAssembly.run_number} en cours</span>
      </div>

      {/* Grand affichage digital */}
      <div className="font-mono text-5xl sm:text-6xl font-bold tracking-wider text-atelier-text my-2 sm:my-4 select-none">
        {formatDigitalTime(seconds)}
      </div>

      {/* Boutons d'action alignés pour mobile & desktop */}
      <div className="mt-5 sm:mt-6 max-w-md mx-auto flex flex-col gap-3">
        
        {/* Ligne 1 sur mobile / Colonne 1 sur grand écran : Démarrer / Pause */}
        <button
          onClick={handleStartOrPause}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-base font-bold shadow-xs transition-all transform active:scale-98 cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-stone-900'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{seconds > 0 ? 'Reprendre' : 'Démarrer'}</span>
            </>
          )}
        </button>

        {/* Ligne 2 : Réinitialiser et Terminer côte à côte sur mobile */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Bouton Réinitialiser */}
          <button
            onClick={handleReset}
            disabled={seconds === 0}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-atelier-surface border border-atelier-border text-atelier-muted hover:text-atelier-text hover:bg-atelier-border/40 transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Remettre le chronomètre à zéro"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </button>

          {/* Bouton Terminer */}
          <button
            onClick={handleFinish}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-atelier-sauge hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Valider la fin de l'assemblage et enregistrer le chrono actuel"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terminer</span>
          </button>
        </div>

      </div>

      {/* Option Écran toujours allumé (WakeLock) */}
      <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2 text-xs text-atelier-muted">
        <input
          type="checkbox"
          id="wake-lock-toggle"
          checked={wakeLockEnabled}
          onChange={e => setWakeLockEnabled(e.target.checked)}
          className="rounded border-atelier-border text-atelier-primary focus:ring-atelier-primary cursor-pointer w-4 h-4"
        />
        <label htmlFor="wake-lock-toggle" className="cursor-pointer select-none">
          Garder l'écran allumé pendant le chronométrage
        </label>
      </div>

    </div>
  );
}
