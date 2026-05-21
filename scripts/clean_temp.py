#!/usr/bin/env python3
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from audio_service import audio_storage
from database import get_db_connection, AsyncSessionLocal

async def main():
    hours = int(sys.argv[1]) if len(sys.argv) > 1 else 24
    async with AsyncSessionLocal() as db:
        count = await audio_storage.clean_temp_files(db, hours)
        print(f"✅ 已清理超过 {hours} 小时的临时文件，共 {count} 个")

if __name__ == "__main__":
    asyncio.run(main())