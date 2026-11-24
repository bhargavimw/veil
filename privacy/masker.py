"""Reversible tokenization of sensitive values ([EMAIL_1], [PHONE_2], ...).

This is the one piece implemented fully in the initial scaffold. Masking
replaces a value with an opaque token and unmasking restores the real value
only when policy allows.
"""

from __future__ import annotations

import re
from typing import TypeVar

T = TypeVar("T", str, bytes)


class Masker:
    """Mask values with reversible tokens and restore them later.

    Tokens look like ``[EMAIL_1]``, ``[PHONE_2]`` etc. and are scoped to an
    entity type so the same value always maps to the same token within a
    Masker instance.
    """

    def __init__(self) -> None:
        self._vault: dict[str, str] = {}
        self._reverse: dict[str, str] = {}
        self._counters: dict[str, int] = {}

    def mask(self, value: str, entity_type: str) -> str:
        """Return a reversible token for ``value`` of the given entity type."""
        if not value:
            return value
        key = f"{entity_type}:{value}"
        if key in self._reverse:
            return self._reverse[key]
        self._counters[entity_type] = self._counters.get(entity_type, 0) + 1
        token = f"[{entity_type.upper()}_{self._counters[entity_type]}]"
        self._vault[token] = value
        self._reverse[key] = token
        return token

    def unmask(self, token: str) -> str | None:
        """Restore the real value behind a token, or ``None`` if unknown."""
        return self._vault.get(token)

    def unmask_all(self, text: str) -> str:
        """Replace every ``[TYPE_N]`` token in ``text`` with its real value."""
        pattern = re.compile(r"\[([A-Z]+)_(\d+)\]")

        def replacer(match: re.Match[str]) -> str:
            return self._vault.get(match.group(0), match.group(0))

        return pattern.sub(replacer, text)
