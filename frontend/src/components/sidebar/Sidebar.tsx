/**
 * Sidebar component.
 *
 * Main sidebar container with collapsible functionality, new conversation button,
 * search bar, and conversation list.
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../../contexts/ChatContext'
import { useAuth } from '../../hooks/useAuth'
import ConversationList from './ConversationList'
import SearchBar from './SearchBar'
import type { Conversation } from '../../types/chat'

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

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations
    }

    const query = searchQuery.toLowerCase()
    return conversations.filter((conv: Conversation) => {
      const titleMatch = conv.title.toLowerCase().includes(query)
      const messageMatch = conv.last_message?.toLowerCase().includes(query)
      return titleMatch || messageMatch
    })
  }, [conversations, searchQuery])

  const handleNewConversation = async () => {
    try {
      await createNewConversation()
    } catch (err) {
      console.error('Error creating conversation:', err)
    }
  }

  const handleSelectConversation = async (id: string) => {
    try {
      await switchConversation(id)
    } catch (err) {
      console.error('Error switching conversation:', err)
    }
  }

  const handleDeleteConversation = async (id: string) => {
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div
      className={`bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              AI Chat
            </h1>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isCollapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        </div>
        
        {/* New Conversation Button */}
        {!isCollapsed && (
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
        )}

        {isCollapsed && (
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="New Chat"
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
          </button>
        )}
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <SearchBar onSearch={handleSearch} />
        </div>
      )}

      {/* Conversation List */}
      {!isCollapsed ? (
        <ConversationList
          conversations={filteredConversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      ) : (
        <div className="flex-1 overflow-y-auto py-2">
          {/* Collapsed view - show only icons */}
          {conversations.slice(0, 10).map((conv: Conversation) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`w-full p-3 flex items-center justify-center transition-colors ${
                conv.id === activeConversation?.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={conv.title}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Footer with user info and settings */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <>
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
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {/* User Avatar */}
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.email?.[0].toUpperCase()}
            </div>
            
            {/* Settings Icon */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Settings"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            
            {/* Logout Icon */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Logout"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
