
# Agent Service

This is a Python FastAPI service that provides savings recommendations based on transaction data from a PostgreSQL database. It supports both local LLM (GPT4All) and OpenAI GPT-4 integration, and returns structured recommendations in JSON format for easy frontend consumption.

## Features
- Uses a local LLM (GPT4All) for recommendations (customizable)
- Optionally calls OpenAI GPT-4 for advanced recommendations
- Date filtering: select start and end dates for transaction analysis
- Returns recommendations as structured JSON objects (description + actions)
- HTTP API for integration with frontend or other services
- CORS enabled for frontend access

## Setup
1. Install GPT4All model (for local LLM)
   - Go to https://www.nomic.ai/gpt4all, download a compatible model (e.g., gpt4all-13b-snoozy-q4_0.gguf), and place it in the `models/` directory or set the path in `.env`.
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. (Optional) Set up OpenAI API key in `.env` for external agent:
   ```
   OPENAI_API_KEY=your-key-here
   ```
4. Run the service:
   ```sh
   uvicorn main:app --reload -port 8082
   ```

## API
- `POST /recommendations` — Get savings recommendations
  - Request body: `{ user_id, use_external_agent, start_date, end_date }`
  - Response: `{ recommendations: [ { description, actions: [] } ], source }`

## Extending
- Edit `agent/local_model.py` to improve the local model or prompt
- Edit `agent/external_agent.py` to connect to OpenAI or other external APIs
- Integrated with frontend (see `/frontend` project) for interactive recommendations
