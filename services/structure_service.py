import librosa
import numpy as np


class StructureAnalyzer:
    async def analyze(self, audio_path: str) -> dict:
        y, sr = librosa.load(audio_path)

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

        boundary_frames = librosa.segment.agglomerative(
            mfcc.T, 8, power=2
        )
        boundary_times = librosa.frames_to_time(boundary_frames, sr=sr)

        segments = self._classify_segments(y, sr, boundary_times)

        return {
            "segments": segments,
            "segment_count": len(segments),
            "intro_duration": segments[0].get('duration', 0) if segments else 0,
            "outro_duration": segments[-1].get('duration', 0) if segments else 0
        }

    def _classify_segments(self, y, sr, boundaries):
        segments = []
        for i, boundary in enumerate(boundaries):
            start = boundaries[i-1] if i > 0 else 0
            end = boundary

            segment = y[int(start*sr):int(end*sr)]
            energy = np.mean(segment**2) if len(segment) > 0 else 0

            if energy < 0.01:
                seg_type = "intro/outro"
            elif i == len(boundaries)//2:
                seg_type = "chorus"
            else:
                seg_type = "verse"

            segments.append({
                "type": seg_type,
                "start": round(start, 1),
                "end": round(end, 1),
                "duration": round(end - start, 1),
                "energy": round(float(energy), 4)
            })
        return segments
