# 星运日历(astro-calendar)

跨平台日历应用，把日历、农历黄历、十二时辰、节气月相、运势放在同一个首页——打开即知"今天什么日子、现在什么时辰、此刻适合做什么"。

面向 Android、iOS、H5 和微信小程序，基于 `uni-app + Vue 3 + TypeScript`。

## 功能

| 模块 | 说明 |
|------|------|
| 首页日历 | 年/月/周/日视图，可配置每周第一天，吉日标记圆点 |
| 日期详情 | 选中日期直接在首页展示，模块可配置显示/隐藏 |
| 十二时辰 | 轮盘/列表双视图，当前时辰前置，默认视图可配置 |
| 节气月相 | 月相、节气、七十二候、数九三伏，卡片展开详情 |
| 运势 | 黄历日运 + 星座运势，古→今→悟三段式解读 |
| 择吉日 | 6 大场景筛选，天数/月份范围，吉日评分与最佳吉时 |
| 八字生肖 | 命盘详解 + 观时现代化解读 + 大运推演 |
| 祈福点灯 | 6 种灯型，仪式交互与记录 |
| 设置 | 每周第一天、首页布局、时辰视图、假期自动更新 |

## 设计理念：观时

**古→今→悟** — 保留传统信息，翻译成现代行动建议，再给一句点悟。贯穿运势、八字、月相各页面。

## 技术栈

`uni-app` · `Vue 3` · `TypeScript` · `lunar-typescript` · `Cloudflare Workers + D1`

数据策略：后端 API 优先，失败时本地降级。

## 项目结构

```
src/
├── pages/
│   ├── home/          # 首页日历与日期详情
│   ├── fortune/       # 运势
│   ├── zodiac/        # 八字命盘
│   ├── lucky-days/    # 择吉日
│   ├── blessing/      # 祈福点灯
│   ├── settings/      # 设置
│   └── day-detail/    # 日期详情（独立页）
├── components/        # TabBar、时辰转盘、时间轴
├── services/          # 日历、黄历、八字、运势等业务逻辑
├── types/             # 共享类型
└── styles/            # 全局主题（--gs-* 设计变量）
backend/               # Cloudflare Workers API
```

## 快速开始

```bash
npm install
npm run dev:h5        # H5 开发
npm run dev:mp-weixin # 微信小程序开发
npm run dev:app       # App 开发
```

前端默认请求 `http://127.0.0.1:8787`，真机调试可通过 `VITE_API_BASE_URL` 指向局域网地址。

```bash
npm run typecheck     # 类型检查
npm run build:h5      # H5 构建
npm run build:mp-weixin  # 小程序构建
```
