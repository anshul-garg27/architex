"use client";

import React, {
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { duration, easing } from "@/lib/constants/motion";
import {
  MessageCircle,
  Send,
  Brain,
  Target,
  Compass,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SocraticSession,
  type SocraticPhase,
  type TutorMessage,
  type ChallengeCategory,
  PHASE_ORDER,
  PHASE_LABELS,
  PHASE_DESCRIPTIONS,
} from "@/lib/ai/socratic-tutor";

// ── Types ───────────────────────────────────────────────────────────

export interface SocraticTutorProps {
  topic: string;
  category?: ChallengeCategory;
  className?: string;
}

// ── Phase icon mapping ──────────────────────────────────────────────

const PHASE_ICONS: Record<SocraticPhase, React.ComponentType<{ className?: string }>> = {
  assess: Brain,
  challenge: Target,
  guide: Compass,
  reinforce: CheckCircle2,
};

const PHASE_COLORS: Record<SocraticPhase, string> = {
  assess: "text-blue-400",
  challenge: "text-amber-400",
  guide: "text-emerald-400",
  reinforce: "text-purple-400",
};

const PHASE_BG_COLORS: Record<SocraticPhase, string> = {
  assess: "bg-blue-500/10",
  challenge: "bg-amber-500/10",
  guide: "bg-emerald-500/10",
  reinforce: "bg-purple-500/10",
};

const PHASE_BORDER_COLORS: Record<SocraticPhase, string> = {
  assess: "border-blue-500/30",
  challenge: "border-amber-500/30",
  guide: "border-emerald-500/30",
  reinforce: "border-purple-500/30",
};

// ── Component ───────────────────────────────────────────────────────

const SocraticTutor = memo(function SocraticTutor({
  topic,
  category,
  className,
}: SocraticTutorProps) {
  const [session, setSession] = useState<SocraticSession | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<SocraticPhase>("assess");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialise session on mount or topic change
  useEffect(() => {
    const newSession = new SocraticSession(topic, category);
    setSession(newSession);

    // Start with tutor's opening message after a brief simulated delay
    setIsTyping(true);
    const timer = setTimeout(() => {
      const opening = newSession.start();
      setMessages([opening]);
      setCurrentPhase(newSession.getCurrentPhase());
      setIsTyping(false);
      setIsComplete(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [topic, category]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!session || !inputValue.trim() || isTyping || isComplete) return;

    const userInput = inputValue.trim();
    setInputValue("");

    // Add user message immediately
    const userMsg: TutorMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userInput,
      phase: session.getCurrentPhase(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate typing delay, then add tutor response
    setIsTyping(true);
    const delay = 400 + Math.random() * 800;
    setTimeout(() => {
      const response = session.respond(userInput);
      setMessages((prev) => [...prev, response]);
      setCurrentPhase(session.getCurrentPhase());
      setIsComplete(session.isComplete());
      setIsTyping(false);

      // Focus the input for next message
      inputRef.current?.focus();
    }, delay);
  }, [session, inputValue, isTyping, isComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!session || isTyping || isComplete) return;

      setInputValue("");

      // Add the suggestion as a user message
      const userMsg: TutorMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: suggestion,
        phase: session.getCurrentPhase(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Simulate typing then respond
      setIsTyping(true);
      const delay = 400 + Math.random() * 800;
      setTimeout(() => {
        const response = session.respond(suggestion);
        setMessages((prev) => [...prev, response]);
        setCurrentPhase(session.getCurrentPhase());
        setIsComplete(session.isComplete());
        setIsTyping(false);
        inputRef.current?.focus();
      }, delay);
    },
    [session, isTyping, isComplete],
  );

  const handleReset = useCallback(() => {
    const newSession = new SocraticSession(topic, category);
    setSession(newSession);
    setIsTyping(true);
    setInputValue("");
    setIsComplete(false);

    const timer = setTimeout(() => {
      const opening = newSession.start();
      setMessages([opening]);
      setCurrentPhase(newSession.getCurrentPhase());
      setIsTyping(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [topic, category]);

  // Get the latest tutor message's suggestions
  const latestSuggestions = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tutor" && messages[i].suggestions) {
        return messages[i].suggestions;
      }
    }
    return undefined;
  }, [messages]);

  const phaseProgress = useMemo(() => {
    if (!session) return { assess: false, challenge: false, guide: false, reinforce: false };
    return session.getPhaseProgress();
  }, [session, currentPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-lg overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Socratic Tutor</span>
          <Badge variant="secondary" size="sm">
            {topic}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <Badge variant="success" size="sm">
              Complete
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.normal, ease: easing.inOut }}
            className="flex flex-col overflow-hidden"
          >
            {/* Phase indicator */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
              {PHASE_ORDER.map((phase, idx) => {
                const Icon = PHASE_ICONS[phase];
                const isCurrent = phase === currentPhase;
                const isDone = phaseProgress[phase];

                return (
                  <React.Fragment key={phase}>
                    {idx > 0 && (
                      <div
                        className={cn(
                          "h-px flex-1",
                          isDone || isCurrent
                            ? "bg-primary"
                            : "bg-muted",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                        isCurrent &&
                          `${PHASE_BG_COLORS[phase]} ${PHASE_BORDER_COLORS[phase]} border`,
                        isDone && !isCurrent && "text-primary",
                        !isDone && !isCurrent && "text-muted-foreground",
                      )}
                      title={PHASE_DESCRIPTIONS[phase]}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5",
                          isCurrent
                            ? PHASE_COLORS[phase]
                            : isDone
                              ? "text-primary"
                              : "text-muted-foreground",
                        )}
                      />
                      <span className="hidden sm:inline font-medium">
                        {PHASE_LABELS[phase].split(" ")[0]}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Messages area */}
            <ScrollArea className="h-80">
              <div
                ref={scrollRef}
                className="flex flex-col gap-3 p-4 h-80 overflow-y-auto"
              >
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Typing indicator */}
                {isTyping && <TypingIndicator />}
              </div>
            </ScrollArea>

            {/* Quick-response suggestions */}
            <AnimatePresence>
              {latestSuggestions &&
                latestSuggestions.length > 0 &&
                !isTyping &&
                !isComplete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: duration.normal }}
                    className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-border"
                  >
                    {latestSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="rounded-full border border-border bg-accent/50 px-3 py-1 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Input area */}
            <div className="flex items-center gap-2 border-t border-border px-4 py-3">
              {isComplete ? (
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Session complete
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Restart
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    ref={inputRef}
                    inputSize="sm"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your response..."
                    disabled={isTyping}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── MessageBubble sub-component ─────────────────────────────────────

interface MessageBubbleProps {
  message: TutorMessage;
}

const MessageBubble = memo(function MessageBubble({
  message,
}: MessageBubbleProps) {
  const isTutor = message.role === "tutor";
  const PhaseIcon = PHASE_ICONS[message.phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.normal, ease: easing.out }}
      className={cn("flex gap-2", isTutor ? "justify-start" : "justify-end")}
    >
      {isTutor && (
        <div
          className={cn(
            "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            PHASE_BG_COLORS[message.phase],
          )}
        >
          <PhaseIcon
            className={cn("h-3.5 w-3.5", PHASE_COLORS[message.phase])}
          />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          isTutor
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        {message.content.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
});

// ── TypingIndicator sub-component ───────────────────────────────────

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
        />
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
});

export { SocraticTutor };
