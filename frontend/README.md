# Multi-Modal AI Chat Interface - Frontend

React + TypeScript + Vite frontend for the Multi-Modal AI Chat Interface.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Development

- Dev server runs at http://localhost:5173
- API requests are proxied to http://localhost:8000
- Hot Module Replacement (HMR) is enabled

## Project Structure

```
frontend/src/
├── components/          # React components by feature
│   ├── auth/           # Authentication forms
│   ├── chat/           # Chat interface components
│   ├── sidebar/        # Sidebar navigation
│   ├── memory/         # Memory management
│   ├── settings/       # Settings panels
│   └── common/         # Shared UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── services/           # API client functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── pages/              # Page-level components
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── index.css           # Global styles with Tailwind
```
