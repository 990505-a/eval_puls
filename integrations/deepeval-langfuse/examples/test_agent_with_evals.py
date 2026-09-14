"""端到端示例：被测 agent 打轨迹 -> DeepEval 评估 -> 分数写回同一条轨迹。

运行后在 Langfuse UI（默认 http://localhost:3000）的「Traces」里点开
`refund-agent-demo` 轨迹，右侧 Scores 区即可看到每个 DeepEval 指标的
得分、是否过阈值和评判理由——相当于 Confident AI 的「轨迹 + 评估」体验。

环境变量（可从 eval-platform/.env 的 LF_* 导出）:
    export LANGFUSE_PUBLIC_KEY=pk-lf-...
    export LANGFUSE_SECRET_KEY=sk-lf-...
    export LANGFUSE_HOST=http://localhost:3000
    export OPENAI_API_KEY=...   # DeepEval LLM-as-judge 用

运行:
    pip install deepeval langfuse langchain-openai
    python examples/test_agent_with_evals.py
"""

from __future__ import annotations

import os

from langfuse import observe, get_client

from deepeval.metrics import AnswerRelevancyMetric, GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from langfuse_deepeval.reporter import LangfuseDeepEvalReporter


# ---------------------------------------------------------------------------
# 1) 被测应用：用 @observe 打点，Langfuse 会生成真实轨迹
# ---------------------------------------------------------------------------
@observe(name="refund-agent-demo")
def refund_agent(question: str) -> str:
    """替换成你的真实 agent：调用工具、检索、LLM 等都会被记录成 span。"""
    if "退款" in question or "refund" in question.lower():
        return (
            "我们支持 30 天内无理由退款：在「订单-申请售后」提交后，"
            "款项将在 3-5 个工作日原路退回。"
        )
    return "抱歉，我只能处理售后相关问题。"


# ---------------------------------------------------------------------------
# 2) 评估定义：DeepEval 指标
# ---------------------------------------------------------------------------
def build_metrics() -> list:
    relevancy = AnswerRelevancyMetric(threshold=0.7, include_reason=True)

    correctness = GEval(
        name="回答正确性",
        criteria=(
            "判断 actual output 是否准确回答了 input 的问题，"
            "且不包含与退款政策矛盾的信息"
        ),
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
        ],
        threshold=0.6,
        strict_mode=False,
    )
    return [relevancy, correctness]


# ---------------------------------------------------------------------------
# 3) 串联：跑 agent -> 评估 -> 分数挂到 agent 自己的轨迹上
# ---------------------------------------------------------------------------
def main() -> None:
    questions = [
        "你们的退款政策是什么？多久到账？",
        "怎么申请退款？",
    ]

    langfuse = get_client()
    reporter = LangfuseDeepEvalReporter()

    for question in questions:
        answer = refund_agent(question)
        # @observe 在当前上下文中创建了 trace，这里取它的 id
        trace_id = langfuse.get_trace_id()

        test_case = LLMTestCase(input=question, actual_output=answer)
        reporter.report(
            test_case,
            build_metrics(),
            trace_id=trace_id,
            trace_name="refund-agent-demo",
        )
        print(f"✓ 已评估并上报: {question}")

    reporter.close()
    print(f"\n打开 {os.environ.get('LANGFUSE_HOST', 'http://localhost:3000')}"
          " 的 Traces 页面查看轨迹与分数")


if __name__ == "__main__":
    main()
