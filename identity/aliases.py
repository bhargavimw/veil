"""Alias generation for email, phone, name, username, address and virtual card.

Aliases are fake-but-plausible stand-ins for real identities. Each alias is
scoped (per agent / per service / global), revocable and expirable, and the
same real value always maps to the same alias within a given scope.

Virtual card numbers are Luhn-valid test numbers (they never correspond to a
real payment card).
"""

from __future__ import annotations

import random
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime

_FIRST_NAMES = [
    "Aarav", "Vihaan", "Diya", "Saanvi", "Kabir", "Meera", "Arjun", "Ananya",
    "Rohan", "Ishaan", "Myra", "Aditya", "Kavya", "Raghav", "Sia",
]
_LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Iyer", "Reddy", "Nair", "Patel", "Joshi",
    "Desai", "Khan", "Singh", "Kumari", "Rao", "Malik", "Pillai",
]
_STREETS = [
    "Rose Lane", "Maple Road", "Nehru Street", "Gandhi Road", "Lake View",
    "Hill Top", "Park Avenue", "Station Road", "Temple Street", "Market Lane",
]
_CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata"]
_DOMAINS = ["veil.alias", "example.in", "testmail.org", "demo.local"]


def _now() -> str:
    return datetime.now(UTC).isoformat()


def luhn_valid(card_number: str) -> bool:
    """Return True if ``card_number`` passes the Luhn algorithm."""
    digits = re.sub(r"\D", "", card_number)
    if len(digits) < 13 or not digits.isdigit():
        return False
    total = 0
    reverse = digits[::-1]
    for i, ch in enumerate(reverse):
        d = int(ch)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def _luhn_checksum(prefix: str) -> int:
    """Return the Luhn check digit for ``prefix`` (without check digit).

    Consistent with :func:`luhn_valid`: appending the returned digit makes the
    full number pass Luhn validation.
    """
    for check in range(10):
        if luhn_valid(prefix + str(check)):
            return check
    return 0


def generate_virtual_card(prefix: str = "4111", rng: random.Random | None = None) -> str:
    """Generate a Luhn-valid virtual test card number (never a real card)."""
    rng = rng or random
    body = prefix + "".join(str(rng.randint(0, 9)) for _ in range(16 - len(prefix) - 1))
    check = _luhn_checksum(body)
    return body + str(check)


@dataclass
class AliasRecord:
    """A single generated alias and its metadata."""

    alias: str
    kind: str  # email | phone | name | username | address | card
    real_value: str | None = None
    scope: str = "global"  # global | agent:<id> | service:<name> | agent:<id>:service:<name>
    created_at: str = field(default_factory=_now)
    expires_at: str | None = None
    revoked: bool = False
    use_count: int = 0


