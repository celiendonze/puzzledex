import React, { useState, useEffect } from 'react';
import { X, Upload, Star } from 'lucide-react';
import { uploadImage } from '../api';

export default function PuzzleModal({ isOpen, onClose, onSave, puzzleToEdit, availableBrands = [] }) {
  const isEditing = Boolean(puzzleToEdit);

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    piece_count: 1000,
    status: 'in_stash',
    dimensions: '',
    difficulty: 3,
    rating: 0,
    missing_pieces: 0,
    notes: '',
    tags: '',
  });

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
        difficulty: puzzleToEdit.difficulty || 3,
        rating: puzzleToEdit.rating || 0,
        missing_pieces: puzzleToEdit.missing_pieces || 0,
        notes: puzzleToEdit.notes || '',
        tags: puzzleToEdit.tags ? puzzleToEdit.tags.map(t => t.name).join(', ') : '',
      });
      setInitialImageFile(null);
      setImagePreview(puzzleToEdit.cover_image_url || null);
    } else {
      setFormData({
        title: '',
        brand: '',
        piece_count: 1000,
        status: 'in_stash',
        dimensions: '',
        difficulty: 3,
        rating: 0,
        missing_pieces: 0,
        notes: '',
        tags: '',
      });
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
        
        {/* En-tête modal */}
        <div className="px-6 py-4 border-b border-atelier-border flex items-center justify-between bg-atelier-subtle/50">
          <h2 className="font-serif text-xl font-bold text-atelier-text">
            {isEditing ? 'Modifier le puzzle' : 'Ajouter un nouveau puzzle'}
          </h2>
          <button
            onClick={onClose}
            className="text-atelier-muted hover:text-atelier-text p-1 rounded-lg hover:bg-atelier-border/50"
          >
            <X className="w-5 h-5" />
          </button>
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

          {/* Statut & Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary"
              >
                <option value="in_stash">Dans la réserve (non commencé)</option>
                <option value="in_progress">En cours d'assemblage</option>
                <option value="completed">Terminé</option>
                <option value="wishlist">Liste d'envies (à acheter)</option>
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
                className="w-full px-3.5 py-2 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary"
              />
            </div>
          </div>

          {/* Évaluations & Pièces manquantes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Difficulté (1 à 5)
              </label>
              <div className="flex gap-1 items-center mt-1">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: val })}
                    className="p-1 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        val <= formData.difficulty
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-atelier-muted/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
                Votre avis (1 à 5)
              </label>
              <div className="flex gap-1 items-center mt-1">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: val === formData.rating ? 0 : val })}
                    className="p-1 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        val <= formData.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-atelier-muted/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
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
                className="w-full px-3 py-1.5 rounded-lg bg-atelier-bg border border-atelier-border text-atelier-text focus:outline-none focus:border-atelier-primary font-mono text-sm"
              />
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

          {/* Étiquettes / Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-atelier-muted mb-1">
              Étiquettes (séparées par des virgules)
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
