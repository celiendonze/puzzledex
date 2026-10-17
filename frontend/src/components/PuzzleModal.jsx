import React, { useState, useEffect } from 'react';
import { X, Upload, Star, Puzzle as PuzzleIcon } from 'lucide-react';
import { uploadImage } from '../api';

export default function PuzzleModal({ isOpen, onClose, onSave, puzzleToEdit, availableBrands = [] }) {
  const isEditing = Boolean(puzzleToEdit);

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    piece_count: 1000,
    status: 'in_stash',
    dimensions: '',
    difficulty: null,
    rating: null,
    missing_pieces: 0,
    notes: '',
    tags: '',
  });

  const [initialHours, setInitialHours] = useState('');
  const [initialMinutes, setInitialMinutes] = useState('');
  const [initialImageFile, setInitialImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (puzzleToEdit) {
      setFormData({
        title: puzzleToEdit.title || '',
        brand: puzzleToEdit.brand || '',
        piece_count: puzzleToEdit.piece_count || 1000,
        status: puzzleToEdit.status || 'in_stash',
        dimensions: puzzleToEdit.dimensions || '',
        difficulty: puzzleToEdit.difficulty ?? null,
        rating: puzzleToEdit.rating ?? null,
        missing_pieces: puzzleToEdit.missing_pieces || 0,
        notes: puzzleToEdit.notes || '',
        tags: puzzleToEdit.tags ? puzzleToEdit.tags.map(t => t.name).join(', ') : '',
      });
      setInitialHours('');
      setInitialMinutes('');
      setInitialImageFile(null);
      setImagePreview(puzzleToEdit.cover_image_url || null);
    } else {
      setFormData({
        title: '',
        brand: '',
        piece_count: 1000,
        status: 'in_stash',
        dimensions: '',
        difficulty: null,
        rating: null,
        missing_pieces: 0,
        notes: '',
        tags: '',
      });
      setInitialHours('');
      setInitialMinutes('');
      setInitialImageFile(null);
      setImagePreview(null);
    }
    setError('');
  }, [puzzleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInitialImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Le titre du puzzle est obligatoire.');
      return;
    }
    if (!formData.piece_count || formData.piece_count <= 0) {
      setError('Le nombre de pièces doit être supérieur à zéro.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const h = parseInt(initialHours, 10) || 0;
      const m = parseInt(initialMinutes, 10) || 0;
      const initialSec = (h * 3600) + (m * 60);

      const payload = {
        title: formData.title.trim(),
        brand: formData.brand.trim() || null,
        piece_count: parseInt(formData.piece_count, 10),
        status: formData.status,
        dimensions: formData.dimensions.trim() || null,
        difficulty: formData.difficulty || null,
        rating: formData.rating || null,
        missing_pieces: parseInt(formData.missing_pieces, 10) || 0,
        notes: formData.notes.trim() || null,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        initial_duration_seconds: !isEditing && (formData.status === 'completed' || formData.status === 'in_progress') && initialSec > 0 ? initialSec : undefined,
      };

      const savedPuzzle = await onSave(payload, puzzleToEdit ? puzzleToEdit.id : null);

      // Si création avec une image sélectionnée
      if (!puzzleToEdit && initialImageFile && savedPuzzle && savedPuzzle.id) {
        try {
          await uploadImage(savedPuzzle.id, initialImageFile, true);
        } catch (_) {}
      }

      onClose();
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl my-8 overflow-hidden">
        
        {/* En-tête modal avec bouton Créer / Enregistrer directement accessible en haut */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-atelier-border flex items-center justify-between bg-atelier-subtle/50 gap-3">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-atelier-text truncate">
            {isEditing ? 'Modifier le puzzle' : 'Nouveau puzzle'}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-atelier-primary hover:bg-atelier-primaryHover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-atelier-muted hover:text-atelier-text p-1.5 rounded-lg hover:bg-atelier-border/50"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps formulaire */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg dark:bg-red-950/50 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Titre & Marque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Titre du puzzle *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex. La Nuit Étoilée"
                className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Marque / Éditeur
              </label>
              <input
                type="text"
                list="brands-list"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="ex. Ravensburger"
                className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary"
              />
              <datalist id="brands-list">
                {availableBrands.map(b => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Nombre de pièces *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.piece_count}
                onChange={e => setFormData({ ...formData, piece_count: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary font-mono"
              />
            </div>
          </div>

          {/* Statut, Dimensions & Pièces manquantes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary text-sm"
              >
                <option value="in_stash">Dans la réserve</option>
                <option value="in_progress">En cours d'assemblage</option>
                <option value="completed">Terminé</option>
                <option value="borrowed">Emprunté</option>
                <option value="wishlist">Liste d'envies</option>
                <option value="archived">Archivé / Donné</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Dimensions
              </label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={e => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="ex. 70 x 50 cm"
                className="w-full px-3 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Pièces manquantes
              </label>
              <input
                type="number"
                min="0"
                value={formData.missing_pieces}
                onChange={e => setFormData({ ...formData, missing_pieces: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary font-mono text-sm"
              />
            </div>
          </div>

          {/* Saisie de temps optionnel lors de la création d'un puzzle déjà commencé ou terminé */}
          {!isEditing && (formData.status === 'completed' || formData.status === 'in_progress') && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1.5">
                {formData.status === 'completed' ? "Temps d'assemblage (optionnel)" : "Temps déjà passé (optionnel)"}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={initialHours}
                    onChange={e => setInitialHours(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm font-mono text-center focus:outline-none focus:border-atelier-primary"
                  />
                  <span className="text-xs text-atelier-muted font-medium">h</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={initialMinutes}
                    onChange={e => setInitialMinutes(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text text-sm font-mono text-center focus:outline-none focus:border-atelier-primary"
                  />
                  <span className="text-xs text-atelier-muted font-medium">min</span>
                </div>
              </div>
              <p className="text-[11px] text-atelier-muted mt-1.5">
                {formData.status === 'completed'
                  ? 'Permet de comptabiliser directement ce temps dans vos statistiques.'
                  : 'Ce temps sera ajouté comme première session de ce puzzle.'}
              </p>
            </div>
          )}

          {/* Évaluations : Difficulté & Avis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-atelier-subtle/50 border border-atelier-border">
            {/* Difficulté */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted">
                  Difficulté (1 à 5)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-atelier-text">
                    {formData.difficulty ? `${formData.difficulty}/5` : <span className="text-atelier-muted font-normal text-[11px]">Non renseignée</span>}
                  </span>
                  {formData.difficulty && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: null })}
                      className="text-[11px] text-atelier-muted hover:text-atelier-text underline cursor-pointer"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: val === formData.difficulty ? null : val })}
                    className="p-1.5 focus:outline-none cursor-pointer rounded-lg hover:bg-atelier-border/50 transition-colors"
                    title={`Difficulté ${val}/5`}
                  >
                    <PuzzleIcon
                      className={`w-5 h-5 transition-transform active:scale-110 ${
                        formData.difficulty && val <= formData.difficulty
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-atelier-muted/30 hover:text-atelier-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Avis */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted">
                  Avis (1 à 5)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-atelier-text">
                    {formData.rating && formData.rating > 0 ? `${formData.rating}/5` : <span className="text-atelier-muted font-normal text-[11px]">Sans avis</span>}
                  </span>
                  {formData.rating && formData.rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: null })}
                      className="text-[11px] text-atelier-muted hover:text-atelier-text underline cursor-pointer"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: val === formData.rating ? null : val })}
                    className="p-1.5 focus:outline-none cursor-pointer rounded-lg hover:bg-atelier-border/50 transition-colors"
                    title={`Avis ${val}/5`}
                  >
                    <Star
                      className={`w-5 h-5 transition-transform active:scale-110 ${
                        formData.rating && val <= formData.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-atelier-muted/30 hover:text-atelier-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo de couverture initiale (si création) */}
          {!isEditing && (
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Photo de la boîte ou du puzzle (facultatif)
              </label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-atelier-border shrink-0">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setInitialImageFile(null); setImagePreview(null); }}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-atelier-border rounded-xl cursor-pointer hover:border-atelier-primary/60 bg-atelier-bg/50 hover:bg-atelier-subtle/50 transition-colors">
                    <Upload className="w-6 h-6 text-atelier-muted mb-1" />
                    <span className="text-xs text-atelier-muted">Glisser une photo ou cliquer pour choisir</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder="ex. Art, Van Gogh, Paysage, Couleurs vives"
              className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Remarques & avis personnel
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Sensations lors de l'assemblage, qualité des pièces, etc."
              className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary text-sm resize-none"
            />
          </div>
        </form>

        {/* Pied de modal */}
        <div className="px-6 py-4 border-t border-atelier-border bg-atelier-subtle/40 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg border border-atelier-border text-atelier-muted hover:text-atelier-text hover:bg-atelier-border/50 text-sm font-medium transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-atelier-primary hover:bg-atelier-primaryHover text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le puzzle'}
          </button>
        </div>

      </div>
    </div>
  );
}
