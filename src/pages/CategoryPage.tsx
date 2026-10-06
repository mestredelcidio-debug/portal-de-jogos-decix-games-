import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gamepad2, Brain, Sparkles, Filter } from 'lucide-react';
import { DecixGame, GameCategory } from '../types/game.js';
import { api } from '../services/api.js';
import { GameCard } from '../components/common/GameCard.js';
import { SkeletonCard } from '../components/common/SkeletonCard.js';
import { AdBanner } from '../components/ads/AdBanner.js';
import { useSeo } from '../hooks/useSeo.js';

interface CategoryPageProps {
  categorySlug: string;
  onPlayGame: (game: DecixGame) => void;
  onNavigate: (path: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ categorySlug, onPlayGame, onNavigate }) => {
  const [games, setGames] = useState<DecixGame[]>([]);
  const [category, setCategory] = useState<GameCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryGames() {
      setLoading(true);
      try {
        const [cats, gamesRes] = await Promise.all([
          api.getCategories(),
          api.getGames({ category: categorySlug, limit: 32 })
        ]);

        const current = cats.find((c) => c.slug === categorySlug);
        setCategory(current || null);
        setGames(gamesRes.games);
      } catch (err) {
        console.error('Erro ao buscar jogos da categoria:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryGames();
  }, [categorySlug]);

  const catName = category?.name || categorySlug;

  useSeo({
    title: `Jogos de ${catName} – DECIX GAMES`,
    description: category?.description || `Explore os melhores jogos de ${catName} no portal DECIX GAMES. Jogue grátis direto no navegador.`,
    url: window.location.href
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Category Header Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-gray-950 via-gray-900 to-cyan-950/30 p-6 sm:p-8">
        <button
          onClick={() => onNavigate('/jogos')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              Jogos de {catName}
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {category?.description || 'Desafie sua mente com os títulos mais inteligentes da categoria.'}
            </p>
          </div>
          <div className="bg-gray-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center shrink-0">
            <span className="text-[10px] text-slate-500 block uppercase">Total de Jogos</span>
            <span className="font-mono font-bold text-lg text-cyan-400">{games.length}</span>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onPlayGame} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-slate-800 p-8">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-slate-200">
            Nenhum jogo nesta categoria no momento
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Novos títulos estão sendo sincronizados continuamente com o catálogo.
          </p>
          <button
            onClick={() => onNavigate('/jogos')}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Ver Outros Jogos
          </button>
        </div>
      )}

      {/* Ad slot */}
      <AdBanner position="bottom" />
    </div>
  );
};
