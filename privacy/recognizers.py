"""Custom regex recognizers for India-specific PII.

Covers Aadhaar numbers, PAN cards, UPI IDs, payment card numbers and OTPs.
"""

from __future__ import annotations

import re


class IndiaRecognizers:
    """Regex-based recognizers for India-specific identifiers."""

    AADHAAR_RE = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
    PAN_RE = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
    UPI_RE = re.compile(r"\b[\w.\-]{2,25}@[\w]{2,50}\b")
    CARD_RE = re.compile(r"\b(?:\d[ -]*){13,16}\b")
    OTP_RE = re.compile(r"\b\d{4,6}\b")

    def aadhaar(self, text: str) -> list[str]:
        raise NotImplementedError("Aadhaar recognizer is not implemented yet")

    def pan(self, text: str) -> list[str]:
        raise NotImplementedError("PAN recognizer is not implemented yet")

    def upi(self, text: str) -> list[str]:
        raise NotImplementedError("UPI recognizer is not implemented yet")

    def card(self, text: str) -> list[str]:
        raise NotImplementedError("card recognizer is not implemented yet")

    def otp(self, text: str) -> list[str]:
        raise NotImplementedError("OTP recognizer is not implemented yet")
