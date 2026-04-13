/**
 * Architex Task Board — Type Definitions
 *
 * Canonical schema for every task, epic, and board metadata
 * used by the JSON data file and HTML dashboard.
 */

// ─── Priority & Effort ──────────────────────────────────────────────
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Effort = 'S' | 'M' | 'L' | 'XL';
export type Status = 'backlog' | 'ready' | 'in-progress' | 'done' | 'blocked';

// ─── Category & Module ──────────────────────────────────────────────
export type Category =
  | 'frontend'
  | 'backend'
  | 'infra'
  | 'design'
  | 'content'
  | 'testing'
  | 'devops'
  | 'security'
  | 'mobile'
  | 'ai'
  | 'docs';

export type Module =
  | 'system-design'
  | 'algorithms'
  | 'data-structures'
  | 'lld'
  | 'database'
  | 'distributed-systems'
  | 'networking'
  | 'os-concepts'
  | 'concurrency'
  | 'security'
  | 'ml-system-design'
  | 'interview-engine'
  | 'ai-integration'
  | 'collaboration'
  | 'platform'
  | 'marketing'
  | 'core';

// ─── Epic IDs ───────────────────────────────────────────────────────
export type EpicId =
  | 'FND'  // Foundation & Core Platform
  | 'DSN'  // Design System & UI Components
  | 'SDS'  // System Design Simulator
  | 'ALG'  // Algorithm Visualizer
  | 'DST'  // Data Structure Explorer
  | 'LLD'  // Low-Level Design Studio
  | 'DBL'  // Database Design Lab
  | 'DIS'  // Distributed Systems
  | 'NET'  // Networking & Protocols
  | 'OSC'  // OS Concepts
  | 'CON'  // Concurrency Lab
  | 'SEC'  // Security & Cryptography
  | 'MLD'  // ML System Design
  | 'INT'  // Interview Engine
  | 'AIX'  // AI Integration
  | 'COL'  // Collaboration & Community
  | 'EXP'  // Export & Sharing
  | 'LND'  // Landing Page & Marketing
  | 'SEO'  // SEO & Content
  | 'TST'  // Testing & Quality
  | 'CID'  // CI/CD & DevOps
  | 'A11'  // Accessibility
  | 'MOB'  // Mobile & Responsive
  | 'PWA'  // PWA & Offline
  | 'PER'  // Performance & Optimization
  | 'SCR'  // Security Hardening
  | 'BIL'  // Billing & Monetization
  | 'ENT'  // Enterprise Features
  | 'INF'  // Infrastructure & Architecture
  | 'BUG'  // Bug Fixes & Code Quality
  | 'UXP'  // UX Polish & Micro-interactions
  | 'DOC'  // Documentation
  | 'INO'; // Innovation & Future Features

// ─── Task ───────────────────────────────────────────────────────────
export interface Task {
  /** Unique ID, e.g. "FND-001", "SDS-042", "ALG-015" */
  id: string;
  /** Epic this task belongs to */
  epic: EpicId;
  /** Short, imperative title */
  title: string;
  /** Detailed description in markdown */
  description: string;
  /** Concrete, testable acceptance criteria */
  acceptanceCriteria: string[];
  /** Business priority: P0 = critical, P3 = nice-to-have */
  priority: Priority;
  /** T-shirt size estimate */
  effort: Effort;
  /** Current workflow status */
  status: Status;
  /** Delivery phase (1-10) */
  phase: number;
  /** Logical module this task lives in */
  module: Module;
  /** Engineering category */
  category: Category;
  /** Files to create or modify (relative to project root) */
  files: string[];
  /** Task IDs this task depends on */
  dependencies: string[];
  /** Task IDs that are currently blocking this task */
  blockedBy: string[];
  /** Freeform searchable tags */
  tags: string[];
  /** Role responsible (e.g. "frontend-engineer", "designer") */
  assignee?: string;
  /** Rough hour estimate */
  estimatedHours?: number;
  /** ISO-8601 date when the task was created */
  createdAt?: string;
  /** ISO-8601 date of last status change */
  updatedAt?: string;
  /** Optional notes / context */
  notes?: string;
}

// ─── Epic ───────────────────────────────────────────────────────────
export interface Epic {
  /** Short code, e.g. "FND", "SDS" */
  id: EpicId;
  /** Human-readable name */
  name: string;
  /** One-sentence purpose */
  description: string;
  /** Target delivery phase */
  phase: number;
  /** Total tasks in this epic */
  taskCount: number;
  /** Tasks with status === 'done' */
  completedCount: number;
  /** Overall priority for the epic */
  priority: Priority;
  /** Hex colour used in the dashboard */
  color?: string;
}

// ─── Board Metadata ─────────────────────────────────────────────────
export interface BoardMeta {
  /** Schema version for forward-compat */
  schemaVersion: string;
  /** Project name */
  project: string;
  /** ISO-8601 generation timestamp */
  generatedAt: string;
  /** Agent / person who produced this file */
  generatedBy: string;
}

// ─── Root data file shape ───────────────────────────────────────────
export interface TaskBoard {
  meta: BoardMeta;
  epics: Epic[];
  tasks: Task[];
}
