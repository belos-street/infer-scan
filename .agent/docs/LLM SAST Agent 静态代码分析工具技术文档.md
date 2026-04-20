# Infer Scan - LLM 驱动静态代码分析工具技术文档

# 1. 文档概述

## 1.1 文档目的

本文档定义 Infer Scan 静态代码分析工具的技术规范、架构设计及实现细节，作为开发落地的核心依据。工具定位为纯 LLM 驱动的 CLI 安全扫描工具，面向缺乏成熟 SAST 生态的编程语言场景。

## 1.2 适用范围

适用于工具开发人员，明确各模块职责、接口规范及数据标准。

# 2. 技术目标

| 目标维度 | 具体要求 |
|----------|----------|
| 核心目标 | LLM 驱动的静态分析 Agent，输出标准 SARIF 2.1.0 报告 |
| 语言覆盖 | 全语言通用，零单独建模 |
| 交互体验 | React + Ink 实现 CLI 可视化，对标 Claude Code CLI |
| 规则管理 | 向量数据库 + RAG 检索，支持 OWASP/CWE 规则灵活扩展 |
| 开发周期 | 3-5 天完成 MVP |

# 3. 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| 运行时 | Bun | 极速 IO、原生 TypeScript、并发能力 |
| 语言 | TypeScript 5 | 强类型校验 |
| LLM 调用 | LangChainJS | Agent 调度、Prompt 管理、结构化输出 |
| CLI 交互 | React 19 + Ink 7 | 终端可视化界面 |
| 规则检索 | 向量数据库 + RAG | OWASP/CWE 规则存储与语义检索 |
| 报告生成 | sarif-types | SARIF 2.1.0 标准报告 |
| 包管理 | Bun | 依赖安装、测试 |
| 测试 | Bun.test | 单元测试 |
| 配置管理 | dotenv | 环境变量管理 |

# 4. 核心功能

## 4.1 文件遍历与过滤

- 自动遍历指定目录下所有代码文件
- 过滤无效目录：`node_modules`、`dist`、`.git`、日志、图片、压缩包等
- 基于文件扩展名识别编程语言（`.ts`/`.js`/`.go`/`.php`/`.py`/`.java` 等）
- 实时统计并展示扫描文件总数

## 4.2 代码分片

### 4.2.1 分片策略（MVP 简化版）

- 单分片上限：1000 Token
- 切割方式：按函数边界对齐，优先保证函数完整性
- 行号映射：保留原始行号信息，确保漏洞定位准确

### 4.2.2 上下文处理

- 每个分片（除首个）携带前序 10-20 Token 上下文
- 分片末尾标记是否为不完整片段
- 保留原始代码（含注释），由 LLM 自行判断

### 4.2.3 后续优化方向

- 引入语法解析器（如 tree-sitter）实现类/函数/代码块级语义切割
- 动态调整分片大小（500-1000 Token）适配不同语言 Token 密度

## 4.3 漏洞检测

- 基于 LLM 语义理解，结合 RAG 检索的 OWASP Top10 2021 + CWE 规则
- 支持漏洞类型：
  - SQL 注入（CWE-89）
  - XSS 跨站脚本（CWE-79）
  - 硬编码密钥（CWE-798）
  - 路径穿越（CWE-22）
  - 代码执行（CWE-94）
  - 失效的访问控制（OWASP A01）
  - 失效的身份认证（OWASP A02）

## 4.4 缺陷路径跟踪

输出标准化漏洞传播路径：`source → flow → sink`

```typescript
interface VulnerabilityFlow {
  source: string;    // 污染源（如用户输入、硬编码内容）
  flow: string[];    // 传播链路（无传播则为空数组）
  sink: string;      // 漏洞触发点
}
```

## 4.5 结果校验

采用确定性规则 + LLM 辅助的混合校验方案：

| 校验维度 | 方式 | 说明 |
|----------|------|------|
| 行号有效性 | 确定性规则 | 验证漏洞行号是否在文件中存在 |
| 代码片段匹配 | 确定性规则 | 验证 LLM 引用的代码片段是否匹配 |
| 描述合理性 | LLM 辅助 | 轻量模型判断漏洞描述是否合理 |

## 4.6 CLI 交互

- 命令行参数指定扫描路径（默认扫描当前目录）
- 实时展示：进度条、已扫描文件数、已发现漏洞数
- 扫描完成提示：SARIF 报告路径、漏洞统计
- 异常处理：路径不存在、LLM 调用失败、文件读取异常

## 4.7 SARIF 报告生成

- 输出路径：`output/sarif.json`
- 遵循 SARIF 2.1.0 标准
- 包含：工具信息、规则 ID、漏洞等级、描述、位置、缺陷路径、修复建议、OWASP/CWE 关联

## 4.8 规则管理

- OWASP/CWE 规则向量化存储
- 支持规则新增、修改、删除
- 基于代码片段语义检索最相关规则，降低 Token 消耗

# 5. 非功能需求

## 5.1 性能指标

| 指标 | 目标值 | 前提条件 |
|------|--------|----------|
| 单文件扫描延迟 | 3-10 秒 | 取决于 LLM 响应速度 |
| 并发扫描 | CPU 核心数 - 1 进程 | Bun 原生并发 API |
| 向量检索延迟 | ≤50ms（热点规则） | 本地缓存 |
| 百万行代码扫描 | ≤30 分钟 | API 并发充足，模型响应 ≤5s |

## 5.2 容错设计

