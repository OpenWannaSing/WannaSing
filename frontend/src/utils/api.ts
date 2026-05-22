import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ── Auth types ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  nickname: string;
  avatar_url: string;
}

export interface AuthResponse {
  token: string;
  expires_hours: number;
  user: User;
}

// ── Axios interceptor: attach auth token ────────────────────────────────────

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('wanasing_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth API ────────────────────────────────────────────────────────────────

export async function sendCode(email: string): Promise<{ message: string; ttl_seconds: number }> {
  const resp = await axios.post(`${API_BASE}/api/v1/auth/send-code`, { email });
  return resp.data;
}

export async function login(email: string, code: string): Promise<AuthResponse> {
  const resp = await axios.post(`${API_BASE}/api/v1/auth/login`, { email, code });
  return resp.data;
}

export async function getMe(): Promise<User> {
  const resp = await axios.get(`${API_BASE}/api/v1/auth/me`);
  return resp.data;
}

// ── Play History API ─────────────────────────────────────────────────────────

export interface PlayHistoryRecord {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audio_url: string;
  played_at: string;
}

export async function savePlayHistory(item: { title: string; artist: string; cover: string; audio_url: string }): Promise<void> {
  await axios.post(`${API_BASE}/api/v1/play-history`, item);
}

export async function getPlayHistoryFromApi(): Promise<PlayHistoryRecord[]> {
  const resp = await axios.get(`${API_BASE}/api/v1/play-history`);
  return resp.data.items;
}

export async function clearPlayHistoryOnApi(): Promise<void> {
  await axios.delete(`${API_BASE}/api/v1/play-history`);
}

// ── Favorites API ─────────────────────────────────────────────────────────

export interface FavoriteRecord {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audio_url: string;
  created_at: string;
}

export async function addFavorite(item: { title: string; artist: string; cover: string; audio_url: string }): Promise<void> {
  await axios.post(`${API_BASE}/api/v1/favorites`, item);
}

export async function removeFavorite(audioUrl: string): Promise<void> {
  await axios.delete(`${API_BASE}/api/v1/favorites`, { params: { audio_url: audioUrl } });
}

export async function getFavoritesFromApi(): Promise<FavoriteRecord[]> {
  const resp = await axios.get(`${API_BASE}/api/v1/favorites`);
  return resp.data.items;
}

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