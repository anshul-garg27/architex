I now have a comprehensive understanding of the codebase. Here is my complete feature design for the five "soft" interview modules.

---

## COMPLETE INTERACTIVE FEATURE SET: Debugging, Testing, Code Review, Behavioral, and Resume Modules

### CURRENT STATE ASSESSMENT

Architex currently has ZERO features for debugging, testing, code review, behavioral, or resume rounds. The interview module is 100% focused on system design and LLD challenges. The competitive analysis confirms no competitor covers all interview rounds either -- this is GAP 11 that no one has identified yet. The platform has strong infrastructure to build on: gamification engine (achievements, XP, streaks, SRS), scoring rubrics, daily challenges, learning paths, mock interview mode, and a persistence layer via IndexedDB.

Key files that serve as foundation:
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/challenges.ts` -- ChallengeDefinition schema
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/scoring.ts` -- ScoringDimension with 1-10 rubrics
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/achievements.ts` -- Achievement system with UserStats
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/srs.ts` -- FSRS spaced repetition
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/learning-paths.ts` -- Week-by-week learning paths
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/daily-challenge.ts` -- Daily challenge rotation
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/interview-store.ts` -- Session persistence, timer, hints
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/interview/MockInterviewMode.tsx` -- Timed mock interview UI

---

## MODULE 1: DEBUGGING ROUND

### 1A. Bug Hunt Simulator (LEARNING + SIMULATION)

**What it is:** An interactive environment presenting broken code with a failing test or error output. The user must read the code, the error, and locate the exact line(s) causing the bug. Think "spot the difference" but for code, with real stack traces, log outputs, and debugger-like stepping.

**How it works:**
- User sees a split view: LEFT = buggy code (read-only, syntax highlighted), RIGHT = error output (stack trace, test failure, or log dump)
- Code has clickable line numbers. User clicks the line(s) they believe contain the bug
- After clicking, they select from a dropdown: "Null Pointer", "Off-by-One", "Race Condition", "Logic Error", "Type Mismatch", etc.
- System evaluates: correct line? correct bug type? Shows explanation of the real bug
- Progressive difficulty: Level 1 = single bug in 20 lines, Level 5 = multiple bugs in 200+ lines of production-style code

**Bug categories (8 topics, 5-10 scenarios each = 40-80 total):**

| Category | Example Scenarios |
|---|---|
| Stack Traces (Java/Python/JS) | NullPointerException in a chain of calls; Python AttributeError from None return; JS TypeError from undefined property access |
| Log Analysis | Find the anomaly in 200 lines of timestamped logs; correlate error patterns across services; grep/awk challenges |
| Null/Undefined | Java Optional misuse; JS optional chaining failure; Python NoneType attribute access |
| Memory Leaks | Java: growing HashMap without removal; Python: circular references; JS: event listener not removed |
| Performance | N+1 query in ORM code; quadratic loop hidden in method call; missing index causing full table scan |
| Race Conditions | Two threads incrementing shared counter; check-then-act without lock; double-checked locking bug |
| Network Issues | Timeout without retry; connection pool exhaustion; DNS resolution failure in config |
| Production Debugging | Read-only access scenario; "You can only see logs and metrics, not source code" challenges |

**Impact: 9/10** -- Debugging is tested at every company and no platform teaches it interactively.
**WOW: 8/10** -- Clicking buggy lines with instant feedback is deeply satisfying.
**Effort: L** -- Requires curating 40-80 code snippets with metadata, building the split-view editor component, and the evaluation engine.
**Exists? No** -- Nothing like this exists on any platform. LeetCode has "debug this code" but only for DSA, not system-level debugging.

---

### 1B. Stack Trace Reader (LEARNING)

**What it is:** Interactive tutorial that teaches how to read stack traces in Java, Python, and JavaScript. Each language gets a guided walkthrough: "Read from bottom to top", "This is the exception type", "This line number is where it actually crashed", "This is the root cause frame."

**How it works:**
- Presents a real stack trace with annotatable sections
- User hovers over each frame and sees explanations: "This is a library frame (ignore)", "This is YOUR code (investigate)", "This is the exception message (key info)"
- Quizzes after each walkthrough: "What line caused the crash?", "What exception was thrown?", "Which method should you look at first?"
- Covers: Java exceptions (NullPointerException, ClassCastException, StackOverflowError, OutOfMemoryError), Python tracebacks (AttributeError, KeyError, ImportError), JS errors (TypeError, ReferenceError, RangeError)

**Impact: 7/10** -- Fundamental skill, especially for junior engineers.
**WOW: 5/10** -- Educational but not flashy.
**Effort: M** -- Annotated content curation + tooltip component.
**Exists? No** -- No platform teaches stack trace reading interactively.

---

### 1C. Log Detective Challenge (PRACTICE + ASSESSMENT)

**What it is:** Timed challenge where user receives a dump of application logs (100-500 lines) and must answer questions: "When did the first error occur?", "How many unique error types are there?", "What is the root cause?", "What service is the bottleneck?"

**How it works:**
- Log viewer with search, filter, and highlight capabilities
- Questions appear as a checklist on the right
- Timer running (10-15 minutes)
- Scored on: accuracy of answers, speed, and whether they identified the root cause (not just symptoms)
- Difficulty levels: Level 1 = single-service logs, Level 3 = multi-service logs with correlation IDs, Level 5 = production incident with misleading red herrings

