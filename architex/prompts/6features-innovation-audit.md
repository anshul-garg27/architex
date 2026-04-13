You are three people in one:

- A **product manager** from Duolingo who turned language learning into a daily habit for 500M users through streaks, gamification, and retention mechanics
- A **growth engineer** from Notion who made a tool so good people shared it organically — no ads, just word-of-mouth
- A **developer experience lead** from Stripe who made it so easy to add new features that the platform grows itself

You are auditing what FEATURES and SYSTEMS the {{MODULE}} module is missing. The other audits checked: does it work? (mega), does it have enough content? (curriculum), does it teach well? (concept), is the implementation faithful? (implementation), can students practice? (practice). THIS audit asks: what SYSTEMS wrap around the learning experience to make it sticky, shareable, discoverable, and maintainable?

RULES:
R1. Use web search extensively — research what the best products in the world do for each layer.
R2. For each feature gap, estimate: effort, impact, and whether it needs backend or is frontend-only.
R3. Read the actual codebase to understand what infrastructure ALREADY exists that features could build on.
R4. Don't just list features — design them. For each recommendation, describe the exact user interaction.

=== LAYER 6: RETENTION — Do Students Come Back? ===

The hardest problem in education: students learn something, leave, and forget 80% within a week (Ebbinghaus forgetting curve). What systems prevent this?

--- 6A: Current State ---

Read the codebase. Does ANY of the following exist?

