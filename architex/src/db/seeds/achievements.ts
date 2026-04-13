/**
 * Achievement definitions seed.
 *
 * Seeds 30 achievement definitions across 5 categories.
 * User unlock state is tracked separately in user_achievements.
 */

import type { Database } from "@/db";
import { achievements } from "@/db/schema/achievements";
import type { NewAchievement } from "@/db/schema/achievements";

const DEFINITIONS: Omit<NewAchievement, "id" | "createdAt">[] = [
  // ── Learning milestones ──────────────────────────────────
  { slug: "first-visualization", name: "First Steps", description: "Run your first algorithm visualization", category: "learning", icon: "Play", color: "#22c55e", xpReward: 10, sortOrder: 0 },
  { slug: "five-algorithms", name: "Getting Warmed Up", description: "Visualize 5 different algorithms", category: "learning", icon: "Zap", color: "#22c55e", xpReward: 25, sortOrder: 1 },
  { slug: "ten-algorithms", name: "Algorithm Explorer", description: "Visualize 10 different algorithms", category: "learning", icon: "Compass", color: "#3b82f6", xpReward: 50, sortOrder: 2 },
  { slug: "all-sorting", name: "Sort Master", description: "Visualize all sorting algorithms", category: "learning", icon: "ArrowUpDown", color: "#8b5cf6", xpReward: 100, sortOrder: 3 },
  { slug: "all-graph", name: "Graph Theorist", description: "Visualize all graph algorithms", category: "learning", icon: "Share2", color: "#8b5cf6", xpReward: 100, sortOrder: 4 },
  { slug: "three-modules", name: "Multi-Disciplinary", description: "Study content in 3 different modules", category: "learning", icon: "Layers", color: "#3b82f6", xpReward: 50, sortOrder: 5 },
  { slug: "all-modules", name: "Renaissance Engineer", description: "Study content in all 13 modules", category: "learning", icon: "Crown", color: "#f59e0b", xpReward: 500, sortOrder: 6 },

  // ── Streak achievements ──────────────────────────────────
  { slug: "streak-3", name: "Hat Trick", description: "Maintain a 3-day learning streak", category: "streak", icon: "Flame", color: "#ef4444", xpReward: 25, sortOrder: 0 },
  { slug: "streak-7", name: "Week Warrior", description: "Maintain a 7-day learning streak", category: "streak", icon: "Flame", color: "#ef4444", xpReward: 75, sortOrder: 1 },
  { slug: "streak-30", name: "Monthly Marathoner", description: "Maintain a 30-day learning streak", category: "streak", icon: "Flame", color: "#f59e0b", xpReward: 200, sortOrder: 2 },
  { slug: "streak-100", name: "Century Club", description: "Maintain a 100-day learning streak", category: "streak", icon: "Trophy", color: "#f59e0b", xpReward: 1000, sortOrder: 3 },
  { slug: "weekend-warrior", name: "Weekend Warrior", description: "Study on both Saturday and Sunday", category: "streak", icon: "Calendar", color: "#22c55e", xpReward: 30, sortOrder: 4 },

  // ── Challenge achievements ───────────────────────────────
  { slug: "first-challenge", name: "Challenge Accepted", description: "Complete your first interview challenge", category: "challenge", icon: "Target", color: "#3b82f6", xpReward: 25, sortOrder: 0 },
  { slug: "perfect-score", name: "Flawless", description: "Score 100% on any challenge", category: "challenge", icon: "Star", color: "#f59e0b", xpReward: 100, sortOrder: 1 },
  { slug: "five-challenges", name: "Challenge Seeker", description: "Complete 5 interview challenges", category: "challenge", icon: "Swords", color: "#3b82f6", xpReward: 75, sortOrder: 2 },
  { slug: "no-hints", name: "No Help Needed", description: "Complete a challenge without using any hints", category: "challenge", icon: "Shield", color: "#8b5cf6", xpReward: 50, sortOrder: 3 },
  { slug: "speed-demon", name: "Speed Demon", description: "Complete a challenge in under 15 minutes", category: "challenge", icon: "Timer", color: "#ef4444", xpReward: 75, sortOrder: 4 },
  { slug: "daily-challenge-5", name: "Daily Devotee", description: "Complete 5 daily challenges", category: "challenge", icon: "Sunrise", color: "#22c55e", xpReward: 50, sortOrder: 5 },

  // ── Mastery achievements ─────────────────────────────────
  { slug: "mastery-beginner", name: "Apprentice", description: "Reach 25% mastery in any module", category: "mastery", icon: "BookOpen", color: "#22c55e", xpReward: 25, sortOrder: 0 },
  { slug: "mastery-intermediate", name: "Journeyman", description: "Reach 50% mastery in any module", category: "mastery", icon: "GraduationCap", color: "#3b82f6", xpReward: 75, sortOrder: 1 },
  { slug: "mastery-advanced", name: "Expert", description: "Reach 75% mastery in any module", category: "mastery", icon: "Award", color: "#8b5cf6", xpReward: 150, sortOrder: 2 },
  { slug: "mastery-complete", name: "Grand Master", description: "Reach 100% mastery in any module", category: "mastery", icon: "Crown", color: "#f59e0b", xpReward: 500, sortOrder: 3 },
  { slug: "mastery-all-50", name: "Well-Rounded", description: "Reach 50% mastery in all 13 modules", category: "mastery", icon: "Globe", color: "#f59e0b", xpReward: 1000, sortOrder: 4 },

  // ── Social achievements ──────────────────────────────────
  { slug: "first-design", name: "Architect", description: "Save your first system design diagram", category: "social", icon: "PenTool", color: "#3b82f6", xpReward: 15, sortOrder: 0 },
  { slug: "first-share", name: "Sharing is Caring", description: "Share a diagram publicly", category: "social", icon: "Share", color: "#22c55e", xpReward: 25, sortOrder: 1 },
  { slug: "first-fork", name: "Fork Yeah", description: "Fork someone else's design", category: "social", icon: "GitFork", color: "#22c55e", xpReward: 20, sortOrder: 2 },
  { slug: "ten-upvotes", name: "Community Star", description: "Receive 10 upvotes on a shared design", category: "social", icon: "ThumbsUp", color: "#8b5cf6", xpReward: 100, sortOrder: 3 },
  { slug: "gallery-featured", name: "Featured Designer", description: "Get featured in the template gallery", category: "social", icon: "Sparkles", color: "#f59e0b", xpReward: 250, sortOrder: 4 },
  { slug: "xp-1000", name: "XP Thousandaire", description: "Earn 1,000 total XP", category: "social", icon: "TrendingUp", color: "#3b82f6", xpReward: 0, sortOrder: 5 },
  { slug: "xp-10000", name: "XP Legend", description: "Earn 10,000 total XP", category: "social", icon: "Gem", color: "#f59e0b", xpReward: 0, sortOrder: 6 },
];

export async function seed(db: Database) {
  console.log(`    Upserting ${DEFINITIONS.length} achievement definitions...`);

  // Upsert in one batch (30 items fits easily)
  for (const def of DEFINITIONS) {
    await db
      .insert(achievements)
      .values(def)
      .onConflictDoUpdate({
        target: achievements.slug,
        set: {
          name: def.name,
          description: def.description,
          category: def.category,
          icon: def.icon,
          color: def.color,
          xpReward: def.xpReward,
          sortOrder: def.sortOrder,
          isActive: def.isActive ?? true,
        },
      });
  }

  console.log(`    ✓ ${DEFINITIONS.length} achievements upserted`);
}
