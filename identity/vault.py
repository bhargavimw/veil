"""Encrypted vault mapping real identities to aliases and token records.

The vault holds sensitive real values encrypted at rest using Fernet symmetric
encryption. The encryption key is read from the ``VEIL_VAULT_KEY`` environment
variable; when it is missing a development key is generated and a warning is
emitted (never for production use).

Two logical stores live here:

* :class:`IdentityVault` — real value <-> virtual alias (used by the identity
  swap stage).
* :class:`TokenVault` — token <-> real value with full metadata (used by the
  reversible PII masking stage).
"""

from __future__ import annotations

import os
import warnings
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, datetime

from cryptography.fernet import Fernet


def _load_encryption_key() -> bytes:
    """Return the vault encryption key.

    Reads ``VEIL_VAULT_KEY`` from the environment. When absent, generates a
    development key and warns the operator that this is not suitable for
    production.
    """
    raw = os.environ.get("VEIL_VAULT_KEY")
    if raw:
        return raw.encode("utf-8")
    warnings.warn(
        "VEIL_VAULT_KEY is not set; generated a transient development key. "
        "Set VEIL_VAULT_KEY for production deployments.",
        stacklevel=2,
    )
    return Fernet.generate_key()


def _now() -> str:
    return datetime.now(UTC).isoformat()


# ---------------------------------------------------------------------------
# Identity vault (real value <-> alias)
# ---------------------------------------------------------------------------


class IdentityVault:
    """Stores the real-value <-> alias mapping, encrypted at rest."""

    def __init__(self, encryption_key: bytes | None = None) -> None:
        key = encryption_key if encryption_key is not None else _load_encryption_key()
        self._fernet = Fernet(key)
        # alias -> real_value (plaintext in memory, encrypted never on disk)
        self._alias_to_real: dict[str, str] = {}
        # real_value -> alias (dedup within a vault instance)
        self._real_to_alias: dict[str, str] = {}

    def _encrypt(self, value: str) -> str:
        return self._fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    def _decrypt(self, token: str) -> str:
        return self._fernet.decrypt(token.encode("utf-8")).decode("utf-8")

    def alias_for(self, real_value: str, scope: str = "global") -> str:
        """Return the alias for a real value, creating one if missing.

        The same real value maps to the same alias within a given ``scope``.
        """
        key = f"{scope}:{real_value}"
        if key in self._real_to_alias:
            return self._real_to_alias[key]
        alias = self._mint_alias(real_value)
        self._alias_to_real[alias] = real_value
        self._real_to_alias[key] = alias
        return alias

    def _mint_alias(self, real_value: str) -> str:
        """Deterministically derive an alias from the real value (stub policy)."""
        # In production this would call the AliasGenerator. Here we return a
        # reversible encrypted placeholder so round-trips still work.
        return f"alias:{self._encrypt(real_value)[:16]}"

    def real_for(self, alias: str) -> str | None:
        """Return the real value behind an alias, or None if unknown."""
        return self._alias_to_real.get(alias)

    def store(self, real_value: str, alias: str, scope: str = "global") -> None:
        """Persist an encrypted real-value <-> alias pair."""
        self._alias_to_real[alias] = real_value
        self._real_to_alias[f"{scope}:{real_value}"] = alias

    def revoke(self, alias: str) -> bool:
        """Revoke an alias, removing its mapping."""
        if alias in self._alias_to_real:
            real_value = self._alias_to_real.pop(alias)
            self._real_to_alias.pop(f"global:{real_value}", None)
            return True
        return False


# ---------------------------------------------------------------------------
# Token vault (token <-> real value with metadata)
# ---------------------------------------------------------------------------


