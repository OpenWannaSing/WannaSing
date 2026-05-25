from dotenv import load_dotenv
load_dotenv()  # Load .env into os.environ BEFORE any project imports

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
import uuid
import asyncio
import os
import tempfile
from datetime import datetime
from database import get_db, engine
from models import SongAnalysis, Base, AudioMetadata, Performance, User, PlayHistory, Favorite
from audio_service import audio_storage
import urllib.parse
import httpx

app = FastAPI(title="WanaSing API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy import for analysis services — only load if librosa is available
try:
    from services import PitchAnalyzer, RhythmAnalyzer, StructureAnalyzer, DifficultyScorer
    pitch_analyzer = PitchAnalyzer()
    rhythm_analyzer = RhythmAnalyzer()
    structure_analyzer = StructureAnalyzer()
    difficulty_scorer = DifficultyScorer()
    _ANALYSIS_AVAILABLE = True
except ImportError as _analysis_e:
    print(f"[WARN] Analysis services not available: {_analysis_e}")
    pitch_analyzer = rhythm_analyzer = structure_analyzer = difficulty_scorer = None
    _ANALYSIS_AVAILABLE = False


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
    if not _ANALYSIS_AVAILABLE:
        raise HTTPException(status_code=503, detail="音频分析服务未部署（需要 librosa）")

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


# ---------------------------------------------------------------------------
# Auth — Email verification code login
# ---------------------------------------------------------------------------

from auth import (
    VerificationCode,
    send_verification_email,
    create_access_token,
    get_current_user,
    JWT_EXPIRE_HOURS,
)
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
import random


class SendCodeRequest(BaseModel):
    email: str


class LoginRequest(BaseModel):
    email: str
    code: str


@app.post("/api/v1/auth/send-code")
async def auth_send_code(req: SendCodeRequest, db: AsyncSession = Depends(get_db)):
    """Send a 6-digit verification code to the given email."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Invalid email address")

    # Generate 6-digit code
    code = f"{random.randint(0, 999999):06d}"

    # Invalidate previous unused codes for this email
    await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.used == False,
        )
    )
    # (SQLAlchemy doesn't support bulk update easily with aiosqlite,
    #  so we invalidate at login time instead — fine for dev)

    # Store new code (5 min expiry)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    vc = VerificationCode(email=email, code=code, expires_at=expires_at)
    db.add(vc)
    await db.commit()

    # Send (console in dev, SMTP in prod)
    send_verification_email(email, code)

    return {"message": "Verification code sent", "ttl_seconds": 300}


@app.get("/api/v1/auth/dev-codes")
async def dev_get_codes(email: str = "", db: AsyncSession = Depends(get_db)):
    """[DEV ONLY] Return recent unused verification codes for an email."""
    if not email:
        raise HTTPException(400, "email parameter is required")
    result = await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == email.strip().lower(),
            VerificationCode.used == False,
            VerificationCode.expires_at > datetime.now(timezone.utc),
        ).order_by(VerificationCode.created_at.desc()).limit(5)
    )
    codes = result.scalars().all()
    return {
        "codes": [
            {
                "code": c.code,
                "expires_at": c.expires_at.isoformat(),
                "created_at": c.created_at.isoformat(),
            }
            for c in codes
        ]
    }


@app.post("/api/v1/auth/login")
async def auth_login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Verify code and login/register user. Returns JWT token."""
    email = req.email.strip().lower()
    code = req.code.strip()

    if not email or not code:
        raise HTTPException(400, "Email and code are required")

    # Find a valid, unused code
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.code == code,
            VerificationCode.used == False,
            VerificationCode.expires_at > now,
        ).order_by(VerificationCode.created_at.desc())
    )
    vc = result.scalars().first()
    if vc is None:
        raise HTTPException(401, "Invalid or expired verification code")

    # Mark code as used
    vc.used = True
    await db.commit()

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        # Create new user
        username = email.split("@")[0]
        # Ensure unique username
        base = username
        suffix = 1
        while True:
            exist = await db.execute(select(User).where(User.username == username))
            if exist.scalar_one_or_none() is None:
                break
            username = f"{base}{suffix}"
            suffix += 1
        user = User(username=username, email=email, nickname=base, is_verified=True)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Generate JWT
    token = create_access_token({"sub": user.id, "email": user.email})

    return {
        "token": token,
        "expires_hours": JWT_EXPIRE_HOURS,
        "user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname or user.username,
            "avatar_url": user.avatar_url or "",
        },
    }


