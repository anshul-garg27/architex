// ---------------------------------------------------------------------------
// i18n String Extraction — User-Facing Strings
// ---------------------------------------------------------------------------
// All user-facing strings organized by section for future i18n integration.
// Components are NOT yet wired to consume these — this file serves as the
// single source of truth for translation readiness.
// ---------------------------------------------------------------------------

export const strings = {
  // ── Common / Shared ─────────────────────────────────────────
  common: {
    appName: 'Architex',
    tagline: 'Interactive Engineering Laboratory',
    getStarted: 'Get Started',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    loading: 'Loading...',
    noResults: 'No results found.',
    learnMore: 'Learn More',
    viewDemo: 'View Demo',
    goToDashboard: 'Go to Dashboard',
    browseModules: 'Browse Modules',
  },

  // ── Landing Page ────────────────────────────────────────────
  landing: {
    heroBadge: 'Interactive Engineering Laboratory',
    heroTitle: 'Build, break, and master system architectures through interactive simulation.',
    heroSubtitle:
      'The interactive engineering laboratory where architectures breathe, algorithms animate, and systems fail gracefully under chaos.',
    ctaPrimary: 'Start Building Free',
    ctaSecondary: 'View Demo',
    cliSnippet: 'architex simulate --arch microservices --chaos-level medium',

    // Navigation
    navFeatures: 'Features',
    navHowItWorks: 'How It Works',
    navPricing: 'Pricing',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',

    // Modules Section
    modulesSectionTitle: '12 Interactive Modules',
    modulesSectionSubtitle:
      'From system design to interview prep — each module is a hands-on, visual learning experience.',

    // How It Works
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle: 'Three steps to mastery.',
    step1Title: 'Pick a Challenge',
    step1Description:
      'Choose from 30+ system design problems, algorithm challenges, or data structure exercises tailored to your level.',
    step2Title: 'Build & Visualize',
    step2Description:
      'Drag components onto the canvas, run simulations, and watch data flow through your architecture in real time.',
    step3Title: 'Get Feedback',
    step3Description:
      'AI-powered evaluation scores your design across 6 dimensions: scalability, reliability, cost, latency, security, and maintainability.',

    // Stats
    statsAlgorithms: 'Algorithms',
    statsTemplates: 'Architecture Templates',
    statsModules: 'Interactive Modules',
    statsSorting: 'Sorting & Graph Algorithms',

    // Footer
    footerProduct: 'Product',
    footerResources: 'Resources',
    footerCompany: 'Company',
    footerLegal: 'Legal',
    footerFeatures: 'Features',
    footerPricing: 'Pricing',
    footerDocumentation: 'Documentation',
    footerTutorials: 'Tutorials',
    footerBlog: 'Blog',
    footerContact: 'Contact',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Service',
    footerCopyright: 'Architex. Built for engineers who think in systems.',
  },

  // ── Dashboard ───────────────────────────────────────────────
  dashboard: {
    pageTitle: 'Dashboard',
    welcomeBack: 'Welcome back',
    continueLeaning: 'Continue where you left off',
    recentActivity: 'Recent Activity',
    quickStart: 'Quick Start',
    modulesOverview: 'Modules Overview',
    yourProgress: 'Your Progress',
    streak: 'Day Streak',
    totalTime: 'Total Time',
    completedChallenges: 'Completed Challenges',
    startModule: 'Start Module',
  },

  // ── Modules ─────────────────────────────────────────────────
  modules: {
    systemDesign: 'System Design',
    systemDesignDesc:
      'Drag-and-drop architecture canvas with live simulations. Build scalable systems visually.',
    algorithms: 'Algorithms',
    algorithmsDesc:
      '26+ sorting and graph algorithms with step-by-step visualization and complexity analysis.',
    dataStructures: 'Data Structures',
    dataStructuresDesc:
      'Interactive trees, graphs, heaps, and hash maps. Watch operations animate in real time.',
    lld: 'Low-Level Design',
    lldDesc:
      'Class diagrams, design patterns, and SOLID principles with interactive UML tooling.',
    database: 'Database',
    databaseDesc:
      'SQL query visualization, indexing strategies, sharding patterns, and replication topologies.',
    distributed: 'Distributed Systems',
    distributedDesc:
      'Consensus protocols, CAP theorem explorer, and fault injection with chaos engineering.',
    networking: 'Networking',
    networkingDesc:
      'TCP/IP stack visualization, DNS resolution, HTTP lifecycle, and load balancing strategies.',
    os: 'OS Concepts',
    osDesc:
      'Process scheduling, memory management, file systems, and virtual memory simulation.',
    concurrency: 'Concurrency',
    concurrencyDesc:
      'Thread synchronization, deadlock detection, lock-free structures, and race condition demos.',
    security: 'Security',
    securityDesc:
      'Authentication flows, encryption algorithms, OWASP vulnerabilities, and TLS handshake animation.',
    mlDesign: 'ML Design',
    mlDesignDesc:
      'ML system architecture, feature stores, model serving, A/B testing, and pipeline design.',
    interview: 'Interview Prep',
    interviewDesc:
      'Timed mock interviews with AI scoring across 6 dimensions. Spaced repetition for mastery.',
    knowledgeGraph: 'Knowledge Graph',
  },

  // ── Settings ────────────────────────────────────────────────
  settings: {
    pageTitle: 'Settings',
    backToCanvas: 'Back to canvas',
    sectionAppearance: 'Appearance',
    sectionSound: 'Sound',
    sectionAccessibility: 'Accessibility',
    sectionKeyboardShortcuts: 'Keyboard Shortcuts',
    sectionDataManagement: 'Data Management',

    // Appearance
    themeLabel: 'Theme',
    themeDescription: 'Select the visual theme for the application.',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeSystem: 'System',
    fontSizeLabel: 'Font Size',
    fontSizeSmall: 'Small',
    fontSizeMedium: 'Medium',
    fontSizeLarge: 'Large',

    // Sound
    soundEffects: 'Sound Effects',
    soundDescription: 'Play audio feedback for simulation events and interactions.',

    // Accessibility
    reduceAnimations: 'Reduce Animations',
    reduceAnimationsDescription:
      'Minimize motion effects for users with motion sensitivity.',
    osSettingDetected: 'OS setting detected',
    toolbarOverride: 'Toolbar override',

    // Data Management
    exportData: 'Export Data',
    exportDescription: 'Download all your designs and settings as a JSON file.',
    importData: 'Import Data',
    importDescription: 'Restore designs and settings from a previously exported file.',
    clearData: 'Clear All Data',
    clearDataDescription:
      'Permanently delete all saved designs, templates, and preferences. This cannot be undone.',
    clearDataConfirmTitle: 'Clear All Data',
    clearDataConfirmDescription:
      'This will permanently delete all your data. Are you sure?',
  },

  // ── Pricing ─────────────────────────────────────────────────
  pricing: {
    pageTitle: 'Plans for Every Engineer',
    pageSubtitle:
      'Choose the plan that fits your learning journey. Start free, upgrade anytime.',
    monthlyLabel: 'Monthly',
    annualLabel: 'Annual',
    annualDiscount: 'Save 20%',
    perMonth: '/month',
    perSeatPerMonth: '/seat/month',
    forever: 'forever',
    popular: 'Most Popular',
    currentPlan: 'Current Plan',

    // Tiers
    freeName: 'Free',
    freeDescription: 'Get started with system design fundamentals.',
    freeCta: 'Get Started',
    proName: 'Pro',
    proDescription: 'Unlock the full learning experience.',
    proCta: 'Upgrade to Pro',
    teamName: 'Team',
    teamDescription: 'Collaborative learning for engineering teams.',
    teamCta: 'Contact Sales',

    // Feature comparison
    comparisonTitle: 'Compare Plans',
    simulations: 'Simulations / month',
    templates: 'Templates',
    aiHints: 'AI hints',
    prioritySupport: 'Priority support',
    exportPdf: 'Export to PDF',
    chaosEngineering: 'Chaos engineering',
    customNodes: 'Custom node definitions',
    performanceAnalytics: 'Performance analytics',
    collaboration: 'Collaboration',
    sharedWorkspaces: 'Shared workspaces',
    adminDashboard: 'Admin dashboard',
    ssoIntegration: 'SSO / SAML integration',
    dedicatedSupport: 'Dedicated support',

    // FAQ
    faqTitle: 'Frequently Asked Questions',
  },

  // ── Canvas / Workspace ──────────────────────────────────────
  canvas: {
    commandPalettePlaceholder: 'Type a command or search...',
    commandPaletteLabel: 'Command palette',
    clearCanvas: 'Clear Canvas',
    clearCanvasDescription:
      'This will remove all nodes and edges. This action cannot be undone.',
    exportDiagram: 'Export Diagram',
    importDiagram: 'Import Diagram',
    browseTemplates: 'Browse Templates',
    browsePlaybooks: 'Browse Playbooks',
    keyboardShortcuts: 'Keyboard Shortcuts',
    capacityCalculator: 'Capacity Calculator',
    toggleSidebar: 'Toggle Sidebar',
    toggleBottomPanel: 'Toggle Bottom Panel',
    togglePropertiesPanel: 'Toggle Properties Panel',
    startSimulation: 'Start Simulation',
    pauseSimulation: 'Pause Simulation',
    stopSimulation: 'Stop Simulation',
    resetSimulation: 'Reset Simulation',
  },

  // ── 404 ─────────────────────────────────────────────────────
  notFound: {
    heading: '404',
    message: "This page doesn't exist or has been moved.",
    ctaDashboard: 'Go to Dashboard',
    ctaModules: 'Browse Modules',
  },

  // ── Simulation State Labels ─────────────────────────────────
  nodeStates: {
    idle: 'Idle',
    active: 'Active',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    processing: 'Processing',
  },

  // ── Edge Type Labels ────────────────────────────────────────
  edgeTypes: {
    http: 'HTTP',
    grpc: 'gRPC',
    graphql: 'GraphQL',
    websocket: 'WebSocket',
    messageQueue: 'Message Queue',
    eventStream: 'Event Stream',
    dbQuery: 'DB Query',
    cacheLookup: 'Cache Lookup',
    replication: 'Replication',
  },
} as const;

/** Type helper for accessing nested string keys. */
export type StringSection = keyof typeof strings;
export type StringKey<S extends StringSection> = keyof (typeof strings)[S];
