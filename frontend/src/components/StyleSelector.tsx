import { MUSIC_STYLES } from '../utils/constants';
import { motion } from 'framer-motion';

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  disabled?: boolean;
}

export function StyleSelector({ selectedStyle, onStyleChange, disabled }: StyleSelectorProps) {
  return (
    <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">选择风格</h3>
      <div className="grid grid-cols-3 gap-3">
        {MUSIC_STYLES.map((style, index) => (
          <motion.button
            key={style.id}
            whileHover={!disabled ? { scale: 1.05, y: -4 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onStyleChange(style.id)}
            disabled={disabled}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              selectedStyle === style.id
                ? 'border-primary bg-primary/20'
                : 'border-surface bg-surface hover:border-primary/40'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="text-2xl">{style.icon}</span>
            <span className="text-sm text-text-secondary font-medium">{style.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
