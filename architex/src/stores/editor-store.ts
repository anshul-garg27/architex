import { create } from "zustand";

export type Language = "typescript" | "python" | "java" | "cpp" | "go";

interface EditorState {
  // Code content
  code: string;
  language: Language;

  // Editor mode
  readOnly: boolean;

  // Active line (for algorithm step highlighting)
  activeLine: number | null;
  highlightedLines: number[];

  // Actions
  setCode: (code: string) => void;
  setLanguage: (language: Language) => void;
  setReadOnly: (readOnly: boolean) => void;
  setActiveLine: (line: number | null) => void;
  setHighlightedLines: (lines: number[]) => void;
  clearEditor: () => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  code: "",
  language: "typescript",
  readOnly: true,
  activeLine: null,
  highlightedLines: [],

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setReadOnly: (readOnly) => set({ readOnly }),
  setActiveLine: (line) => set({ activeLine: line }),
  setHighlightedLines: (lines) => set({ highlightedLines: lines }),
  clearEditor: () =>
    set({
      code: "",
      activeLine: null,
      highlightedLines: [],
    }),
}));