@app.get("/api/v1/auth/me")
async def auth_me(user: User = Depends(get_current_user)):
    """Return current authenticated user info."""
    return {
        "id": user.id,
        "email": user.email,
        "nickname": user.nickname or user.username,
        "avatar_url": user.avatar_url or "",
    }


# ---------------------------------------------------------------------------
# Play History
# ---------------------------------------------------------------------------

class SaveHistoryRequest(BaseModel):
    title: str
    artist: str = ""
    cover: str = ""
    audio_url: str


@app.post("/api/v1/play-history")
async def save_play_history(
    req: SaveHistoryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a play record for the current user."""
    user_id = user.id  # keep reference before any commit expires the object

    # Remove duplicate for same audio_url
    existing = await db.execute(
        select(PlayHistory).where(
            PlayHistory.user_id == user_id,
            PlayHistory.audio_url == req.audio_url,
        )
    )
    dup = existing.scalar_one_or_none()
    if dup:
        dup.played_at = datetime.now()
        await db.commit()
        return {"code": 0, "message": "updated"}

    record = PlayHistory(
        user_id=user_id,
        title=req.title,
        artist=req.artist,
        cover=req.cover,
        audio_url=req.audio_url,
    )
    db.add(record)
    await db.commit()

    # Trim to max 50 per user (delete oldest)
    await db.execute(
        PlayHistory.__table__.delete().where(
            PlayHistory.id.not_in(
                select(PlayHistory.id)
                .where(PlayHistory.user_id == user_id)
                .order_by(PlayHistory.played_at.desc())
                .limit(50)
                .subquery()
            )
        )
    )
    await db.commit()
    return {"code": 0, "message": "saved"}


@app.get("/api/v1/play-history")
async def get_play_history(
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return play history for the current user, newest first."""
    result = await db.execute(
        select(PlayHistory)
        .where(PlayHistory.user_id == user.id)
        .order_by(PlayHistory.played_at.desc())
        .limit(limit)
    )
    records = result.scalars().all()
    return {
        "items": [
            {
                "id": r.id,
                "title": r.title,
                "artist": r.artist,
                "cover": r.cover,
                "audio_url": r.audio_url,
                "played_at": r.played_at.isoformat() if r.played_at else None,
            }
            for r in records
        ]
    }


@app.delete("/api/v1/play-history")
async def clear_play_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Clear all play history for the current user."""
    await db.execute(
        PlayHistory.__table__.delete().where(PlayHistory.user_id == user.id)
    )
    await db.commit()
    return {"code": 0, "message": "cleared"}


# ---------------------------------------------------------------------------
# Favorites
# ---------------------------------------------------------------------------

class FavoriteRequest(BaseModel):
    title: str
    artist: str = ""
    cover: str = ""
    audio_url: str


@app.post("/api/v1/favorites")
async def add_favorite(
    req: FavoriteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a song to favorites."""
    user_id = user.id
    # Check if already favorited
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.audio_url == req.audio_url,
        )
    )
    if existing.scalar_one_or_none():
        return {"code": 0, "message": "already exists"}

    record = Favorite(
        user_id=user_id,
        title=req.title,
        artist=req.artist,
        cover=req.cover,
        audio_url=req.audio_url,
    )
    db.add(record)
    await db.commit()
    return {"code": 0, "message": "favorited"}


