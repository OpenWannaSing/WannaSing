FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖（SQLite 已内置，只需基础工具）
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖（不含 librosa，精简 200MB+）
COPY requirements-render.txt .
RUN pip install --no-cache-dir -r requirements-render.txt

# 复制项目代码
COPY . .

# Koyeb 默认端口
EXPOSE 8000

# 使用 $PORT 环境变量（Koyeb 自动分配）
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
