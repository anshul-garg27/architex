// ── Prompt Injection Prevention — input safety layer ─────────────────
//
// Provides utilities to sanitise user input before it reaches an LLM:
//   - Strip structural delimiters that could confuse prompt boundaries
//   - Escape special tokens used by common model APIs
//   - Detect common injection patterns (role hijacking, instruction override)
//   - Wrap system + user content with structural separation
//
// Fully client-side, no API calls required.

// ── Types ───────────────────────────────────────────────────────────

export interface InjectionDetectionResult {
  suspicious: boolean;
  patterns: string[];
}

// ── Constants ───────────────────────────────────────────────────────

/**
 * Delimiters that could break prompt structure if injected by users.
 */
const STRUCTURAL_DELIMITERS = [
  '```',
  '---',
  '===',
  '###',
  '<|im_start|>',
  '<|im_end|>',
  '<|endoftext|>',
  '<|system|>',
  '<|user|>',
  '<|assistant|>',
  '[INST]',
  '[/INST]',
  '<<SYS>>',
  '<</SYS>>',
  '<s>',
  '</s>',
];

/**
 * Special tokens used by various LLM APIs that should be escaped.
 */
const SPECIAL_TOKENS = [
  '<|im_start|>',
  '<|im_end|>',
  '<|endoftext|>',
  '<|system|>',
  '<|user|>',
  '<|assistant|>',
  '[INST]',
  '[/INST]',
  '<<SYS>>',
  '<</SYS>>',
];

/**
 * Patterns that indicate a prompt injection attempt.
 * Each entry has a regex and a human-readable description.
 */
const INJECTION_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|context)/i,
    description: 'ignore-previous-instructions',
  },
  {
    pattern: /disregard\s+(all\s+)?(above|previous|prior|earlier)/i,
    description: 'disregard-previous',
  },
  {
    pattern: /forget\s+(everything|all|what)\s+(you|I)\s*(told|said|know)/i,
    description: 'forget-instructions',
  },
  {
    pattern: /you\s+are\s+now\s+(a|an|the)\b/i,
    description: 'role-reassignment',
  },
  {
    pattern: /^system\s*:/im,
    description: 'system-role-injection',
  },
  {
    pattern: /^assistant\s*:/im,
    description: 'assistant-role-injection',
  },
  {
    pattern: /^user\s*:/im,
    description: 'user-role-injection',
  },
  {
    pattern: /\bact\s+as\s+(if\s+you\s+are|a|an|the)\b/i,
    description: 'act-as-injection',
  },
  {
    pattern: /\bpretend\s+(you\s+are|to\s+be)\b/i,
    description: 'pretend-injection',
  },
  {
    pattern: /\bnew\s+instructions?\s*:/i,
    description: 'new-instructions-injection',
  },
  {
    pattern: /```\s*(system|prompt|instruction)/i,
    description: 'markdown-escape-system-block',
  },
  {
    pattern: /\b(jailbreak|DAN|do\s+anything\s+now)\b/i,
    description: 'jailbreak-attempt',
  },
  {
    pattern: /<\|im_start\|>|<\|im_end\|>|<\|endoftext\|>/,
    description: 'special-token-injection',
  },
  {
    pattern: /\[INST\]|\[\/INST\]|<<SYS>>|<<\/SYS>>/,
    description: 'llama-token-injection',
  },
  {
    pattern: /\boverride\s+(your|the|all)\s+(rules?|instructions?|guidelines?|constraints?)\b/i,
    description: 'override-rules',
  },
];

// ── Public API ──────────────────────────────────────────────────────

/**
 * Sanitise user input by stripping structural delimiters and escaping
 * special tokens. Does NOT remove the content — replaces dangerous
 * patterns with safe equivalents so the user's intent is preserved.
 */
export function sanitizeUserInput(input: string): string {
  let sanitized = input;

  // Escape special tokens by inserting zero-width spaces to break them
  for (const token of SPECIAL_TOKENS) {
    if (sanitized.includes(token)) {
      // Insert a zero-width space in the middle to break the token
      const mid = Math.floor(token.length / 2);
      const broken = token.slice(0, mid) + '\u200B' + token.slice(mid);
      sanitized = sanitized.split(token).join(broken);
    }
  }

  // Strip structural delimiters that are pure formatting (triple backticks, hr lines)
  for (const delim of STRUCTURAL_DELIMITERS) {
    // Skip tokens already handled above
    if (SPECIAL_TOKENS.includes(delim)) continue;
    sanitized = sanitized.split(delim).join('');
  }

  // Collapse multiple newlines to prevent prompt structure manipulation
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  return sanitized.trim();
}

/**
 * Wrap a system prompt and user input with clear structural separation.
 * Uses XML-style delimiters that models respect as boundaries.
 */
export function wrapWithDelimiters(
  systemPrompt: string,
  userInput: string,
): string {
  const sanitized = sanitizeUserInput(userInput);
  return [
    '<system_instruction>',
    systemPrompt,
    '</system_instruction>',
    '',
    '<user_input>',
    sanitized,
    '</user_input>',
  ].join('\n');
}

/**
 * Detect whether user input contains patterns that suggest a prompt
 * injection attempt. Returns the list of matched pattern descriptions.
 */
export function detectInjectionAttempt(input: string): InjectionDetectionResult {
  const matchedPatterns: string[] = [];

  for (const { pattern, description } of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      matchedPatterns.push(description);
    }
  }

  return {
    suspicious: matchedPatterns.length > 0,
    patterns: matchedPatterns,
  };
}
