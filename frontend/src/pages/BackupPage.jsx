import React, { useState } from 'react';
import {
  Database,
  FileJson,
  Archive,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import {
  EXPORT_JSON_URL,
  EXPORT_DB_URL,
  EXPORT_ARCHIVE_URL,
  importJson,
  importArchive
} from '../api';

export default function BackupPage({ onDataRestored }) {
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setStatusMessage(null);

    try {
      if (file.name.endsWith('.json')) {
        await importJson(file);
        setStatusMessage({ type: 'success', text: 'Données JSON importées avec succès !' });
      } else if (file.name.endsWith('.zip')) {
        await importArchive(file);
        setStatusMessage({ type: 'success', text: 'Archive complète restaurée avec succès !' });
      } else {
        throw new Error('Veuillez sélectionner un fichier .json ou .zip valide.');
      }

      if (onDataRestored) onDataRestored();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || "Erreur lors de l'importation." });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* En-tête */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-atelier-text tracking-tight">
          Sauvegarde & Exportation des Données
        </h1>
        <p className="text-sm text-atelier-muted mt-1">
          Vos données vous appartiennent à 100%. PuzzleDex stocke tout dans des fichiers locaux simples à sauvegarder et à migrer.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Cartes d'export */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-atelier-text">
          Options d'Exportation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Option 1 : Base SQLite */}
          <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-atelier-subtle text-atelier-primary flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-atelier-text">
                Base de données SQLite
              </h3>
              <p className="text-xs text-atelier-muted mt-1">
                Le fichier brut <code>puzzledex.db</code> contenant l'ensemble des tables et des sessions.
              </p>
            </div>
            <a
              href={EXPORT_DB_URL}
              download="puzzledex.db"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-atelier-subtle hover:bg-atelier-border text-atelier-text text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger .db</span>
            </a>
          </div>

          {/* Option 2 : Export JSON */}
          <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-atelier-primaryLight text-atelier-primary flex items-center justify-center mb-3">
                <FileJson className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-atelier-text">
                Format JSON Structuré
              </h3>
              <p className="text-xs text-atelier-muted mt-1">
                Fichier lisible et universel contenant l'historique complet, les réalisations et les tags.
              </p>
            </div>
            <a
              href={EXPORT_JSON_URL}
              download="puzzledex_export.json"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-atelier-primary hover:bg-atelier-primaryHover text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter en JSON</span>
            </a>
          </div>

          {/* Option 3 : Archive Complète ZIP */}
          <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-atelier-saugeLight text-atelier-sauge flex items-center justify-center mb-3">
                <Archive className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-bold text-atelier-text">
                Archive Complète (ZIP)
              </h3>
              <p className="text-xs text-atelier-muted mt-1">
                L'archive intégrale regroupant la base SQLite, le JSON et l'ensemble de vos photos téléversées.
              </p>
            </div>
            <a
              href={EXPORT_ARCHIVE_URL}
              download="puzzledex_sauvegarde_complete.zip"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-atelier-sauge hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Archive complète ZIP</span>
            </a>
          </div>

        </div>
      </div>

      {/* Section Importation & Restauration */}
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-xl font-bold text-atelier-text flex items-center gap-2">
          <Upload className="w-5 h-5 text-atelier-primary" />
          <span>Restaurer une sauvegarde</span>
        </h2>
        <p className="text-xs text-atelier-muted">
          Importez un fichier <code>.json</code> ou une archive <code>.zip</code> précédemment exportée. Les données seront synchronisées et les photos restaurées sans écraser vos réglages.
        </p>

        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-atelier-border rounded-2xl cursor-pointer hover:border-atelier-primary bg-atelier-bg/50 hover:bg-atelier-subtle/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-atelier-muted mb-2" />
            <p className="mb-1 text-sm font-semibold text-atelier-text">
              {importing ? 'Restauration en cours...' : 'Cliquez pour sélectionner un fichier ou glissez-déposez'}
            </p>
            <p className="text-xs text-atelier-muted">Formats acceptés : .json ou .zip</p>
          </div>
          <input
            type="file"
            accept=".json,.zip"
            disabled={importing}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Note sur la persistance Docker */}
      <div className="p-4 rounded-xl bg-atelier-subtle/60 border border-atelier-border flex items-start gap-3 text-xs text-atelier-muted">
        <ShieldCheck className="w-5 h-5 text-atelier-sauge shrink-0 mt-0.5" />
        <div>
          <strong className="text-atelier-text block mb-0.5">Persistance des données avec Docker :</strong>
          Toutes vos données (base SQLite et dossier d'images) sont enregistrées dans le volume persistant <code>/data</code> monté sur votre machine hôte. Elles survivent automatiquement à tout redémarrage ou mise à jour de conteneur.
        </div>
      </div>

    </div>
  );
}