@dataclass
class TokenRecord:
    """Metadata for a single reversible token."""

    token: str
    kind: str  # e.g. "EMAIL", "CARD", "PHONE"
    context_id: str
    first_seen: str
    use_count: int = 0
    used_by: list[str] = field(default_factory=list)
    resolvable_by: list[str] = field(default_factory=list)
    expires_at: str | None = None
    status: str = "active"  # active | revoked | expired
    real_value_encrypted: str = ""

    def is_resolvable(self, agent: str | None = None) -> bool:
        """Whether this token can currently be detokenized.

        A token is resolvable when it is active, not expired, and (when an
        agent is supplied) that agent is listed in ``resolvable_by`` or the
        token is open to all resolvers.
        """
        now = datetime.now(UTC)
        if self.status != "active":
            return False
        if self.expires_at is not None and now > datetime.fromisoformat(self.expires_at):
            return False
        if agent is not None and self.resolvable_by and agent not in self.resolvable_by:
            return False
        return True


class TokenVault:
    """Holds real values encrypted at rest behind reversible tokens.

    Tokens are scoped to a ``context_id`` so the same real value maps to the
    same token within a context. Each token record tracks kind, first use,
    use count, agents that have used it, agents allowed to resolve it, expiry
    and status. Expired or revoked tokens never detokenize.
    """

    def __init__(self, encryption_key: bytes | None = None) -> None:
        key = encryption_key if encryption_key is not None else _load_encryption_key()
        self._fernet = Fernet(key)
        # token -> TokenRecord
        self._tokens: dict[str, TokenRecord] = {}
        # (context_id, kind, real_value) -> token  (stability within a context)
        self._index: dict[tuple[str, str, str], str] = {}
        # counters per (context_id, kind) for stable token numbering
        self._counters: dict[tuple[str, str], int] = {}

    # -- internal helpers ---------------------------------------------------

    def _encrypt(self, value: str) -> str:
        return self._fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    def _decrypt(self, ciphertext: str) -> str:
        return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")

    def _next_token(self, context_id: str, kind: str) -> str:
        counter_key = (context_id, kind.upper())
        self._counters[counter_key] = self._counters.get(counter_key, 0) + 1
        return f"[{kind.upper()}_{self._counters[counter_key]}]"

    # -- public API ---------------------------------------------------------

    def store(
        self,
        real_value: str,
        token: str,
        kind: str,
        context_id: str,
        *,
        used_by: Iterable[str] | None = None,
        resolvable_by: Iterable[str] | None = None,
        expires_at: str | None = None,
    ) -> TokenRecord:
        """Persist a real-value <-> token pair, encrypted at rest."""
        record = TokenRecord(
            token=token,
            kind=kind,
            context_id=context_id,
            first_seen=_now(),
            used_by=list(used_by or []),
            resolvable_by=list(resolvable_by or []),
            expires_at=expires_at,
            status="active",
            real_value_encrypted=self._encrypt(real_value),
        )
        self._tokens[token] = record
        self._index[(context_id, kind.upper(), real_value)] = token
        return record

    def resolve(self, token: str, agent: str | None = None) -> str | None:
        """Restore the real value behind ``token``.

        Returns ``None`` when the token is unknown, revoked, expired, or the
        requesting agent is not authorized to resolve it.
        """
        record = self._tokens.get(token)
        if record is None:
            return None
        if not record.is_resolvable(agent):
            return None
        record.use_count += 1
        if agent and agent not in record.used_by:
            record.used_by.append(agent)
        return self._decrypt(record.real_value_encrypted)

    def find_token(
        self, real_value: str, kind: str, context_id: str
    ) -> str | None:
        """Return the existing token for a real value within a context, if any."""
        return self._index.get((context_id, kind.upper(), real_value))

    def revoke(self, token: str) -> bool:
        """Revoke a token so it can never be detokenized again."""
        record = self._tokens.get(token)
        if record is None:
            return False
        record.status = "revoked"
        return True

    def expire(self, token: str) -> bool:
        """Mark a token as expired."""
        record = self._tokens.get(token)
        if record is None:
            return False
        record.status = "expired"
        return True

    def record(self, token: str) -> TokenRecord | None:
        """Return the metadata record for a token, if it exists."""
        return self._tokens.get(token)

    def list_tokens(self) -> list[TokenRecord]:
        """Return all token records (for inspection / auditing)."""
        return list(self._tokens.values())
