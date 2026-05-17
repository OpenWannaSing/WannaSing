class DifficultyScorer:
    def __init__(self):
        self.weights = {
            'vocal_range': 0.30,
            'highest_note': 0.20,
            'bpm': 0.15,
            'pitch_variation': 0.10,
            'syncopation': 0.10,
            'duration': 0.05,
            'breath_requirement': 0.10
        }

    async def score(self, analysis_result: dict) -> dict:
        vocal_range = analysis_result['pitch']['vocal_range']
        range_score = min(10, vocal_range / 2)

        highest = analysis_result['pitch']['highest_note']
        high_score = max(0, (highest - 72) / 3) if highest > 72 else 0

        bpm = analysis_result['rhythm']['bpm']
        tempo_score = min(8, bpm / 15)

        total_score = (
            range_score * self.weights['vocal_range'] +
            high_score * self.weights['highest_note'] +
            tempo_score * self.weights['bpm']
        )

        final_score = min(10, max(1, round(total_score)))

        if final_score <= 3:
            level = "beginner"
        elif final_score <= 6:
            level = "intermediate"
        else:
            level = "advanced"

        return {
            "total": final_score,
            "level": level,
            "level_name": self._get_level_name(level),
            "breakdown": {
                "vocal_range": round(range_score, 1),
                "highest_note": round(high_score, 1),
                "tempo": round(tempo_score, 1)
            }
        }

    def _get_level_name(self, level):
        return {
            "beginner": "初学者",
            "intermediate": "进阶",
            "advanced": "专业级"
        }.get(level, level)
