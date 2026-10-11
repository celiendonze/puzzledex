import React from 'react';
import { useTimer, formatDigitalTime, formatFriendlyDuration } from '../context/TimerContext';
import { Trophy, Timer, Repeat, Play, Pause } from 'lucide-react';

export const STATUS_LABELS = {
  in_progress: { label: 'En cours', bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  completed: { label: 'Terminé', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  in_stash: { label: 'Dans la réserve', bg: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700' },
  wishlist: { label: "Liste d'envies", bg: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  archived: { label: 'Archivé / Donné', bg: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
};

export default function PuzzleCard({ puzzle, onSelect, onQuickTimer }) {
  const { puzzleId, isRunning, displaySeconds } = useTimer();
  const isThisPuzzleActive = puzzleId === puzzle.id;
  const statusInfo = STATUS_LABELS[puzzle.status] || STATUS_LABELS.in_stash;

  return (
    <div
      onClick={() => onSelect(puzzle.id)}
      className="group bg-atelier-surface border border-atelier-border hover:border-atelier-primary/60 rounded-xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Zone Image */}
      <div className="relative h-48 bg-atelier-subtle overflow-hidden flex items-center justify-center">
        {puzzle.thumbnail_url ? (
          <img
            src={puzzle.thumbnail_url}
            alt={puzzle.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-atelier-subtle to-atelier-border/50 text-atelier-muted select-none">
            <span className="text-4xl mb-1 opacity-70">🧩</span>
            <span className="text-xs font-serif italic text-atelier-muted/80">PuzzleDex</span>
          </div>
        )}

        {/* Badge Nombre de pièces */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-xs">
          {puzzle.piece_count.toLocaleString('fr-FR')} pièces
        </div>

        {/* Badge Statut */}
        <div className={`absolute top-2.5 right-2.5 text-xs font-semibold px-2.5 py-0.5 rounded-md border shadow-2xs ${statusInfo.bg}`}>
          {puzzle.times_completed > 1 && puzzle.status === 'in_progress'
            ? `En cours (Run #${puzzle.times_completed + 1})`
            : statusInfo.label}
        </div>
      </div>

      {/* Contenu Carte */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-atelier-text line-clamp-1 group-hover:text-atelier-primary transition-colors">
            {puzzle.title}
          </h3>
          <div className="text-xs text-atelier-muted mt-0.5 line-clamp-1">
            {puzzle.brand || 'Marque inconnue'} {puzzle.dimensions ? `• ${puzzle.dimensions}` : ''}
          </div>

          {/* Tags */}
          {puzzle.tags && puzzle.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {puzzle.tags.slice(0, 3).map(tag => (
                <span
                  key={tag.id}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-atelier-subtle text-atelier-muted border border-atelier-border/50"
                >
                  {tag.name}
                </span>
              ))}
              {puzzle.tags.length > 3 && (
                <span className="text-[11px] px-1.5 py-0.5 text-atelier-muted">
                  +{puzzle.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Ligne Statistiques & Action Rapide */}
        <div className="pt-3 border-t border-atelier-border/60 flex items-center justify-between text-xs">
          {/* Meilleur temps ou état */}
          <div className="flex items-center gap-1.5 font-medium">
            {puzzle.best_time_seconds ? (
              <span className="text-atelier-primary flex items-center gap-1 font-semibold" title={`Record personnel sur ce puzzle`}>
                <Trophy className="w-3.5 h-3.5" />
                {formatFriendlyDuration(puzzle.best_time_seconds)}
                {puzzle.times_completed > 1 && (
                  <span className="text-[11px] text-atelier-muted font-normal ml-0.5">
                    ({puzzle.times_completed}x)
                  </span>
                )}
              </span>
            ) : puzzle.status === 'in_progress' ? (
              <span className="text-atelier-amber flex items-center gap-1 font-semibold">
                <Timer className="w-3.5 h-3.5" />
                {puzzle.active_assembly_duration_seconds > 0
                  ? formatFriendlyDuration(puzzle.active_assembly_duration_seconds)
                  : 'En cours'}
              </span>
            ) : (
              <span className="text-atelier-muted">
                {puzzle.status === 'wishlist' ? "À acquérir" : "Non commencé"}
              </span>
            )}
          </div>

          {/* Bouton Chrono Direct */}
          {puzzle.status === 'in_progress' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickTimer(puzzle);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                isThisPuzzleActive
                  ? isRunning
                    ? 'bg-atelier-saugeLight text-atelier-sauge border-atelier-sauge animate-pulse'
                    : 'bg-atelier-amberLight text-atelier-amber border-atelier-amber'
                  : 'bg-atelier-subtle text-atelier-text hover:bg-atelier-border border-atelier-border'
              }`}
              title={isThisPuzzleActive ? (isRunning ? 'Mettre en pause' : 'Reprendre') : 'Lancer le chronomètre'}
            >
              {isThisPuzzleActive ? (
                <>
                  {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span className="font-mono">{formatDigitalTime(displaySeconds)}</span>
                </>
              ) : (
                <>
                  <Timer className="w-3 h-3" />
                  <span>Chrono</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
