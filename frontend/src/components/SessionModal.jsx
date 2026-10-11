import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { createSession, updateSession } from '../api';

export default function SessionModal({ isOpen, onClose, assemblyId, sessionToEdit, onSaved }) {
  if (!isOpen) return null;

  const isEditing = Boolean(sessionToEdit);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [seconds, setSeconds] = useState(0);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionToEdit) {
      const dur = sessionToEdit.duration_seconds || 0;
      setHours(Math.floor(dur / 3600));
      setMinutes(Math.floor((dur % 3600) / 60));
      setSeconds(dur % 60);
      setSessionDate(
        sessionToEdit.started_at
          ? new Date(sessionToEdit.started_at).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)
      );
      setNotes(sessionToEdit.notes || '');
    } else {
      setHours(0);
      setMinutes(30);
      setSeconds(0);
      setSessionDate(new Date().toISOString().slice(0, 16));
      setNotes('');
    }
    setError('');
  }, [sessionToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalSeconds = (parseInt(hours, 10) || 0) * 3600 + (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);

    if (totalSeconds <= 0) {
      setError('La durée doit être supérieure à zéro.');
      return;
    }

    setSubmitting(true);
    setError('');

    const startedAt = new Date(sessionDate).toISOString();
    const endedAt = new Date(new Date(sessionDate).getTime() + totalSeconds * 1000).toISOString();

    try {
      if (isEditing) {
        await updateSession(sessionToEdit.id, {
          duration_seconds: totalSeconds,
          started_at: startedAt,
          ended_at: endedAt,
          notes: notes.trim() || null,
        });
      } else {
        await createSession(assemblyId, {
          duration_seconds: totalSeconds,
          started_at: startedAt,
          ended_at: endedAt,
          notes: notes.trim() || null,
        });
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement de la session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-atelier-border mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-atelier-primary" />
            <h3 className="font-serif text-lg font-bold text-atelier-text">
              {isEditing ? 'Modifier la session' : 'Ajouter une session manuelle'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-atelier-muted hover:text-atelier-text p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Durée : Heures, Minutes, Secondes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Durée de travail *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-atelier-muted">Heures</span>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm font-mono"
                />
              </div>
              <div>
                <span className="text-[11px] text-atelier-muted">Minutes</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm font-mono"
                />
              </div>
              <div>
                <span className="text-[11px] text-atelier-muted">Secondes</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={e => setSeconds(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Date de la session */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Date & Heure de la session
            </label>
            <input
              type="datetime-local"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm focus:outline-none focus:border-atelier-primary font-mono"
            />
          </div>

          {/* Commentaire de la session */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Note pour cette session
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ex. Tri des pièces ou assemblage des bords"
              className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm focus:outline-none focus:border-atelier-primary"
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
              className="px-5 py-2 rounded-lg bg-atelier-primary hover:bg-atelier-primaryHover text-white text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Ajouter la session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
