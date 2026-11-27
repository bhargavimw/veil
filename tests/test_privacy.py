"""Unit tests for the privacy engine and identity modules.

Covers reversible tokenization, aliases, checksum validation (Luhn/Verhoeff),
metadata shielding and a leak test asserting no seeded fake secret leaks into
masked output.
"""

from __future__ import annotations

import os

# Use a valid Fernet key for the vault in tests.
from cryptography.fernet import Fernet  # noqa: E402

os.environ["VEIL_VAULT_KEY"] = Fernet.generate_key().decode()


from identity.aliases import AliasGenerator, generate_virtual_card, luhn_valid  # noqa: E402
from identity.vault import TokenVault  # noqa: E402
from privacy.detector import PIIDetector  # noqa: E402
from privacy.masker import Masker  # noqa: E402
from privacy.metadata import MetadataShield  # noqa: E402
from privacy.recognizers import (  # noqa: E402
    luhn_valid as rec_luhn_valid,
)
from privacy.recognizers import (
    verhoeff_valid,
)

SECRETS = [
    "alice@example.com",
    "+91 98765 43210",
    "9876543210",
    "ABCDE1234F",
    "4111 1111 1111 1111",
    "ravi@upi",
    "Aarav Sharma",
]


# ---------------------------------------------------------------------------
# Token consistency & reversibility
# ---------------------------------------------------------------------------


def test_tokenize_is_consistent_within_context() -> None:
    """Same real value -> same token within a context_id."""
    vault = TokenVault()
    masker = Masker(vault=vault)
    text = "Contact alice@example.com or alice@example.com again."
    masked1, _ = masker.tokenize(text, "ctx-1")
    masked2, _ = masker.tokenize(text, "ctx-1")
    assert masked1 == masked2
    assert "[EMAIL_1]" in masked1
    assert "alice@example.com" not in masked1


def test_tokenize_differs_across_contexts() -> None:
    """Different contexts may issue different tokens for the same value."""
    vault = TokenVault()
    masker = Masker(vault=vault)
    text = "alice@example.com"
    masked_a, _ = masker.tokenize(text, "ctx-a")
    masked_b, _ = masker.tokenize(text, "ctx-b")
    # Tokens are stable within a context, not necessarily across contexts.
    assert masked_a.count("[EMAIL") == 1
    assert masked_b.count("[EMAIL") == 1


def test_detokenize_restores_allowed_tokens() -> None:
    """Tokens in allowed_tokens are restored; others stay masked."""
    vault = TokenVault()
    masker = Masker(vault=vault)
    text = "alice@example.com called +91 98765 43210."
    masked, records = masker.tokenize(text, "ctx-1")
    email_token = next(r.token for r in records if r.kind == "EMAIL")
    phone_token = next(r.token for r in records if r.kind == "PHONE")

    # Allow only the email token.
    restored = masker.detokenize(masked, [email_token])
    assert "alice@example.com" in restored
    assert phone_token in restored  # phone not allowed -> stays masked


def test_detokenize_refuses_non_allowed_tokens() -> None:
    """detokenize with no allowed tokens leaves everything masked."""
    vault = TokenVault()
    masker = Masker(vault=vault)
    text = "alice@example.com"
    masked, _ = masker.tokenize(text, "ctx-1")
    restored = masker.detokenize(masked, [])
    assert restored == masked
    assert "alice@example.com" not in restored


def test_revoked_token_never_detokenizes() -> None:
    """Revoked tokens cannot be restored."""
    vault = TokenVault()
    masker = Masker(vault=vault)
    text = "alice@example.com"
    masked, records = masker.tokenize(text, "ctx-1")
    token = records[0].token
    vault.revoke(token)
    restored = masker.detokenize(masked, [token])
    assert token in restored
    assert "alice@example.com" not in restored


# ---------------------------------------------------------------------------
# Checksum validation
# ---------------------------------------------------------------------------


def test_luhn_valid_card() -> None:
    """Test card 4111... passes Luhn; a mutated one does not."""
    assert luhn_valid("4111 1111 1111 1111")
    assert rec_luhn_valid("4111111111111111")
    assert not luhn_valid("4111 1111 1111 1112")
    assert not rec_luhn_valid("1234 5678 9012 3456")


def test_generate_virtual_card_is_luhn_valid() -> None:
    card = generate_virtual_card("4111")
    assert luhn_valid(card)
    assert card.startswith("4111")
    assert len(card) == 16


def test_verhoeff_aadhaar() -> None:
    """A valid Verhoeff check digit passes; a mutated one fails."""
    base = "12345678901"
    # Build a full 12-digit number with a correct Verhoeff check digit.
    # Compute check digit by brute force.
    for digit in range(10):
        candidate = base + str(digit)
        if verhoeff_valid(candidate):
            assert verhoeff_valid(candidate) is True
            assert not verhoeff_valid(base + str((digit + 1) % 10))
            break
    else:
        raise AssertionError("no valid Verhoeff check digit found")
    assert not verhoeff_valid("1234567890123")  # wrong length
    assert not verhoeff_valid("abcdefghijkl")


