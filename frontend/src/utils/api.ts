import axios from 'axios';

export interface GenerateResponse {
  success: boolean;
  audio_url: string;
  duration: number;
}

export interface AnalysisResult {
  task_id: string;
  status: string;
  song_info: {
    filename: string;
    duration: number;
  };
  analysis: {
    pitch: {
      lowest_note: number;
      lowest_note_name: string;
      highest_note: number;
      highest_note_name: string;
      vocal_range: number;
      mean_pitch: number;
      pitch_variation: number;
      max_jump: number;
      pitch_sequence: number[];
    };
    rhythm: {
      bpm: number;
      beat_count: number;
      duration_seconds: number;
      syncopation_score: number;
      rhythm_type: string;
      difficulty_factor: number;
    };
    structure: {
      segments: any[];
      segment_count: number;
      intro_duration: number;
      outro_duration: number;
    };
  };
  difficulty: {
    total: number;
    level: string;
    level_name: string;
    breakdown: {
      vocal_range: number;
      highest_note: number;
      tempo: number;
    };
  };
  tips: string[];
}

export async function generateAccompaniment(
  audioBlob: Blob,
  style: string
): Promise<GenerateResponse> {
  const base64Audio = await blobToBase64(audioBlob);
  
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/generate`,
    {
      audio: base64Audio,
      style,
      duration: 30,
    }
  );
  
  return response.data;
}

export async function analyzeSong(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/v1/analyze`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}