/**
 * DECIX GAMES – Client API Service
 * Conexão do frontend com os endpoints do backend DECIX GAMES
 */

import { DecixGame, GameCategory, GameListResponse, SystemStats } from '../types/game.js';
import { INITIAL_GAMES } from '../../server/data/initialGames.js';
import { INITIAL_CATEGORIES } from '../../server/data/categories.js';

const API_BASE = '/api';

export const api = {
  /**
   * Busca catálogo de jogos com filtros e paginação
   */
  async getGames(params: {
    page?: number;
    limit?: number;
    category?: string;
    provider?: string;
    sortBy?: 'popular' | 'new' | 'az' | 'rating';
    search?: string;
  } = {}): Promise<GameListResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.category) searchParams.set('category', params.category);
      if (params.provider) searchParams.set('provider', params.provider);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.search) searchParams.set('q', params.search);

      const res = await fetch(`${API_BASE}/games?${searchParams.toString()}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getGames fallback:', err);
      // Fallback em caso de interrupção
      let games = [...INITIAL_GAMES];
      if (params.category && params.category !== 'todas') {
        games = games.filter((g) => g.categorySlug === params.category);
      }
      return {
        games,
        total: games.length,
        page: 1,
        limit: 24,
        totalPages: 1,
        hasMore: false
      };
    }
  },

  /**
   * Busca jogos mais populares
   */
  async getPopularGames(limit = 12): Promise<DecixGame[]> {
    try {
      const res = await fetch(`${API_BASE}/games/popular?limit=${limit}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: GameListResponse = await res.json();
      return data.games;
    } catch {
      return INITIAL_GAMES.slice().sort((a, b) => b.popularity - a.popularity).slice(0, limit);
    }
  },

  /**
   * Busca jogos novos
   */
  async getNewGames(limit = 12): Promise<DecixGame[]> {
    try {
      const res = await fetch(`${API_BASE}/games/new?limit=${limit}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: GameListResponse = await res.json();
      return data.games;
    } catch {
      return INITIAL_GAMES.filter((g) => g.isNew).slice(0, limit);
    }
  },

  /**
   * Busca jogos em destaque
   */
  async getFeaturedGames(limit = 12): Promise<DecixGame[]> {
    try {
      const res = await fetch(`${API_BASE}/games/featured?limit=${limit}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: GameListResponse = await res.json();
      return data.games;
    } catch {
      return INITIAL_GAMES.filter((g) => g.isFeatured).slice(0, limit);
    }
  },

  /**
   * Busca detalhes de um jogo por slug ou id
   */
  async getGameBySlug(slug: string): Promise<{ game: DecixGame; related: DecixGame[] } | null> {
    try {
      const res = await fetch(`${API_BASE}/games/${slug}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Status ${res.status}`);
      }
      return await res.json();
    } catch {
      const game = INITIAL_GAMES.find((g) => g.slug === slug || g.id === slug);
      if (!game) return null;
      const related = INITIAL_GAMES.filter((g) => g.id !== game.id && g.categorySlug === game.categorySlug).slice(0, 6);
      return { game, related };
    }
  },

  /**
   * Busca categorias de jogos
   */
  async getCategories(): Promise<GameCategory[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  /**
   * Pesquisa textual global
   */
  async searchGames(query: string, page = 1, limit = 24, sortBy?: string): Promise<GameListResponse> {
    try {
      const params = new URLSearchParams({
        q: query,
        page: String(page),
        limit: String(limit)
      });
      if (sortBy) params.set('sortBy', sortBy);

      const res = await fetch(`${API_BASE}/games/search?${params.toString()}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch {
      const q = query.toLowerCase();
      const filtered = INITIAL_GAMES.filter((g) => g.title.toLowerCase().includes(q) || g.tags.some((t) => t.includes(q)));
      return {
        games: filtered,
        total: filtered.length,
        page: 1,
        limit,
        totalPages: 1,
        hasMore: false
      };
    }
  },

  /**
   * Registra reprodução
   */
  async recordPlay(gameId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/games/${gameId}/play`, { method: 'POST' });
    } catch {
      // noop
    }
  },

  /**
   * Busca estatísticas do sistema
   */
  async getStats(): Promise<SystemStats | null> {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Ações administrativas protegidas
   */
  admin: {
    async verifySecret(secret: string): Promise<boolean> {
      try {
        const res = await fetch(`${API_BASE}/admin/verify`, {
          method: 'POST',
          headers: { 'X-Admin-Secret': secret }
        });
        return res.ok;
      } catch {
        return false;
      }
    },

    async syncGamePix(secret: string) {
      const res = await fetch(`${API_BASE}/admin/sync-gamepix`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': secret }
      });
      return await res.json();
    },

    async toggleFeatured(gameId: string, secret: string) {
      const res = await fetch(`${API_BASE}/admin/games/${gameId}/toggle-featured`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': secret }
      });
      return await res.json();
    },

    async addGame(gameData: Partial<DecixGame>, secret: string) {
      const res = await fetch(`${API_BASE}/admin/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret
        },
        body: JSON.stringify(gameData)
      });
      return await res.json();
    },

    async addCategory(catData: { name: string; description: string; color: string; icon: string }, secret: string) {
      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret
        },
        body: JSON.stringify(catData)
      });
      return await res.json();
    },

    async flushCache(secret: string) {
      const res = await fetch(`${API_BASE}/admin/cache/flush`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': secret }
      });
      return await res.json();
    }
  }
};
