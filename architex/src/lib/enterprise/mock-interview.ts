// ─────────────────────────────────────────────────────────────
// Architex — Mock Interview Pairing Engine
// ─────────────────────────────────────────────────────────────
//
// Pair users for mock system-design interviews. One user takes
// the interviewer role (guided by a structured InterviewerGuide),
// the other acts as the candidate. At the end the interviewer
// fills a rubric and the engine produces structured feedback.
//
// Public API:
//   createMockSession(challenge, role)  → MockInterviewSession
//   generateFeedback(session, scores)   → InterviewFeedback
//   INTERVIEWER_GUIDES                  → 5 pre-built guides
//   getGuideForChallenge(id)            → guide | undefined
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Role within a mock interview session. */
export type InterviewRole = 'interviewer' | 'candidate';

/** Status of a mock interview session. */
export type SessionStatus = 'waiting' | 'active' | 'feedback' | 'completed';

/** A phase within the interviewer guide. */
export interface InterviewPhase {
  /** Phase name (e.g. "Requirements Gathering"). */
  name: string;
  /** Suggested duration in minutes. */
  durationMinutes: number;
  /** Talking points / prompts for the interviewer. */
  prompts: string[];
}

/** Scoring category in the rubric. */
export interface RubricCategory {
  id: string;
  label: string;
  description: string;
  /** Maximum score for this category. */
  maxScore: number;
}

/** The interviewer's guide for running a mock interview. */
export interface InterviewerGuide {
  /** Challenge ID this guide targets. */
  challengeId: string;
  /** Human-readable title. */
  title: string;
  /** Ordered phases the interview should follow. */
  phases: InterviewPhase[];
  /** Progressive hints the interviewer can reveal. */
  hints: string[];
  /** Scoring rubric categories. */
  scoringRubric: RubricCategory[];
}

/** Challenge definition for a mock interview. */
export interface MockChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/** An active mock interview session. */
export interface MockInterviewSession {
  id: string;
  interviewerId: string;
  candidateId: string;
  challengeId: string;
  challenge: MockChallenge;
  role: InterviewRole;
  /** Time limit in minutes. */
  timeLimit: number;
  status: SessionStatus;
  startedAt: number;
  guide: InterviewerGuide | null;
  feedback: InterviewFeedback | null;
}

/** A score for a single rubric category. */
export interface RubricScore {
  categoryId: string;
  score: number;
}

/** Strength / area for improvement identified in feedback. */
export interface FeedbackPoint {
  area: string;
  comment: string;
}

/** Structured feedback generated after the session. */
export interface InterviewFeedback {
  sessionId: string;
  overallScore: number;
  maxPossibleScore: number;
  percentage: number;
  verdict: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire';
  rubricBreakdown: { categoryId: string; label: string; score: number; maxScore: number }[];
  strengths: FeedbackPoint[];
  improvements: FeedbackPoint[];
  summary: string;
}

// ── Default rubric ──────────────────────────────────────────

/** Standard rubric used across all guides. */
const STANDARD_RUBRIC: RubricCategory[] = [
  { id: 'requirements',  label: 'Requirements Gathering',   description: 'Clarified scope, asked good questions, identified constraints.',       maxScore: 20 },
  { id: 'hld',           label: 'High-Level Design',        description: 'Proposed clear architecture with appropriate components.',             maxScore: 25 },
  { id: 'deep-dive',     label: 'Deep Dive',                description: 'Explored at least one subsystem in depth with trade-off analysis.',    maxScore: 25 },
  { id: 'scalability',   label: 'Scalability & Bottlenecks', description: 'Identified bottlenecks and proposed scaling strategies.',             maxScore: 15 },
  { id: 'communication', label: 'Communication',            description: 'Explained thinking clearly, used diagrams effectively.',              maxScore: 15 },
];

// ── Pre-built interviewer guides ────────────────────────────

