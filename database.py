from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings
import os

# 创建 .wannasing 目录
WANNASING_DIR = os.path.join(os.path.dirname(__file__), ".wannasing")
os.makedirs(WANNASING_DIR, exist_ok=True)

class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite+aiosqlite:///{os.path.join(WANNASING_DIR, 'wanasing.db')}"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
