"""DeepEval -> Langfuse 评分上报器。

把 DeepEval 的指标分数（含评判理由）作为 score 写入 Langfuse：
- 若被测应用本身用 langfuse SDK 打过点（有 trace_id），分数直接挂到该
  trace 上，在 Langfuse UI 的轨迹详情页即可看到每个指标的得分与原因；
- 若没有 trace_id，则自动创建一条包含 input/actual_output 的 trace，
  再挂分数，形成「一条轨迹 + 一组评估」的完整记录。

用法示例::

    from langfuse_deepeval.reporter import LangfuseDeepEvalReporter
    from deepeval.metrics import AnswerRelevancyMetric
    from deepeval.test_case import LLMTestCase

    reporter = LangfuseDeepEvalReporter()  # 读 LANGFUSE_* 环境变量

    test_case = LLMTestCase(input="...", actual_output="...")
    metric = AnswerRelevancyMetric(threshold=0.7, include_reason=True)
    metric.measure(test_case)

    reporter.report(test_case, [metric], trace_id=existing_trace_id)
    reporter.close()
"""

from __future__ import annotations

import os
from typing import TYPE_CHECKING, Any, Optional

if TYPE_CHECKING:  # 仅类型提示用，避免循环依赖
    from deepeval.metrics import BaseMetric
    from deepeval.test_case import LLMTestCase

try:
    from langfuse import Langfuse
except ImportError as e:  # pragma: no cover
    raise ImportError(
        "需要安装 langfuse SDK: pip install langfuse"
    ) from e


class LangfuseDeepEvalReporter:
    """将 DeepEval 评估结果写入 Langfuse 的轻量封装。"""

    def __init__(
        self,
        public_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        host: Optional[str] = None,
    ) -> None:
        self.langfuse = Langfuse(
            public_key=public_key or os.environ.get("LANGFUSE_PUBLIC_KEY"),
            secret_key=secret_key or os.environ.get("LANGFUSE_SECRET_KEY"),
            host=host or os.environ.get("LANGFUSE_HOST", "http://localhost:3000"),
        )

    def report(
        self,
        test_case: "LLMTestCase",
        metrics: list["BaseMetric"],
        trace_id: Optional[str] = None,
        trace_name: str = "deepeval-test",
        metadata: Optional[dict[str, Any]] = None,
    ) -> str:
        """上报一个测试用例的全部指标分数，返回所用 trace_id。

        Args:
            test_case: 已填好 input / actual_output 的 DeepEval 用例
                （无需先 measure，本方法内部会调用）。
            metrics: DeepEval 指标列表。
            trace_id: 可选，被测应用已有的 Langfuse trace id；
                传入时分数挂到该轨迹，否则新建一条。
            trace_name: 新建轨迹时的名称。
            metadata: 附加到新建轨迹的元数据。
        """
        if trace_id is None:
            trace = self.langfuse.trace(
                name=trace_name,
                input=test_case.input,
                output=test_case.actual_output,
                metadata=metadata,
            )
            trace_id = trace.id

        for metric in metrics:
            if not getattr(metric, "_score", None):  # 未 measure 过则补跑
                metric.measure(test_case)

            score = getattr(metric, "score", None)
            if score is None:  # 指标执行失败等场景，跳过但保留记录
                self.langfuse.score(
                    trace_id=trace_id,
                    name=getattr(metric, "__name__", type(metric).__name__),
                    value=0,
                    comment=f"metric failed: {getattr(metric, 'error', '')}",
                )
                continue

            comment = getattr(metric, "reason", None)
            threshold = getattr(metric, "threshold", None)
            if threshold is not None:
                passed = score >= threshold
                comment = (
                    f"{'✅ PASS' if passed else '❌ FAIL'}"
                    f" (threshold={threshold})\n{comment or ''}"
                )

            self.langfuse.score(
                trace_id=trace_id,
                name=self._metric_name(metric),
                value=score,
                comment=comment,
                data_type="NUMERIC",
            )

        return trace_id

    @staticmethod
    def _metric_name(metric: "BaseMetric") -> str:
        return (
            getattr(metric, "name", None)
            or getattr(metric, "__name__", None)
            or type(metric).__name__
        )

    def close(self) -> None:
        """冲刷上报队列（脚本结束前调用，确保分数落库）。"""
        self.langfuse.flush()
