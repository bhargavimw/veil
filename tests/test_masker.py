"""Tests for the reversible masker (fully implemented in this scaffold)."""

from privacy.masker import Masker


def test_mask_and_unmask_roundtrip() -> None:
    """A masked value can be restored exactly."""
    masker = Masker()
    token = masker.mask("alice@example.com", "email")
    assert token == "[EMAIL_1]"
    assert masker.unmask(token) == "alice@example.com"


def test_same_value_same_token() -> None:
    """The same value always maps to the same token within one Masker."""
    masker = Masker()
    first = masker.mask("9876543210", "phone")
    second = masker.mask("9876543210", "phone")
    assert first == second == "[PHONE_1]"


def test_different_values_different_tokens() -> None:
    """Different values get different, sequential tokens."""
    masker = Masker()
    assert masker.mask("a@example.com", "email") == "[EMAIL_1]"
    assert masker.mask("b@example.com", "email") == "[EMAIL_2]"


def test_entity_types_are_independent() -> None:
    """Counters are per entity type, so [EMAIL_1] and [PHONE_1] coexist."""
    masker = Masker()
    assert masker.mask("a@example.com", "email") == "[EMAIL_1]"
    assert masker.mask("9876543210", "phone") == "[PHONE_1]"


def test_unmask_all_replaces_tokens_in_text() -> None:
    """Tokens embedded in text are restored by unmask_all."""
    masker = Masker()
    token = masker.mask("alice@example.com", "email")
    text = f"Contact: {token}"
    assert masker.unmask_all(text) == "Contact: alice@example.com"


def test_unmask_unknown_token_returns_none() -> None:
    assert Masker().unmask("[EMAIL_99]") is None
