"""Reversible tokenization of sensitive values ([EMAIL_1], [CARD_1], ...).

Masking replaces a sensitive value with an opaque token and unmasking restores
the real value only when policy allows.

The :class:`Masker` can operate in two modes:

* **Simple mode** (no ``TokenVault``): in-memory token map, for backward
  compatibility and lightweight use.
* **Vault mode** (a :class:`identity.vault.TokenVault`): real values are
  encrypted at rest with Fernet, tokens carry full metadata (kind, first seen,
  use count, resolvable agents, expiry, status) and are stable within a
  ``context_id``.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

from identity.vault import TokenRecord, TokenVault
from privacy.detector import PIIDetector

_TOKEN_RE = re.compile(r"\[([A-Z]+)_(\d+)\]")


class Masker:
    """Mask values with reversible tokens and restore them later.

    Tokens look like ``[EMAIL_1]``, ``[PHONE_2]`` etc. In vault mode the same
    value always maps to the same token within a ``context_id``.
    """

    def __init__(self, vault: TokenVault | None = None) -> None:
        self._vault = vault
        # Simple in-memory fallback (used when no vault is configured).
        self._vault_map: dict[str, str] = {}  # token -> real_value
        self._reverse: dict[str, str] = {}  # "kind:value" -> token
        self._counters: dict[str, int] = {}
        self._detector = PIIDetector(use_presidio=True)

    # ------------------------------------------------------------------
    # Backward-compatible simple API
    # ------------------------------------------------------------------

    def mask(self, value: str, entity_type: str) -> str:
        """Return a reversible token for ``value`` of the given entity type."""
        if not value:
            return value
        if self._vault is not None:
            token = self._vault.find_token(value, entity_type, "default")
            if token is not None:
                return token
            token = self._vault_next(entity_type)
            self._vault.store(
                real_value=value, token=token, kind=entity_type,
                context_id="default",
            )
            return token
        key = f"{entity_type}:{value}"
        if key in self._reverse:
            return self._reverse[key]
        token = self._simple_next(entity_type)
        self._vault_map[token] = value
        self._reverse[key] = token
        return token

    def unmask(self, token: str) -> str | None:
        """Restore the real value behind a token, or ``None`` if unknown."""
        if self._vault is not None:
            return self._vault.resolve(token)
        return self._vault_map.get(token)

    def unmask_all(self, text: str) -> str:
        """Replace every ``[TYPE_N]`` token in ``text`` with its real value."""

        def replacer(match: re.Match[str]) -> str:
            token = match.group(0)
            if self._vault is not None:
                return self._vault.resolve(token) or token
            return self._vault_map.get(token, token)

        return _TOKEN_RE.sub(replacer, text)

    # ------------------------------------------------------------------
    # New context-aware API
    # ------------------------------------------------------------------

    def tokenize(
        self, text: str, context_id: str, agent: str | None = None
    ) -> tuple[str, list[TokenRecord]]:
        """Detect PII in ``text`` and replace each span with a stable token.

        Returns ``(masked_text, records)`` where ``records`` is the list of
        TokenRecord objects created or reused. The same real value maps to
        the same token within ``context_id``.
        """
        matches = self._detector.analyze(text)
        if not matches:
            return text, []

        records: list[TokenRecord] = []
        # Replace from the end so earlier offsets stay valid.
        masked = text
        for match in sorted(matches, key=lambda m: m.start, reverse=True):
            real_value = match.text
            kind = match.entity_type
            token = self._vault_find_or_create(real_value, kind, context_id)
            if self._vault is not None:
                record = self._vault.record(token)
                if record is not None:
                    records.append(record)
            masked = masked[:match.start] + token + masked[match.end:]
        return masked, records

    def detokenize(
        self, text: str, allowed_tokens: Iterable[str], agent: str | None = None
    ) -> str:
        """Restore real values only for tokens in ``allowed_tokens``.

        Tokens not in ``allowed_tokens`` (or that the vault refuses to resolve
        because they are revoked/expired/unauthorized) are left in place.
        """
        allowed = set(allowed_tokens)

        def replacer(match: re.Match[str]) -> str:
            token = match.group(0)
            if token not in allowed:
                return token
            if self._vault is not None:
                return self._vault.resolve(token, agent=agent) or token
            return self._vault_map.get(token, token)

        return _TOKEN_RE.sub(replacer, text)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _vault_find_or_create(
        self, real_value: str, kind: str, context_id: str
    ) -> str:
        if self._vault is None:
            return self.mask(real_value, kind)
        token = self._vault.find_token(real_value, kind, context_id)
        if token is not None:
            return token
        token = self._vault_next(kind)
        self._vault.store(
            real_value=real_value, token=token, kind=kind,
            context_id=context_id,
        )
        return token

    def _vault_next(self, entity_type: str) -> str:
        # Deterministic-ish token within the "default" counter namespace.
        return self._simple_next(entity_type)

    def _simple_next(self, entity_type: str) -> str:
        self._counters[entity_type] = self._counters.get(entity_type, 0) + 1
        return f"[{entity_type.upper()}_{self._counters[entity_type]}]"
