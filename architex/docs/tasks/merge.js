const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('batch-') && f.endsWith('.json')).sort();

let allTasks = [];
files.forEach(f => {
  const tasks = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  allTasks = allTasks.concat(tasks);
  console.log(`${f}: ${tasks.length} tasks`);
});

// Deduplicate by ID
const seen = new Set();
const unique = allTasks.filter(t => {
  if (seen.has(t.id)) return false;
  seen.add(t.id);
  return true;
});

const byStatus = {};
const byPriority = {};
const byEpic = {};
unique.forEach(t => {
  byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  byEpic[t.epic] = (byEpic[t.epic] || 0) + 1;
});

console.log('\n=== MERGE RESULTS ===');
console.log('Total unique tasks:', unique.length);
console.log('By status:', JSON.stringify(byStatus));
console.log('By priority:', JSON.stringify(byPriority));
console.log('Epics covered:', Object.keys(byEpic).length);

const epicDefs = [
  { id: 'FND', name: 'Foundation & Core Platform', description: 'Project setup, auth, database, stores, canvas, layout', phase: 1, priority: 'P0', color: '#6366F1' },
  { id: 'DSN', name: 'Design System & UI Components', description: 'CSS tokens, shadcn/ui wrappers, custom components', phase: 1, priority: 'P0', color: '#8B5CF6' },
  { id: 'SDS', name: 'System Design Simulator', description: 'Drag-drop canvas, simulation engine, chaos, templates', phase: 2, priority: 'P0', color: '#3B82F6' },
  { id: 'ALG', name: 'Algorithm Visualizer', description: 'Sorting, graph, tree, DP, string algorithms', phase: 3, priority: 'P1', color: '#06B6D4' },
  { id: 'DST', name: 'Data Structure Explorer', description: '45+ interactive data structures', phase: 3, priority: 'P1', color: '#14B8A6' },
  { id: 'LLD', name: 'Low-Level Design Studio', description: 'UML diagrams, 33 patterns, SOLID, code gen', phase: 4, priority: 'P1', color: '#F59E0B' },
  { id: 'DBL', name: 'Database Design Lab', description: 'ER diagrams, normalization, query plans, indexes', phase: 4, priority: 'P1', color: '#22C55E' },
  { id: 'DIS', name: 'Distributed Systems', description: 'Raft, Paxos, consistent hashing, CRDTs', phase: 4, priority: 'P1', color: '#A855F7' },
  { id: 'NET', name: 'Networking & Protocols', description: 'TCP, TLS, DNS, HTTP, WebSocket, CORS', phase: 5, priority: 'P1', color: '#EC4899' },
  { id: 'OSC', name: 'OS Concepts', description: 'Scheduling, page replacement, deadlock, memory', phase: 5, priority: 'P2', color: '#F97316' },
  { id: 'CON', name: 'Concurrency Lab', description: 'Race conditions, producer-consumer, philosophers', phase: 5, priority: 'P2', color: '#EF4444' },
  { id: 'SEC', name: 'Security & Cryptography', description: 'OAuth, JWT, AES, Diffie-Hellman, HTTPS', phase: 5, priority: 'P2', color: '#DC2626' },
  { id: 'MLD', name: 'ML System Design', description: 'Neural net, ML pipeline, A/B testing', phase: 5, priority: 'P2', color: '#7C3AED' },
  { id: 'INT', name: 'Interview Engine', description: 'Challenges, scoring, SRS, gamification', phase: 6, priority: 'P0', color: '#FBBF24' },
  { id: 'AIX', name: 'AI Integration', description: 'Claude API, hints, Socratic tutor, generator', phase: 6, priority: 'P1', color: '#60A5FA' },
  { id: 'COL', name: 'Collaboration & Community', description: 'Yjs real-time, gallery, sharing', phase: 7, priority: 'P2', color: '#34D399' },
  { id: 'EXP', name: 'Export & Sharing', description: 'JSON, PNG, SVG, PDF, Mermaid, Terraform', phase: 2, priority: 'P1', color: '#818CF8' },
  { id: 'LND', name: 'Landing Page', description: 'Hero, features, pricing, social proof', phase: 9, priority: 'P1', color: '#FB923C' },
  { id: 'SEO', name: 'SEO & Content', description: '270+ pages, blog, newsletter', phase: 9, priority: 'P2', color: '#4ADE80' },
  { id: 'TST', name: 'Testing & Quality', description: 'Vitest, Playwright, visual regression', phase: 10, priority: 'P0', color: '#2DD4BF' },
  { id: 'CID', name: 'CI/CD & DevOps', description: 'GitHub Actions, Docker, previews', phase: 10, priority: 'P1', color: '#94A3B8' },
  { id: 'A11', name: 'Accessibility', description: 'WCAG 2.2 AA, keyboard, screen reader', phase: 10, priority: 'P0', color: '#FB7185' },
  { id: 'MOB', name: 'Mobile & Responsive', description: 'Breakpoints, gestures, bottom sheets', phase: 10, priority: 'P1', color: '#38BDF8' },
  { id: 'PWA', name: 'PWA & Offline', description: 'Service worker, caching, offline', phase: 10, priority: 'P1', color: '#A78BFA' },
  { id: 'PER', name: 'Performance', description: 'Bundle size, lazy loading, Web Vitals', phase: 10, priority: 'P1', color: '#FACC15' },
  { id: 'SCR', name: 'Security Hardening', description: 'CSP, CORS, rate limiting, GDPR', phase: 10, priority: 'P0', color: '#F43F5E' },
  { id: 'BIL', name: 'Billing & Monetization', description: 'Stripe, pricing, usage limits', phase: 7, priority: 'P2', color: '#10B981' },
  { id: 'ENT', name: 'Enterprise Features', description: 'SSO, team dashboard, LMS', phase: 10, priority: 'P3', color: '#6366F1' },
  { id: 'INF', name: 'Infrastructure', description: 'Workers, auto-layout, import, versioning', phase: 1, priority: 'P0', color: '#64748B' },
  { id: 'BUG', name: 'Bug Fixes', description: 'Critical bugs, type safety, memory leaks', phase: 1, priority: 'P0', color: '#EF4444' },
  { id: 'UXP', name: 'UX Polish', description: 'Toasts, animations, empty states, onboarding', phase: 10, priority: 'P1', color: '#D946EF' },
  { id: 'DOC', name: 'Documentation', description: 'README, CONTRIBUTING, ADRs, legal', phase: 9, priority: 'P0', color: '#78716C' },
  { id: 'INO', name: 'Innovation', description: '35 future features: AI, multiplayer, 3D', phase: 7, priority: 'P3', color: '#F472B6' },
];

epicDefs.forEach(e => {
  e.taskCount = byEpic[e.id] || 0;
  e.completedCount = unique.filter(t => t.epic === e.id && t.status === 'done').length;
});

const board = {
  meta: {
    schemaVersion: '1.0',
    project: 'Architex',
    generatedAt: new Date().toISOString(),
    generatedBy: 'Claude Opus 4.6 — 32 research + 7 compilation agents'
  },
  epics: epicDefs,
  tasks: unique
};

const outPath = path.join(dir, 'tasks.json');
fs.writeFileSync(outPath, JSON.stringify(board, null, 2));
const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(`\nWritten: tasks.json (${sizeKB}KB)`);
console.log(`Done: ${byStatus['done'] || 0} | Backlog: ${byStatus['backlog'] || 0}`);
