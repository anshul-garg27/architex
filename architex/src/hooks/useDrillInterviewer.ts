"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDrillStore } from "@/stores/drill-store";

interface ChatStreamMessage {
  type: "delta" | "done" | "error";
  text?: string;
  error?: string;
}

export interface UseDrillInterviewerResult {
  pending: string; // streaming partial turn
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
}

/**
 * Parses a single SSE message from the drill interviewer stream.
 * Exported for testability.
 */
export function parseChatStreamFrame(raw: string): ChatStreamMessage | null {
  try {
    const parsed = JSON.parse(raw) as ChatStreamMessage;
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed.type === "delta" ||
        parsed.type === "done" ||
        parsed.type === "error")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function useDrillInterviewer(
  attemptId: string | null,
): UseDrillInterviewerResult {
  const [pending, setPending] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!attemptId || content.trim().length === 0) return;

      const store = useDrillStore.getState();
      // Optimistic user turn
      store.appendInterviewerTurn({
        role: "user",
        stage: store.currentStage,
        content,
        createdAt: new Date().toISOString(),
      });

      setError(null);
      setPending("");
      setIsStreaming(true);

      try {
        await fetch(`/api/lld/drill-attempts/${attemptId}/turn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "turn post failed");
      }

      const url = `/api/lld/drill-interviewer/${attemptId}/stream`;
      const source = new EventSource(url);
      sourceRef.current = source;

      let acc = "";
      source.onmessage = (e: MessageEvent) => {
        const msg = parseChatStreamFrame(e.data);
        if (!msg) return;
        if (msg.type === "delta" && typeof msg.text === "string") {
          acc += msg.text;
          setPending(acc);
        } else if (msg.type === "done") {
          const currentStage = useDrillStore.getState().currentStage;
          useDrillStore.getState().appendInterviewerTurn({
            role: "interviewer",
            stage: currentStage,
            content: acc,
            createdAt: new Date().toISOString(),
          });
          setPending("");
          setIsStreaming(false);
          source.close();
          sourceRef.current = null;
        } else if (msg.type === "error") {
          setError(msg.error ?? "stream error");
          setIsStreaming(false);
          source.close();
          sourceRef.current = null;
        }
      };
      source.onerror = () => {
        setError("connection lost");
        setIsStreaming(false);
        source.close();
        sourceRef.current = null;
      };
    },
    [attemptId],
  );

  return { pending, isStreaming, error, sendMessage };
}
