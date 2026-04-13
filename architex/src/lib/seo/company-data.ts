// ── Company interview database: 15 top tech companies for SEO pages ──

export type InterviewDifficulty = "medium" | "hard" | "very-hard";

export interface SampleQuestion {
  question: string;
  hint: string;
}

export interface CompanyDefinition {
  slug: string;
  name: string;
  logo: string;
  description: string;
  interviewStyle: string;
  commonTopics: string[];
  sampleQuestions: SampleQuestion[];
  tipsAndTricks: string[];
  difficulty: InterviewDifficulty;
  averageDuration: string;
  interviewRounds: string[];
  focusAreas: string[];
  relatedConcepts: string[];
}

export const COMPANIES: CompanyDefinition[] = [
  // ── FAANG+ ────────────────────────────────────────────────────
  {
    slug: "google",
    name: "Google",
    logo: "G",
    description:
      "Google system design interviews emphasize scalability, distributed systems, and data-intensive applications. Expect questions about search, ads, maps, and infrastructure at planetary scale.",
    interviewStyle:
      "Google interviews are highly structured with clear rubrics. Interviewers look for breadth and depth — you should drive the conversation, clarify requirements, and explore trade-offs. Whiteboard skills and back-of-the-envelope calculations are critical.",
    commonTopics: [
      "Distributed storage",
      "Search indexing",
      "MapReduce / data pipelines",
      "Global-scale caching",
      "Pub/Sub messaging",
      "Content delivery",
    ],
    sampleQuestions: [
      {
        question: "Design Google Search",
        hint: "Focus on web crawling, inverted index, ranking algorithms, and serving results at low latency across the globe.",
      },
      {
        question: "Design YouTube",
        hint: "Consider video upload pipeline, transcoding, CDN distribution, recommendation engine, and live streaming.",
      },
      {
        question: "Design Google Maps",
        hint: "Think about tile rendering, shortest-path routing (Dijkstra/A*), real-time traffic data, and offline support.",
      },
      {
        question: "Design Google Drive",
        hint: "Address file syncing, conflict resolution, chunked uploads, deduplication, and sharing permissions.",
      },
      {
        question: "Design a web crawler",
        hint: "Cover URL frontier, politeness policies, deduplication, distributed crawling, and incremental updates.",
      },
      {
        question: "Design a global CDN",
        hint: "Discuss edge PoPs, cache hierarchy, origin shielding, cache invalidation, and DNS-based routing.",
      },
    ],
    tipsAndTricks: [
      "Always start with requirements clarification and scope — Google interviewers reward structured thinking.",
      "Practice back-of-the-envelope math: estimate QPS, storage, bandwidth, and number of machines.",
      "Show awareness of Google-scale problems: billions of users, petabytes of data, global distribution.",
      "Discuss trade-offs explicitly — there is no single right answer, only well-reasoned ones.",
    ],
    difficulty: "very-hard",
    averageDuration: "45-60 minutes",
    interviewRounds: [
      "Phone screen (1 coding + 1 system design)",
      "On-site: 2 coding rounds",
      "On-site: 1 system design round",
      "On-site: 1 behavioral round (Googleyness & Leadership)",
    ],
    focusAreas: ["Scalability", "Distributed systems", "Data pipelines"],
    relatedConcepts: [
      "consistent-hashing",
      "sharding",
      "caching",
      "load-balancer",
      "message-queue",
    ],
  },
  {
    slug: "meta",
    name: "Meta",
    logo: "M",
    description:
      "Meta system design interviews focus on social graph problems, real-time feeds, messaging at scale, and infrastructure supporting billions of daily active users.",
    interviewStyle:
      "Meta interviews are fast-paced and product-oriented. Interviewers expect you to design end-to-end systems, emphasizing data modeling, API design, and scaling the social graph. Strong emphasis on moving fast while making sound technical decisions.",
    commonTopics: [
      "News feed ranking",
      "Social graph traversal",
      "Real-time messaging",
      "Photo/video storage",
      "Content moderation",
      "Live streaming",
    ],
    sampleQuestions: [
      {
        question: "Design Facebook News Feed",
        hint: "Cover fan-out-on-write vs fan-out-on-read, ranking models, real-time updates, and caching strategies.",
      },
      {
        question: "Design Instagram",
        hint: "Think about photo upload/storage, feed generation, stories, explore/discovery, and notification systems.",
      },
      {
        question: "Design Facebook Messenger",
        hint: "Address real-time messaging, read receipts, group chats, media sharing, and end-to-end encryption.",
      },
      {
        question: "Design a social graph service",
        hint: "Consider adjacency lists vs edge lists, graph partitioning, friend recommendations, and privacy controls.",
      },
      {
        question: "Design a live commenting system",
        hint: "Focus on WebSocket connections, message ordering, rate limiting, content moderation, and horizontal scaling.",
      },
    ],
    tipsAndTricks: [
      "Think product-first: understand user behavior before diving into architecture.",
      "Meta loves data-driven decisions — mention A/B testing and metrics collection.",
      "Be prepared to discuss trade-offs between consistency and availability for social features.",
      "Show familiarity with fan-out patterns and real-time data propagation.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (1 coding)",
      "On-site: 2 coding rounds",
      "On-site: 1 system design round",
      "On-site: 1 behavioral round",
    ],
    focusAreas: ["Social graph", "Real-time systems", "Feed ranking"],
    relatedConcepts: [
      "sharding",
      "caching",
      "message-queue",
      "event-driven-architecture",
      "cdn",
    ],
  },
  {
    slug: "amazon",
    name: "Amazon",
    logo: "A",
    description:
      "Amazon system design interviews prioritize availability, cost optimization, and service-oriented architecture. Expect deep dives into AWS-style distributed systems and Leadership Principles alignment.",
    interviewStyle:
      "Amazon interviews are uniquely tied to Leadership Principles. System design rounds test your ability to build highly available, cost-effective, and operationally excellent systems. You will be asked to justify every design choice through the lens of customer obsession and operational excellence.",
    commonTopics: [
      "E-commerce order pipeline",
      "Distributed key-value stores",
      "Service-oriented architecture",
      "Rate limiting & throttling",
      "Event-driven microservices",
      "Warehouse & logistics systems",
    ],
    sampleQuestions: [
      {
        question: "Design Amazon's order processing system",
        hint: "Cover order placement, payment processing, inventory management, fulfillment, and delivery tracking.",
      },
      {
        question: "Design a distributed key-value store (like DynamoDB)",
        hint: "Address consistent hashing, replication, conflict resolution (vector clocks), and tunable consistency.",
      },
      {
        question: "Design a rate limiter",
        hint: "Compare token bucket, sliding window, and leaky bucket algorithms. Discuss distributed rate limiting.",
      },
      {
        question: "Design an autocomplete / typeahead system",
        hint: "Think about trie data structures, prefix matching, ranking by popularity, and caching hot queries.",
      },
      {
        question: "Design a notification service",
        hint: "Cover push notifications, email, SMS, in-app notifications, templating, and delivery guarantees.",
      },
      {
        question: "Design a warehouse management system",
        hint: "Address inventory tracking, bin packing, pick-path optimization, and real-time stock updates.",
      },
    ],
    tipsAndTricks: [
      "Tie every design decision back to Amazon Leadership Principles — especially Customer Obsession and Bias for Action.",
      "Emphasize high availability and fault tolerance — Amazon targets 99.99%+ uptime.",
      "Show cost awareness: discuss instance types, reserved capacity, and storage tiers.",
      "Be ready to go deep on microservices patterns, as Amazon pioneered SOA.",
      "Prepare STAR-format stories for behavioral questions woven into design discussions.",
    ],
    difficulty: "hard",
    averageDuration: "45-60 minutes",
    interviewRounds: [
      "Online assessment (coding)",
      "Phone screen (1 coding + Leadership Principles)",
      "On-site loop: 4-5 rounds mixing system design, coding, and behavioral",
    ],
    focusAreas: [
      "High availability",
      "Cost optimization",
      "Service-oriented architecture",
    ],
    relatedConcepts: [
      "rate-limiting",
      "message-queue",
      "sharding",
      "event-driven-architecture",
      "circuit-breaker",
    ],
  },
  {
    slug: "apple",
    name: "Apple",
    logo: "A",
    description:
      "Apple system design interviews emphasize privacy-first architecture, on-device intelligence, and seamless cross-platform integration across the Apple ecosystem.",
    interviewStyle:
      "Apple interviews are secretive and team-specific. Expect deep technical questions about privacy-preserving systems, on-device vs cloud computation trade-offs, and tight integration between hardware and software. Interviewers value elegance and user experience.",
    commonTopics: [
      "On-device ML inference",
      "Privacy-preserving data collection",
      "Syncing across devices (iCloud)",
      "Push notification infrastructure",
      "Media streaming (Apple Music/TV+)",
      "End-to-end encryption",
    ],
    sampleQuestions: [
      {
        question: "Design iCloud sync for Notes",
        hint: "Consider CRDTs for conflict resolution, offline-first design, delta syncing, and end-to-end encryption.",
      },
      {
        question: "Design Apple Push Notification Service (APNs)",
        hint: "Address persistent connections, device tokens, priority levels, payload delivery, and failure handling.",
      },
      {
        question: "Design a privacy-preserving analytics system",
        hint: "Think about differential privacy, local aggregation, noise injection, and federated learning.",
      },
      {
        question: "Design Apple Music streaming",
        hint: "Cover audio encoding, adaptive bitrate streaming, offline downloads, cross-device handoff, and recommendations.",
      },
      {
        question: "Design Spotlight Search (on-device + cloud)",
        hint: "Consider local indexing, cloud search fallback, ranking, privacy boundaries, and real-time updates.",
      },
    ],
    tipsAndTricks: [
      "Privacy is non-negotiable at Apple — always consider on-device processing first.",
      "Demonstrate understanding of the Apple ecosystem and cross-device experiences.",
      "Show you can balance elegant UX with complex distributed systems underneath.",
      "Be prepared for deep dives into specific components rather than broad system overviews.",
    ],
    difficulty: "hard",
    averageDuration: "45-60 minutes",
    interviewRounds: [
      "Phone screen (coding + team-specific technical)",
      "On-site: 3-5 rounds (coding, system design, domain-specific, behavioral)",
      "Team-matching round",
    ],
    focusAreas: [
      "Privacy-first architecture",
      "On-device intelligence",
      "Cross-platform sync",
    ],
    relatedConcepts: [
      "replication",
      "event-driven-architecture",
      "caching",
      "cdn",
      "idempotency",
    ],
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    logo: "M",
    description:
      "Microsoft system design interviews focus on cloud infrastructure (Azure), enterprise-scale systems, collaboration tools, and developer platform design.",
    interviewStyle:
      "Microsoft interviews are team-specific and vary in style. System design rounds test your ability to architect cloud-native applications, enterprise SaaS products, and developer tools. Interviewers value clear communication, practical trade-offs, and awareness of enterprise requirements.",
    commonTopics: [
      "Cloud infrastructure (Azure)",
      "Real-time collaboration",
      "Identity & access management",
      "Distributed databases",
      "CI/CD pipelines",
      "Enterprise messaging",
    ],
    sampleQuestions: [
      {
        question: "Design Microsoft Teams",
        hint: "Cover real-time messaging, video conferencing, file sharing, presence indicators, and multi-tenant architecture.",
      },
      {
        question: "Design OneDrive file sync",
        hint: "Address conflict resolution, chunked uploads, deduplication, version history, and cross-platform clients.",
      },
      {
        question: "Design Azure Blob Storage",
        hint: "Think about data partitioning, replication, storage tiers (hot/cool/archive), and multi-region redundancy.",
      },
      {
        question: "Design a CI/CD pipeline system",
        hint: "Consider build agents, artifact storage, pipeline DAGs, parallelism, caching, and rollback strategies.",
      },
      {
        question: "Design an identity provider (like Azure AD)",
        hint: "Cover OAuth 2.0, SAML, MFA, token lifecycle, federated identity, and zero-trust architecture.",
      },
    ],
    tipsAndTricks: [
      "Show awareness of enterprise requirements: multi-tenancy, compliance, SLAs, and data residency.",
      "Microsoft values growth mindset — be open about what you do not know and reason through it.",
      "Discuss Azure services where relevant, but focus on fundamental distributed systems concepts.",
      "Be prepared for team-specific deep dives tailored to the product area you are interviewing for.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (1 coding)",
      "On-site: 3-4 rounds (coding, system design, behavioral)",
      "As-appropriate interview with hiring manager",
    ],
    focusAreas: [
      "Cloud-native architecture",
      "Enterprise SaaS",
      "Real-time collaboration",
    ],
    relatedConcepts: [
      "load-balancer",
      "sharding",
      "api-gateway",
      "replication",
      "distributed-locking",
    ],
  },
  {
    slug: "netflix",
    name: "Netflix",
    logo: "N",
    description:
      "Netflix system design interviews center on streaming infrastructure, content delivery, microservices resilience, and recommendation systems operating at global scale.",
    interviewStyle:
      "Netflix interviews reflect their culture of freedom and responsibility. Expect open-ended problems where you drive the entire design process. Interviewers value strong opinions loosely held, deep understanding of distributed systems, and awareness of chaos engineering principles.",
    commonTopics: [
      "Video streaming & adaptive bitrate",
      "Content delivery networks",
      "Recommendation engines",
      "Microservices resilience",
      "Chaos engineering",
      "A/B testing at scale",
    ],
    sampleQuestions: [
      {
        question: "Design Netflix streaming service",
        hint: "Cover video transcoding pipeline, adaptive bitrate streaming (ABR), CDN architecture, and client-side buffering.",
      },
      {
        question: "Design a recommendation engine",
        hint: "Think about collaborative filtering, content-based filtering, real-time personalization, and A/B testing.",
      },
      {
        question: "Design a chaos engineering platform (like Chaos Monkey)",
        hint: "Address fault injection, blast radius control, steady-state metrics, and automated rollback.",
      },
      {
        question: "Design a content delivery network",
        hint: "Cover edge caching, origin servers, cache fill strategies, DNS-based routing, and cache invalidation.",
      },
      {
        question: "Design Netflix's microservices gateway",
        hint: "Think about API gateway, circuit breakers, bulkheads, retry policies, and service mesh.",
      },
    ],
    tipsAndTricks: [
      "Netflix values senior-level thinking — own the problem space and propose creative solutions.",
      "Demonstrate understanding of resilience patterns: circuit breakers, bulkheads, and graceful degradation.",
      "Show awareness of CDN architecture and how Netflix serves video globally with minimal buffering.",
      "Discuss data-driven decision making and experimentation infrastructure.",
    ],
    difficulty: "very-hard",
    averageDuration: "60 minutes",
    interviewRounds: [
      "Phone screen (technical deep dive)",
      "On-site: 4-6 rounds (system design heavy, coding, culture fit)",
    ],
    focusAreas: [
      "Streaming infrastructure",
      "CDN & content delivery",
      "Microservices resilience",
    ],
    relatedConcepts: [
      "cdn",
      "circuit-breaker",
      "caching",
      "load-balancer",
      "rate-limiting",
    ],
  },
  // ── Growth-stage / Specialized ────────────────────────────────
  {
    slug: "uber",
    name: "Uber",
    logo: "U",
    description:
      "Uber system design interviews focus on real-time geospatial systems, matching algorithms, dynamic pricing, and high-throughput event processing for ride-sharing and delivery platforms.",
    interviewStyle:
      "Uber interviews test your ability to design latency-sensitive, geospatially-aware systems. Interviewers expect strong knowledge of location-based services, real-time data processing, and handling massive concurrent state. Questions often involve multi-sided marketplaces.",
    commonTopics: [
      "Ride matching & dispatch",
      "Geospatial indexing",
      "Dynamic pricing / surge",
      "ETA estimation",
      "Real-time location tracking",
      "Payment processing",
    ],
    sampleQuestions: [
      {
        question: "Design Uber's ride matching system",
        hint: "Cover geospatial indexing (geohash/S2), driver-rider matching, dispatch optimization, and real-time updates.",
      },
      {
        question: "Design a surge pricing system",
        hint: "Think about supply/demand detection, pricing models, geographic zones, and fairness constraints.",
      },
      {
        question: "Design Uber Eats delivery platform",
        hint: "Address restaurant discovery, order routing, delivery ETA, batching orders, and multi-hop delivery.",
      },
      {
        question: "Design a real-time location tracking service",
        hint: "Consider GPS data ingestion, geospatial databases, map matching, and efficient location updates at scale.",
      },
      {
        question: "Design an ETA prediction service",
        hint: "Cover historical data, real-time traffic, graph-based routing, ML models, and caching precomputed routes.",
      },
      {
        question: "Design a payment splitting system",
        hint: "Address multi-party payments, currency conversion, fraud detection, and eventual consistency.",
      },
    ],
    tipsAndTricks: [
      "Master geospatial concepts: geohashing, quadtrees, S2 cells, and spatial indexing.",
      "Show understanding of real-time stream processing for location updates at millions of events per second.",
      "Discuss marketplace dynamics and how supply/demand imbalances affect system design.",
      "Be prepared to estimate latency budgets for time-critical operations like ride matching.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (1 coding)",
      "On-site: 2 coding, 1 system design, 1 behavioral",
    ],
    focusAreas: [
      "Geospatial systems",
      "Real-time matching",
      "Dynamic pricing",
    ],
    relatedConcepts: [
      "consistent-hashing",
      "message-queue",
      "sharding",
      "rate-limiting",
      "load-balancer",
    ],
  },
  {
    slug: "airbnb",
    name: "Airbnb",
    logo: "A",
    description:
      "Airbnb system design interviews emphasize search and ranking, payments, trust and safety systems, and building marketplace platforms that connect hosts and guests globally.",
    interviewStyle:
      "Airbnb interviews are cross-functional and values-driven. System design rounds focus on marketplace dynamics, search relevance, and trust/safety systems. Interviewers value candidates who think about the full user journey and can balance technical excellence with product intuition.",
    commonTopics: [
      "Search & ranking",
      "Pricing optimization",
      "Booking & reservation systems",
      "Trust & safety / fraud detection",
      "Payment processing",
      "Geospatial search",
    ],
    sampleQuestions: [
      {
        question: "Design Airbnb's search and ranking system",
        hint: "Cover geospatial filtering, relevance scoring, personalization, availability calendars, and search indexing.",
      },
      {
        question: "Design a booking/reservation system",
        hint: "Address double-booking prevention, calendar management, cancellation policies, and distributed transactions.",
      },
      {
        question: "Design Airbnb's pricing recommendation engine",
        hint: "Think about dynamic pricing models, seasonality, comparable listings, and host pricing tools.",
      },
      {
        question: "Design a trust and safety platform",
        hint: "Cover identity verification, review systems, fraud detection, content moderation, and risk scoring.",
      },
      {
        question: "Design Airbnb's payment system",
        hint: "Address multi-currency support, escrow, payouts to hosts, refunds, and payment provider integration.",
      },
    ],
    tipsAndTricks: [
      "Think like a marketplace designer — balance the needs of both hosts and guests.",
      "Airbnb values belonging — show empathy for users in your design decisions.",
      "Be prepared for cross-functional discussions that blend product, design, and engineering.",
      "Discuss how search quality directly impacts marketplace health and revenue.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (coding)",
      "On-site: 2 coding, 1 system design, 1 cross-functional, 1 values interview",
    ],
    focusAreas: [
      "Search & ranking",
      "Marketplace platforms",
      "Trust & safety",
    ],
    relatedConcepts: [
      "sharding",
      "caching",
      "rate-limiting",
      "distributed-locking",
      "event-driven-architecture",
    ],
  },
  {
    slug: "stripe",
    name: "Stripe",
    logo: "S",
    description:
      "Stripe system design interviews focus on payment infrastructure, API design, financial data consistency, and building reliable developer platforms that handle money at scale.",
    interviewStyle:
      "Stripe interviews are highly technical with an emphasis on correctness. Interviewers expect meticulous attention to data consistency, idempotency, and failure handling. API design quality is paramount — Stripe built its reputation on developer experience.",
    commonTopics: [
      "Payment processing pipelines",
      "API design & versioning",
      "Idempotency & exactly-once semantics",
      "Fraud detection",
      "Ledger & accounting systems",
      "Webhook delivery",
    ],
    sampleQuestions: [
      {
        question: "Design a payment processing system",
        hint: "Cover authorization, capture, settlement, refunds, idempotency keys, and PCI compliance.",
      },
      {
        question: "Design a webhook delivery system",
        hint: "Think about at-least-once delivery, retry with exponential backoff, ordering, and endpoint health monitoring.",
      },
      {
        question: "Design a fraud detection system",
        hint: "Address real-time risk scoring, rule engines, ML models, manual review queues, and false positive handling.",
      },
      {
        question: "Design an API rate limiter for a developer platform",
        hint: "Cover per-key limits, distributed counting, burst handling, graceful degradation, and usage dashboards.",
      },
      {
        question: "Design a double-entry ledger system",
        hint: "Think about immutable transaction logs, account balances, reconciliation, and audit trails.",
      },
      {
        question: "Design Stripe's API versioning system",
        hint: "Address backward compatibility, version pinning, deprecation policies, and changelog generation.",
      },
    ],
    tipsAndTricks: [
      "Correctness over performance — in financial systems, losing or duplicating a transaction is unacceptable.",
      "Demonstrate deep understanding of idempotency and exactly-once processing.",
      "Show you can design beautiful, developer-friendly APIs with clear contracts.",
      "Discuss failure modes in detail: what happens when a payment provider times out mid-transaction?",
      "Be prepared to write code during system design to illustrate API contracts.",
    ],
    difficulty: "very-hard",
    averageDuration: "60 minutes",
    interviewRounds: [
      "Phone screen (coding + API design)",
      "On-site: 2 coding, 1 system design, 1 integration design, 1 collaboration",
    ],
    focusAreas: [
      "Payment infrastructure",
      "API design",
      "Data consistency & correctness",
    ],
    relatedConcepts: [
      "idempotency",
      "distributed-locking",
      "event-driven-architecture",
      "rate-limiting",
      "message-queue",
    ],
  },
  {
    slug: "twitter",
    name: "Twitter / X",
    logo: "X",
    description:
      "Twitter/X system design interviews focus on real-time content distribution, timeline generation, trending algorithms, and operating a high-write-throughput social platform.",
    interviewStyle:
      "Twitter/X interviews emphasize real-time systems and high fan-out architectures. Interviewers test your ability to handle write-heavy workloads, timeline assembly, and content ranking. Expect questions about infrastructure supporting viral content and rapid information spread.",
    commonTopics: [
      "Timeline generation & fan-out",
      "Tweet ingestion pipeline",
      "Trending topics detection",
      "Search & indexing",
      "URL shortening",
      "Content moderation at scale",
    ],
    sampleQuestions: [
      {
        question: "Design Twitter's home timeline",
        hint: "Compare fan-out-on-write vs fan-out-on-read, handle celebrity accounts differently, and discuss ranking.",
      },
      {
        question: "Design a trending topics system",
        hint: "Think about sliding window counters, heavy hitters detection, geographic segmentation, and spam filtering.",
      },
      {
        question: "Design a URL shortener",
        hint: "Cover hash generation, collision handling, analytics tracking, custom aliases, and redirect latency.",
      },
      {
        question: "Design Twitter Search",
        hint: "Address real-time indexing, inverted indices, relevance ranking, and early termination for fresh results.",
      },
      {
        question: "Design a tweet ingestion and delivery pipeline",
        hint: "Cover write path, fanout service, notification triggers, media processing, and delivery guarantees.",
      },
    ],
    tipsAndTricks: [
      "Understand the fan-out problem deeply — it is the core architectural challenge of timeline systems.",
      "Be ready to handle the celebrity follower problem (accounts with millions of followers).",
      "Discuss trade-offs between real-time delivery and eventual consistency.",
      "Show awareness of content moderation challenges at the speed of viral content.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (1 coding)",
      "On-site: 2 coding, 1-2 system design, 1 behavioral",
    ],
    focusAreas: [
      "Real-time content delivery",
      "Fan-out architecture",
      "Trending & ranking",
    ],
    relatedConcepts: [
      "message-queue",
      "caching",
      "sharding",
      "rate-limiting",
      "consistent-hashing",
    ],
  },
  {
    slug: "linkedin",
    name: "LinkedIn",
    logo: "L",
    description:
      "LinkedIn system design interviews center on professional network graph, feed ranking, search, and messaging systems for the world's largest professional networking platform.",
    interviewStyle:
      "LinkedIn interviews focus on social graph systems, enterprise search, and recommendation algorithms. Interviewers value candidates who can design for professional context — balancing relevance, privacy, and engagement across a complex social graph with companies, jobs, and skills.",
    commonTopics: [
      "Professional graph & connections",
      "Feed ranking & personalization",
      "Job search & matching",
      "Messaging systems",
      "Skill endorsement & recommendations",
      "Profile search & indexing",
    ],
    sampleQuestions: [
      {
        question: "Design LinkedIn's feed ranking system",
        hint: "Cover content scoring, engagement prediction, connection strength signals, and real-time updates.",
      },
      {
        question: "Design a people-you-may-know recommendation engine",
        hint: "Think about graph traversal (2nd/3rd degree connections), shared attributes, and ranking by relevance.",
      },
      {
        question: "Design LinkedIn's job search and matching",
        hint: "Address skill extraction, semantic search, matching algorithms, and notification-based job alerts.",
      },
      {
        question: "Design LinkedIn Messaging",
        hint: "Cover real-time delivery, InMail credits, group conversations, read receipts, and spam detection.",
      },
      {
        question: "Design a connection degree calculation service",
        hint: "Think about BFS on the social graph, precomputation, caching, and graph partitioning strategies.",
      },
    ],
    tipsAndTricks: [
      "LinkedIn is graph-heavy — be comfortable with graph data models and traversal algorithms.",
      "Show understanding of how professional context differs from social context in ranking.",
      "Discuss the interplay between LinkedIn's different entity types: people, companies, jobs, skills.",
      "Be prepared for questions about data privacy and GDPR compliance in your designs.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (1 coding)",
      "On-site: 2 coding, 1 system design, 1 behavioral",
    ],
    focusAreas: [
      "Professional network graph",
      "Search & matching",
      "Feed personalization",
    ],
    relatedConcepts: [
      "sharding",
      "caching",
      "message-queue",
      "load-balancer",
      "api-gateway",
    ],
  },
  {
    slug: "spotify",
    name: "Spotify",
    logo: "S",
    description:
      "Spotify system design interviews emphasize audio streaming, music recommendation, playlist management, and building personalized listening experiences at scale.",
    interviewStyle:
      "Spotify interviews are collaborative and product-minded. Interviewers expect you to design systems that enhance the music listening experience. Strong emphasis on recommendation algorithms, audio delivery, and understanding user behavior patterns in a content consumption platform.",
    commonTopics: [
      "Audio streaming & codec selection",
      "Music recommendation (Discover Weekly)",
      "Playlist management",
      "Podcast infrastructure",
      "Offline mode & caching",
      "Collaborative playlists",
    ],
    sampleQuestions: [
      {
        question: "Design Spotify's music streaming service",
        hint: "Cover audio encoding, adaptive streaming, client-side caching, offline mode, and cross-device playback.",
      },
      {
        question: "Design Spotify's Discover Weekly",
        hint: "Think about collaborative filtering, audio feature analysis, user listening history, and weekly batch pipeline.",
      },
      {
        question: "Design a playlist service",
        hint: "Address CRUD operations, collaborative editing, ordering, deduplication, and playlist recommendations.",
      },
      {
        question: "Design Spotify Wrapped (year-in-review)",
        hint: "Consider data aggregation pipeline, batch processing, personalized content generation, and viral sharing.",
      },
      {
        question: "Design a music search engine",
        hint: "Cover full-text search, fuzzy matching, autocomplete, lyric search, and audio fingerprinting (like Shazam).",
      },
    ],
    tipsAndTricks: [
      "Understand audio streaming fundamentals: codecs, bitrate adaptation, and buffering strategies.",
      "Spotify's squad model means cross-functional thinking is valued — consider the full product experience.",
      "Demonstrate knowledge of both real-time (streaming) and batch (Discover Weekly) processing patterns.",
      "Discuss how to handle the long tail of content — most songs are rarely played.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (coding)",
      "On-site: 2 coding, 1 system design, 1 values/culture fit",
    ],
    focusAreas: [
      "Audio streaming",
      "Recommendation systems",
      "Content personalization",
    ],
    relatedConcepts: [
      "cdn",
      "caching",
      "message-queue",
      "consistent-hashing",
      "event-driven-architecture",
    ],
  },
  {
    slug: "dropbox",
    name: "Dropbox",
    logo: "D",
    description:
      "Dropbox system design interviews focus on file synchronization, storage systems, conflict resolution, and building reliable cloud storage infrastructure at scale.",
    interviewStyle:
      "Dropbox interviews go deep into file storage and sync problems. Interviewers expect detailed knowledge of chunking, deduplication, delta sync, and conflict resolution. Questions often start simple (design a file storage system) and progressively add complexity.",
    commonTopics: [
      "File chunking & deduplication",
      "Delta synchronization",
      "Conflict resolution (OT / CRDTs)",
      "Block storage systems",
      "Sharing & permissions",
      "Desktop client architecture",
    ],
    sampleQuestions: [
      {
        question: "Design Dropbox file sync",
        hint: "Cover file chunking, content-addressable storage, delta sync, conflict resolution, and notification of changes.",
      },
      {
        question: "Design a file sharing system with permissions",
        hint: "Think about access control lists, link sharing, team folders, permission inheritance, and audit logging.",
      },
      {
        question: "Design a block storage system",
        hint: "Address content-addressable storage, deduplication, replication, garbage collection, and storage tiers.",
      },
      {
        question: "Design collaborative document editing (like Dropbox Paper)",
        hint: "Cover operational transformation or CRDTs, real-time cursors, version history, and offline support.",
      },
      {
        question: "Design a file search service",
        hint: "Think about metadata indexing, full-text search for documents, OCR for images, and real-time index updates.",
      },
    ],
    tipsAndTricks: [
      "Master file chunking and content-addressable storage — these are core to Dropbox's architecture.",
      "Be ready to discuss conflict resolution strategies in detail (last-write-wins vs merge).",
      "Show understanding of bandwidth optimization: delta sync, compression, and deduplication.",
      "Discuss desktop client architecture and how to efficiently watch for file system changes.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (coding)",
      "On-site: 2 coding, 1 system design, 1 behavioral",
    ],
    focusAreas: [
      "File synchronization",
      "Storage systems",
      "Conflict resolution",
    ],
    relatedConcepts: [
      "replication",
      "consistent-hashing",
      "idempotency",
      "caching",
      "sharding",
    ],
  },
  {
    slug: "pinterest",
    name: "Pinterest",
    logo: "P",
    description:
      "Pinterest system design interviews emphasize visual search, content discovery, recommendation systems, and building an image-heavy platform with strong personalization.",
    interviewStyle:
      "Pinterest interviews focus on image processing, visual search, and recommendation at scale. Interviewers value candidates who understand how to combine computer vision with traditional information retrieval to build engaging visual discovery experiences.",
    commonTopics: [
      "Visual search & image similarity",
      "Pin feed & recommendation",
      "Image processing pipeline",
      "Content discovery & explore",
      "Ad serving & targeting",
      "Shopping & product pins",
    ],
    sampleQuestions: [
      {
        question: "Design Pinterest's home feed",
        hint: "Cover pin ranking, personalization, diversity (avoiding repetitive content), and infinite scroll pagination.",
      },
      {
        question: "Design a visual search system (search by image)",
        hint: "Think about image embeddings, nearest-neighbor search (ANN), feature extraction, and indexing at scale.",
      },
      {
        question: "Design Pinterest's image processing pipeline",
        hint: "Address upload, thumbnail generation, multiple resolutions, object detection, and content safety scanning.",
      },
      {
        question: "Design a related pins recommendation engine",
        hint: "Cover collaborative filtering, visual similarity, engagement signals, and diversity in recommendations.",
      },
      {
        question: "Design Pinterest's ad serving system",
        hint: "Think about targeting, real-time bidding, relevance scoring, budget pacing, and conversion tracking.",
      },
    ],
    tipsAndTricks: [
      "Pinterest is fundamentally a visual discovery engine — show understanding of image-based systems.",
      "Discuss embedding-based similarity search and approximate nearest neighbor (ANN) algorithms.",
      "Be prepared to talk about the intersection of ML and systems: feature stores, model serving, and A/B testing.",
      "Understand how visual content changes storage, bandwidth, and processing requirements compared to text.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (coding)",
      "On-site: 2 coding, 1 system design, 1 behavioral",
    ],
    focusAreas: [
      "Visual search",
      "Content recommendation",
      "Image processing pipeline",
    ],
    relatedConcepts: [
      "cdn",
      "caching",
      "sharding",
      "message-queue",
      "event-driven-architecture",
    ],
  },
  {
    slug: "snap",
    name: "Snap",
    logo: "S",
    description:
      "Snap system design interviews focus on ephemeral messaging, augmented reality infrastructure, Stories architecture, and real-time media processing for a camera-first platform.",
    interviewStyle:
      "Snap interviews emphasize real-time media systems and ephemeral content delivery. Interviewers expect knowledge of camera/AR pipelines, short-lived storage, and media processing at scale. Creativity and mobile-first thinking are highly valued.",
    commonTopics: [
      "Ephemeral messaging & stories",
      "AR lens / filter pipeline",
      "Real-time video processing",
      "Snap Map (location sharing)",
      "Media encoding & delivery",
      "Discover content platform",
    ],
    sampleQuestions: [
      {
        question: "Design Snapchat Stories",
        hint: "Cover ephemeral storage with TTL, story assembly, media encoding, view tracking, and geographic stories.",
      },
      {
        question: "Design Snap Map (real-time location sharing)",
        hint: "Think about location updates, heat maps, Bitmoji rendering, privacy modes, and geospatial aggregation.",
      },
      {
        question: "Design an AR lens platform",
        hint: "Address lens distribution, on-device rendering, face tracking, lens creation tools, and performance budgets.",
      },
      {
        question: "Design a chat system with ephemeral messages",
        hint: "Cover message lifecycle, auto-deletion, read receipts, media attachments, and encryption.",
      },
      {
        question: "Design Snap's Discover content platform",
        hint: "Think about publisher content ingestion, ad insertion, content ranking, and engagement analytics.",
      },
    ],
    tipsAndTricks: [
      "Snap is camera-first — think about media processing, AR, and visual communication.",
      "Understand ephemeral storage patterns: TTL-based deletion, soft deletes, and compliance requirements.",
      "Show mobile-first design thinking — consider battery life, network conditions, and on-device processing.",
      "Be prepared to discuss real-time media pipelines and the trade-offs between quality and latency.",
    ],
    difficulty: "hard",
    averageDuration: "45 minutes",
    interviewRounds: [
      "Phone screen (coding)",
      "On-site: 2 coding, 1 system design, 1 behavioral",
    ],
    focusAreas: [
      "Ephemeral content",
      "AR infrastructure",
      "Real-time media processing",
    ],
    relatedConcepts: [
      "cdn",
      "message-queue",
      "caching",
      "event-driven-architecture",
      "rate-limiting",
    ],
  },
];

// ── Helper functions ────────────────────────────────────────────────

/** Look up a company by slug. */
export function getCompanyBySlug(slug: string): CompanyDefinition | undefined {
  return COMPANIES.find((c) => c.slug === slug);
}

/** Return all company slugs for static generation. */
export function getAllCompanySlugs(): string[] {
  return COMPANIES.map((c) => c.slug);
}
