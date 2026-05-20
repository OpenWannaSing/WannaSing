import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FooterPlayer } from './components/FooterPlayer';
import { AudioVisualizer } from './components/AudioVisualizer';
import { useRecorder } from './hooks/useRecorder';
import { FeedCard } from './components/FeedCard';
import type { FeedItem } from './components/FeedCard';
import { StorySection } from './components/StorySection';
import type { Challenge } from './components/StorySection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { CommentModal, mockComments } from './components/CommentModal';
import { FootprintPage } from './components/FootprintPage';
import { ChallengeDetail } from './components/ChallengeDetail';
import { RecommendMenu, type RecommendType } from './components/RecommendMenu';

type Page = 'plaza' | 'create' | 'analyse' | 'footprint';

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  isNew?: boolean;
  isTop?: number;
}

// Mock 歌曲数据 - 已移至 FooterPlayer
// const mockSongs: Song[] = [ ... ];

interface StarUser {
  id: string;
  nickname: string;
  avatar: string;
  level: string;
  badge: string;
  workCount: number;
}

// Mock 歌曲数据 - 已移至 FooterPlayer
// const mockSongs: Song[] = [ ... ];

// Mock Feed 数据
const mockFeeds: FeedItem[] = [
  {
    feed_id: 'feed-1',
    type: 'performance',
    user: {
      id: 'user-1',
      nickname: '音乐达人',
      avatar: '🎸',
      level: 'LV.8',
      badge: '实力唱将'
    },
    content: {
      song_name: '十年',
      artist: '陈奕迅',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 245,
      score: 88,
      tags: ['流行', '经典'],
      description: '终于把这个高音拿下了！'
    },
    metrics: { likes: 234, comments: 45, shares: 12, plays: 1234 },
    actions: { is_liked: false, is_saved: false },
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    source: 'normal'
  },
  {
    feed_id: 'feed-2',
    type: 'creation',
    user: {
      id: 'user-2',
      nickname: '创作者小明',
      avatar: '🎵',
      level: 'LV.6',
      badge: '创作达人'
    },
    content: {
      song_name: '夏日海滩',
      audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: 180,
      style: '流行',
      bpm: 120,
      tags: ['夏日', '轻松'],
      description: '创作了一首轻松的夏日曲目~'
    },
    metrics: { likes: 89, comments: 12, shares: 8, plays: 456 },
    actions: { is_liked: false, is_saved: false },
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    source: 'normal'
  }
];

// Mock 挑战数据
const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    title: '#高音挑战',
    description: '挑战你的最高音！',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
    participantCount: 1234,
    isHot: true
  },
  {
    id: 'challenge-2',
    title: '#经典翻唱',
    description: '翻唱一首经典老歌',
    cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300',
    participantCount: 856,
    isNew: true
  },
  {
    id: 'challenge-3',
    title: '#原创作品',
    description: '展示你的原创音乐',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
    participantCount: 567
  }
];