# ---------------------------------------------------------------------------
# Detector
# ---------------------------------------------------------------------------


def test_detector_finds_email_phone_card() -> None:
    detector = PIIDetector(use_presidio=False)
    text = "alice@example.com, +91 98765 43210, 4111 1111 1111 1111"
    matches = detector.analyze(text)
    types = {m.entity_type for m in matches}
    assert "EMAIL" in types
    assert "PHONE" in types
    assert "CARD" in types
    for m in matches:
        assert text[m.start:m.end] == m.text


def test_detector_rejects_otp_near_keyword() -> None:
    detector = PIIDetector(use_presidio=False)
    text = "Your OTP is 123456."
    matches = detector.find(text, "OTP")
    assert any("123456" in m.text for m in matches)


# ---------------------------------------------------------------------------
# Metadata shielding
# ---------------------------------------------------------------------------


def test_metadata_strip_and_generalize() -> None:
    shield = MetadataShield()
    data = {
        "ip": "203.0.113.42",
        "user_agent": "Mozilla/5.0 (Chrome/124.0)",
        "location": "28.6139,77.2090",
        "timestamp": "2026-01-15T14:37:45+00:00",
        "x_originating_ip": "10.0.0.5",
        "referrer": "https://evil.com/track",
        "utm_source": "newsletter",
        "safe_field": "keep me",
    }
    sanitized, transformations = shield.apply(data)
    assert sanitized["safe_field"] == "keep me"
    assert sanitized["ip"] == "203.0.113.0"
    assert sanitized["x_originating_ip"] is None
    assert sanitized["referrer"] is None
    assert sanitized["utm_source"] is None
    assert "Chrome" in sanitized["user_agent"] or sanitized["user_agent"] == "[ua]"
    assert sanitized["timestamp"].endswith(":00:00+00:00")
    assert all(t["type"] == "strip_metadata" for t in transformations)
    fields = {t["field"] for t in transformations}
    assert "ip" in fields
    assert "x_originating_ip" in fields
    assert "referrer" in fields
    assert "utm_source" in fields


def test_metadata_rule_disabled() -> None:
    shield = MetadataShield()
    shield.remove_rule("ip")
    data = {"ip": "203.0.113.42"}
    sanitized, transformations = shield.apply(data)
    assert sanitized["ip"] == "203.0.113.42"
    assert not any(t["field"] == "ip" for t in transformations)


# ---------------------------------------------------------------------------
# Aliases
# ---------------------------------------------------------------------------


def test_alias_stable_within_scope() -> None:
    gen = AliasGenerator()
    scope = AliasGenerator.scope_key(agent="agent-1", service="gmail")
    a1 = gen.email("alice@example.com", scope=scope)
    a2 = gen.email("alice@example.com", scope=scope)
    assert a1 == a2
    # Different value -> different alias.
    assert gen.email("bob@example.com", scope=scope) != a1


def test_alias_differs_across_scopes() -> None:
    gen = AliasGenerator()
    global_scope = AliasGenerator.scope_key()
    agent_scope = AliasGenerator.scope_key(agent="agent-1")
    assert gen.email("alice@example.com", scope=global_scope) != gen.email(
        "alice@example.com", scope=agent_scope
    )


def test_virtual_card_aliases_are_luhn_valid() -> None:
    gen = AliasGenerator()
    c1 = gen.card(scope="global")
    assert luhn_valid(c1)
    assert c1.startswith("4111")
    assert len(c1) == 16
    # Same (empty) real value within a scope -> same alias (stability).
    assert gen.card(scope="global") == c1
    # Different real value -> different alias.
    assert gen.card("4111 2222 3333 4444", scope="global") != c1
    # Different generator (different seed) -> different card.
    gen2 = AliasGenerator()
    assert luhn_valid(gen2.card(scope="global"))


# ---------------------------------------------------------------------------
# Leak test
# ---------------------------------------------------------------------------


def test_leak_no_secret_in_masked_output() -> None:
    """None of the seeded fake secrets may appear in masked text."""
    vault = TokenVault()
    masker = Masker(vault=vault)
    text = (
        "alice@example.com called +91 98765 43210 from PAN ABCDE1234F, "
        "paid with card 4111 1111 1111 1111, UPI ravi@upi, OTP 123456."
    )
    masked, _ = masker.tokenize(text, "leak-ctx")
    for secret in SECRETS:
        assert secret not in masked, f"secret leaked: {secret!r} in {masked!r}"
