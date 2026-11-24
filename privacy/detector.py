"""PII detection wrapper around Microsoft Presidio."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PIIMatch:
    """A single sensitive-data match found in text."""

    entity_type: str
    start: int
    end: int
    text: str


class PIIDetector:
    """Analyzes text and returns PII matches (Presidio-backed, stub)."""

    def analyze(self, text: str) -> list[PIIMatch]:
        """Return all PII matches found in ``text``."""
        raise NotImplementedError("Presidio detection is not implemented yet")
