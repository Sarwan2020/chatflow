/**
 * MessageBubble component.
 *
 * Renders a single message with role-based styling and content type handling.
 * Supports code blocks, images, and markdown formatting.
 */

import React from 'react'
import type { Message } from '../../types/chat'
import { formatDistanceToNow } from 'date-fns'
import CodeBlock from './CodeBlock'
import ImageRenderer from './ImageRenderer'

interface MessageBubbleProps {
  message: Message
}

interface ContentPart {
  type: 'text' | 'code' | 'image'
  content: string
  language?: string
  alt?: string
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  // Parse message content to extract code blocks and images
  const parseContent = (content: string): ContentPart[] => {
    const parts: ContentPart[] = []
    let remaining = content

    // Regex patterns
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g

    let lastIndex = 0
    const matches: Array<{ index: number; length: number; part: ContentPart }> = []

    // Find all code blocks
    let match
    while ((match = codeBlockRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        part: {
          type: 'code',
          content: match[2].trim(),
          language: match[1] || 'text',
        },
      })
    }

    // Find all images
    while ((match = imageRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        part: {
          type: 'image',
          content: match[2],
          alt: match[1] || 'Image',
        },
      })
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index)

    // Build parts array
    matches.forEach((match) => {
      // Add text before this match
      if (match.index > lastIndex) {
        const textContent = content.substring(lastIndex, match.index).trim()
        if (textContent) {
          parts.push({ type: 'text', content: textContent })
        }
      }

      // Add the match
      parts.push(match.part)
      lastIndex = match.index + match.length
    })

    // Add remaining text
    if (lastIndex < content.length) {
      const textContent = content.substring(lastIndex).trim()
      if (textContent) {
        parts.push({ type: 'text', content: textContent })
      }
    }

    // If no special content found, return the whole content as text
    if (parts.length === 0) {
      parts.push({ type: 'text', content })
    }

    return parts
  }

  const contentParts = parseContent(message.content)

  const renderContentPart = (part: ContentPart, index: number) => {
    switch (part.type) {
      case 'code':
        return (
          <div key={index} className="my-2">
            <CodeBlock code={part.content} language={part.language} />
          </div>
        )
      case 'image':
        return (
          <div key={index} className="my-2">
            <ImageRenderer src={part.content} alt={part.alt} />
          </div>
        )
      case 'text':
      default:
        return (
          <div key={index} className="whitespace-pre-wrap break-words">
            {part.content}
          </div>
        )
    }
  }

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${
        isSystem ? 'opacity-70' : ''
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : isSystem
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        {/* Message content with code blocks and images */}
        <div className="space-y-2">
          {contentParts.map((part, index) => renderContentPart(part, index))}
        </div>

        {/* Message metadata */}
        <div
          className={`mt-2 text-xs flex items-center gap-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <span>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.model && (
            <>
              <span>•</span>
              <span>{message.model}</span>
            </>
          )}
          {message.total_tokens && (
            <>
              <span>•</span>
              <span>{message.total_tokens} tokens</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
