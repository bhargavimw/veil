"""Encrypted vault mapping real identities to aliases."""

from __future__ import annotations

from cryptography.fernet import Fernet


class IdentityVault:
    """Stores the real-value <-> alias mapping, encrypted at rest."""

    def __init__(self, encryption_key: bytes) -> None:
        self._fernet = Fernet(encryption_key)
        self._mapping: dict[str, str] = {}

    def alias_for(self, real_value: str) -> str:
        """Return the alias for a real value, creating one if missing."""
        raise NotImplementedError("alias lookup is not implemented yet")

    def real_for(self, alias: str) -> str:
        """Return the real value behind an alias."""
        raise NotImplementedError("real-value lookup is not implemented yet")

    def store(self, real_value: str, alias: str) -> None:
        """Persist an encrypted real-value <-> alias pair."""
        raise NotImplementedError("vault persistence is not implemented yet")
