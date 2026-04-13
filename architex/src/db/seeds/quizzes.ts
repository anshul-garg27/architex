/**
 * Quiz data seed — extracts hardcoded quiz/scenario content into quiz_questions table.
 *
 * Sources:
 *   - ScenarioChallenge.tsx: 11 scenario challenges
 *   - solid-demos.ts: 25 SOLID quiz questions
 *   - PatternComparison.tsx: 3 pattern comparison scenarios
 */

import type { Database } from "@/db";
import { quizQuestions } from "@/db/schema/quiz-questions";
import type { NewQuizQuestion } from "@/db/schema/quiz-questions";

const MODULE_ID = "lld";

export async function seed(db: Database) {
  const rows: NewQuizQuestion[] = [];

  // ── SOLID Quiz Questions (25) ────────────────────────────
  const { SOLID_QUIZ_QUESTIONS } = await import("@/lib/lld/solid-demos");

  for (let i = 0; i < SOLID_QUIZ_QUESTIONS.length; i++) {
    const q = SOLID_QUIZ_QUESTIONS[i] as Record<string, unknown>;
    // SOLID quiz: user identifies which principle is violated
    // Options are always the 5 SOLID principles
    const principles = ["SRP", "OCP", "LSP", "ISP", "DIP"];
    const correctPrinciple = q.violatedPrinciple as string;
    const correctIdx = principles.indexOf(correctPrinciple);

    rows.push({
      moduleId: MODULE_ID,
      quizType: "solid",
      slug: (q.id as string) ?? `solid-quiz-${i}`,
      question: `Which SOLID principle is violated in this code?`,
      context: q.code as string,
      options: principles.map((p) => ({
        label: p,
        description: p === correctPrinciple ? "" : "",
      })),
      correctIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: q.explanation as string,
      patternId: (q.violatedPrinciple as string).toLowerCase(),
      difficulty: "intermediate",
      sortOrder: i,
    });
  }

  // ── Scenario Challenges (11) ─────────────────────────────
  // These are hardcoded in ScenarioChallenge.tsx — we extract them here
  const SCENARIOS = [
    { id: "s-payments", question: "Your e-commerce checkout needs to support credit cards, PayPal, Bitcoin, and Apple Pay", context: "Each payment method has different validation rules, processing APIs, and confirmation flows. New payment methods are added quarterly.", correctIndex: 0, correctPattern: "Strategy", options: ["Strategy", "State", "Factory Method", "Command"], explanation: "Strategy lets the client choose the payment algorithm at runtime. Each payment method encapsulates its own validation and processing logic behind a common interface." },
    { id: "s-document-states", question: "A document goes through Draft → Review → Approved → Published states", context: "Each state has different allowed actions. A Draft can be edited and submitted. A Review can be approved or rejected. An Approved document can be published or reverted.", correctIndex: 1, correctPattern: "State", options: ["Strategy", "State", "Observer", "Command"], explanation: "State pattern encapsulates state-specific behavior. The document delegates actions to its current state object, which knows what transitions are valid." },
    { id: "s-mediator", question: "A chat room where users send messages that all others receive", context: "Users shouldn't reference each other directly. Adding a new user type (bot, admin) shouldn't require changing existing users.", correctIndex: 2, correctPattern: "Mediator", options: ["Observer", "Chain of Responsibility", "Mediator", "Facade"], explanation: "Mediator centralizes communication. Users only know the chat room (mediator), not each other. The mediator handles routing, filtering, and broadcasting." },
    { id: "s-command", question: "A text editor with undo, redo, and macro recording", context: "Users perform actions like type, delete, format. Each action must be reversible. Macros record a sequence of actions for replay.", correctIndex: 3, correctPattern: "Command", options: ["Memento", "Strategy", "State", "Command"], explanation: "Command encapsulates each operation as an object with execute() and undo(). A history stack enables undo/redo. Macros are composite commands." },
    { id: "s-adapter", question: "Your app needs to work with both a legacy XML API and a modern JSON REST API", context: "Both APIs provide user data but with completely different formats and protocols. Your domain code should work with either without changes.", correctIndex: 0, correctPattern: "Adapter", options: ["Adapter", "Bridge", "Facade", "Proxy"], explanation: "Adapter converts the interface of the legacy XML API to match your expected interface. Your code works with one interface; the adapter handles translation." },
    { id: "s-observer", question: "A stock trading app where price changes update multiple displays simultaneously", context: "A price chart, order book, portfolio value, and alert system all need to update when any stock price changes. New display types are added frequently.", correctIndex: 1, correctPattern: "Observer", options: ["Mediator", "Observer", "Pub/Sub", "Strategy"], explanation: "Observer lets the stock price subject notify all registered display observers when a price changes. New displays just subscribe — no changes to the price source." },
    { id: "s-decorator", question: "A coffee ordering system where toppings can be added in any combination", context: "A base coffee can have milk, sugar, whipped cream, caramel, etc. Each topping adds cost and modifies the description. Customers choose any combination.", correctIndex: 2, correctPattern: "Decorator", options: ["Strategy", "Builder", "Decorator", "Composite"], explanation: "Decorator wraps each topping around the base coffee. Each decorator adds its cost and description while delegating to the wrapped object. Toppings compose freely." },
    { id: "s-factory", question: "A notification system that sends alerts via email, SMS, and push notifications", context: "Adding a new channel like Slack shouldn't require modifying existing code. The decision of which channel to use depends on user preferences.", correctIndex: 1, correctPattern: "Factory Method", options: ["Abstract Factory", "Factory Method", "Builder", "Strategy"], explanation: "Factory Method lets subclasses decide which notification object to create. Adding Slack means adding one new creator subclass — no existing code changes." },
    { id: "s-builder", question: "Construct a complex SQL query with optional WHERE, JOIN, ORDER BY, and LIMIT clauses", context: "Your ORM needs to build SQL queries. Some queries use all clauses, some use none. The order matters, and you need to validate the final result. Telescoping constructors with 10+ optional parameters are unreadable.", correctIndex: 0, correctPattern: "Builder", options: ["Builder", "Factory Method", "Strategy", "Chain of Responsibility"], explanation: "Builder separates construction steps. Each method adds one clause and returns the builder (fluent API). build() validates and produces the final query." },
    { id: "s-chain", question: "HTTP middleware stack: authentication → rate limiting → logging → handler", context: "Each middleware can pass the request forward, modify it, or reject it. The order matters. New middleware can be added without changing existing ones.", correctIndex: 3, correctPattern: "Chain of Responsibility", options: ["Decorator", "Strategy", "Pipeline", "Chain of Responsibility"], explanation: "Chain of Responsibility links middleware handlers. Each decides whether to process the request, modify it, or pass it to the next handler in the chain." },
    { id: "s-singleton-config", question: "An application configuration manager that loads settings from files and environment variables", context: "Multiple services need the same config. Loading config is expensive (file I/O + parsing). Config should be immutable after initialization. Only one config instance should exist.", correctIndex: 0, correctPattern: "Singleton", options: ["Singleton", "Factory Method", "Flyweight", "Proxy"], explanation: "Singleton ensures one config instance globally. The private constructor loads config once; getInstance() provides the shared immutable reference everywhere." },
  ];

  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i];
    rows.push({
      moduleId: MODULE_ID,
      quizType: "scenario",
      slug: s.id,
      question: s.question,
      context: s.context,
      options: s.options.map((opt, j) => ({
        label: opt,
        whyWrong: j === s.correctIndex ? "" : "",
      })),
      correctIndex: s.correctIndex,
      explanation: s.explanation,
      patternId: s.correctPattern.toLowerCase().replace(/\s+/g, "-"),
      difficulty: "intermediate",
      sortOrder: i,
    });
  }

  // ── Pattern Comparisons (3) ──────────────────────────────
  const COMPARISONS = [
    { id: "cs-sorting", question: "User selects between QuickSort, MergeSort, and BubbleSort in a visualization app", context: "The USER explicitly picks which sorting algorithm to run. The algorithm doesn't change based on internal state.", correctIndex: 0, options: ["Strategy", "State", "Command"], explanation: "Strategy: the USER selects the algorithm. The context delegates to the chosen strategy. State would mean the algorithm changes automatically based on system state." },
    { id: "cs-vending", question: "A vending machine: idle → coin inserted → item selected → dispensing → idle", context: "The machine's behavior changes completely based on its current state. Inserting a coin in 'idle' is valid but in 'dispensing' it should be rejected.", correctIndex: 1, options: ["Strategy", "State", "Command"], explanation: "State: the SYSTEM transitions between states automatically. Each state defines which actions are valid. Strategy would require the user to explicitly select behavior." },
    { id: "cs-text-editor", question: "Recording keystrokes in a text editor for undo/redo and macro playback", context: "Each keystroke is an operation. You need to store operations, reverse them (undo), replay them (redo), and group them into macros.", correctIndex: 2, options: ["Strategy", "State", "Command"], explanation: "Command: OPERATIONS are objects. Each command has execute() and undo(). A history stack stores commands. Macros are composite commands that replay a sequence." },
  ];

  for (let i = 0; i < COMPARISONS.length; i++) {
    const c = COMPARISONS[i];
    rows.push({
      moduleId: MODULE_ID,
      quizType: "pattern-comparison",
      slug: c.id,
      question: c.question,
      context: c.context,
      options: c.options.map((opt) => ({ label: opt })),
      correctIndex: c.correctIndex,
      explanation: c.explanation,
      patternId: c.options[c.correctIndex].toLowerCase().replace(/\s+/g, "-"),
      difficulty: "intermediate",
      sortOrder: i,
    });
  }

  // ── Upsert all ────────────────────────────────────────────
  console.log(`    Upserting ${rows.length} quiz questions...`);

  const BATCH_SIZE = 20;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db
      .insert(quizQuestions)
      .values(batch)
      .onConflictDoUpdate({
        target: [
          quizQuestions.moduleId,
          quizQuestions.quizType,
          quizQuestions.slug,
        ],
        set: {
          question: quizQuestions.question,
          context: quizQuestions.context,
          options: quizQuestions.options,
          correctIndex: quizQuestions.correctIndex,
          explanation: quizQuestions.explanation,
          patternId: quizQuestions.patternId,
          sortOrder: quizQuestions.sortOrder,
        },
      });
  }

  console.log(`    ✓ ${rows.length} quiz questions upserted`);
}