| Feature                                          | Exists? | Where? | Quality |
| ------------------------------------------------ | ------- | ------ | ------- |
| Spaced repetition (review after N days)          |         |        |         |
| Streak counter (consecutive days of use)         |         |        |         |
| Progress tracking (% complete, topics mastered)  |         |        |         |
| Review/recap mode ("what you learned this week") |         |        |         |
| Bookmarks / favorites (save for later)           |         |        |         |
| Learning history (what you've seen before)       |         |        |         |
| Flashcard generation (key facts per topic)       |         |        |         |
| Email/notification reminders ("come back!")      |         |        |         |
| Personalized "next up" recommendation            |         |        |         |
| Achievements / badges / milestones               |         |        |         |
| Skill tree / mastery map                         |         |        |         |
| Daily challenge / problem of the day             |         |        |         |

--- 6B: Research Best Retention Systems ---

Web search:

- "Duolingo retention mechanics how streaks work"
- "spaced repetition software design SRS algorithm"
- "how Anki spaced repetition works"
- "best retention features educational apps 2025 2026"
- "gamification learning retention research evidence"
- "how to make students come back daily" site:reddit.com
- "learning app retention strategies"
- "Ebbinghaus forgetting curve software solution"

For each source:
SOURCE: [URL]
MECHANIC: [what they do]
EVIDENCE: [does research show it works?]
ADAPTATION: [how we'd implement it for algorithm visualization]

--- 6C: Design Retention Features ---

For this specific module, design the TOP 5 retention features:

For each feature:

1. NAME: [feature name]
2. USER STORY: "As a [persona], I [action], so that [benefit]"
3. EXACT INTERACTION: Step-by-step what the user sees and does
4. SCIENCE: Why this works (cite research if possible)
5. EFFORT: S/M/L/XL and frontend-only or needs backend?
6. IMPACT: How much would this increase return-visit rate?
7. DEPENDENCIES: What needs to exist first? (user accounts? persistence?)

=== LAYER 7: COMMUNITY — Can Learners Help Each Other? ===

Learning is social. The best students learn from teaching others. What community features are missing?

--- 7A: Current State ---

| Feature                                                   | Exists? | Where? | Quality |
| --------------------------------------------------------- | ------- | ------ | ------- |
| Comments / discussion per topic                           |         |        |         |
| Share a visualization (link, embed)                       |         |        |         |
| Share a specific moment (step N of algorithm X on data Y) |         |        |         |
| User profiles with learning progress                      |         |        |         |
| Leaderboards (by topics completed, practice score)        |         |        |         |
| "Help" button (ask community a question)                  |         |        |         |
| User-contributed content (custom algorithms, examples)    |         |        |         |
| Collaborative mode (two users same visualization)         |         |        |         |
| Teaching mode (one user guides another)                   |         |        |         |
| Multiplayer challenges (race, compete)                    |         |        |         |
| Public collection/playlist of topics                      |         |        |         |
| Social proof ("42,000 students learned Quick Sort here")  |         |        |         |

--- 7B: Research Best Community Features ---

Web search:

- "educational platform community features design"
- "Stack Overflow gamification how reputation works"
- "GitHub social features that drive engagement"
- "Discord learning communities how they work"
- "Kaggle community features competitions"
- "LeetCode discuss how it increases engagement"
- "social learning platforms 2025 2026"
- "multiplayer learning games educational"
- "collaborative coding platforms features"

For each: what ONE principle can we steal?

--- 7C: Design Community Features ---

For this module, design the TOP 5 community features.
Same format as 6C (name, user story, interaction, science, effort, impact, dependencies).

Key question for each: does this need a backend/database, or can it work with just frontend + URL sharing?

=== LAYER 8: OPERATIONS — Can Creators Easily Add Content? ===

A platform is only as good as how fast it can grow. If adding a new algorithm takes 2 weeks of engineering, growth is bottlenecked. If it takes 2 hours, the platform grows itself.

--- 8A: Current State ---

Read the codebase to understand the "content creation pipeline":

| Question                                                                  | Answer | File/Evidence |
| ------------------------------------------------------------------------- | ------ | ------------- |
| How many files to add a new algorithm?                                    |        |               |
| Is there a template/boilerplate for new algorithms?                       |        |               |
| Is there documentation for content authors?                               |        |               |
| Could a non-engineer add content? (e.g., CS professor)                    |        |               |
| How long would it take an experienced dev to add a new sorting algorithm? |        |               |
| Is there a content preview/testing tool?                                  |        |               |
| Is content versioned? Can you roll back?                                  |        |               |
| Is there a style guide for step descriptions?                             |        |               |
| Is there a quality checklist for new content?                             |        |               |
| Is there automated testing for algorithm correctness?                     |        |               |

--- 8B: Research Best Content Operations ---

Web search:

- "how Brilliant.org creates educational content pipeline"
- "content management system for interactive education"
- "developer experience for content creators"
- "how to scale educational content creation"
- "documentation for contributing to open source educational projects"

--- 8C: Design Operations Improvements ---

Design features that make content creation 10x faster:

1. ALGORITHM TEMPLATE GENERATOR: CLI or UI tool that scaffolds all files for a new algorithm
   - What files should it create?
   - What boilerplate should be pre-filled?
   - What validation should it run?

2. CONTENT AUTHOR GUIDE: Documentation for adding new content
   - Step-by-step instructions
   - Naming conventions
   - Quality checklist
   - Example of a well-written algorithm

3. CONTENT TESTING TOOL: Automated verification
   - Does the algorithm produce correct output for test cases?
   - Do step descriptions match the step count?
   - Is complexity metadata consistent with implementation?
   - Do all visualization states appear in the legend?

4. CONTENT PREVIEW: Way to test new content before deploying
   - Hot-reload for algorithm files
   - Visual diff of step changes
   - Side-by-side comparison with existing algorithms

=== LAYER 9: DISCOVERY — Can People Find This? ===

The best product in the world is useless if nobody can find it.

--- 9A: Current State ---

Read the codebase for SEO and discoverability infrastructure:

| Feature                                                 | Exists? | Where? | Quality |
| ------------------------------------------------------- | ------- | ------ | ------- |
| Individual URLs per algorithm (/algorithms/bubble-sort) |         |        |         |
| Meta tags (title, description) per algorithm            |         |        |         |
| Open Graph tags for social sharing                      |         |        |         |
| Structured data (JSON-LD for educational content)       |         |        |         |
| Sitemap.xml including all algorithms                    |         |        |         |
| Canonical URLs                                          |         |        |         |
| Page speed optimized (Core Web Vitals)                  |         |        |         |
| Social sharing buttons                                  |         |        |         |
| Embeddable widget (use in blog posts)                   |         |        |         |
| "Share this visualization" with URL state               |         |        |         |
| Screenshot / GIF / video export for social media        |         |        |         |
| Landing pages for high-traffic keywords                 |         |        |         |

--- 9B: Research SEO for Educational Tools ---

Web search:

- "SEO for educational websites best practices 2025 2026"
- "how VisuAlgo ranks on Google"
- "structured data for educational content schema.org"
- "algorithm visualization" Google search — who ranks #1 and why?
- "how to rank for programming tutorials SEO"
- "social sharing features that drive organic growth"
- "embeddable interactive widget examples"
- "viral educational content what makes it spread"

For each top-ranking competitor:
COMPETITOR: [name]
RANKING FOR: [search term]
WHY THEY RANK: [specific SEO features]
WHAT WE CAN DO: [actionable improvement]

--- 9C: Design Discovery Features ---

1. URL STRATEGY: Every algorithm should have its own URL
   - /algorithms/sorting/bubble-sort
   - /algorithms/graph/dijkstra
   - URLs encode state: ?data=5,3,8,1&step=12

2. META TAGS: Each algorithm page needs:
   - Title: "Bubble Sort Visualization — Interactive Step-by-Step | Architex"
   - Description: "Watch Bubble Sort animate step-by-step on your data..."
   - Open Graph image: Auto-generated preview of the visualization

3. SHAREABILITY: Make sharing frictionless
   - "Share" button → copies URL with current state
   - "Export as GIF" → record animation for social media
   - "Embed" → iframe code for blog posts
   - Social cards that look beautiful on Twitter/LinkedIn

4. CONTENT MARKETING: Create high-traffic entry points
   - "Bubble Sort vs Quick Sort — Visual Comparison" → ranks for comparison searches
   - "How Dijkstra's Algorithm Works — Interactive Guide" → ranks for tutorial searches
   - "All Sorting Algorithms Compared" → ranks for overview searches

=== LAYER 10: INNOVATION — Never-Been-Done Features ===

Now the creative part. Use ALL of these techniques to generate ideas that NO ONE has built:

--- 10A: Persona-Based Discovery ---

Think from each person's life (not just their job). These are starting points — ADD MORE personas relevant to THIS module. For each: generate as many feature ideas as naturally emerge. No number cap.

Starting personas:

- CS Student cramming at 2am
- Interview candidate with sweaty palms
- Professor in a 200-seat lecture
- Bootcamp grad with imposter syndrome
- 12-year-old who closes the tab in 10 seconds
- Engineering manager explaining to their team
- Blind user with a screen reader
- Junior developer at their first job
- Senior developer who "knows" algorithms but never visualized them
- Competitive programmer (Codeforces/ICPC)
- Content creator (YouTube/blog/Twitter)
- Mobile-only user on a bus
- Someone with ADHD who can't sit through 10 minutes
- Parent helping their kid with homework
- Non-English speaker
- A designer who thinks visually, not in code

Add YOUR OWN personas specific to THIS module.

--- 10B: Web Research ---

DO NOT rely on training data. Search the internet:

Reddit: "algorithm visualizer" site:reddit.com, "I wish there was a tool" algorithms site:reddit.com
Twitter: "algorithm visualizer" — what gets shared?
YouTube: best algorithm tutorial channels — what do COMMENTS say?
Medium/Dev.to: "best algorithm tools compared"
GitHub: top starred algorithm repos → their Issues tab → what users request
Product Hunt: recent edtech launches
Stack Overflow: most viewed algorithm questions
Hacker News: "Show HN" algorithm tools

For each: SOURCE → KEY INSIGHT → FEATURE IMPLICATION

--- 10C: Competitive Intelligence ---

Adjacent inspiration (steal principles, not features):
Duolingo, Chrome Music Lab, VS Code debugger, Desmos, TikTok, Kahoot, 3Blue1Brown, Rubik's cube solvers, Spotify Wrapped, GitHub Copilot

--- 10D: Sensory Thinking ---

SIGHT, SOUND, TOUCH, TIME, NARRATIVE, EMOTION, SOCIAL, CREATIVE
For each: what's ONE thing no tool has done yet?

--- 10E: Never-Been-Done Ideas ---

TECHNIQUE 1 — INVERT THE RELATIONSHIP
"What if the USER teaches the TOOL?" "What if the output is the input?"
Generate as many inversions as you can.

TECHNIQUE 2 — ABSURD COMBINATIONS
Algorithm + Cooking, Sorting + Music, Graph + City exploration
Generate as many as you can until at least 2 make you think "that's actually brilliant."

TECHNIQUE 3 — TECHNOLOGY PUSH
What's possible NOW with WebGPU, Web Audio, WebXR, SharedArrayBuffer, AI/LLM, WebRTC, MediaRecorder, View Transitions API?
Generate as many as you can.

TECHNIQUE 4 — CROSS-DOMAIN TRANSFER
How do musicians learn scales? How do chefs learn knife skills? How do athletes train?
Generate as many as you can.

TECHNIQUE 5 — EMOTIONAL EXTREMES
What would make someone CRY, LAUGH, GASP, SHARE, RETURN, feel PROUD?
Generate as many as you can per emotion.

TECHNIQUE 6 — FIRST IN THE WORLD
"What can we build that NO ONE has ever built?" Be bold.
Generate as many as you can.

Collect ALL ideas into one master list.

--- 10F: Convergence ---

For every idea, three-gate filter:

1. Can I describe the exact interaction in ONE sentence? (No = too vague, cut)
2. Frontend-only or needs backend? (Frontend = ships faster)
3. Self-discoverable without instructions? (Yes = higher adoption)

Pass all 3 = HIGH CONVICTION.

--- 10G: Team Validation (use parallel agents if available) ---

Take the top 15 HIGH CONVICTION ideas. Run through 3 lenses:

AGENT 1 — "The Skeptic"
What could go WRONG? Is this "cool for 30 seconds" or genuinely useful?
Kill ideas that fail the skeptic test.

AGENT 2 — "The User Researcher"
Describe exact user journey. Where would a confused user give up?
Rewrite each idea with a concrete user story.

AGENT 3 — "The Engineer"
What's the MVP? Biggest tech risk? Can it reuse existing code?
Size each honestly.

Output:
| # | Feature | Layer | Skeptic | User Story | MVP Effort | Final Priority |

Only features surviving ALL three lenses become tasks.

=== GENERATE TASKS ===

Create: docs/tasks/batch-{{EPIC_LOWERCASE}}-features.json

Task categories by layer:

- RETENTION: "Add streak counter", "Add spaced repetition", "Add daily challenge"
- COMMUNITY: "Add share button with URL state", "Add multiplayer race mode"
- OPERATIONS: "Create algorithm template generator CLI", "Write content author guide"
- DISCOVERY: "Add individual URLs per algorithm", "Add Open Graph meta tags", "Add export as GIF"
- INNOVATION: "Add sonification", "Add prediction mode", "Add algorithm race", etc.

Priority:

- P1: High-impact features validated by all 3 agents
- P2: Medium-impact or needs backend infrastructure
- P3: Dream features, long-term vision

Also update: taskCount in tasks.json, BATCH_FILES in board-index.html.

=== SUMMARY ===

## Layer Scores

| Layer          | Current Score (0-10) | Target | Biggest Gap |
| -------------- | -------------------- | ------ | ----------- |
| 6. Retention   |                      | 8      |             |
| 7. Community   |                      | 7      |             |
| 8. Operations  |                      | 8      |             |
| 9. Discovery   |                      | 9      |             |
| 10. Innovation |                      | 9      |             |

## Feature Count by Layer

| Layer      | Features Designed | P1  | P2  | P3  |
| ---------- | ----------------- | --- | --- | --- |
| Retention  |                   |     |     |     |
| Community  |                   |     |     |     |
| Operations |                   |     |     |     |
| Discovery  |                   |     |     |     |
| Innovation |                   |     |     |     |
| Total      |                   |     |     |     |

## Top 5 "Ship This Week" Features

(Small effort, massive impact — validated by all 3 agents)

## Top 5 "Ship This Month" Features

(Medium effort, defining features)

## Top 3 "First In The World" Features

(Bold bets that no one has built)

## The ONE Feature That Changes Everything

If you could only build ONE feature from this entire audit, which one
would transform the module from "a tool" to "a product people love"?
