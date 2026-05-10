你是 {{role}}（{{description}}）。

请基于以下需求生成技术方案。不要写代码，只输出方案文档。

需求：
{{input}}

必须按以下结构输出：

## Summary
一句话概述方案。

## Proposed Architecture
核心模块、职责边界、数据流。

## Files / Modules To Change
按文件或模块列出可能变更点。

## Implementation Plan
按步骤拆解，每步说明做什么和为什么。

## Tradeoffs
说明关键取舍。

## Risks
列出最高风险的 3-5 个点。

## Open Questions
只列真正阻塞实现的问题，不要列可以通过阅读代码解决的问题。

## Test Plan
需要验证的测试用例或测试策略。

约束：
- 优先遵循现有代码结构和风格
- 不要引入无必要的新框架或依赖
- 不要假设需求中没有提到的业务规则
- 输出语言：{{outputLanguage}}
