"""Custom regex recognizers for India-specific and general PII.

Covers Indian phone numbers, Aadhaar (12 digits, Verhoeff checksum), PAN,
UPI IDs, payment card numbers (Luhn), OTPs (4-8 digit codes near keywords),
emails and usernames/handles. Every recognizer returns typed spans.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# Verhoeff algorithm tables (dihedral group D5) for Aadhaar validation.
_MUL = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
_PERM = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]
_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


@dataclass
class Span:
    """A sensitive-data span found in text."""

    entity_type: str
    start: int
    end: int
    text: str
    score: float = 1.0


# ---------------------------------------------------------------------------
# Checksum algorithms
# ---------------------------------------------------------------------------


def verhoeff_valid(number: str) -> bool:
    """Return True if ``number`` passes the Verhoeff checksum (used by Aadhaar)."""
    digits = [int(ch) for ch in number if ch.isdigit()]
    if not digits:
        return False
    c = 0
    # Process right to left.
    for i, digit in enumerate(reversed(digits)):
        c = _MUL[c][_PERM[i % 8][digit]]
    return c == 0


def verhoeff_check_digit(number: str) -> int:
    """Return the Verhoeff check digit for a number prefix."""
    digits = [int(ch) for ch in number if ch.isdigit()]
    c = 0
    for i, digit in enumerate(digits):
        c = _MUL[c][_PERM[i % 8][digit]]
    # The check digit is the value that makes the full number valid.
    for check in range(10):
        if _MUL[c][_PERM[len(digits) % 8][check]] == 0:
            return check
    return 0


def luhn_valid(number: str) -> bool:
    """Return True if ``number`` passes the Luhn checksum (payment cards)."""
    digits = [int(ch) for ch in number if ch.isdigit()]
    if len(digits) < 13:
        return False
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


# ---------------------------------------------------------------------------
# Recognizers
# ---------------------------------------------------------------------------


class IndiaRecognizers:
    """Regex-based recognizers for India-specific and general identifiers."""

    # Indian phone: optional +91 / 91 / 0 prefix, then 10 digits starting 6-9,
    # with an optional single separator after the first five digits.
    PHONE_RE = re.compile(
        r"(?:\+?91[\s\-]?)?0?[6-9]\d{4}[\s\-]?\d{5}"
    )
    # Aadhaar: 12 digits (optionally space-separated 4-4-4), Verhoeff-validated.
    AADHAAR_RE = re.compile(r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b")
    # PAN: 5 uppercase letters, 4 digits, 1 uppercase letter.
    PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
    # UPI: handle@upi (e.g. ravi@upi, handle@okicici).
    UPI_RE = re.compile(r"\b[\w.\-]{2,25}@[\w]{2,50}\b")
    # Payment card: 13-16 digits (optionally spaced), Luhn-validated.
    CARD_RE = re.compile(r"\b(?:\d[ \-]*){13,16}\b")
    # OTP: 4-8 digit code near OTP/code/pin keywords.
    OTP_RE = re.compile(
        r"\b(?:otp|code|pin|one.?time.?password)\b.{0,20}?\b\d{4,8}\b|\b\d{4,8}\b.{0,20}?\b(?:otp|code|pin|one.?time.?password)\b",
        re.IGNORECASE,
    )
    # Emails.
    EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")
    # Usernames/handles: @handle mentions.
    USERNAME_RE = re.compile(r"@([A-Za-z0-9_.-]{3,30})\b")

    def phone(self, text: str) -> list[Span]:
        return [Span("PHONE", m.start(), m.end(), m.group()) for m in self.PHONE_RE.finditer(text)]

    def aadhaar(self, text: str) -> list[Span]:
        spans: list[Span] = []
        for m in self.AADHAAR_RE.finditer(text):
            digits = re.sub(r"\D", "", m.group())
            if len(digits) == 12 and verhoeff_valid(digits):
                spans.append(Span("AADHAAR", m.start(), m.end(), m.group()))
        return spans

    def pan(self, text: str) -> list[Span]:
        return [Span("PAN", m.start(), m.end(), m.group()) for m in self.PAN_RE.finditer(text)]

    def upi(self, text: str) -> list[Span]:
        return [Span("UPI", m.start(), m.end(), m.group()) for m in self.UPI_RE.finditer(text)]

    def card(self, text: str) -> list[Span]:
        spans: list[Span] = []
        for m in self.CARD_RE.finditer(text):
            digits = re.sub(r"\D", "", m.group())
            if luhn_valid(digits):
                spans.append(Span("CARD", m.start(), m.end(), m.group()))
        return spans

    def otp(self, text: str) -> list[Span]:
        return [Span("OTP", m.start(), m.end(), m.group()) for m in self.OTP_RE.finditer(text)]

    def email(self, text: str) -> list[Span]:
        return [Span("EMAIL", m.start(), m.end(), m.group()) for m in self.EMAIL_RE.finditer(text)]

    def username(self, text: str) -> list[Span]:
        return [
            Span("USERNAME", m.start(), m.end(), m.group())
            for m in self.USERNAME_RE.finditer(text)
        ]

    def all(self, text: str) -> list[Span]:
        """Return every recognized span, ordered by position."""
        spans: list[Span] = []
        for method in (
            self.aadhaar, self.pan, self.card, self.phone, self.otp,
            self.upi, self.email, self.username,
        ):
            spans.extend(method(text))
        spans.sort(key=lambda s: s.start)
        return spans
