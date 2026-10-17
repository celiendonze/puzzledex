import React, { useState } from 'react';
import TimerWidget from '../components/TimerWidget';
import SessionModal from '../components/SessionModal';
import FinishAssemblyModal from '../components/FinishAssemblyModal';
import ManualTimeModal from '../components/ManualTimeModal';
import { useTimer, formatFriendlyDuration } from '../context/TimerContext';
import { STATUS_LABELS } from '../components/PuzzleCard';
import {
  ArrowLeft,
  Trophy,
  Repeat,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Star,
  Puzzle as PuzzleIcon,
  CheckCircle2,
  Calendar,
  Clock,
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  startNewAssembly,
  deleteAssembly,
  deleteSession,
  uploadImage,
  setCoverImage,
  deleteImage,
  deletePuzzle
} from '../api';

export default function PuzzleDetailPage({
  puzzle,
  onBack,
  onRefresh,
  onEditPuzzle,
  onPuzzleDeleted
}) {
  const [activeTabAssemblyId, setActiveTabAssemblyId] = useState(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [targetAssemblyIdForSession, setTargetAssemblyIdForSession] = useState(null);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [manualTimeModalOpen, setManualTimeModalOpen] = useState(false);
  const [manualTimeTargetAssemblyId, setManualTimeTargetAssemblyId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { startPuzzleTimer } = useTimer();

  if (!puzzle) return null;

  const assemblies = puzzle.assemblies || [];
  const activeAssembly = assemblies.find(a => a.status === 'in_progress');
  const completedAssemblies = assemblies.filter(a => a.status === 'completed');

  // Meilleur temps parmi les runs terminés
  let bestRun = null;
  for (const run of completedAssemblies) {
    if (!bestRun || run.total_duration_seconds < bestRun.total_duration_seconds) {
      bestRun = run;
    }
  }

  // Temps total cumulé sur tous les runs
  const grandTotalSeconds = assemblies.reduce((acc, a) => acc + (a.total_duration_seconds || 0), 0);

  const statusInfo = STATUS_LABELS[puzzle.status] || STATUS_LABELS.in_stash;

  // Lancer un nouvel assemblage directement sans popup de confirmation
  const handleStartNewRun = async () => {
    try {
      const newRun = await startNewAssembly(puzzle.id);
      if (newRun && newRun.id) {
        startPuzzleTimer(puzzle.id, newRun.id, 0);
      }
      onRefresh();
    } catch (err) {
      alert(err.message || "Erreur lors du démarrage d'une nouvelle réalisation");
    }
  };

  // Supprimer le puzzle
  const handleDeletePuzzle = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le puzzle "${puzzle.title}" et tout son historique ? Cette action est irréversible.`)) {
      try {
        await deletePuzzle(puzzle.id);
        if (onPuzzleDeleted) onPuzzleDeleted();
      } catch (err) {
        alert(err.message || "Erreur lors de la suppression");
      }
    }
  };

  // Téléversement d'image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      await uploadImage(puzzle.id, file, false);
      onRefresh();
    } catch (err) {
      alert(err.message || "Erreur lors du téléversement de l'image");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSetCover = async (imageId) => {
    try {
      await setCoverImage(puzzle.id, imageId);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm("Supprimer cette photo ?")) {
      try {
        await deleteImage(imageId);
        onRefresh();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm("Supprimer cette session d'assemblage ?")) {
      try {
        await deleteSession(sessionId);
        onRefresh();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDeleteAssembly = async (assemblyId, runNumber) => {
    if (window.confirm(`Supprimer l'historique complet de la Réalisation #${runNumber} ?`)) {
      try {
        await deleteAssembly(assemblyId);
        onRefresh();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Bouton retour & Actions en-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-atelier-muted hover:text-atelier-text px-3 py-1.5 rounded-lg hover:bg-atelier-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditPuzzle(puzzle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-atelier-border text-xs font-semibold text-atelier-text hover:bg-atelier-subtle transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-atelier-muted" />
            <span>Modifier</span>
          </button>
          <button
            onClick={handleDeletePuzzle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      {/* Titre & Badges Principaux */}
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${statusInfo.bg}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-black/75 text-white">
                {puzzle.piece_count.toLocaleString('fr-FR')} pièces
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-atelier-text tracking-tight">
              {puzzle.title}
            </h1>
            <p className="text-sm text-atelier-muted mt-1">
              {puzzle.brand || 'Marque non spécifiée'} {puzzle.dimensions ? `• Format ${puzzle.dimensions}` : ''}
            </p>
          </div>

          {/* Synthèse des records & Bouton Recommencer */}
          <div className="flex flex-wrap items-center gap-3">
            {bestRun && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-atelier-primaryLight border border-atelier-primary/30 text-atelier-primary text-xs font-semibold">
                <Trophy className="w-4 h-4" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Meilleur temps</div>
                  <div className="text-sm font-bold font-mono">{formatFriendlyDuration(bestRun.total_duration_seconds)}</div>
                </div>
              </div>
            )}

            {completedAssemblies.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-atelier-subtle border border-atelier-border text-atelier-text text-xs font-semibold">
                <Repeat className="w-4 h-4 text-atelier-muted" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-atelier-muted">Assemblages</div>
                  <div className="text-sm font-bold">{completedAssemblies.length} terminé{completedAssemblies.length > 1 ? 's' : ''}</div>
                </div>
              </div>
            )}

            {/* Bouton pour lancer un nouvel assemblage */}
            <button
              onClick={handleStartNewRun}
              className="flex items-center gap-1.5 bg-atelier-primary hover:bg-atelier-primaryHover text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{assemblies.length === 0 ? 'Commencer ce puzzle' : 'Recommencer ce puzzle'}</span>
            </button>

            {/* Bouton pour ajouter un temps manuel */}
            <button
              onClick={() => {
                setManualTimeTargetAssemblyId(null);
                setManualTimeModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-atelier-surface hover:bg-atelier-subtle text-atelier-text border border-atelier-border px-3.5 py-2.5 rounded-xl text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Ajouter un temps manuellement sans passer par le chronomètre"
            >
              <Clock className="w-4 h-4 text-atelier-primary" />
              <span>+ Ajouter un temps</span>
            </button>
          </div>
        </div>
      </div>

      {/* Disposition Principale (Chronomètre & Historique + Volet latéral) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Gauche / Principale (2 colonnes) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section Chronomètre Actif */}
          {activeAssembly ? (
            <TimerWidget
              puzzle={puzzle}
              activeAssembly={activeAssembly}
              onSessionSaved={onRefresh}
              onFinishAssemblyClick={() => setFinishModalOpen(true)}
            />
          ) : (
            <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-atelier-saugeLight text-atelier-sauge rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-atelier-text">
                Aucun chronométrage en cours sur ce puzzle
              </h3>
              <p className="text-sm text-atelier-muted max-w-md mx-auto">
                {assemblies.length > 0
                  ? "Toutes les réalisations précédentes sont terminées. Vous pouvez en démarrer une nouvelle pour battre votre record !"
                  : "Vous n'avez pas encore démarré l'assemblage de ce puzzle."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  onClick={handleStartNewRun}
                  className="inline-flex items-center gap-2 bg-atelier-primary hover:bg-atelier-primaryHover text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Démarrer le chronomètre</span>
                </button>
                <button
                  onClick={() => {
                    setManualTimeTargetAssemblyId(null);
                    setManualTimeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-atelier-subtle hover:bg-atelier-border text-atelier-text border border-atelier-border px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xs cursor-pointer transition-colors"
                >
                  <Clock className="w-4 h-4 text-atelier-primary" />
                  <span>Ajouter un temps manuel</span>
                </button>
              </div>
            </div>
          )}

          {/* Section Historique des Réalisations */}
          <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-atelier-text flex items-center gap-2">
                <span>Historique des réalisations</span>
                <span className="text-xs font-normal text-atelier-muted">({assemblies.length})</span>
              </h2>

              <span className="text-xs text-atelier-muted">
                Temps total cumulé : <strong className="text-atelier-text font-mono">{formatFriendlyDuration(grandTotalSeconds)}</strong>
              </span>
            </div>

            {assemblies.length === 0 ? (
              <p className="text-sm text-atelier-muted italic text-center py-6">
                Aucun historique d'assemblage enregistré pour ce puzzle.
              </p>
            ) : (
              <div className="space-y-4">
                {assemblies.map(run => {
                  const isRunActive = run.status === 'in_progress';
                  const isRunBest = bestRun && bestRun.id === run.id;

                  return (
                    <div
                      key={run.id}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isRunActive
                          ? 'border-atelier-amber bg-atelier-amberLight/10'
                          : isRunBest
                          ? 'border-atelier-primary/60 bg-atelier-primaryLight/5'
                          : 'border-atelier-border bg-atelier-surface'
                      }`}
                    >
                      {/* En-tête du Run */}
                      <div className="p-4 bg-atelier-subtle/40 border-b border-atelier-border flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-serif font-bold text-base text-atelier-text">
                            Réalisation #{run.run_number}
                          </span>
                          {isRunActive && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                              En cours
                            </span>
                          )}
                          {isRunBest && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-atelier-primaryLight text-atelier-primary border border-atelier-primary/40 flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> Record
                            </span>
                          )}
                          {run.status === 'completed' && !isRunBest && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Terminé
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold font-mono text-atelier-primary">
                            ⏱️ {formatFriendlyDuration(run.total_duration_seconds)}
                          </span>
                          <span className="text-xs text-atelier-muted">
                            ({run.sessions_count || 0} session{(run.sessions_count || 0) > 1 ? 's' : ''})
                          </span>

                          <button
                            onClick={() => {
                              setTargetAssemblyIdForSession(run.id);
                              setSessionToEdit(null);
                              setSessionModalOpen(true);
                            }}
                            className="text-xs text-atelier-primary hover:underline font-semibold ml-2"
                            title="Ajouter manuellement une session de travail sur cette réalisation"
                          >
                            + Ajouter session
                          </button>

                          <button
                            onClick={() => handleDeleteAssembly(run.id, run.run_number)}
                            className="text-atelier-muted hover:text-red-600 p-1"
                            title="Supprimer cette réalisation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Corps du Run : Notes & Sessions */}
                      <div className="p-4 space-y-3">
                        {run.notes && (
                          <p className="text-xs text-atelier-muted italic bg-atelier-subtle/60 p-2.5 rounded-lg border border-atelier-border/50">
                            "{run.notes}"
                          </p>
                        )}

                        {run.sessions && run.sessions.length > 0 ? (
                          <div className="divide-y divide-atelier-border/50">
                            {run.sessions.map((sess, idx) => (
                              <div
                                key={sess.id}
                                className="py-2.5 flex items-center justify-between text-xs gap-3 group"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-atelier-muted" />
                                  <span className="text-atelier-text font-medium">
                                    {sess.started_at
                                      ? new Date(sess.started_at).toLocaleDateString('fr-FR', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : 'Date inconnue'}
                                  </span>
                                  {sess.notes && (
                                    <span className="text-atelier-muted italic">
                                      • {sess.notes}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-atelier-text">
                                    {formatFriendlyDuration(sess.duration_seconds)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setTargetAssemblyIdForSession(run.id);
                                      setSessionToEdit(sess);
                                      setSessionModalOpen(true);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-atelier-muted hover:text-atelier-text p-1 transition-opacity"
                                    title="Modifier la session"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSession(sess.id)}
                                    className="opacity-0 group-hover:opacity-100 text-atelier-muted hover:text-red-600 p-1 transition-opacity"
                                    title="Supprimer la session"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-atelier-muted italic">
                            Aucune session chronométrée enregistrée pour l'instant.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Colonne Droite : Galerie Photos & Caractéristiques */}
        <div className="space-y-6">
          
          {/* Galerie Photos */}
          <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-atelier-text flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-atelier-primary" />
                <span>Photos ({puzzle.images?.length || 0})</span>
              </h3>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-atelier-subtle hover:bg-atelier-border text-atelier-text text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? 'Envoi...' : '+ Ajouter'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo principale en grand */}
            {puzzle.cover_image_url ? (
              <div className="relative rounded-xl overflow-hidden border border-atelier-border aspect-4/3 bg-atelier-subtle group">
                <img
                  src={puzzle.cover_image_url}
                  alt={puzzle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                  Couverture principale
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-atelier-border p-8 text-center bg-atelier-bg/50">
                <ImageIcon className="w-8 h-8 text-atelier-muted mx-auto mb-2 opacity-60" />
                <p className="text-xs text-atelier-muted">Aucune photo pour l'instant</p>
              </div>
            )}

            {/* Miniatures supplémentaires */}
            {puzzle.images && puzzle.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 pt-2">
                {puzzle.images.map(img => (
                  <div
                    key={img.id}
                    className={`relative rounded-lg overflow-hidden border aspect-square group ${
                      img.is_cover ? 'ring-2 ring-atelier-primary border-transparent' : 'border-atelier-border'
                    }`}
                  >
                    <img src={img.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    
                    {/* Actions sur image */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                      {!img.is_cover && (
                        <button
                          onClick={() => handleSetCover(img.id)}
                          className="p-1 rounded bg-white text-black hover:bg-atelier-primary hover:text-white"
                          title="Définir comme couverture"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fiche Métadonnées */}
          <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-atelier-text">
              Caractéristiques
            </h3>

            <div className="divide-y divide-atelier-border/50 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-atelier-muted">Pièces</span>
                <span className="font-semibold text-atelier-text">{puzzle.piece_count.toLocaleString('fr-FR')}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-atelier-muted">Marque</span>
                <span className="font-semibold text-atelier-text">{puzzle.brand || '—'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-atelier-muted">Dimensions</span>
                <span className="font-semibold text-atelier-text">{puzzle.dimensions || '—'}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-atelier-muted">Difficulté</span>
                {puzzle.difficulty ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(v => (
                        <PuzzleIcon
                          key={v}
                          className={`w-3.5 h-3.5 ${
                            v <= puzzle.difficulty
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-atelier-border'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-atelier-muted">({puzzle.difficulty}/5)</span>
                  </div>
                ) : (
                  <span className="text-xs text-atelier-muted italic">Non renseignée</span>
                )}
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-atelier-muted">Avis</span>
                {puzzle.rating ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(v => (
                        <Star
                          key={v}
                          className={`w-3.5 h-3.5 ${
                            v <= puzzle.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-atelier-border'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-atelier-muted">({puzzle.rating}/5)</span>
                  </div>
                ) : (
                  <span className="text-xs text-atelier-muted italic">Sans avis</span>
                )}
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-atelier-muted">Pièces manquantes</span>
                <span className={`font-semibold ${puzzle.missing_pieces > 0 ? 'text-red-500 font-bold' : 'text-atelier-sauge'}`}>
                  {puzzle.missing_pieces > 0 ? `${puzzle.missing_pieces} pièce(s)` : '0 (Complet)'}
                </span>
              </div>
            </div>

            {/* Tags */}
            {puzzle.tags && puzzle.tags.length > 0 && (
              <div className="pt-2 border-t border-atelier-border/50">
                <span className="text-[11px] font-semibold text-atelier-muted block mb-1.5 uppercase tracking-wider">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {puzzle.tags.map(t => (
                    <span
                      key={t.id}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-atelier-subtle text-atelier-text border border-atelier-border"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes personelles */}
            {puzzle.notes && (
              <div className="pt-2 border-t border-atelier-border/50">
                <span className="text-[11px] font-semibold text-atelier-muted block mb-1 uppercase tracking-wider">
                  Remarques
                </span>
                <p className="text-xs text-atelier-text leading-relaxed whitespace-pre-line bg-atelier-bg p-3 rounded-lg border border-atelier-border">
                  {puzzle.notes}
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Ajout/Édition Session Manuelle */}
      <SessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        assemblyId={targetAssemblyIdForSession}
        sessionToEdit={sessionToEdit}
        onSaved={onRefresh}
      />

      {/* Modal Ajout Temps Manuel */}
      <ManualTimeModal
        isOpen={manualTimeModalOpen}
        onClose={() => setManualTimeModalOpen(false)}
        puzzle={puzzle}
        defaultAssemblyId={manualTimeTargetAssemblyId}
        onSaved={onRefresh}
      />

      {/* Modal Clôture de l'assemblage (Terminer) */}
      <FinishAssemblyModal
        isOpen={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        assembly={activeAssembly}
        puzzle={puzzle}
        onFinished={onRefresh}
      />

    </div>
  );
}