**Impact: 8/10** -- Directly maps to on-call and debugging interview questions.
**WOW: 7/10** -- Feels like a real production incident.
**Effort: M** -- Log generator + viewer + question system.
**Exists? No**

---

### 1D. Memory Leak Investigator (SIMULATION)

**What it is:** Interactive heap dump visualization. User sees a simplified heap graph showing object references, and must identify which object is retaining memory it shouldn't. Visualizes GC roots, strong/weak references, and retention paths.

**How it works:**
- Graph visualization (reuse React Flow) showing objects as nodes and references as edges
- GC roots highlighted in green, leaked objects in red (but user must find them)
- User clicks an object to see its retention path (who is holding a reference to it?)
- Scenarios: static field holding a list that grows; inner class retaining outer class; event listener preventing garbage collection
- After identifying the leak, user explains the fix (multiple choice or free text)

**Impact: 8/10** -- Memory leaks are asked at senior+ levels and nobody teaches this visually.
**WOW: 9/10** -- Heap visualization is genuinely novel in interview prep.
**Effort: L** -- Requires graph visualization engine (can reuse React Flow), heap scenario data, evaluation logic.
**Exists? No** -- Java VisualVM exists for real heap dumps but is not educational.

---

### 1E. Debug Flashcards (REVIEW)

**What it is:** Spaced repetition flashcards for debugging patterns. Front: error message or symptom. Back: root cause, investigation steps, and fix.

**Examples:**
- Front: "java.lang.OutOfMemoryError: Java heap space" -> Back: "Object retention growing faster than GC. Check: 1) Collections that grow without bounds, 2) Static fields holding large objects, 3) Listeners not deregistered. Fix: heap dump analysis with MAT/VisualVM."
- Front: "Connection refused at port 5432" -> Back: "PostgreSQL is not running or not accepting connections. Check: 1) Is the service running? 2) Is the port correct? 3) Is the firewall blocking? 4) Max connections reached?"

**Impact: 6/10** -- Solid retention tool.
**WOW: 4/10** -- Flashcards are standard.
**Effort: S** -- Content curation + existing SRS infrastructure.
**Exists? Partial** -- Anki decks exist but not purpose-built for debugging.

---

### 1F. AI Bug Generator (AI)

**What it is:** AI generates novel buggy code snippets for unlimited practice. User specifies: language, bug type, difficulty, and domain (web API, data pipeline, microservice, etc.). AI creates a realistic code snippet with an intentional bug, plus the "correct" version for verification.

**Impact: 7/10** -- Infinite practice material.
**WOW: 6/10** -- AI generation is expected now.
**Effort: M** -- API route + prompt engineering + validation.
**Exists? No**

---

## MODULE 2: TESTING ROUND

### 2A. Test Writer Challenge (PRACTICE + ASSESSMENT)

**What it is:** Given a function signature and specification, the user must write tests that catch all edge cases. The system has a hidden set of "mutants" (intentionally broken versions of the function), and the user's test suite is scored by how many mutants it catches (mutation testing).

**How it works:**
- Left panel: function code (read-only) with JSDoc/docstring specification
- Right panel: test editor where user writes test cases
- User writes tests using a simplified assertion API (expect/assert)
- On submit, system runs user's tests against 10-20 mutant versions of the function
- Score: "Your tests killed 14/20 mutants" with explanation of which mutations survived and why
- Each surviving mutant reveals an edge case the user missed

**Test scenarios (by topic):**

| Topic | Example |
|---|---|
| Unit Testing | Test a `calculateDiscount(price, couponCode)` function -- edge cases: negative price, expired coupon, stacking coupons |
| Edge Cases | Test a `binarySearch(arr, target)` -- empty array, single element, target at boundaries, duplicates |
| Mocking | Test a `sendNotification(userId, message)` that calls an email API -- mock the API, verify it was called with correct args |
| Integration | Test a REST endpoint that reads from DB -- setup test data, call endpoint, verify response + DB state |
| Property-Based | Given `sort(arr)`, write properties: output length equals input length, output is sorted, output is a permutation of input |

**Impact: 9/10** -- Testing round is asked at FAANG, and mutation testing scoring is genuinely novel.
**WOW: 9/10** -- "Your tests killed 14/20 mutants" is an incredibly compelling feedback mechanism.
**Effort: L** -- Requires sandboxed code execution (or client-side eval for JS), mutant generation, assertion API.
**Exists? No** -- Nothing like mutation-scored test writing exists in interview prep.

---

### 2B. Test Coverage Visualizer (LEARNING + SIMULATION)

**What it is:** Given a function and a set of tests, visualize which lines/branches are covered and which are not. User can add tests and see coverage update in real-time. Teaches the difference between line coverage, branch coverage, and path coverage.

**How it works:**
- Code view with line-level coverage highlighting (green = covered, red = not covered, yellow = partially covered)
- Branch coverage overlay showing which if/else paths were taken
- User adds test cases and watches coverage percentage increase
- Challenge mode: "Get this function to 100% branch coverage in the fewest tests possible"
- Teaches WHY 100% line coverage != 100% branch coverage through visual demonstration

