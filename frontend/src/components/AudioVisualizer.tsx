import { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

export function AudioVisualizer({ isRecording }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!canvas || !analyser || !dataArray) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / 64;
    let x = 0;

    for (let i = 0; i < 64; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.8;
      const gradient = ctx.createLinearGradient(x, height - barHeight, x, height);
      gradient.addColorStop(0, '#6C63FF');
      gradient.addColorStop(1, '#00F2FE');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, 4);
      ctx.fill();

      x += barWidth;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (isRecording) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;

          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 128;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          dataArrayRef.current = dataArray;

          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          draw();
        } catch (err) {
          console.error('Failed to initialize audio visualizer:', err);
        }
      };

      initAudio();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording, draw]);

  return (
    <div className="relative bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        className="w-full"
      />
      {!isRecording && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl mb-2">🎤</span>
          <span className="text-text-secondary text-sm">点击开始录音</span>
        </div>
      )}
    </div>
  );
}
