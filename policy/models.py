"""Pydantic models for policy rules and scopes."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Action = Literal["allow", "mask", "ask", "deny"]


class Rule(BaseModel):
    """A single permission rule for one agent, service and tool."""

    agent: str = Field(..., description="agent identifier")
    service: str = Field(..., description="target service (e.g. gmail)")
    tool: str = Field(..., description="tool the agent wants to call")
    action: Action = Field(..., description="allow | mask | ask | deny")
    mask: list[str] = Field(
        default_factory=list,
        description="fields to mask when action is mask",
    )


class Policy(BaseModel):
    """A full policy: all rules for one agent and service."""

    agent: str
    service: str
    rules: list[Rule] = Field(default_factory=list)


class PolicyDecision(BaseModel):
    """The result of evaluating a rule against a request."""

    allowed: bool = Field(..., description="whether the call may proceed")
    action: Action
    mask_fields: list[str] = Field(default_factory=list)
    reason: str = Field(default="")
