import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTimer, formatDigitalTime } from '../context/TimerContext';
import { Sun, Moon, Plus, Timer, BookOpen, BarChart3, Database } from 'lucide-react';

export default function Header({ currentView, setCurrentView, onOpenCreateModal, onSelectPuzzle }) {
  const { isDark, toggleTheme } = useTheme();
  const { puzzleId, puzzleTitle, displaySeconds, isRunning } = useTimer();

  return (
    <header className="sticky top-0 z-40 bg-atelier-surface border-b-2 border-atelier-border shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Marque */}
          <button
            onClick={() => setCurrentView('catalog')}
            className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-2xl transform transition-transform group-hover:scale-110">🧩</span>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold text-atelier-primary tracking-tight">
                PuzzleDex
              </span>
            </div>
          </button>

          {/* Navigation Principale */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentView('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'catalog'
                  ? 'bg-atelier-subtle text-atelier-text border border-atelier-border font-semibold shadow-xs'
                  : 'text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Catalogue</span>
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'stats'
                  ? 'bg-atelier-subtle text-atelier-text border border-atelier-border font-semibold shadow-xs'
                  : 'text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Statistiques</span>
            </button>
            <button
              onClick={() => setCurrentView('backup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'backup'
                  ? 'bg-atelier-subtle text-atelier-text border border-atelier-border font-semibold shadow-xs'
                  : 'text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle/50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Sauvegarde</span>
            </button>
          </nav>

          {/* Actions & Chronomètre Actif */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Pilule du Chronomètre Actif (si un puzzle tourne) */}
            {puzzleId && (
              <button
                onClick={() => onSelectPuzzle(puzzleId)}
                title={`Chronomètre actif sur "${puzzleTitle}". Cliquer pour ouvrir la fiche.`}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  isRunning
                    ? 'bg-atelier-saugeLight text-atelier-sauge border-atelier-sauge animate-pulse shadow-sm'
                    : 'bg-atelier-amberLight text-atelier-amber border-atelier-amber'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span className="font-mono tracking-wider">{formatDigitalTime(displaySeconds)}</span>
                <span className="hidden md:inline max-w-[120px] truncate text-atelier-text/80 text-xs font-normal">
                  • {puzzleTitle}
                </span>
              </button>
            )}

            {/* Bascule Thème Jour / Soir */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-atelier-border text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle text-xs sm:text-sm font-medium transition-colors"
              title={isDark ? "Passer en mode Jour" : "Passer en mode Soir"}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Jour</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-atelier-muted" />
                  <span className="hidden md:inline">Soir</span>
                </>
              )}
            </button>

            {/* Bouton Nouveau Puzzle */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 bg-atelier-primary hover:bg-atelier-primaryHover text-white px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau puzzle</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