/** Standard interview phases shared across guides. */
function standardPhases(deepDiveTopic: string): InterviewPhase[] {
  return [
    {
      name: 'Requirements Gathering',
      durationMinutes: 5,
      prompts: [
        'What are the core use cases?',
        'What scale are we targeting (users, QPS, data size)?',
        'Any specific non-functional requirements?',
      ],
    },
    {
      name: 'High-Level Design',
      durationMinutes: 15,
      prompts: [
        'Walk me through the main components.',
        'How do they interact?',
        'What APIs would you expose?',
      ],
    },
    {
      name: 'Deep Dive',
      durationMinutes: 15,
      prompts: [
        `Let's dig into ${deepDiveTopic}.`,
        'What are the trade-offs of your approach?',
        'How would you handle failure scenarios?',
      ],
    },
    {
      name: 'Scalability & Wrap-Up',
      durationMinutes: 10,
      prompts: [
        'How would this scale to 10x traffic?',
        'What are the main bottlenecks?',
        'Anything you would change with more time?',
      ],
    },
  ];
}

export const INTERVIEWER_GUIDES: InterviewerGuide[] = [
  {
    challengeId: 'url-shortener',
    title: 'URL Shortener Interview Guide',
    phases: standardPhases('the URL generation and collision strategy'),
    hints: [
      'Consider base62 encoding for short URLs.',
      'Think about a counter-based vs hash-based approach.',
      'Caching hot URLs with TTL can reduce DB load.',
      'Range-based ID allocation eliminates single-writer bottleneck.',
    ],
    scoringRubric: STANDARD_RUBRIC,
  },
  {
    challengeId: 'rate-limiter',
    title: 'Rate Limiter Interview Guide',
    phases: standardPhases('the rate-limiting algorithm choice (token bucket vs sliding window)'),
    hints: [
      'Token bucket is simple; sliding window log is more precise.',
      'Distributed rate limiting needs a shared store like Redis.',
      'Consider how to handle race conditions with atomic ops.',
      'Fixed-window has burst issues at boundaries — sliding window fixes this.',
    ],
    scoringRubric: STANDARD_RUBRIC,
  },
  {
    challengeId: 'notification-system',
    title: 'Notification System Interview Guide',
    phases: standardPhases('the delivery pipeline and retry logic'),
    hints: [
      'Separate ingestion from delivery with a message queue.',
      'Priority queues let urgent notifications jump ahead.',
      'Idempotency keys prevent duplicate deliveries.',
      'Fan-out: think about push vs pull for different channels.',
    ],
    scoringRubric: STANDARD_RUBRIC,
  },
  {
    challengeId: 'chat-system',
    title: 'Chat System Interview Guide',
    phases: standardPhases('message delivery and online presence'),
    hints: [
      'WebSockets for real-time; long-polling as fallback.',
      'Message ordering: per-channel sequence numbers.',
      'Presence: heartbeat with expiry in Redis.',
      'Group chats: fan-out on write vs fan-out on read.',
    ],
    scoringRubric: STANDARD_RUBRIC,
  },
  {
    challengeId: 'news-feed',
    title: 'News Feed Interview Guide',
    phases: standardPhases('the feed generation strategy (fan-out on write vs read)'),
    hints: [
      'Fan-out on write pre-computes feeds — great for read-heavy.',
      'Celebrities cause hot-key issues with fan-out on write.',
      'Hybrid: fan-out on write for normal users, pull for celebrities.',
      'Ranking: time-decay + engagement signals.',
    ],
    scoringRubric: STANDARD_RUBRIC,
  },
];

/** O(1) guide lookup. */
const guideMap = new Map(
  INTERVIEWER_GUIDES.map((g) => [g.challengeId, g]),
);

/** Get the interviewer guide for a specific challenge ID. */
export function getGuideForChallenge(
  challengeId: string,
): InterviewerGuide | undefined {
  return guideMap.get(challengeId);
}

// ── Session management ──────────────────────────────────────

let sessionCounter = 0;

/**
 * Create a new mock interview session.
 *
 * @param challenge  The challenge to interview on.
 * @param role       The role of the creating user.
 * @param options    Optional overrides for interviewerId, candidateId, timeLimit.
 * @returns A fresh MockInterviewSession.
 */
export function createMockSession(
  challenge: MockChallenge,
  role: InterviewRole,
  options: {
    interviewerId?: string;
    candidateId?: string;
    timeLimit?: number;
  } = {},
): MockInterviewSession {
  sessionCounter += 1;
  const interviewerId = options.interviewerId ?? (role === 'interviewer' ? 'self' : 'peer');
  const candidateId = options.candidateId ?? (role === 'candidate' ? 'self' : 'peer');

  return {
    id: `mock-${sessionCounter}-${Date.now()}`,
    interviewerId,
    candidateId,
    challengeId: challenge.id,
    challenge,
    role,
    timeLimit: options.timeLimit ?? 45,
    status: 'waiting',
    startedAt: 0,
    guide: getGuideForChallenge(challenge.id) ?? null,
    feedback: null,
  };
}

