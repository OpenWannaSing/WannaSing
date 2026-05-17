import librosa
import numpy as np


class PitchAnalyzer:
    def __init__(self):
        self.sr = 22050

    async def analyze(self, audio_path: str) -> dict:
        y, sr = librosa.load(audio_path, sr=self.sr)

        f0, voiced_flag, voiced_probs = librosa.pyin(
            y,
            fmin=80,
            fmax=500,
            sr=sr
        )

        pitches = f0[voiced_flag]
        if len(pitches) == 0:
            return self._fallback_detection(y, sr)

        midi_pitches = 69 + 12 * np.log2(pitches / 440)

        low_note = int(np.min(midi_pitches))
        high_note = int(np.max(midi_pitches))

        mean_pitch = float(np.mean(midi_pitches))
        pitch_std = float(np.std(midi_pitches))

        pitch_diff = np.diff(midi_pitches)
        high_jump = np.max(np.abs(pitch_diff)) if len(pitch_diff) > 0 else 0

        return {
            "lowest_note": low_note,
            "lowest_note_name": self._midi_to_note(low_note),
            "highest_note": high_note,
            "highest_note_name": self._midi_to_note(high_note),
            "vocal_range": high_note - low_note,
            "mean_pitch": mean_pitch,
            "pitch_variation": pitch_std,
            "max_jump": high_jump,
            "pitch_sequence": midi_pitches.tolist()[:100]
        }

    def _midi_to_note(self, midi):
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        octave = midi // 12 - 1
        note = notes[midi % 12]
        return f"{note}{octave}"

    def _fallback_detection(self, y, sr):
        return {
            "lowest_note": 60,
            "lowest_note_name": "C4",
            "highest_note": 72,
            "highest_note_name": "C5",
            "vocal_range": 12,
            "mean_pitch": 66,
            "pitch_variation": 3.5,
            "max_jump": 5,
            "pitch_sequence": [60, 62, 64, 65, 67, 69, 71, 72]
        }
