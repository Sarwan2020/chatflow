/**
 * ChatPage - Main chat interface page.
 *
 * Combines sidebar and chat interface with conversation management.
 */

import React from 'react'
import Sidebar from '../components/sidebar/Sidebar'
import ChatInterface from '../components/chat/ChatInterface'

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  )
}
