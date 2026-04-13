import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editor-store';
import type { Language } from '../editor-store';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('editor-store', () => {
  beforeEach(() => {
    useEditorStore.getState().clearEditor();
    useEditorStore.getState().setLanguage('typescript');
    useEditorStore.getState().setReadOnly(true);
  });

  // ── Initial state ────────────────────────────────────────────

  it('initial code is empty string', () => {
    expect(useEditorStore.getState().code).toBe('');
  });

  it('initial language is typescript', () => {
    expect(useEditorStore.getState().language).toBe('typescript');
  });

  it('initial readOnly is true', () => {
    expect(useEditorStore.getState().readOnly).toBe(true);
  });

  it('initial activeLine is null', () => {
    expect(useEditorStore.getState().activeLine).toBeNull();
  });

  it('initial highlightedLines is empty', () => {
    expect(useEditorStore.getState().highlightedLines).toEqual([]);
  });

  // ── setCode ──────────────────────────────────────────────────

  it('setCode updates the code content', () => {
    useEditorStore.getState().setCode('const x = 1;');
    expect(useEditorStore.getState().code).toBe('const x = 1;');
  });

  it('setCode replaces previous code', () => {
    useEditorStore.getState().setCode('first');
    useEditorStore.getState().setCode('second');
    expect(useEditorStore.getState().code).toBe('second');
  });

  it('setCode handles multi-line content', () => {
    const multiline = 'line1\nline2\nline3';
    useEditorStore.getState().setCode(multiline);
    expect(useEditorStore.getState().code).toBe(multiline);
  });

  // ── setLanguage ──────────────────────────────────────────────

  it('setLanguage updates the language', () => {
    const langs: Language[] = ['python', 'java', 'cpp', 'go', 'typescript'];
    for (const lang of langs) {
      useEditorStore.getState().setLanguage(lang);
      expect(useEditorStore.getState().language).toBe(lang);
    }
  });

  // ── setReadOnly ──────────────────────────────────────────────

  it('setReadOnly toggles readOnly state', () => {
    useEditorStore.getState().setReadOnly(false);
    expect(useEditorStore.getState().readOnly).toBe(false);

    useEditorStore.getState().setReadOnly(true);
    expect(useEditorStore.getState().readOnly).toBe(true);
  });

  // ── setActiveLine ────────────────────────────────────────────

  it('setActiveLine sets the active line number', () => {
    useEditorStore.getState().setActiveLine(5);
    expect(useEditorStore.getState().activeLine).toBe(5);
  });

  it('setActiveLine with null clears the active line', () => {
    useEditorStore.getState().setActiveLine(3);
    useEditorStore.getState().setActiveLine(null);
    expect(useEditorStore.getState().activeLine).toBeNull();
  });

  // ── setHighlightedLines ──────────────────────────────────────

  it('setHighlightedLines updates highlighted line numbers', () => {
    useEditorStore.getState().setHighlightedLines([1, 3, 5]);
    expect(useEditorStore.getState().highlightedLines).toEqual([1, 3, 5]);
  });

  it('setHighlightedLines with empty array clears highlights', () => {
    useEditorStore.getState().setHighlightedLines([1, 2]);
    useEditorStore.getState().setHighlightedLines([]);
    expect(useEditorStore.getState().highlightedLines).toEqual([]);
  });

  // ── clearEditor ──────────────────────────────────────────────

  it('clearEditor resets code, activeLine, and highlightedLines', () => {
    useEditorStore.getState().setCode('some code');
    useEditorStore.getState().setActiveLine(7);
    useEditorStore.getState().setHighlightedLines([1, 2, 3]);

    useEditorStore.getState().clearEditor();

    const s = useEditorStore.getState();
    expect(s.code).toBe('');
    expect(s.activeLine).toBeNull();
    expect(s.highlightedLines).toEqual([]);
  });

  it('clearEditor preserves language and readOnly settings', () => {
    useEditorStore.getState().setLanguage('python');
    useEditorStore.getState().setReadOnly(false);
    useEditorStore.getState().setCode('print("hi")');

    useEditorStore.getState().clearEditor();

    expect(useEditorStore.getState().language).toBe('python');
    expect(useEditorStore.getState().readOnly).toBe(false);
  });
});
