/**
 * Adds predictionPrompts to patterns that are missing them.
 *
 * predictionPrompts test understanding with question + answer pairs
 * that probe whether the learner can predict system behavior.
 *
 * Run: pnpm db:seed -- --module=fix-prediction-prompts
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import { eq, and } from "drizzle-orm";

const PREDICTION_PROMPTS: Record<string, Array<{ question: string; answer: string }>> = {
  builder: [
    {
      question: "If you call builder.setEngine('V8').setSeats(4).build() but forget setColor(), what happens?",
      answer: "The Builder returns a Car with default or null color — it doesn't crash. That's the advantage: optional steps are truly optional. Unlike a constructor with 10 parameters, the Builder lets you set only what matters.",
    },
    {
      question: "Can you reuse the same Builder to create two different objects?",
      answer: "Yes, but you must call reset() between builds. Otherwise the second object inherits leftover state from the first. The Director pattern automates this by encapsulating specific build sequences.",
    },
  ],
  adapter: [
    {
      question: "If the third-party API changes its response format, how many classes need to change?",
      answer: "Only the Adapter — that's the entire point. The Adapter translates between the external format and your internal interface. Your business logic never touches the external API directly.",
    },
    {
      question: "Can an Adapter make a synchronous API work with an async interface?",
      answer: "Yes — the Adapter can wrap the sync call in a Promise. Adapters don't just translate data shapes; they can bridge paradigm differences (sync/async, callback/promise, REST/GraphQL).",
    },
  ],
  facade: [
    {
      question: "If you add a new step to the order process (e.g., fraud check), how many client classes need to change?",
      answer: "Zero — you add the fraud check inside the Facade's placeOrder() method. Clients still call the same placeOrder() with the same signature. The Facade absorbs the complexity increase.",
    },
    {
      question: "Can a client bypass the Facade and call subsystem classes directly?",
      answer: "Yes — the Facade doesn't hide the subsystem, it simplifies access. Clients needing fine-grained control can still use subsystem classes directly. The Facade is a convenience, not a restriction.",
    },
  ],
  proxy: [
    {
      question: "If the client calls proxy.getData() five times, how many times does the real service get called?",
      answer: "It depends on the proxy type. A caching proxy calls the real service once and returns cached data for the other four. A protection proxy might call it five times but check permissions each time. A virtual proxy calls it once (lazy initialization).",
    },
    {
      question: "Does the client know it's talking to a Proxy instead of the real object?",
      answer: "No — the Proxy implements the same interface as the real object. The client is completely unaware. This is what makes Proxy powerful: you can add caching, logging, access control, or lazy loading without changing any client code.",
    },
  ],
  iterator: [
    {
      question: "If you add an element to a collection while iterating over it, what happens?",
      answer: "Most iterators throw a ConcurrentModificationException or produce undefined behavior. Iterators assume the collection is stable during traversal. To safely modify, iterate over a copy or collect changes and apply after iteration.",
    },
    {
      question: "Can two iterators traverse the same collection simultaneously?",
      answer: "Yes — each iterator maintains its own cursor position independently. This is a key advantage over internal iteration (forEach). You can have a 'current' and 'lookahead' iterator on the same list.",
    },
  ],
  mediator: [
    {
      question: "If you add a 6th component to a system with 5 components, how many new connections are needed WITH vs WITHOUT a Mediator?",
      answer: "Without Mediator: 5 new direct connections (to each existing component), total goes from 10 to 15. With Mediator: 1 new connection (to the mediator). The Mediator reduces N×(N-1)/2 connections to N connections.",
    },
    {
      question: "What happens if the Mediator crashes?",
      answer: "All communication stops — the Mediator is a single point of failure. This is the main tradeoff: you trade distributed coupling for centralized fragility. In production, the mediator must be highly available.",
    },
  ],
  "template-method": [
    {
      question: "If you change the step order in the base class template, how many subclasses are affected?",
      answer: "ALL of them — every subclass inherits the new step order. This is the fragile base class problem. The template controls the algorithm structure, so changes cascade to all implementations.",
    },
    {
      question: "Can a subclass skip a step defined in the template?",
      answer: "Only if the step is a hook (optional method with a default no-op implementation). Abstract steps cannot be skipped — they MUST be implemented. This distinction between required steps and optional hooks is central to Template Method.",
    },
  ],
  repository: [
    {
      question: "If you switch from PostgreSQL to MongoDB, how many service classes need to change?",
      answer: "Zero — services depend on the Repository interface, not the implementation. You create a new MongoUserRepository implementing the same UserRepository interface. Only the dependency injection configuration changes.",
    },
    {
      question: "Can a Repository return domain objects that don't map 1:1 to database tables?",
      answer: "Yes — that's what distinguishes Repository from DAO. A Repository can aggregate data from multiple tables into a single domain object, or split one table into multiple domain concepts. It operates at the domain level, not the table level.",
    },
  ],
  "abstract-factory": [
    {
      question: "If you add a new product type (e.g., createDropdown) to the factory interface, how many concrete factories need to change?",
      answer: "ALL of them — every concrete factory (Windows, Mac, Linux) must implement createDropdown(). This is the main weakness: Abstract Factory is open for new families but closed for new product types.",
    },
    {
      question: "Can you mix products from different factories (e.g., Windows button with Mac checkbox)?",
      answer: "Not without breaking the pattern's guarantee. The whole point of Abstract Factory is consistency within a family. If you need to mix, you've outgrown the pattern — consider a more flexible configuration-based approach.",
    },
  ],
  visitor: [
    {
      question: "If you add a new shape type (Pentagon), how many existing Visitor classes need to change?",
      answer: "ALL of them — every Visitor must add a visitPentagon() method. This is the extension asymmetry: adding operations (new Visitors) is easy, but adding element types forces changes across all Visitors.",
    },
    {
      question: "Does the Visitor need access to the element's private fields to be useful?",
      answer: "Often yes — which is a tension. The element must expose enough data for the Visitor to operate, potentially breaking encapsulation. In practice, elements provide public getters or use friend/package-private access for Visitors.",
    },
    {
      question: "Can you add a new operation (e.g., serialize to XML) without modifying any shape class?",
      answer: "Yes — create a new XmlSerializerVisitor implementing the Visitor interface. Each shape's accept() method already calls the right visitX() method via double dispatch. No shape class changes needed.",
    },
  ],
};

export async function seed(db: Database) {
  let updated = 0;

  for (const [slug, predictionPrompts] of Object.entries(PREDICTION_PROMPTS)) {
    const [row] = await db
      .select()
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, "lld"),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, slug),
        ),
      )
      .limit(1);

    if (!row) {
      console.warn(`  Pattern "${slug}" not found in DB — skipping`);
      continue;
    }

    const content = row.content as Record<string, unknown>;
    const updatedContent = { ...content, predictionPrompts };

    await db
      .update(moduleContent)
      .set({ content: updatedContent, updatedAt: new Date() })
      .where(
        and(
          eq(moduleContent.moduleId, "lld"),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, slug),
        ),
      );

    updated++;
    console.log(`  ✓ Added predictionPrompts to "${slug}" (${predictionPrompts.length} prompts)`);
  }

  console.log(`\n  Done: ${updated} patterns enriched with predictionPrompts.`);
}
