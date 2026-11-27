"""PII detection wrapper around Microsoft Presidio plus custom recognizers.

Detects sensitive-data spans in free text. Presidio (spaCy-backed) handles
common entities (email, phone, credit card, person, etc.); the custom
recognizers in :mod:`privacy.recognizers` add India-specific entities
(Aadhaar, PAN, UPI, OTP, ...) plus usernames.

Every detector returns :class:`PIIMatch` spans with entity type, character
offsets and the matched text.
"""

from __future__ import annotations

from dataclasses import dataclass

from privacy.recognizers import IndiaRecognizers

try:  # Presidio is optional in the sense that custom recognizers still work.
    from presidio_analyzer import AnalyzerEngine
    from presidio_analyzer.recognizer_registry import RecognizerRegistry

    _PRESIDIO_AVAILABLE = True
except Exception:  # pragma: no cover - environment without presidio installed
    AnalyzerEngine = None  # type: ignore[assignment]
    RecognizerRegistry = None  # type: ignore[assignment]
    _PRESIDIO_AVAILABLE = False

# Map Presidio entity types to VEIL entity types.
_PRESIDIO_MAP = {
    "EMAIL_ADDRESS": "EMAIL",
    "PHONE_NUMBER": "PHONE",
    "CREDIT_CARD": "CARD",
    "IBAN_CODE": "IBAN",
    "US_SSN": "SSN",
    "US_DRIVER_LICENSE": "DRIVER_LICENSE",
    "US_PASSPORT": "PASSPORT",
    "LOCATION": "LOCATION",
    "PERSON": "NAME",
    "NRP": "NAME",
    "DATE_TIME": "DATE",
}


@dataclass
class PIIMatch:
    """A single sensitive-data match found in text."""

    entity_type: str
    start: int
    end: int
    text: str
    score: float = 1.0


class PIIDetector:
    """Analyzes text and returns PII matches (Presidio + custom recognizers)."""

    def __init__(self, use_presidio: bool = True) -> None:
        self._recognizers = IndiaRecognizers()
        self._engine = None
        if use_presidio and _PRESIDIO_AVAILABLE and AnalyzerEngine is not None:
            try:
                self._engine = AnalyzerEngine()
            except Exception:  # pragma: no cover - runtime model failure
                self._engine = None

    # -- Presidio ----------------------------------------------------------

    def _presidio_matches(self, text: str) -> list[PIIMatch]:
        if self._engine is None:
            return []
        matches: list[PIIMatch] = []
        try:
            results = self._engine.analyze(text=text, entities=[], language="en")
        except Exception:
            return []
        for r in results:
            entity = _PRESIDIO_MAP.get(r.entity_type, r.entity_type.upper())
            matches.append(
                PIIMatch(
                    entity_type=entity,
                    start=r.start,
                    end=r.end,
                    text=text[r.start:r.end],
                    score=float(r.score or 0.0),
                )
            )
        return matches

    # -- public API --------------------------------------------------------

    def analyze(self, text: str) -> list[PIIMatch]:
        """Return all PII matches found in ``text``, sorted by position.

        Presidio matches are merged with custom recognizer matches. When two
        matches overlap, the longer match wins.
        """
        matches: list[PIIMatch] = list(self._presidio_matches(text))
        for span in self._recognizers.all(text):
            matches.append(
                PIIMatch(
                    entity_type=span.entity_type,
                    start=span.start,
                    end=span.end,
                    text=span.text,
                    score=span.score,
                )
            )
        return self._dedup(matches, text)

    def find(self, text: str, entity_type: str) -> list[PIIMatch]:
        """Return matches of a single entity type."""
        return [m for m in self.analyze(text) if m.entity_type == entity_type]

    @staticmethod
    def _dedup(matches: list[PIIMatch], text: str) -> list[PIIMatch]:
        """Remove overlapping matches, preferring longer / higher-scored ones."""
        ordered = sorted(
            matches, key=lambda m: (m.start, -(m.end - m.start), -m.score)
        )
        chosen: list[PIIMatch] = []
        for m in ordered:
            if any(
                m.start < c.end and c.start < m.end for c in chosen
            ):
                continue
            chosen.append(m)
        chosen.sort(key=lambda m: m.start)
        return chosen
