import { useState } from 'react';
import { motion } from 'framer-motion';

interface FootprintItem {
  id: string;
  type: 'listen' | 'view' | 'like' | 'comment' | 'save' | 'create' | 'challenge';
  title: string;
  subtitle?: string;
  time: string;
  cover?: string;
  score?: number;
}

// Mock 足迹数据
const mockFootprints: FootprintItem[] = [
  {
    id: 'fp-1',
    type: 'create',
    title: '发布了作品《夜空中最亮的星》',
    subtitle: '评分: 88分',
    time: '2分钟前',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100',
    score: 88
  },
  {
    id: 'fp-2',
    type: 'listen',
    title: '听了《十年》',
    subtitle: '歌手: 陈奕迅',
    time: '15分钟前',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'
  },
  {
    id: 'fp-3',
    type: 'like',
    title: '赞了音乐达人的作品',
    subtitle: '《夏日海滩》',
    time: '1小时前',
    cover: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=100'
  },
  {
    id: 'fp-4',
    type: 'challenge',
    title: '参与了#高音挑战',
    subtitle: '获得鼓励奖',
    time: '3小时前',
    cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100'
  },
  {
    id: 'fp-5',
    type: 'comment',
    title: '评论了创作者小明的作品',
    subtitle: '"太好听了！"',
    time: '5小时前',
    cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100'
  },
  {
    id: 'fp-6',
    type: 'save',
    title: '收藏了《听雨成河》',
    subtitle: '作为学习参考',
    time: '昨天',
    cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100'
  },
  {
    id: 'fp-7',
    type: 'view',
    title: '看了练习生小王的练习',
    subtitle: '气息练习片段',
    time: '昨天',
    cover: 'https://images.unsplash.com/photo-1533158326339-d728f31a74d8?w=100'
  }
];

const tabs = [
  { id: 'all', label: '全部', icon: '📋' },
  { id: 'listen', label: '听过', icon: '🎧' },
  { id: 'interact', label: '互动', icon: '💬' },
  { id: 'create', label: '创作', icon: '🎵' }
];

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    listen: '🎧',
    view: '👀',
    like: '❤️',
    comment: '💬',
    save: '⭐',
    create: '🎵',
    challenge: '🏆'
  };
  return icons[type] || '📋';
};

const getTypeBg = (type: string) => {
  const bgs: Record<string, string> = {
    listen: 'bg-secondary/20',
    view: 'bg-surface/80',
    like: 'bg-error/20',
    comment: 'bg-primary/20',
    save: 'bg-warning/20',
    create: 'bg-primary/30',
    challenge: 'bg-gradient-to-r from-primary to-secondary'
  };
  return bgs[type] || 'bg-surface/80';
};

export function FootprintPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredFootprints = activeTab === 'all'
    ? mockFootprints
    : mockFootprints.filter(item => {
        if (activeTab === 'listen') return ['listen', 'view'].includes(item.type);
        if (activeTab === 'interact') return ['like', 'comment', 'save'].includes(item.type);
        if (activeTab === 'create') return ['create', 'challenge'].includes(item.type);
        return true;
      });

  return (
    <div className="pb-24">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          📜 我的足迹
        </h2>
        <p className="text-text-secondary">
          记录你在WannaSing的每一步
        </p>
      </motion.div>

      {/* 统计卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: '创作作品', value: '12', icon: '🎵', color: 'primary' },
          { label: '听过歌曲', value: '156', icon: '🎧', color: 'secondary' },
          { label: '互动次数', value: '89', icon: '💬', color: 'warning' },
          { label: '连续打卡', value: '7天', icon: '🔥', color: 'error' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-5 text-center"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-text-primary mb-1">
              {stat.value}
            </div>
            <div className="text-text-secondary text-sm">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tab 切换 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-surface/80 text-text-secondary hover:bg-surface'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* 足迹列表 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        {filteredFootprints.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ x: 4 }}
            className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-5 flex items-center gap-4"
          >
            {/* 图标 */}
            <div className={`${getTypeBg(item.type)} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className="text-xl">{getTypeIcon(item.type)}</span>
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-text-primary font-medium mb-1">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-text-secondary text-sm">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <span className="text-text-secondary text-xs whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            </div>

            {/* 封面 */}
            {item.cover && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.cover}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </motion.div>
        ))}

        {filteredFootprints.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-5xl mb-4">📭</div>
            <p className="text-text-secondary">
              这里还没有足迹记录哦
            </p>
            <p className="text-text-secondary text-sm mt-2">
              开始探索音乐广场吧！
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* 清空按钮 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <button className="text-text-secondary hover:text-error transition-colors text-sm">
          🗑️ 清空历史记录
        </button>
      </motion.div>
    </div>
  );
}
