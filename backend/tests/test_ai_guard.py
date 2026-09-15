from app.services.ai_guard import AIScopeGuard, FRIENDLY_SCOPE_MESSAGE, casual_reply, is_casual_message


def test_unrelated_request_is_blocked_without_llm_scope():
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=4000)
    decision = guard.check("Ek kahani likho")
    assert decision.allowed is False
    assert "Seller Hub" in decision.message


def test_seller_request_is_allowed():
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=4000)
    decision = guard.check("Aaj Amazon sales aur inventory check karo")
    assert decision.allowed is True


def test_seller_specific_writing_is_allowed():
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=4000)
    decision = guard.check("Mere wooden toy product ke liye listing description likho")
    assert decision.allowed is True


def test_history_cannot_make_unrelated_current_message_allowed():
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=4000)
    decision = guard.check("user: Amazon product listing check karo\nassistant: business report ready hai\nCurrent user message:\nTum kahani likh sakte ho kya")
    assert decision.allowed is False
    assert "Seller Hub" in decision.message


def test_bounded_casual_conversation_is_allowed():
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=4000)
    for text in ("Hi", "Hello bhai", "Kese ho bhai", "Bhai", "Bro", "Theek hai", "Thanks bro", "Help"):
        assert is_casual_message(text)
        assert guard.check(text).allowed is True
        assert casual_reply(text)


def test_unbounded_general_chat_is_still_blocked():
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=4000)
    for text in ("Tell me a story", "What is the capital of France?", "Mujhe travel plan chahiye"):
        assert guard.check(text).allowed is False


def test_input_limit_is_enforced():
    guard = AIScopeGuard(per_minute=10, per_hour=50, max_input_chars=20)
    decision = guard.check("Amazon product listing ke liye title optimize karo")
    assert decision.allowed is False
    assert decision.message != FRIENDLY_SCOPE_MESSAGE


def test_minute_limit_is_enforced():
    guard = AIScopeGuard(per_minute=1, per_hour=10, max_input_chars=4000)
    assert guard.check("Amazon sales check karo").allowed is True
    assert guard.check("Amazon inventory check karo").allowed is False
