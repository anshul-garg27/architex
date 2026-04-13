import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  generateCourseJsonLd,
  generateLearningResourceJsonLd,
  generateOrganizationJsonLd,
} from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Architex — Design Systems, Visualize Algorithms, Ace Interviews",
  description:
    "The interactive engineering laboratory where architectures breathe, algorithms animate, and systems fail gracefully under chaos.",
  openGraph: {
    title: "Architex — Design Systems, Visualize Algorithms, Ace Interviews",
    description:
      "Interactive engineering lab for system design, algorithms, and interview prep. Build, visualize, and master systems.",
    url: "https://architex.dev/landing",
    siteName: "Architex",
    type: "website",
    images: [
      {
        url: "https://architex.dev/api/og?title=Architex&type=landing",
        width: 1200,
        height: 630,
        alt: "Architex — Interactive Engineering Laboratory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Architex — Design Systems, Visualize Algorithms, Ace Interviews",
    description:
      "Interactive engineering lab for system design, algorithms, and interview prep.",
    images: ["https://architex.dev/api/og?title=Architex&type=landing"],
  },
};

// ── JSON-LD structured data for AI search (PLT-021) ──────────

const MODULE_COURSES = [
  { name: "System Design", description: "Drag-and-drop architecture canvas with live simulations. Build scalable systems visually.", url: "https://architex.dev/modules/system-design" },
  { name: "Algorithms", description: "26+ sorting and graph algorithms with step-by-step visualization and complexity analysis.", url: "https://architex.dev/modules/algorithms" },
  { name: "Data Structures", description: "38 interactive data structures from arrays to CRDTs. Watch operations animate in real time.", url: "https://architex.dev/modules/data-structures" },
  { name: "Low-Level Design", description: "31 design patterns, SOLID principles, 25 LLD problems, sequence diagrams, and state machines.", url: "https://architex.dev/modules/lld" },
  { name: "Database Engineering", description: "SQL query visualization, indexing strategies, B-tree visualization, and transaction simulation.", url: "https://architex.dev/modules/database" },
  { name: "Distributed Systems", description: "Consensus protocols, CAP theorem explorer, Raft visualization, and fault injection with chaos engineering.", url: "https://architex.dev/modules/distributed" },
  { name: "Networking", description: "TCP/IP stack visualization, TLS handshake animation, HTTP comparison, and CORS simulation.", url: "https://architex.dev/modules/networking" },
  { name: "OS Concepts", description: "Process scheduling, memory management, page replacement algorithms, and deadlock detection.", url: "https://architex.dev/modules/os" },
  { name: "Concurrency", description: "Thread synchronization, dining philosophers, event loop visualization, and goroutine simulation.", url: "https://architex.dev/modules/concurrency" },
  { name: "Security", description: "OAuth flows, JWT engine, AES encryption visualization, Diffie-Hellman key exchange, and HTTPS flow.", url: "https://architex.dev/modules/security" },
  { name: "ML System Design", description: "ML system architecture, feature stores, model serving patterns, and pipeline design.", url: "https://architex.dev/modules/ml-design" },
  { name: "Interview Preparation", description: "Timed mock interviews with AI scoring across 6 dimensions and spaced repetition for mastery.", url: "https://architex.dev/modules/interview" },
  { name: "Knowledge Graph", description: "Concept explorer, relationship mapping, and cross-module knowledge search.", url: "https://architex.dev/modules/knowledge-graph" },
];

const KEY_TOPICS = [
  { name: "CAP Theorem", description: "Interactive exploration of Consistency, Availability, and Partition Tolerance trade-offs in distributed systems.", url: "https://architex.dev/modules/distributed", keywords: ["CAP theorem", "distributed systems", "consistency", "availability"] },
  { name: "Consistent Hashing", description: "Visual simulation of consistent hashing for load distribution across distributed nodes.", url: "https://architex.dev/modules/distributed", keywords: ["consistent hashing", "load balancing", "distributed systems"] },
  { name: "Raft Consensus", description: "Step-by-step visualization of the Raft consensus protocol including leader election and log replication.", url: "https://architex.dev/modules/distributed", keywords: ["Raft", "consensus", "leader election", "distributed systems"] },
  { name: "B-Tree Indexing", description: "Interactive B-tree visualization showing insertions, deletions, and range queries for database indexing.", url: "https://architex.dev/modules/database", keywords: ["B-tree", "database index", "query optimization"] },
  { name: "Design Patterns", description: "31 interactive design patterns with UML diagrams, code examples, and behavioral simulation.", url: "https://architex.dev/modules/lld", keywords: ["design patterns", "SOLID", "OOP", "software design"] },
  { name: "System Design Interview", description: "Timed mock system design interviews with AI-powered evaluation across scalability, reliability, cost, latency, security, and maintainability.", url: "https://architex.dev/modules/interview", keywords: ["system design interview", "mock interview", "FAANG preparation"] },
];

const courseJsonLd = MODULE_COURSES.map((c) => generateCourseJsonLd(c));
const resourceJsonLd = KEY_TOPICS.map((t) => generateLearningResourceJsonLd(t));
const orgJsonLd = generateOrganizationJsonLd();

export default function LandingRoute() {
  return (
    <>
      <JsonLd data={[orgJsonLd, ...courseJsonLd, ...resourceJsonLd]} />
      <LandingPage />
    </>
  );
}
