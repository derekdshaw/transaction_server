from typing import List, Optional
from gpt4all import GPT4All
import os

class LocalModel:
    def __init__(self, model: Optional[str] = None):
        # You can specify the path to your GPT4All model file here
        self.model_path = model or os.path.join(os.path.dirname(__file__), "..", "models", "gpt4all-13b-snoozy-q4_0.gguf")
        # Force CPU only inference
        self.model = GPT4All(self.model_path, device="cpu")

    def recommend(self, transactions: List[dict], prompt: Optional[str] = None) -> List[str]:
        # Default prompt if none provided
        base_prompt = prompt or (
            "You are a financial assistant. Based on the following transactions, give 5 actionable recommendations to help the user save money. "
            "Be specific and practical. Transactions: "
        )
        # Format transactions as a string {t.get('description', '')}
        tx_str = "\n".join([
            f"{t['date']}: ({t['category']}) - ${t['amount']}" for t in transactions
        ])
        full_prompt = f"{base_prompt}\n{tx_str}\nRecommendations:"
        print(f"Full prompt size: {len(full_prompt)}")  # Debugging line to see the full prompt
        # Query the local LLM with CPU only
        response = self.model.generate(full_prompt, max_tokens=200)
        # Split recommendations if possible
        recs = [r.strip("- ") for r in response.split("\n") if r.strip()]
        return recs
