# Transaction Server Workspace

This monorepo contains a full-stack financial transaction management platform, including a backend API, a modern frontend web app, and a machine learning classifier for transaction categorization.

## Projects Overview

### 1. Backend (`backend/`)
A Rust-based GraphQL API server for managing transactions and categories, interfacing with a SQL database.

- **Tech:** Rust, SQLx, GraphQL
- **Features:**
  - GraphQL endpoints for transactions, categories, and summaries
  - Database migrations and tools for data import
  - Example endpoints: `/graphql`, `/graphiql`
- **Setup:**
  1. Ensure Rust and Cargo are installed
  2. Configure your `.env` file and database
  3. Run migrations:
     ```bash
     ./migrations/apply-migrations.ps1
     ```
  4. Build and run the server:
     ```bash
     cargo run
     ```
- **See:** [`backend/README.md`](backend/README.md)

---

### 2. Frontend (`frontend/`)
A modern, responsive web application for managing and visualizing financial transactions.

- **Tech:** React 19, TypeScript, Material-UI, Joy UI, Redux Toolkit, Vite
- **Features:**
  - Transaction CRUD, categorization, charts, and filters
  - Persistent date filters and user preferences
  - GraphQL client for backend integration
- **Setup:**
  1. Install Node.js (v16+)
  2. Navigate to `frontend/` and install dependencies:
     ```bash
     npm install
     # or
     yarn install
     ```
  3. Start the dev server:
     ```bash
     npm run dev
     ```
- **See:** [`frontend/README.md`](frontend/README.md)

---

### 3. Classifier (`classifier/`)
A Python-based BERT NLP pipeline for classifying transaction descriptions into categories.

- **Tech:** Python 3, PyTorch, Transformers (BERT)
- **Features:**
  - Preprocessing, training, and inference scripts
  - Configurable categories and confidence thresholds
  - Outputs classified CSVs for use in the backend
- **Setup:**
  1. Create and activate a Python virtual environment:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
  2. Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
  3. Run preprocessing, training, and inference as described in [`classifier/README.md`](classifier/README.md)

---

### 4. Agent (`agent/`)
A Python FastAPI microservice that provides savings recommendations using transaction data from the database. It supports both local LLM (GPT4All) and OpenAI GPT-4 integration, returning structured recommendations in JSON format for easy frontend consumption.

- **Tech:** Python 3, FastAPI, GPT4All, OpenAI API, SQLAlchemy
- **Features:**
  - Uses a local LLM (GPT4All) for recommendations (customizable)
  - Optionally calls OpenAI GPT-4 for advanced recommendations
  - Date filtering: select start and end dates for transaction analysis
  - Returns recommendations as structured JSON objects (description + actions)
  - HTTP API for integration with frontend or other services
  - CORS enabled for frontend access
- **Setup:**
  1. Install GPT4All model (for local LLM) Optional
     - The frontend uses the external OpenAI endpoint, if you want to use a local LLM you can set this up instead and change the frontend code to pass `use_external_agent` as false. 
     - Go to https://www.nomic.ai/gpt4all, download a compatible model (e.g., gpt4all-13b-snoozy-q4_0.gguf), and place it in the `models/` directory or set the path in `.env`.
  2. Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
  3. (Optional) Set up OpenAI API key in `.env` for external agent:
     ```
     OPENAI_API_KEY=your-key-here
     ```
  4. Run the service:
     ```bash
     uvicorn main:app --reload
     ```
- **See:** [`agent/README.md`](agent/README.md)

---

## Integration
- The **frontend** communicates with the **backend** via GraphQL.
- The **frontend** also communicates with the **agent** for savings recommendations.
- The **classifier** can be used to enrich transaction data before or after ingestion into the backend.

## License
See [LICENSE](LICENSE) for details.

---

For detailed usage, configuration, and advanced features, see the README in each project subdirectory.
