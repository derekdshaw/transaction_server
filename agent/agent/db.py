import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import List, Dict

# Load database URL from environment or fallback
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://transactions_user:349trAnsaCtions90@localhost:5432/account_transactions")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_all_transactions() -> List[Dict]:
    query = text("SELECT t.id, t.amount, c.name as category, t.description, t.date FROM transactions as t join categories as c on t.category_id = c.id")
    with SessionLocal() as session:
        result = session.execute(query)
        transactions = []
        for row in result:
            d = dict(row._mapping)
            if isinstance(d["date"], (str, type(None))):
                pass
            else:
                d["date"] = d["date"].isoformat()
            transactions.append(d)
    return transactions

# New method: get transactions between two dates
def get_transactions_between_dates(start_date: str, end_date: str) -> List[Dict]:
    query = text("""
        SELECT t.id, t.amount, c.name as category, t.description, t.date
        FROM transactions as t
        JOIN categories as c ON t.category_id = c.id
        WHERE t.date >= :start_date AND t.date <= :end_date
    """)
    with SessionLocal() as session:
        result = session.execute(query, {"start_date": start_date, "end_date": end_date})
        transactions = []
        for row in result:
            d = dict(row._mapping)
            if isinstance(d["date"], (str, type(None))):
                pass
            else:
                d["date"] = d["date"].isoformat()
            transactions.append(d)
    return transactions
