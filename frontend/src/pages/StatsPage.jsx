import React, { useEffect, useState } from 'react';
import { getStats } from '../api';
import { formatFriendlyDuration } from '../context/TimerContext';
import { Trophy, CheckCircle2, Clock, Zap, Layers, Award } from 'lucide-react';

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

      {/* Cartes KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 : Puzzles terminés */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-atelier-sauge mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">Puzzles terminés</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-atelier-text font-serif">
            {stats.completed_puzzles}
            <span className="text-sm font-normal text-atelier-muted font-sans ml-2">
              / {stats.total_puzzles} au total
            </span>
          </div>
          <div className="text-xs text-atelier-muted mt-2">
            {stats.total_assemblies_count} réalisation{stats.total_assemblies_count > 1 ? 's' : ''} complétée{stats.total_assemblies_count > 1 ? 's' : ''}
          </div>
        </div>

        {/* KPI 2 : Pièces assemblées */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-atelier-primary mb-3">
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

        {/* KPI 3 : Temps total */}
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

        {/* KPI 4 : Vitesse moyenne */}
        <div className="bg-atelier-surface border border-atelier-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-atelier-muted">Allure moyenne</span>
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-atelier-text font-mono">
            {stats.average_pieces_per_hour}
            <span className="text-sm font-normal text-atelier-muted font-sans ml-1">pièces/h</span>
          </div>
          <div className="text-xs text-atelier-muted mt-2">
            {stats.average_pieces_per_hour > 0
              ? `Environ ${Math.round(6000 / stats.average_pieces_per_hour)} min pour 100 pièces`
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
