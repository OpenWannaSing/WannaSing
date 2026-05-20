import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  user: {
    nickname: string;
    avatar: string;
    level: string;
  };
  content: string;
  time: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
}

// Mock 评论数据
export const mockComments: Comment[] = [
  {
    id: 'c1',
    user: {
      nickname: '音乐达人',
      avatar: '🎸',
      level: 'LV.8'
    },
    content: '太好听了！这个高音处理得太棒了！',
    time: '5分钟前',
    likes: 23,
    isLiked: false
  },
  {
    id: 'c2',
    user: {
      nickname: '创作小明',
      avatar: '🎵',
      level: 'LV.6'
    },
    content: '请问这个伴奏是用什么风格生成的？想学习一下',
    time: '15分钟前',
    likes: 8,
    isLiked: true,
    replies: [
      {
        id: 'c2-1',
        user: {
          nickname: '原作者',
          avatar: '🎤',
          level: 'LV.8'
        },
        content: '是用流行风格生成的！你可以试试',
        time: '10分钟前',
        likes: 3,
        isLiked: false
      }
    ]
  },
  {
    id: 'c3',
    user: {
      nickname: '练习生小王',
      avatar: '🎯',
      level: 'LV.3'
    },
    content: '作为初学者，能达到这个水平真的很厉害了，向你学习！',
    time: '1小时前',
    likes: 15,
    isLiked: false
  }
];

export function CommentModal({
  isOpen,
  onClose,
  comments,
  onComment,
  onLikeComment
}: CommentModalProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onComment(newComment);
      setNewComment('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-surface/95 backdrop-blur-xl rounded-t-3xl max-h-[85vh] flex flex-col"
          >
            {/* 顶部拖拽条 */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-surface/50 rounded-full" />
            </div>

            {/* 头部 */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-primary/10">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  💬 评论 ({comments.length})
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-surface/50 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 评论列表 */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">💭</div>
                  <p className="text-text-secondary">
                    还没有评论哦，来说点什么吧！
                  </p>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    {/* 主评论 */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{comment.user.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-text-primary font-medium">
                            {comment.user.nickname}
                          </span>
                          <span className="text-text-secondary text-xs">
                            {comment.user.level}
                          </span>
                          <span className="text-text-secondary text-xs ml-auto">
                            {comment.time}
                          </span>
                        </div>
                        <p className="text-text-primary text-sm mb-2">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => onLikeComment(comment.id)}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${
                              comment.isLiked ? 'text-error' : 'text-text-secondary hover:text-error'
                            }`}
                          >
                            <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                            <span>{comment.likes}</span>
                          </button>
                          <button className="text-text-secondary text-xs hover:text-primary transition-colors">
                            💬 回复
                          </button>
                          <button className="text-text-secondary text-xs hover:text-primary transition-colors">
                            📤 分享
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 回复 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-13 pl-10 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm">{reply.user.avatar}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-text-primary font-medium text-sm">
                                  {reply.user.nickname}
                                </span>
                                <span className="text-text-secondary text-xs">
                                  {reply.user.level}
                                </span>
                                <span className="text-text-secondary text-xs ml-auto">
                                  {reply.time}
                                </span>
                              </div>
                              <p className="text-text-primary text-sm mb-2">
                                {reply.content}
                              </p>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => onLikeComment(reply.id)}
                                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                                    reply.isLiked ? 'text-error' : 'text-text-secondary hover:text-error'
                                  }`}
                                >
                                  <span>{reply.isLiked ? '❤️' : '🤍'}</span>
                                  <span>{reply.likes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* 底部输入框 */}
            <div className="p-4 border-t border-primary/10">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👤</span>
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="说点什么..."
                  className="flex-1 bg-surface border border-primary/20 rounded-full px-4 py-2.5 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!newComment.trim()}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                    newComment.trim()
                      ? 'bg-gradient-to-r from-primary to-secondary text-white glow-primary'
                      : 'bg-surface/50 text-text-secondary cursor-not-allowed'
                  }`}
                >
                  发送
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
