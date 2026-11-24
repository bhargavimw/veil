"""Policy model validation tests."""

import pytest

from policy.models import Policy, PolicyDecision, Rule


def test_rule_actions() -> None:
    rule = Rule(
        agent="assistant-1",
        service="gmail",
        tool="read_message",
        action="mask",
        mask=["email", "phone"],
    )
    assert rule.action == "mask"
    assert rule.mask == ["email", "phone"]


def test_invalid_action_is_rejected() -> None:
    with pytest.raises(ValueError):
        Rule(
            agent="a",
            service="gmail",
            tool="read",
            action="burn",  # type: ignore[arg-type]
        )


def test_policy_decision() -> None:
    decision = PolicyDecision(
        allowed=False,
        action="deny",
        reason="tool not permitted",
    )
    assert not decision.allowed
    assert decision.action == "deny"


def test_policy_defaults() -> None:
    policy = Policy(agent="a", service="gmail")
    assert policy.rules == []
