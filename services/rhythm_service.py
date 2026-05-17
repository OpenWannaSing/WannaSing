import librosa
import numpy as np


class RhythmAnalyzer:
    async def analyze(self, audio_path: str) -> dict:
        y, sr = librosa.load(audio_path)

        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)

        beat_frames = librosa.beat.beat_track(y=y, sr=sr, units='frames')[1]
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)

        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
        syncopation = len(onset_frames) / (len(beat_frames) if len(beat_frames) > 0 else 1)

        if tempo < 80:
            rhythm_type = "slow_ballad"
        elif tempo < 120:
            rhythm_type = "medium"
        else:
            rhythm_type = "fast"

        return {
            "bpm": float(tempo),
            "beat_count": len(beat_times),
            "duration_seconds": len(y) / sr,
            "syncopation_score": float(syncopation),
            "rhythm_type": rhythm_type,
            "difficulty_factor": self._calc_rhythm_difficulty(tempo, syncopation)
        }

    def _calc_rhythm_difficulty(self, tempo, syncopation):
        tempo_score = min(5, tempo / 30)
        sync_score = min(5, syncopation * 5)
        return min(10, tempo_score + sync_score)
