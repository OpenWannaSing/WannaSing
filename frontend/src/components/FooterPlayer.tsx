import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FooterPlayerProps {
  audioUrl?: string;
  title?: string;
  artist?: string;
  cover?: string;
  isPlaying?: boolean;
  playMode?: 'sequential' | 'loop' | 'single' | 'random';
  onPlayToggle?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onEnded?: () => void;
  onTogglePlayMode?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function FooterPlayer({
  audioUrl,
  title = 'WannaSing Track',
  artist = 'AI Generated',
  cover = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100',
  isPlaying: externalPlaying,
  playMode = 'sequential',
  onPlayToggle,
  onPrev,
  onNext,
  onEnded,
  onTogglePlayMode,
  isFavorited,
  onToggleFavorite,
}: FooterPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSeeking, setIsSeeking] = useState(false);
  const [skipNotification, setSkipNotification] = useState('');
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
  }, [isPlaying, audioUrl]);

  const handlePlayToggle = () => {
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    onPlayToggle?.();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
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

  const handleEnded = () => {
    if (playMode !== 'loop' && playMode !== 'single') {
      setIsPlaying(false);
    }
    onEnded?.();
  };

  // Reset error state when audioUrl changes
  useEffect(() => {
    setHasError(false);
    setErrorMsg('');
    setCurrentTime(0);
    setDuration(0);
  }, [audioUrl]);
  
  const handleError = () => {
    // Try to determine the specific error from the audio element
    let msg = '\u97F3\u9891\u52A0\u8F7D\u5931\u8D25';
    if (audioRef.current?.networkState === 3) {
      msg = '\u7F51\u7EDC\u9519\u8BEF\uFF0C\u94FE\u63A5\u53EF\u80FD\u5DF2\u8FC7\u671F';
    } else if (audioRef.current?.error?.code === 4) {
      msg = '\u97F3\u9891\u89E3\u7801\u5931\u8D25\uFF08\u4E0D\u652F\u6301\u7684\u683C\u5F0F\uFF09';
    }
    setErrorMsg(msg);
    setHasError(true);
    setIsPlaying(false);
    console.error('FooterPlayer: \u97F3\u9891\u64AD\u653E\u5931\u8D25', audioUrl, msg);
  
    // Auto-skip to next song after a brief moment
    setSkipNotification(`\u23ED ${title} ${msg}\uFF0C\u81EA\u52A8\u8DF3\u5230\u4E0B\u4E00\u9996`);
    setTimeout(() => {
      setSkipNotification('');
      onNext?.();
    }, 2000);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPlayModeIcon = () => {
    switch (playMode) {
      case 'single':
        return '🔂';
      case 'loop':
        return '🔁';
      case 'random':
        return '🔀';
      default:
        return '➡';
    }
  };

  const getPlayModeLabel = () => {
    switch (playMode) {
      case 'single':
        return '单曲循环';
      case 'loop':
        return '列表循环';
      case 'random':
        return '随机播放';
      default:
        return '顺序播放';
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-primary/20 px-6 py-4 z-50 relative"
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          loop={playMode === 'single'}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
          onLoadStart={() => { setHasError(false); setErrorMsg(''); }}
        />
      )}

      {/* Auto-skip notification toast */}
      {skipNotification && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500/80 to-orange-500/80 text-white text-xs text-center py-1.5 font-medium backdrop-blur-sm">
          {skipNotification}
        </div>
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
          <div className="hidden sm:flex items-center gap-2">
            <div>
              <h4 className="text-text-primary font-medium text-sm truncate max-w-[150px]">
                {title}
              </h4>
              <p className="text-text-secondary text-xs truncate max-w-[150px]">
                {artist}
              </p>
              {hasError && (
                <p className="text-red-400 text-xs mt-1">
                  \u26A0\uFE0F {errorMsg}
                </p>
              )}
            </div>
            {/* Like button */}
            {audioUrl && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleFavorite}
                className={`text-xl transition-colors ${
                  isFavorited ? 'text-red-400' : 'text-text-secondary hover:text-red-400'
                }`}
                title={isFavorited ? '取消喜欢' : '我喜欢'}
              >
                {isFavorited ? '❤️' : '🤍'}
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-2xl">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button
              className="px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5
                text-text-secondary border-primary/20 hover:border-primary/50 hover:text-text-primary"
              title={`播放模式: ${getPlayModeLabel()}，点击切换`}
              onClick={onTogglePlayMode}
            >
              <span className={`${playMode === 'loop' || playMode === 'single' || playMode === 'random' ? 'text-primary' : ''}`}>
                {getPlayModeIcon()}
              </span>
              <span className="text-text-secondary">{getPlayModeLabel()}</span>
            </button>

            <button
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              onClick={onPrev}
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
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              onClick={onNext}
            >
              <span className="text-lg">⏭</span>
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
                onMouseDown={handleSeekStart}
                onMouseUp={handleSeekEnd}
                onTouchStart={handleSeekStart}
                onTouchEnd={handleSeekEnd}
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