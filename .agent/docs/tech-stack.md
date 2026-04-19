# 技术栈说明

## 包管理器

- **Bun** - 运行时和包管理器，同时用于测试

## CLI 框架

- **Commander** - CLI 命令解析和路由
- **Ink** - React CLI 渲染器（v7+），用于构建交互式终端界面
- **Chalk** - 终端字符串样式化
- **Figlet** - ASCII 艺术字生成
- **Cli-progress** - 终端进度条
- **Minimist** - 轻量级参数解析

## UI 技术栈

- **React 19** - UI 组件库
- **Ink** - 将 React 组件渲染到终端，支持 Flexbox 布局

## 语言与工具

- **TypeScript 5** - 类型系统
- **Bun** - 运行时、包管理、测试

## 测试

- **Bun.test** - Bun 内置的测试框架

## 项目结构

```
src/
  cli/          # CLI 命令定义
  page/         # Ink React 页面组件
  index.ts      # 入口文件
```
