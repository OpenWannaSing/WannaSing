from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uuid
import asyncio
import os
import tempfile
from services import PitchAnalyzer, RhythmAnalyzer, StructureAnalyzer, DifficultyScorer

app = FastAPI(title="WanaSing API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pitch_analyzer = PitchAnalyzer()
rhythm_analyzer = RhythmAnalyzer()
structure_analyzer = StructureAnalyzer()
difficulty_scorer = DifficultyScorer()

tasks_db = {}


class GenerateRequest(BaseModel):
    audio: str
    style: str
    duration: int = 30


class GenerateResponse(BaseModel):
    success: bool
    audio_url: str
    duration: int


MOCK_AUDIO_URLS = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
]


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_accompaniment(request: GenerateRequest):
    if not request.audio or not request.style:
        raise HTTPException(status_code=400, detail="缺少必要参数")

    import time
    import random
    time.sleep(random.uniform(2, 5))

    audio_url = random.choice(MOCK_AUDIO_URLS)

    return GenerateResponse(
        success=True,
        audio_url=audio_url,
        duration=request.duration
    )


@app.post("/api/v1/analyze")
async def analyze_song(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    task_id = str(uuid.uuid4())

    temp_path = None
    try:
        content = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
            tmp.write(content)
            temp_path = tmp.name

        tasks_db[task_id] = {
            "status": "processing",
            "filename": file.filename
        }

        pitch_task = asyncio.create_task(pitch_analyzer.analyze(temp_path))
        rhythm_task = asyncio.create_task(rhythm_analyzer.analyze(temp_path))
        structure_task = asyncio.create_task(structure_analyzer.analyze(temp_path))

        pitch_result, rhythm_result, structure_result = await asyncio.gather(
            pitch_task, rhythm_task, structure_task
        )

        combined_result = {
            "pitch": pitch_result,
            "rhythm": rhythm_result,
            "structure": structure_result
        }

        difficulty_result = await difficulty_scorer.score(combined_result)

        tips = []
        if pitch_result['vocal_range'] > 12:
            tips.append("这首歌音域较宽，注意换声区的平滑过渡")

        if pitch_result['highest_note'] > 72:
            tips.append("副歌有较高音区，建议用混声/假声演唱")

        if rhythm_result['syncopation_score'] > 2:
            tips.append("切分音较多，注意节奏的准确度")

        result = {
            "task_id": task_id,
            "status": "completed",
            "song_info": {
                "filename": file.filename,
                "duration": rhythm_result.get("duration_seconds", 0)
            },
            "analysis": combined_result,
            "difficulty": difficulty_result,
            "tips": tips
        }

        tasks_db[task_id] = result
        return result

    except Exception as e:
        error_msg = f"分析失败: {str(e)}"
        tasks_db[task_id] = {
            "status": "failed",
            "error": error_msg
        }
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        if temp_path and os.path.exists(temp_path):
            if background_tasks:
                background_tasks.add_task(os.remove, temp_path)
            else:
                os.remove(temp_path)


@app.get("/api/v1/analyze/{task_id}")
async def get_analysis_result(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="任务不存在")
    return tasks_db[task_id]


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
