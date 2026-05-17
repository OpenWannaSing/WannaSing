import { motion } from 'framer-motion';
import { SUGGESTED_DURATION } from '../utils/constants';

interface RecordButtonProps {
  isRecording: boolean;
  duration: number;
  onClick: () => void;
}

export function RecordButton({ isRecording, duration, onClick }: RecordButtonProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    }
    return `${secs}.${ms}s`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative w-32 h-32 rounded-full flex items-center justify-center text-4xl transition-all ${
          isRecording
            ? 'bg-gradient-to-r from-error to-warning animate-pulse-glow'
            : 'bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 glow-primary'
        }`}
      >
        <span className="text-4xl">{isRecording ? '⏹️' : '🎤'}</span>
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-error/30 animate-ping" />
        )}
      </motion.button>
      
      {isRecording ? (
        <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 px-6 py-2 rounded-full">
          <span className="text-2xl font-bold text-primary font-mono">{formatDuration(duration)}</span>
        </div>
      ) : (
        <p className="text-text-secondary">建议哼唱 {SUGGESTED_DURATION} 秒</p>
      )}
    </div>
  );
}
