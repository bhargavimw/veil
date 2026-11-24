"""Pipeline tests: ordering, reverse for responses, fail closed."""

import pytest

from gateway.pipeline import Pipeline, PipelineError


class RecordingStage:
    """A stage that records each context it sees; optionally fails."""

    def __init__(self, name: str, fail: bool = False) -> None:
        self.name = name
        self.fail = fail
        self.calls: list[str] = []

    async def process(self, ctx: str, direction: str = "request") -> str:
        self.calls.append(ctx)
        if self.fail:
            raise RuntimeError("stage failure")
        return f"{ctx}:{self.name}"


@pytest.mark.asyncio
async def test_stages_run_in_order_for_requests() -> None:
    first, second = RecordingStage("a"), RecordingStage("b")
    pipeline = Pipeline([first, second])  # type: ignore[arg-type]
    result = await pipeline.process_request("start")
    assert result == "start:a:b"
    assert first.calls == ["start"]
    assert second.calls == ["start:a"]


@pytest.mark.asyncio
async def test_stages_run_in_reverse_for_responses() -> None:
    first, second = RecordingStage("a"), RecordingStage("b")
    pipeline = Pipeline([first, second])  # type: ignore[arg-type]
    result = await pipeline.process_response("start")
    assert result == "start:b:a"
    assert second.calls == ["start"]
    assert first.calls == ["start:b"]


@pytest.mark.asyncio
async def test_fail_closed_when_any_stage_raises() -> None:
    first = RecordingStage("a")
    second = RecordingStage("b", fail=True)
    pipeline = Pipeline([first, second])  # type: ignore[arg-type]
    with pytest.raises(PipelineError):
        await pipeline.process_request("start")


@pytest.mark.asyncio
async def test_fail_closed_blocks_response_too() -> None:
    first = RecordingStage("a")
    second = RecordingStage("b", fail=True)
    pipeline = Pipeline([first, second])  # type: ignore[arg-type]
    with pytest.raises(PipelineError):
        await pipeline.process_response("start")
