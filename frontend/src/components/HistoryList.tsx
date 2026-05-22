import { motion } from 'framer-motion';
import { PLAY_HISTORY_KEY, MAX_PLAY_HISTORY } from '../utils/constants';

export interface PlayHistoryItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  timestamp: number;
}

export function getPlayHistory(): PlayHistoryItem[] {
  try {
    const data = localStorage.getItem(PLAY_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveToPlayHistory(item: Omit<PlayHistoryItem, 'id' | 'timestamp'>): void {
  const history = getPlayHistory();
  // Remove duplicate if exists
  const filtered = history.filter((h) => h.audioUrl !== item.audioUrl);
  const newItem: PlayHistoryItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  filtered.unshift(newItem);
  const trimmed = filtered.slice(0, MAX_PLAY_HISTORY);
  localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(trimmed));
}

export function clearPlayHistory(): void {
  localStorage.removeItem(PLAY_HISTORY_KEY);
}

interface HistoryListProps {
  history: PlayHistoryItem[];
  onPlay: (item: PlayHistoryItem) => void;
  onClear?: () => void;
}

export function HistoryList({ history, onPlay, onClear }: HistoryListProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  if (history.length === 0) {
    return (
      <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-12 text-center">
        <span className="text-5xl mb-4 block">🕐</span>
        <p className="text-text-secondary text-lg">暂无播放记录</p>
        <p className="text-text-secondary text-sm mt-2">开始播放歌曲，记录将出现在这里</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">🕐 播放历史</h2>
        <button
          onClick={() => { clearPlayHistory(); onClear?.(); }}
          className="text-sm text-text-secondary hover:text-error transition-colors px-3 py-1 rounded-lg border border-primary/10 hover:border-error/30"
        >
          清空记录
        </button>
      </div>
      <div className="space-y-2">
        {history.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onPlay(item)}
            className="flex items-center gap-4 p-3 bg-surface/60 backdrop-blur-xl rounded-xl border border-primary/5 hover:border-primary/20 cursor-pointer transition-all group"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.cover}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium truncate">{item.title}</p>
              <p className="text-text-secondary text-sm truncate">{item.artist}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-text-secondary text-xs hidden sm:block">
                {formatDate(item.timestamp)}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm">▶</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
