"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
} from "motion/react";
import {
  LayoutDashboard,
  Binary,
  Boxes,
  PenTool,
  Database,
  Network,
  Globe,
  Cpu,
  Layers,
  ShieldCheck,
  Brain,
  Trophy,
  Sparkles,
  Play,
  MessageSquare,
  Check,
  ArrowRight,
  ChevronRight,
  Menu,
  X,
  Shield,
  Clock,
  Users,
  Minus,
} from "lucide-react";
import { duration, easing } from "@/lib/constants/motion";
import { PRICING_TIERS, formatPrice, formatPeriod } from "@/lib/constants/pricing";
import { GradientMeshBackground } from "./GradientMeshBackground";
import {
  GradientText,
  TypewriterText,
  FadeUpText,
  CountUpNumber,
} from "./AnimatedText";

import { MiniSimulator } from "./MiniSimulator";

// ── Brand SVG icons (Lucide doesn't ship brand marks) ───────

function IconGitHub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function IconTwitter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION WRAPPER — scroll-triggered fade-in
// ═══════════════════════════════════════════════════════════════

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: duration.slow, ease: easing.out }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE DATA
// ═══════════════════════════════════════════════════════════════

const modules = [
  {
    icon: LayoutDashboard,
    name: "System Design",
    description:
      "Drag-and-drop architecture canvas with live simulations. Build scalable systems visually.",
    color: "text-blue-400",
    borderColor: "group-hover:border-blue-400/30",
    bgGlow: "group-hover:shadow-blue-400/5",
  },
  {
    icon: Binary,
    name: "Algorithms",
    description:
      "26+ sorting and graph algorithms with step-by-step visualization and complexity analysis.",
    color: "text-violet-400",
    borderColor: "group-hover:border-violet-400/30",
    bgGlow: "group-hover:shadow-violet-400/5",
  },
  {
    icon: Boxes,
    name: "Data Structures",
    description:
      "Interactive trees, graphs, heaps, and hash maps. Watch operations animate in real time.",
    color: "text-emerald-400",
    borderColor: "group-hover:border-emerald-400/30",
    bgGlow: "group-hover:shadow-emerald-400/5",
  },
  {
    icon: PenTool,
    name: "Low-Level Design",
    description:
      "Class diagrams, design patterns, and SOLID principles with interactive UML tooling.",
    color: "text-amber-400",
    borderColor: "group-hover:border-amber-400/30",
    bgGlow: "group-hover:shadow-amber-400/5",
  },
  {
    icon: Database,
    name: "Database",
    description:
      "SQL query visualization, indexing strategies, sharding patterns, and replication topologies.",
    color: "text-green-400",
    borderColor: "group-hover:border-green-400/30",
    bgGlow: "group-hover:shadow-green-400/5",
  },
  {
    icon: Network,
    name: "Distributed Systems",
    description:
      "Consensus protocols, CAP theorem explorer, and fault injection with chaos engineering.",
    color: "text-orange-400",
    borderColor: "group-hover:border-orange-400/30",
    bgGlow: "group-hover:shadow-orange-400/5",
  },
  {
    icon: Globe,
    name: "Networking",
    description:
      "TCP/IP stack visualization, DNS resolution, HTTP lifecycle, and load balancing strategies.",
    color: "text-cyan-400",
    borderColor: "group-hover:border-cyan-400/30",
    bgGlow: "group-hover:shadow-cyan-400/5",
  },
  {
    icon: Cpu,
    name: "OS Concepts",
    description:
      "Process scheduling, memory management, file systems, and virtual memory simulation.",
    color: "text-red-400",
    borderColor: "group-hover:border-red-400/30",
    bgGlow: "group-hover:shadow-red-400/5",
  },
  {
    icon: Layers,
    name: "Concurrency",
    description:
      "Thread synchronization, deadlock detection, lock-free structures, and race condition demos.",
    color: "text-purple-400",
    borderColor: "group-hover:border-purple-400/30",
    bgGlow: "group-hover:shadow-purple-400/5",
  },
  {
    icon: ShieldCheck,
    name: "Security",
    description:
      "Authentication flows, encryption algorithms, OWASP vulnerabilities, and TLS handshake animation.",
    color: "text-rose-400",
    borderColor: "group-hover:border-rose-400/30",
    bgGlow: "group-hover:shadow-rose-400/5",
  },
  {
    icon: Brain,
    name: "ML Design",
    description:
      "ML system architecture, feature stores, model serving, A/B testing, and pipeline design.",
    color: "text-pink-400",
    borderColor: "group-hover:border-pink-400/30",
    bgGlow: "group-hover:shadow-pink-400/5",
  },
  {
    icon: Trophy,
    name: "Interview Prep",
    description:
      "Timed mock interviews with AI scoring across 6 dimensions. Spaced repetition for mastery.",
    color: "text-yellow-400",
    borderColor: "group-hover:border-yellow-400/30",
    bgGlow: "group-hover:shadow-yellow-400/5",
  },
  {
    icon: Sparkles,
    name: "Knowledge Graph",
    description:
      "Cross-module concept explorer with relationship mapping and intelligent knowledge search.",
    color: "text-indigo-400",
    borderColor: "group-hover:border-indigo-400/30",
    bgGlow: "group-hover:shadow-indigo-400/5",
  },
];

