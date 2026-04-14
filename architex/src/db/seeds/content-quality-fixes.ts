/**
 * Content quality fixes for LLD module.
 *
 * Fix 1: Add companyTags to all 33 problems' content JSONB.
 * Fix 2: Replace generic SubsystemA/B/C names in Facade pattern with
 *         realistic e-commerce service names.
 * Fix 3: Replace undefined safeEvaluate() in Tool Use pattern with a
 *         working switch-based math evaluator.
 *
 * Run: pnpm db:seed -- --module=content-quality-fixes
 */

import type { Database } from "@/db";
import { moduleContent } from "@/db/schema/module-content";
import { eq, and } from "drizzle-orm";

const MODULE_ID = "lld";

// ── Fix 1: Company tags for all 33 problems ────────────────

const PROBLEM_COMPANY_TAGS: Record<string, string[]> = {
  "parking-lot": ["Google", "Amazon", "Microsoft"],
  "elevator-system": ["Google", "Uber", "Apple"],
  "chess-game": ["Amazon", "Microsoft", "Bloomberg"],
  "hotel-booking": ["Booking.com", "Airbnb", "Expedia"],
  "library-management": ["Google", "Microsoft"],
  "movie-ticket-booking": ["BookMyShow", "Fandango", "Netflix"],
  "food-delivery": ["Uber", "DoorDash", "Zomato"],
  "ride-sharing": ["Uber", "Lyft", "Ola"],
  "social-media-feed": ["Meta", "Twitter", "LinkedIn"],
  "vending-machine": ["Amazon", "Google", "Oracle"],
  "atm": ["Goldman Sachs", "JPMorgan", "Capital One"],
  "snake-ladder": ["Amazon", "Google", "Flipkart"],
  "file-system": ["Google", "Dropbox", "Microsoft"],
  "lru-cache": ["Amazon", "Meta", "Google"],
  "restaurant-management": ["Zomato", "DoorDash", "Yelp"],
  "airline-booking": ["Expedia", "Booking.com", "Google"],
  "tic-tac-toe": ["Amazon", "Google", "Meta"],
  "snake-game": ["Apple", "Google", "Amazon"],
  "card-game": ["Bloomberg", "Amazon", "Microsoft"],
  "notification-service": ["Meta", "Google", "Twilio"],
  "logging-framework": ["Datadog", "Splunk", "Amazon"],
  "cache-system": ["Amazon", "Google", "Redis Labs"],
  "task-scheduler": ["Google", "Amazon", "Microsoft"],
  "pub-sub-system": ["Google", "Amazon", "Confluent"],
  "rate-limiter": ["Stripe", "Cloudflare", "Google"],
  "url-shortener": ["Google", "Twitter", "LinkedIn"],
  "spreadsheet": ["Google", "Microsoft", "Apple"],
  "splitwise": ["PayPal", "Stripe", "Google"],
  "online-shopping": ["Amazon", "Flipkart", "Shopify"],
  "stock-brokerage": ["Goldman Sachs", "Bloomberg", "Robinhood"],
  "music-streaming": ["Spotify", "Apple", "Amazon"],
  "course-registration": ["Coursera", "Udemy", "Google"],
  "coffee-vending-machine": ["Amazon", "Google", "Apple"],
};

// ── Fix 2: Facade code with realistic e-commerce names ─────

