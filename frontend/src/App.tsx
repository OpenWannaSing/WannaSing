import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecorder } from './hooks/useRecorder';
import { AudioVisualizer } from './components/AudioVisualizer';
import { StyleSelector } from './components/StyleSelector';
import { RecordButton } from './components/RecordButton';
import { ResultPlayer } from './components/ResultPlayer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HistoryList, getHistory, saveToHistory } from './components/HistoryList';
import { SongUploader } from './components/SongUploader';
import { AnalysisReport } from './components/AnalysisReport';
import { generateAccompaniment, analyzeSong } from './utils/api';

type AppState = 'initial' | 'recording' | 'recorded' | 'generating' | 'completed';
type Page = 'hum' | 'analyze';

interface HistoryItem {
  id: string;
  audioUrl: string;
  style: string;
  timestamp: number;
}

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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('hum');

  const [appState, setAppState] = useState<AppState>('initial');
  const [selectedStyle, setSelectedStyle] = useState('pop');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [analysisState, setAnalysisState] = useState<'initial' | 'analyzing' | 'completed'>('initial');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const {
    isRecording,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    error: recorderError,
  } = useRecorder();

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (recorderError) {
      setError(recorderError);
    }
  }, [recorderError]);

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      setAppState('recorded');
    } else {
      resetRecording();
      setError(null);
      setGeneratedAudioUrl('');
      await startRecording();
      setAppState('recording');
    }
  }, [isRecording, stopRecording, resetRecording, startRecording]);

  const handleGenerate = useCallback(async () => {
    if (!audioBlob) return;
    
    setError(null);
    setAppState('generating');
    
    try {
      const response = await generateAccompaniment(audioBlob, selectedStyle);
      if (response.success && response.audio_url) {
        setGeneratedAudioUrl(response.audio_url);
        saveToHistory({ audioUrl: response.audio_url, style: selectedStyle });
        setHistory(getHistory());
        setAppState('completed');
      } else {
        throw new Error('生成失败');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError('生成失败，请稍后重试');
      setAppState('recorded');
    }
  }, [audioBlob, selectedStyle]);

  const handleDownload = useCallback(async () => {
    if (!generatedAudioUrl) return;
    
    try {
      const response = await fetch(generatedAudioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wanasing_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('下载失败，请稍后重试');
    }
  }, [generatedAudioUrl]);

  const handleShare = useCallback(() => {
    if (!generatedAudioUrl) return;
    
    if (navigator.share) {
      navigator.share({
        title: '哼唱成曲 - 我的创作',
        text: '我用哼唱成曲创作了一首音乐，快来听听！',
        url: generatedAudioUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(generatedAudioUrl).then(() => {
        alert('链接已复制到剪贴板');
      }).catch(() => {
        alert(`链接：${generatedAudioUrl}`);
      });
    }
  }, [generatedAudioUrl]);

  const handleHistoryPlay = useCallback((url: string) => {
    setGeneratedAudioUrl(url);
    setAppState('completed');
  }, []);

  const handleRetry = useCallback(() => {
    resetRecording();
    setError(null);
    setAppState('initial');
  }, [resetRecording]);

  const handleSongUpload = useCallback(async (file: File) => {
    setAnalysisError(null);
    setAnalysisState('analyzing');
    
    try {
      const result = await analyzeSong(file);
      setAnalysisResult(result);
      setAnalysisState('completed');
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisError('分析失败，请稍后重试');
      setAnalysisState('initial');
    }
  }, []);

  const handleResetAnalysis = useCallback(() => {
    setAnalysisState('initial');
    setAnalysisResult(null);
    setAnalysisError(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">🎵 WanaSing</h1>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPage('hum')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                currentPage === 'hum'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-surface/80'
              }`}
            >
              哼唱成曲
            </button>
            <button
              onClick={() => setCurrentPage('analyze')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                currentPage === 'analyze'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-surface/80'
              }`}
            >
              歌曲分析
            </button>
          </div>
        </motion.header>

        <main className="space-y-6">
          <AnimatePresence mode="wait">
            {currentPage === 'hum' ? (
              <motion.div
                key="hum"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-error/10 border border-error/30 rounded-2xl p-4 flex items-center gap-3"
                    >
                      <span className="text-2xl">❌</span>
                      <span className="text-text-primary flex-1">{error}</span>
                      <button
                        onClick={handleRetry}
                        className="bg-surface text-text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-surface/80 transition-colors"
                      >
                        重试
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AudioVisualizer isRecording={isRecording} />
                <RecordButton
                  isRecording={isRecording}
                  duration={duration}
                  onClick={handleRecordClick}
                />

                <AnimatePresence mode="wait">
                  {appState === 'initial' && (
                    <motion.div
                      key="initial"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <StyleSelector
                        selectedStyle={selectedStyle}
                        onStyleChange={setSelectedStyle}
                      />
                    </motion.div>
                  )}

                  {appState === 'recorded' && (
                    <motion.div
                      key="recorded"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <StyleSelector
                        selectedStyle={selectedStyle}
                        onStyleChange={setSelectedStyle}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerate}
                        className="w-full bg-gradient-to-r from-secondary to-secondary/80 text-background font-bold py-4 rounded-2xl glow-secondary hover:opacity-90 transition-all"
                      >
                        🎹 生成伴奏
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRetry}
                        className="w-full bg-surface text-text-secondary font-semibold py-3 rounded-2xl border border-surface hover:border-primary/30 transition-all"
                      >
                        🔄 重新录制
                      </motion.button>
                    </motion.div>
                  )}

                  {appState === 'generating' && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <LoadingSpinner />
                    </motion.div>
                  )}

                  {appState === 'completed' && generatedAudioUrl && (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <ResultPlayer
                        audioUrl={generatedAudioUrl}
                        onDownload={handleDownload}
                        onShare={handleShare}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRetry}
                        className="w-full bg-surface/80 backdrop-blur-xl border border-primary/30 text-primary font-semibold py-4 rounded-2xl hover:border-primary/60 transition-all"
                      >
                        🎤 创作新曲
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <HistoryList history={history} onPlay={handleHistoryPlay} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <AnimatePresence>
                  {analysisError && (
                    <motion.div
                      key="analysis-error"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-error/10 border border-error/30 rounded-2xl p-4 flex items-center gap-3"
                    >
                      <span className="text-2xl">❌</span>
                      <span className="text-text-primary flex-1">{analysisError}</span>
                      <button
                        onClick={handleResetAnalysis}
                        className="bg-surface text-text-primary px-4 py-2 rounded-full text-sm font-medium hover:bg-surface/80 transition-colors"
                      >
                        重试
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {analysisState === 'initial' && (
                  <SongUploader
                    onUpload={handleSongUpload}
                    isLoading={false}
                  />
                )}

                {analysisState === 'analyzing' && (
                  <LoadingSpinner />
                )}

                {analysisState === 'completed' && analysisResult && (
                  <AnalysisReport
                    result={analysisResult}
                    onBack={handleResetAnalysis}
                  />
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 text-center"
                >
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    全方位歌曲分析
                  </h3>
                  <p className="text-text-secondary text-sm">
                    音域识别 · 节奏分析 · 难度评分 · 演唱建议
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-text-secondary text-sm"
        >
          <p>🎶 让音乐创作变得简单</p>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;
