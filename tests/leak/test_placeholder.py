"""Placeholder leak / red-team tests.

Real tests will assert that no real PII (Aadhaar, PAN, card numbers, OTPs,
emails, phones) ever reaches an agent or a connector log. These are disabled
until the masking and audit logic is implemented.
"""

import pytest


@pytest.mark.skip(reason="masking not yet implemented")
def test_no_real_pii_leaks_to_agent() -> None:
    assert True


@pytest.mark.skip(reason="audit log not yet implemented")
def test_no_pii_in_audit_log() -> None:
    assert True
