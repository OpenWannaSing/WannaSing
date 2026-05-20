import asyncio
from database import engine, Base
from models import SongAnalysis, UserProfile

async def init_database():
    """初始化数据库表"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 数据库表创建成功！")

if __name__ == "__main__":
    asyncio.run(init_database())
