import pytest
from sqlalchemy.future import select
from models import AudioMetadata, Performance, AICreation, User, SongAnalysis, UserProfile


@pytest.mark.asyncio
async def test_create_user(async_session):
    """测试创建用户"""
    user = User(
        username="testuser",
        email="test@example.com",
        nickname="Test User"
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    
    assert user.id is not None
    assert user.username == "testuser"
    assert user.email == "test@example.com"


@pytest.mark.asyncio
async def test_create_audio_metadata(async_session):
    """测试创建音频元数据"""
    audio = AudioMetadata(
        file_key="performances/1/test.mp3",
        file_name="test.mp3",
        file_size=102400,
        file_hash="abc123",
        duration=180,
        user_id=1,
        business_type="performance",
        status="active"
    )
    async_session.add(audio)
    await async_session.commit()
    await async_session.refresh(audio)
    
    assert audio.id is not None
    assert audio.file_key == "performances/1/test.mp3"
    assert audio.user_id == 1


@pytest.mark.asyncio
async def test_create_performance(async_session):
    """测试创建演唱记录"""
    # 先创建音频元数据
    audio = AudioMetadata(
        file_key="performances/1/test.mp3",
        file_name="test.mp3",
        file_size=102400,
        file_hash="abc123",
        duration=180,
        user_id=1,
        business_type="performance",
        status="active"
    )
    async_session.add(audio)
    await async_session.commit()
    
    # 创建演唱记录
    performance = Performance(
        user_id=1,
        song_name="Test Song",
        artist="Test Artist",
        score=85.5,
        original_audio_id=audio.id,
        status="active"
    )
    async_session.add(performance)
    await async_session.commit()
    await async_session.refresh(performance)
    
    assert performance.id is not None
    assert performance.song_name == "Test Song"
    assert performance.original_audio_id == audio.id


@pytest.mark.asyncio
async def test_create_ai_creation(async_session):
    """测试创建AI创作"""
    audio = AudioMetadata(
        file_key="ai_generated/1/test.mp3",
        file_name="test.mp3",
        file_size=102400,
        file_hash="def456",
        duration=60,
        user_id=1,
        business_type="ai_generated",
        status="active"
    )
    async_session.add(audio)
    await async_session.commit()
    
    ai_creation = AICreation(
        user_id=1,
        title="AI Generated Song",
        style="pop",
        audio_id=audio.id,
        duration=60,
        play_count=0,
        status="active"
    )
    async_session.add(ai_creation)
    await async_session.commit()
    await async_session.refresh(ai_creation)
    
    assert ai_creation.id is not None
    assert ai_creation.title == "AI Generated Song"
    assert ai_creation.audio_id == audio.id


@pytest.mark.asyncio
async def test_query_audio_metadata(async_session):
    """测试查询音频元数据"""
    # 插入测试数据
    audio1 = AudioMetadata(
        file_key="performances/1/test1.mp3",
        file_name="test1.mp3",
        file_size=102400,
        file_hash="hash1",
        duration=180,
        user_id=1,
        business_type="performance",
        status="active"
    )
    audio2 = AudioMetadata(
        file_key="performances/2/test2.mp3",
        file_name="test2.mp3",
        file_size=204800,
        file_hash="hash2",
        duration=240,
        user_id=1,
        business_type="performance",
        status="active"
    )
    async_session.add_all([audio1, audio2])
    await async_session.commit()
    
    # 查询测试
    result = await async_session.execute(
        select(AudioMetadata).where(AudioMetadata.user_id == 1)
    )
    audios = result.scalars().all()
    
    assert len(audios) == 2


@pytest.mark.asyncio
async def test_update_audio_metadata(async_session):
    """测试更新音频元数据"""
    audio = AudioMetadata(
        file_key="test.mp3",
        file_name="test.mp3",
        file_size=102400,
        file_hash="hash",
        duration=180,
        user_id=1,
        business_type="performance",
        status="active"
    )
    async_session.add(audio)
    await async_session.commit()
    
    # 更新
    audio.status = "deleted"
    await async_session.commit()
    await async_session.refresh(audio)
    
    assert audio.status == "deleted"


@pytest.mark.asyncio
async def test_delete_audio_metadata(async_session):
    """测试删除音频元数据"""
    audio = AudioMetadata(
        file_key="test.mp3",
        file_name="test.mp3",
        file_size=102400,
        file_hash="hash",
        duration=180,
        user_id=1,
        business_type="performance",
        status="active"
    )
    async_session.add(audio)
    await async_session.commit()
    
    audio_id = audio.id
    
    # 删除
    await async_session.delete(audio)
    await async_session.commit()
    
    # 验证
    result = await async_session.execute(
        select(AudioMetadata).where(AudioMetadata.id == audio_id)
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_create_song_analysis(async_session):
    """测试创建歌曲分析记录"""
    analysis = SongAnalysis(
        task_id="task123",
        filename="song.mp3",
        status="completed",
        lowest_note=48,
        lowest_note_name="C3",
        highest_note=72,
        highest_note_name="C5",
        vocal_range=24,
        bpm=120,
        duration_seconds=180,
        difficulty_total=6,
        difficulty_level="intermediate"
    )
    async_session.add(analysis)
    await async_session.commit()
    await async_session.refresh(analysis)
    
    assert analysis.id is not None
    assert analysis.task_id == "task123"
    assert analysis.vocal_range == 24


@pytest.mark.asyncio
async def test_create_user_profile(async_session):
    """测试创建用户资料"""
    profile = UserProfile(
        user_id="user123",
        nickname="Singer",
        vocal_low=48,
        vocal_high=72,
        voice_type="baritone"
    )
    async_session.add(profile)
    await async_session.commit()
    await async_session.refresh(profile)
    
    assert profile.id is not None
    assert profile.user_id == "user123"
    assert profile.vocal_range == 24
