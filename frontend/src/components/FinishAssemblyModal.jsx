import React, { useState } from 'react';
import { X, Trophy, CheckCircle2 } from 'lucide-react';
import { updateAssembly } from '../api';
import { formatFriendlyDuration } from '../context/TimerContext';
import confetti from 'canvas-confetti';

export default function FinishAssemblyModal({ isOpen, onClose, assembly, puzzle, onFinished }) {
  if (!isOpen || !assembly) return null;

  const [notes, setNotes] = useState(assembly.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSeconds = assembly.total_duration_seconds || 0;

  const handleFinish = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await updateAssembly(assembly.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes.trim() || null,
      });

      // Lancement des confettis de célébration
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#BC5A36', '#3F6C51', '#C97D29', '#E06D44', '#E29840'],
        });
      } catch (_) {}

      if (onFinished) onFinished();
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de la validation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-atelier-muted hover:text-atelier-text p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-atelier-saugeLight text-atelier-sauge rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-atelier-text">
            Félicitations !
          </h2>
          <p className="text-sm text-atelier-muted mt-1">
            Vous avez terminé la Réalisation #{assembly.run_number} de <strong>{puzzle.title}</strong>
          </p>
        </div>

        {/* Bilan du Run */}
        <div className="bg-atelier-subtle border border-atelier-border rounded-xl p-4 mb-5 text-center grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-atelier-muted font-semibold">
              Temps total
            </div>
            <div className="text-2xl font-bold font-mono text-atelier-primary mt-1">
              {formatFriendlyDuration(totalSeconds)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-atelier-muted font-semibold">
              Nombre de sessions
            </div>
            <div className="text-2xl font-bold text-atelier-text mt-1">
              {assembly.sessions_count || 0}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleFinish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Commentaire ou souvenir sur cet assemblage (facultatif)
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ex. Fait en famille pendant les vacances, superbe rendu final !"
              className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm focus:outline-none focus:border-atelier-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-atelier-border text-atelier-muted hover:text-atelier-text text-sm cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-atelier-sauge hover:bg-emerald-700 text-white text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Validation...' : 'Valider comme terminé'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
