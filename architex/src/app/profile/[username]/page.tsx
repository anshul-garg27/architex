'use client';

// ─────────────────────────────────────────────────────────────
// Architex — COL-013 Public Profile Page
// ─────────────────────────────────────────────────────────────
//
// Mock profile page with: avatar, username, bio, stats,
// published designs grid, activity heatmap, and achievement badges.

import { useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'motion/react';
import {
  User,
  Heart,
  Boxes,
  Trophy,
  Flame,
  ArrowLeft,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { duration, easing, getStaggerDelay, slideUp } from '@/lib/constants/motion';

// ── Mock Data ─────────────────────────────────────────────────

interface MockDesign {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  nodeCount: number;
  createdAt: string;
  thumbnailGradient: string;
}

interface MockBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

interface MockProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  joinedAt: string;
  stats: {
    designs: number;
    upvotesReceived: number;
    challengesCompleted: number;
    streak: number;
  };
  designs: MockDesign[];
  badges: MockBadge[];
  activityData: { date: string; count: number }[];
}

function getMockProfile(username: string): MockProfile {
  const now = new Date();

  // Generate 365 days of activity
  const activityData: { date: string; count: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Weighted random: more activity in recent months
    const recency = (365 - i) / 365;
    const rand = Math.random();
    const count = rand < 0.4 ? 0 : rand < 0.6 ? Math.ceil(recency * 3) : Math.ceil(recency * 8);
    activityData.push({ date: key, count });
  }

  return {
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    bio: 'System design enthusiast. Building scalable architectures and teaching others along the way.',
    avatarColor: '#6E56CF',
    joinedAt: '2024-03-15',
    stats: {
      designs: 24,
      upvotesReceived: 156,
      challengesCompleted: 18,
      streak: 7,
    },
    designs: [
      {
        id: 'd1',
        title: 'Microservices E-Commerce',
        description: 'Event-driven architecture with CQRS pattern',
        upvotes: 42,
        nodeCount: 18,
        createdAt: '2025-12-01',
        thumbnailGradient: 'from-violet-600 to-blue-600',
      },
      {
        id: 'd2',
        title: 'Real-Time Chat System',
        description: 'WebSocket-based chat with presence and typing indicators',
        upvotes: 31,
        nodeCount: 12,
        createdAt: '2025-11-15',
        thumbnailGradient: 'from-emerald-600 to-teal-600',
      },
      {
        id: 'd3',
        title: 'URL Shortener at Scale',
        description: 'Consistent hashing with Redis cache layer',
        upvotes: 28,
        nodeCount: 9,
        createdAt: '2025-11-01',
        thumbnailGradient: 'from-orange-600 to-red-600',
      },
      {
        id: 'd4',
        title: 'Notification Pipeline',
        description: 'Multi-channel notification with priority queues',
        upvotes: 19,
        nodeCount: 14,
        createdAt: '2025-10-20',
        thumbnailGradient: 'from-pink-600 to-purple-600',
      },
      {
        id: 'd5',
        title: 'Rate Limiter Service',
        description: 'Token bucket + sliding window algorithms',
        upvotes: 22,
        nodeCount: 7,
        createdAt: '2025-10-05',
        thumbnailGradient: 'from-cyan-600 to-blue-600',
      },
      {
        id: 'd6',
        title: 'Distributed Cache',
        description: 'Consistent hashing with virtual nodes',
        upvotes: 14,
        nodeCount: 11,
        createdAt: '2025-09-22',
        thumbnailGradient: 'from-amber-600 to-yellow-600',
      },
    ],
    badges: [
      { id: 'b1', name: 'First Design', icon: '🏗️', description: 'Published your first design', earnedAt: '2024-03-20' },
      { id: 'b2', name: 'Popular Creator', icon: '🌟', description: 'Received 100+ upvotes', earnedAt: '2025-06-10' },
      { id: 'b3', name: 'Challenge Master', icon: '🏆', description: 'Completed 10 challenges', earnedAt: '2025-08-15' },
      { id: 'b4', name: '7-Day Streak', icon: '🔥', description: 'Maintained a 7-day streak', earnedAt: '2025-09-01' },
      { id: 'b5', name: 'Forked 5x', icon: '🍴', description: 'Had a design forked 5 times', earnedAt: '2025-10-12' },
      { id: 'b6', name: 'Mentor', icon: '🎓', description: 'Helped 10 community members', earnedAt: '2025-11-20' },
    ],
    activityData,
  };
}

// ── Activity Heatmap (reused pattern from SRS) ────────────────

function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const INTENSITY_COLORS = [
  'bg-zinc-800/60',
  'bg-violet-900/60',
  'bg-violet-700/60',
  'bg-violet-500/60',
  'bg-violet-400/80',
];

function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = [];
    let currentWeek: { date: string; count: number }[] = [];

    const firstDate = data.length > 0 ? new Date(data[0].date) : new Date();
    const startDay = firstDate.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: '', count: -1 });
    }

    for (const day of data) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [data]);

  const totalActivity = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data],
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Activity (365 days)
        </p>
        <p className="text-[10px] text-zinc-500">
          {totalActivity} contributions
        </p>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                className={cn(
                  'h-[10px] w-[10px] rounded-[2px]',
                  day.count < 0
                    ? 'bg-transparent'
                    : INTENSITY_COLORS[getIntensityLevel(day.count)],
                )}
                title={day.date ? `${day.date}: ${day.count} activities` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[9px] text-zinc-600">
        <span>Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div key={i} className={cn('h-[8px] w-[8px] rounded-[2px]', color)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_-]{1,39}$/;

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  // Validate username format: 1-39 alphanumeric, hyphens, or underscores
  if (!username || !USERNAME_RE.test(username)) {
    notFound();
  }

  const profile = useMemo(() => getMockProfile(username), [username]);

  const initials = useMemo(() => {
    const parts = profile.displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return profile.displayName.slice(0, 2).toUpperCase();
  }, [profile.displayName]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <Link
            href="/gallery"
            className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft size={14} />
            Gallery
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-xs text-zinc-500">Profile</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Profile card */}
        <motion.section
          {...slideUp}
          className="mb-8 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white ring-4 ring-zinc-800"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-zinc-100">
                {profile.displayName}
              </h1>
              <p className="mt-0.5 text-sm text-zinc-500">
                @{profile.username}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {profile.bio}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                <Calendar size={12} />
                Joined {profile.joinedAt}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Boxes size={14} className="text-violet-400" />}
              label="Designs"
              value={profile.stats.designs}
              index={0}
            />
            <StatCard
              icon={<Heart size={14} className="text-pink-400" />}
              label="Upvotes"
              value={profile.stats.upvotesReceived}
              index={1}
            />
            <StatCard
              icon={<Trophy size={14} className="text-amber-400" />}
              label="Challenges"
              value={profile.stats.challengesCompleted}
              index={2}
            />
            <StatCard
              icon={<Flame size={14} className="text-orange-400" />}
              label="Day Streak"
              value={profile.stats.streak}
              index={3}
            />
          </div>
        </motion.section>

        {/* Activity heatmap */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.out, delay: 0.1 }}
          className="mb-8 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6"
        >
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Activity
          </h2>
          <ActivityHeatmap data={profile.activityData} />
        </motion.section>

        {/* Achievement badges */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.out, delay: 0.15 }}
          className="mb-8 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-6"
        >
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Achievements
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {profile.badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: duration.normal,
                  ease: easing.out,
                  delay: getStaggerDelay('gridItems', i),
                }}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-800/40 bg-zinc-800/30 p-3 text-center"
                title={badge.description}
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-[10px] font-medium text-zinc-400">
                  {badge.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Published designs grid */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.out, delay: 0.2 }}
        >
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Published Designs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.designs.map((design, i) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: duration.normal,
                  ease: easing.out,
                  delay: getStaggerDelay('gridItems', i),
                }}
                className="group overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/50 transition-colors hover:border-zinc-700/60"
              >
                {/* Thumbnail gradient */}
                <div
                  className={cn(
                    'flex h-32 items-center justify-center bg-gradient-to-br',
                    design.thumbnailGradient,
                  )}
                >
                  <Boxes size={32} className="text-white/30" />
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white">
                    {design.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                    {design.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Heart size={10} />
                      {design.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Boxes size={10} />
                      {design.nodeCount} nodes
                    </span>
                    <span className="ml-auto">{design.createdAt}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: duration.normal,
        ease: easing.out,
        delay: getStaggerDelay('dashboardCards', index),
      }}
      className="flex flex-col gap-1 rounded-lg border border-zinc-800/40 bg-zinc-800/30 p-3"
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      </div>
      <span className="text-lg font-bold text-zinc-100">{value}</span>
    </motion.div>
  );
}
