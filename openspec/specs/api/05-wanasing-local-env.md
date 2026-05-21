# WanaSing 本地测试环境 API 规格文档

## 概述

本文档描述 WannaSing 本地测试环境的 API 接口规格，基于 SQLite + 文件系统存储方案。

## 基础信息

- Base URL: `http://localhost:8000`
- 协议: HTTP
- 数据格式: JSON / multipart/form-data
- 字符编码: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 错误响应

```json
{
  "code": <错误码>,
  "message": "<错误描述>"
}
```

## 接口列表

### 1. 健康检查

**接口：** `GET /health`

**说明：** 检查服务是否正常运行

**响应示例：**

```json
{
  "status": "ok",
  "database": "sqlite"
}
```

---

### 2. 上传音频文件

**接口：** `POST /api/v1/upload`

**说明：** 上传音频文件到本地存储，支持 MP3、WAV、M4A 格式

**请求格式：** `multipart/form-data`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 音频文件 (MP3/WAV/M4A) |
| user_id | Integer | 是 | 上传用户 ID |
| business_type | String | 是 | 业务类型 (performance/ai_generated/temp) |

**business_type 可选值：**

| 值 | 说明 |
|----|------|
| performance | 用户演唱作品 |
| ai_generated | AI 生成作品 |
| temp | 临时文件 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "audio_id": 1,
    "file_key": "performances/1/20250119_143022_a1b2c3d4.mp3",
    "file_name": "my_recording.mp3",
    "file_size": 5242880,
    "duration": 180
  }
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| audio_id | Integer | 音频文件唯一标识 |
| file_key | String | 文件存储路径（模拟 OSS Key） |
| file_name | String | 原始文件名 |
| file_size | Integer | 文件大小（字节） |
| duration | Integer | 音频时长（秒） |

**错误码：**

| HTTP 状态码 | message | 说明 |
|------------|---------|------|
| 400 | 不支持的文件类型，仅支持: [.mp3, .wav, .m4a] | 文件类型不支持 |
| 413 | 上传失败: 文件过大: {size} > {max_size} | 文件超过限制 |
| 500 | 上传失败: {错误信息} | 服务器错误 |

---

### 3. 保存演唱记录

**接口：** `POST /api/v1/performance`

**说明：** 保存用户的演唱记录

**请求格式：** `multipart/form-data`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | Integer | 是 | 用户 ID |
| song_name | String | 是 | 歌曲名称 |
| score | Float | 是 | 演唱得分 (0-100) |
| original_audio_id | Integer | 是 | 原始音频 ID |
| tuned_audio_id | Integer | 否 | 调音后音频 ID |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "performance_id": 1
  }
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| performance_id | Integer | 演唱记录唯一标识 |

---

### 4. 获取音频文件

**接口：** `GET /api/v1/audio/{audio_id}`

**说明：** 根据音频 ID 获取音频文件

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio_id | Integer | 是 | 音频文件 ID |

**响应：**

- Content-Type: `audio/mpeg` / `audio/wav` / `audio/mp4`
- 返回音频文件流

**错误响应：**

```json
{
  "detail": "音频不存在"
}
```

| HTTP 状态码 | detail | 说明 |
|------------|--------|------|
| 404 | 音频不存在 | 音频文件不存在或已删除 |

---

### 5. 删除音频文件

**接口：** `DELETE /api/v1/audio/{audio_id}`

**说明：** 删除指定的音频文件，支持软删除和硬删除

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio_id | Integer | 是 | 音频文件 ID |

**查询参数：**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| hard | Boolean | 否 | false | true: 硬删除（同时删除物理文件），false: 软删除（仅标记删除） |

**响应示例：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

**错误响应：**

```json
{
  "detail": "文件不存在: {audio_id}"
}
```

---

### 6. 获取音频元数据

**接口：** `GET /api/v1/audio/{audio_id}/metadata`

**说明：** 获取音频文件的元数据信息

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audio_id | Integer | 是 | 音频文件 ID |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "file_key": "performances/1/20250119_143022_a1b2c3d4.mp3",
    "file_name": "my_recording.mp3",
    "file_size": 5242880,
    "file_hash": "d41d8cd98f00b204e9800998ecf8427e",
    "duration": 180,
    "user_id": 1,
    "business_type": "performance",
    "created_at": "2025-01-19T14:30:22"
  }
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 音频 ID |
| file_key | String | 文件存储路径 |
| file_name | String | 文件名 |
| file_size | Integer | 文件大小（字节） |
| file_hash | String | MD5 哈希值 |
| duration | Integer | 时长（秒） |
| user_id | Integer | 上传用户 ID |
| business_type | String | 业务类型 |
| created_at | String | 创建时间 |

---

