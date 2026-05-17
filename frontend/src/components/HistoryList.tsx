import { MUSIC_STYLES, STORAGE_KEY, MAX_HISTORY } from '../utils/constants';
import { motion } from 'framer-motion';

export interface HistoryItem {
  id: string;
  audioUrl: string;
  style: string;
  timestamp: number;
}

export function getHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  history.unshift(newItem);
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

interface HistoryListProps {
  history: HistoryItem[];
  onPlay: (url: string) => void;
}

export function HistoryList({ history, onPlay }: HistoryListProps) {
  const getStyleLabel = (styleId: string) => {
    const style = MUSIC_STYLES.find((s) => s.id === styleId);
    return style ? `${style.icon} ${style.label}` : styleId;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (history.length === 0) {
    return (
      <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 text-center">
        <span className="text-5xl mb-3 block">📭</span>
        <p className="text-text-secondary">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">🎶 历史记录</h3>
      <div className="space-y-3">
        {history.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(108, 99, 255, 0.1)' }}
            className="flex items-center gap-3 p-3 bg-surface rounded-xl cursor-pointer transition-all"
            onClick={() => onPlay(item.audioUrl)}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg">🎵</span>
            </div>
            <div className="flex-1">
              <span className="text-text-primary font-medium">{getStyleLabel(item.style)}</span>
              <span className="text-text-secondary text-sm block">{formatDate(item.timestamp)}</span>
            </div>
            <button className="p-2 hover:bg-primary/20 rounded-full transition-colors">
              ▶️
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
