import { motion } from 'framer-motion';

export interface FavoriteItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  timestamp: number;
}

const FAVORITES_KEY = 'wanasing_favorites';

export function getFavorites(): FavoriteItem[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToFavorites(item: { title: string; artist: string; cover: string; audioUrl: string }): void {
  const favorites = getFavorites();
  // Remove duplicate
  const filtered = favorites.filter((f) => f.audioUrl !== item.audioUrl);
  const newItem: FavoriteItem = {
    ...item,
    id: `fav-${Date.now()}`,
    timestamp: Date.now(),
  };
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([newItem, ...filtered]));
}

export function removeFromFavorites(audioUrl: string): void {
  const favorites = getFavorites();
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.filter((f) => f.audioUrl !== audioUrl)));
}

export function isFavorite(audioUrl: string): boolean {
  return getFavorites().some((f) => f.audioUrl === audioUrl);
}

interface FavoritesListProps {
  favorites: FavoriteItem[];
  onPlay: (item: FavoriteItem) => void;
  onRemove: (audioUrl: string) => void;
}

export function FavoritesList({ favorites, onPlay, onRemove }: FavoritesListProps) {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">💔</div>
        <p className="text-text-secondary">还没有喜欢的音乐</p>
        <p className="text-text-secondary text-sm mt-2">去搜索或推荐页面发现好歌吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        共 {favorites.length} 首喜欢的歌曲
      </p>
      {favorites.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          className="bg-surface/80 backdrop-blur-xl rounded-2xl p-4 border border-primary/10 flex items-center gap-4 group"
        >
          {/* Cover */}
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface">
            {item.cover ? (
              <img
                src={item.cover}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                🎵
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-text-primary font-medium truncate">{item.title}</h4>
            <p className="text-text-secondary text-sm truncate">{item.artist}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPlay(item)}
              className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 glow-primary"
              title="播放"
            >
              ▶
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRemove(item.audioUrl)}
              className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-lg flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="取消喜欢"
            >
              ♥
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
