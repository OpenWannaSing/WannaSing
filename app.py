from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
import uuid
import asyncio
import os
import tempfile
from datetime import datetime
from services import PitchAnalyzer, RhythmAnalyzer, StructureAnalyzer, DifficultyScorer
from database import get_db, engine
from models import SongAnalysis, Base, AudioMetadata, Performance, User
from audio_service import audio_storage

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


@app.on_event("startup")
async def startup_event():
    """启动时创建数据库表"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


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
        background_tasks: BackgroundTasks = None,
        db: AsyncSession = Depends(get_db)
):
    task_id = str(uuid.uuid4())
    temp_path = None

    try:
        content = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp:
            tmp.write(content)
            temp_path = tmp.name

        # 先保存到数据库（processing状态）
        db_analysis = SongAnalysis(
            task_id=task_id,
            filename=file.filename,
            status="processing"
        )
        db.add(db_analysis)
        await db.commit()

        # 执行分析
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

        # 更新数据库
        db_analysis.status = "completed"
        db_analysis.lowest_note = pitch_result['lowest_note']
        db_analysis.lowest_note_name = pitch_result['lowest_note_name']
        db_analysis.highest_note = pitch_result['highest_note']
        db_analysis.highest_note_name = pitch_result['highest_note_name']
        db_analysis.vocal_range = pitch_result['vocal_range']
        db_analysis.mean_pitch = pitch_result['mean_pitch']
        db_analysis.pitch_variation = pitch_result['pitch_variation']
        db_analysis.max_jump = pitch_result['max_jump']

        db_analysis.bpm = rhythm_result['bpm']
        db_analysis.beat_count = rhythm_result['beat_count']
        db_analysis.duration_seconds = rhythm_result['duration_seconds']
        db_analysis.syncopation_score = rhythm_result['syncopation_score']
        db_analysis.rhythm_type = rhythm_result['rhythm_type']

        db_analysis.segment_count = structure_result['segment_count']
        db_analysis.structure_json = structure_result

        db_analysis.difficulty_total = difficulty_result['total']
        db_analysis.difficulty_level = difficulty_result['level']
        db_analysis.difficulty_breakdown = difficulty_result['breakdown']

        db_analysis.tips = tips
        db_analysis.analyzed_at = datetime.now()

        await db.commit()

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

        return result

    except Exception as e:
        error_msg = f"分析失败: {str(e)}"
        try:
            db_analysis.status = "failed"
            await db.commit()
        except:
            pass
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        if temp_path and os.path.exists(temp_path):
            if background_tasks:
                background_tasks.add_task(os.remove, temp_path)
            else:
                os.remove(temp_path)


@app.get("/api/v1/analyze/{task_id}")
async def get_analysis_result(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SongAnalysis).where(SongAnalysis.task_id == task_id))
    db_analysis = result.scalar_one_or_none()

    if not db_analysis:
        raise HTTPException(status_code=404, detail="任务不存在")

    return {
        "task_id": db_analysis.task_id,
        "status": db_analysis.status,
        "song_info": {
            "filename": db_analysis.filename,
            "duration": db_analysis.duration_seconds
        },
        "analysis": {
            "pitch": {
                "lowest_note": db_analysis.lowest_note,
                "lowest_note_name": db_analysis.lowest_note_name,
                "highest_note": db_analysis.highest_note,
                "highest_note_name": db_analysis.highest_note_name,
                "vocal_range": db_analysis.vocal_range,
                "mean_pitch": db_analysis.mean_pitch,
                "pitch_variation": db_analysis.pitch_variation,
                "max_jump": db_analysis.max_jump
            },
            "rhythm": {
                "bpm": db_analysis.bpm,
                "beat_count": db_analysis.beat_count,
                "duration_seconds": db_analysis.duration_seconds,
                "syncopation_score": db_analysis.syncopation_score,
                "rhythm_type": db_analysis.rhythm_type
            },
            "structure": db_analysis.structure_json
        },
        "difficulty": {
            "total": db_analysis.difficulty_total,
            "level": db_analysis.difficulty_level,
            "breakdown": db_analysis.difficulty_breakdown
        },
        "tips": db_analysis.tips
    }


@app.get("/api/v1/history")
async def get_analysis_history(skip: int = 0, limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SongAnalysis)
        .where(SongAnalysis.status == "completed")
        .order_by(SongAnalysis.analyzed_at.desc())
        .offset(skip)
        .limit(limit)
    )
    analyses = result.scalars().all()

    return {
        "total": len(analyses),
        "items": [
            {
                "task_id": a.task_id,
                "filename": a.filename,
                "difficulty_total": a.difficulty_total,
                "difficulty_level": a.difficulty_level,
                "analyzed_at": a.analyzed_at.isoformat() if a.analyzed_at else None
            }
            for a in analyses
        ]
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/v1/upload")
async def upload_audio(
        file: UploadFile = File(...),
        user_id: int = Form(...),
        business_type: str = Form(...),
        db: AsyncSession = Depends(get_db)
):
    allowed_extensions = ['.mp3', '.wav', '.m4a']
    file_ext = f".{file.filename.split('.')[-1]}".lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(400, f"不支持的文件类型，仅支持: {allowed_extensions}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await audio_storage.save(
            db=db,
            file_path=tmp_path,
            user_id=user_id,
            business_type=business_type,
            original_name=file.filename
        )

        return {
            "code": 0,
            "message": "success",
            "data": {
                "audio_id": result['id'],
                "file_key": result['file_key'],
                "file_name": result['file_name'],
                "file_size": result['file_size'],
                "duration": result.get('duration', 0),
            }
        }
    except Exception as e:
        raise HTTPException(500, f"上传失败: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/api/v1/performance")
async def save_performance(
        user_id: int = Form(...),
        song_name: str = Form(...),
        score: float = Form(...),
        original_audio_id: int = Form(...),
        tuned_audio_id: Optional[int] = Form(None),
        db: AsyncSession = Depends(get_db)
):
    performance = Performance(
        user_id=user_id,
        song_name=song_name,
        score=score,
        original_audio_id=original_audio_id,
        tuned_audio_id=tuned_audio_id
    )
    db.add(performance)
    await db.commit()
    await db.refresh(performance)

    return {"code": 0, "message": "success", "data": {"performance_id": performance.id}}


@app.get("/api/v1/audio/file/{business_type}/{filename}")
async def get_audio_by_path(business_type: str, filename: str):
    audio_root = os.getenv('AUDIO_ROOT', './.wannasing/data/audio')
    file_path = os.path.join(audio_root, business_type, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(404, "音频文件不存在")
    
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=filename
    )


@app.get("/api/v1/audio/{audio_id}")
async def get_audio(audio_id: int, db: AsyncSession = Depends(get_db)):
    metadata = await audio_storage.get(db, audio_id)

    if not metadata:
        raise HTTPException(404, "音频不存在")

    physical_path = audio_storage.get_physical_path(metadata['file_key'])

    if not physical_path:
        raise HTTPException(404, "音频文件不存在")

    return FileResponse(
        path=physical_path,
        media_type="audio/mpeg",
        filename=metadata['file_name']
    )


@app.get("/api/v1/audio/{audio_id}/metadata")
async def get_audio_metadata(audio_id: int, db: AsyncSession = Depends(get_db)):
    metadata = await audio_storage.get(db, audio_id)

    if not metadata:
        raise HTTPException(404, "音频不存在")

    return {
        "code": 0,
        "message": "success",
        "data": metadata
    }


@app.delete("/api/v1/audio/{audio_id}")
async def delete_audio(audio_id: int, hard: bool = False, db: AsyncSession = Depends(get_db)):
    try:
        await audio_storage.delete(db, audio_id, soft_delete=not hard)
        return {"code": 0, "message": "删除成功"}
    except ValueError as e:
        raise HTTPException(404, str(e))


@app.delete("/api/v1/audio/temp")
async def clean_temp_files(hours: int = 24, db: AsyncSession = Depends(get_db)):
    count = await audio_storage.clean_temp_files(db, hours)
    return {"code": 0, "message": "success", "data": {"deleted_count": count}}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
