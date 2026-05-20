import { useState } from 'react';
import { motion } from 'framer-motion';

export interface FeedUser {
  id: string;
  nickname: string;
  avatar: string;
  level: string;
  badge?: string;
}

export interface FeedContent {
  song_name?: string;
  artist?: string;
  audio_url: string;
  duration?: number;
  score?: number;
  cover_image?: string;
  tags?: string[];
  style?: string;
  bpm?: number;
  stability?: number;
  description?: string;
}

export interface FeedMetrics {
  likes: number;
  comments: number;
  shares: number;
  plays: number;
}

export interface FeedItem {
  feed_id: string;
  type: 'performance' | 'creation' | 'practice' | 'achievement';
  user: FeedUser;
  content: FeedContent;
  metrics: FeedMetrics;
  actions: { is_liked: boolean; is_saved: boolean };
  created_at: string;
  source?: string;
}

interface FeedCardProps {
  feed: FeedItem;
  onPlay?: (url: string) => void;
  onLike?: (feedId: string) => void;
  onComment?: (feedId: string) => void;
  onSingAlong?: (feed: FeedItem) => void;
  onSave?: (feedId: string) => void;
}

export function FeedCard({ feed, onPlay, onLike, onComment, onSingAlong, onSave }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(feed.actions.is_liked);
  const [isSaved, setIsSaved] = useState(feed.actions.is_saved);
  const [likeCount, setLikeCount] = useState(feed.metrics.likes);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diff = Math.floor((now.getTime() - created.getTime()) / 60000);
    
    if (diff < 60) return `${diff}分钟前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
    return `${Math.floor(diff / 1440)}天前`;
  };

  const getScoreLabel = (score?: number) => {
    if (!score) return '';
    if (score >= 90) return '优秀';
    if (score >= 75) return '良好';
    if (score >= 60) return '一般';
    return '需要练习';
  };

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
    onLike?.(feed.feed_id);
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    onPlay?.(feed.content.audio_url);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(feed.feed_id);
  };

  const getTypeIcon = () => {
    switch (feed.type) {
      case 'performance': return '🎤';
      case 'creation': return '✨';
      case 'practice': return '🎯';
      case 'achievement': return '🎉';
      default: return '🎵';
    }
  };

  const getTypeLabel = () => {
    switch (feed.type) {
      case 'performance': return '演唱了';
      case 'creation': return 'AI 生成了';
      case 'practice': return '练习了';
      case 'achievement': return '获得成就';
      default: return '发布了';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 mb-4"
    >
      {/* 用户信息 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
          <span className="text-xl">{feed.user.avatar || '👤'}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-semibold">{feed.user.nickname}</span>
            <span className="text-text-secondary text-sm">{feed.user.level}</span>
            {feed.user.badge && (
              <span className="bg-secondary/20 text-secondary text-xs px-2 py-0.5 rounded-full">
                {feed.user.badge}
              </span>
            )}
          </div>
          <span className="text-text-secondary text-xs">{formatTimeAgo(feed.created_at)}</span>
        </div>
      </div>

      {/* 内容标题 */}
      <div className="mb-4">
        <span className="text-xl mr-2">{getTypeIcon()}</span>
        <span className="text-text-primary">
          {getTypeLabel()}
          {feed.content.song_name && (
            <span className="text-primary font-semibold ml-1">《{feed.content.song_name}》</span>
          )}
          {feed.content.artist && (
            <span className="text-text-secondary ml-1">- {feed.content.artist}</span>
          )}
          {feed.content.style && (
            <span className="text-secondary ml-1">· {feed.content.style}风格</span>
          )}
        </span>
      </div>

      {/* 音频播放区 */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlay}
            className="w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl glow-primary"
          >
            {isPlaying ? '⏸' : '▶'}
          </motion.button>
          
          <div className="flex-1">
            {/* 模拟波形 */}
            <div className="flex items-end gap-1 h-8 mb-2">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isPlaying ? `${20 + Math.sin(i * 0.5 + Date.now() / 200) * 15}px` : '20px'
                  }}
                  className="w-2 bg-primary/50 rounded-t-sm"
                />
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              {feed.content.score && (
                <span className="text-secondary">⭐ 评分：{feed.content.score}分</span>
              )}
              {feed.type === 'performance' && feed.content.score && (
                <span className="text-text-secondary">音准：{getScoreLabel(feed.content.score)}</span>
              )}
              {feed.type === 'creation' && feed.content.bpm && (
                <span className="text-text-secondary">🎨 {feed.content.bpm}BPM</span>
              )}
              {feed.type === 'practice' && feed.content.stability && (
                <span className="text-text-secondary">📊 稳定度：{feed.content.stability}%</span>
              )}
              {feed.content.duration && (
                <span className="text-text-secondary">⏱️ {Math.floor(feed.content.duration / 60)}:{(feed.content.duration % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 描述文本 */}
      {feed.content.description && (
        <p className="text-text-secondary text-sm mb-4">
          💬 "{feed.content.description}"
        </p>
      )}

      {/* 标签 */}
      {feed.content.tags && feed.content.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {feed.content.tags.map((tag, i) => (
            <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 分割线 */}
      <div className="w-full h-px bg-surface/50 mb-4" />

      {/* 互动数据 */}
      <div className="flex items-center gap-6 mb-4 text-text-secondary text-sm">
        <span>❤️ {likeCount}</span>
        <span>💬 {feed.metrics.comments}</span>
        <span>📤 {feed.metrics.shares}</span>
        <span>🎧 {feed.metrics.plays.toLocaleString()}</span>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3">
        {feed.type !== 'achievement' ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSingAlong?.(feed)}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-background font-semibold py-2.5 rounded-xl glow-primary"
            >
              {feed.type === 'performance' ? '🎤 跟唱' : '🎵 试唱'}
            </motion.button>
            
            {feed.type === 'creation' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-surface text-primary font-semibold py-2.5 px-4 rounded-xl border border-primary/30"
              >
                ✨ 灵感创作
              </motion.button>
            )}
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-gradient-to-r from-primary to-secondary text-background font-semibold py-2.5 rounded-xl glow-primary"
          >
            🎯 我也要打卡
          </motion.button>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className={`p-2.5 rounded-xl transition-colors ${isLiked ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-surface'}`}
        >
          {isLiked ? '❤️' : '🤍'}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onComment?.(feed.feed_id)}
          className="p-2.5 text-text-secondary hover:bg-surface rounded-xl"
        >
          💬
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className={`p-2.5 rounded-xl transition-colors ${isSaved ? 'bg-secondary/20 text-secondary' : 'text-text-secondary hover:bg-surface'}`}
        >
          {isSaved ? '⭐' : '☆'}
        </motion.button>
      </div>
    </motion.div>
  );
}
