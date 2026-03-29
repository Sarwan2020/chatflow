import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

/**
 * Root application component.
 *
 * Sets up React Router and renders the main layout.
 * Authentication and chat pages will be added in later phases.
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-primary-600 mb-4">
                    Multi-Modal AI Chat
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Intelligent chat with persistent memory
                  </p>
                  <p className="text-gray-400 mt-8 text-sm">
                    Phase 1 — Foundation Setup Complete
                  </p>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
