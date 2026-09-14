# DeepEval × Langfuse 评估集成

让 DeepEval 做指标引擎（pytest 式评测、CI 门禁），Langfuse 做可视化
（轨迹回放、分数看板、历史对比）——开源替代 Confident AI 的组合方案。

```
被测 Agent (@observe 打点)
        │  轨迹 + spans
        ▼
   Langfuse (轨迹库)
        ▲
        │  score(trace_id, name, value, reason)
DeepEval 指标 (AnswerRelevancy / GEval / Faithfulness ...)
```

## 组成

| 文件 | 说明 |
|---|---|
| `langfuse_deepeval/reporter.py` | 上报器：跑 DeepEval 指标并把分数（含理由、阈值判定）写到 Langfuse trace |
| `examples/test_agent_with_evals.py` | 端到端示例：agent 轨迹 + 指标评估同 trace 展示 |

## 快速开始（对接本地 eval-platform 的 Langfuse）

```bash
cd integrations/deepeval-langfuse
pip install -r requirements.txt

# 密钥在 eval-platform/.env 里（LF_PUBLIC_KEY / LF_SECRET_KEY）
export LANGFUSE_PUBLIC_KEY=<LF_PUBLIC_KEY 的值>
export LANGFUSE_SECRET_KEY=<LF_SECRET_KEY 的值>
export LANGFUSE_HOST=http://localhost:3000
export OPENAI_API_KEY=<裁判模型 key>          # DeepEval LLM-as-judge 用

python examples/test_agent_with_evals.py
```

跑完打开 Langfuse → **Traces（链路）** → 点开 `refund-agent-demo`，
右侧 **Scores** 区显示每个指标的分数、`✅ PASS / ❌ FAIL` 与评判理由。

## 在自己的评测里使用

```python
from langfuse_deepeval.reporter import LangfuseDeepEvalReporter
from deepeval.metrics import FaithfulnessMetric
from deepeval.test_case import LLMTestCase

reporter = LangfuseDeepEvalReporter()

test_case = LLMTestCase(
    input="用户问题",
    actual_output="你的应用输出",
    retrieval_context=["RAG 检索到的片段"],   # Faithfulness 需要
)
reporter.report(test_case, [FaithfulnessMetric(threshold=0.8, include_reason=True)])
reporter.close()
```

- 有现成轨迹：`report(..., trace_id=...)` 把分数挂上去；
- 没有轨迹：自动创建一条（input/output 齐全），适合离线批量评测数据集。

## 换裁判模型（国内场景）

DeepEval 默认用 OpenAI 当裁判，接入 OpenAI 兼容端点（智谱/DeepSeek/vLLM 等）：

```bash
deepeval set openai base_url https://open.bigmodel.cn/api/paas/v4
deepeval set openai api_key your-key
```

或代码里构造 `GPTModel(model_name=..., base_url=..., api_key=...)`
传给指标的 `model=` 参数。

## 进 CI

DeepEval 侧的 pytest 断言（`assert_test`）负责让流水线在低于阈值时失败；
Langfuse 侧留痕用于看板对比与回归分析。两者互不依赖，可独立启用。
