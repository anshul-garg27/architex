/**
 * Grading Engine -- rubric-based auto-grading for LLD diagrams.
 *
 * Pure function: takes user diagram + reference + problem metadata
 * and returns a GradingResult. No side effects, fully testable.
 *
 * Grading categories:
 *   1. Required Classes (40 points)   -- fuzzy name matching
 *   2. Relationships (30 points)      -- type-aware matching
 *   3. Pattern Usage (20 points)      -- heuristic pattern detection
 *   4. Completeness (10 points)       -- structural quality checks
 */

import type { UMLClass, UMLRelationship, UMLRelationshipType } from "./types";

// ── Result types ────────────────────────────────────────────

export interface GradingResult {
  totalScore: number; // 0-100
  categories: GradingCategory[];
}

export interface GradingCategory {
  name: string;
  score: number; // 0-100
  maxPoints: number;
  earnedPoints: number;
  items: GradingItem[];
}

export interface GradingItem {
  description: string;
  passed: boolean;
  points: number;
  feedback: string;
}

// ── Input types ─────────────────────────────────────────────

export interface GradingInput {
  /** The user's current canvas diagram */
  userClasses: UMLClass[];
  userRelationships: UMLRelationship[];
  /** The reference solution */
  referenceClasses: UMLClass[];
  referenceRelationships: UMLRelationship[];
  /** Patterns the problem expects to see */
  keyPatterns: string[];
}

// ── String normalization ────────────────────────────────────

/** Normalize a class name for fuzzy matching. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_\s]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Levenshtein distance between two strings.
 * Used for fuzzy class name matching.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row optimization for memory
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Check if two class names are a fuzzy match.
 * Match criteria: exact normalized match OR Levenshtein distance < 3.
 */
function isFuzzyMatch(nameA: string, nameB: string): boolean {
  const normA = normalize(nameA);
  const normB = normalize(nameB);

  if (normA === normB) return true;

  // Only use Levenshtein for reasonably similar lengths
  if (Math.abs(normA.length - normB.length) > 3) return false;

  return levenshtein(normA, normB) < 3;
}

/**
 * Find the best matching user class for a reference class.
 * Returns the user class or null if no match found.
 */
function findMatchingClass(
  refClass: UMLClass,
  userClasses: UMLClass[],
  alreadyMatched: Set<string>,
): UMLClass | null {
  for (const uc of userClasses) {
    if (alreadyMatched.has(uc.id)) continue;
    if (isFuzzyMatch(refClass.name, uc.name)) {
      return uc;
    }
  }
  return null;
}

// ── Category 1: Required Classes (40 pts) ───────────────────

function gradeRequiredClasses(
  userClasses: UMLClass[],
  referenceClasses: UMLClass[],
): { category: GradingCategory; classMap: Map<string, string> } {
  const MAX_POINTS = 40;
  const items: GradingItem[] = [];
  const classMap = new Map<string, string>(); // refId -> userId
  const alreadyMatched = new Set<string>();
  const pointsPerClass =
    referenceClasses.length > 0 ? MAX_POINTS / referenceClasses.length : 0;

  for (const refClass of referenceClasses) {
    const match = findMatchingClass(refClass, userClasses, alreadyMatched);

    if (match) {
      classMap.set(refClass.id, match.id);
      alreadyMatched.add(match.id);
      items.push({
        description: `Has a ${refClass.name} ${refClass.stereotype}`,
        passed: true,
        points: pointsPerClass,
        feedback: `Found ${match.name}`,
      });
    } else {
      items.push({
        description: `Has a ${refClass.name} ${refClass.stereotype}`,
        passed: false,
        points: 0,
        feedback: `Missing ${refClass.name} -- needed for the diagram structure`,
      });
    }
  }

  const earnedPoints = items.reduce((sum, i) => sum + i.points, 0);
  const score = MAX_POINTS > 0 ? Math.round((earnedPoints / MAX_POINTS) * 100) : 0;

  return {
    category: {
      name: "Required Classes",
      score,
      maxPoints: MAX_POINTS,
      earnedPoints: Math.round(earnedPoints * 10) / 10,
      items,
    },
    classMap,
  };
}

