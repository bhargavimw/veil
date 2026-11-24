"""Alias generation for email, phone, name and address."""

from __future__ import annotations


class AliasGenerator:
    """Generates disposable virtual identities per service or task."""

    def email(self) -> str:
        raise NotImplementedError("email alias generation is not implemented yet")

    def phone(self) -> str:
        raise NotImplementedError("phone alias generation is not implemented yet")

    def name(self) -> str:
        raise NotImplementedError("name alias generation is not implemented yet")

    def address(self) -> str:
        raise NotImplementedError("address alias generation is not implemented yet")