// ═══════════════════════════════════════════════════════════════
// HOW IT WORKS DATA
// ═══════════════════════════════════════════════════════════════

const steps = [
  {
    number: "01",
    title: "Pick a Challenge",
    description:
      "Choose from 33+ system design problems, algorithm challenges, or data structure exercises tailored to your level.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Build & Visualize",
    description:
      "Drag components onto the canvas, run simulations, and watch data flow through your architecture in real time.",
    icon: Play,
  },
  {
    number: "03",
    title: "Get Feedback",
    description:
      "AI-powered evaluation scores your design across 6 dimensions: scalability, reliability, cost, latency, security, and maintainability.",
    icon: MessageSquare,
  },
];

// ═══════════════════════════════════════════════════════════════
// STATS DATA
// ═══════════════════════════════════════════════════════════════

const stats = [
  { numericValue: 13, suffix: "", label: "Interactive Modules" },
  { numericValue: 34, suffix: "", label: "Design Patterns" },
  { numericValue: 33, suffix: "+", label: "Hands-On Problems" },
  { numericValue: 38, suffix: "", label: "Data Structures" },
];

// ═══════════════════════════════════════════════════════════════
// PRICING DATA — imported from @/lib/constants/pricing (single
// source of truth shared with the /pricing page)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// FOOTER DATA
// ═══════════════════════════════════════════════════════════════

