"use client";

/**
 * ScenarioChallenge — Real-world design scenario quiz (LLD-128).
 * Present scenarios, user picks the best design pattern.
 *
 * Integration: Add to LLDBottomPanelTabs in useLLDModuleImpl.tsx:
 *   import { ScenarioChallenge } from "../panels/ScenarioChallenge";
 *   // Add tab: { id: "scenario-challenge", label: "Scenario Challenge" }
 *   // Render: <ScenarioChallenge /> in the matching tab case
 */

import React, { memo, useState, useCallback, useMemo } from "react";
import { Trophy, Zap, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuiz } from "@/hooks/use-quiz";

// ── Scenario Data ───────────────────────────────────────────

interface ScenarioOption {
  pattern: string;
  whyWrong: string;
}

interface Scenario {
  id: string;
  question: string;
  context: string;
  options: [ScenarioOption, ScenarioOption, ScenarioOption, ScenarioOption];
  correctIndex: number;
  explanation: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "s-payments",
    question: "Credit card, PayPal, and Bitcoin payments each with different processing logic",
    context:
      "You are building an e-commerce checkout. Each payment method has a completely different API, validation rules, and confirmation flow. The user selects which one to use at runtime.",
    options: [
      { pattern: "Strategy", whyWrong: "" },
      { pattern: "State", whyWrong: "State is for objects whose behavior changes as internal state transitions occur. Payment methods don't transition between each other \u2014 the user explicitly chooses one." },
      { pattern: "Command", whyWrong: "Command encapsulates operations as objects for queueing/undo. Here you need interchangeable algorithms, not operation history." },
      { pattern: "Template Method", whyWrong: "Template Method uses inheritance with a fixed skeleton. Here you need runtime-swappable, independent implementations." },
    ],
    correctIndex: 0,
    explanation:
      "Strategy lets the client choose an algorithm at runtime. Each payment processor implements the same interface (charge, refund) but with completely different logic. The checkout code delegates to whichever strategy the user selected.",
  },
  {
    id: "s-document-states",
    question: "A document goes through Draft \u2192 Review \u2192 Published, with different behavior in each stage",
    context:
      "In your CMS, a document can be edited in Draft, only commented on in Review, and is read-only when Published. The allowed actions change based on the document's current lifecycle stage.",
    options: [
      { pattern: "Strategy", whyWrong: "Strategy swaps algorithms chosen by the user. Here the system itself transitions between modes based on lifecycle events, not user selection of an algorithm." },
      { pattern: "State", whyWrong: "" },
      { pattern: "Observer", whyWrong: "Observer notifies dependents of changes. The core problem here is that behavior changes based on internal state, not notification of external listeners." },
      { pattern: "Chain of Responsibility", whyWrong: "Chain passes a request along a chain of handlers. The document doesn't pass through handlers \u2014 it transitions between discrete behavioral states." },
    ],
    correctIndex: 1,
    explanation:
      "State pattern: the object's behavior changes when its internal state changes, appearing to change its class. Each state (Draft, Review, Published) encapsulates the allowed operations. The document delegates to its current state object, and states handle transitions to the next state.",
  },
  {
    id: "s-mediator",
    question: "5 UI components need to coordinate without knowing about each other",
    context:
      "You have a search bar, filter panel, results list, pagination, and sorting dropdown. When any one changes, several others must update \u2014 but you don't want N\u00D7N direct dependencies.",
    options: [
      { pattern: "Observer", whyWrong: "Observer sets up 1-to-many notifications but each component would still need to know which others to observe, creating a tangled web of subscriptions." },
      { pattern: "Facade", whyWrong: "Facade simplifies a subsystem's interface for external callers. Here the problem is inter-component coordination, not simplifying an API." },
      { pattern: "Mediator", whyWrong: "" },
      { pattern: "Composite", whyWrong: "Composite treats individual objects and compositions uniformly. The problem here is communication between peers, not tree structures." },
    ],
    correctIndex: 2,
    explanation:
      "Mediator centralizes complex communication between components. Each component only knows about the mediator, not about each other. When the search bar changes, it tells the mediator, which orchestrates updates to the filter panel, results, pagination, and sorting.",
  },
  {
    id: "s-command",
    question: "Queue user operations, support undo, and log everything for replay",
    context:
      "You are building a collaborative text editor. Every user action (insert, delete, format) needs to be queued for execution, undone if the user presses Ctrl+Z, and stored for audit replay.",
    options: [
      { pattern: "Memento", whyWrong: "Memento captures object state snapshots for restoration, but doesn't encapsulate operations as first-class objects that can be queued, logged, and independently reversed." },
      { pattern: "Command", whyWrong: "" },
      { pattern: "Strategy", whyWrong: "Strategy swaps interchangeable algorithms. You need to reify operations as objects with execute/undo, not swap algorithm implementations." },
      { pattern: "Observer", whyWrong: "Observer notifies subscribers of state changes. It doesn't provide operation queuing, undo, or replay capabilities." },
    ],
    correctIndex: 1,
    explanation:
      "Command turns each operation into an object with execute() and undo() methods. Commands can be queued in a history stack, undone by calling undo(), and serialized for audit logs or replay. This is the quintessential use case for the Command pattern.",
  },
  {
    id: "s-adapter",
    question: "Your app expects JSON but a legacy service only returns XML",
    context:
      "You are integrating a third-party inventory system that returns XML. Your entire frontend and middleware expect JSON. You cannot modify the legacy service.",
    options: [
      { pattern: "Proxy", whyWrong: "Proxy controls access to an object with the same interface. The problem here is interface incompatibility, not access control or lazy loading." },
      { pattern: "Decorator", whyWrong: "Decorator adds behavior to an object while keeping the same interface. Here you need to translate between two different interfaces entirely." },
      { pattern: "Bridge", whyWrong: "Bridge separates abstraction from implementation for independent variation. The issue is making two incompatible interfaces work together." },
      { pattern: "Adapter", whyWrong: "" },
    ],
    correctIndex: 3,
    explanation:
      "Adapter converts the interface of a class into another interface that clients expect. An XmlToJsonAdapter wraps the legacy XML service and translates its responses to JSON, letting your app consume it without changes.",
  },
  {
    id: "s-observer",
    question: "A stock price changes and 12 different dashboard widgets must update instantly",
    context:
      "You have a real-time trading dashboard. When a stock price updates, the chart, ticker, portfolio value, P&L widget, alert checker, and several other components all need to react to the new price.",
    options: [
      { pattern: "Mediator", whyWrong: "Mediator coordinates peer-to-peer communication. Here there's a clear subject (stock price) and multiple one-way dependents, not bidirectional coordination." },
      { pattern: "Observer", whyWrong: "" },
      { pattern: "Chain of Responsibility", whyWrong: "Chain passes a request through handlers until one processes it. All widgets need to update, not just the first matching handler." },
      { pattern: "Pub/Sub (Event Sourcing)", whyWrong: "While pub/sub is related, the classical Observer pattern directly models this subject-subscriber relationship. Event Sourcing is about storing state changes as events." },
    ],
    correctIndex: 1,
    explanation:
      "Observer defines a one-to-many dependency: when the subject (stock price) changes, all registered observers (widgets) are notified automatically. Each widget subscribes to price updates and refreshes independently.",
  },
  {
    id: "s-decorator",
    question: "Add logging, caching, and auth checks to an API client without modifying it",
    context:
      "You have a clean HttpClient class. Different environments need different combinations: dev needs logging, production needs caching + auth, staging needs all three. You can't use subclasses for every combination.",
    options: [
      { pattern: "Proxy", whyWrong: "Proxy provides a surrogate with the same interface for access control. Stacking multiple independent concerns (logging + caching + auth) in arbitrary combinations is Decorator's strength." },
      { pattern: "Decorator", whyWrong: "" },
      { pattern: "Chain of Responsibility", whyWrong: "Chain passes requests until one handler processes it. You need to layer multiple behaviors that all apply, not find a single handler." },
      { pattern: "Facade", whyWrong: "Facade simplifies a complex subsystem. Here you need to compose behaviors around an existing interface, not simplify one." },
    ],
    correctIndex: 1,
    explanation:
      "Decorator wraps an object to add behavior while keeping the same interface. You can stack them: LoggingClient(CachingClient(AuthClient(HttpClient))). Each decorator adds one concern and delegates to the next, making combinations flexible and composable.",
  },
  {
    id: "s-factory",
    question: "Create different notification senders (email, SMS, push) without the caller knowing which concrete class",
    context:
      "Your notification service receives a channel type and must create the correct sender. Adding new channels (Slack, WhatsApp) should not require modifying the creation logic in every caller.",
    options: [
      { pattern: "Abstract Factory", whyWrong: "Abstract Factory creates families of related objects. Here you need a single object based on a type parameter, not families of related objects." },
      { pattern: "Builder", whyWrong: "Builder constructs complex objects step by step. Notification senders are simple objects selected by type, not complex multi-step constructions." },
      { pattern: "Factory Method", whyWrong: "" },
      { pattern: "Prototype", whyWrong: "Prototype clones existing objects. You need to select and create the correct type, not clone an existing instance." },
    ],
    correctIndex: 2,
    explanation:
      "Factory Method defines an interface for creating objects but lets subclasses decide which class to instantiate. A NotificationFactory.create('sms') returns an SmsSender without the caller knowing the concrete class. Adding new channels means adding new factory cases.",
  },
  {
    id: "s-builder",
    question: "Construct a complex SQL query with optional WHERE, JOIN, ORDER BY, and LIMIT clauses",
    context:
      "Your ORM needs to build SQL queries. Some queries use all clauses, some use none. The order matters, and you need to validate the final result. Telescoping constructors with 10+ optional parameters are unreadable.",
    options: [
      { pattern: "Builder", whyWrong: "" },
      { pattern: "Factory Method", whyWrong: "Factory Method selects which class to create. Here you need to construct one complex object step by step with optional parts." },
      { pattern: "Strategy", whyWrong: "Strategy swaps algorithms. You need step-by-step construction of a complex object, not interchangeable behaviors." },
      { pattern: "Composite", whyWrong: "Composite creates tree structures. A SQL query is built step by step, not composed as a tree of uniform nodes." },
    ],
    correctIndex: 0,
    explanation:
      "Builder separates the construction of a complex object from its representation. query.select('*').from('users').where('age > 18').orderBy('name').limit(10) lets you build incrementally with a fluent API, producing a validated result at .build().",
  },
  {
    id: "s-chain",
    question: "HTTP request passes through auth check, rate limiter, validator, and then handler",
    context:
      "Your API gateway processes each request through multiple middleware layers. Each layer can either handle the request, pass it along, or reject it. New middleware should be addable without modifying existing ones.",
    options: [
      { pattern: "Decorator", whyWrong: "Decorator adds behavior while keeping the same interface. Middleware can short-circuit the chain and reject requests \u2014 Chain of Responsibility explicitly supports this pass-or-handle decision." },
      { pattern: "Strategy", whyWrong: "Strategy swaps one algorithm for another. Here you need multiple handlers in sequence, each deciding whether to continue or stop." },
      { pattern: "Chain of Responsibility", whyWrong: "" },
      { pattern: "Command", whyWrong: "Command encapsulates operations as objects. The core need here is sequential pass-through with conditional handling." },
    ],
    correctIndex: 2,
    explanation:
      "Chain of Responsibility passes a request along a chain of handlers. Each handler (auth, rate limiter, validator) decides to either process the request and stop, or pass it to the next handler. Express.js middleware is a textbook example of this pattern.",
  },
  {
    id: "s-facade",
    question: "Simplify a complex subsystem of 15 microservices into one clean API for the mobile team",
    context:
      "Your mobile app needs to show a user dashboard that aggregates data from user-service, billing-service, analytics-service, notification-service, and 11 others. The mobile team shouldn't call 15 APIs.",
    options: [
      { pattern: "Adapter", whyWrong: "Adapter converts one interface to another. Here you need to unify many interfaces behind a single simplified one, not translate between two." },
      { pattern: "Facade", whyWrong: "" },
      { pattern: "Proxy", whyWrong: "Proxy provides a surrogate for a single object. You need to aggregate and simplify access to an entire subsystem." },
      { pattern: "Mediator", whyWrong: "Mediator coordinates between peers that communicate with each other. The microservices don't need to coordinate \u2014 the client needs a simpler entry point." },
    ],
    correctIndex: 1,
    explanation:
      "Facade provides a unified, simplified interface to a complex subsystem. A DashboardFacade.getUserDashboard() internally calls all 15 services, aggregates results, and returns a single clean response to the mobile app.",
  },
  {
    id: "s-singleton-config",
    question: "Ensure your entire application shares exactly one configuration manager instance",
    context:
      "Your microservice loads config from environment variables and a config file at startup. Multiple modules need access, but creating multiple instances would cause inconsistency if one reloads while others don't.",
    options: [
      { pattern: "Singleton", whyWrong: "" },
      { pattern: "Factory Method", whyWrong: "Factory Method creates instances. You need to guarantee exactly one instance exists, not decide which class to create." },
      { pattern: "Prototype", whyWrong: "Prototype clones objects. You need to prevent creation of additional instances, not clone existing ones." },
      { pattern: "Facade", whyWrong: "Facade simplifies a subsystem's interface. The problem is instance uniqueness, not interface simplification." },
    ],
    correctIndex: 0,
    explanation:
      "Singleton ensures a class has only one instance and provides a global point of access. ConfigManager.getInstance() returns the same instance everywhere, guaranteeing all modules read consistent configuration.",
  },
];

