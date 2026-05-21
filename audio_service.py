import os
import hashlib
import shutil
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any
from mutagen.mp3 import MP3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from models import AudioMetadata

class AudioStorageService:
    
    def __init__(self):
        self.audio_root = Path(os.getenv('AUDIO_ROOT', './.wannasing/data/audio'))
        self.max_file_size = int(os.getenv('MAX_FILE_SIZE', 52428800))
        self._init_directories()
    
    def _init_directories(self):
        for subdir in ['performances', 'ai_generated', 'temp']:
            (self.audio_root / subdir).mkdir(parents=True, exist_ok=True)
    
    def _get_file_key(self, business_type: str, user_id: int, original_name: str) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        extension = Path(original_name).suffix or '.mp3'
        return f"{business_type}/{user_id}/{timestamp}_{unique_id}{extension}"
    
    def _get_physical_path(self, file_key: str) -> Path:
        return self.audio_root / file_key
    
    def _get_audio_duration(self, file_path: str) -> int:
        try:
            audio = MP3(file_path)
            return int(audio.info.length)
        except:
            return 0
    
    async def _find_by_hash(self, db: AsyncSession, file_hash: str) -> Optional[Dict]:
        result = await db.execute(
            select(AudioMetadata).where(
                AudioMetadata.file_hash == file_hash,
                AudioMetadata.status == 'active'
            )
        )
        audio = result.scalar_one_or_none()
        if audio:
            return {
                'id': audio.id,
                'file_key': audio.file_key,
                'file_name': audio.file_name,
                'file_size': audio.file_size,
                'file_hash': audio.file_hash,
                'duration': audio.duration
            }
        return None
    
    async def save(self, db: AsyncSession, file_path: str, user_id: int, 
                   business_type: str, original_name: str = None) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        file_size = os.path.getsize(file_path)
        if file_size > self.max_file_size:
            raise ValueError(f"文件过大: {file_size} > {self.max_file_size}")
        
        with open(file_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        existing = await self._find_by_hash(db, file_hash)
        if existing:
            print(f"✅ 文件已存在，复用: {existing['file_key']}")
            return existing
        
        original_name = original_name or Path(file_path).name
        file_key = self._get_file_key(business_type, user_id, original_name)
        target_path = self._get_physical_path(file_key)
        
        target_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, target_path)
        
        duration = self._get_audio_duration(str(target_path))
        
        audio = AudioMetadata(
            file_key=file_key,
            file_name=original_name,
            file_size=file_size,
            file_hash=file_hash,
            mime_type='audio/mpeg',
            duration=duration,
            user_id=user_id,
            business_type=business_type
        )
        db.add(audio)
        await db.commit()
        await db.refresh(audio)
        
        print(f"✅ 文件保存成功: {file_key}")
        
        return {
            'id': audio.id,
            'file_key': file_key,
            'file_name': original_name,
            'file_size': file_size,
            'file_hash': file_hash,
            'duration': duration,
            'user_id': user_id,
            'business_type': business_type
        }
    
    async def get(self, db: AsyncSession, audio_id: int) -> Optional[Dict]:
        result = await db.execute(
            select(AudioMetadata).where(
                AudioMetadata.id == audio_id,
                AudioMetadata.status == 'active'
            )
        )
        audio = result.scalar_one_or_none()
        if audio:
            return {
                'id': audio.id,
                'file_key': audio.file_key,
                'file_name': audio.file_name,
                'file_size': audio.file_size,
                'file_hash': audio.file_hash,
                'duration': audio.duration,
                'user_id': audio.user_id,
                'business_type': audio.business_type,
                'created_at': audio.created_at.isoformat() if audio.created_at else None
            }
        return None
    
    def get_physical_path(self, file_key: str) -> Optional[str]:
        physical_path = self._get_physical_path(file_key)
        if physical_path.exists():
            return str(physical_path)
        return None
    
    async def delete(self, db: AsyncSession, audio_id: int, soft_delete: bool = True):
        metadata = await self.get(db, audio_id)
        if not metadata:
            raise ValueError(f"文件不存在: {audio_id}")
        
        if soft_delete:
            await db.execute(
                update(AudioMetadata)
                .where(AudioMetadata.id == audio_id)
                .values(status='deleted')
            )
            await db.commit()
            print(f"✅ 软删除成功: {audio_id}")
        else:
            physical_path = self._get_physical_path(metadata['file_key'])
            if physical_path.exists():
                physical_path.unlink()
            
            await db.execute(
                delete(AudioMetadata).where(AudioMetadata.id == audio_id)
            )
            await db.commit()
            print(f"✅ 硬删除成功: {audio_id}")
    
    async def clean_temp_files(self, db: AsyncSession, hours: int = 24):
        cutoff_time = datetime.now() - timedelta(hours=hours)
        result = await db.execute(
            select(AudioMetadata).where(
                AudioMetadata.business_type == 'temp',
                AudioMetadata.created_at < cutoff_time,
                AudioMetadata.status == 'active'
            )
        )
        temp_files = result.scalars().all()
        
        for file in temp_files:
            physical_path = self._get_physical_path(file.file_key)
            if physical_path.exists():
                physical_path.unlink()
            file.status = 'deleted'
        
        await db.commit()
        print(f"✅ 清理了 {len(temp_files)} 个临时文件")
        return len(temp_files)

audio_storage = AudioStorageService()