const FACADE_TYPESCRIPT = `// Each subsystem has its own complex interface with multiple methods.
// Without the Facade, the client would need to know about all three services
// and coordinate them in the correct order.

class InventoryService {
  checkStock(productId: string): boolean {
    console.log(\`Checking stock for product \${productId}\`);
    return true; // simplified
  }

  reserveItem(productId: string, qty: number): string {
    console.log(\`Reserved \${qty}x \${productId}\`);
    return \`reservation-\${Date.now()}\`;
  }
}

class PaymentService {
  processPayment(amount: number, method: string): string {
    console.log(\`Processing \${method} payment: $\${amount}\`);
    return \`txn-\${Date.now()}\`;
  }
}

class ShippingService {
  calculateShipping(address: string): number {
    console.log(\`Calculating shipping to \${address}\`);
    return 5.99; // simplified
  }

  createShipment(reservationId: string, address: string): string {
    console.log(\`Shipping \${reservationId} to \${address}\`);
    return \`ship-\${Date.now()}\`;
  }
}

// The Facade coordinates the subsystems behind one simple method.
// Clients call placeOrder() instead of juggling three services manually.
class OrderFacade {
  private inventory = new InventoryService();
  private payment = new PaymentService();
  private shipping = new ShippingService();

  placeOrder(productId: string, qty: number, address: string, payMethod: string): string {
    // Step 1: Check and reserve inventory
    if (!this.inventory.checkStock(productId)) {
      throw new Error("Out of stock");
    }
    const reservationId = this.inventory.reserveItem(productId, qty);

    // Step 2: Calculate total and process payment
    const shippingCost = this.shipping.calculateShipping(address);
    const total = qty * 29.99 + shippingCost; // simplified pricing
    const txnId = this.payment.processPayment(total, payMethod);

    // Step 3: Create shipment
    const shipmentId = this.shipping.createShipment(reservationId, address);

    return \`Order placed! Txn: \${txnId}, Shipment: \${shipmentId}\`;
  }
}

// Usage — client only interacts with the Facade
const order = new OrderFacade();
console.log(order.placeOrder("SKU-123", 2, "123 Main St", "credit_card"));`;

const FACADE_PYTHON = `class InventoryService:
    def check_stock(self, product_id: str) -> bool:
        print(f"Checking stock for product {product_id}")
        return True  # simplified

    def reserve_item(self, product_id: str, qty: int) -> str:
        print(f"Reserved {qty}x {product_id}")
        return f"reservation-{id(self)}"

class PaymentService:
    def process_payment(self, amount: float, method: str) -> str:
        print(f"Processing {method} payment: \${amount:.2f}")
        return f"txn-{id(self)}"

class ShippingService:
    def calculate_shipping(self, address: str) -> float:
        print(f"Calculating shipping to {address}")
        return 5.99  # simplified

    def create_shipment(self, reservation_id: str, address: str) -> str:
        print(f"Shipping {reservation_id} to {address}")
        return f"ship-{id(self)}"

class OrderFacade:
    def __init__(self):
        self._inventory = InventoryService()
        self._payment = PaymentService()
        self._shipping = ShippingService()

    def place_order(self, product_id: str, qty: int, address: str, pay_method: str) -> str:
        # Step 1: Check and reserve inventory
        if not self._inventory.check_stock(product_id):
            raise ValueError("Out of stock")
        reservation_id = self._inventory.reserve_item(product_id, qty)

        # Step 2: Calculate total and process payment
        shipping_cost = self._shipping.calculate_shipping(address)
        total = qty * 29.99 + shipping_cost  # simplified pricing
        txn_id = self._payment.process_payment(total, pay_method)

        # Step 3: Create shipment
        shipment_id = self._shipping.create_shipment(reservation_id, address)

        return f"Order placed! Txn: {txn_id}, Shipment: {shipment_id}"

# Usage
order = OrderFacade()
print(order.place_order("SKU-123", 2, "123 Main St", "credit_card"))`;

