// ─────────────────────────────────────────────────────────────
// Architex — Enterprise Type Definitions
// ─────────────────────────────────────────────────────────────

/** Role a member can hold within a workspace. */
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

/** Billing plan tier for a workspace. */
export type WorkspacePlan = 'free' | 'team' | 'enterprise';

/** Skill proficiency level derived from score thresholds. */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/** Interview readiness verdict. */
export type ReadinessVerdict = 'Ready' | 'Almost Ready' | 'Needs Practice';

// ── Workspace ─────────────────────────────────────────────────

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  joinedAt: string; // ISO date
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: WorkspaceMember[];
  plan: WorkspacePlan;
  createdAt: string; // ISO date
}

// ── Learning Paths ────────────────────────────────────────────

export interface PathModule {
  moduleId: string;
  order: number;
  required: boolean;
  estimatedMinutes: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  modules: PathModule[];
  createdBy: string;
}

// ── Skill Assessment ──────────────────────────────────────────

export interface SkillScore {
  skill: string;
  score: number; // 0-100
  level: SkillLevel;
}

export interface SkillAssessment {
  userId: string;
  skills: SkillScore[];
  overallReadiness: ReadinessVerdict;
  assessedAt: string; // ISO date
}

// ── History inputs for assessment ─────────────────────────────

export interface ChallengeRecord {
  challengeId: string;
  category: string;
  score: number; // 0-100
  completedAt: string; // ISO date
}

export interface ModuleRecord {
  moduleId: string;
  category: string;
  completionPercent: number; // 0-100
  timeSpentMinutes: number;
}
