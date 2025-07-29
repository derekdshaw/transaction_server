import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from agent.local_model import LocalModel

# @pytest.mark.skipif(
#     not os.path.exists(os.getenv("GPT4ALL_MODEL_PATH", "ggml-gpt4all-j-v1.3-groovy.bin")),
#     reason="GPT4All model file not found. Set GPT4ALL_MODEL_PATH or place model in working directory."
# )
def test_recommend_with_real_model(dummy_transactions):
    model = LocalModel() # could use other models here, they are downloaded automatically
    recs = model.recommend(dummy_transactions, "You are a financial assistant. Based on the following transactions, give 3 actionable recommendations to help the user save money. Be specific and practical. Transactions:")
    assert isinstance(recs, list)
    assert all(isinstance(r, str) for r in recs)
    assert len(recs) > 0

@pytest.fixture
def dummy_transactions():
    return [
        {"date": "2025-07-01", "description": "Coffee Shop", "category": "Food", "amount": 4.5},
        {"date": "2025-07-02", "description": "Grocery Store", "category": "Groceries", "amount": 56.2},
        {"date": "2025-07-03", "description": "Streaming Service", "category": "Entertainment", "amount": 12.99},
    ]
