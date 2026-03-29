/**
 * CodeBlock component for displaying syntax-highlighted code.
 * 
 * Features:
 * - Syntax highlighting using Prism.js
 * - Copy to clipboard functionality
 * - Language detection and display
 * - Line numbers (optional)
 * - Support for 100+ languages
 */

import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Import common language support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-html';
import 'prismjs/components/prism-xml';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-dart';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  fileName?: string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  showLineNumbers = false,
  fileName,
  className = '',
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  // Detect language from code if not provided
  const detectedLanguage = language || detectLanguage(code);
  const prismLanguage = getPrismLanguage(detectedLanguage);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, prismLanguage]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const lines = code.split('\n');

  return (
    <div className={`code-block-container ${className}`}>
      {/* Header */}
      <div className="code-block-header">
        <div className="code-block-info">
          {fileName && (
            <span className="code-block-filename">{fileName}</span>
          )}
          <span className="code-block-language">{detectedLanguage}</span>
        </div>
        <button
          onClick={handleCopy}
          className="code-block-copy-btn"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code */}
      <div className="code-block-content">
        <pre className={showLineNumbers ? 'line-numbers' : ''}>
          <code ref={codeRef} className={`language-${prismLanguage}`}>
            {code}
          </code>
        </pre>
        {showLineNumbers && (
          <div className="code-block-line-numbers">
            {lines.map((_, index) => (
              <div key={index} className="line-number">
                {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .code-block-container {
          margin: 1rem 0;
          border-radius: 0.5rem;
          overflow: hidden;
          background: #2d2d2d;
          border: 1px solid #404040;
        }

        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #1e1e1e;
          border-bottom: 1px solid #404040;
        }

        .code-block-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .code-block-filename {
          font-size: 0.875rem;
          color: #9ca3af;
          font-family: monospace;
        }

        .code-block-language {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          background: #374151;
          color: #60a5fa;
          border-radius: 0.25rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .code-block-copy-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          background: #374151;
          color: #d1d5db;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .code-block-copy-btn:hover {
          background: #4b5563;
          color: #ffffff;
        }

        .code-block-content {
          position: relative;
          overflow-x: auto;
        }

        .code-block-content pre {
          margin: 0;
          padding: 1rem;
          background: transparent;
        }

        .code-block-content code {
          font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .code-block-line-numbers {
          position: absolute;
          left: 0;
          top: 0;
          padding: 1rem 0;
          background: #1e1e1e;
          border-right: 1px solid #404040;
          user-select: none;
        }

        .line-numbers {
          padding-left: 3.5rem !important;
        }

        .line-number {
          padding: 0 0.75rem;
          text-align: right;
          color: #6b7280;
          font-size: 0.875rem;
          line-height: 1.5;
          font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
        }
      `}</style>
    </div>
  );
};

/**
 * Detect programming language from code content.
 */
function detectLanguage(code: string): string {
  // Simple heuristics for language detection
  if (code.includes('import React') || code.includes('from react')) return 'jsx';
  if (code.includes('def ') && code.includes(':')) return 'python';
  if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'javascript';
  if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) return 'typescript';
  if (code.includes('public class ') || code.includes('private ')) return 'java';
  if (code.includes('#include') || code.includes('std::')) return 'cpp';
  if (code.includes('package main') || code.includes('func ')) return 'go';
  if (code.includes('fn ') && code.includes('->')) return 'rust';
  if (code.includes('SELECT ') || code.includes('FROM ')) return 'sql';
  if (code.includes('<?php')) return 'php';
  if (code.includes('<html') || code.includes('<!DOCTYPE')) return 'html';
  if (code.includes('{') && code.includes('}') && code.includes(':')) return 'json';
  
  return 'text';
}

/**
 * Map language names to Prism language identifiers.
 */
function getPrismLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'c++': 'cpp',
    'c#': 'csharp',
  };

  return languageMap[language.toLowerCase()] || language.toLowerCase();
}

export default CodeBlock;
