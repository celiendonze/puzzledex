import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Plus, BookOpen, BarChart3, Database } from 'lucide-react';

export default function Header({ currentView, setCurrentView, onOpenCreateModal }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-atelier-surface border-b-2 border-atelier-border shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo */}
          <button
            onClick={() => setCurrentView('catalog')}
            className="flex items-center gap-1.5 sm:gap-2 text-left group cursor-pointer focus:outline-none shrink-0"
          >
            <span className="text-xl sm:text-2xl transform transition-transform group-hover:scale-110">🧩</span>
            <span className="font-serif text-lg sm:text-2xl font-bold text-atelier-primary tracking-tight">
              PuzzleDex
            </span>
          </button>

          {/* Navigation Principale */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentView('catalog')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === 'catalog'
                  ? 'bg-atelier-subtle text-atelier-text border border-atelier-border font-semibold shadow-2xs'
                  : 'text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle/50'
              }`}
              title="Catalogue"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Catalogue</span>
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === 'stats'
                  ? 'bg-atelier-subtle text-atelier-text border border-atelier-border font-semibold shadow-2xs'
                  : 'text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle/50'
              }`}
              title="Statistiques"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Statistiques</span>
            </button>
            <button
              onClick={() => setCurrentView('backup')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentView === 'backup'
                  ? 'bg-atelier-subtle text-atelier-text border border-atelier-border font-semibold shadow-2xs'
                  : 'text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle/50'
              }`}
              title="Sauvegarde"
            >
              <Database className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sauvegarde</span>
            </button>
          </nav>

          {/* Actions : Thème + Nouveau */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Bascule Thème Jour / Soir */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg border border-atelier-border text-atelier-muted hover:text-atelier-text hover:bg-atelier-subtle text-xs sm:text-sm font-medium transition-colors"
              title={isDark ? "Passer en mode Jour" : "Passer en mode Soir"}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden md:inline ml-1.5">Jour</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-atelier-muted shrink-0" />
                  <span className="hidden md:inline ml-1.5">Soir</span>
                </>
              )}
            </button>

            {/* Bouton Nouveau Puzzle */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1 bg-atelier-primary hover:bg-atelier-primaryHover text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Nouveau puzzle</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
