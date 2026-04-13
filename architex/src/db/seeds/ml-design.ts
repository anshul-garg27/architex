/**
 * ML Design module seed: pipeline templates + CNN presets.
 *
 * NN training engines and computation stay client-side.
 */

import type { Database } from "@/db";
import { mapToRows, batchUpsert } from "./seed-helpers";

const MODULE_ID = "ml-design";

export async function seed(db: Database) {
  const { PIPELINE_TEMPLATES } = await import("@/lib/ml-design/pipeline-templates");

  // CNN presets are small but useful to have in DB for content management
  const ML_TOPICS = [
    { id: "neural-network", name: "Neural Network Trainer", category: "training", difficulty: "intermediate", description: "Train dense NNs on circle, XOR, spiral, and Gaussian datasets with real-time loss visualization." },
    { id: "cnn", name: "CNN Inspector", category: "training", difficulty: "advanced", description: "Convolutional Neural Network shape propagation, filter visualization, and Conv2D sliding window." },
    { id: "ab-testing", name: "A/B Testing", category: "statistics", difficulty: "beginner", description: "Statistical hypothesis testing with z-test, p-value, and sample size estimation." },
    { id: "multi-armed-bandit", name: "Multi-Armed Bandit", category: "optimization", difficulty: "intermediate", description: "Exploration vs exploitation with epsilon-greedy, UCB1, and Thompson Sampling." },
    { id: "feature-store", name: "Feature Store", category: "infrastructure", difficulty: "intermediate", description: "ML feature engineering lifecycle with 8-step pipeline simulation." },
    { id: "serving-patterns", name: "Serving Patterns", category: "deployment", difficulty: "advanced", description: "A/B testing, Canary rollout, and Shadow testing for model deployment." },
  ];

  const rows = [
    ...mapToRows(MODULE_ID, "pipeline", PIPELINE_TEMPLATES, {
      slugField: "id",
      nameField: "name",
      summaryField: "description",
      tagsFn: () => ["ml", "pipeline"],
    }),
    ...mapToRows(MODULE_ID, "topic", ML_TOPICS, {
      slugField: "id",
      nameField: "name",
      categoryField: "category",
      difficultyField: "difficulty",
      summaryField: "description",
      tagsFn: (item) => ["ml", String(item.category ?? "")],
    }),
  ];

  console.log(`    Upserting ${rows.length} ML design content rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