// ── Category 2: Relationships (30 pts) ──────────────────────

function gradeRelationships(
  userRelationships: UMLRelationship[],
  referenceRelationships: UMLRelationship[],
  classMap: Map<string, string>,
): GradingCategory {
  const MAX_POINTS = 30;
  const items: GradingItem[] = [];
  const pointsPerRel =
    referenceRelationships.length > 0
      ? MAX_POINTS / referenceRelationships.length
      : 0;

  const matchedUserRels = new Set<string>();

  for (const refRel of referenceRelationships) {
    const mappedSource = classMap.get(refRel.source);
    const mappedTarget = classMap.get(refRel.target);

    if (!mappedSource || !mappedTarget) {
      // Can't check if the classes aren't even present
      items.push({
        description: `${formatRelType(refRel.type)} from ${refRel.source} to ${refRel.target}`,
        passed: false,
        points: 0,
        feedback: `Cannot verify -- one or both classes are missing`,
      });
      continue;
    }

    // Find a matching user relationship
    const match = userRelationships.find((ur) => {
      if (matchedUserRels.has(ur.id)) return false;

      // Check direction-agnostic match
      const sourceMatch =
        ur.source === mappedSource || ur.source === mappedTarget;
      const targetMatch =
        ur.target === mappedTarget || ur.target === mappedSource;

      if (!sourceMatch || !targetMatch) return false;

      // Check directionality for certain types
      if (
        refRel.type === "inheritance" ||
        refRel.type === "realization" ||
        refRel.type === "composition"
      ) {
        return ur.source === mappedSource && ur.target === mappedTarget;
      }

      return true;
    });

    if (match) {
      matchedUserRels.add(match.id);
      const typeMatch = isRelTypeCompatible(refRel.type, match.type);
      const pts = typeMatch ? pointsPerRel : pointsPerRel * 0.5;

      items.push({
        description: `${formatRelType(refRel.type)} between ${getClassName(refRel.source, classMap)} and ${getClassName(refRel.target, classMap)}`,
        passed: true,
        points: pts,
        feedback: typeMatch
          ? `Found correct ${formatRelType(match.type)} relationship`
          : `Found relationship but type differs: expected ${formatRelType(refRel.type)}, got ${formatRelType(match.type)} (half credit)`,
      });
    } else {
      items.push({
        description: `${formatRelType(refRel.type)} between ${getClassName(refRel.source, classMap)} and ${getClassName(refRel.target, classMap)}`,
        passed: false,
        points: 0,
        feedback: `Missing ${formatRelType(refRel.type)} relationship`,
      });
    }
  }

  const earnedPoints = items.reduce((sum, i) => sum + i.points, 0);
  const score = MAX_POINTS > 0 ? Math.round((earnedPoints / MAX_POINTS) * 100) : 0;

  return {
    name: "Relationships",
    score,
    maxPoints: MAX_POINTS,
    earnedPoints: Math.round(earnedPoints * 10) / 10,
    items,
  };
}

function formatRelType(type: UMLRelationshipType): string {
  const labels: Record<UMLRelationshipType, string> = {
    inheritance: "Inheritance",
    composition: "Composition",
    aggregation: "Aggregation",
    association: "Association",
    dependency: "Dependency",
    realization: "Realization",
  };
  return labels[type] ?? type;
}

function isRelTypeCompatible(
  expected: UMLRelationshipType,
  actual: UMLRelationshipType,
): boolean {
  if (expected === actual) return true;

  // Allow some compatible substitutions
  const compatible: Record<string, string[]> = {
    composition: ["aggregation"], // common confusion, still close
    aggregation: ["composition"],
    association: ["dependency"],
    dependency: ["association"],
    inheritance: ["realization"], // interface vs class
    realization: ["inheritance"],
  };

  return compatible[expected]?.includes(actual) ?? false;
}

function getClassName(refId: string, _classMap: Map<string, string>): string {
  // Extract a human-readable name from the reference ID
  return refId.replace(/^[a-z]+-/, "").replace(/-/g, " ");
}

// ── Category 3: Pattern Usage (20 pts) ──────────────────────