// Updated classes array for the Facade pattern
const FACADE_CLASSES = [
  {
    id: "f-facade",
    name: "OrderFacade",
    stereotype: "class",
    attributes: [
      { id: "f-facade-attr-0", name: "inventory", type: "InventoryService", visibility: "-" },
      { id: "f-facade-attr-1", name: "payment", type: "PaymentService", visibility: "-" },
      { id: "f-facade-attr-2", name: "shipping", type: "ShippingService", visibility: "-" },
    ],
    methods: [
      {
        id: "f-facade-meth-0",
        name: "placeOrder",
        returnType: "string",
        params: ["productId: string", "qty: number", "address: string", "payMethod: string"],
        visibility: "+",
      },
    ],
    x: 300,
    y: 50,
  },
  {
    id: "f-sub-a",
    name: "InventoryService",
    stereotype: "class",
    attributes: [],
    methods: [
      { id: "f-sub-a-meth-0", name: "checkStock", returnType: "boolean", params: ["productId: string"], visibility: "+" },
      { id: "f-sub-a-meth-1", name: "reserveItem", returnType: "string", params: ["productId: string", "qty: number"], visibility: "+" },
    ],
    x: 80,
    y: 280,
  },
  {
    id: "f-sub-b",
    name: "PaymentService",
    stereotype: "class",
    attributes: [],
    methods: [
      { id: "f-sub-b-meth-0", name: "processPayment", returnType: "string", params: ["amount: number", "method: string"], visibility: "+" },
    ],
    x: 300,
    y: 280,
  },
  {
    id: "f-sub-c",
    name: "ShippingService",
    stereotype: "class",
    attributes: [],
    methods: [
      { id: "f-sub-c-meth-0", name: "calculateShipping", returnType: "number", params: ["address: string"], visibility: "+" },
      { id: "f-sub-c-meth-1", name: "createShipment", returnType: "string", params: ["reservationId: string", "address: string"], visibility: "+" },
    ],
    x: 520,
    y: 280,
  },
  {
    id: "f-client",
    name: "Client",
    stereotype: "class",
    attributes: [],
    methods: [
      { id: "f-client-meth-0", name: "doWork", returnType: "void", params: [], visibility: "+" },
    ],
    x: 300,
    y: -120,
  },
];

// ── Fix 3: Tool Use — replace safeEvaluate with working code ─

const TOOL_USE_TYPESCRIPT = `interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
}

interface ToolResult {
  output: string;
  success: boolean;
}

interface Tool {
  name: string;
  description: string;
  schema(): ToolSchema;
  execute(input: unknown): Promise<ToolResult>;
}

class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listSchemas(): ToolSchema[] {
    return [...this.tools.values()].map((t) => t.schema());
  }
}

class WebSearchTool implements Tool {
  name = "web_search";
  description = "Search the web for current information";

  schema(): ToolSchema {
    return {
      name: this.name,
      description: this.description,
      parameters: { query: { type: "string", description: "Search query" } },
    };
  }

  async execute(input: { query: string }): Promise<ToolResult> {
    const results = await fetch(\`https://api.search.com?q=\${input.query}\`);
    return { output: await results.text(), success: true };
  }
}

class CalculatorTool implements Tool {
  name = "calculator";
  description = "Evaluate a mathematical expression";

  schema(): ToolSchema {
    return {
      name: this.name,
      description: this.description,
      parameters: { expression: { type: "string", description: "Math expression like '2 + 3 * 4'" } },
    };
  }

  async execute(input: { expression: string }): Promise<ToolResult> {
    try {
      // Safe math evaluation via recursive descent parser.
      // Supports +, -, *, / with correct operator precedence and parentheses.
      const result = this.parseMath(input.expression);
      return { output: String(result), success: true };
    } catch (e) {
      return { output: \`Error: \${e}\`, success: false };
    }
  }

  /** Recursive descent parser for +, -, *, / with correct precedence. */
  private parseMath(expr: string): number {
    const tokens = expr.match(/(\\d+\\.?\\d*|[+\\-*/()])/g);
    if (!tokens) throw new Error("Invalid expression");
    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    // Grammar: expr = term (('+' | '-') term)*
    const parseExpr = (): number => {
      let result = parseTerm();
      while (peek() === "+" || peek() === "-") {
        const op = consume();
        const right = parseTerm();
        result = op === "+" ? result + right : result - right;
      }
      return result;
    };

    // term = factor (('*' | '/') factor)*
    const parseTerm = (): number => {
      let result = parseFactor();
      while (peek() === "*" || peek() === "/") {
        const op = consume();
        const right = parseFactor();
        result = op === "*" ? result * right : result / right;
      }
      return result;
    };

    // factor = '(' expr ')' | number
    const parseFactor = (): number => {
      if (peek() === "(") {
        consume(); // '('
        const result = parseExpr();
        consume(); // ')'
        return result;
      }
      return parseFloat(consume());
    };

    return parseExpr();
  }
}

// Usage
const registry = new ToolRegistry();
registry.register(new WebSearchTool());
registry.register(new CalculatorTool());

// Agent sends registry.listSchemas() to the LLM
// LLM responds with: { tool: "calculator", input: { expression: "2+2" } }
const tool = registry.get("calculator")!;
const result = await tool.execute({ expression: "2 + 2" });
console.log(result); // { output: "4", success: true }`;

