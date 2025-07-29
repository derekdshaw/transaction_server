import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from agent.db import get_all_transactions

# Optionally, set up a test database URL
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

@pytest.fixture(autouse=True)
def set_test_db(monkeypatch):
    if TEST_DATABASE_URL:
        monkeypatch.setenv("DATABASE_URL", TEST_DATABASE_URL)


def test_get_all_transactions_returns_list():
    transactions = get_all_transactions()
    assert isinstance(transactions, list)
    # If there are transactions, check structure
    if transactions:
        t = transactions[0]
        assert "id" in t
        assert "amount" in t
        assert "category" in t
        assert "description" in t
        assert "date" in t
