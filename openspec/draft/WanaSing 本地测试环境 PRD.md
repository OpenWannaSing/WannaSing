📋 WanaSing 本地测试环境 PRD（文件系统 + SQLite 方案）
文档属性
属性	内容
文档名称	WanaSing 本地测试环境配置规范
版本	v1.0
适用场景	个人本地开发、功能测试、离线调试
技术方案	文件系统存储音频 + SQLite 存储元数据
依赖安装	仅需 Python（无需 Docker）
预估搭建时间	10 分钟
一、方案概述
1.1 架构图
text
┌─────────────────────────────────────────────────────────────┐
│                        本地开发机                            │
│                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │   FastAPI   │─────▶│   SQLite    │      │   文件系统   │ │
│  │  后端服务   │      │  (.db文件)  │      │  ./data/    │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│         │                    │                    │        │
│         │                    │                    │        │
│         ▼                    ▼                    ▼        │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │   上传接口  │      │   audio_    │      │  /mp3文件   │ │
│  │   下载接口  │      │  metadata   │      │  物理存储   │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
1.2 为什么选择 SQLite？
对比项	PostgreSQL	SQLite
安装	需要 Docker/安装包	✅ 零安装，Python 内置
配置	需要配置用户/密码	✅ 无需配置
内存占用	~100MB+	✅ ~5MB
备份	需要专用工具	✅ 直接复制 .db 文件
迁移	需要导出/导入	✅ 文件级迁移
适合场景	生产环境	✅ 本地开发/测试
结论：本地测试用 SQLite，零配置，开箱即用。

二、目录结构
text
wanasing-local/
├── backend/                     # 后端代码
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI 入口
│   │   ├── database.py         # SQLite 数据库连接
│   │   ├── models.py           # 数据模型定义
│   │   ├── audio_service.py    # 音频存储服务
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── upload.py       # 上传接口
│   │       └── audio.py        # 音频访问接口
│   ├── requirements.txt
│   └── .env
├── data/                       # 数据目录
│   ├── audio/                  # 音频文件存储
│   │   ├── performances/       # 用户演唱作品
│   │   ├── ai_generated/       # AI 生成作品
│   │   └── temp/               # 临时文件
│   └── wanasing.db             # SQLite 数据库文件（自动生成）
├── scripts/                    # 工具脚本
│   ├── init_db.py              # 初始化数据库
│   ├── test_upload.py          # 测试上传
│   └── clean_temp.py           # 清理临时文件
├── setup.sh                    # 一键安装脚本
└── README.md
三、数据库设计（SQLite）
3.1 完整建表 SQL
sql
-- audio_metadata 表（音频元数据）
CREATE TABLE IF NOT EXISTS audio_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_key VARCHAR(500) NOT NULL UNIQUE,     -- 文件路径（模拟 OSS Key）
    file_name VARCHAR(255) NOT NULL,           -- 原始文件名
    file_size INTEGER NOT NULL,                -- 文件大小（字节）
    file_hash VARCHAR(64) NOT NULL,            -- MD5 哈希值
    mime_type VARCHAR(50) DEFAULT 'audio/mpeg',
    duration INTEGER DEFAULT 0,                -- 音频时长（秒）
    user_id INTEGER NOT NULL,                  -- 上传用户ID
    business_type VARCHAR(30) NOT NULL,        -- performance/ai_generated/temp
    business_id INTEGER,                       -- 关联的业务记录ID
    status VARCHAR(20) DEFAULT 'active',       -- active/deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_file_key ON audio_metadata(file_key);
CREATE INDEX idx_user_id ON audio_metadata(user_id);
CREATE INDEX idx_business_type ON audio_metadata(business_type);
CREATE INDEX idx_file_hash ON audio_metadata(file_hash);
CREATE INDEX idx_created_at ON audio_metadata(created_at);

-- performances 表（演唱记录）
CREATE TABLE IF NOT EXISTS performances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_name VARCHAR(200),
    artist VARCHAR(100),
    score DECIMAL(5,2),
    original_audio_id INTEGER REFERENCES audio_metadata(id),
    tuned_audio_id INTEGER REFERENCES audio_metadata(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_performances_user_id ON performances(user_id);
CREATE INDEX idx_performances_created_at ON performances(created_at);

-- ai_creations 表（AI 生成作品）
CREATE TABLE IF NOT EXISTS ai_creations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200),
    style VARCHAR(50),
    audio_id INTEGER REFERENCES audio_metadata(id),
    preview_audio_id INTEGER REFERENCES audio_metadata(id),
    duration INTEGER,
    play_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_creations_user_id ON ai_creations(user_id);
