/**
 * Sidebar component.
 *
 * Main sidebar container with new conversation button and conversation list.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../../contexts/ChatContext'
import { useAuth } from '../../hooks/useAuth'
import ConversationList from './ConversationList'

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    conversations,
    activeConversation,
    createNewConversation,
    switchConversation,
    deleteConversation
  } = useChat()

  const handleNewConversation = async () => {
    try {
      await createNewConversation()
    } catch (err) {
      console.error('Error creating conversation:', err)
    }
  }

  const handleSelectConversation = async (id: number) => {
    try {
      await switchConversation(id)
    } catch (err) {
      console.error('Error switching conversation:', err)
    }
  }

  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation(id)
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          AI Chat
        </h1>
        
        {/* New Conversation Button */}
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Footer with user info and settings */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.email?.[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {user?.email}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
