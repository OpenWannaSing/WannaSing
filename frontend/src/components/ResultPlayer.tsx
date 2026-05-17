import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ResultPlayerProps {
  audioUrl: string;
  onDownload: () => void;
  onShare: () => void;
}

export function ResultPlayer({ audioUrl, onDownload, onShare }: ResultPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 30;
      setCurrentTime(current);
      setDuration(dur);
      setProgress((current / dur) * 100);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6"
    >
      <h3 className="text-xl font-bold text-text-primary mb-6 text-center text-gradient">🎵 生成成功！</h3>
      
      <div className="flex items-center gap-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-2xl glow-primary"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </motion.button>
        
        <div className="flex-1 flex flex-col gap-2">
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-text-secondary text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />
      
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDownload}
          className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold py-3 px-6 rounded-full hover:opacity-90 transition-all"
        >
          📥 下载
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShare}
          className="flex-1 bg-surface border border-primary/30 text-text-primary font-semibold py-3 px-6 rounded-full hover:border-primary/60 transition-all"
        >
          📤 分享
        </motion.button>
      </div>
    </motion.div>
  );
}