// ── Seed function ──────────────────────────────────────────

export async function seed(db: Database) {
  console.log("  Content quality fixes starting...\n");

  // ── Fix 1: Add companyTags to all 33 problems ───────────
  console.log("  Fix 1: Adding companyTags to problems...");
  let companyTagsUpdated = 0;

  for (const [slug, companyTags] of Object.entries(PROBLEM_COMPANY_TAGS)) {
    const [row] = await db
      .select()
      .from(moduleContent)
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "problem"),
          eq(moduleContent.slug, slug),
        ),
      )
      .limit(1);

    if (!row) {
      console.warn(`    Problem "${slug}" not found in DB -- skipping`);
      continue;
    }

    const content = row.content as Record<string, unknown>;
    content.companyTags = companyTags;

    await db
      .update(moduleContent)
      .set({ content, updatedAt: new Date() })
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "problem"),
          eq(moduleContent.slug, slug),
        ),
      );

    companyTagsUpdated++;
  }

  console.log(`    Updated ${companyTagsUpdated} / ${Object.keys(PROBLEM_COMPANY_TAGS).length} problems with companyTags.\n`);

  // ── Fix 2: Facade code quality ──────────────────────────
  console.log("  Fix 2: Updating Facade pattern with realistic e-commerce names...");

  const [facadeRow] = await db
    .select()
    .from(moduleContent)
    .where(
      and(
        eq(moduleContent.moduleId, MODULE_ID),
        eq(moduleContent.contentType, "pattern"),
        eq(moduleContent.slug, "facade"),
      ),
    )
    .limit(1);

  if (facadeRow) {
    const content = facadeRow.content as Record<string, unknown>;
    const code = content.code as Record<string, string> | undefined;

    if (code) {
      code.typescript = FACADE_TYPESCRIPT;
      code.python = FACADE_PYTHON;
      content.code = code;
    }

    // Update classes array with renamed services
    content.classes = FACADE_CLASSES;

    await db
      .update(moduleContent)
      .set({ content, updatedAt: new Date() })
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, "facade"),
        ),
      );

    console.log("    Updated Facade: SubsystemA/B/C -> InventoryService/PaymentService/ShippingService\n");
  } else {
    console.warn("    Facade pattern not found in DB -- skipping\n");
  }

  // ── Fix 3: Tool Use safeEvaluate ────────────────────────
  console.log("  Fix 3: Fixing CalculatorTool safeEvaluate() in Tool Use pattern...");

  const [toolUseRow] = await db
    .select()
    .from(moduleContent)
    .where(
      and(
        eq(moduleContent.moduleId, MODULE_ID),
        eq(moduleContent.contentType, "pattern"),
        eq(moduleContent.slug, "tool-use"),
      ),
    )
    .limit(1);

  if (toolUseRow) {
    const content = toolUseRow.content as Record<string, unknown>;
    const code = content.code as Record<string, string> | undefined;

    if (code) {
      code.typescript = TOOL_USE_TYPESCRIPT;
      content.code = code;
    }

    await db
      .update(moduleContent)
      .set({ content, updatedAt: new Date() })
      .where(
        and(
          eq(moduleContent.moduleId, MODULE_ID),
          eq(moduleContent.contentType, "pattern"),
          eq(moduleContent.slug, "tool-use"),
        ),
      );

    console.log("    Updated Tool Use: replaced safeEvaluate() with recursive descent math parser\n");
  } else {
    console.warn("    Tool Use pattern not found in DB -- skipping\n");
  }

  console.log("  Content quality fixes complete.");
}
