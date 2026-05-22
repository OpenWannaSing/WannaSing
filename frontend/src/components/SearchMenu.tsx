import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface SearchResult {
  source: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  duration_s: number;
  ext: string;
  file_size: string;
  download_url: string;
  cover_url: string;
}

interface SearchMenuProps {
  onPlay: (result: SearchResult) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const HOT_QUERIES = [
  { keyword: '七里香 周杰伦', title: '七里香', artist: '周杰伦', emoji: '🌸' },
  { keyword: '起风了 买辣椒也用券', title: '起风了', artist: '买辣椒也用券', emoji: '🍃' },
  { keyword: '孤勇者 陈奕迅', title: '孤勇者', artist: '陈奕迅', emoji: '⚔️' },
];

export function SearchMenu({ onPlay }: SearchMenuProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [hotSongs, setHotSongs] = useState<(SearchResult & { emoji: string })[]>([]);
  const hotLoaded = useRef(false);

  const handleSearch = useCallback(async () => {
    const q = keyword.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const resp = await axios.get(`${API_BASE}/api/v1/music/search`, {
        params: { keyword: q, page: 1 },
      });
      setResults(resp.data.data.results);
    } catch (e: any) {
      setError(e?.response?.data?.detail || '搜索失败，请重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Auto-fetch hot songs on mount
  useEffect(() => {
    if (hotLoaded.current) return;
    hotLoaded.current = true;
    const fetchHot = async () => {
      const results: (SearchResult & { emoji: string })[] = [];
      for (const hot of HOT_QUERIES) {
        try {
          const resp = await axios.get(`${API_BASE}/api/v1/music/search`, {
            params: { keyword: hot.keyword, page: 1 },
          });
          const first = resp.data.data.results?.[0];
          if (first) results.push({ ...first, emoji: hot.emoji });
        } catch {
          // skip failed
        }
      }
      if (results.length > 0) setHotSongs(results);
    };
    fetchHot();
  }, []);

  const handlePlayHot = (song: SearchResult & { emoji: string }) => {
    // Also auto-search it for the keyword
    setKeyword(song.title);
    setResults([song]);
    setSearched(true);
    onPlay(song);
  };

  const playUrl = (result: SearchResult) => {
    // Use proxy endpoint to avoid CORS
    return `${API_BASE}/api/v1/music/proxy?url=${encodeURIComponent(result.download_url)}`;
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索歌曲，如「往事云淡风轻」"
            className="w-full bg-surface border border-primary/20 rounded-full px-5 py-3 pl-12 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
            🔍
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSearch}
          disabled={loading || !keyword.trim()}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-semibold disabled:opacity-50 glow-primary"
        >
          {loading ? '搜索中...' : '搜索'}
        </motion.button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Hot Songs — shown before user searches */}
      {!searched && hotSongs.length > 0 && (
        <div>
          <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
            <span>🔥</span> 热门搜索
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {hotSongs.map((song, idx) => (
              <motion.div
                key={`hot-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handlePlayHot(song)}
                className="bg-gradient-to-br from-surface/90 to-surface/60 backdrop-blur-xl rounded-2xl p-4 border border-primary/10 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{song.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-text-primary font-medium truncate text-sm">
                      {song.title}
                    </h4>
                    <p className="text-text-secondary text-xs truncate">
                      {song.artist}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{song.source}</span>
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-xs">
                    ▶
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!searched && hotSongs.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-text-secondary">加载热门歌曲...</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-text-secondary">搜索中...</span>
        </div>
      )}

      {/* Results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <div className="text-4xl mb-3">🎵</div>
          <p>没有找到相关结果</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            共找到 {results.length} 条结果
          </p>
          {results.map((result, idx) => (
            <motion.div
              key={`${result.source}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-surface/80 backdrop-blur-xl rounded-2xl p-4 border border-primary/10 flex items-center gap-4"
            >
              {/* Cover */}
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface">
                {result.cover_url ? (
                  <img
                    src={result.cover_url}
                    alt={result.title}
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
                <h4 className="text-text-primary font-medium truncate">
                  {result.title}
                </h4>
                <p className="text-text-secondary text-sm truncate">
                  {result.artist} · {result.source}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-secondary uppercase">
                    {result.ext}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {result.file_size}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {result.duration}
                  </span>
                </div>
              </div>

              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPlay(result)}
                className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-xl flex-shrink-0 glow-primary"
                title="播放"
              >
                ▶
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { SearchResult };
