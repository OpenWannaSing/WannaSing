import { useState } from 'react';
import { motion } from 'framer-motion';

interface SongUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function SongUploader({ onUpload, isLoading }: SongUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-8"
    >
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragging ? 'border-primary bg-primary/10' : 'border-surface'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-6xl mb-4">🎼</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          上传歌曲文件
        </h3>
        <p className="text-text-secondary mb-6">
          支持 MP3, WAV 格式，文件大小不超过 20MB
        </p>

        <label className="inline-block cursor-pointer">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
          />
          <div className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-full hover:opacity-90 transition-all">
            {isLoading ? '分析中...' : '选择文件'}
          </div>
        </label>
      </div>

      <div className="mt-6 text-center text-text-secondary text-sm">
        <p>点击上方按钮，或拖拽文件到此处</p>
      </div>
    </motion.div>
  );
}
