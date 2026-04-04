/**
 * SettingsPage component.
 *
 * Full-page settings view with comprehensive settings panel.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import SettingsPanel from '../components/settings/SettingsPanel'

export default function SettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Chat
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your API keys, model preferences, and application settings
          </p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <SettingsPanel />
        </div>
      </div>
    </div>
  )
}
