# 数据库设计 - 技术规格文档

## 概述

本文档描述 WannaSing 项目的数据库设计方案。

## 1. 数据库选型

| 环境 | 数据库 | 说明 |
|------|--------|------|
| 开发 | SQLite | 开箱即用，无需配置 |
| 生产 | MySQL / PostgreSQL | 性能更好，支持更多并发 |

## 2. 数据表设计

### 2.1 歌曲分析表 (song_analysis)

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | Integer | 主键 | AUTO_INCREMENT, PRIMARY KEY |
| task_id | String(36) | 任务 ID | UNIQUE, INDEX |
| song_name | String(200) | 歌曲名 | NULLABLE |
| artist | String(100) | 艺术家 | NULLABLE |
| filename | String(200) | 文件名 | NULLABLE |
| lowest_note | Integer | 最低音 MIDI | NULLABLE |
| lowest_note_name | String(10) | 最低音音符名 | NULLABLE |
| highest_note | Integer | 最高音 MIDI | NULLABLE |
| highest_note_name | String(10) | 最高音音符名 | NULLABLE |
| vocal_range | Integer | 音域宽度 | NULLABLE |
| mean_pitch | Float | 平均音高 | NULLABLE |
| pitch_variation | Float | 音高变化 | NULLABLE |
| max_jump | Float | 最大音程跳 | NULLABLE |
| bpm | Float | BPM | NULLABLE |
| beat_count | Integer | 节拍数 | NULLABLE |
| duration_seconds | Float | 歌曲时长(秒) | NULLABLE |
| syncopation_score | Float | 切分音评分 | NULLABLE |
| rhythm_type | String(20) | 节奏类型 | NULLABLE |
| segment_count | Integer | 段落数 | NULLABLE |
| structure_json | JSON | 结构分析结果 | NULLABLE |
| difficulty_total | Integer | 难度总分(1-10) | NULLABLE |
| difficulty_level | String(20) | 难度等级 | NULLABLE |
| difficulty_breakdown | JSON | 难度细分 | NULLABLE |
| tips | JSON | 演唱建议 | NULLABLE |
| status | String(20) | 状态 | DEFAULT 'pending' |
| user_id | String(100) | 用户 ID | INDEX, NULLABLE |
| created_at | DateTime | 创建时间 | DEFAULT NOW() |
| analyzed_at | DateTime | 分析时间 | NULLABLE |

**索引：**
- task_id: 唯一索引
- user_id: 普通索引
- created_at: 普通索引

### 2.2 用户表 (user_profile)

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | Integer | 主键 | AUTO_INCREMENT, PRIMARY KEY |
| user_id | String(100) | 用户 ID | UNIQUE, INDEX |
| nickname | String(50) | 昵称 | NULLABLE |
| vocal_low | Integer | 用户最低音 | NULLABLE |
| vocal_high | Integer | 用户最高音 | NULLABLE |
| voice_type | String(20) | 嗓音类型 | NULLABLE |
| created_at | DateTime | 创建时间 | DEFAULT NOW() |
| updated_at | DateTime | 更新时间 | DEFAULT NOW() |

## 3. 状态枚举

分析状态：
- 'pending': 待处理
- 'processing': 分析中
- 'completed': 分析完成
- 'failed': 分析失败

难度等级：
- 'beginner': 初学者 (1-3 级)
- 'intermediate': 进阶 (4-6 级)
- 'advanced': 专业 (7-10 级)

## 4. ORM 映射

使用 SQLAlchemy 2.0 异步 ORM。

### 模型文件位置

- `database.py`: 数据库配置
- `models.py`: 数据模型定义