CREATE INDEX idx_creations_created_at ON ai_creations(created_at);

-- 用户表（简化版）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    nickname VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试用户
INSERT OR IGNORE INTO users (id, username, email, nickname) 
VALUES (1, 'test_user', 'test@wanasing.com', '测试用户');
3.2 文件 Key 命名规范
业务类型	Key 格式	示例
演唱作品	performances/{user_id}/{timestamp}_{uuid}.mp3	performances/1/20250119_143022_a1b2c3d4.mp3
AI 生成	ai_generated/{user_id}/{timestamp}_{uuid}.mp3	ai_generated/1/20250119_143022_e5f6g7h8.mp3
临时文件	temp/{user_id}/{timestamp}_{uuid}.mp3	temp/1/20250119_143022_i9j0k1l2.mp3
四、代码实现
4.1 依赖文件 (requirements.txt)
txt
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
python-dotenv==1.0.0
aiofiles==23.2.1
mutagen==1.47.0
4.2 配置文件 (.env)
env
# SQLite 配置
DATABASE_PATH=./data/wanasing.db

# 文件存储配置
AUDIO_ROOT=./data/audio
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS=.mp3,.wav,.m4a

# 服务配置
API_PORT=8000
DEBUG=true
4.3 数据库连接 (database.py)
python
import os
import sqlite3
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.getenv('DATABASE_PATH', './data/wanasing.db')