class AliasGenerator:
    """Generates disposable virtual identities per service or task."""

    def __init__(self, seed: int | None = None) -> None:
        self._rng = random.Random(seed)
        self._aliases: dict[str, AliasRecord] = {}  # alias -> AliasRecord
        # (scope, kind, real_value) -> alias  (same real value -> same alias in scope)
        self._index: dict[tuple[str, str, str], str] = {}

    # -- scope helpers ------------------------------------------------------

    @staticmethod
    def scope_key(*, agent: str | None = None, service: str | None = None) -> str:
        """Build a scope string from optional agent and service."""
        parts = []
        if agent is not None:
            parts.append(f"agent:{agent}")
        if service is not None:
            parts.append(f"service:{service}")
        return ":".join(parts) if parts else "global"

    # -- generation ---------------------------------------------------------

    def email(self, real_value: str | None = None, *, scope: str = "global") -> str:
        """Return an email alias, stable for ``real_value`` within ``scope``."""
        key = (scope, "email", real_value or "")
        if key in self._index:
            return self._index[key]
        if real_value:
            local = real_value.split("@", 1)[0]
            local = re.sub(r"[^a-z0-9]", "", local.lower()) or "user"
            alias = f"{local}.alias@{_rnd_domain(self._rng)}"
        else:
            alias = f"{_rnd_name(self._rng).lower()}@{_rnd_domain(self._rng)}"
        alias = self._unique(alias, "email")
        self._store(alias, "email", real_value, scope)
        return alias

    def phone(self, real_value: str | None = None, *, scope: str = "global") -> str:
        """Return a phone alias, stable for ``real_value`` within ``scope``."""
        key = (scope, "phone", real_value or "")
        if key in self._index:
            return self._index[key]
        if real_value:
            digits = re.sub(r"\D", "", real_value)
            alias = "+91 " + digits[-5:] if len(digits) >= 5 else "+91 00000 00000"
        else:
            alias = "+91 " + "".join(str(self._rng.randint(6, 9)) for _ in range(1)) + " " + \
                "".join(str(self._rng.randint(0, 9)) for _ in range(9))
        alias = self._unique(alias, "phone")
        self._store(alias, "phone", real_value, scope)
        return alias

    def name(self, real_value: str | None = None, *, scope: str = "global") -> str:
        """Return a name alias, stable for ``real_value`` within ``scope``."""
        key = (scope, "name", real_value or "")
        if key in self._index:
            return self._index[key]
        if real_value:
            parts = real_value.split()
            alias = f"{self._rng.choice(_FIRST_NAMES)} {parts[-1] if parts else _rnd_last(self._rng)}"
        else:
            alias = f"{_rnd_name(self._rng)} {_rnd_last(self._rng)}"
        alias = self._unique(alias, "name")
        self._store(alias, "name", real_value, scope)
        return alias

    def username(self, real_value: str | None = None, *, scope: str = "global") -> str:
        """Return a username/handle alias, stable for ``real_value`` within ``scope``."""
        key = (scope, "username", real_value or "")
        if key in self._index:
            return self._index[key]
        if real_value:
            base = re.sub(r"[^a-z0-9]", "", real_value.lower()) or "user"
            alias = f"v_{base}"
        else:
            alias = f"v_{_rnd_name(self._rng).lower()}_{self._rng.randint(10, 99)}"
        alias = self._unique(alias, "username")
        self._store(alias, "username", real_value, scope)
        return alias

    def address(self, real_value: str | None = None, *, scope: str = "global") -> str:
        """Return an address alias, stable for ``real_value`` within ``scope``."""
        key = (scope, "address", real_value or "")
        if key in self._index:
            return self._index[key]
        alias = (
            f"{self._rng.randint(1, 999)} {_rnd_street(self._rng)}, "
            f"{_rnd_city(self._rng)}"
        )
        alias = self._unique(alias, "address")
        self._store(alias, "address", real_value, scope)
        return alias

    def card(self, real_value: str | None = None, *, scope: str = "global") -> str:
        """Return a Luhn-valid virtual card alias, stable for ``real_value`` within scope."""
        key = (scope, "card", real_value or "")
        if key in self._index:
            return self._index[key]
        alias = generate_virtual_card("4111", rng=self._rng)
        alias = self._unique(alias, "card")
        self._store(alias, "card", real_value, scope)
        return alias

    # -- lifecycle ----------------------------------------------------------

    def _unique(self, alias: str, kind: str) -> str:
        base = alias
        n = 1
        while alias in self._aliases:
            alias = f"{base}-{n}"
            n += 1
        return alias

    def _store(self, alias: str, kind: str, real_value: str | None, scope: str) -> None:
        self._aliases[alias] = AliasRecord(
            alias=alias, kind=kind, real_value=real_value, scope=scope,
        )
        self._index[(scope, kind, real_value or "")] = alias

    def revoke(self, alias: str) -> bool:
        """Revoke an alias so it is no longer returned."""
        record = self._aliases.get(alias)
        if record is None:
            return False
        record.revoked = True
        return True

    def expire(self, alias: str) -> bool:
        """Mark an alias as expired."""
        record = self._aliases.get(alias)
        if record is None:
            return False
        record.expires_at = _now()
        return True

    def resolve(self, alias: str) -> str | None:
        """Return the real value behind an alias, or None if revoked/expired."""
        record = self._aliases.get(alias)
        if record is None or record.revoked:
            return None
        if record.expires_at is not None and datetime.now(UTC) > datetime.fromisoformat(record.expires_at):
            return None
        return record.real_value

    def list_aliases(self) -> list[AliasRecord]:
        """Return all alias records (for inspection / auditing)."""
        return list(self._aliases.values())


# -- small RNG helpers -----------------------------------------------------


def _rnd_name(rng: random.Random) -> str:
    return rng.choice(_FIRST_NAMES)


def _rnd_last(rng: random.Random) -> str:
    return rng.choice(_LAST_NAMES)


def _rnd_street(rng: random.Random) -> str:
    return rng.choice(_STREETS)


def _rnd_city(rng: random.Random) -> str:
    return rng.choice(_CITIES)


def _rnd_domain(rng: random.Random) -> str:
    return rng.choice(_DOMAINS)
