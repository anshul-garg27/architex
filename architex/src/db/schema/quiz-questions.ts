/**
 * DB-012: Quiz questions — structured quiz/scenario content.
 *
 * Stores scenario challenges, SOLID quiz questions, pattern comparisons,
 * and any other structured quiz-type content with typed columns for
 * options, correct answers, and explanations.
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Module: 'lld', 'database', 'algorithms', etc. */
    moduleId: varchar("module_id", { length: 50 }).notNull(),
    /** Quiz type: 'scenario', 'solid', 'pattern-comparison', 'daily', etc. */
    quizType: varchar("quiz_type", { length: 50 }).notNull(),
    /** Unique identifier within module+type. */
    slug: varchar("slug", { length: 200 }).notNull(),
    /** The question text. */
    question: text("question").notNull(),
    /** Optional context/scenario description or code snippet. */
    context: text("context"),
    /** Answer options as JSONB array: [{label, description?, whyWrong?}]. */
    options: jsonb("options").notNull().default([]),
    /** Index of the correct option (0-based). */
    correctIndex: integer("correct_index").notNull(),
    /** Explanation shown after answering. */
    explanation: text("explanation").notNull(),
    /** Related pattern/concept slug (for cross-referencing). */
    patternId: varchar("pattern_id", { length: 100 }),
    /** Difficulty level. */
    difficulty: varchar("difficulty", { length: 20 }),
    /** Display ordering. */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("quiz_questions_unique_idx").on(
      table.moduleId,
      table.quizType,
      table.slug,
    ),
    index("quiz_questions_module_type_idx").on(
      table.moduleId,
      table.quizType,
    ),
  ],
);

export type QuizQuestion = InferSelectModel<typeof quizQuestions>;
export type NewQuizQuestion = InferInsertModel<typeof quizQuestions>;
