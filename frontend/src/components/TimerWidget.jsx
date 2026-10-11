import React, { useState } from 'react';
import { useTimer, formatDigitalTime } from '../context/TimerContext';
import { Play, Pause, Save, RotateCcw, CheckCircle, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TimerWidget({ puzzle, activeAssembly, onSessionSaved, onFinishAssemblyClick }) {
  const {
    puzzleId,
    assemblyId,
    isRunning,
    displaySeconds,
    wakeLockEnabled,
    setWakeLockEnabled,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    recordAndSaveSession,
  } = useTimer();

  const [isSaving, setIsSaving] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isCurrentActiveInContext = puzzleId === puzzle.id && assemblyId === activeAssembly?.id;

  const handleStartOrPause = () => {
    if (!isCurrentActiveInContext) {
      startTimer(puzzle.id, puzzle.title, activeAssembly.id);
    } else {
      if (isRunning) {
        pauseTimer();
      } else {
        resumeTimer();
      }
    }
  };

  const handleOpenSaveModal = () => {
    if (!isCurrentActiveInContext || displaySeconds <= 0) return;
    pauseTimer();
    setSessionNote('');
    setSaveError('');
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await recordAndSaveSession(sessionNote);
      setShowSaveModal(false);
      if (onSessionSaved) onSessionSaved();
    } catch (err) {
      setSaveError(err.message || "Erreur lors de l'enregistrement de la session");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser le chronomètre de la session courante ? Ce temps non enregistré sera perdu.")) {
      resetTimer();
    }
  };

  return (
    <>
      <div className="bg-atelier-subtle border-2 border-atelier-border rounded-2xl p-6 sm:p-8 text-center shadow-xs">
        
        {/* Badge de la réalisation en cours */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-atelier-amberLight text-atelier-amber border border-atelier-amber/40 mb-3 shadow-2xs">
          <span>⚙️</span>
          <span>Réalisation #{activeAssembly.run_number} en cours</span>
        </div>

        {/* Grand affichage digital */}
        <div className="font-mono text-4xl sm:text-6xl font-bold tracking-wider text-atelier-text my-2 sm:my-3 select-none">
          {isCurrentActiveInContext ? formatDigitalTime(displaySeconds) : '00:00:00'}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
          
          {/* Bouton Démarrer / Pause */}
          <button
            onClick={handleStartOrPause}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold shadow-sm transition-all transform hover:scale-102 cursor-pointer ${
              isCurrentActiveInContext && isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-stone-900'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isCurrentActiveInContext && isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{isCurrentActiveInContext && displaySeconds > 0 ? 'Reprendre' : 'Démarrer'}</span>
              </>
            )}
          </button>

          {/* Bouton Enregistrer la session */}
          <button
            onClick={handleOpenSaveModal}
            disabled={!isCurrentActiveInContext || displaySeconds === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-atelier-surface border border-atelier-border text-atelier-text hover:bg-atelier-border/40 transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Enregistrer le temps écoulé comme une session et l'ajouter au total"
          >
            <Save className="w-4 h-4 text-atelier-primary" />
            <span>Enregistrer la session</span>
          </button>

          {/* Bouton Réinitialiser session */}
          {isCurrentActiveInContext && displaySeconds > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold text-atelier-muted hover:text-atelier-text hover:bg-atelier-border/30 transition-colors"
              title="Abandonner le temps non enregistré"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          )}

          {/* Bouton Terminer l'assemblage */}
          <button
            onClick={onFinishAssemblyClick}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-atelier-sauge hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer ml-auto sm:ml-0"
            title="Valider la fin de ce run de puzzle"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Terminer l'assemblage</span>
          </button>

        </div>

        {/* Option WakeLock (garder écran allumé) */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-atelier-muted">
          <input
            type="checkbox"
            id="wake-lock-toggle"
            checked={wakeLockEnabled}
            onChange={e => setWakeLockEnabled(e.target.checked)}
            className="rounded border-atelier-border text-atelier-primary focus:ring-atelier-primary cursor-pointer"
          />
          <label htmlFor="wake-lock-toggle" className="cursor-pointer select-none">
            Empêcher la mise en veille de l'écran pendant le chronométrage
          </label>
        </div>

      </div>

      {/* Modal Enregistrer la session */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-atelier-surface border border-atelier-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-atelier-text mb-2">
              Enregistrer cette session d'assemblage
            </h3>
            <p className="text-sm text-atelier-muted mb-4">
              Durée à enregistrer :{' '}
              <strong className="text-atelier-text font-mono text-base">
                {formatDigitalTime(displaySeconds)}
              </strong>
            </p>

            {saveError && (
              <div className="p-2 mb-3 bg-red-100 text-red-700 text-xs rounded-lg">
                {saveError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Note facultative pour cette session
              </label>
              <input
                type="text"
                autoFocus
                value={sessionNote}
                onChange={e => setSessionNote(e.target.value)}
                placeholder="ex. Tri des bordures et du ciel"
                className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm focus:outline-none focus:border-atelier-primary"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-lg border border-atelier-border text-atelier-muted hover:text-atelier-text text-sm cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-atelier-primary hover:bg-atelier-primaryHover text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : 'Valider la session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
