"""Policy engine: evaluates allow / mask / ask / deny decisions."""

from __future__ import annotations

from policy.models import Action, Policy, PolicyDecision, Rule


class PolicyEngine:
    """Matches a request against rules and returns a PolicyDecision."""

    def evaluate(
        self,
        agent: str,
        service: str,
        tool: str,
        policy: Policy,
    ) -> PolicyDecision:
        """Evaluate the request against the policy (stub: deny by default)."""
        raise NotImplementedError("policy evaluation is not implemented yet")

    def action_for(self, rule: Rule) -> Action:
        """Return the action encoded in a single rule."""
        return rule.action
