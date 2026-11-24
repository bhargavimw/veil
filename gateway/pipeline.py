"""Request/response pipeline with pluggable stages.

Every request flows through the stages in order: identity swap, permission
check, PII filter, audit log. Responses flow back through the same stages in
reverse order. The pipeline fails closed: any stage exception blocks the call.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

from gateway.router import RouteContext


@runtime_checkable
class Stage(Protocol):
    """A single pipeline stage: identity, policy, privacy or audit."""

    async def process(self, ctx: RouteContext, direction: str = "request") -> RouteContext:
        """Process the context and return it (possibly modified)."""
        ...


@dataclass
class PipelineContext(RouteContext):
    """Extended request context carried through the pipeline."""

    stage_results: dict[str, Any] = field(default_factory=dict)


class PipelineError(RuntimeError):
    """Raised when a pipeline stage blocks a request (fail closed)."""


class Pipeline:
    """Runs a list of stages in order for requests, in reverse for responses."""

    def __init__(self, stages: list[Stage]) -> None:
        self._stages = list(stages)

    async def _run(
        self, stages: list[Stage], ctx: RouteContext, direction: str
    ) -> RouteContext:
        for stage in stages:
            try:
                ctx = await stage.process(ctx, direction)
            except PipelineError:
                raise
            except Exception as exc:  # fail closed: block on any failure
                name = stage.__class__.__name__
                raise PipelineError(
                    f"stage {name} blocked the call: {exc}"
                ) from exc
        return ctx

    async def process_request(self, ctx: RouteContext) -> RouteContext:
        """Run stages in order for an outbound request."""
        return await self._run(self._stages, ctx, "request")

    async def process_response(self, ctx: RouteContext) -> RouteContext:
        """Run stages in reverse order for an inbound response."""
        return await self._run(list(reversed(self._stages)), ctx, "response")


# ---------------------------------------------------------------------------
# Stub stages (logic to be implemented in later tasks)
# ---------------------------------------------------------------------------


class IdentityStage:
    """Swap real identities for aliases (stub)."""

    async def process(self, ctx: RouteContext, direction: str = "request") -> RouteContext:
        ctx.stage_results["identity"] = "pending"
        return ctx


class PolicyStage:
    """Check allow / mask / ask / deny policy (stub)."""

    async def process(self, ctx: RouteContext, direction: str = "request") -> RouteContext:
        ctx.stage_results["policy"] = "pending"
        return ctx


class PrivacyStage:
    """Detect and mask PII in both directions (stub)."""

    async def process(self, ctx: RouteContext, direction: str = "request") -> RouteContext:
        ctx.stage_results["privacy"] = "pending"
        return ctx


class AuditStage:
    """Append an audit record for the interaction (stub)."""

    async def process(self, ctx: RouteContext, direction: str = "request") -> RouteContext:
        ctx.stage_results["audit"] = "pending"
        return ctx


def default_pipeline() -> Pipeline:
    """Build the standard VEIL pipeline: identity -> policy -> privacy -> audit."""
    return Pipeline(
        [
            IdentityStage(),
            PolicyStage(),
            PrivacyStage(),
            AuditStage(),
        ]
    )
