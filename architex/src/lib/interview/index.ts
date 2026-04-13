// ── Interview engine barrel export ─────────────────────────────────

export {
  type ScoringDimension,
  SCORING_DIMENSIONS,
  calculateOverallScore,
  getScoreLabel,
  generateFeedback,
} from './scoring';

export {
  type ReviewCard,
  type Rating,
  scheduleReview,
  getDueCards,
  createCard,
  getRetentionStats,
} from './srs';

export {
  type ChallengeDefinition,
  CHALLENGES,
  getChallengeById,
  getChallengesByDifficulty,
  getChallengesByCategory,
} from './challenges';

export {
  type Achievement,
  type AchievementRarity,
  type UserStats,
  ACHIEVEMENTS,
  checkAchievements,
  getAchievementProgress,
  calculateLevel,
  getStreakStatus,
} from './achievements';

export {
  type DailyChallenge,
  getDailyChallenge,
  getPastChallenges,
  msUntilNextChallenge,
} from './daily-challenge';

export {
  type LeaderboardEntry,
  type LeaderboardBadge,
  type LeaderboardPeriod,
  generateMockLeaderboard,
  calculateRank,
  getLeaderboardSlice,
  insertUserIntoLeaderboard,
} from './leaderboard';

export {
  type DifficultyLevel,
  type PerformanceRecord,
  type UserAssessment,
  assessUserLevel,
  selectNextChallenge,
  getDifficultyLabel,
  numericToDifficultyLevel,
} from './difficulty-scaling';

export {
  type LLDChallengeDefinition,
  LLD_CHALLENGES,
  getLLDChallengeById,
  getLLDChallengesByDifficulty,
  getAllLLDPatterns,
} from './lld-challenges';

export {
  type LLDChallengeTemplate,
  LLD_CHALLENGE_TEMPLATES,
  getTemplateForChallenge,
} from './challenge-templates';

