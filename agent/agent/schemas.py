from pydantic import BaseModel
from typing import Optional

class Transaction(BaseModel):
    id: int
    amount: float
    category: str
    description: Optional[str] = None
    date: str
