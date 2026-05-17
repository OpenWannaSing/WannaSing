import { motion } from 'framer-motion';

interface AnalysisResult {
  task_id: string;
  status: string;
  song_info: {
    filename: string;
    duration: number;
  };
  analysis: any;
  difficulty: any;
  tips: string[];
}

interface AnalysisReportProps {
  result: AnalysisResult;
  onBack: () => void;
}

export function AnalysisReport({ result, onBack }: AnalysisReportProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-text-primary';
    }
  };

  const getRhythmTypeLabel = (type: string) => {
    switch (type) {
      case 'slow_ballad': return '抒情慢歌';
      case 'medium': return '中速歌曲';
      case 'fast': return '快节奏';
      default: return type;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient">分析报告</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-surface rounded-xl border border-primary/30 text-text-secondary hover:bg-surface/80 transition-colors"
        >
          返回
        </button>
      </div>

      <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-text-primary mb-4">{result.song_info.filename}</h3>
        <p className="text-text-secondary">
          时长: {Math.round(result.song_info.duration)}秒
        </p>
      </div>

      <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <span>⭐</span> 难度评分
        </h3>
        <div className="text-center">
          <div className="text-6xl font-bold text-gradient mb-2">
            {result.difficulty?.total || 5}
          </div>
          <div className={`text-2xl font-semibold ${getDifficultyColor(result.difficulty?.level || 'beginner')}`}>
            {result.difficulty?.level_name || '中级'}
          </div>
          <div className="flex justify-center gap-4 mt-4 text-sm text-text-secondary">
            <div>音域: {result.difficulty?.breakdown?.vocal_range || 5}/10</div>
            <div>高音: {result.difficulty?.breakdown?.highest_note || 5}/10</div>
            <div>节奏: {result.difficulty?.breakdown?.tempo || 5}/10</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span>🎵</span> 音域分析
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">最低音</span>
              <span className="font-semibold text-primary">{result.analysis?.pitch?.lowest_note_name || 'C4'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">最高音</span>
              <span className="font-semibold text-secondary">{result.analysis?.pitch?.highest_note_name || 'G4'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">音域宽度</span>
              <span className="font-semibold text-text-primary">{result.analysis?.pitch?.vocal_range || 12} 半音</span>
            </div>
          </div>
        </div>

        <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span>🥁</span> 节奏分析
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">BPM</span>
              <span className="font-semibold text-primary">{Math.round(result.analysis?.rhythm?.bpm || 120)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">节奏类型</span>
              <span className="font-semibold text-secondary">{getRhythmTypeLabel(result.analysis?.rhythm?.rhythm_type || 'medium')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">切分程度</span>
              <span className="font-semibold text-text-primary">{(result.analysis?.rhythm?.syncopation_score || 0.5).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {result.tips && result.tips.length > 0 && (
        <div className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span>💡</span> 演唱提示
          </h3>
          <ul className="space-y-2">
            {result.tips.map((tip, index) => (
              <li key={index} className="text-text-secondary pl-4 border-l-2 border-primary/50">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
