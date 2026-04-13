# Analytics, Email & Notification System

---

## ANALYTICS: PostHog (Recommended)

### Why PostHog
- Self-hostable (privacy), free to 1M events/mo
- Built-in session replay + feature flags
- `posthog-js` + `posthog-node` for Next.js

### Event Taxonomy
```
AUTH: user_signed_up, user_logged_in, onboarding_completed
DIAGRAM: diagram_created, diagram_saved, diagram_exported, diagram_shared, diagram_template_used
SIMULATION: simulation_started, simulation_completed, simulation_speed_changed
CHALLENGE: challenge_started, challenge_hint_used, challenge_submitted, challenge_completed
CONCEPT: concept_viewed, concept_review_completed, concept_marked_mastered
BILLING: pricing_page_viewed, checkout_started, subscription_created
ENGAGEMENT: search_performed, streak_achieved, badge_earned
```

### Key Funnels
```
Landing → Sign Up (15%) → Onboarding (80%) → First Diagram (60%) → First Simulation (50%) → First Challenge (40%) → Return D1 (30%)
```

### Retention Targets
| Metric | Target |
|---|---|
| D1 Retention | 40% |
| D7 Retention | 25% |
| D30 Retention | 15% |
| Learning Streak (avg) | 3.5 days |

---

## EMAIL: Resend + react-email + Inngest

### Stack
- **Resend** — transactional email ($20/mo for 50K)
- **react-email** — React components for email templates
- **Inngest** — background jobs, drip scheduling, cron

### Welcome Sequence (5 emails, 7 days)
| Day | Subject | Goal |
|---|---|---|
| 0 | "Welcome — let's build something" | Activate → first diagram |
| 1 | "Draw your first system design in 3 min" | Show editor value |
| 3 | "Watch consistent hashing in real time" | Introduce simulations |
| 5 | "Can you design a URL shortener? (5 min)" | Introduce challenges |
| 7 | "Your Week 1: here's what you learned" | Reinforce progress |

**Adaptive:** Skip emails when user already completed the action.

### Weekly Digest (Every Monday 9am UTC)
- Stats grid: diagrams, simulations, challenges, streak
- Recommended next challenge
- Concepts due for spaced repetition review
- Link to full dashboard

### Spaced Repetition Reminders
| Interval | Subject |
|---|---|
| 1 day | "Quick review: {concept} (2 min)" |
| 3 days | "Reinforce: {concept} before you forget" |
| 7 days | "Still remember {concept}?" |
| 14 days | "Final check: {concept}" |

### Re-engagement
| Trigger | Subject |
|---|---|
| 7d inactive | "We saved your progress on {last_topic}" |
| 14d inactive | "3 new challenges added: {topics}" |
| 30d inactive | "Your streak was {n} days — restart it?" |

---

## NOTIFICATIONS

### Channel Matrix
| Notification | In-App | Email | Push |
|---|---|---|---|
| Challenge completed | ✓ | | |
| Achievement earned | ✓ | ✓ | ✓ |
| Streak milestone | ✓ | ✓ | opt |
| SRS review due | ✓ | ✓ | opt |
| Weekly digest | | ✓ | |
| Comment on diagram | ✓ | ✓ | opt |
| Re-engagement | | ✓ | opt |
| Streak at risk | | | ✓ |

### Anti-Spam Rate Limits
```
Daily: in_app=20, email=3, push=5
Cooldown: achievement=1h, srs=4h, streak=24h, re-engagement=7d
Quiet hours: 10pm-8am (user timezone)
```

### User Preference Controls
Per-category, per-channel toggles:
- Learning reminders (in-app, email, push)
- Achievements (in-app, email, push)
- Weekly digest (email only)
- Social (in-app, email, push)
- Product updates (in-app, email)
- Re-engagement (email, push)

### In-App Notification Center
- Bell icon with unread badge
- Popover with scrollable list
- Mark read on click, mark all read button
- Link to notification settings
- Poll every 30s (or WebSocket for real-time)

### Push: Web Push API + `web-push` npm package
- VAPID keys for authentication
- Auto-remove expired subscriptions (410 status)

---

## PACKAGES

| Package | Purpose |
|---|---|
| `posthog-js` | Client analytics |
| `posthog-node` | Server analytics |
| `resend` | Email sending |
| `@react-email/components` | Email templates |
| `inngest` | Background jobs, drip, cron |
| `web-push` | Push notifications |
