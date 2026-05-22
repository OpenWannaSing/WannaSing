import { motion } from 'framer-motion';

export type RecommendType = 'recommend' | 'hot' | 'new' | 'following' | 'similar' | 'challenge';

interface RecommendMenuProps {
  currentType: RecommendType;
  onChange: (type: RecommendType) => void;
}

interface RecommendOption {
  id: RecommendType;
  label: string;
  icon: string;
  description: string;
}

const recommendOptions: RecommendOption[] = [
  {
    id: 'recommend',
    label: '🎵 推荐',
    icon: '🎵',
    description: '为你精选的音乐'
  },
  {
    id: 'hot',
    label: '🔥 热门推荐',
    icon: '🔥',
    description: '最受欢迎的作品'
  },
  {
    id: 'new',
    label: '✨ 新歌速递',
    icon: '✨',
    description: '最新发布的作品'
  },
  {
    id: 'following',
    label: '👥 关注动态',
    icon: '👥',
    description: '关注用户的更新'
  },
  {
    id: 'similar',
    label: '🎯 猜你喜欢',
    icon: '🎯',
    description: '基于兴趣推荐'
  },
  {
    id: 'challenge',
    label: '🏆 挑战专区',
    icon: '🏆',
    description: '热门挑战活动'
  }
];

export function RecommendMenu({ currentType, onChange }: RecommendMenuProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-text-primary mb-4">📋 推荐菜单</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendOptions.map((option) => (
          <motion.button
            key={option.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.id)}
            className={`p-4 rounded-2xl border transition-all text-left ${
              currentType === option.id
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-surface/50 border-primary/10 text-text-secondary hover:bg-surface/80'
            }`}
          >
            <div className="text-2xl mb-2">{option.icon}</div>
            <div className="font-medium text-sm mb-1">{option.label}</div>
            <div className="text-xs opacity-70">{option.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
