'use client';

// -----------------------------------------------------------------
// Architex -- CodePanel: Algorithm Source Code with Line Highlighting
// -----------------------------------------------------------------
//
// Displays algorithm source code alongside the visualization.
// Highlights the current line as animation progresses, synced
// with the step index. Supports multiple languages via a
// language selector. Uses a simple pre/code block with line
// numbers and CSS-class-based syntax highlighting (no Monaco).
// -----------------------------------------------------------------

import { memo, useMemo, useRef, useEffect } from 'react';
import { Code2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────

export type CodeLanguage = 'typescript' | 'python';

export interface CodeSnippet {
  language: CodeLanguage;
  label: string;
  lines: string[];
}

export interface CodePanelProps {
  /** One or more code snippets (e.g., TypeScript + Python pseudocode). */
  snippets: CodeSnippet[];
  /** The currently active line index (0-based), synced with animation step. */
  activeLine: number | null;
  /** Optional: which snippet index is selected (defaults to 0). */
  activeSnippetIndex?: number;
  /** Callback when the user switches between language tabs. */
  onLanguageChange?: (index: number) => void;
  /** Optional additional className for the root container. */
  className?: string;
}

// ── Syntax Highlighting (CSS class based) ────────────────────

/** Token types recognized by the simple tokenizer. */
type TokenType =
  | 'keyword'
  | 'type'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'function'
  | 'plain';

interface Token {
  type: TokenType;
  text: string;
}

const TS_KEYWORDS = new Set([
  'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do',
  'return', 'import', 'export', 'from', 'class', 'new', 'this', 'switch',
  'case', 'break', 'continue', 'default', 'typeof', 'instanceof', 'in',
  'of', 'true', 'false', 'null', 'undefined', 'void', 'async', 'await',
  'yield', 'throw', 'try', 'catch', 'finally', 'extends', 'implements',
  'interface', 'type', 'enum', 'abstract', 'static', 'readonly',
  'procedure', 'then', 'to', 'down', 'step', 'not', 'and', 'or',
]);

const PY_KEYWORDS = new Set([
  'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import',
  'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'pass',
  'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in',
  'is', 'lambda', 'yield', 'global', 'nonlocal', 'del', 'assert',
  'procedure', 'then', 'to', 'down', 'step', 'do',
]);

const TS_TYPES = new Set([
  'number', 'string', 'boolean', 'any', 'void', 'never', 'unknown',
  'object', 'Array', 'Map', 'Set', 'Promise', 'Record',
]);

function tokenizeLine(line: string, language: CodeLanguage): Token[] {
  const keywords = language === 'typescript' ? TS_KEYWORDS : PY_KEYWORDS;
  const tokens: Token[] = [];

  // Match patterns with a simple regex-based scanner
  const regex =
    /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\.?\d*\b)|(===|!==|<=|>=|=>|[+\-*/%=<>!&|^~?:;,.()\[\]{}])|(\b\w+\b)|(\s+)/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    const [fullMatch, comment, str, num, op, word, space] = match;

    if (comment) {
      tokens.push({ type: 'comment', text: comment });
    } else if (str) {
      tokens.push({ type: 'string', text: str });
    } else if (num) {
      tokens.push({ type: 'number', text: num });
    } else if (op) {
      tokens.push({ type: 'operator', text: op });
    } else if (word) {
      if (keywords.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (language === 'typescript' && TS_TYPES.has(word)) {
        tokens.push({ type: 'type', text: word });
      } else if (
        regex.lastIndex < line.length &&
        line[regex.lastIndex] === '('
      ) {
        tokens.push({ type: 'function', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
    } else if (space) {
      tokens.push({ type: 'plain', text: space });
    } else {
      tokens.push({ type: 'plain', text: fullMatch });
    }
  }

  return tokens;
}

// ── Token CSS Classes ────────────────────────────────────────

const TOKEN_CLASSES: Record<TokenType, string> = {
  keyword: 'text-purple-400 font-semibold',
  type: 'text-cyan-400',
  string: 'text-green-400',
  number: 'text-amber-400',
  comment: 'text-gray-500 italic',
  operator: 'text-gray-400',
  function: 'text-blue-400',
  plain: 'text-gray-300',
};

// ── CodePanel Component ──────────────────────────────────────

export const CodePanel = memo(function CodePanel({
  snippets,
  activeLine,
  activeSnippetIndex = 0,
  onLanguageChange,
  className,
}: CodePanelProps) {
  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentSnippet = snippets[activeSnippetIndex] ?? snippets[0];
  if (!currentSnippet) {
    return null;
  }

  const tokenizedLines = useMemo(
    () =>
      currentSnippet.lines.map((line) =>
        tokenizeLine(line, currentSnippet.language),
      ),
    [currentSnippet.lines, currentSnippet.language],
  );

  // Auto-scroll to the active line
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const lineEl = activeLineRef.current;
      const containerRect = container.getBoundingClientRect();
      const lineRect = lineEl.getBoundingClientRect();

      // Only scroll if the line is out of view
      if (
        lineRect.top < containerRect.top ||
        lineRect.bottom > containerRect.bottom
      ) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLine]);

  const lineNumberWidth = String(currentSnippet.lines.length).length;

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border bg-[#1e1e2e] overflow-hidden',
        className,
      )}
    >
      {/* Header with language tabs */}
      <div className="flex items-center justify-between border-b border-border/50 bg-[#181825] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Code2 className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Source Code
          </span>
        </div>

        {snippets.length > 1 && (
          <div className="flex items-center gap-1">
            {snippets.map((snippet, idx) => (
              <button
                key={idx}
                onClick={() => onLanguageChange?.(idx)}
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                  idx === activeSnippetIndex
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-500 hover:text-gray-300',
                )}
              >
                {snippet.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Code display */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
      >
        <pre className="p-0 m-0">
          <code className="block text-[12px] leading-[1.6] font-mono">
            {tokenizedLines.map((tokens, lineIdx) => {
              const isActive = activeLine !== null && lineIdx === activeLine;

              return (
                <div
                  key={lineIdx}
                  ref={isActive ? activeLineRef : undefined}
                  className={cn(
                    'flex px-3 py-0 transition-colors duration-200',
                    isActive
                      ? 'bg-primary/15 border-l-2 border-primary'
                      : 'border-l-2 border-transparent hover:bg-white/[0.03]',
                  )}
                >
                  {/* Line number */}
                  <span
                    className={cn(
                      'select-none text-right pr-4 shrink-0',
                      isActive ? 'text-primary/70' : 'text-gray-600',
                    )}
                    style={{ width: `${lineNumberWidth + 1}ch` }}
                  >
                    {lineIdx + 1}
                  </span>

                  {/* Syntax-highlighted code */}
                  <span className="flex-1 whitespace-pre">
                    {tokens.map((token, tIdx) => (
                      <span
                        key={tIdx}
                        className={cn(
                          TOKEN_CLASSES[token.type],
                          isActive && token.type !== 'comment' && 'brightness-125',
                        )}
                      >
                        {token.text}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Footer: active line indicator */}
      {activeLine !== null && (
        <div className="border-t border-border/50 bg-[#181825] px-3 py-1 flex items-center gap-2">
          <ChevronDown className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-gray-400">
            Line {activeLine + 1}
          </span>
        </div>
      )}
    </div>
  );
});

export default CodePanel;
