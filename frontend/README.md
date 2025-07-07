# Transaction Server Frontend

A modern, responsive web application for managing and visualizing financial transactions. Built with React, TypeScript, and Material-UI with Joy UI components.

## Features

- Transaction management (view, add, edit, delete)
- Categorization of transactions
- Data visualization with charts and graphs
- Responsive design for all device sizes
- State management with Redux Toolkit
- Type-safe with TypeScript

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **UI Components**: Material-UI (MUI) with Joy UI
- **State Management**: Redux Toolkit
- **Data Visualization**: MUI X Charts
- **Date Handling**: Day.js
- **GraphQL Client**: graphql-hooks
- **Build Tool**: Vite

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── graphqlClient.ts # GraphQL client configuration
├── public/             # Static files
├── package.json        # Project dependencies and scripts
└── vite.config.ts      # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
VITE_API_URL=http://localhost:8000/graphql
```

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## Development

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.

### Building for Production

```bash
npm run build
```

This will create a `dist` directory with the production build.

## Browser Support

The application supports modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
