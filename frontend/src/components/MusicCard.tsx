import { motion } from 'framer-motion';

interface MusicCardProps {
  title: string;
  artist: string;
  cover: string;
  isNew?: boolean;
  isTop?: number;
  onClick?: () => void;
}

export function MusicCard({ title, artist, cover, isNew, isTop, onClick }: MusicCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-surface/80 backdrop-blur-xl rounded-2xl overflow-hidden cursor-pointer group"
    >
      <div className="relative aspect-square">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="absolute bottom-3 right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all glow-primary"
        >
          <span className="text-white text-xl">▶</span>
        </motion.div>

        {isTop && (
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-2 py-1 rounded-full">
              TOP {isTop}
            </span>
          </div>
        )}

        {isNew && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-secondary text-background text-xs font-bold px-2 py-1 rounded-full">
              NEW
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-text-primary font-semibold text-sm truncate">
          {title}
        </h3>
        <p className="text-text-secondary text-xs mt-1">
          {artist}
        </p>
      </div>
    </motion.div>
  );
}
