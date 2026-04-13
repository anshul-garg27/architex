# Interview Platforms & Gamification Research

> "System design interview prep is where coding interview prep was 10 years ago."

---

## INTERVIEW PLATFORMS

### interviewing.io
- Anonymous mock interviews with FAANG engineers. $100-225/session.
- **Missing:** No diagramming, no async practice, expensive

### Pramp
- Free peer-to-peer mocks. Reciprocal model.
- **Missing:** Inconsistent quality, primitive whiteboard

### Exponent
- Video courses + company-specific guides + peer mocks.
- **Missing:** No interactive diagramming, passive (video-watching)

### Hello Interview
- AI scoring on system design. Rubric-based evaluation.
- **Missing:** Text-based (no real whiteboard), AI can be generic

### DesignGurus.io
- "Grokking" series (industry-standard). 60+ case studies. $349/yr.
- **Missing:** No mock interviews, no AI, no collaboration

### ByteByteGo
- Best visual explanations ever (Alex Xu). Books + videos + newsletter.
- **Missing:** Consumption-only. No interactivity, no practice.

### Codemia.io
- 120+ system design problems. Iterative AI feedback (design→score→refine).
- **Closest to "LeetCode for system design."**
- **Missing:** No visualization, no diagramming canvas

---

## GAMIFICATION IN ENGINEERING EDUCATION

### What Works (from LeetCode, HackerRank, Codecademy, Duolingo):
- Streak systems → daily engagement
- Leaderboards → competitive motivation
- Badges/achievements → milestone markers
- Progressive difficulty → appropriate challenge

### What's Missing:
- **No gamification for system design** (only for coding)
- **No team-based challenges**
- **No simulation-based challenges** (design system that handles X load)
- **No narrative/story-driven learning**

---

## SPACED REPETITION (FSRS Algorithm)

- FSRS (Free Spaced Repetition Scheduler) > SM-2 (SuperMemo)
- Used in Anki. Calculates optimal review intervals.
- **GAP:** No SRS for system design concepts. No visual/diagrammatic flashcards.

---

## COLLABORATION TOOLS

### Real-Time Whiteboard
- Excalidraw (open-source, hand-drawn, E2E encrypted collab)
- tldraw (open-source, similar, extensible)

### CRDT Libraries for Collaboration
| Feature | Yjs | Automerge | Liveblocks |
|---|---|---|---|
| Type | Open-source CRDT | Open-source CRDT | Managed SaaS |
| Performance | Fastest | Improving | Good |
| Offline | Yes (y-indexeddb) | Yes | Limited |
| React Flow integration | Synergy Codes e-book | Generic | React hooks |

### Recommendation: Yjs + y-webrtc (P2P, no server needed for 2-20 users)

---

## THE MASSIVE GAPS

1. **No unified platform** combining whiteboard + simulation + AI scoring + practice
2. **No LeetCode-equivalent for system design** (Codemia is closest)
3. **No spaced repetition for architectural concepts**
4. **No collaborative system design practice** with AI interviewer
5. **No progressive difficulty** scaffolding (100 users → 1M → 1B)
6. **No gamification for system design** (only for coding)
7. **No "design simulation"** where you see your architecture handle load

### What "Better Than All" Looks Like:
| Feature | Current Best | Opportunity |
|---|---|---|
| Content | ByteByteGo | Match quality + add interactivity |
| Practice | Codemia (AI) | Real whiteboard + AI + rubric |
| Mocks | interviewing.io | AI + peer + recorded playback |
| Whiteboard | Excalidraw | + component library + AI analysis |
| Gamification | LeetCode (coding) | First for system design |
| SRS | Nothing | First for architecture concepts |
| Simulation | Nothing | "Run" design against load |