**Impact: 7/10** -- Coverage is frequently discussed in interviews.
**WOW: 7/10** -- Real-time coverage visualization is satisfying.
**Effort: M** -- Coverage calculation engine + code highlighting.
**Exists? Partial** -- Istanbul/NYC exist for real projects, but nothing teaches coverage concepts interactively.

---

### 2C. TDD Kata Simulator (LEARNING + PRACTICE)

**What it is:** Guided red-green-refactor cycles. The system presents a specification, the user writes a failing test (red), then writes minimal code to pass (green), then refactors. The system enforces the TDD cycle: you CANNOT write production code until you have a failing test.

**How it works:**
- Three-panel layout: specification (left), test editor (center), production code (right)
- Phase indicator: RED / GREEN / REFACTOR (prominently displayed)
- RED phase: test editor active, production code locked. User writes a test that fails
- GREEN phase: production code active, test editor locked. User writes minimal code to pass
- REFACTOR phase: both active. User improves code while keeping tests green
- Built-in katas: FizzBuzz, String Calculator, Roman Numerals, Bowling Game, Mars Rover

**Impact: 8/10** -- TDD is a common interview topic and nobody teaches the discipline interactively.
**WOW: 8/10** -- Enforcing the cycle with locked panels is a killer UX innovation.
**Effort: L** -- Requires code execution sandbox, phase state machine, 10+ kata definitions.
**Exists? No** -- Cyber-dojo.org does TDD katas but with no guidance, no scoring, and terrible UX.

---

### 2D. Edge Case Finder (ASSESSMENT)

**What it is:** Given a function specification (not the code), the user must list all edge cases they can think of. Scored against a comprehensive edge case checklist.

**How it works:**
- Specification shown: "Write a function that validates email addresses"
- User types edge cases into a list: "empty string", "no @ symbol", "multiple @ symbols", "domain with no TLD", "unicode characters", etc.
- On submit, system compares against master list and scores: "You found 12/18 edge cases"
- Missed edge cases are revealed with explanations
- Categories: boundary values, null/empty, type coercion, overflow, concurrency, format violations

**Impact: 7/10** -- Edge case thinking is tested in every coding interview.
**WOW: 6/10** -- Simple but effective.
**Effort: S** -- Specification + checklist data + fuzzy matching for user input.
**Exists? No**

---

### 2E. Testing Strategy Flashcards (REVIEW)

**What it is:** SRS flashcards for testing concepts. Front: scenario or question. Back: correct testing approach.

**Examples:**
- Front: "When should you use a mock vs a stub?" -> Back: "Stub: replaces a dependency with a fixed return value. Use when you need the dependency to return specific data. Mock: records calls and verifies interactions. Use when you need to verify the code calls the dependency correctly."
- Front: "Your test passes locally but fails in CI. What do you check?" -> Back: "1) Time-dependent logic (timezone, clock), 2) File system differences (path separators, permissions), 3) Environment variables, 4) Non-deterministic ordering (set iteration, async), 5) Shared state between tests."

**Impact: 6/10**
**WOW: 4/10**
**Effort: S** -- Content + existing SRS infrastructure.
**Exists? Partial** -- Generic flashcard apps exist but not testing-specific.

---

### 2F. AI Test Reviewer (AI)

**What it is:** User pastes their test code, AI reviews it for: missing edge cases, test smell detection (testing implementation details, flaky patterns, overly specific assertions), readability, and Arrange-Act-Assert structure compliance.

**Impact: 7/10** -- Personalized feedback on user's actual tests.
**WOW: 6/10**
**Effort: M** -- API route + prompt engineering + structured output.
**Exists? No** -- Code review tools exist but none focused on test quality.

---

## MODULE 3: CODE REVIEW ROUND

### 3A. PR Review Simulator (SIMULATION + ASSESSMENT)

**What it is:** The core feature. User sees a realistic Pull Request diff (50-200 lines across 2-5 files) containing intentionally planted issues. User must annotate issues by clicking lines and leaving comments, exactly like a real GitHub PR review.

**How it works:**
- GitHub-style diff viewer (unified or split view)
- User clicks a line to add a review comment
- Comment requires: issue type (bug, performance, security, style, naming) + description + severity (critical/major/minor/nit)
- After submission, system reveals the full answer key: all planted issues with explanations
- Score: precision (what % of your comments were real issues) + recall (what % of real issues did you find)
- Levels: Level 1 = clean code violations only, Level 3 = hidden bugs + performance, Level 5 = subtle security vulnerabilities + race conditions

**PR categories (6 topics, 5-10 PRs each = 30-60 total):**

| Category | Example PRs |
|---|---|
| Clean Code | Bad naming, long methods, magic numbers, deep nesting, comments explaining what (not why) |
| Code Smells | God class, feature envy, shotgun surgery, primitive obsession, data clumps |
| Performance | N+1 queries, unnecessary loops, missing pagination, unindexed queries, memory allocation in hot path |
| Security | SQL injection via string concat, XSS via unsanitized output, hardcoded API keys, missing auth check |
| Hidden Bugs | Off-by-one in loop, null pointer in error path, resource not closed in finally, integer overflow |
| Refactoring | "This works but how would you improve it?" -- identify improvement opportunities, not just bugs |

