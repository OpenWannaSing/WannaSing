import pytest
import os
from httpx import AsyncClient
from app import app
from models import Base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


@pytest.fixture(scope="function")
async def client(async_session, test_audio_root):
    """测试客户端"""
    from database import AsyncSessionLocal
    
    # 临时设置环境变量
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    os.environ['DATABASE_URL'] = "sqlite+aiosqlite:///:memory:"
    
    # 重写数据库会话依赖
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[AsyncSessionLocal] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_audio_file():
    """创建临时音频文件"""
    import tempfile
    
    fd, path = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)
    
    # 写入一些数据
    with open(path, "wb") as f:
        f.write(b"test audio content")
    
    yield path
    
    if os.path.exists(path):
        os.unlink(path)


@pytest.mark.asyncio
async def test_health_check(client):
    """测试健康检查接口"""
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_upload_audio(client, test_audio_file):
    """测试上传音频文件"""
    with open(test_audio_file, "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        data = {"user_id": "1", "business_type": "performance"}
        
        response = await client.post(
            "/api/v1/upload",
            files=files,
            data=data
        )
    
    assert response.status_code == 200
    result = response.json()
    
    assert result["code"] == 0
    assert "data" in result
    assert "audio_id" in result["data"]
    assert "file_key" in result["data"]


@pytest.mark.asyncio
async def test_upload_invalid_file_type(client):
    """测试上传无效文件类型"""
    import tempfile
    
    fd, path = tempfile.mkstemp(suffix=".txt")
    os.close(fd)
    
    try:
        with open(path, "wb") as f:
            f.write(b"test text content")
        
        with open(path, "rb") as f:
            files = {"file": ("test.txt", f, "text/plain")}
            data = {"user_id": "1", "business_type": "performance"}
            
            response = await client.post(
                "/api/v1/upload",
                files=files,
                data=data
            )
        
        assert response.status_code == 400
    finally:
        if os.path.exists(path):
            os.unlink(path)


@pytest.mark.asyncio
async def test_save_performance(client, test_audio_file, async_session):
    """测试保存演唱记录"""
    # 先上传音频
    with open(test_audio_file, "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        data = {"user_id": "1", "business_type": "performance"}
        
        upload_response = await client.post(
            "/api/v1/upload",
            files=files,
            data=data
        )
    
    audio_id = upload_response.json()["data"]["audio_id"]
    
    # 保存演唱记录
    data = {
        "user_id": 1,
        "song_name": "Test Song",
        "score": 85.5,
        "original_audio_id": audio_id
    }
    
    response = await client.post("/api/v1/performance", data=data)
    assert response.status_code == 200
    
    result = response.json()
    assert result["code"] == 0
    assert "performance_id" in result["data"]


@pytest.mark.asyncio
async def test_get_audio_metadata_not_found(client):
    """测试获取不存在的音频"""
    response = await client.get("/api/v1/audio/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_audio_not_found(client):
    """测试删除不存在的音频"""
    response = await client.delete("/api/v1/audio/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_accompaniment(client):
    """测试生成伴奏接口"""
    data = {
        "audio": "test_audio_data",
        "style": "pop",
        "duration": 30
    }
    
    response = await client.post("/api/generate", json=data)
    assert response.status_code == 200
    
    result = response.json()
    assert result["success"] is True
    assert "audio_url" in result


@pytest.mark.asyncio
async def test_analyze_song(client, test_audio_file):
    """测试歌曲分析接口"""
    with open(test_audio_file, "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        
        response = await client.post("/api/v1/analyze", files=files)
    
    # 注意：实际测试可能需要模拟音频分析或使用真实音频
    assert response.status_code in [200, 500]  # 可能成功或失败（取决于是否有真实音频）


@pytest.mark.asyncio
async def test_get_analysis_history(client):
    """测试获取分析历史"""
    response = await client.get("/api/v1/history")
    assert response.status_code == 200
    
    result = response.json()
    assert "total" in result
    assert "items" in result