const footerLinks: Record<string, { label: string; href: string; external?: boolean }[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
  ],
  Resources: [
    { label: "Documentation", href: "/concepts" },
    { label: "Tutorials", href: "/modules" },
    { label: "Blog", href: "/blog" },
  ],
  Company: [
    { label: "Contact", href: "mailto:hello@architex.dev", external: true },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// MOBILE NAVIGATION — hamburger on mobile, inline links on md+
// ═══════════════════════════════════════════════════════════════

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Architex
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden rounded-lg px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground sm:block">
            Sign In
          </Link>
          <Link href="/dashboard" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:px-4 sm:py-2 sm:text-sm">
            Get Started
          </Link>

          {/* Hamburger — visible on mobile only */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            <a
              href="#features"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-[15px] font-medium text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-[15px] font-medium text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-[15px] font-medium text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
            >
              Pricing
            </a>
            <div className="mt-2 flex flex-col gap-2 border-t border-border/50 pt-3">
              <Link href="/sign-in" onClick={() => setOpen(false)} className="w-full rounded-lg px-4 py-3 text-[15px] font-medium text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground">
                Sign In
              </Link>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="w-full rounded-lg bg-primary px-4 py-3 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* ── Navigation ──────────────────────────────────────── */}
      <MobileNav />

      {/* ── Hero Section ────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16"
      >
        {/* Animated gradient mesh background */}
        <GradientMeshBackground />
        {/* Radial glow */}
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.moderate, ease: easing.out }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-1.5 text-sm text-foreground-muted backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Interactive Engineering Laboratory</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.moderate,
              ease: easing.out,
              delay: 0.1,
            }}
            className="text-[28px] font-bold leading-[1.15] tracking-tight sm:text-5xl md:text-7xl"
          >
            Build, break, and master
            <br />
            <GradientText>system architectures</GradientText>
            <br />
            through interactive simulation.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.moderate,
              ease: easing.out,
              delay: 0.2,
            }}
            className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-foreground-muted sm:text-lg md:text-xl"
          >
            13 interactive modules. 34 design patterns. 33+ hands-on problems.
            The engineering lab where architectures breathe, algorithms animate,
            and systems fail gracefully under chaos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.moderate,
              ease: easing.out,
              delay: 0.3,
            }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 px-4 sm:w-auto sm:flex-row sm:px-0"
          >
            <Link href="/dashboard" className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 sm:w-auto sm:py-3">
              Start Building Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-8 py-3.5 text-[15px] font-medium text-foreground transition-colors hover:bg-elevated sm:w-auto sm:py-3"
            >
              <Play className="h-4 w-4" />
              View Demo
            </button>
          </motion.div>

          {/* Typewriter code snippet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.moderate,
              ease: easing.out,
              delay: 0.5,
            }}
            className="mx-auto mt-10 max-w-lg rounded-lg border border-border bg-surface/80 px-4 py-3 font-mono text-sm text-foreground-muted backdrop-blur-sm"
          >
            <span className="text-foreground-subtle">$</span>{" "}
            <TypewriterText
              text="architex simulate --arch microservices --chaos-level medium"
              speed={35}
              startDelay={800}
            />
          </motion.div>

          {/* Mini Simulator — interactive demo right in the hero */}
          <motion.div
            id="demo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.moderate,
              ease: easing.out,
              delay: 0.7,
            }}
            className="mx-auto mt-10 max-w-xl"
          >
            <MiniSimulator />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: duration.slow }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: easing.inOut }}
            className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-foreground-subtle/30 p-1.5"
          >
            <motion.div className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Social Proof ──────────────────────────────────── */}
      <Section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-foreground-muted">
            Trusted by engineers at
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {/* Placeholder company names styled as logos */}
            {["Google", "Meta", "Amazon", "Microsoft", "Stripe", "Uber"].map((company) => (
              <span key={company} className="text-lg font-semibold tracking-tight text-foreground-muted">
                {company}
              </span>
            ))}
          </div>

          {/* Testimonials */}
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { quote: "Architex transformed how our team prepares for system design interviews. The interactive simulations are unmatched.", author: "Sarah Chen", role: "Staff Engineer" },
              { quote: "Finally, a tool that lets you actually build and break architectures, not just draw boxes. The chaos engineering is brilliant.", author: "Marcus Rivera", role: "Principal SDE" },
              { quote: "We use Architex for onboarding new engineers. They understand distributed systems 3x faster with visual simulations.", author: "Priya Sharma", role: "Engineering Manager" },
            ].map((t) => (
              <div key={t.author} className="rounded-xl border border-border bg-surface/50 p-6 text-left">
                <p className="text-sm leading-relaxed text-foreground-muted">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground">{t.author}</p>
                  <p className="text-xs text-foreground-muted">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Problem Statement ──────────────────────────────── */}
      <Section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <FadeUpText as="h2" className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            System design interviews are broken
          </FadeUpText>
          <FadeUpText as="p" delay={0.1} className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-foreground-muted sm:text-lg">
            Static diagrams on a whiteboard don&apos;t teach you how systems
            actually behave under load. Cramming architecture flashcards
            doesn&apos;t build the intuition you need when an interviewer asks
            &ldquo;what happens when this service goes down?&rdquo; You need to
            build, break, and observe systems in motion.
          </FadeUpText>
        </div>
      </Section>

      {/* ── How It Works ────────────────────────────────────── */}
      <Section id="how-it-works" className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <FadeUpText as="h2" className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              How It Works
            </FadeUpText>
            <FadeUpText as="p" delay={0.1} className="mt-4 text-[15px] text-foreground-muted sm:text-lg">
              Three steps from concept to mastery. No setup required.
            </FadeUpText>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: duration.moderate,
                    ease: easing.out,
                    delay: i * 0.1,
                  }}
                  className="relative rounded-xl border border-border bg-surface/50 p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-3xl font-bold text-foreground-subtle/40">
                      {step.number}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground-muted">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Modules Grid ───────────────────────────────────── */}
      <Section id="features" className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <FadeUpText as="h2" className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              <CountUpNumber to={13} /> Interactive Modules
            </FadeUpText>
            <FadeUpText as="p" delay={0.1} className="mt-4 text-[15px] text-foreground-muted sm:text-lg">
              A complete engineering curriculum covering 34 design patterns, 38 data
              structures, and 33+ problems — all with interactive visualization.
            </FadeUpText>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={mod.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: duration.moderate,
                    ease: easing.out,
                    delay: Math.min(i * 0.04, 0.4),
                  }}
                  className={`group relative cursor-pointer rounded-xl border border-border bg-surface/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-lg ${mod.borderColor} ${mod.bgGlow}`}
                >
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated ${mod.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 font-semibold text-foreground">
                    {mod.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground-muted">
                    {mod.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-foreground-subtle transition-colors group-hover:text-primary">
                    Explore
                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Stats Bar ───────────────────────────────────────── */}
      <Section className="border-y border-border bg-surface/30 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 sm:gap-8 sm:px-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                <CountUpNumber
                  to={stat.numericValue}
                  suffix={stat.suffix}
                  countDuration={1.5}
                />
              </div>
              <div className="mt-1 text-sm text-foreground-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Competitor Comparison ────────────────────────────── */}
      <Section className="py-20 sm:py-28" id="comparison">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Why engineers choose Architex
          </h2>
          <p className="mt-4 text-center text-foreground-muted">
            See how we compare to other system design tools
          </p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 pr-4 text-left font-medium text-foreground-muted">
                    Feature
                  </th>
                  <th className="pb-4 px-4 text-center font-semibold text-primary">
                    Architex
                  </th>
                  <th className="pb-4 px-4 text-center font-medium text-foreground-muted">
                    PaperDraw
                  </th>
                  <th className="pb-4 px-4 text-center font-medium text-foreground-muted">
                    Excalidraw
                  </th>
                  <th className="pb-4 pl-4 text-center font-medium text-foreground-muted">
                    Static Diagrams
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {([
                  ["Interactive Simulation", true, false, false, false],
                  ["Chaos Engineering", true, false, false, false],
                  ["AI Evaluation", true, "Limited", false, false],
                  ["13 Learning Modules", true, "Limited", false, false],
                  ["Live Metrics", true, false, false, false],
                  ["Template Library", true, true, "Limited", false],
                  ["Collaboration", true, true, true, false],
                  ["Export Formats", true, true, true, "Limited"],
                ] as const).map(([feature, architex, paperdraw, excalidraw, staticDiag]) => (
                  <tr key={feature}>
                    <td className="py-3.5 pr-4 font-medium text-foreground">
                      {feature}
                    </td>
                    {[architex, paperdraw, excalidraw, staticDiag].map((val, i) => (
                      <td key={i} className="py-3.5 px-4 text-center">
                        {val === true ? (
                          <Check className="mx-auto h-4 w-4 text-state-success" />
                        ) : val === false ? (
                          <Minus className="mx-auto h-4 w-4 text-foreground-subtle" />
                        ) : (
                          <span className="text-xs text-foreground-muted">
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <Section id="pricing" className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            <FadeUpText as="h2" className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Simple, Transparent Pricing
            </FadeUpText>
            <FadeUpText as="p" delay={0.1} className="mt-4 text-[15px] text-foreground-muted sm:text-lg">
              Start free. Upgrade when you need more power.
            </FadeUpText>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: duration.moderate,
                  ease: easing.out,
                  delay: i * 0.1,
                }}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  tier.popular
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                    : "border-border bg-surface/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {tier.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(tier)}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      {formatPeriod(tier)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground-muted">
                    {tier.description}
                  </p>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-foreground-muted"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-state-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.ctaHref}
                  className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                      : "border border-border text-foreground hover:bg-elevated"
                  }`}
                >
                  {tier.cta}
                </Link>
                {/* Trust signal per tier */}
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-foreground-subtle">
                  <Shield className="h-3 w-3" />
                  {tier.id === "free" && "No credit card required"}
                  {tier.id === "student" && "Verify .edu email"}
                  {tier.id === "pro" && "7-day free trial"}
                  {tier.id === "team" && "Custom onboarding included"}
                </p>
              </motion.div>
            ))}
          </div>

          {/* General trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {[
              { icon: Shield, label: "30-day money-back guarantee" },
              { icon: ShieldCheck, label: "SOC 2 compliant" },
              { icon: Clock, label: "99.9% uptime" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-xs text-foreground-subtle sm:text-sm"
              >
                <badge.icon className="h-4 w-4 text-foreground-muted" />
                {badge.label}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <Section className="py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-8 sm:p-12 md:p-16">
            {/* Background glow */}
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/10 blur-[100px]" />

            <div className="relative z-10">
              <FadeUpText as="h2" className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Start Practicing Free
              </FadeUpText>
              <FadeUpText as="p" delay={0.1} className="mx-auto mt-4 max-w-md text-[15px] text-foreground-muted sm:text-base">
                No credit card required. Jump straight into interactive system
                design, algorithms, and interview preparation.
              </FadeUpText>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/dashboard" className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 sm:w-auto sm:py-3">
                  Get Started Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface/30 pb-8 pt-12 sm:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  Architex
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                The interactive engineering laboratory for building, visualizing,
                and mastering systems.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="#"
                  aria-label="GitHub"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
                >
                  <IconGitHub className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
                >
                  <IconTwitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
                >
                  <IconLinkedIn className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.external || link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="text-sm text-foreground-muted transition-colors hover:text-foreground"
                          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-foreground-muted transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-xs text-foreground-subtle">
              &copy; {new Date().getFullYear()} Architex. All rights reserved.
            </p>
            <p className="text-xs text-foreground-subtle">
              Built with precision for engineers who build the future.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
