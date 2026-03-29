# Multi-Modal AI Chat Interface - Frontend

React + TypeScript + Vite frontend for the Multi-Modal AI Chat Interface.

## Prerequisites

- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)

### Installing Node.js

```bash
# macOS (Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# Windows
winget install OpenJS.NodeJS.LTS

# Or use nvm (Node Version Manager) — recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open http://localhost:5173 in your browser.

### 3. Build for Production

```bash
npm run build
```

The production build is output to `frontend/dist/`.

### 4. Preview Production Build

```bash
npm run preview
```

## Available Scripts

| Command           | Description                                    |
|-------------------|------------------------------------------------|
| `npm run dev`     | Start Vite dev server with HMR on port 5173    |
| `npm run build`   | Type-check with TypeScript, then build for prod|
| `npm run lint`    | Run ESLint across the project                  |
| `npm run preview` | Preview the production build locally           |

## Development

### Dev Server

- Runs at **http://localhost:5173**
- **Hot Module Replacement (HMR)** is enabled — changes appear instantly in the browser without a full reload
- API requests to `/api/*` are automatically proxied to `http://localhost:8000` (the backend)

### API Proxy Configuration

The Vite dev server proxies all `/api` requests to the backend. This is configured in [`vite.config.ts`](vite.config.ts):

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

> **Important**: The backend must be running on port 8000 for API requests to work during development.

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

| Alias           | Maps to              | Example                                    |
|-----------------|----------------------|--------------------------------------------|
| `@/*`           | `./src/*`            | `import App from '@/App'`                  |
| `@components/*` | `./src/components/*` | `import { Button } from '@components/common/Button'` |
| `@hooks/*`      | `./src/hooks/*`      | `import { useAuth } from '@hooks/useAuth'` |
| `@services/*`   | `./src/services/*`   | `import { api } from '@services/api'`      |
| `@types/*`      | `./src/types/*`      | `import { Message } from '@types/chat'`    |
| `@utils/*`      | `./src/utils/*`      | `import { formatDate } from '@utils/formatters'` |
| `@contexts/*`   | `./src/contexts/*`   | `import { AuthContext } from '@contexts/AuthContext'` |

### Key Dependencies

| Package            | Purpose                                |
|--------------------|----------------------------------------|
| `react` / `react-dom` | UI framework                       |
| `react-router-dom` | Client-side routing                   |
| `axios`            | HTTP client for API requests           |
| `zustand`          | Lightweight state management           |
| `react-markdown`   | Render markdown in chat messages       |
| `prismjs`          | Syntax highlighting for code blocks    |
| `lucide-react`     | Icon library                           |
| `tailwindcss`      | Utility-first CSS framework            |

## Project Structure

```
frontend/src/
├── components/              # React components organized by feature
│   ├── auth/               # Authentication forms
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── chat/               # Chat interface components
│   │   ├── ChatInterface.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── ImageRenderer.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── TokenCounter.tsx
│   ├── sidebar/            # Sidebar navigation
│   │   ├── Sidebar.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   └── SearchBar.tsx
│   ├── memory/             # Memory management
│   │   ├── MemoryManager.tsx
│   │   ├── MemoryList.tsx
│   │   └── MemoryItem.tsx
│   ├── settings/           # Settings panels
│   │   ├── SettingsPanel.tsx
│   │   ├── APIKeyManager.tsx
│   │   └── ModelSelector.tsx
│   └── common/             # Shared UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Loading.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
├── contexts/               # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   ├── ChatContext.tsx      # Chat/conversation state
│   └── SettingsContext.tsx  # User settings state
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication logic
│   ├── useChat.ts          # Chat operations
│   ├── useMemory.ts        # Memory CRUD operations
│   ├── useSSE.ts           # Server-Sent Events handling
│   └── useTokenUsage.ts   # Token usage tracking
├── services/               # API client functions
│   ├── api.ts              # Axios instance and interceptors
│   ├── auth.ts             # Auth API calls
│   ├── chat.ts             # Chat API calls
│   ├── memory.ts           # Memory API calls
│   └── sse.ts              # SSE connection management
├── types/                  # TypeScript type definitions
│   ├── api.ts              # API response types
│   ├── auth.ts             # Auth-related types
│   ├── chat.ts             # Chat/message types
│   └── memory.ts           # Memory types
├── utils/                  # Utility functions
│   ├── constants.ts        # App-wide constants
│   ├── formatters.ts       # Date/number formatting
│   └── validators.ts       # Input validation helpers
├── pages/                  # Page-level components
│   ├── ChatPage.tsx        # Main chat page
│   ├── LoginPage.tsx       # Login page
│   ├── RegisterPage.tsx    # Registration page
│   └── SettingsPage.tsx    # Settings page
├── App.tsx                 # Root component with routing
├── main.tsx                # Application entry point
├── index.css               # Global styles with Tailwind directives
└── vite-env.d.ts           # Vite type declarations
```

## Troubleshooting

### `node: command not found`

Node.js is not installed or not in your PATH. See the [Installing Node.js](#installing-nodejs) section above.

### `npm install` fails

```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Port 5173 already in use

Vite will automatically try the next available port. To specify a custom port:

```bash
npx vite --port 3000
```

### API requests returning 404 or network errors

1. Ensure the backend is running on port 8000
2. Check the proxy configuration in `vite.config.ts`
3. Verify the backend health: `curl http://localhost:8000/api/health`

### TypeScript errors on build

```bash
# Check for type errors without building
npx tsc --noEmit

# Build ignoring type errors (not recommended for production)
npx vite build
```
