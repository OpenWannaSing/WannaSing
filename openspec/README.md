# WannaSing OpenSpec 规格说明书

## 项目概述

WannaSing 是一款 AI 驱动的音乐创作与声乐训练平台，主要功能包括：

- 🎤 **哼唱成曲** - 哼唱旋律，AI 生成完整伴奏
- 📊 **歌曲分析** - 多维度分析歌曲，生成演唱指导
- 🎵 **声乐训练** - 实时音准检测与反馈

## 文档结构

```
openspec/
├── README.md                          # 本文档
├── specs/
│   ├── prd/                           # 产品需求文档
│   │   ├── 01-hum-to-track.md        # 哼唱成曲需求
│   │   └── 02-song-analysis.md       # 歌曲分析需求
│   ├── api/                           # API 接口文档
│   │   └── api-spec.md               # API 规格
│   ├── tech/                          # 技术规格
│   │   ├── architecture.md           # 架构设计
│   │   ├── database.md               # 数据库设计
│   │   └── deployment.md             # 部署配置
│   ├── design/                        # 设计规格
│   │   └── user-flows.md             # 用户流程
│   └── ui/                            # UI 设计规范
│       └── ui-style-guide.md         # 样式指南
└── assets/                           # 资源文件
```

## 快速开始

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + TypeScript + Tailwind CSS |
| 后端 | Python + FastAPI |
| 音频处理 | Librosa |
| 数据库 | SQLite (可切换 MySQL/PostgreSQL) |

### 开发环境

- 前端: `/frontend` - React 项目
- 后端: `/` - FastAPI 项目（已移至根目录）
- 数据: `/.wannasing/` - 应用数据目录

## 版本信息

| 属性 | 内容 |
|------|------|
| 项目名称 | WannaSing |
| 版本号 | v1.0.0 |
| 最后更新 | 2026-05-18 |
| 状态 | 🚧 开发中 |