@app.delete("/api/v1/favorites")
async def remove_favorite(
    audio_url: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a song from favorites."""
    await db.execute(
        Favorite.__table__.delete().where(
            Favorite.user_id == user.id,
            Favorite.audio_url == audio_url,
        )
    )
    await db.commit()
    return {"code": 0, "message": "removed"}


@app.get("/api/v1/favorites")
async def get_favorites(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all favorites for the current user."""
    result = await db.execute(
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
    )
    records = result.scalars().all()
    return {
        "items": [
            {
                "id": r.id,
                "title": r.title,
                "artist": r.artist,
                "cover": r.cover,
                "audio_url": r.audio_url,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]
    }


# ---------------------------------------------------------------------------
# Music Search (via musicdl, requires Python 3.10+)
# ---------------------------------------------------------------------------

# Search cache: in-memory, keyed by normalized keyword
import time
from collections import OrderedDict

_search_cache = OrderedDict()
_SEARCH_CACHE_TTL = 300       # 5 minutes
_SEARCH_CACHE_MAX_ENTRIES = 200


@app.get("/api/v1/music/search")
async def search_music(keyword: str = "", source: str = "", page: int = 1):
    """Search music across 30+ platforms using musicdl. Results cached in memory."""
    if not keyword:
        return {"code": 0, "message": "success", "data": {"results": [], "total": 0}}

    cache_key = keyword.lower().strip()
    cached = _search_cache.get(cache_key)
    if cached and (time.time() - cached["ts"]) < _SEARCH_CACHE_TTL:
        return {
            "code": 0,
            "message": "success",
            "data": {"results": cached["data"], "total": len(cached["data"])},
        }

    try:
        from musicdl import musicdl as _musicdl
        # Lazy-init singleton client (reused across requests)
        if not hasattr(search_music, "_client"):
            default_sources = ['KugouMusicClient', 'QQMusicClient', 'NeteaseMusicClient', 'KuwoMusicClient']
            search_music._client = _musicdl.MusicClient(music_sources=default_sources)
        client = search_music._client

        # Always search with all default sources (multi-threaded internally)
        loop = asyncio.get_running_loop()
        raw = await loop.run_in_executor(None, client.search, keyword)
    except Exception as e:
        raise HTTPException(500, f"搜索失败: {str(e)}")

    results = []
    for source_name, items in raw.items():
        for song in items:
            info = song.todict() if hasattr(song, 'todict') else {}
            results.append({
                "source": source_name.replace("MusicClient", ""),
                "title": info.get("song_name", ""),
                "artist": info.get("singers", ""),
                "album": info.get("album", ""),
                "duration": info.get("duration", ""),
                "duration_s": info.get("duration_s", 0),
                "ext": info.get("ext", ""),
                "file_size": info.get("file_size", ""),
                "file_size_bytes": info.get("file_size_bytes", 0),
                "download_url": info.get("download_url", ""),
                "cover_url": info.get("cover_url", ""),
                "bitrate": info.get("bitrate", ""),
            })

    # Cache the results
    _search_cache[cache_key] = {"data": results, "ts": time.time()}
    while len(_search_cache) > _SEARCH_CACHE_MAX_ENTRIES:
        _search_cache.popitem(last=False)

    return {"code": 0, "message": "success", "data": {"results": results, "total": len(results)}}


@app.get("/api/v1/music/proxy")
async def proxy_audio(url: str = "", request: Request = None):
    """Stream audio through backend with proper browser headers and Range support."""
    if not url:
        raise HTTPException(400, "缺少 url 参数")
    try:
        range_header = request.headers.get("range", "") if request else ""
        upstream_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Accept": "audio/webm,audio/ogg,audio/wav,audio/mp3,audio/mpeg,*/*;q=0.8",
            "Referer": "https://music.163.com/",
            "Origin": "https://music.163.com",
        }
        if range_header:
            upstream_headers["Range"] = range_header

        async def stream_audio():
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "GET", url, headers=upstream_headers, follow_redirects=True, timeout=30
                ) as resp:
                    content_type = resp.headers.get("content-type", "audio/mpeg")
                    content_length = resp.headers.get("content-length")
                    content_range = resp.headers.get("content-range", "")
                    accept_ranges = resp.headers.get("accept-ranges", "bytes")

                    # Validate response is actually audio
                    raw_ct = content_type.split(";")[0].strip().lower()
                    is_audio = raw_ct.startswith("audio/")
                    if not is_audio:
                        yield ("text/plain", "0", "", "", 415)  # Unsupported Media Type
                        error_msg = f"上游返回 {raw_ct}，非音频内容（链接可能已过期）"
                        yield error_msg.encode()
                        return

                    yield (content_type, content_length, content_range, accept_ranges, resp.status_code)
                    async for chunk in resp.aiter_bytes():
                        yield chunk

        gen = stream_audio()
        meta = await gen.__anext__()
        ct, cl, cr, ar, status_code = meta

        if status_code == 415:
            # Non-audio content - read the error message
            error_bytes = b""
            async for chunk in gen:
                error_bytes += chunk
            raise HTTPException(502, error_bytes.decode() or "链接已过期，请重新搜索")
        elif status_code == 206:
            resp_headers = {
                "Content-Range": cr,
                "Accept-Ranges": ar,
                "Content-Length": str(cl) if cl else "",
                "Cache-Control": "no-cache",
            }
            return StreamingResponse(gen, media_type=ct, status_code=206, headers=resp_headers)
        else:
            return StreamingResponse(
                gen,
                media_type=ct,
                headers={"Accept-Ranges": "bytes", "Cache-Control": "no-cache"},
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"代理请求失败: {str(e)}")


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


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "analysis_available": _ANALYSIS_AVAILABLE,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
