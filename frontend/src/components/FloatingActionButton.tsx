import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  onPublishPerformance?: () => void;
  onPublishCreation?: () => void;
  onPublishPractice?: () => void;
}

export function FloatingActionButton({
  onPublishPerformance,
  onPublishCreation,
  onPublishPractice
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'performance',
      label: '发布演唱',
      icon: '🎤',
      onClick: onPublishPerformance
    },
    {
      id: 'creation',
      label: '发布AI创作',
      icon: '✨',
      onClick: onPublishCreation
    },
    {
      id: 'practice',
      label: '发布练习',
      icon: '🎯',
      onClick: onPublishPractice
    }
  ];

  return (
    <div className="fixed bottom-28 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0"
            />
            
            <div className="absolute bottom-16 right-0 flex flex-col gap-3">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 50, scale: 0 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0 }}
                  transition={{ delay: (menuItems.length - 1 - index) * 0.08 }}
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 bg-surface/95 backdrop-blur-xl border border-primary/30 text-text-primary px-4 py-2.5 rounded-xl shadow-lg"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: isOpen ? 45 : 0 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl shadow-2xl glow-primary"
      >
        {isOpen ? '✕' : '+'}
      </motion.button>
    </div>
  );
}
