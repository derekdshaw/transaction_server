import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from agent.local_model import LocalModel

@pytest.fixture
def dummy_transactions():
    return [
        {"date": "2025-07-01", "description": "Coffee Shop", "category": "Food", "amount": 4.5},
        {"date": "2025-07-02", "description": "Grocery Store", "category": "Groceries", "amount": 56.2},
        {"date": "2025-07-03", "description": "Streaming Service", "category": "Entertainment", "amount": 12.99},
    ]


def test_recommend_returns_list(monkeypatch, dummy_transactions):
    # Patch LocalModel.__init__ to do nothing
    monkeypatch.setattr(LocalModel, "__init__", lambda self, model_path=None: None)
    
    # Patch the model's generate method to return a fake response
    class DummyModel:
        def generate(self, prompt, max_tokens=200):
            return "- Cancel unused subscriptions.\n- Cook at home more often.\n- Set a monthly budget."
    model = LocalModel()
    model.model = DummyModel()
    recs = model.recommend(dummy_transactions)
    assert isinstance(recs, list)
    assert len(recs) == 3
    assert all(isinstance(r, str) for r in recs)


def test_recommend_custom_prompt(monkeypatch, dummy_transactions):
    monkeypatch.setattr(LocalModel, "__init__", lambda self, model_path=None: None)
    class DummyModel:
        def generate(self, prompt, max_tokens=200):
            assert "custom prompt" in prompt
            return "- Test recommendation."
    model = LocalModel()
    model.model = DummyModel()
    recs = model.recommend(dummy_transactions, prompt="custom prompt")
    assert recs == ["Test recommendation."]