/** Start the session (returns a new session object). */
export function startSession(
  session: MockInterviewSession,
): MockInterviewSession {
  return {
    ...session,
    status: 'active',
    startedAt: Date.now(),
  };
}

/** Move the session to the feedback phase. */
export function moveToFeedback(
  session: MockInterviewSession,
): MockInterviewSession {
  return {
    ...session,
    status: 'feedback',
  };
}

// ── Feedback generation ─────────────────────────────────────

/**
 * Map a percentage score to a hiring verdict.
 */
function getVerdict(percentage: number): InterviewFeedback['verdict'] {
  if (percentage >= 85) return 'Strong Hire';
  if (percentage >= 70) return 'Hire';
  if (percentage >= 50) return 'Lean Hire';
  return 'No Hire';
}

/**
 * Identify strengths — categories where the candidate scored >= 75%.
 */
function identifyStrengths(
  rubricBreakdown: InterviewFeedback['rubricBreakdown'],
): FeedbackPoint[] {
  return rubricBreakdown
    .filter((r) => r.maxScore > 0 && r.score / r.maxScore >= 0.75)
    .map((r) => ({
      area: r.label,
      comment: `Scored ${r.score}/${r.maxScore} — demonstrated solid understanding.`,
    }));
}

/**
 * Identify areas for improvement — categories where the candidate scored < 50%.
 */
function identifyImprovements(
  rubricBreakdown: InterviewFeedback['rubricBreakdown'],
): FeedbackPoint[] {
  return rubricBreakdown
    .filter((r) => r.maxScore > 0 && r.score / r.maxScore < 0.5)
    .map((r) => ({
      area: r.label,
      comment: `Scored ${r.score}/${r.maxScore} — needs more depth and practice.`,
    }));
}

/**
 * Generate structured feedback from rubric scores.
 *
 * @param session       The mock interview session.
 * @param rubricScores  Scores for each rubric category.
 * @returns A complete InterviewFeedback object.
 */
export function generateFeedback(
  session: MockInterviewSession,
  rubricScores: RubricScore[],
): InterviewFeedback {
  const rubric = session.guide?.scoringRubric ?? STANDARD_RUBRIC;

  const rubricBreakdown = rubric.map((cat) => {
    const scored = rubricScores.find((s) => s.categoryId === cat.id);
    const score = Math.min(cat.maxScore, Math.max(0, scored?.score ?? 0));
    return {
      categoryId: cat.id,
      label: cat.label,
      score,
      maxScore: cat.maxScore,
    };
  });

  const overallScore = rubricBreakdown.reduce((sum, r) => sum + r.score, 0);
  const maxPossibleScore = rubricBreakdown.reduce((sum, r) => sum + r.maxScore, 0);
  const percentage = maxPossibleScore > 0
    ? Math.round((overallScore / maxPossibleScore) * 100)
    : 0;

  const strengths = identifyStrengths(rubricBreakdown);
  const improvements = identifyImprovements(rubricBreakdown);

  const verdict = getVerdict(percentage);

  const summary =
    strengths.length > 0 && improvements.length > 0
      ? `Candidate showed strength in ${strengths.map((s) => s.area).join(', ')} but should improve on ${improvements.map((i) => i.area).join(', ')}.`
      : strengths.length > 0
        ? `Strong performance across ${strengths.map((s) => s.area).join(', ')}.`
        : improvements.length > 0
          ? `Needs significant improvement in ${improvements.map((i) => i.area).join(', ')}.`
          : 'Average performance across all categories.';

  const feedback: InterviewFeedback = {
    sessionId: session.id,
    overallScore,
    maxPossibleScore,
    percentage,
    verdict,
    rubricBreakdown,
    strengths,
    improvements,
    summary,
  };

  return feedback;
}

/**
 * Complete the session with the generated feedback.
 */
export function completeSession(
  session: MockInterviewSession,
  feedback: InterviewFeedback,
): MockInterviewSession {
  return {
    ...session,
    status: 'completed',
    feedback,
  };
}
