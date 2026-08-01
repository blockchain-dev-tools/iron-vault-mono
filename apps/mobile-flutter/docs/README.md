# docs/ — 项目文档工作区

## 目录结构

```
docs/
├── README.md            ← 本文档：目录结构说明
├── adr/                 ← 架构决策记录 (Architecture Decision Records)
│   ├── template.md      ← ADR 模板
│   └── .gitkeep
├── learning/            ← 学习笔记 & 技术调研
│   ├── template.md      ← 学习笔记模板
│   ├── roadmap.md       ← Flutter 学习路线
│   └── .gitkeep
├── tasks/               ← 任务描述（工作起点）
│   ├── task1.md         ← 当前任务
│   └── templates/
│       └── task-template.md
├── discusses/           ← 讨论记录（方案沟通）
│   ├── template.md      ← 讨论记录模板
│   └── .gitkeep
├── devlog/              ← 开发日志 & 进度追踪
│   ├── template.md      ← 开发日志模板
│   ├── workflow.md      ← 开发工作流规范
│   └── .gitkeep
└── references/          ← 参考资料 & API 手册
    └── .gitkeep
```

## 工作流概览

```
写任务描述 (tasks/) → 讨论方案 (discusses/) → 开始编码 → 记日志 (devlog/) → 记录决策 (adr/)
                                                      ↓
                                              学新东西 → 记笔记 (learning/)
```

## 各目录职责

| 目录 | 用途 | 谁写 |
|---|---|---|
| `adr/` | 记录重要架构决策：背景、方案选项、最终选择及理由 | Agent / 用户 |
| `learning/` | Flutter/Dart/Rust 学习笔记、踩坑记录、技术调研 | Agent（面向用户） |
| `tasks/` | 任务描述：需求、拆解、涉及文件 | 用户写想法 → Agent 精炼 |
| `discusses/` | 方案讨论：备选方案对比、技术权衡 | Agent & 用户协作 |
| `devlog/` | 开发日志：每日进展、遇到的问题、下一步计划 | Agent |
| `references/` | 外部参考资料链接、API 速查、架构图 | Agent |
