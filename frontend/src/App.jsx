import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider, useTimer } from './context/TimerContext';
import Header from './components/Header';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import CatalogPage from './pages/CatalogPage';
import PuzzleDetailPage from './pages/PuzzleDetailPage';
import StatsPage from './pages/StatsPage';
import BackupPage from './pages/BackupPage';
import PuzzleModal from './components/PuzzleModal';
import { getPuzzles, getPuzzle, createPuzzle, updatePuzzle, getBrands } from './api';

function AppContent() {
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog' | 'detail' | 'stats' | 'backup'
  const [puzzles, setPuzzles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vue détail d'un puzzle
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(null);
  const [selectedPuzzleDetail, setSelectedPuzzleDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modale d'ajout / édition de puzzle
  const [modalOpen, setModalOpen] = useState(false);
  const [puzzleToEdit, setPuzzleToEdit] = useState(null);

  const { startPuzzleTimer } = useTimer();

  // Chargement des puzzles
  const fetchPuzzles = async () => {
    try {
      setLoading(true);
      const data = await getPuzzles();
      setPuzzles(data);
      const b = await getBrands();
      setBrands(b);
    } catch (err) {
      console.error("Erreur lors du chargement des puzzles :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuzzles();
  }, []);

  // Chargement du détail lorsqu'un puzzle est sélectionné
  const fetchPuzzleDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const detail = await getPuzzle(id);
      setSelectedPuzzleDetail(detail);
    } catch (err) {
      console.error("Erreur détail puzzle :", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectPuzzle = (id) => {
    setSelectedPuzzleId(id);
    fetchPuzzleDetail(id);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Action rapide depuis la carte : démarrer / reprendre le timer et aller sur la fiche
  const handleQuickTimer = (puzzle) => {
    if (puzzle.active_assembly_id) {
      startPuzzleTimer(puzzle.id, puzzle.active_assembly_id);
    }
    handleSelectPuzzle(puzzle.id);
  };

  // Enregistrement puzzle (création ou mise à jour)
  const handleSavePuzzle = async (payload, idToUpdate = null) => {
    let result;
    if (idToUpdate) {
      result = await updatePuzzle(idToUpdate, payload);
      if (selectedPuzzleId === idToUpdate) {
        fetchPuzzleDetail(idToUpdate);
      }
    } else {
      result = await createPuzzle(payload);
    }
    fetchPuzzles();
    return result;
  };

  return (
    <div className="min-h-screen bg-atelier-bg text-atelier-text flex flex-col font-sans transition-colors duration-200">
      
      {/* Bannière d'installation PWA mobile */}
      <PwaInstallPrompt />

      {/* Barre supérieure */}
      <Header
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view !== 'detail') setSelectedPuzzleId(null);
        }}
        onOpenCreateModal={() => {
          setPuzzleToEdit(null);
          setModalOpen(true);
        }}
        onSelectPuzzle={handleSelectPuzzle}
      />

      {/* Contenu principal */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'catalog' && (
          <CatalogPage
            puzzles={puzzles}
            loading={loading}
            onSelectPuzzle={handleSelectPuzzle}
            onQuickTimer={handleQuickTimer}
            onOpenCreateModal={() => {
              setPuzzleToEdit(null);
              setModalOpen(true);
            }}
            availableBrands={brands}
          />
        )}

        {currentView === 'detail' && (
          loadingDetail ? (
            <div className="py-20 text-center text-atelier-muted">
              Chargement de la fiche puzzle...
            </div>
          ) : selectedPuzzleDetail ? (
            <PuzzleDetailPage
              puzzle={selectedPuzzleDetail}
              onBack={() => {
                setCurrentView('catalog');
                fetchPuzzles();
              }}
              onRefresh={() => {
                fetchPuzzleDetail(selectedPuzzleId);
                fetchPuzzles();
              }}
              onEditPuzzle={(p) => {
                setPuzzleToEdit(p);
                setModalOpen(true);
              }}
              onPuzzleDeleted={() => {
                setCurrentView('catalog');
                fetchPuzzles();
              }}
            />
          ) : (
            <div className="py-20 text-center text-atelier-muted">
              Puzzle non trouvé.
            </div>
          )
        )}

        {currentView === 'stats' && (
          <StatsPage />
        )}

        {currentView === 'backup' && (
          <BackupPage
            onDataRestored={() => {
              fetchPuzzles();
            }}
          />
        )}
      </main>

      {/* Pied de page simple et discret */}
      <footer className="border-t border-atelier-border/60 py-6 text-center text-xs text-atelier-muted bg-atelier-surface/40">
        <p className="font-serif">
          🧩 PuzzleDex • Carnet & Chronomètre de Puzzles en réseau local
        </p>
      </footer>

      {/* Modale Création / Modification Puzzle */}
      <PuzzleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        puzzleToEdit={puzzleToEdit}
        availableBrands={brands}
        onSave={handleSavePuzzle}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TimerProvider>
        <AppContent />
      </TimerProvider>
    </ThemeProvider>
  );
}