**Impact: 10/10** -- Code review rounds are universal at senior+ levels and ZERO platforms prepare for them.
**WOW: 10/10** -- A GitHub PR simulator for interview prep is an instant "I need this" reaction.
**Effort: XL** -- Diff viewer component, annotation system, 30-60 curated PRs with answer keys, scoring engine.
**Exists? No** -- This is a completely unserved market.

---

### 3B. Code Smell Detector (LEARNING)

**What it is:** Interactive catalog of code smells with before/after examples. Each smell has: definition, why it's a problem, real-world example, refactored version, and a "try it yourself" mini-challenge.

**How it works:**
- Catalog view: 20+ code smells organized by category (bloaters, OOP abusers, change preventers, dispensables, couplers)
- Each entry: side-by-side "before" (smelly) and "after" (clean) code
- Interactive: user can toggle between before/after to see the transformation
- Mini-quiz after each: "Is this code a Long Method or a God Class?" (identification)
- Progression: unlock advanced smells after mastering basic ones

**Impact: 7/10** -- Code smells are a standard interview topic.
**WOW: 6/10** -- Catalog format is standard, but the before/after toggle is nice.
**Effort: M** -- Content curation (20+ smells with code) + catalog UI.
**Exists? Partial** -- Refactoring.Guru covers this in static text. Nobody does it interactively.

---

### 3C. Security Audit Challenge (PRACTICE)

**What it is:** Given a code snippet, find all security vulnerabilities. Specifically targets OWASP Top 10 patterns that appear in code: injection, broken auth, XSS, CSRF, insecure deserialization, hardcoded secrets, missing input validation.

**How it works:**
- Same line-annotation interface as PR Review Simulator
- But focused exclusively on security
- Each vulnerability has a severity rating (CVSS-style)
- After submission, shows not just what the vulnerability is but what the exploit looks like
- "If an attacker sends THIS request, your code does THIS" -- concrete demonstrations

**Impact: 8/10** -- Security rounds are increasingly common, especially at financial/health companies.
**WOW: 8/10** -- Showing the actual exploit is powerful.
**Effort: M** -- Reuses PR Review Simulator infrastructure, security-specific content.
**Exists? No** -- CTF platforms exist but are not interview-focused.

---

### 3D. Refactoring Workshop (PRACTICE)

**What it is:** User receives working-but-ugly code and must refactor it while keeping all tests passing. Tests run automatically after each change. The system scores the refactoring on: readability improvement, complexity reduction, and whether tests still pass.

**How it works:**
- Split view: code editor (left), test results (right, auto-run)
- Code is functional but violates clean code principles
- User edits the code; tests auto-run on each save
- Metrics tracked: cyclomatic complexity (before/after), function length (before/after), naming quality score
- "You reduced complexity from 14 to 6 while keeping all 12 tests green"

**Impact: 7/10** -- Refactoring under test is a common code review follow-up.
**WOW: 7/10** -- Live test feedback during refactoring is satisfying.
**Effort: L** -- Requires code execution sandbox, complexity analysis, 10+ refactoring exercises.
**Exists? No**

---

### 3E. Review Checklist Flashcards (REVIEW)

**What it is:** SRS flashcards for code review patterns.