def ensure_db_dir():
    """确保数据库目录存在"""
    db_dir = os.path.dirname(DATABASE_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

@contextmanager
def get_db_connection():
    """获取数据库连接（上下文管理器）"""
    ensure_db_dir()
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # 返回字典风格的行
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_database():
    """初始化数据库表"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 读取并执行初始化 SQL
        sql_path = os.path.join(os.path.dirname(__file__), '..', '..', 'init.sql')
        if os.path.exists(sql_path):
            with open(sql_path, 'r') as f:
                sql = f.read()
                cursor.executescript(sql)
        else:
            # 内嵌 SQL（如果文件不存在）
            cursor.executescript("""
                CREATE TABLE IF NOT EXISTS audio_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_key VARCHAR(500) NOT NULL UNIQUE,
                    file_name VARCHAR(255) NOT NULL,
                    file_size INTEGER NOT NULL,
                    file_hash VARCHAR(64) NOT NULL,
                    mime_type VARCHAR(50) DEFAULT 'audio/mpeg',
                    duration INTEGER DEFAULT 0,
                    user_id INTEGER NOT NULL,
                    business_type VARCHAR(30) NOT NULL,
                    business_id INTEGER,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_file_key ON audio_metadata(file_key);
                CREATE INDEX IF NOT EXISTS idx_user_id ON audio_metadata(user_id);
                
                CREATE TABLE IF NOT EXISTS performances (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    song_name VARCHAR(200),
                    artist VARCHAR(100),
                    score DECIMAL(5,2),
                    original_audio_id INTEGER,
                    tuned_audio_id INTEGER,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS ai_creations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title VARCHAR(200),
                    style VARCHAR(50),
                    audio_id INTEGER,
                    preview_audio_id INTEGER,
                    duration INTEGER,
                    play_count INTEGER DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE,
                    nickname VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                INSERT OR IGNORE INTO users (id, username, email, nickname) 
                VALUES (1, 'test_user', 'test@wanasing.com', '测试用户');
            """)
        
        print("✅ SQLite 数据库初始化完成")
4.4 音频存储服务 (audio_service.py)
python
import os
import hashlib
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from mutagen.mp3 import MP3
from .database import get_db_connection

class AudioStorageService:
    """音频存储服务 - 文件系统 + SQLite"""
    
    def __init__(self):
        self.audio_root = Path(os.getenv('AUDIO_ROOT', './data/audio'))
        self.max_file_size = int(os.getenv('MAX_FILE_SIZE', 52428800))
        
        # 创建目录结构
        self._init_directories()
    
    def _init_directories(self):
        """初始化目录结构"""
        for subdir in ['performances', 'ai_generated', 'temp']:
            (self.audio_root / subdir).mkdir(parents=True, exist_ok=True)
    
    def _get_file_key(self, business_type: str, user_id: int, original_name: str) -> str:
        """生成文件 Key"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        extension = Path(original_name).suffix or '.mp3'
        return f"{business_type}/{user_id}/{timestamp}_{unique_id}{extension}"
    
    def _get_physical_path(self, file_key: str) -> Path:
        """根据 Key 获取物理路径"""
        return self.audio_root / file_key
    
    def _get_audio_duration(self, file_path: str) -> int:
        """获取音频时长（秒）"""
        try:
            audio = MP3(file_path)
            return int(audio.info.length)
        except:
            return 0
    
    def _find_by_hash(self, file_hash: str) -> Optional[Dict]:
        """根据 MD5 查找已存在的文件"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, file_key, file_name, file_size, file_hash, duration
                FROM audio_metadata WHERE file_hash = ? AND status = 'active'
            """, (file_hash,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def save(self, file_path: str, user_id: int, business_type: str, 
             original_name: str = None) -> Dict[str, Any]:
        """
        保存音频文件
        
        Args:
            file_path: 源文件路径
            user_id: 用户ID
            business_type: 业务类型 (performance/ai_generated/temp)
            original_name: 原始文件名
        
        Returns:
            文件元数据字典
        """
        # 1. 验证文件
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        file_size = os.path.getsize(file_path)
        if file_size > self.max_file_size:
            raise ValueError(f"文件过大: {file_size} > {self.max_file_size}")
        
        # 2. 计算 MD5
        with open(file_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        # 3. 检查重复
        existing = self._find_by_hash(file_hash)
        if existing:
            print(f"✅ 文件已存在，复用: {existing['file_key']}")
            return existing
        
        # 4. 生成文件 Key 和物理路径
        original_name = original_name or Path(file_path).name
        file_key = self._get_file_key(business_type, user_id, original_name)
        target_path = self._get_physical_path(file_key)
        
        # 5. 确保目录存在
        target_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 6. 复制文件
        shutil.copy2(file_path, target_path)
        
        # 7. 获取时长
        duration = self._get_audio_duration(str(target_path))
        
        # 8. 存储元数据到 SQLite
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audio_metadata 
                (file_key, file_name, file_size, file_hash, mime_type, 
                 duration, user_id, business_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            """, (file_key, original_name, file_size, file_hash, 'audio/mpeg',
                  duration, user_id, business_type))
            
            row = cursor.fetchone()
            audio_id = row['id']
        
        print(f"✅ 文件保存成功: {file_key}")
        
        return {
            'id': audio_id,
            'file_key': file_key,
            'file_name': original_name,
            'file_size': file_size,
            'file_hash': file_hash,
            'duration': duration,
            'user_id': user_id,
            'business_type': business_type
        }
    
    def get(self, audio_id: int) -> Optional[Dict]:
        """获取音频元数据"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, file_key, file_name, file_size, file_hash, 
                       duration, user_id, business_type, created_at
                FROM audio_metadata WHERE id = ? AND status = 'active'
            """, (audio_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_physical_path(self, audio_id: int) -> Optional[str]:
        """获取物理文件路径"""
        metadata = self.get(audio_id)
        if metadata:
            physical_path = self._get_physical_path(metadata['file_key'])
            if physical_path.exists():
                return str(physical_path)
        return None
    
    def delete(self, audio_id: int, soft_delete: bool = True):
        """删除音频"""
        metadata = self.get(audio_id)
        if not metadata:
            raise ValueError(f"文件不存在: {audio_id}")
        
        if soft_delete:
            # 软删除：只标记数据库
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE audio_metadata SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (audio_id,))
            print(f"✅ 软删除成功: {audio_id}")
        else:
            # 硬删除：删除物理文件 + 数据库记录
            physical_path = self._get_physical_path(metadata['file_key'])
            if physical_path.exists():
                physical_path.unlink()
            
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM audio_metadata WHERE id = ?", (audio_id,))
            print(f"✅ 硬删除成功: {audio_id}")
    
    def clean_temp_files(self, hours: int = 24):
        """清理临时文件（超过指定小时）"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, file_key FROM audio_metadata 
                WHERE business_type = 'temp' 
                AND created_at < datetime('now', '-' || ? || ' hours')
                AND status = 'active'
            """, (hours,))
            temp_files = cursor.fetchall()
            
            for file in temp_files:
                physical_path = self._get_physical_path(file['file_key'])
                if physical_path.exists():
                    physical_path.unlink()
                cursor.execute("UPDATE audio_metadata SET status = 'deleted' WHERE id = ?", 
                           (file['id'],))
        
        print(f"✅ 清理了 {len(temp_files)} 个临时文件")


# 全局单例
audio_storage = AudioStorageService()
4.5 API 接口 (upload.py)
python
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import tempfile
from ..audio_service import audio_storage

router = APIRouter(prefix="/api/v1", tags=["upload"])

@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    user_id: int = Form(...),
    business_type: str = Form(...)  # performance / ai_generated / temp
):
    """
    上传音频文件
    """
    # 1. 验证文件类型
    allowed_extensions = ['.mp3', '.wav', '.m4a']
    file_ext = f".{file.filename.split('.')[-1]}".lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(400, f"不支持的文件类型，仅支持: {allowed_extensions}")
    
    # 2. 保存到临时文件
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # 3. 保存到存储服务
        result = audio_storage.save(
            file_path=tmp_path,
            user_id=user_id,
            business_type=business_type,
            original_name=file.filename
        )
        
        # 4. 构造响应
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
        # 清理临时文件
        import os
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/performance")
async def save_performance(
    user_id: int = Form(...),
    song_name: str = Form(...),
    score: float = Form(...),
    original_audio_id: int = Form(...),
    tuned_audio_id: Optional[int] = Form(None)
):
    """保存演唱记录"""
    from ..database import get_db_connection
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO performances (user_id, song_name, score, original_audio_id, tuned_audio_id)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id
        """, (user_id, song_name, score, original_audio_id, tuned_audio_id))
        row = cursor.fetchone()
        performance_id = row['id']
    
    return {"code": 0, "message": "success", "data": {"performance_id": performance_id}}
4.6 音频访问接口 (audio.py)
python
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from ..audio_service import audio_storage

router = APIRouter(prefix="/api/v1/audio", tags=["audio"])

@router.get("/{audio_id}")
async def get_audio(audio_id: int):
    """获取音频文件"""
    physical_path = audio_storage.get_physical_path(audio_id)
    
    if not physical_path:
        raise HTTPException(404, "音频不存在")
    
    metadata = audio_storage.get(audio_id)
    
    return FileResponse(
        path=physical_path,
        media_type="audio/mpeg",
        filename=metadata['file_name'] if metadata else "audio.mp3"
    )


@router.delete("/{audio_id}")
async def delete_audio(audio_id: int, hard: bool = False):
    """删除音频"""
    try:
        audio_storage.delete(audio_id, soft_delete=not hard)
        return {"code": 0, "message": "删除成功"}
    except ValueError as e:
        raise HTTPException(404, str(e))
4.7 主程序入口 (main.py)
python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .api import upload, audio
from .database import init_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("🚀 WanaSing 本地服务启动中...")
    init_database()
    print("✅ 服务启动完成")
    yield
    # 关闭时执行
    print("👋 服务关闭")

app = FastAPI(
    title="WanaSing Local API", 
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(upload.router)
app.include_router(audio.router)

@app.get("/health")
async def health():
    return {"status": "ok", "database": "sqlite"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
五、一键安装脚本
5.1 setup.sh（Linux/macOS）
bash
#!/bin/bash
# setup.sh - WanaSing 本地环境一键安装脚本（SQLite 版）

set -e

echo "🚀 WanaSing 本地环境初始化（SQLite + 文件系统）"

# 1. 创建目录结构
echo "📁 创建目录..."
mkdir -p backend/app/api
mkdir -p data/audio/{performances,ai_generated,temp}

# 2. 创建 Python 虚拟环境
echo "🐍 创建虚拟环境..."
python3 -m venv venv
source venv/bin/activate

# 3. 安装依赖
echo "📦 安装依赖..."
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 4. 初始化数据库
echo "🗄️ 初始化 SQLite 数据库..."
python -c "from app.database import init_database; init_database()"

# 5. 启动服务
echo "🎵 启动 API 服务..."
echo "📍 API 地址: http://localhost:8000"
echo "📍 API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止服务"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
5.2 setup.bat（Windows）
batch
@echo off
echo 🚀 WanaSing 本地环境初始化（SQLite + 文件系统）

echo 📁 创建目录...
mkdir backend\app\api 2>nul
mkdir data\audio\performances 2>nul
mkdir data\audio\ai_generated 2>nul
mkdir data\audio\temp 2>nul

echo 🐍 创建虚拟环境...
python -m venv venv
call venv\Scripts\activate.bat

echo 📦 安装依赖...
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

echo 🗄️ 初始化 SQLite 数据库...
python -c "from app.database import init_database; init_database()"

echo 🎵 启动 API 服务...
echo 📍 API 地址: http://localhost:8000
echo 📍 API 文档: http://localhost:8000/docs

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
5.3 test_upload.py（测试脚本）
python
#!/usr/bin/env python
# test_upload.py - 测试上传功能

import requests
import sys
import os

def test_upload(file_path, user_id=1):
    """测试上传音频"""
    url = "http://localhost:8000/api/v1/upload"
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return None
    
    with open(file_path, 'rb') as f:
        files = {'file': (os.path.basename(file_path), f, 'audio/mpeg')}
        data = {'user_id': user_id, 'business_type': 'performance'}
        
        response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 上传成功!")
        print(f"   audio_id: {result['data']['audio_id']}")
        print(f"   file_key: {result['data']['file_key']}")
        print(f"   duration: {result['data']['duration']}秒")
        return result['data']['audio_id']
    else:
        print(f"❌ 上传失败: {response.text}")
        return None

def test_get_audio(audio_id):
    """测试获取音频"""
    url = f"http://localhost:8000/api/v1/audio/{audio_id}"
    response = requests.get(url)
    
    if response.status_code == 200:
        output_path = f"downloaded_{audio_id}.mp3"
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"✅ 下载成功: {output_path}")
        return output_path
    else:
        print(f"❌ 下载失败: {response.status_code}")
        return None

def test_save_performance(user_id, song_name, score, original_audio_id):
    """测试保存演唱记录"""
    url = "http://localhost:8000/api/v1/performance"
    data = {
        'user_id': user_id,
        'song_name': song_name,
        'score': score,
        'original_audio_id': original_audio_id
    }
    
    response = requests.post(url, data=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 演唱记录保存成功!")
        print(f"   performance_id: {result['data']['performance_id']}")
        return result['data']['performance_id']
    else:
        print(f"❌ 保存失败: {response.text}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python test_upload.py <mp3文件路径>")
        sys.exit(1)
    
    # 1. 上传音频
    audio_id = test_upload(sys.argv[1])
    
    if audio_id:
        # 2. 下载音频验证
        test_get_audio(audio_id)
        
        # 3. 保存演唱记录
        test_save_performance(1, "十年", 85.5, audio_id)
六、快速启动指南
6.1 一键启动
bash
# 1. 克隆/创建项目
mkdir wanasing-local && cd wanasing-local

# 2. 下载代码（按上述目录结构创建文件）

# 3. 运行安装脚本
chmod +x setup.sh
./setup.sh
6.2 手动启动
bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 初始化数据库
python -c "from app.database import init_database; init_database()"

# 4. 启动服务
uvicorn app.main:app --reload --port 8000
6.3 验证服务
bash
# 健康检查
curl http://localhost:8000/health

# 上传测试
python test_upload.py test.mp3

# 浏览器访问 API 文档
open http://localhost:8000/docs
七、目录结构最终版
text
wanasing-local/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── audio_service.py
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── upload.py
│   │       └── audio.py
│   └── requirements.txt
├── data/
│   ├── audio/
│   │   ├── performances/
│   │   ├── ai_generated/
│   │   └── temp/
│   └── wanasing.db
├── scripts/
│   ├── test_upload.py
│   └── clean_temp.py
├── setup.sh
├── setup.bat
├── init.sql
└── README.md
八、验证清单
检查项	命令/操作	预期结果
虚拟环境激活	source venv/bin/activate	命令行前缀显示 (venv)
依赖安装	pip list	fastapi, uvicorn 等存在
数据库初始化	查看 data/wanasing.db	文件存在且大小 > 0
服务启动	uvicorn app.main:app --reload	看到 "Application startup complete"
健康检查	curl http://localhost:8000/health	{"status":"ok","database":"sqlite"}
上传音频	python test_upload.py test.mp3	返回 audio_id
下载音频	访问 http://localhost:8000/api/v1/audio/{audio_id}	文件下载
API 文档	访问 http://localhost:8000/docs	Swagger 页面
九、常见问题
Q1: 端口 8000 被占用？
bash
# 修改端口
uvicorn app.main:app --reload --port 8001
Q2: SQLite 数据库锁定？
python
# SQLite 默认支持并发读，写操作需要排队
# 使用 contextmanager 确保连接正确关闭
Q3: 上传大文件超时？
python
# 修改 .env 中的 MAX_FILE_SIZE
MAX_FILE_SIZE=104857600  # 100MB

# 同时修改 uvicorn 超时
uvicorn app.main:app --timeout-keep-alive 300
Q4: 如何查看数据库内容？
bash
# 使用 sqlite3 命令行
sqlite3 data/wanasing.db
.tables
SELECT * FROM audio_metadata;

# 或使用 GUI 工具如 DB Browser for SQLite
十、总结
对比项	PostgreSQL 方案	SQLite 方案
安装依赖	Docker + 镜像	✅ 零依赖
启动时间	~2分钟	✅ ~5秒
内存占用	~200MB	✅ ~10MB
配置复杂度	中	✅ 极低
备份方式	导出 SQL	✅ 复制文件
适合场景	生产环境	✅ 本地开发
一句话总结：SQLite + 文件系统 = 零配置、开箱即用的本地测试环境，10 分钟即可上手。

