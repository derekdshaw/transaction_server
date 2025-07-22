# Transaction Server Workspace

This monorepo contains a full-stack financial transaction management platform, including a backend API, a modern frontend web app, and a machine learning classifier for transaction categorization.

---

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

## Integration
- The **frontend** communicates with the **backend** via GraphQL.
- The **classifier** can be used to enrich transaction data before or after ingestion into the backend.

## License
See [LICENSE](LICENSE) for details.

---

For detailed usage, configuration, and advanced features, see the README in each project subdirectory.
