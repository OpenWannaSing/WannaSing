import { motion } from 'framer-motion';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  cover: string;
  participantCount: number;
  isHot?: boolean;
  isNew?: boolean;
}

interface StarUser {
  id: string;
  nickname: string;
  avatar: string;
  level: string;
  badge: string;
  workCount: number;
}

interface StorySectionProps {
  challenges: Challenge[];
  starUsers: StarUser[];
  onChallengeClick?: (challenge: Challenge) => void;
  onStarUserClick?: (user: StarUser) => void;
}

export function StorySection({
  challenges,
  starUsers,
  onChallengeClick,
  onStarUserClick
}: StorySectionProps) {
  return (
    <div className="space-y-8 mb-8">
      {/* 本周之星 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">⭐ 本周之星</h3>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {starUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              onClick={() => onStarUserClick?.(user)}
              className="flex-shrink-0 w-36 cursor-pointer"
            >
              <div className="relative mb-3">
                {/* 皇冠标记 */}
                {index === 0 && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-2xl">👑</span>
                  </div>
                )}
                
                <div className={`mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center ${index === 0 ? 'ring-4 ring-yellow-400/50' : ''}`}>
                  <span className="text-3xl">{user.avatar}</span>
                </div>
              </div>
              
              <div className="text-center">
                <h4 className="text-text-primary font-medium text-sm mb-1">
                  {user.nickname}
                </h4>
                <p className="text-text-secondary text-xs mb-1">
                  {user.level}
                </p>
                <span className="inline-block bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {user.badge}
                </span>
                <p className="text-text-secondary text-xs mt-2">
                  🎵 {user.workCount} 作品
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 热门挑战 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">🔥 热门挑战</h3>
          <button className="text-primary text-sm hover:underline">
            查看全部 →
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              onClick={() => onChallengeClick?.(challenge)}
              className="flex-shrink-0 w-44 cursor-pointer"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2">
                <img
                  src={challenge.cover}
                  alt={challenge.title}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/30 to-transparent" />
                
                {challenge.isHot && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-gradient-to-r from-error to-warning text-white text-xs font-bold px-2 py-1 rounded-full">
                      HOT
                    </span>
                  </div>
                )}
                
                {challenge.isNew && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-gradient-to-r from-secondary to-primary text-background text-xs font-bold px-2 py-1 rounded-full">
                      NEW
                    </span>
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-white font-semibold text-sm line-clamp-2">
                    {challenge.title}
                  </h4>
                  <p className="text-white/70 text-xs mt-1">
                    👥 {challenge.participantCount}人参与
                  </p>
                </div>
              </div>
              
              <p className="text-text-secondary text-xs line-clamp-2">
                {challenge.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 官方推荐 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">✨ 官方推荐</h3>
        </div>
        
        <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <span className="text-3xl">🎵</span>
            </div>
            <div className="flex-1">
              <h4 className="text-text-primary font-semibold mb-1">
                每日精选歌单
              </h4>
              <p className="text-text-secondary text-sm">
                为你推荐最适合今天心情的歌曲
              </p>
            </div>
            <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