// ── Shuffle helper ──────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Component ───────────────────────────────────────────────

export const ScenarioChallenge = memo(function ScenarioChallenge() {
  // Try DB-backed quiz data; fall back to inline SCENARIOS
  const { questions: dbQuestions } = useQuiz("lld", "scenario");
  const allScenarios = useMemo<Scenario[]>(() => {
    if (dbQuestions.length > 0) {
      return dbQuestions.map((q) => ({
        id: q.slug,
        question: q.question,
        context: q.context ?? "",
        options: q.options.map((o) => ({ pattern: o.label, whyWrong: o.whyWrong ?? "" })) as [ScenarioOption, ScenarioOption, ScenarioOption, ScenarioOption],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
    return SCENARIOS; // fallback to inline data
  }, [dbQuestions]);

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [started, setStarted] = useState(false);
  const [feedbackShown, setFeedbackShown] = useState(false);

  const startChallenge = useCallback(() => {
    setScenarios(shuffleArray(allScenarios));
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setStarted(true);
    setFeedbackShown(false);
  }, []);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (feedbackShown) return;
      setSelectedAnswer(idx);
      setFeedbackShown(true);
      if (idx === scenarios[currentIdx].correctIndex) {
        setScore((s) => s + 1);
      }
    },
    [feedbackShown, scenarios, currentIdx],
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= scenarios.length) {
      setShowResult(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setFeedbackShown(false);
    }
  }, [currentIdx, scenarios.length]);

  // ── Start Screen ──────────────────────────────────────────

  if (!started) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Scenario-Based Challenge</h3>
          <p className="text-xs leading-relaxed text-foreground-muted">
            Read a real-world design scenario and pick the best design pattern. Get
            detailed explanations of why each choice is right or wrong.
          </p>
          <button
            onClick={startChallenge}
            className="rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
          >
            Start Challenge ({allScenarios.length} Scenarios)
          </button>
        </div>
      </div>
    );
  }

  // ── Results Screen ────────────────────────────────────────

  if (showResult) {
    const pct = Math.round((score / scenarios.length) * 100);
    const grade =
      pct >= 90
        ? "Pattern Architect!"
        : pct >= 70
          ? "Great Instincts!"
          : pct >= 50
            ? "Getting There!"
            : "Keep Practicing!";
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_25px_rgba(var(--primary-rgb),0.2)]">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">{grade}</h3>
          <p className="text-sm text-foreground-muted">
            You scored <span className="font-bold text-primary">{score}</span> out of{" "}
            <span className="font-bold">{scenarios.length}</span> ({pct}%)
          </p>
          <button
            onClick={startChallenge}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Question Screen ───────────────────────────────────────

  const s = scenarios[currentIdx];
  const isCorrect = selectedAnswer === s.correctIndex;

  return (
    <div className="flex h-full flex-col">
      {/* Progress bar */}
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
          Scenario {currentIdx + 1}/{scenarios.length}
        </span>
        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / scenarios.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-[10px] font-medium text-primary">Score: {score}</span>
      </div>

      <div className="flex flex-1 overflow-auto">
        {/* Scenario description */}
        <div className="flex-1 border-r border-border/30 p-4">
          <div className="mb-3">
            <h4 className="text-[13px] font-bold leading-snug text-foreground">
              &ldquo;{s.question}&rdquo;
            </h4>
          </div>
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2.5 text-[11px] leading-relaxed text-foreground-muted">
            {s.context}
          </div>

          {/* Feedback: explanation of correct answer */}
          {feedbackShown && (
            <div
              className={cn(
                "mt-3 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed backdrop-blur-sm",
                isCorrect
                  ? "border-emerald-500/30 bg-emerald-500/5 text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                  : "border-red-500/30 bg-red-500/5 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]",
              )}
            >
              {isCorrect ? (
                <p>
                  <span className="font-bold">Correct!</span> {s.explanation}
                </p>
              ) : (
                <p>
                  <span className="font-bold">Not quite.</span> The answer is{" "}
                  <span className="font-bold">{s.options[s.correctIndex].pattern}</span>.{" "}
                  {s.explanation}
                </p>
              )}
            </div>
          )}

          {/* Why-wrong for the chosen wrong answer */}
          {feedbackShown && !isCorrect && selectedAnswer !== null && (
            <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.05)] px-3 py-2 text-[10px] leading-relaxed text-amber-400">
              <span className="font-bold">Why not {s.options[selectedAnswer].pattern}?</span>{" "}
              {s.options[selectedAnswer].whyWrong}
            </div>
          )}
        </div>

        {/* Answer options */}
        <div className="flex w-72 flex-col gap-3 p-3">
          <p className="text-[11px] font-medium text-foreground-muted">
            Which pattern fits best?
          </p>
          <div className="space-y-2">
            {s.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOpt = idx === s.correctIndex;
              let btnClass =
                "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all";
              if (feedbackShown) {
                if (isCorrectOpt) {
                  btnClass += " border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                } else if (isSelected && !isCorrectOpt) {
                  btnClass += " border-red-500/30 bg-red-500/5 backdrop-blur-sm text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                } else {
                  btnClass += " border-border/30 text-foreground-subtle opacity-50";
                }
              } else {
                btnClass += isSelected
                  ? " border-primary/30 bg-primary/5 backdrop-blur-sm text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                  : " border-border/30 text-foreground-muted hover:bg-accent hover:text-foreground";
              }
              return (
                <button
                  key={opt.pattern}
                  onClick={() => handleAnswer(idx)}
                  className={btnClass}
                  disabled={feedbackShown}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt.pattern}
                </button>
              );
            })}
          </div>

          {feedbackShown && (
            <button
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              {currentIdx + 1 >= scenarios.length ? "See Results" : "Next Scenario"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
