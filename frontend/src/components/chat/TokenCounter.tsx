/**
 * TokenCounter component for displaying token usage.
 * 
 * Features:
 * - Display current conversation tokens
 * - Show tokens as user types
 * - Visual progress bar
 * - Color coding (green < 50%, yellow < 80%, red >= 80%)
 * - Model context limit display
 */

import React from 'react';
import { useTokenUsage, useContextLimit } from '../../hooks/useTokenUsage';

interface TokenCounterProps {
  conversationId?: string;
  currentTokens?: number;
  contextLimit?: number;
  showDetails?: boolean;
  className?: string;
}

const TokenCounter: React.FC<TokenCounterProps> = ({
  conversationId,
  currentTokens = 0,
  contextLimit = 4096,
  showDetails = false,
  className = '',
}) => {
  const { conversationUsage, fetchConversationUsage } = useTokenUsage();
  const {
    percentage,
    color,
    isNearLimit,
    isOverLimit,
    remainingTokens,
  } = useContextLimit(currentTokens, contextLimit);

  React.useEffect(() => {
    if (conversationId) {
      fetchConversationUsage(conversationId);
    }
  }, [conversationId, fetchConversationUsage]);

  const totalTokens = conversationUsage?.total_tokens || currentTokens;
  const displayPercentage = useContextLimit(totalTokens, contextLimit).percentage;
  const displayColor = useContextLimit(totalTokens, contextLimit).color;

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'token-counter-green';
      case 'yellow':
        return 'token-counter-yellow';
      case 'red':
        return 'token-counter-red';
      default:
        return 'token-counter-green';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className={`token-counter ${className}`}>
      <div className="token-counter-header">
        <div className="token-counter-label">
          <svg className="token-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>Tokens</span>
        </div>
        <div className={`token-counter-value ${getColorClass(displayColor)}`}>
          {formatNumber(totalTokens)} / {formatNumber(contextLimit)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="token-counter-progress">
        <div
          className={`token-counter-bar ${getColorClass(displayColor)}`}
          style={{ width: `${Math.min(displayPercentage, 100)}%` }}
        />
      </div>

      {/* Warning Messages */}
      {isNearLimit && !isOverLimit && (
        <div className="token-counter-warning">
          ⚠️ Approaching context limit ({formatNumber(remainingTokens)} tokens remaining)
        </div>
      )}

      {isOverLimit && (
        <div className="token-counter-error">
          ❌ Context limit exceeded! Please start a new conversation.
        </div>
      )}

      {/* Detailed Stats */}
      {showDetails && conversationUsage && (
        <div className="token-counter-details">
          <div className="detail-row">
            <span>Prompt Tokens:</span>
            <span>{formatNumber(conversationUsage.total_prompt_tokens)}</span>
          </div>
          <div className="detail-row">
            <span>Completion Tokens:</span>
            <span>{formatNumber(conversationUsage.total_completion_tokens)}</span>
          </div>
          <div className="detail-row">
            <span>Messages:</span>
            <span>{conversationUsage.message_count}</span>
          </div>
        </div>
      )}

      <style>{`
        .token-counter {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .token-counter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .token-counter-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .token-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .token-counter-value {
          font-size: 0.875rem;
          font-weight: 600;
          font-family: monospace;
        }

        .token-counter-green {
          color: #10b981;
        }

        .token-counter-yellow {
          color: #f59e0b;
        }

        .token-counter-red {
          color: #ef4444;
        }

        .token-counter-progress {
          height: 0.5rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .token-counter-bar {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
          border-radius: 9999px;
        }

        .token-counter-bar.token-counter-green {
          background: #10b981;
        }

        .token-counter-bar.token-counter-yellow {
          background: #f59e0b;
        }

        .token-counter-bar.token-counter-red {
          background: #ef4444;
        }

        .token-counter-warning {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .token-counter-error {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .token-counter-details {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e5e7eb;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .detail-row span:last-child {
          font-weight: 600;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default TokenCounter;
