import { describe, it, expect } from 'vitest';
import { sanitizeMarkdown } from '../sanitize';

describe('sanitizeMarkdown (SCR-015 enhanced)', () => {
  // ── Script tag removal ─────────────────────────────────

  describe('script tag removal', () => {
    it('strips inline script tags with content', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('</script');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('strips script tags with attributes', () => {
      const input = 'text <script type="text/javascript" src="evil.js"></script> more';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('evil.js');
    });

    it('strips self-closing script tags', () => {
      const input = 'text <script src="evil.js"/> more';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<script');
    });

    it('strips script tags case-insensitively', () => {
      const input = '<SCRIPT>evil()</SCRIPT>';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('SCRIPT');
      expect(result).not.toContain('evil');
    });

    it('strips multiline script tags', () => {
      const input = 'before <script>\nvar x = 1;\nalert(x);\n</script> after';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('script');
      expect(result).not.toContain('var x');
      expect(result).toContain('before');
      expect(result).toContain('after');
    });
  });

  // ── javascript: URL neutralization ─────────────────────

  describe('javascript: URL neutralization', () => {
    it('removes javascript: from markdown links', () => {
      const input = '[click me](javascript:alert(1))';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('javascript:');
    });

    it('removes JavaScript: with mixed case', () => {
      const input = '[click](JaVaScRiPt:alert(1))';
      const result = sanitizeMarkdown(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('removes vbscript: URIs', () => {
      const input = '[link](vbscript:MsgBox("hi"))';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('vbscript:');
    });

    it('removes data: URIs', () => {
      const input = '![img](data:text/html,<h1>evil</h1>)';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('data:');
    });
  });

  // ── Event handler stripping ────────────────────────────

  describe('event handler stripping', () => {
    it('strips onclick attributes', () => {
      const input = '<div onclick="alert(1)">text</div>';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('strips onerror attributes', () => {
      const input = '<img onerror="evil()" src="x">';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('onerror');
    });

    it('strips onload attributes', () => {
      const input = '<body onload="steal()">';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('onload');
    });

    it('strips onmouseover attributes', () => {
      const input = '<a onmouseover="track()">hover</a>';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('onmouseover');
    });
  });

  // ── Iframe removal ─────────────────────────────────────

  describe('iframe removal', () => {
    it('strips iframe tags with content', () => {
      const input = 'text <iframe src="https://evil.com"></iframe> more';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('evil.com');
      expect(result).toContain('text');
      expect(result).toContain('more');
    });

    it('strips self-closing iframe tags', () => {
      const input = '<iframe src="https://evil.com"/>';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<iframe');
    });

    it('strips IFRAME case-insensitively', () => {
      const input = '<IFRAME src="x"></IFRAME>';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('IFRAME');
    });
  });

  // ── Other dangerous tags ───────────────────────────────

  describe('other dangerous tag removal', () => {
    it('strips embed tags', () => {
      const result = sanitizeMarkdown('<embed src="evil.swf">');
      expect(result).not.toContain('<embed');
    });

    it('strips object tags', () => {
      const result = sanitizeMarkdown('<object data="evil.swf"></object>');
      expect(result).not.toContain('<object');
    });

    it('strips form tags', () => {
      const result = sanitizeMarkdown('<form action="/steal"><input></form>');
      expect(result).not.toContain('<form');
    });
  });

  // ── Safe content preservation ──────────────────────────

  describe('preserves safe markdown', () => {
    it('preserves headings, bold, italic', () => {
      const input = '# Heading\n\n**bold** and *italic*';
      const result = sanitizeMarkdown(input);
      expect(result).toContain('# Heading');
      expect(result).toContain('**bold**');
      expect(result).toContain('*italic*');
    });

    it('preserves markdown links with https', () => {
      const input = '[link](https://example.com)';
      const result = sanitizeMarkdown(input);
      expect(result).toContain('https://example.com');
    });

    it('preserves code blocks', () => {
      const input = '```js\nconst x = 1;\n```';
      const result = sanitizeMarkdown(input);
      expect(result).toContain('const x = 1;');
    });

    it('preserves list items', () => {
      const input = '- item 1\n- item 2\n- item 3';
      const result = sanitizeMarkdown(input);
      expect(result).toContain('- item 1');
      expect(result).toContain('- item 2');
    });

    it('handles empty string', () => {
      expect(sanitizeMarkdown('')).toBe('');
    });
  });
});
