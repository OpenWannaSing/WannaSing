# WannaSing 本地测试环境

## 项目结构

```
WannaSing/
├── app.py                    # FastAPI主应用
├── audio_service.py          # 音频存储服务
├── database.py              # 数据库配置
├── models.py                # 数据模型
├── init_db.py              # 数据库初始化脚本
├── requirements.txt         # Python依赖
├── .env.example           # 环境变量示例
├── pytest.ini             # pytest配置
├── tests/                 # 测试目录
│   ├── conftest.py       # 测试配置
│   ├── test_api.py       # API接口测试
│   ├── test_models.py    # 数据模型测试
│   └── test_audio_service.py  # 音频服务测试
├── services/             # 业务服务
├── frontend/             # 前端
└── .wannasing/           # 数据存储目录
    ├── data/
    │   └── audio/        # 音频文件
    └── wanasing.db      # SQLite数据库
```

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
python init_db.py
```

### 4. 启动后端服务

```bash
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 5. 访问API文档

- Swagger UI: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

## API接口

### 健康检查
```
GET /api/health
```

### 音频上传
```
POST /api/v1/upload
Content-Type: multipart/form-data
```

### 获取音频
```
GET /api/v1/audio/{audio_id}
```

### 删除音频
```
DELETE /api/v1/audio/{audio_id}
```

### 保存演唱记录
```
POST /api/v1/performance
```

### 生成伴奏
```
POST /api/generate
```

### 歌曲分析
```
POST /api/v1/analyze
```

### 获取分析历史
```
GET /api/v1/history
```

## 运行测试

### 安装测试依赖

```bash
pip install pytest pytest-asyncio httpx
```

### 运行所有测试

```bash
pytest
```

### 运行特定测试

```bash
# 运行API测试
pytest tests/test_api.py

# 运行音频服务测试
pytest tests/test_audio_service.py

# 运行模型测试
pytest tests/test_models.py
```

### 带覆盖率的测试

```bash
pytest --cov=. --cov-report=html
```

## 数据目录

所有数据存储在 `.wannasing/` 目录下：

- `.wannasing/wanasing.db` - SQLite数据库文件
- `.wannasing/data/audio/` - 音频文件存储目录
  - `performances/` - 用户演唱作品
  - `ai_generated/` - AI生成作品
  - `temp/` - 临时文件

## 测试环境说明

本地测试环境使用SQLite数据库，无需额外安装数据库软件。

### 数据库表结构

- `users` - 用户表
- `audio_metadata` - 音频元数据表
- `performances` - 演唱记录表
- `ai_creations` - AI创作表
- `song_analysis` - 歌曲分析表
- `user_profiles` - 用户资料表

## 常见问题

### 端口被占用

修改端口：
```bash
python -m uvicorn app:app --reload --port 8001
```

### 音频文件权限

确保 `.wannasing/data/` 目录有读写权限。

### 测试数据库

测试使用独立的测试数据库 `test_wanasing.db`，不会影响主数据库。
