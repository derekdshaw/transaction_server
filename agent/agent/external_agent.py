from typing import List
import os
from openai import OpenAI
import json
import re

def get_external_recommendations(transactions: List[dict], prompt: str = None) -> List[str]:
    # Use the same prompt logic as LocalModel
    base_prompt = prompt or (
        "You are a financial assistant. Based on the following transactions, give 5 actionable recommendations to help the user save money. "
        "Be specific and practical. Return the data in JSON format with each main recommendation being an object with a description and a list of actions to take. Transactions: "
    )
    tx_str = "\n".join([
        f"{t['date']}: ({t['category']}) - ${t['amount']}" for t in transactions
    ])
    full_prompt = f"{base_prompt}\n{tx_str}\nRecommendations:"

    # Get OpenAI API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")
    
    client = OpenAI(api_key=api_key)

    prompt = json.dumps({"role": "user", "content": full_prompt})
    response = client.responses.create(
        model="gpt-4.1",  # or "gpt-3.5-turbo"
        input=prompt,
    )

    if not response or not hasattr(response, 'output_text'):
        raise RuntimeError("Failed to get a valid response from OpenAI API.")
    
    content = response.output_text
    cleaned = re.sub(r'^```json\\n|^```json|^```|```$', '', content.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip()
    try:
        recs_json = json.loads(cleaned)
    except Exception as e:
        raise RuntimeError(f"Failed to parse OpenAI response as JSON: {e}\nResponse: {content}")
    return recs_json
