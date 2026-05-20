# API 接口规格文档

## 概述

本文档描述 WannaSing 后端 API 接口规格。

## 基础信息

- Base URL: `http://localhost:8000`
- 协议: HTTP/HTTPS
- 数据格式: JSON
- 字符编码: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {}
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## 接口列表

### 1. 健康检查

**接口：** `GET /api/health`

**说明：** 检查服务是否正常运行

**响应：**

```json
{
  "status": "ok"
}
```

---

### 2. 哼唱生成伴奏

**接口：** `POST /api/generate`

**说明：** 提交哼唱音频，AI 生成伴奏

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio | String | 是 | Base64 编码的音频 |
| style | String | 是 | 音乐风格 (pop/piano/lofi/rock/rnb/electronic) |
| duration | Integer | 否 | 生成时长 (秒)，默认 30 |

**请求示例：**

```json
{
  "audio": "data:audio/wav;base64,UklGR...",
  "style": "pop",
  "duration": 30
}
```

**响应示例：**

```json
{
  "success": true,
  "audio_url": "https://example.com/generated/xxx.mp3",
  "duration": 30
}
```

---

### 3. 歌曲分析 - 提交

**接口：** `POST /api/v1/analyze`

**说明：** 上传歌曲文件，进行分析

**请求格式：** `multipart/form-data`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 音频文件 (MP3/WAV/M4A) |

**响应示例：**

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "song_info": {
    "filename": "song.mp3",
    "duration": 240
  },
  "analysis": {
    "pitch": {
      "lowest_note": 48,
      "lowest_note_name": "C3",
      "highest_note": 72,
      "highest_note_name": "C5",
      "vocal_range": 24,
      "mean_pitch": 60,
      "pitch_variation": 8.5,
      "max_jump": 12
    },
    "rhythm": {
      "bpm": 120,
      "beat_count": 480,
      "duration_seconds": 240,
      "syncopation_score": 3.5,
      "rhythm_type": "medium"
    },
    "structure": {
      "segment_count": 8,
      "segments": []
    }
  },
  "difficulty": {
    "total": 6,
    "level": "intermediate",
    "level_name": "进阶",
    "breakdown": {
      "vocal_range": 6,
      "highest_note": 7,
      "tempo": 5
    }
  },
  "tips": [
    "这首歌音域较宽，注意换声区的平滑过渡"
  ]
}
```

---

### 4. 获取分析结果

**接口：** `GET /api/v1/analyze/{task_id}`

**说明：** 根据任务 ID 获取分析结果

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | String | 是 | 任务 ID |

**响应示例：** 同上

---

### 5. 分析历史

**接口：** `GET /api/v1/history`

**说明：** 获取分析历史列表

**查询参数：**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| skip | Integer | 否 | 0 | 跳过数量 |
| limit | Integer | 否 | 10 | 返回数量 |

**响应示例：**

```json
{
  "total": 5,
  "items": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "song.mp3",
      "difficulty_total": 6,
      "difficulty_level": "intermediate",
      "analyzed_at": "2026-05-18T10:30:00Z"
    }
  ]
}
```

## 错误码

| HTTP 状态码 | 错误码 | 说明 |
|------------|--------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 404 | NOT_FOUND | 资源不存在 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |
| 500 | ANALYSIS_FAILED | 分析失败 |

## API 文档

启动服务后，访问：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
