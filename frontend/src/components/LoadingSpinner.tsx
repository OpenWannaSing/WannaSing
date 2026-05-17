import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LOADING_MESSAGES } from '../utils/constants';

export function LoadingSpinner() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full"
        />
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 border-4 border-secondary/20 border-b-secondary rounded-full"
          style={{ animationDelay: '0.2s' }}
        />
      </div>
      <motion.p
        key={currentMessageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-text-secondary text-lg font-medium"
      >
        {LOADING_MESSAGES[currentMessageIndex]}
      </motion.p>
    </div>
  );
}
