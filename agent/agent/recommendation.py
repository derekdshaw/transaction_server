
from typing import List, Tuple
from fastapi import Request
from .local_model import LocalModel
from .external_agent import get_external_recommendations
from .db import get_transactions_between_dates


import datetime

def get_savings_recommendations(request: Request, use_external_agent: bool = False, start_date: str = None, end_date: str = None) -> Tuple[List[str], str]:
    # Use provided dates or default to last 14 days
    if not end_date:
        end_date = datetime.date.today().isoformat()
    if not start_date:
        start_date = (datetime.date.fromisoformat(end_date) - datetime.timedelta(days=30)).isoformat()

    transactions = get_transactions_between_dates(start_date, end_date)
    if not transactions:
        return [], "no transactions available"

    if use_external_agent:
        # Call external agent (e.g., ChatGPT)
        recs = get_external_recommendations(transactions)
        return recs, "external"
    else:
        # Use local model from app state
        local_model = request.app.state.local_model
        recs = local_model.recommend(transactions)
        return recs, "local"