// Mock 本周之星数据
const mockStarUsers: StarUser[] = [
  {
    id: 'star-1',
    nickname: '音乐达人',
    avatar: '🎸',
    level: 'LV.8',
    badge: '实力唱将',
    workCount: 156
  },
  {
    id: 'star-2',
    nickname: '创作小明',
    avatar: '🎵',
    level: 'LV.6',
    badge: '创作达人',
    workCount: 89
  },
  {
    id: 'star-3',
    nickname: '练习生小王',
    avatar: '🎤',
    level: 'LV.3',
    badge: '努力练习中',
    workCount: 45
  },
  {
    id: 'star-4',
    nickname: '夜空中最亮的星',
    avatar: '✨',
    level: 'LV.5',
    badge: '新星崛起',
    workCount: 32
  }
];

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('plaza');
  const [feedMode, setFeedMode] = useState<'recommend' | 'following'>('recommend');
  const [recommendType, setRecommendType] = useState<RecommendType>('hot');
  const [currentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [viewingChallenge, setViewingChallenge] = useState<Challenge | null>(null);

  const { isRecording, startRecording, stopRecording } = useRecorder();

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFeedPlay = (url: string) => {
    console.log('Playing feed audio:', url);
  };

  const handleFeedLike = (feedId: string) => {
    console.log('Liked feed:', feedId);
  };

  const handleFeedComment = (_feedId: string) => {
    setCommentModalOpen(true);
  };

  const handleFeedSingAlong = (feed: FeedItem) => {
    console.log('Sing along with:', feed);
    setCurrentPage('create');
  };

  const handleFeedSave = (feedId: string) => {
    console.log('Saved feed:', feedId);
  };

  const handleChallengeClick = (challenge: Challenge) => {
    setViewingChallenge(challenge);
  };

  const handleStarUserClick = (user: StarUser) => {
    console.log('Star user clicked:', user);
  };

  const handleCommentSubmit = (content: string) => {
    console.log('Comment submitted:', content);
    setCommentModalOpen(false);
  };

  const handleLikeComment = (commentId: string) => {
    console.log('Comment liked:', commentId);
  };

  const navItems = [
    { id: 'plaza', label: '音乐广场', icon: '🎵' },
    { id: 'footprint', label: '我的足迹', icon: '📜' },
    { id: 'create', label: '创作中心', icon: '🎤' },
    { id: 'analyse', label: '音乐解析', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* 左侧导航栏 */}
      <aside className="w-64 bg-surface/50 backdrop-blur-xl border-r border-primary/10 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🎵</span>
          </div>
          <div>
            <h1 className="text-text-primary font-bold text-lg">WannaSing</h1>
            <p className="text-text-secondary text-xs">Suno AI</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage(item.id as Page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentPage === item.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="bg-surface/80 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">
                User
              </p>
              <p className="text-text-secondary text-xs truncate">
                登录账户
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto pb-28">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索歌曲或用户"
                  className="w-80 bg-surface border border-primary/20 rounded-full px-5 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  🔍
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-xl">
                🔔
              </button>
              <button className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-semibold hover:opacity-90 transition-all glow-primary">
                + 发布
              </button>
            </div>
          </div>
        </header>

        <div className="px-8 py-6">
          <AnimatePresence mode="wait">
            {/* 广场页面 */}
            {currentPage === 'plaza' && !viewingChallenge && (
              <motion.div
                key="plaza"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* 推荐菜单 */}
                <RecommendMenu
                  currentType={recommendType}
                  onChange={setRecommendType}
                />

                {/* 故事/挑战区 */}
                <StorySection
                  challenges={mockChallenges}
                  starUsers={mockStarUsers}
                  onChallengeClick={handleChallengeClick}
                  onStarUserClick={handleStarUserClick}
                />

                {/* Feed 流 */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">📝 动态</h3>
                  {mockFeeds.map((feed) => (
                    <FeedCard
                      key={feed.feed_id}
                      feed={feed}
                      onPlay={handleFeedPlay}
                      onLike={handleFeedLike}
                      onComment={handleFeedComment}
                      onSingAlong={handleFeedSingAlong}
                      onSave={handleFeedSave}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* 挑战详情页 */}
            {currentPage === 'plaza' && viewingChallenge && (
              <motion.div
                key="challenge-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ChallengeDetail
                  challenge={{
                    ...viewingChallenge,
                    endDate: '2025-02-28',
                    prize: '🎁 精美周边'
                  }}
                  feeds={mockFeeds}
                  onBack={() => setViewingChallenge(null)}
                  onJoinChallenge={() => setCurrentPage('create')}
                />
              </motion.div>
            )}

            {/* 足迹页面 */}
            {currentPage === 'footprint' && (
              <motion.div
                key="footprint"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <FootprintPage />
              </motion.div>
            )}

            {/* 创作中心页面 */}
            {currentPage === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-primary/20">
                  <h2 className="text-3xl font-bold text-text-primary text-center mb-8">
                    哼唱创作
                  </h2>
                  
                  <div className="mb-8">
                    <AudioVisualizer isRecording={isRecording} />
                  </div>

                  <div className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl transition-all ${
                        isRecording
                          ? 'bg-error glow-secondary'
                          : 'bg-gradient-to-r from-primary to-secondary glow-primary'
                      }`}
                    >
                      {isRecording ? '⏹' : '🎤'}
                    </motion.button>
                  </div>

                  {isRecording && (
                    <p className="text-center text-error mt-4 font-medium animate-pulse">
                      正在录音...
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 音乐解析页面 */}
            {currentPage === 'analyse' && (
              <motion.div
                key="analyse"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 border border-primary/20 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    音乐解析
                  </h2>
                  <p className="text-text-secondary mb-6">
                    上传音乐文件，分析音域、节奏和难度
                  </p>
                  
                  <div className="border-2 border-dashed border-primary/30 rounded-2xl p-12 hover:border-primary/60 transition-colors cursor-pointer">
                    <div className="text-4xl mb-3">📁</div>
                    <p className="text-text-primary font-medium">
                      点击或拖拽上传音乐
                    </p>
                    <p className="text-text-secondary text-sm mt-2">
                      支持 MP3, WAV 格式
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 悬浮创作按钮 - 只在广场显示 */}
      {currentPage === 'plaza' && !viewingChallenge && (
        <FloatingActionButton
          onPublishPerformance={() => setCurrentPage('create')}
          onPublishCreation={() => setCurrentPage('create')}
          onPublishPractice={() => setCurrentPage('create')}
        />
      )}

      {/* 底部播放器 */}
      {currentSong && (
        <FooterPlayer
          audioUrl={currentSong.audioUrl}
          title={currentSong.title}
          artist={currentSong.artist}
          cover={currentSong.cover}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
        />
      )}

      {/* 评论弹窗 */}
      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        comments={mockComments}
        onComment={handleCommentSubmit}
        onLikeComment={handleLikeComment}
      />
    </div>
  );
}

export default App;
