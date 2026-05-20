import { useState } from 'react';
import { motion } from 'framer-motion';
import { FeedCard } from './FeedCard';
import type { FeedItem } from './FeedCard';

interface ChallengeDetailProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    cover: string;
    participantCount: number;
    endDate: string;
    prize: string;
  };
  feeds: FeedItem[];
  onBack: () => void;
  onJoinChallenge: () => void;
}

export function ChallengeDetail({
  challenge,
  feeds,
  onBack,
  onJoinChallenge
}: ChallengeDetailProps) {
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot');

  return (
    <div className="pb-24">
      {/* 封面区域 */}
      <div className="relative h-64 -mx-6 -mt-6 mb-6">
        <img
          src={challenge.cover}
          alt={challenge.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* 返回按钮 */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          ←
        </button>

        {/* 挑战信息 */}
        <div className="absolute bottom-4 left-6 right-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {challenge.title}
          </h2>
          <p className="text-white/80 text-sm mb-3">
            {challenge.description}
          </p>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <span>👥 {challenge.participantCount}人参与</span>
            <span>📅 截止: {challenge.endDate}</span>
            <span>🏆 {challenge.prize}</span>
          </div>
        </div>
      </div>

      {/* 参与按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onJoinChallenge}
        className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-2xl glow-primary mb-6"
      >
        🎤 立即参与挑战
      </motion.button>

      {/* 排序切换 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setSortBy('hot')}
          className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
            sortBy === 'hot'
              ? 'bg-primary text-white'
              : 'bg-surface/80 text-text-secondary'
          }`}
        >
          🔥 热门
        </button>
        <button
          onClick={() => setSortBy('new')}
          className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
            sortBy === 'new'
              ? 'bg-primary text-white'
              : 'bg-surface/80 text-text-secondary'
          }`}
        >
          🆕 最新
        </button>
      </div>

      {/* 参与作品列表 */}
      <div className="space-y-4">
        {feeds.map((feed) => (
          <FeedCard
            key={feed.feed_id}
            feed={feed}
            onPlay={() => console.log('Play')}
            onLike={() => console.log('Like')}
            onComment={() => console.log('Comment')}
            onSingAlong={() => console.log('Sing along')}
            onSave={() => console.log('Save')}
          />
        ))}
      </div>

      {/* 空状态 */}
      {feeds.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎵</div>
          <p className="text-text-secondary">
            还没有作品参与挑战
          </p>
          <p className="text-text-secondary text-sm mt-2">
            快来发布第一个作品吧！
          </p>
        </div>
      )}
    </div>
  );
}
