from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime, ForeignKey, DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class AudioMetadata(Base):
    __tablename__ = "audio_metadata"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    file_key = Column(String(500), unique=True, nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    mime_type = Column(String(50), default='audio/mpeg')
    duration = Column(Integer, default=0)
    user_id = Column(Integer, nullable=False, index=True)
    business_type = Column(String(30), nullable=False, index=True)
    business_id = Column(Integer, nullable=True)
    status = Column(String(20), default='active')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Performance(Base):
    __tablename__ = "performances"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    song_name = Column(String(200), nullable=True)
    artist = Column(String(100), nullable=True)
    score = Column(DECIMAL(5, 2), nullable=True)
    original_audio_id = Column(Integer, ForeignKey('audio_metadata.id'), nullable=True)
    tuned_audio_id = Column(Integer, ForeignKey('audio_metadata.id'), nullable=True)
    status = Column(String(20), default='active')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AICreation(Base):
    __tablename__ = "ai_creations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(200), nullable=True)
    style = Column(String(50), nullable=True)
    audio_id = Column(Integer, ForeignKey('audio_metadata.id'), nullable=True)
    preview_audio_id = Column(Integer, ForeignKey('audio_metadata.id'), nullable=True)
    duration = Column(Integer, nullable=True)
    play_count = Column(Integer, default=0)
    status = Column(String(20), default='active')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    nickname = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SongAnalysis(Base):
    __tablename__ = "song_analysis"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(36), unique=True, index=True, nullable=False)
    song_name = Column(String(200), nullable=True)
    artist = Column(String(100), nullable=True)
    filename = Column(String(200), nullable=True)
    
    # 音高分析结果
    lowest_note = Column(Integer, nullable=True)
    lowest_note_name = Column(String(10), nullable=True)
    highest_note = Column(Integer, nullable=True)
    highest_note_name = Column(String(10), nullable=True)
    vocal_range = Column(Integer, nullable=True)
    mean_pitch = Column(Float, nullable=True)
    pitch_variation = Column(Float, nullable=True)
    max_jump = Column(Float, nullable=True)
    
    # 节奏分析结果
    bpm = Column(Float, nullable=True)
    beat_count = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    syncopation_score = Column(Float, nullable=True)
    rhythm_type = Column(String(20), nullable=True)
    
    # 结构分析结果
    segment_count = Column(Integer, nullable=True)
    structure_json = Column(JSON, nullable=True)
    
    # 难度评分
    difficulty_total = Column(Integer, nullable=True)
    difficulty_level = Column(String(20), nullable=True)
    difficulty_breakdown = Column(JSON, nullable=True)
    
    # 提示
    tips = Column(JSON, nullable=True)
    
    # 元数据
    status = Column(String(20), default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    analyzed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联
    user_id = Column(String(100), nullable=True, index=True)

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), unique=True, index=True, nullable=False)
    nickname = Column(String(50), nullable=True)
    
    # 用户音域
    vocal_low = Column(Integer, nullable=True)
    vocal_high = Column(Integer, nullable=True)
    voice_type = Column(String(20), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
