import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MusicPlayerProps {
  audioUrl: string;
  title?: string;
  artist?: string;
  onDownload?: () => void;
  onShare?: () => void;
}

export function MusicPlayer({ 
  audioUrl, 
  title = 'WannaSing Track', 
  artist = 'AI Generated', 
  onDownload, 
  onShare 
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Core playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Volume state
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.8);
  
  // Loop state
  const [loopMode, setLoopMode] = useState<'none' | 'one'>('none');
  
  // UI state
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [_isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Handle time update
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDraggingProgress) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(current);
      setDuration(dur);
    }
  }, [isDraggingProgress]);

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Handle ended
  const handleEnded = useCallback(() => {
    if (loopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      setIsPlaying(false);
    }
  }, [loopMode]);

  // Handle progress drag
  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolume);
      if (audioRef.current) {
        audioRef.current.volume = previousVolume;
      }
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
    setIsMuted(!isMuted);
  }, [isMuted, volume, previousVolume]);

  // Toggle loop mode
  const toggleLoop = useCallback(() => {
    setLoopMode(prev => prev === 'none' ? 'one' : 'none');
    if (audioRef.current) {
      audioRef.current.loop = loopMode === 'none';
    }
  }, [loopMode]);

  // Get volume icon
  const getVolumeIcon = useCallback(() => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.3) return '🔈';
    if (volume < 0.7) return '🔉';
    return '🔊';
  }, [isMuted, volume]);

  // Update audio loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loopMode === 'one';
    }
  }, [loopMode]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8"
    >
      {/* Cover Art & Info */}
      <div className="flex items-center gap-6 mb-8">
        {/* Animated Record */}
        <motion.div
          animate={{
            rotate: isPlaying ? 360 : 0,
          }}
          transition={{
            duration: 3,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'loop'
          }}
          style={{
            rotate: isPlaying ? undefined : 0
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl shadow-lg glow-primary"
        >
          <div className="w-6 h-6 bg-background rounded-full" />
        </motion.div>
        
        {/* Track Info */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-text-primary mb-1 text-gradient">
            {title}
          </h3>
          <p className="text-text-secondary text-sm">
            {artist}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-text-secondary text-sm font-mono w-12 text-right">
            {formatTime(currentTime)}
          </span>
          
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              onMouseDown={() => setIsDraggingProgress(true)}
              onMouseUp={() => setIsDraggingProgress(false)}
              onTouchStart={() => setIsDraggingProgress(true)}
              onTouchEnd={() => setIsDraggingProgress(false)}
              className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-primary [&::-webkit-slider-thumb]:to-secondary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
              style={{
                background: `linear-gradient(to right, #6C63FF 0%, #00F2FE ${(currentTime / (duration || 1)) * 100}%, #1E1E1E ${(currentTime / (duration || 1)) * 100}%, #1E1E1E 100%)`
              }}
            />
          </div>
          
          <span className="text-text-secondary text-sm font-mono w-12">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Loop Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLoop}
          className={`p-3 rounded-full transition-all ${
            loopMode === 'one' 
              ? 'bg-gradient-to-r from-primary to-secondary text-white glow-primary' 
              : 'bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          🔁
        </motion.button>

        {/* Play/Pause Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-3xl glow-primary shadow-xl"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isPlaying ? 'pause' : 'play'}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className="p-3 text-2xl"
          >
            {getVolumeIcon()}
          </motion.button>
          
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            onMouseDown={() => setIsDraggingVolume(true)}
            onMouseUp={() => setIsDraggingVolume(false)}
            className="w-24 h-2 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform"
            style={{
              background: `linear-gradient(to right, #6C63FF 0%, #6C63FF ${(isMuted ? 0 : volume) * 100}%, #1E1E1E ${(isMuted ? 0 : volume) * 100}%, #1E1E1E 100%)`
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {(onDownload || onShare) && (
        <div className="flex gap-3">
          {onDownload && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDownload}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold py-3 px-6 rounded-full hover:opacity-90 transition-all"
            >
              📥 下载
            </motion.button>
          )}
          
          {onShare && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShare}
              className="flex-1 bg-surface border border-primary/30 text-text-primary font-semibold py-3 px-6 rounded-full hover:border-primary/60 transition-all"
            >
              📤 分享
            </motion.button>
          )}
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
      />
    </motion.div>
  );
}