**Examples:**
- Front: "You see `SELECT * FROM users WHERE id = '" + userId + "'"` in a PR" -> Back: "SQL Injection. Severity: Critical. Fix: Use parameterized queries/prepared statements. Never concatenate user input into SQL strings."
- Front: "A function is 150 lines long with 8 parameters" -> Back: "Long Method + Long Parameter List smells. Split into smaller focused functions. Group related parameters into an object. Extract reusable private methods."

**Impact: 6/10**
**WOW: 4/10**
**Effort: S** -- Content + existing SRS.
**Exists? Partial**

---

### 3F. AI Review Scorer (AI)

**What it is:** User writes a code review for a given PR diff, and AI scores the review quality. Evaluates: Did you catch the important bugs? Were your comments actionable? Did you explain the "why"? Were you constructive or just critical?

**Impact: 8/10** -- Teaches HOW to review, not just WHAT to catch.
**WOW: 7/10**
**Effort: M** -- API route + prompt engineering.
**Exists? No**

---

## MODULE 4: BEHAVIORAL / HR ROUND

### 4A. STAR Story Builder (LEARNING + PRACTICE)

**What it is:** Guided template that walks users through constructing behavioral interview answers using the STAR method (Situation, Task, Action, Result). Not just a template -- it's an interactive form with prompts, examples, and AI-powered improvement suggestions.

**How it works:**
- Four-section form: Situation (context-setting), Task (what you needed to do), Action (what YOU did), Result (quantified outcome)
- Each section has: character limit guidance, "good vs bad" example toggle, prompting questions
- Situation: "Where were you working? What was the project? What was the scale?"
- Task: "What was your specific responsibility? What made this challenging?"
- Action: "What did YOU do (not the team)? What technical decisions did you make? What was your thought process?"
- Result: "What was the quantified outcome? Revenue? Performance improvement? User growth?"
- AI review button: evaluates your story for specificity, quantification, and whether it actually answers common behavioral questions
- Story library: save multiple stories, tagged by question type (conflict, failure, leadership, etc.)

**Behavioral question categories (5 topics, 5-8 questions each = 25-40):**

| Category | Example Questions |
|---|---|
| Conflict Handling | "Tell me about a time you disagreed with a coworker", "Describe a time you pushed back on a decision" |
| Ownership / Leadership | "Tell me about a time you took initiative", "Describe a project you owned end-to-end" |
| Failure / Learning | "Tell me about your biggest mistake", "Describe a project that failed" |
| Teamwork | "How do you handle working with someone difficult?", "Tell me about a cross-functional collaboration" |
| Technical Depth | "Tell me about the most complex system you built", "Describe a technical decision you're proud of" |

**Impact: 9/10** -- Behavioral is the #1 reason candidates fail interviews at Amazon, and no platform helps you prepare.
**WOW: 8/10** -- Guided story building with AI improvement is genuinely useful.
**Effort: M** -- Form UI + story storage + AI review endpoint.
**Exists? No** -- Generic STAR templates exist as PDFs, but nothing interactive with AI feedback.

---

### 4B. Mock Behavioral Interview (SIMULATION)

**What it is:** AI-powered mock behavioral interview. AI asks a behavioral question, user responds (text or voice-to-text), AI gives structured feedback on the response quality.

**How it works:**
- Interview simulation: AI interviewer asks a question from the behavioral bank
- User types their response (or uses browser speech-to-text API)
- AI evaluates on 5 dimensions: STAR structure compliance, specificity of details, quantified results, "I" vs "we" language (was it YOUR contribution?), relevance to the question
- Structured feedback after each answer: "Your situation was clear but your action lacked specific technical details. You said 'we redesigned the system' -- what did YOU specifically do?"
- Full mock: 5-6 questions in sequence, 30-minute session, overall score at end
- Difficulty: adjust by company style (Amazon = obsessive about Leadership Principles, Google = more open-ended, Meta = focus on impact at scale)

**Impact: 9/10** -- Mock behavioral interviews with structured feedback are extremely valuable.
**WOW: 9/10** -- Nobody does this well. Pramp has peer mock interviews but no AI evaluation.
**Effort: L** -- AI API integration, conversation management, scoring rubric, voice-to-text integration.
**Exists? No** -- Hello Interview has some, but charges $70-100 per mock session. Architex does it at $12/month.

---

### 4C. Company-Specific Behavioral Prep (LEARNING)

**What it is:** Curated behavioral question banks and preparation guides for specific companies. Amazon's 16 Leadership Principles mapped to likely questions. Google's Googleyness criteria. Meta's emphasis on impact.

**How it works:**
- Company selector: Amazon, Google, Meta, Microsoft, Apple, Netflix, Stripe, etc.
- Each company: list of their core values/principles, mapped to specific behavioral questions
- Amazon deep-dive: each of the 16 Leadership Principles with 2-3 example questions, what interviewers look for, and example strong/weak answers
- STAR story tagging: tag your saved stories by which company principles they demonstrate
- Gap analysis: "You have strong stories for Customer Obsession and Ownership, but nothing for Frugality or Have Backbone"

**Impact: 8/10** -- Company-specific prep is highest-ROI prep.
**WOW: 7/10** -- Gap analysis is the differentiator.
**Effort: M** -- Content curation + tagging system + gap analysis logic.
**Exists? Partial** -- Blind/Glassdoor have question lists but no structured prep or gap analysis.

---

### 4D. Behavioral Pattern Flashcards (REVIEW)

**What it is:** SRS flashcards that present a behavioral question and the user practices recalling their best story for it. The "answer" side shows the question type, which STAR stories from their library match, and tips for strong answers.

**Impact: 6/10**
**WOW: 5/10**
**Effort: S** -- Content + existing SRS + story library integration.
**Exists? No**

---

### 4E. AI Story Improver (AI)

**What it is:** User pastes a STAR story draft, AI rewrites/improves it. Adds quantification where missing ("increased performance" -> "reduced p99 latency from 800ms to 120ms"). Adds specificity ("redesigned the database" -> "migrated from PostgreSQL to DynamoDB with a GSI for the access pattern"). Suggests stronger action verbs.

**Impact: 8/10** -- Direct, actionable improvement of user's stories.
**WOW: 7/10**
**Effort: S** -- Single API endpoint + prompt engineering.
**Exists? No**

---

## MODULE 5: RESUME DEEP-DIVE ROUND

### 5A. Architecture Articulator (LEARNING + PRACTICE)

**What it is:** User describes a system they built (free text or guided form), and the tool helps them articulate it clearly for interviews. Generates: an elevator pitch (30 seconds), a technical deep-dive (5 minutes), and a system diagram they can reference.

**How it works:**
- Guided input form: "What did you build?", "What was the tech stack?", "How many users/requests?", "What were the key components?", "What patterns did you use?"
- Output: three levels of description (elevator pitch, medium detail, deep dive)
- Auto-generates a system design diagram on the Architex canvas (reuses existing canvas infrastructure)
- Practice mode: AI asks "Tell me about the architecture" and user practices their verbal explanation
- "Numbers checker": flags vague language and prompts for specifics ("handled high traffic" -> "What was the QPS? How many servers?")

**Impact: 9/10** -- Every interview starts with "tell me about what you built" and most candidates fumble it.
**WOW: 9/10** -- Auto-generating a diagram from a description, then practicing your explanation of it, is a powerful loop.
**Effort: L** -- Form UI + AI diagram generation (builds on Feature 1 Architecture Generator) + explanation practice mode.
**Exists? No** -- This is a completely novel concept.

---

### 5B. Numbers Driller (PRACTICE + ASSESSMENT)

**What it is:** Quizzes the user on the numbers behind their own projects. "What was the QPS?", "How much data did you store?", "What was the p99 latency?", "How many servers?", "What was the monthly cost?" Users enter their answers, the system helps them verify if the numbers make mathematical sense.

**How it works:**
- User inputs their project context: DAU, team size, tech stack
- System generates project-specific questions about scale numbers
- Sanity checker: "You said 10M DAU but only 100 QPS -- that implies each user makes 0.00086 requests per day. Are you sure?"
- Cross-reference: "You said 50 servers handling 100K QPS. That is 2000 QPS per server. For a Python service, that is high -- are you using async/WASM?"
- Flashcard mode: drill your own project's numbers until you can recall them instantly
- Leverages existing `capacity-planner.ts` for sanity checks

**Impact: 8/10** -- "What was the scale?" is the follow-up question to every resume bullet.
**WOW: 7/10** -- The sanity checker that catches impossible numbers is uniquely useful.
**Effort: M** -- Question generation + capacity planner integration + sanity check logic.
**Exists? No**

---

### 5C. Failure Story Builder (PRACTICE)

**What it is:** Guided template specifically for articulating failures and postmortems. "What broke? Why did it break? What was the blast radius? How did you fix it? What did you change to prevent it from happening again?" Structured as a mini-postmortem.

**How it works:**
- Postmortem template: Timeline, Impact, Root Cause, Resolution, Prevention
- Each section has prompting questions and example answers
- AI evaluates: Is the story too short? Does it show learning? Does it demonstrate ownership?
- "Failure depth" score: surface-level ("the server crashed") vs deep ("the connection pool was sized for average load but not peak; I added circuit breaking and horizontal autoscaling based on connection count")
- Saves to story library with tags: "postmortem", "scaling failure", "data loss", etc.

**Impact: 8/10** -- "Tell me about a failure" is asked in every behavioral round.
**WOW: 7/10** -- Postmortem-as-interview-prep is a fresh angle.
**Effort: S** -- Template form + AI evaluation.
**Exists? No**

---

### 5D. Trade-Off Articulator (LEARNING + PRACTICE)

**What it is:** Interactive tool for practicing how to explain engineering trade-offs you made. "We chose PostgreSQL over DynamoDB because..." with structured frameworks: pros/cons tables, decision matrices, and "what I'd do differently" reflections.

**How it works:**
- Decision template: "What was the decision?", "What were the alternatives?", "What criteria mattered?", "What did you choose?", "What would you change?"
- Auto-generates a weighted decision matrix
- Practice mode: AI asks "Why didn't you choose [alternative]?" and user practices defending their decision
- Common trade-off library: SQL vs NoSQL, monolith vs microservices, REST vs gRPC, Redis vs Memcached, Kafka vs SQS -- pre-populated with decision criteria

**Impact: 7/10** -- Trade-off discussions are the core of senior engineering interviews.
**WOW: 6/10** -- Decision matrices are not novel, but the practice mode is.
**Effort: M** -- Template + decision matrix UI + AI questioning.
**Exists? No**

---

### 5E. Resume Bullet Optimizer (AI)

**What it is:** User pastes resume bullet points, AI rewrites them to be interview-ready. Adds quantification, removes weak language, ensures they lead to interesting follow-up questions rather than dead ends.

**How it works:**
- Input: raw resume bullet ("Built a microservices architecture")
- Output: optimized bullet ("Decomposed a monolithic Java application into 12 microservices handling 50K RPS, reducing deployment time from 2 hours to 8 minutes and enabling independent scaling that cut infrastructure costs by 35%")
- Rewrite dimensions: quantification, specificity, impact, follow-up potential
- "Follow-up predictor": shows the 3-5 most likely interviewer follow-up questions for each bullet
- Red flags: identifies bullets that invite dangerous follow-ups ("built an ML model" if you can't actually discuss ML)

**Impact: 9/10** -- Resume bullets are the source material for the entire interview. Better bullets = better interviews.
**WOW: 8/10** -- The "follow-up predictor" is genuinely novel and valuable.
**Effort: M** -- AI endpoint + structured output + UI.
**Exists? Partial** -- ChatGPT can do this if prompted correctly, but no purpose-built tool with follow-up prediction.

---

### 5F. Project Deep-Dive Simulator (SIMULATION)

**What it is:** Full mock "resume deep-dive" round. AI plays the interviewer, starts with "Tell me about the most interesting project you've worked on", then asks increasingly deep follow-up questions based on your answers. Tests whether you can go 3-4 levels deep on any topic you mention.

**How it works:**
- AI reads your project description (from Architecture Articulator) and STAR stories (from Story Builder)
- Conversation flow: starts broad, narrows based on your answers
- Depth tracker: shows how many levels deep the conversation has gone
- "Danger zone" detection: if AI notices you're getting vague or defensive, it flags it
- Post-session analysis: "You went 4 levels deep on database design but only 1 level on deployment. Interviewers will notice this gap."
- Practice until you can go 4+ levels deep on every aspect of your project

**Impact: 9/10** -- The resume deep-dive is the first 15-20 minutes of every onsite interview.
**WOW: 9/10** -- Depth-tracking with gap analysis is not available anywhere.
**Effort: L** -- Multi-turn AI conversation + depth tracking + gap analysis.
**Exists? No**

---

## CROSS-MODULE FEATURES

### X1. Unified Interview Dashboard

**What it is:** A single dashboard showing preparation readiness across ALL interview rounds: System Design, LLD, Debugging, Testing, Code Review, Behavioral, Resume. Each round shows a readiness percentage based on practice completed, scores achieved, and SRS review status.

**How it works:**
- Radar chart: 7 axes, one per interview round, showing 0-100% readiness
- Per-round breakdown: "Debugging: 65% ready -- Stack traces mastered, Memory leaks need work"
- Recommended focus: "Your weakest area is Behavioral (30%). Spend time on STAR stories this week."
- Learning path integration: extends existing learning paths to cover all 7 rounds

**Impact: 8/10** -- Gives users a clear sense of where they stand.
**WOW: 7/10** -- The radar chart is a satisfying visual.
**Effort: M** -- Aggregation logic + radar chart component + dashboard UI.
**Exists? No**

---

### X2. Full Loop Mock Interview

**What it is:** Simulate an entire interview loop: 45 minutes system design + 30 minutes coding + 30 minutes debugging + 30 minutes behavioral. AI evaluates each round and gives an overall "hire/no-hire" recommendation with detailed feedback.

**How it works:**
- Select target company and level (L4/L5/L6/L7)
- System generates a full loop matching that company's format
- Timer enforces realistic time constraints
- Each round scored independently, then aggregated
- Final verdict: "Strong Hire", "Hire", "Lean Hire", "Lean No Hire", "No Hire" with per-round breakdown

**Impact: 10/10** -- The holy grail of interview prep. Nobody offers a complete loop simulation.
**WOW: 10/10** -- This is the marketing headline feature.
**Effort: XL** -- Requires all individual modules to be built first, plus orchestration and final scoring.
**Exists? No** -- This does not exist anywhere at any price point.

---

### X3. Company-Specific Interview Prep Plans

**What it is:** Pre-built 2-week and 4-week preparation plans tailored to specific companies. "Preparing for Amazon? Here's your 4-week plan: Week 1: Leadership Principles + STAR stories, Week 2: System Design (Amazon-style), Week 3: Debugging + Coding, Week 4: Mock loops."

**Impact: 8/10** -- Structured plans reduce anxiety and increase follow-through.
**WOW: 7/10**
**Effort: M** -- Content curation + learning path extension.
**Exists? Partial** -- Blog posts exist, but no interactive plans.

---

## PRIORITY MATRIX (Impact x WOW / Effort)

### TIER 1: Build First (highest impact-per-effort, define the product)

| # | Feature | Impact | WOW | Effort | Rationale |
|---|---------|--------|-----|--------|-----------|
| 3A | PR Review Simulator | 10 | 10 | XL | Zero competition. Defines a new product category. The feature that makes people say "I NEED this." |
| 4A | STAR Story Builder | 9 | 8 | M | Every candidate needs this. Low effort, high retention. |
| 4B | Mock Behavioral Interview | 9 | 9 | L | The behavioral equivalent of your system design mock interview. |
| 5E | Resume Bullet Optimizer | 9 | 8 | M | The entry point -- users come to fix their resume, stay for everything else. |
| 1A | Bug Hunt Simulator | 9 | 8 | L | Novel, engaging, and directly maps to interview rounds. |

### TIER 2: Build Second (strong impact, moderate effort)

| # | Feature | Impact | WOW | Effort | Rationale |
|---|---------|--------|-----|--------|-----------|
| 2A | Test Writer Challenge (mutation) | 9 | 9 | L | Mutation testing scoring is a killer differentiator. |
| 5A | Architecture Articulator | 9 | 9 | L | "Tell me about what you built" is the first question in every interview. |
| 5F | Project Deep-Dive Simulator | 9 | 9 | L | Depth tracking is novel and valuable. |
| 4C | Company-Specific Behavioral | 8 | 7 | M | Amazon LP prep alone justifies this feature. |
| 1C | Log Detective Challenge | 8 | 7 | M | Production-realistic debugging practice. |

### TIER 3: Build Third (strong differentiators, higher effort)

| # | Feature | Impact | WOW | Effort | Rationale |
|---|---------|--------|-----|--------|-----------|
| 1D | Memory Leak Investigator | 8 | 9 | L | Genuinely novel visualization. Senior+ differentiation. |
| 2C | TDD Kata Simulator | 8 | 8 | L | Locked panel TDD enforcement is a killer UX innovation. |
| 3C | Security Audit Challenge | 8 | 8 | M | Reuses PR Review Simulator infrastructure. |
| 3D | Refactoring Workshop | 7 | 7 | L | Live test feedback during refactoring. |
| 5B | Numbers Driller | 8 | 7 | M | Sanity checker prevents embarrassment in interviews. |
| X1 | Unified Interview Dashboard | 8 | 7 | M | Ties everything together with the radar chart. |

### TIER 4: Content & Polish (low effort, rounds out the product)

| # | Feature | Impact | WOW | Effort | Rationale |
|---|---------|--------|-----|--------|-----------|
| 1B | Stack Trace Reader | 7 | 5 | M | Educational foundation for debugging module. |
| 1E | Debug Flashcards | 6 | 4 | S | Existing SRS infrastructure. |
| 1F | AI Bug Generator | 7 | 6 | M | Infinite practice material. |
| 2B | Test Coverage Visualizer | 7 | 7 | M | Teaching coverage concepts visually. |
| 2D | Edge Case Finder | 7 | 6 | S | Simple but effective assessment. |
| 2E | Testing Strategy Flashcards | 6 | 4 | S | Content + existing SRS. |
| 2F | AI Test Reviewer | 7 | 6 | M | Personalized feedback. |
| 3B | Code Smell Detector | 7 | 6 | M | Before/after interactive catalog. |
| 3E | Review Checklist Flashcards | 6 | 4 | S | Content + existing SRS. |
| 3F | AI Review Scorer | 8 | 7 | M | Teaches the meta-skill of reviewing well. |
| 4D | Behavioral Flashcards | 6 | 5 | S | Content + existing SRS. |
| 4E | AI Story Improver | 8 | 7 | S | Single endpoint, high value. |
| 5C | Failure Story Builder | 8 | 7 | S | Postmortem-as-interview-prep angle. |
| 5D | Trade-Off Articulator | 7 | 6 | M | Decision matrix + practice mode. |

### TIER 5: The Dream (maximum wow, maximum effort)

| # | Feature | Impact | WOW | Effort | Rationale |
|---|---------|--------|-----|--------|-----------|
| X2 | Full Loop Mock Interview | 10 | 10 | XL | The ultimate feature. Requires all modules built first. This is the marketing headline. |
| X3 | Company-Specific Plans | 8 | 7 | M | Structured plans for specific companies. |

---

## ARCHITECTURAL NOTES FOR IMPLEMENTATION

**Schema Extension:** The existing `ChallengeDefinition` in `challenges.ts` needs a `roundType` field:

```typescript
type InterviewRound = 'system-design' | 'lld' | 'debugging' | 'testing' | 'code-review' | 'behavioral' | 'resume';
```

**Scoring Extension:** The `ScoringDimension` schema in `scoring.ts` needs per-module rubrics. The current 6 dimensions (Functional, API, Data Model, Scalability, Reliability, Communication) are system-design-specific. Each new module needs its own dimensions:

- Debugging: Bug Identification, Root Cause Analysis, Investigation Method, Fix Quality, Communication
- Testing: Edge Case Coverage, Test Structure, Assertion Quality, Mock Usage, Coverage Strategy
- Code Review: Issue Detection (Precision), Issue Detection (Recall), Comment Quality, Severity Assessment, Constructive Tone
- Behavioral: STAR Structure, Specificity, Quantification, Personal Contribution, Relevance
- Resume: Articulation Clarity, Technical Depth, Scale Awareness, Trade-Off Reasoning, Follow-Up Readiness

**Store Extension:** The `interview-store.ts` already has session persistence via IndexedDB. New modules should use the same pattern: separate stores for each module's state, but shared gamification (XP, achievements, streaks) through the existing `UserStats` interface in `achievements.ts`.

**Reuse Opportunities:**
- Flashcards (all 5 modules): extend existing `srs.ts` FSRS algorithm. Create a `FlashcardDeck` type with round-specific decks
- Timer: reuse existing `CountdownTimer` from `MockInterviewMode.tsx`
- AI endpoints: share a single `/api/ai/evaluate` route with different system prompts per module
- Achievement system: extend existing `ACHIEVEMENTS` array with new categories for each module
- Learning paths: extend existing `LearningPath` schema with multi-round weeks

---

## COMPETITIVE POSITIONING

This feature set creates **GAP 11: Full Interview Loop Preparation** which no competitor covers. The competitive landscape analysis at `/Users/anshullkgarg/Desktop/system_design/architex/docs/research-findings/23-competitive-landscape.md` shows every competitor covers at most 1-2 interview rounds. With these 5 new modules, Architex becomes the ONLY platform that prepares candidates for all 7 rounds of a typical engineering interview:

1. System Design (existing)
2. Low-Level Design / OOP (existing)
3. DSA / Coding (existing via algorithm visualizer, but needs code execution)
4. Debugging (NEW -- Module 1)
5. Testing (NEW -- Module 2)
6. Code Review (NEW -- Module 3)
7. Behavioral + Resume (NEW -- Modules 4+5)

The marketing headline writes itself: **"The only platform that prepares you for every round."**

The pricing advantage is devastating: this entire suite at $12/month vs Hello Interview at $70/session for a single mock interview vs DesignGurus at $119/month for static text content.