| 场景 | 策略 |
|------|------|
| LLM 调用失败 | 重试 3 次，指数退避（1s/2s/4s），超时 30s |
| 文件读取异常 | 跳过异常文件，记录日志，不影响整体流程 |
| 向量数据库不可用 | 降级加载本地规则缓存 |
| 进程崩溃 | 记录崩溃日志，自动恢复对应文件扫描 |
| 扫描中断 | 持久化进度（每 10 文件更新），支持断点续扫 |
| 报告生成失败 | 重试 2 次，失败后输出临时漏洞清单（JSON） |

## 5.3 兼容性

- 系统：Windows / macOS / Linux，Bun 1.0+
- 报告：SARIF 2.1.0，兼容 SonarQube 等 SAST 平台
- 向量数据库：Chroma / 内存向量存储（可切换）

## 5.4 配置管理

通过 `.env` 文件管理敏感配置：

```env
LLM_API_KEY=your_api_key
LLM_MODEL=qwen2.5-code
LLM_BASE_URL=http://localhost:11434/v1
VECTOR_DB_PATH=./data/rules
MAX_CONCURRENCY=4
LLM_TIMEOUT=30000
LLM_MAX_RETRIES=3
```

# 6. 架构设计

## 6.1 分层架构

```
┌─────────────────────────────────────────┐
│           CLI 交互层 (Ink)               │
├─────────────────────────────────────────┤
│           Agent 调度层                   │
├──────────┬──────────┬───────────────────┤
│ 分析Agent │ 校验Agent │    服务支撑层      │
├──────────┴──────────┴───────────────────┤
│           数据层                         │
└─────────────────────────────────────────┘
```

## 6.2 模块职责

| 层级 | 模块 | 职责 |
|------|------|------|
| 入口层 | `main.ts` | 启动 CLI，解析参数，触发扫描 |
| CLI 层 | `cli/cli.ts` | Commander 命令定义 |
| CLI 层 | `page/home-page.tsx` | Ink 交互界面 |
| Agent 层 | `scheduler.agent.ts` | 总控扫描流程编排 |
| Agent 层 | `analyze.agent.ts` | LLM 漏洞检测 + 路径跟踪 |
| Agent 层 | `validate.agent.ts` | 结果校验与幻觉过滤 |
| 服务层 | `file.service.ts` | 文件遍历、代码分片、语言识别 |
| 服务层 | `llm.service.ts` | LLM 调用封装（LangChainJS） |
| 服务层 | `rag.service.ts` | 向量数据库连接与 RAG 检索 |
| 服务层 | `rule.service.ts` | OWASP/CWE 规则管理 |
| 服务层 | `sarif.service.ts` | SARIF 报告生成 |

## 6.3 目录结构

```
infer-scan/
├── main.ts                     # 项目主入口
├── package.json                # 依赖管理
├── tsconfig.json               # TypeScript 配置
├── .env                        # 环境变量（不提交）
├── .env.example                # 环境变量模板
├── output/                     # 输出目录：sarif.json
├── data/                       # 向量数据库存储
├── src/
│   ├── cli/                    # CLI 命令定义
│   │   └── cli.ts
│   ├── page/                   # Ink 页面组件
│   │   └── home-page.tsx
│   ├── config/                 # 全局配置
│   │   └── index.ts
│   ├── types/                  # 类型定义
│   │   ├── sast.ts
│   │   └── sarif.ts
│   ├── prompts/                # Prompt 模板
│   │   └── index.ts
│   ├── services/               # 服务层
│   │   ├── file.service.ts
│   │   ├── llm.service.ts
│   │   ├── rag.service.ts
│   │   ├── rule.service.ts
│   │   └── sarif.service.ts
│   ├── agent/                  # Agent 层
│   │   ├── scheduler.agent.ts
│   │   ├── analyze.agent.ts
│   │   └── validate.agent.ts
│   └── utils/                  # 工具函数
│       └── index.ts
└── test/                       # 单元测试
    └── *.test.ts
```

# 7. 数据规范

## 7.1 漏洞结果类型

```typescript
interface LlmSastResult {
  language: string;                    // 编程语言
  filePath: string;                    // 文件路径
  startLine: number;                   // 起始行号
  endLine: number;                     // 结束行号
  ruleId: string;                      // CWE 编号
  owasp: string;                       // OWASP 编号
  severity: "high" | "medium" | "low"; // 漏洞等级
  description: string;                 // 漏洞描述
  recommendation: string;              // 修复建议
  flow: VulnerabilityFlow;             // 缺陷路径
}
```

## 7.2 SARIF 报告示例

```json
{
  "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "Infer Scan",
          "version": "1.0.0"
        }
      },
      "results": [
        {
          "ruleId": "CWE-89",
          "level": "error",
          "message": {
            "text": "存在 SQL 注入漏洞，不可信用户输入直接拼接 SQL 语句"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "src/api/user.go"
                },
                "region": {
                  "startLine": 28,
                  "endLine": 28
                }
              }
            }
          ],
          "properties": {
            "owasp": "A03",
            "flow": {
              "source": "用户 HTTP 请求参数 id = req.query.id",
              "flow": ["参数 id 赋值给变量 userId", "变量 userId 直接拼接到 SQL 查询字符串"],
              "sink": "执行 SQL 语句：db.query(`SELECT * FROM user WHERE id=${userId}`)"
            },
            "recommendation": "使用参数化查询替代字符串拼接"
          }
        }
      ]
    }
  ]
}
```

# 8. 使用方式

```bash
# 安装依赖
bun install

# 配置环境变量
cp .env.example .env

# 启动交互界面
bun run dev

# 扫描指定项目
bun run main.ts scan -t /path/to/project

# 查看帮助
bun run main.ts --help
```
