/**
 * ConversationList component.
 *
 * List of conversations grouped by date.
 */

import React from 'react'
import type { Conversation } from '../../types/chat'
import ConversationItem from './ConversationItem'
import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  startOfDay,
  parseISO
} from 'date-fns'

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

interface GroupedConversations {
  today: Conversation[]
  yesterday: Conversation[]
  thisWeek: Conversation[]
  thisMonth: Conversation[]
  older: Conversation[]
}

function groupConversations(conversations: Conversation[]): GroupedConversations {
  const groups: GroupedConversations = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: []
  }

  conversations.forEach((conv) => {
    const date = parseISO(conv.updated_at)
    
    if (isToday(date)) {
      groups.today.push(conv)
    } else if (isYesterday(date)) {
      groups.yesterday.push(conv)
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      groups.thisWeek.push(conv)
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(conv)
    } else {
      groups.older.push(conv)
    }
  })

  return groups
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation
}: ConversationListProps) {
  const grouped = groupConversations(conversations)

  const renderGroup = (title: string, convs: Conversation[]) => {
    if (convs.length === 0) return null

    return (
      <div className="mb-4">
        <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="space-y-1">
          {convs.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
              onDelete={() => onDeleteConversation(conv.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No conversations yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {renderGroup('Today', grouped.today)}
      {renderGroup('Yesterday', grouped.yesterday)}
      {renderGroup('This Week', grouped.thisWeek)}
      {renderGroup('This Month', grouped.thisMonth)}
      {renderGroup('Older', grouped.older)}
    </div>
  )
}
