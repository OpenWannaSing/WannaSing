import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FooterPlayerProps {
  audioUrl?: string;
  title?: string;
  artist?: string;
  cover?: string;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
}

export function FooterPlayer({
  audioUrl,
  title = 'WannaSing Track',
  artist = 'AI Generated',
  cover = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100',
  isPlaying: externalPlaying,
  onPlayToggle
}: FooterPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (externalPlaying !== undefined) {
      setIsPlaying(externalPlaying);
    }
  }, [externalPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayToggle = () => {
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    onPlayToggle?.();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (vol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-primary/20 px-6 py-4 z-50"
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          loop={isLooping}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-[200px]">
          <motion.div
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
          >
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="hidden sm:block">
            <h4 className="text-text-primary font-medium text-sm truncate max-w-[150px]">
              {title}
            </h4>
            <p className="text-text-secondary text-xs truncate max-w-[150px]">
              {artist}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => setIsLooping(!isLooping)}
            >
              <span className={`text-lg ${isLooping ? 'text-primary' : ''}`}>
                🔁
              </span>
            </button>

            <button
              className="p-2 text-text-secondary hover:text-text-primary transition-colors hidden sm:block"
            >
              <span className="text-lg">⏮</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayToggle}
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white glow-primary"
            >
              <span className="text-xl">
                {isPlaying ? '⏸' : '▶'}
              </span>
            </motion.button>

            <button
              className="p-2 text-text-secondary hover:text-text-primary transition-colors hidden sm:block"
            >
              <span className="text-lg">⏭</span>
            </button>

            <button
              className="p-2 text-text-secondary hover:text-text-primary transition-colors hidden sm:block"
            >
              <span className="text-lg">🔀</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-text-secondary text-xs w-10 text-right hidden sm:block">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                style={{
                  background: `linear-gradient(to right, #6C63FF ${(currentTime / (duration || 1)) * 100}%, #1E1E1E ${(currentTime / (duration || 1)) * 100}%)`
                }}
              />
            </div>
            <span className="text-text-secondary text-xs w-10 hidden sm:block">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-[120px] justify-end hidden md:flex">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (audioRef.current) {
                audioRef.current.muted = !isMuted;
              }
            }}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className="text-lg">{isMuted || volume === 0 ? '🔇' : '🔊'}</span>
          </button>
          <div className="w-24 relative">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
              style={{
                background: `linear-gradient(to right, #6C63FF ${(isMuted ? 0 : volume) * 100}%, #1E1E1E ${(isMuted ? 0 : volume) * 100}%)`
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
