import { describe, it, expect } from 'vitest';
import {
  sanitizeSVG,
  sanitizeMarkdown,
  sanitizeUserInput,
  validatePostMessageOrigin,
} from '../sanitize';

describe('sanitizeSVG', () => {
  it('removes script tags', () => {
    const input = '<svg><script>alert("xss")</script><rect/></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
    expect(result).toContain('<rect/>');
  });

  it('removes self-closing script tags', () => {
    const input = '<svg><script src="evil.js"/><rect/></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('<rect/>');
  });

  it('removes event handler attributes', () => {
    const input = '<svg><rect onclick="alert(1)" onload="fetch(\'evil\')" width="10"/></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onload');
    expect(result).toContain('width="10"');
  });

  it('removes foreignObject tags', () => {
    const input = '<svg><foreignObject><body>evil</body></foreignObject></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('foreignObject');
  });

  it('removes external xlink:href references', () => {
    const input = '<svg><use xlink:href="https://evil.com/sprite.svg#icon"/></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('evil.com');
  });

  it('preserves fragment-only href references', () => {
    // Fragment-only hrefs (#id) are safe internal references
    const input = '<svg><use href="#my-icon"/></svg>';
    const result = sanitizeSVG(input);
    // The regex only matches href= with non-fragment values
    expect(result).toContain('href="#my-icon"');
  });

  it('removes dangerous CSS expressions', () => {
    const input = '<svg><rect style="background: expression(alert(1))"/></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('expression');
  });

  it('removes javascript: in CSS url()', () => {
    const input = '<svg><rect style="background: url(javascript:alert(1))"/></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('javascript:');
  });

  it('removes iframe and embed tags', () => {
    const input = '<svg><iframe src="evil.html"></iframe><embed src="evil.swf"/></svg>';
    const result = sanitizeSVG(input);
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<embed');
  });

  it('handles clean SVG without modification', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>';
    const result = sanitizeSVG(input);
    expect(result).toBe(input);
  });
});

describe('sanitizeMarkdown', () => {
  it('strips HTML script tags', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('strips arbitrary HTML tags', () => {
    const input = 'Hello <div class="evil"><img src=x onerror=alert(1)></div> World';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<div');
    expect(result).not.toContain('<img');
  });

  it('neutralizes javascript: URIs', () => {
    const input = '[click me](javascript:alert(1))';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('javascript:');
  });

  it('neutralizes data: URIs', () => {
    const input = '![img](data:text/html,<script>alert(1)</script>)';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('data:');
  });

  it('preserves normal markdown syntax', () => {
    const input = '# Heading\n\n**bold** and *italic*\n\n- list item\n- another item';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('# Heading');
    expect(result).toContain('**bold**');
    expect(result).toContain('*italic*');
    expect(result).toContain('- list item');
  });

  it('preserves safe URLs', () => {
    const input = '[link](https://example.com)';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('https://example.com');
  });
});

describe('sanitizeUserInput', () => {
  it('escapes HTML angle brackets', () => {
    const result = sanitizeUserInput('<script>alert("xss")</script>');
    expect(result).not.toContain('<script');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes ampersands', () => {
    const result = sanitizeUserInput('foo & bar');
    expect(result).toBe('foo &amp; bar');
  });

  it('escapes quotes', () => {
    const result = sanitizeUserInput('He said "hello" & \'goodbye\'');
    expect(result).toContain('&quot;hello&quot;');
    expect(result).toContain('&#x27;goodbye&#x27;');
  });

  it('trims whitespace', () => {
    const result = sanitizeUserInput('  hello  ');
    expect(result).toBe('hello');
  });

  it('collapses excessive newlines', () => {
    const result = sanitizeUserInput('line1\n\n\n\n\nline2');
    expect(result).toBe('line1\n\nline2');
  });

  it('handles empty string', () => {
    expect(sanitizeUserInput('')).toBe('');
    expect(sanitizeUserInput('   ')).toBe('');
  });

  it('escapes backticks', () => {
    const result = sanitizeUserInput('`code`');
    expect(result).toContain('&#96;');
  });

  it('escapes forward slashes', () => {
    const result = sanitizeUserInput('</script>');
    expect(result).toContain('&#x2F;');
  });
});

describe('validatePostMessageOrigin', () => {
  const allowedOrigins = [
    'https://architex.dev',
    'https://www.architex.dev',
    'http://localhost:3000',
  ];

  it('accepts allowed origins', () => {
    expect(validatePostMessageOrigin({ origin: 'https://architex.dev' }, allowedOrigins)).toBe(true);
    expect(validatePostMessageOrigin({ origin: 'http://localhost:3000' }, allowedOrigins)).toBe(true);
  });

  it('rejects disallowed origins', () => {
    expect(validatePostMessageOrigin({ origin: 'https://evil.com' }, allowedOrigins)).toBe(false);
    expect(validatePostMessageOrigin({ origin: 'https://architex.dev.evil.com' }, allowedOrigins)).toBe(false);
  });

  it('rejects null/undefined events', () => {
    expect(validatePostMessageOrigin(null as unknown as { origin: string }, allowedOrigins)).toBe(false);
    expect(validatePostMessageOrigin(undefined as unknown as { origin: string }, allowedOrigins)).toBe(false);
  });

  it('rejects events with non-string origin', () => {
    expect(validatePostMessageOrigin({ origin: 123 as unknown as string }, allowedOrigins)).toBe(false);
  });

  it('rejects empty origin', () => {
    expect(validatePostMessageOrigin({ origin: '' }, allowedOrigins)).toBe(false);
  });
});