interface PatternDetector {
  name: string;
  detect: (classes: UMLClass[], relationships: UMLRelationship[]) => boolean;
}

const PATTERN_DETECTORS: Record<string, PatternDetector> = {
  singleton: {
    name: "Singleton",
    detect: (classes) => {
      return classes.some((c) => {
        const hasPrivateConstructor = c.methods.some(
          (m) =>
            m.name.toLowerCase() === "constructor" && m.visibility === "-",
        );
        const hasGetInstance = c.methods.some(
          (m) =>
            m.name.toLowerCase().includes("getinstance") ||
            m.name.toLowerCase().includes("instance"),
        );
        const hasStaticInstance = c.attributes.some(
          (a) =>
            a.name.toLowerCase().includes("instance") && a.visibility === "-",
        );
        return (
          (hasPrivateConstructor && hasGetInstance) ||
          (hasStaticInstance && hasGetInstance)
        );
      });
    },
  },

  observer: {
    name: "Observer",
    detect: (classes, relationships) => {
      const hasObserverList = classes.some((c) =>
        c.attributes.some(
          (a) =>
            a.name.toLowerCase().includes("observer") ||
            a.name.toLowerCase().includes("subscriber") ||
            a.name.toLowerCase().includes("listener"),
        ),
      );
      const hasNotify = classes.some((c) =>
        c.methods.some(
          (m) =>
            m.name.toLowerCase().includes("notify") ||
            m.name.toLowerCase().includes("emit") ||
            m.name.toLowerCase().includes("fire"),
        ),
      );
      const hasAttach = classes.some((c) =>
        c.methods.some(
          (m) =>
            m.name.toLowerCase().includes("attach") ||
            m.name.toLowerCase().includes("subscribe") ||
            m.name.toLowerCase().includes("addobserver") ||
            m.name.toLowerCase().includes("addlistener") ||
            m.name.toLowerCase().includes("on"),
        ),
      );
      // Also check for observer interface
      const hasObserverInterface = classes.some(
        (c) =>
          (c.stereotype === "interface" || c.stereotype === "abstract") &&
          (c.name.toLowerCase().includes("observer") ||
            c.name.toLowerCase().includes("listener") ||
            c.name.toLowerCase().includes("subscriber")),
      );
      return (
        (hasObserverList && hasNotify) ||
        (hasObserverInterface && hasAttach) ||
        (hasNotify && hasAttach)
      );
    },
  },

  strategy: {
    name: "Strategy",
    detect: (classes, relationships) => {
      // Look for: interface + multiple implementations + context with reference
      const interfaces = classes.filter(
        (c) => c.stereotype === "interface" || c.stereotype === "abstract",
      );

      for (const iface of interfaces) {
        // Count implementations
        const implementations = relationships.filter(
          (r) =>
            r.target === iface.id &&
            (r.type === "realization" || r.type === "inheritance"),
        );
        if (implementations.length < 2) continue;

        // Check for a context class that references this interface
        const hasContext = classes.some(
          (c) =>
            c.id !== iface.id &&
            !implementations.some((impl) => impl.source === c.id) &&
            c.attributes.some((a) =>
              isFuzzyMatch(a.type, iface.name),
            ),
        );

        if (hasContext) return true;
      }
      return false;
    },
  },

  "factory-method": {
    name: "Factory Method",
    detect: (classes, relationships) => {
      // Look for: creator with abstract factory method + product hierarchy
      const hasAbstractFactory = classes.some((c) =>
        c.methods.some(
          (m) =>
            m.isAbstract &&
            (m.name.toLowerCase().includes("create") ||
              m.name.toLowerCase().includes("factory") ||
              m.name.toLowerCase().includes("make")),
        ),
      );

      const hasProductHierarchy =
        relationships.filter(
          (r) => r.type === "inheritance" || r.type === "realization",
        ).length >= 2;

      return hasAbstractFactory && hasProductHierarchy;
    },
  },

  builder: {
    name: "Builder",
    detect: (classes) => {
      const hasBuilder = classes.some(
        (c) =>
          c.name.toLowerCase().includes("builder") &&
          c.methods.some(
            (m) =>
              m.name.toLowerCase().includes("build") ||
              m.name.toLowerCase().includes("set") ||
              m.name.toLowerCase().includes("add"),
          ),
      );
      const hasGetResult = classes.some((c) =>
        c.methods.some(
          (m) =>
            m.name.toLowerCase().includes("getresult") ||
            m.name.toLowerCase().includes("build") ||
            m.name.toLowerCase().includes("create"),
        ),
      );
      return hasBuilder && hasGetResult;
    },
  },

  decorator: {
    name: "Decorator",
    detect: (classes, relationships) => {
      // Look for a class that both implements an interface AND has a reference to it
      for (const cls of classes) {
        const implements_ = relationships.some(
          (r) =>
            r.source === cls.id &&
            (r.type === "realization" || r.type === "inheritance"),
        );
        const hasWrappedRef = cls.attributes.some(
          (a) =>
            a.name.toLowerCase().includes("wrap") ||
            a.name.toLowerCase().includes("component") ||
            a.name.toLowerCase().includes("decorated") ||
            a.name.toLowerCase().includes("inner"),
        );
        if (implements_ && hasWrappedRef) return true;
      }
      return false;
    },
  },

  adapter: {
    name: "Adapter",
    detect: (classes, relationships) => {
      // Look for: class that implements target interface and wraps an adaptee
      for (const cls of classes) {
        const implements_ = relationships.some(
          (r) =>
            r.source === cls.id &&
            (r.type === "realization" || r.type === "inheritance"),
        );
        const wrapsAdaptee = cls.attributes.some(
          (a) =>
            a.name.toLowerCase().includes("adaptee") ||
            a.name.toLowerCase().includes("legacy") ||
            a.name.toLowerCase().includes("wrapped"),
        );
        if (implements_ && wrapsAdaptee) return true;
      }
      // Also check naming convention
      return classes.some(
        (c) =>
          c.name.toLowerCase().includes("adapter") &&
          c.methods.length > 0,
      );
    },
  },

  command: {
    name: "Command",
    detect: (classes) => {
      const hasCommandInterface = classes.some(
        (c) =>
          (c.stereotype === "interface" || c.stereotype === "abstract") &&
          c.methods.some(
            (m) =>
              m.name.toLowerCase() === "execute" ||
              m.name.toLowerCase() === "run",
          ),
      );
      const hasInvoker = classes.some(
        (c) =>
          c.attributes.some(
            (a) =>
              a.name.toLowerCase().includes("command") ||
              a.name.toLowerCase().includes("history") ||
              a.name.toLowerCase().includes("queue"),
          ) &&
          c.methods.some(
            (m) =>
              m.name.toLowerCase().includes("execute") ||
              m.name.toLowerCase().includes("invoke") ||
              m.name.toLowerCase().includes("undo"),
          ),
      );
      return hasCommandInterface || hasInvoker;
    },
  },

  state: {
    name: "State",
    detect: (classes) => {
      const hasStateInterface = classes.some(
        (c) =>
          (c.stereotype === "interface" || c.stereotype === "abstract") &&
          c.name.toLowerCase().includes("state"),
      );
      const hasContext = classes.some(
        (c) =>
          c.attributes.some((a) =>
            a.name.toLowerCase().includes("state"),
          ) &&
          c.methods.some((m) =>
            m.name.toLowerCase().includes("setstate"),
          ),
      );
      return hasStateInterface || hasContext;
    },
  },

  proxy: {
    name: "Proxy",
    detect: (classes, relationships) => {
      // Look for: class implementing same interface + wrapping real subject
      for (const cls of classes) {
        const isNamedProxy =
          cls.name.toLowerCase().includes("proxy") &&
          cls.methods.length > 0;
        if (isNamedProxy) return true;

        const implements_ = relationships.filter(
          (r) =>
            r.source === cls.id &&
            (r.type === "realization" || r.type === "inheritance"),
        );
        const wraps = cls.attributes.some(
          (a) =>
            a.name.toLowerCase().includes("real") ||
            a.name.toLowerCase().includes("subject") ||
            a.name.toLowerCase().includes("target"),
        );
        if (implements_.length > 0 && wraps) return true;
      }
      return false;
    },
  },

  composite: {
    name: "Composite",
    detect: (classes, relationships) => {
      return classes.some(
        (c) =>
          c.attributes.some(
            (a) =>
              a.name.toLowerCase().includes("children") ||
              a.name.toLowerCase().includes("components") ||
              a.name.toLowerCase().includes("items"),
          ) &&
          c.methods.some(
            (m) =>
              m.name.toLowerCase().includes("add") ||
              m.name.toLowerCase().includes("remove"),
          ),
      );
    },
  },

  "template-method": {
    name: "Template Method",
    detect: (classes) => {
      return classes.some(
        (c) =>
          c.stereotype === "abstract" &&
          c.methods.some((m) => m.isAbstract) &&
          c.methods.some((m) => !m.isAbstract),
      );
    },
  },

  repository: {
    name: "Repository",
    detect: (classes) => {
      return classes.some(
        (c) =>
          (c.name.toLowerCase().includes("repository") ||
            c.name.toLowerCase().includes("repo")) &&
          c.methods.some(
            (m) =>
              m.name.toLowerCase().includes("find") ||
              m.name.toLowerCase().includes("get") ||
              m.name.toLowerCase().includes("save"),
          ),
      );
    },
  },
};