### 7. 清理临时文件

**接口：** `DELETE /api/v1/audio/temp`

**说明：** 清理超过指定时间的临时文件

**查询参数：**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| hours | Integer | 否 | 24 | 清理超过指定小时的临时文件 |

**响应示例：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deleted_count": 5
  }
}
```

---

## 业务类型说明

### 文件 Key 命名规范

| 业务类型 | Key 格式 | 示例 |
|---------|---------|------|
| 演唱作品 | performances/{user_id}/{timestamp}_{uuid}.mp3 | performances/1/20250119_143022_a1b2c3d4.mp3 |
| AI 生成 | ai_generated/{user_id}/{timestamp}_{uuid}.mp3 | ai_generated/1/20250119_143022_e5f6g7h8.mp3 |
| 临时文件 | temp/{user_id}/{timestamp}_{uuid}.mp3 | temp/1/20250119_143022_i9j0k1l2.mp3 |

### 存储目录结构

```
data/
├── audio/
│   ├── performances/       # 用户演唱作品
│   ├── ai_generated/       # AI 生成作品
│   └── temp/               # 临时文件
└── wanasing.db             # SQLite 数据库
```

## 数据库表结构

### audio_metadata 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| file_key | VARCHAR(500) | 文件路径（唯一） |
| file_name | VARCHAR(255) | 原始文件名 |
| file_size | INTEGER | 文件大小（字节） |
| file_hash | VARCHAR(64) | MD5 哈希值 |
| mime_type | VARCHAR(50) | MIME 类型 |
| duration | INTEGER | 音频时长（秒） |
| user_id | INTEGER | 上传用户 ID |
| business_type | VARCHAR(30) | 业务类型 |
| business_id | INTEGER | 关联业务记录 ID |
| status | VARCHAR(20) | 状态 (active/deleted) |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### performances 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户 ID |
| song_name | VARCHAR(200) | 歌曲名称 |
| artist | VARCHAR(100) | 歌手 |
| score | DECIMAL(5,2) | 演唱得分 |
| original_audio_id | INTEGER | 原始音频 ID |
| tuned_audio_id | INTEGER | 调音后音频 ID |
| status | VARCHAR(20) | 状态 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | VARCHAR(50) | 用户名（唯一） |
| email | VARCHAR(100) | 邮箱（唯一） |
| nickname | VARCHAR(50) | 昵称 |
| created_at | TIMESTAMP | 创建时间 |

## 错误码

| HTTP 状态码 | 错误码 (code) | message 关键词 | 说明 |
|------------|---------------|----------------|------|
| 400 | - | 不支持的文件类型 | 文件类型不支持 |
| 400 | - | 文件过大 | 文件超过大小限制 |
| 404 | - | 音频不存在 | 音频文件不存在 |
| 404 | - | 文件不存在 | 删除时文件不存在 |
| 413 | - | 上传失败 | 文件过大 |
| 500 | - | 上传失败 | 服务器错误 |

## 配置说明

### 环境变量 (.env)

```env
# SQLite 配置
DATABASE_PATH=./data/wanasing.db

# 文件存储配置
AUDIO_ROOT=./data/audio
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS=.mp3,.wav,.m4a

# 服务配置
API_PORT=8000
DEBUG=true
```

## API 文档

启动服务后，可访问交互式 API 文档：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 使用示例

### Python 请求示例

```python
import requests

# 上传音频
url = "http://localhost:8000/api/v1/upload"
with open("test.mp3", "rb") as f:
    files = {"file": ("test.mp3", f, "audio/mpeg")}
    data = {"user_id": 1, "business_type": "performance"}
    response = requests.post(url, files=files, data=data)

# 获取音频
audio_id = response.json()["data"]["audio_id"]
audio_url = f"http://localhost:8000/api/v1/audio/{audio_id}"
response = requests.get(audio_url)
with open("downloaded.mp3", "wb") as f:
    f.write(response.content)

# 保存演唱记录
url = "http://localhost:8000/api/v1/performance"
data = {
    "user_id": 1,
    "song_name": "十年",
    "score": 85.5,
    "original_audio_id": audio_id
}
response = requests.post(url, data=data)
```

### cURL 示例

```bash
# 健康检查
curl http://localhost:8000/health

# 上传音频
curl -X POST "http://localhost:8000/api/v1/upload" \
  -F "file=@test.mp3" \
  -F "user_id=1" \
  -F "business_type=performance"

# 获取音频
curl -O "http://localhost:8000/api/v1/audio/1"

# 删除音频（软删除）
curl -X DELETE "http://localhost:8000/api/v1/audio/1"

# 删除音频（硬删除）
curl -X DELETE "http://localhost:8000/api/v1/audio/1?hard=true"
```
