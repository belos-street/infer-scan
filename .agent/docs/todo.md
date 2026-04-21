# Infer Scan 项目开发计划

# 阶段一：项目基础搭建

## 1.1 项目配置

- [ ] 安装核心依赖：langchain、dotenv、sarif-types
- [ ] 创建 `.env.example` 环境变量模板
- [ ] 更新 `.gitignore` 排除 `.env`、`output/`、`data/` 目录
- [ ] 创建 `output/` 和 `data/` 目录

## 1.2 类型定义

- [ ] 创建 `src/types/sast.ts`
  - `VulnerabilityFlow` 接口
  - `LlmSastResult` 接口
  - `ScanProgress` 接口
  - `FileChunk` 接口
- [ ] 创建 `src/types/sarif.ts`
  - SARIF 2.1.0 标准类型定义

## 1.3 配置模块

- [ ] 创建 `src/config/index.ts`
  - LLM 配置（模型、API、超时、重试）
  - 扫描配置（并发数、分片大小）
  - 向量数据库配置
  - 从环境变量读取配置

## 1.4 Prompt 模板

- [ ] 创建 `src/prompts/index.ts`
  - 代码分析 Prompt（漏洞检测 + 路径跟踪）
  - 校验 Prompt（结果验证）
  - 支持模板变量替换

# 阶段二：服务层实现

## 2.1 文件服务

- [ ] 创建 `src/services/file.service.ts`
  - 目录遍历与文件过滤
  - 编程语言识别（基于扩展名）
  - 代码分片（按函数边界对齐，MVP 简化版）
  - 行号映射记录
  - 上下文保留逻辑

## 2.2 LLM 服务

- [ ] 创建 `src/services/llm.service.ts`
  - LangChainJS LLM 调用封装
  - 结构化输出（JSON Schema 约束）
  - 失败重试（指数退避）
  - 超时控制

## 2.3 SARIF 服务

- [ ] 创建 `src/services/sarif.service.ts`
  - 将 `LlmSastResult` 转换为 SARIF 格式
  - 写入 `output/sarif.json`
  - 支持增量更新

# 阶段三：Agent 层实现

## 3.1 分析 Agent

- [ ] 创建 `src/agent/analyze.agent.ts`
  - 接收代码分片 + 规则上下文
  - 调用 LLM 进行漏洞检测
  - 输出 `LlmSastResult`
  - 缺陷路径跟踪（source → flow → sink）

## 3.2 校验 Agent

- [ ] 创建 `src/agent/validate.agent.ts`
  - 行号有效性校验（确定性规则）
  - 代码片段匹配校验
  - 过滤无效结果

## 3.3 调度 Agent

- [ ] 创建 `src/agent/scheduler.agent.ts`
  - 编排完整扫描流程
  - 文件遍历 → 分片 → 分析 → 校验 → 报告
  - 并发控制
  - 进度回调

# 阶段四：CLI 交互层

## 4.1 扫描进度页面

- [ ] 重构 `src/page/home-page.tsx` 为扫描进度页面
  - 进度条展示
  - 已扫描文件数 / 总文件数
  - 已发现漏洞数（高/中/低分布）
  - 当前处理文件路径
  - 扫描完成统计摘要

## 4.2 CLI 命令完善

- [ ] 更新 `src/cli/cli.ts`
  - `scan` 命令：指定路径扫描，触发进度页面
  - `config` 命令：显示当前配置
  - 参数校验与错误提示

# 阶段五：规则管理与 RAG

## 5.1 规则服务

- [ ] 创建 `src/services/rule.service.ts`
  - OWASP/CWE 规则定义（JSON 格式）
  - 规则向量化
  - 规则增删改查

## 5.2 RAG 服务

- [ ] 创建 `src/services/rag.service.ts`
  - 向量数据库连接（内存存储 MVP）
  - 规则向量加载
  - 语义检索最相关规则
  - 热点规则缓存

# 阶段六：集成与测试

## 6.1 端到端集成

- [ ] 串联完整流程：CLI → 调度 → 文件 → LLM → 校验 → SARIF
- [ ] 使用测试项目验证扫描功能
- [ ] 验证 SARIF 报告格式正确性

## 6.2 单元测试

- [ ] 创建 `test/` 目录
- [ ] 文件服务测试（分片逻辑、过滤逻辑）
- [ ] LLM 服务测试（重试逻辑、超时逻辑）
- [ ] SARIF 服务测试（格式转换）
- [ ] 校验 Agent 测试（行号校验、片段匹配）

## 6.3 容错与边界

- [ ] LLM 调用失败重试测试
- [ ] 空项目/超大文件处理
- [ ] 路径不存在提示
- [ ] 扫描中断恢复（断点续扫）

# 阶段七：优化与文档

## 7.1 性能优化

- [ ] 并发扫描优化（Bun 原生 API）
- [ ] 向量检索缓存
- [ ] 大文件分片策略调优

## 7.2 文档

- [ ] 更新 `README.md`
  - 项目介绍
  - 安装与使用
  - 配置说明
  - 开发指南

# 依赖安装清单

```bash
# LLM 框架
bun add @langchain/core @langchain/openai @langchain/community

# 向量存储（MVP 用内存）
bun add @langchain/core

# 环境变量
bun add dotenv

# SARIF 类型
bun add -d @types/sarif

# 测试（Bun 内置，无需额外安装）
```

# 里程碑

| 阶段 | 交付物 | 预计 |
|------|--------|------|
| 阶段一 | 项目骨架、类型、配置 | Day 1 |
| 阶段二 | 文件服务、LLM 服务、SARIF 服务 | Day 1-2 |
| 阶段三 | 三个 Agent 实现 | Day 2-3 |
| 阶段四 | CLI 交互界面 | Day 3 |
| 阶段五 | 规则管理 + RAG | Day 3-4 |
| 阶段六 | 集成测试、单元测试 | Day 4-5 |
| 阶段七 | 优化、文档 | Day 5 |