function gradePatternUsage(
  userClasses: UMLClass[],
  userRelationships: UMLRelationship[],
  keyPatterns: string[],
): GradingCategory {
  const MAX_POINTS = 20;
  const items: GradingItem[] = [];
  const pointsPerPattern =
    keyPatterns.length > 0 ? MAX_POINTS / keyPatterns.length : 0;

  for (const patternName of keyPatterns) {
    const normalizedName = patternName.toLowerCase().replace(/\s+/g, "-");
    const detector = PATTERN_DETECTORS[normalizedName];

    if (!detector) {
      // No detector for this pattern, skip with partial credit for naming
      const nameMatch = userClasses.some(
        (c) =>
          c.name.toLowerCase().includes(normalizedName.replace(/-/g, "")) ||
          c.name.toLowerCase().includes(patternName.toLowerCase()),
      );

      items.push({
        description: `Uses ${patternName} pattern`,
        passed: nameMatch,
        points: nameMatch ? pointsPerPattern * 0.5 : 0,
        feedback: nameMatch
          ? `Found class named with ${patternName} convention (partial credit -- no structural detection available)`
          : `Could not detect ${patternName} pattern in the diagram`,
      });
      continue;
    }

    const detected = detector.detect(userClasses, userRelationships);

    items.push({
      description: `Uses ${detector.name} pattern`,
      passed: detected,
      points: detected ? pointsPerPattern : 0,
      feedback: detected
        ? `${detector.name} pattern detected in the diagram structure`
        : `${detector.name} pattern not detected -- check that the structural elements are present`,
    });
  }

  const earnedPoints = items.reduce((sum, i) => sum + i.points, 0);
  const score = MAX_POINTS > 0 ? Math.round((earnedPoints / MAX_POINTS) * 100) : 0;

  return {
    name: "Pattern Usage",
    score,
    maxPoints: MAX_POINTS,
    earnedPoints: Math.round(earnedPoints * 10) / 10,
    items,
  };
}

