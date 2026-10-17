import React, { useEffect, useState } from 'react';
import { getStats } from '../api';
import { formatFriendlyDuration } from '../context/TimerContext';
import { Trophy, CheckCircle2, Clock, Zap, Layers, Award, Package, Gauge } from 'lucide-react';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-atelier-muted">
        Chargement des statistiques...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      
      {/* En-tête de la page */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-atelier-text tracking-tight">
          Tableau de Bord & Statistiques
        </h1>
        <p className="text-sm text-atelier-muted mt-1">
          Visualisez votre progression, vos records de vitesse et l'historique de vos assemblages.
        </p>
      </div>

      {/* Cartes KPI Principales (5 cartes responsives) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* KPI 1 : Pièces en collection (hors empruntés ni archivés) */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-atelier-primary mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">En collection</span>
            <Package className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-atelier-text font-mono">
            {(stats.total_pieces_in_collection || 0).toLocaleString('fr-FR')}
            <span className="text-xs font-normal text-atelier-muted font-sans ml-1.5">pcs</span>
          </div>
          <div className="text-xs text-atelier-muted mt-2">
            {stats.collection_puzzles_count || 0} puzzle{(stats.collection_puzzles_count || 0) > 1 ? 's' : ''} possédé{(stats.collection_puzzles_count || 0) > 1 ? 's' : ''} (hors emprunts & archivés)
          </div>
        </div>

        {/* KPI 2 : Puzzles terminés */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-atelier-sauge mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">Puzzles terminés</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-atelier-text font-serif">
            {stats.completed_puzzles}
            <span className="text-sm font-normal text-atelier-muted font-sans ml-1.5">
              / {stats.total_puzzles}
            </span>
          </div>
          <div className="text-xs text-atelier-muted mt-2">
            {stats.total_assemblies_count} réalisation{stats.total_assemblies_count > 1 ? 's' : ''} complétée{stats.total_assemblies_count > 1 ? 's' : ''}
          </div>
        </div>

        {/* KPI 3 : Pièces assemblées */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">Pièces posées</span>
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-atelier-text font-mono">
            {stats.total_pieces_completed.toLocaleString('fr-FR')}
          </div>
          <div className="text-xs text-atelier-muted mt-2">
            Sur l'ensemble de vos réalisations terminées
          </div>
        </div>

        {/* KPI 4 : Temps total */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-atelier-amber mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">Temps total passé</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-atelier-text font-mono">
            {formatFriendlyDuration(stats.total_time_spent_seconds)}
          </div>
          <div className="text-xs text-atelier-muted mt-2">
            Cumulé sur toutes vos sessions de travail
          </div>
        </div>

        {/* KPI 5 : Vitesse moyenne */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">Allure moyenne</span>
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-atelier-text font-mono">
            {stats.average_pieces_per_minute || 0}
            <span className="text-xs font-normal text-atelier-muted font-sans ml-1">pcs/min</span>
          </div>
          <div className="text-xs text-atelier-muted mt-2">
            {stats.average_pieces_per_hour > 0
              ? `${stats.average_pieces_per_hour} pièces/h (~${Math.round(100 / (stats.average_pieces_per_minute || 1))} min/100 pcs)`
              : 'En attente de puzzles terminés'}
          </div>
        </div>

      </div>

      {/* Record Personnel : 1000 pièces */}
      {stats.fastest_1000_puzzle && (
        <div className="bg-gradient-to-r from-atelier-primaryLight/40 via-atelier-surface to-atelier-surface border border-atelier-primary/40 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-atelier-primary text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-atelier-primary">
                Record de vitesse (1 000 pièces)
              </span>
              <h3 className="font-serif text-xl font-bold text-atelier-text">
                {stats.fastest_1000_puzzle.title}
              </h3>
              <p className="text-xs text-atelier-muted">
                {stats.fastest_1000_puzzle.brand || 'Marque non spécifiée'}
                {stats.fastest_1000_puzzle.completed_at
                  ? ` • Fini le ${new Date(stats.fastest_1000_puzzle.completed_at).toLocaleDateString('fr-FR')}`
                  : ''}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="font-mono text-3xl font-bold text-atelier-primary">
              {formatFriendlyDuration(stats.fastest_1000_puzzle.duration_seconds)}
            </div>
            <div className="text-xs text-atelier-muted">
              Temps record
            </div>
          </div>
        </div>
      )}

      {/* Section : Détails d'allure en pièces par minute par catégorie de nombre de pièces */}
      <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-atelier-border pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-atelier-text flex items-center gap-2">
              <Gauge className="w-5 h-5 text-atelier-primary" />
              <span>Détails d'allure par catégorie de pièces</span>
            </h2>
            <p className="text-xs text-atelier-muted mt-0.5">
              Vitesse d'assemblage moyenne en <strong>pièces par minute</strong> (pcs/min) pour chaque taille de puzzle.
            </p>
          </div>
          <div className="text-xs text-atelier-muted bg-atelier-subtle px-3 py-1.5 rounded-lg border border-atelier-border self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-atelier-primary"></span>
            <span>Allure globale : <strong className="font-mono text-atelier-text">{stats.average_pieces_per_minute || 0} pcs/min</strong></span>
          </div>
        </div>

        {/* Grille responsive des catégories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.pace_by_piece_count && stats.pace_by_piece_count.map(tier => {
            const hasData = tier.completed_count > 0;
            return (
              <div
                key={tier.tier}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  hasData
                    ? 'bg-atelier-subtle/30 border-atelier-border hover:border-atelier-primary/50'
                    : 'bg-atelier-subtle/10 border-atelier-border/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-serif font-bold text-base text-atelier-text">
                      {tier.tier}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      hasData
                        ? 'bg-atelier-primaryLight text-atelier-primary font-mono'
                        : 'bg-atelier-subtle text-atelier-muted'
                    }`}>
                      {tier.completed_count} terminé{tier.completed_count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="my-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-atelier-muted block mb-0.5">
                      Allure moyenne
                    </span>
                    {hasData ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold font-mono text-atelier-primary">
                            {tier.average_pieces_per_minute}
                          </span>
                          <span className="text-xs font-semibold text-atelier-muted">
                            pcs/min
                          </span>
                        </div>
                        <div className="text-[11px] text-atelier-muted font-mono mt-0.5">
                          soit {tier.average_pieces_per_hour} pièces/h
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-atelier-muted italic py-1">
                        Aucun puzzle terminé
                      </div>
                    )}
                  </div>
                </div>

                {hasData ? (
                  <div className="pt-3 border-t border-atelier-border/50 text-xs space-y-1.5 text-atelier-muted">
                    <div className="flex justify-between items-center">
                      <span>Temps moyen :</span>
                      <span className="font-mono font-semibold text-atelier-text">
                        {formatFriendlyDuration(tier.average_duration_seconds)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Temps / 100 pcs :</span>
                      <span className="font-mono text-atelier-text">
                        {tier.average_pieces_per_minute > 0
                          ? `~${Math.round(100 / tier.average_pieces_per_minute)} min`
                          : '—'}
                      </span>
                    </div>
                    {tier.fastest_run && (
                      <div className="mt-2 pt-2 border-t border-atelier-border/40 text-[11px]">
                        <div className="font-semibold text-atelier-primary flex items-center gap-1">
                          🏆 Record : <span className="font-mono">{tier.fastest_run.pieces_per_minute} pcs/min</span>
                        </div>
                        <div className="text-[10px] text-atelier-muted truncate mt-0.5" title={tier.fastest_run.puzzle_title}>
                          {tier.fastest_run.puzzle_title} ({formatFriendlyDuration(tier.fastest_run.duration_seconds)})
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-3 border-t border-atelier-border/30 text-[11px] text-atelier-muted italic">
                    Complétez un puzzle pour voir vos statistiques.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Graphiques & Répartitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Répartition par Tranche de Pièces */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-atelier-text flex items-center gap-2">
            <Layers className="w-4 h-4 text-atelier-primary" />
            <span>Répartition par taille de puzzle</span>
          </h3>

          <div className="space-y-3 pt-2">
            {stats.piece_count_distribution.map(item => {
              const percentage = stats.total_puzzles > 0
                ? Math.round((item.count / stats.total_puzzles) * 100)
                : 0;

              return (
                <div key={item.tier} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-atelier-text">{item.tier}</span>
                    <span className="text-atelier-muted">{item.count} puzzle{item.count > 1 ? 's' : ''} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-atelier-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-atelier-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Marques */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-atelier-text flex items-center gap-2">
            <Award className="w-4 h-4 text-atelier-sauge" />
            <span>Top Marques dans votre collection</span>
          </h3>

          {stats.top_brands.length > 0 ? (
            <div className="space-y-3 pt-2">
              {stats.top_brands.map((b, idx) => {
                const maxCount = stats.top_brands[0]?.count || 1;
                const pct = Math.round((b.count / maxCount) * 100);

                return (
                  <div key={b.brand} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-atelier-text font-semibold">
                        #{idx + 1} {b.brand}
                      </span>
                      <span className="text-atelier-muted font-mono">{b.count} puzzle{b.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full h-2.5 bg-atelier-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-atelier-sauge rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-atelier-muted italic py-4">
              Renseignez les marques de vos puzzles pour voir apparaître vos fabricants favoris ici.
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
