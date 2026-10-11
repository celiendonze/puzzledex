import React, { useState, useMemo } from 'react';
import PuzzleCard from '../components/PuzzleCard';
import { Search, Filter, SlidersHorizontal, Plus, Sparkles } from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'in_stash', label: 'Dans la réserve' },
  { id: 'completed', label: 'Terminé' },
  { id: 'wishlist', label: "Liste d'envies" },
  { id: 'archived', label: 'Archivé' },
];

const PIECE_COUNT_RANGES = [
  { id: 'all', label: 'Toutes tailles' },
  { id: '<500', label: '< 500 pcs', min: 0, max: 499 },
  { id: '500-999', label: '500 - 999 pcs', min: 500, max: 999 },
  { id: '1000', label: '1 000 pcs', min: 1000, max: 1000 },
  { id: '1500+', label: '1 500+ pcs', min: 1500, max: 999999 },
];

export default function CatalogPage({
  puzzles = [],
  loading,
  onSelectPuzzle,
  onQuickTimer,
  onOpenCreateModal,
  availableBrands = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRange, setSelectedRange] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtrage et tri côté client
  const filteredPuzzles = useMemo(() => {
    return puzzles
      .filter(p => {
        // Recherche
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(s);
          const matchBrand = (p.brand || '').toLowerCase().includes(s);
          const matchTags = (p.tags || []).some(t => t.name.toLowerCase().includes(s));
          if (!matchTitle && !matchBrand && !matchTags) return false;
        }

        // Statut
        if (selectedStatus !== 'all' && p.status !== selectedStatus) {
          return false;
        }

        // Marque
        if (selectedBrand && p.brand !== selectedBrand) {
          return false;
        }

        // Tranche de pièces
        if (selectedRange !== 'all') {
          const rangeObj = PIECE_COUNT_RANGES.find(r => r.id === selectedRange);
          if (rangeObj) {
            if (p.piece_count < rangeObj.min || p.piece_count > rangeObj.max) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'title') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        valA = valA || 0;
        valB = valB || 0;
        return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [puzzles, searchTerm, selectedStatus, selectedRange, selectedBrand, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      
      {/* Barre d'outils & Filtres */}
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Ligne 1 : Recherche + Tri */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          <div className="relative flex-grow max-w-lg">
            <Search className="w-4 h-4 text-atelier-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, marque ou étiquette..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-atelier-bg border border-atelier-border text-atelier-text text-sm focus:outline-none focus:border-atelier-primary"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label className="text-xs text-atelier-muted whitespace-nowrap font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Trier par :</span>
            </label>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-3 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-xs font-semibold focus:outline-none focus:border-atelier-primary cursor-pointer"
            >
              <option value="updated_at_desc">Dernière activité</option>
              <option value="created_at_desc">Date d'ajout (récent)</option>
              <option value="created_at_asc">Date d'ajout (ancien)</option>
              <option value="piece_count_desc">Pièces (décroissant)</option>
              <option value="piece_count_asc">Pièces (croissant)</option>
              <option value="title_asc">Titre (A-Z)</option>
              <option value="rating_desc">Note (mieux notés)</option>
            </select>
          </div>

        </div>

        {/* Ligne 2 : Filtres de statut */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-atelier-border/50">
          <span className="text-xs font-semibold text-atelier-muted mr-1">Statut :</span>
          {STATUS_FILTERS.map(f => {
            const count = f.id === 'all'
              ? puzzles.length
              : puzzles.filter(p => p.status === f.id).length;

            return (
              <button
                key={f.id}
                onClick={() => setSelectedStatus(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedStatus === f.id
                    ? 'bg-atelier-primary text-white shadow-2xs'
                    : 'bg-atelier-bg text-atelier-muted hover:text-atelier-text border border-atelier-border/80'
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Ligne 3 : Tranches de pièces & Marque */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-atelier-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-atelier-muted mr-1">Taille :</span>
            {PIECE_COUNT_RANGES.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRange(r.id)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedRange === r.id
                    ? 'bg-atelier-subtle font-bold text-atelier-primary border border-atelier-border'
                    : 'text-atelier-muted hover:text-atelier-text'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {availableBrands.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-atelier-muted">Marque :</span>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="px-2 py-1 rounded-md bg-atelier-bg border border-atelier-border text-atelier-text text-xs focus:outline-none"
              >
                <option value="">Toutes les marques</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

      </div>

      {/* Grille des puzzles */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-atelier-surface border border-atelier-border rounded-xl h-72"></div>
          ))}
        </div>
      ) : filteredPuzzles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPuzzles.map(puzzle => (
            <PuzzleCard
              key={puzzle.id}
              puzzle={puzzle}
              onSelect={onSelectPuzzle}
              onQuickTimer={onQuickTimer}
            />
          ))}
        </div>
      ) : (
        /* État vide */
        <div className="text-center py-16 px-4 bg-atelier-surface border border-dashed border-atelier-border rounded-2xl">
          <div className="w-16 h-16 bg-atelier-subtle text-atelier-muted rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🧩
          </div>
          <h3 className="font-serif text-xl font-bold text-atelier-text mb-1">
            Aucun puzzle trouvé
          </h3>
          <p className="text-sm text-atelier-muted max-w-md mx-auto mb-6">
            {searchTerm || selectedStatus !== 'all' || selectedRange !== 'all' || selectedBrand
              ? 'Aucun puzzle ne correspond à vos filtres de recherche.'
              : 'Votre carnet de puzzles est encore vide. Ajoutez votre premier puzzle pour commencer à chronométrer vos réalisations !'}
          </p>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 bg-atelier-primary hover:bg-atelier-primaryHover text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un puzzle</span>
          </button>
        </div>
      )}

    </div>
  );
}