// ── Category 4: Completeness (10 pts) ───────────────────────

function gradeCompleteness(
  userClasses: UMLClass[],
  userRelationships: UMLRelationship[],
  referenceClasses: UMLClass[],
): GradingCategory {
  const MAX_POINTS = 10;
  const items: GradingItem[] = [];

  // Check 1: Minimum class count (3 pts)
  // Target ~half of reference, but never require more than reference itself —
  // perfectly matching a small reference diagram should earn this check.
  const minClassCount = Math.max(
    1,
    Math.min(
      referenceClasses.length,
      Math.floor(referenceClasses.length * 0.5) || referenceClasses.length,
    ),
  );
  const hasEnoughClasses = userClasses.length >= minClassCount;
  items.push({
    description: `Has at least ${minClassCount} classes`,
    passed: hasEnoughClasses,
    points: hasEnoughClasses ? 3 : 0,
    feedback: hasEnoughClasses
      ? `${userClasses.length} classes present`
      : `Only ${userClasses.length} classes -- expected at least ${minClassCount}`,
  });

  // Check 2: All classes have at least 1 method (3 pts)
  // Requires at least one class — an empty diagram does not trivially pass.
  const classesWithMethods = userClasses.filter(
    (c) => c.methods.length > 0,
  ).length;
  const allHaveMethods =
    userClasses.length > 0 && classesWithMethods === userClasses.length;
  items.push({
    description: "All classes have at least 1 method",
    passed: allHaveMethods,
    points: allHaveMethods
      ? 3
      : userClasses.length === 0
        ? 0
        : Math.round((classesWithMethods / userClasses.length) * 3 * 10) / 10,
    feedback: allHaveMethods
      ? "All classes have methods"
      : userClasses.length === 0
        ? "No classes present"
        : `${classesWithMethods}/${userClasses.length} classes have methods`,
  });

  // Check 3: All classes have at least 1 attribute (2 pts)
  const classesWithAttrs = userClasses.filter(
    (c) => c.attributes.length > 0,
  ).length;
  const allHaveAttrs =
    userClasses.length > 0 && classesWithAttrs === userClasses.length;
  items.push({
    description: "All classes have at least 1 attribute",
    passed: allHaveAttrs,
    points: allHaveAttrs
      ? 2
      : userClasses.length === 0
        ? 0
        : Math.round((classesWithAttrs / userClasses.length) * 2 * 10) / 10,
    feedback: allHaveAttrs
      ? "All classes have attributes"
      : userClasses.length === 0
        ? "No classes present"
        : `${classesWithAttrs}/${userClasses.length} classes have attributes`,
  });

  // Check 4: No orphan classes (2 pts)
  // An empty diagram cannot earn this either — there's nothing to connect.
  const connectedClassIds = new Set<string>();
  for (const rel of userRelationships) {
    connectedClassIds.add(rel.source);
    connectedClassIds.add(rel.target);
  }
  const orphanClasses = userClasses.filter(
    (c) => !connectedClassIds.has(c.id),
  );
  const noOrphans =
    userClasses.length > 0 && orphanClasses.length === 0;
  items.push({
    description: "No orphan classes (all connected by relationships)",
    passed: noOrphans,
    points: noOrphans ? 2 : 0,
    feedback: noOrphans
      ? "All classes are connected"
      : userClasses.length === 0
        ? "No classes present"
        : `${orphanClasses.length} orphan class${orphanClasses.length > 1 ? "es" : ""}: ${orphanClasses.map((c) => c.name).join(", ")}`,
  });

  const earnedPoints = items.reduce((sum, i) => sum + i.points, 0);
  const score = MAX_POINTS > 0 ? Math.round((earnedPoints / MAX_POINTS) * 100) : 0;

  return {
    name: "Completeness",
    score,
    maxPoints: MAX_POINTS,
    earnedPoints: Math.round(earnedPoints * 10) / 10,
    items,
  };
}

// ── Main grading function ───────────────────────────────────

export function gradeDiagram(input: GradingInput): GradingResult {
  const {
    userClasses,
    userRelationships,
    referenceClasses,
    referenceRelationships,
    keyPatterns,
  } = input;

  // Grade each category
  const { category: classCategory, classMap } = gradeRequiredClasses(
    userClasses,
    referenceClasses,
  );

  const relCategory = gradeRelationships(
    userRelationships,
    referenceRelationships,
    classMap,
  );

  const patternCategory = gradePatternUsage(
    userClasses,
    userRelationships,
    keyPatterns,
  );

  const completenessCategory = gradeCompleteness(
    userClasses,
    userRelationships,
    referenceClasses,
  );

  const categories = [
    classCategory,
    relCategory,
    patternCategory,
    completenessCategory,
  ];

  // Calculate total score (weighted sum of earned points)
  const totalEarned = categories.reduce((sum, c) => sum + c.earnedPoints, 0);
  const totalMax = categories.reduce((sum, c) => sum + c.maxPoints, 0);
  const totalScore =
    totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  return {
    totalScore,
    categories,
  };
}

// ── Exports for testing ─────────────────────────────────────

export { normalize, levenshtein, isFuzzyMatch, PATTERN_DETECTORS };
