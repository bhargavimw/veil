"""Metadata shielding for request/response dicts.

Strips, generalizes or randomizes sensitive metadata fields (IP addresses,
user-agents, precise locations, timestamps, email headers, file properties,
referrer/tracking params) driven by :class:`MetadataRule` settings.

Returns a sanitized copy of the input dict plus a list of transformation
records, each with ``type == "strip_metadata"``.
"""

from __future__ import annotations

import re
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


@dataclass
class MetadataRule:
    """A rule for handling one metadata field."""

    field: str  # e.g. "ip", "user_agent", "location", "timestamp", "referrer"
    action: str  # "strip" | "generalize" | "randomize"
    enabled: bool = True


# Built-in default rules for common metadata fields.
_DEFAULT_RULES: dict[str, MetadataRule] = {
    "ip": MetadataRule("ip", "generalize"),
    "client_ip": MetadataRule("client_ip", "generalize"),
    "remote_addr": MetadataRule("remote_addr", "generalize"),
    "x_originating_ip": MetadataRule("x_originating_ip", "strip"),
    "x_forwarded_for": MetadataRule("x_forwarded_for", "generalize"),
    "user_agent": MetadataRule("user_agent", "generalize"),
    "device": MetadataRule("device", "generalize"),
    "location": MetadataRule("location", "generalize"),
    "timestamp": MetadataRule("timestamp", "generalize"),
    "ts": MetadataRule("ts", "generalize"),
    "created_at": MetadataRule("created_at", "generalize"),
    "received": MetadataRule("received", "strip"),
    "author": MetadataRule("author", "strip"),
    "creator": MetadataRule("creator", "strip"),
    "exif": MetadataRule("exif", "strip"),
    "referrer": MetadataRule("referrer", "strip"),
    "utm_source": MetadataRule("utm_source", "strip"),
    "utm_medium": MetadataRule("utm_medium", "strip"),
    "utm_campaign": MetadataRule("utm_campaign", "strip"),
    "utm_term": MetadataRule("utm_term", "strip"),
    "utm_content": MetadataRule("utm_content", "strip"),
    "fbclid": MetadataRule("fbclid", "strip"),
    "gclid": MetadataRule("gclid", "strip"),
}

_IPV4_RE = re.compile(r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$")
_UTC_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")


class MetadataShield:
    """Applies metadata rules to a request/response dict."""

    def __init__(self, rules: dict[str, MetadataRule] | None = None) -> None:
        self._rules = dict(_DEFAULT_RULES)
        if rules:
            self._rules.update(rules)

    def add_rule(self, rule: MetadataRule) -> None:
        self._rules[rule.field] = rule

    def remove_rule(self, field: str) -> bool:
        return self._rules.pop(field, None) is not None

    # -- public API --------------------------------------------------------

    def apply(self, data: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        """Return a sanitized copy of ``data`` and a list of transformations.

        Each transformation record has ``type == "strip_metadata"`` plus the
        field and action that were applied.
        """
        sanitized = deepcopy(data)
        transformations: list[dict[str, Any]] = []
        for field_name, value in list(sanitized.items()):
            rule = self._rules.get(field_name)
            if rule is None or not rule.enabled:
                continue
            new_value = self._apply_rule(rule, value)
            if new_value != value:
                sanitized[field_name] = new_value
                transformations.append({
                    "type": "strip_metadata",
                    "field": field_name,
                    "action": rule.action,
                })
        return sanitized, transformations

    # -- rule implementations ----------------------------------------------

    def _apply_rule(self, rule: MetadataRule, value: Any) -> Any:
        if value is None:
            return value
        if rule.action == "strip":
            return None
        if rule.action == "randomize":
            return self._randomize(value)
        # generalize
        return self._generalize(rule.field, value)

    def _generalize(self, field: str, value: Any) -> Any:
        if field in {"ip", "client_ip", "remote_addr", "x_forwarded_for"}:
            return self._generalize_ip(value)
        if field == "user_agent":
            return self._generalize_user_agent(value)
        if field == "device":
            return "device"
        if field == "location":
            return self._generalize_location(value)
        if field in {"timestamp", "ts", "created_at"}:
            return self._round_timestamp(value)
        return "[generalized]"

    def _randomize(self, value: Any) -> Any:
        if isinstance(value, str):
            return "[redacted]"
        return None

    def _generalize_ip(self, value: Any) -> Any:
        if not isinstance(value, str):
            return "[ip]"
        match = _IPV4_RE.match(value.strip())
        if not match:
            return "[ip]"
        octets = list(match.groups())
        octets[3] = "0"
        return ".".join(octets)

    def _generalize_user_agent(self, value: Any) -> Any:
        if not isinstance(value, str):
            return "[ua]"
        # Drop version numbers, keep the product family.
        simplified = re.sub(r"/[\d.]+", "", value)
        simplified = re.sub(r"\s+", " ", simplified).strip()
        return simplified or "[ua]"

    def _generalize_location(self, value: Any) -> Any:
        if not isinstance(value, str):
            return "[location]"
        # If it already looks like a city name, keep it; otherwise generalize.
        if re.fullmatch(r"[A-Za-z][A-Za-z .\-]{1,40}", value):
            return value
        return "[city]"

    def _round_timestamp(self, value: Any) -> Any:
        if not isinstance(value, str):
            return "[timestamp]"
        match = _UTC_RE.match(value)
        if not match:
            return "[timestamp]"
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return "[timestamp]"
        rounded = dt.replace(minute=0, second=0, microsecond=0, tzinfo=UTC)
        return rounded.isoformat()
