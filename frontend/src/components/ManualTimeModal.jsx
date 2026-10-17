import React, { useState, useEffect } from 'react';
import { X, Clock, Trophy, Plus, CheckCircle2, Calendar } from 'lucide-react';
import { addManualTime } from '../api';
import confetti from 'canvas-confetti';

export default function ManualTimeModal({
  isOpen,
  onClose,
  puzzle,
  onSaved,
  defaultAssemblyId = null,
}) {
  if (!isOpen || !puzzle) return null;

  const assemblies = puzzle.assemblies || [];
  const activeAssembly = assemblies.find(a => a.status === 'in_progress');

  const [targetType, setTargetType] = useState(() => {
    if (defaultAssemblyId) return 'specific_assembly';
    if (activeAssembly) return 'active_assembly';
    return 'new_completed';
  });

  const [selectedAssemblyId, setSelectedAssemblyId] = useState(() => defaultAssemblyId || activeAssembly?.id || '');
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultAssemblyId) {
      setTargetType('specific_assembly');
      setSelectedAssemblyId(defaultAssemblyId);
    } else if (activeAssembly) {
      setTargetType('active_assembly');
      setSelectedAssemblyId(activeAssembly.id);
    } else {
      setTargetType('new_completed');
      setSelectedAssemblyId('');
    }
    setError('');
  }, [defaultAssemblyId, puzzle, isOpen]);

  const totalSeconds =
    (parseInt(hours, 10) || 0) * 3600 +
    (parseInt(minutes, 10) || 0) * 60 +
    (parseInt(seconds, 10) || 0);

  // Boutons rapides pour incrémenter le temps
  const addQuickTime = (addMinutes) => {
    const current = totalSeconds + addMinutes * 60;
    setHours(Math.floor(current / 3600));
    setMinutes(Math.floor((current % 3600) / 60));
    setSeconds(current % 60);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalSeconds <= 0) {
      setError('Veuillez renseigner une durée supérieure à zéro.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const isCompleted = targetType === 'new_completed';
      const assemblyIdToTarget =
        targetType === 'active_assembly'
          ? activeAssembly?.id
          : targetType === 'specific_assembly'
          ? selectedAssemblyId
          : null;

      const startedAt = new Date(sessionDate).toISOString();

      await addManualTime(puzzle.id, {
        duration_seconds: totalSeconds,
        completed: isCompleted,
        started_at: startedAt,
        notes: notes.trim() || null,
        assembly_id: assemblyIdToTarget || null,
      });

      if (isCompleted) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#BC5A36', '#3F6C51', '#C97D29', '#E06D44', '#E29840'],
          });
        } catch (_) {}
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement du temps");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-atelier-border mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-atelier-primaryLight text-atelier-primary flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-atelier-text">
                Ajouter un temps manuel
              </h3>
              <p className="text-xs text-atelier-muted line-clamp-1">
                {puzzle.title} • {puzzle.piece_count.toLocaleString('fr-FR')} pièces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-atelier-muted hover:text-atelier-text p-1.5 rounded-lg hover:bg-atelier-subtle"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl dark:bg-red-950/50 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Choix du mode d'ajout */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-2">
              Type d'enregistrement
            </label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              
              {/* Option 1 : Nouvel assemblage terminé */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  targetType === 'new_completed'
                    ? 'border-atelier-primary bg-atelier-primaryLight/15 ring-1 ring-atelier-primary'
                    : 'border-atelier-border bg-atelier-subtle/30 hover:bg-atelier-subtle/70'
                }`}
              >
                <input
                  type="radio"
                  name="targetType"
                  value="new_completed"
                  checked={targetType === 'new_completed'}
                  onChange={() => setTargetType('new_completed')}
                  className="mt-0.5 text-atelier-primary focus:ring-atelier-primary"
                />
                <div>
                  <span className="font-bold text-atelier-text flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-atelier-amber" />
                    <span>Nouvel assemblage terminé (Réalisation #{assemblies.length + 1})</span>
                  </span>
                  <span className="text-atelier-muted text-[11px] block mt-0.5">
                    Enregistre ce temps comme un assemblage terminé, met à jour vos records et statistiques.
                  </span>
                </div>
              </label>

              {/* Option 2 : Ajouter à la réalisation en cours si existante */}
              {activeAssembly && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    targetType === 'active_assembly'
                      ? 'border-atelier-primary bg-atelier-primaryLight/15 ring-1 ring-atelier-primary'
                      : 'border-atelier-border bg-atelier-subtle/30 hover:bg-atelier-subtle/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    value="active_assembly"
                    checked={targetType === 'active_assembly'}
                    onChange={() => setTargetType('active_assembly')}
                    className="mt-0.5 text-atelier-primary focus:ring-atelier-primary"
                  />
                  <div>
                    <span className="font-bold text-atelier-text flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-atelier-primary" />
                      <span>Ajouter à la réalisation en cours (#{activeAssembly.run_number})</span>
                    </span>
                    <span className="text-atelier-muted text-[11px] block mt-0.5">
                      Ajoute ce temps comme session de travail supplémentaire sans clôturer le puzzle.
                    </span>
                  </div>
                </label>
              )}

              {/* Option 3 : Ajouter à une réalisation spécifique existante */}
              {assemblies.length > 0 && !activeAssembly && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    targetType === 'specific_assembly'
                      ? 'border-atelier-primary bg-atelier-primaryLight/15 ring-1 ring-atelier-primary'
                      : 'border-atelier-border bg-atelier-subtle/30 hover:bg-atelier-subtle/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    value="specific_assembly"
                    checked={targetType === 'specific_assembly'}
                    onChange={() => setTargetType('specific_assembly')}
                    className="mt-0.5 text-atelier-primary focus:ring-atelier-primary"
                  />
                  <div className="w-full">
                    <span className="font-bold text-atelier-text block">
                      Ajouter une session à une réalisation existante
                    </span>
                    {targetType === 'specific_assembly' && (
                      <select
                        value={selectedAssemblyId}
                        onChange={e => setSelectedAssemblyId(e.target.value)}
                        className="mt-2 w-full px-2.5 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-xs text-atelier-text focus:outline-none"
                      >
                        {assemblies.map(a => (
                          <option key={a.id} value={a.id}>
                            Réalisation #{a.run_number} ({a.status === 'completed' ? 'Terminé' : 'En cours'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              )}

            </div>
          </div>

          {/* Saisie de la Durée */}
          <div className="p-3.5 rounded-xl bg-atelier-subtle/40 border border-atelier-border space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted">
                Durée du puzzle *
              </label>
              <span className="text-sm font-bold font-mono text-atelier-primary">
                {hours}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[11px] font-semibold text-atelier-muted block mb-1">Heures</span>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={e => setHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full text-center px-2 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-base font-bold font-mono focus:outline-none focus:border-atelier-primary"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-atelier-muted block mb-1">Minutes</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                  className="w-full text-center px-2 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-base font-bold font-mono focus:outline-none focus:border-atelier-primary"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-atelier-muted block mb-1">Secondes</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={e => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                  className="w-full text-center px-2 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-base font-bold font-mono focus:outline-none focus:border-atelier-primary"
                />
              </div>
            </div>

            {/* Boutons d'ajustement rapide */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] text-atelier-muted mr-1">Raccourcis :</span>
              <button
                type="button"
                onClick={() => addQuickTime(15)}
                className="px-2 py-0.5 rounded-md bg-atelier-surface hover:bg-atelier-border border border-atelier-border text-[11px] font-semibold text-atelier-text cursor-pointer"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => addQuickTime(30)}
                className="px-2 py-0.5 rounded-md bg-atelier-surface hover:bg-atelier-border border border-atelier-border text-[11px] font-semibold text-atelier-text cursor-pointer"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => addQuickTime(60)}
                className="px-2 py-0.5 rounded-md bg-atelier-surface hover:bg-atelier-border border border-atelier-border text-[11px] font-semibold text-atelier-text cursor-pointer"
              >
                +1h
              </button>
              <button
                type="button"
                onClick={() => { setHours(0); setMinutes(0); setSeconds(0); }}
                className="px-2 py-0.5 rounded-md text-[11px] text-atelier-muted hover:text-atelier-text cursor-pointer ml-1 underline"
              >
                Vider
              </button>
            </div>
          </div>

          {/* Date de réalisation */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Date de l'assemblage
            </label>
            <input
              type="datetime-local"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm focus:outline-none focus:border-atelier-primary font-mono"
            />
          </div>

          {/* Commentaire facultatif */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Commentaire / Souvenir (facultatif)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ex. Réalisé pendant les vacances, premier essai concluant !"
              className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm focus:outline-none focus:border-atelier-primary"
            />
          </div>

          {/* Boutons d'action adaptés mobile & desktop */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-atelier-border text-atelier-muted hover:text-atelier-text text-sm font-semibold cursor-pointer text-center"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-atelier-primary hover:bg-atelier-primaryHover text-white text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Enregistrement...' : 'Enregistrer ce temps'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
