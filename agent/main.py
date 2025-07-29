from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from agent.recommendation import get_savings_recommendations
from agent.db import get_all_transactions
from agent.schemas import Transaction
from agent.local_model import LocalModel
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize LocalModel on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.local_model = LocalModel()
    yield
    # Optionally, add cleanup code here

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transaction(BaseModel):
    id: int
    amount: float
    category: str
    description: Optional[str] = None
    date: str

class RecommendationRequest(BaseModel):
    user_id: int
    use_external_agent: bool = False
    start_date: Optional[str] = None
    end_date: Optional[str] = None


from typing import Any
class RecommendationResponse(BaseModel):
    recommendations: Any
    source: str


# New endpoint to get all transactions
@app.get("/transactions", response_model=List[Transaction])
def list_transactions():
    return get_all_transactions()


@app.post("/recommendations", response_model=RecommendationResponse)
def recommendations(request_data: RecommendationRequest, request: Request):
    try:
        recs, source = get_savings_recommendations(
            request,
            request_data.use_external_agent,
            start_date=request_data.start_date,
            end_date=request_data.end_date
        )
        return RecommendationResponse(recommendations=recs, source=source)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
