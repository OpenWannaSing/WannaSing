import pytest
import asyncio
import os
import sys
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Base

# 测试数据库路径
TEST_DB_PATH = Path(__file__).parent.parent / '.wannasing' / 'test_wanasing.db'
TEST_AUDIO_ROOT = Path(__file__).parent.parent / '.wannasing' / 'data' / 'audio'


@pytest.fixture(scope="function")
async def async_engine():
    """创建异步数据库引擎"""
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{TEST_DB_PATH}",
        echo=False,
        connect_args={"check_same_thread": False}
    )
    
    # 创建表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # 清理
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def async_session(async_engine):
    """创建异步数据库会话"""
    async_session = sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()
        await session.close()


@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def test_audio_root():
    """测试音频存储目录"""
    TEST_AUDIO_ROOT.mkdir(parents=True, exist_ok=True)
    
    yield TEST_AUDIO_ROOT
    
    # 清理测试文件
    import shutil
    if TEST_AUDIO_ROOT.exists():
        shutil.rmtree(TEST_AUDIO_ROOT)


@pytest.fixture(scope="function")
def create_test_audio():
    """创建临时音频文件"""
    def _create_test_audio(content=b"test audio data", suffix=".mp3"):
        import tempfile
        import os
        
        fd, path = tempfile.mkstemp(suffix=suffix)
        os.close(fd)
        
        with open(path, "wb") as f:
            f.write(content)
        
        return path
    
    return _create_test_audio


@pytest.fixture(scope="function")
async def test_user(async_session):
    """创建测试用户"""
    from models import User
    
    user = User(
        username="test_user",
        email="test@example.com",
        nickname="Test User"
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    
    yield user
