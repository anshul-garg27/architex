// -----------------------------------------------------------------
// Architex -- SOLID Principle Demos (LLD-024 to LLD-028)
// -----------------------------------------------------------------
//
// Five interactive before/after demos that show how each SOLID
// principle transforms a problematic design into a clean one.
// Each demo includes UML class diagrams for both states plus
// a textual explanation and real-world analogy.
// -----------------------------------------------------------------

import type { UMLClass, UMLRelationship } from "./types";

// ── Types ────────────────────────────────────────────────────

export type SOLIDPrinciple = "SRP" | "OCP" | "LSP" | "ISP" | "DIP";

export interface CodeSample {
  typescript: string;
  python: string;
}

export interface SOLIDDemo {
  id: string;
  principle: SOLIDPrinciple;
  name: string;
  description: string;
  summary: string[];
  beforeClasses: UMLClass[];
  beforeRelationships: UMLRelationship[];
  afterClasses: UMLClass[];
  afterRelationships: UMLRelationship[];
  beforeCode: CodeSample;
  afterCode: CodeSample;
  explanation: string;
  realWorldExample: string;
}

// ── Helper ───────────────────────────────────────────────────

let _rid = 0;
function rid(): string {
  return `solid-rel-${++_rid}`;
}

// ═════════════════════════════════════════════════════════════
//  1. SRP — Single Responsibility Principle (LLD-024)
// ═════════════════════════════════════════════════════════════

const srp: SOLIDDemo = {
  id: "solid-srp",
  principle: "SRP",
  name: "Single Responsibility Principle",
  description:
    "In a restaurant, the chef cooks, the waiter serves, and the cashier handles payments. " +
    "If one person did all three, any change (new menu, new POS system) would disrupt everything. " +
    "That's the Single Responsibility Principle: a class should have only one reason to change. " +
    "Each class encapsulates a single responsibility.",
  summary: [
    "SRP = each class has exactly one reason to change",
    "Key insight: separate concerns so changes in one area don't ripple everywhere",
    "Use when: a class mixes unrelated responsibilities like auth, email, and logging",
  ],

  // -- BEFORE: one monolithic UserManager ----------------------
  beforeClasses: [
    {
      id: "srp-b-mgr",
      name: "UserManager",
      stereotype: "class",
      attributes: [
        { id: "srp-b-mgr-attr-0", name: "db", type: "Database", visibility: "-" },
        { id: "srp-b-mgr-attr-1", name: "mailer", type: "SmtpClient", visibility: "-" },
      ],
      methods: [
        { id: "srp-b-mgr-meth-0", name: "authenticate", returnType: "boolean", params: ["email: string", "password: string"], visibility: "+" },
        { id: "srp-b-mgr-meth-1", name: "resetPassword", returnType: "void", params: ["userId: string"], visibility: "+" },
        { id: "srp-b-mgr-meth-2", name: "sendWelcomeEmail", returnType: "void", params: ["userId: string"], visibility: "+" },
        { id: "srp-b-mgr-meth-3", name: "sendPasswordResetEmail", returnType: "void", params: ["userId: string"], visibility: "+" },
        { id: "srp-b-mgr-meth-4", name: "log", returnType: "void", params: ["message: string"], visibility: "+" },
        { id: "srp-b-mgr-meth-5", name: "getAuditTrail", returnType: "LogEntry[]", params: [], visibility: "+" },
      ],
      x: 200,
      y: 120,
    },
  ],
  beforeRelationships: [],

  beforeCode: {
    typescript: `class UserManager {
  private db: Database;
  private mailer: SmtpClient;

  authenticate(email: string, pw: string): boolean {
    const user = this.db.query(\`SELECT * FROM users WHERE email='\${email}'\`);
    return user && bcrypt.compare(pw, user.passwordHash);
  }

  sendWelcomeEmail(userId: string): void {
    const user = this.db.query(\`SELECT * FROM users WHERE id='\${userId}'\`);
    this.mailer.send(user.email, "Welcome!", "...");
  }

  log(message: string): void {
    fs.appendFileSync("app.log", \`\${new Date().toISOString()} \${message}\\n\`);
  }
}`,
    python: `class UserManager:
    def __init__(self, db: Database, mailer: SmtpClient):
        self.db = db
        self.mailer = mailer

    def authenticate(self, email: str, pw: str) -> bool:
        user = self.db.query(f"SELECT * FROM users WHERE email='{email}'")
        return user and bcrypt.checkpw(pw, user.password_hash)

    def send_welcome_email(self, user_id: str) -> None:
        user = self.db.query(f"SELECT * FROM users WHERE id='{user_id}'")
        self.mailer.send(user.email, "Welcome!", "...")

    def log(self, message: str) -> None:
        with open("app.log", "a") as f:
            f.write(f"{datetime.now().isoformat()} {message}\\n")`,
  },

  // -- AFTER: three focused services ---------------------------
  afterClasses: [
    {
      id: "srp-a-auth",
      name: "AuthService",
      stereotype: "class",
      attributes: [
        { id: "srp-a-auth-attr-0", name: "userRepo", type: "UserRepository", visibility: "-" },
        { id: "srp-a-auth-attr-1", name: "hasher", type: "PasswordHasher", visibility: "-" },
      ],
      methods: [
        { id: "srp-a-auth-meth-0", name: "authenticate", returnType: "boolean", params: ["email: string", "password: string"], visibility: "+" },
        { id: "srp-a-auth-meth-1", name: "resetPassword", returnType: "void", params: ["userId: string"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "srp-a-email",
      name: "EmailService",
      stereotype: "class",
      attributes: [
        { id: "srp-a-email-attr-0", name: "mailer", type: "SmtpClient", visibility: "-" },
        { id: "srp-a-email-attr-1", name: "templates", type: "TemplateEngine", visibility: "-" },
      ],
      methods: [
        { id: "srp-a-email-meth-0", name: "sendWelcomeEmail", returnType: "void", params: ["userId: string"], visibility: "+" },
        { id: "srp-a-email-meth-1", name: "sendPasswordResetEmail", returnType: "void", params: ["userId: string"], visibility: "+" },
      ],
      x: 320,
      y: 50,
    },
    {
      id: "srp-a-logger",
      name: "Logger",
      stereotype: "class",
      attributes: [
        { id: "srp-a-logger-attr-0", name: "sink", type: "LogSink", visibility: "-" },
      ],
      methods: [
        { id: "srp-a-logger-meth-0", name: "log", returnType: "void", params: ["message: string"], visibility: "+" },
        { id: "srp-a-logger-meth-1", name: "getAuditTrail", returnType: "LogEntry[]", params: [], visibility: "+" },
      ],
      x: 590,
      y: 50,
    },
    {
      id: "srp-a-facade",
      name: "UserService",
      stereotype: "class",
      attributes: [
        { id: "srp-a-facade-attr-0", name: "auth", type: "AuthService", visibility: "-" },
        { id: "srp-a-facade-attr-1", name: "email", type: "EmailService", visibility: "-" },
        { id: "srp-a-facade-attr-2", name: "logger", type: "Logger", visibility: "-" },
      ],
      methods: [
        { id: "srp-a-facade-meth-0", name: "register", returnType: "void", params: ["email: string", "password: string"], visibility: "+" },
        { id: "srp-a-facade-meth-1", name: "login", returnType: "boolean", params: ["email: string", "password: string"], visibility: "+" },
      ],
      x: 320,
      y: 280,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "srp-a-facade", target: "srp-a-auth", type: "dependency", label: "uses" },
    { id: rid(), source: "srp-a-facade", target: "srp-a-email", type: "dependency", label: "uses" },
    { id: rid(), source: "srp-a-facade", target: "srp-a-logger", type: "dependency", label: "uses" },
  ],

  afterCode: {
    typescript: `class AuthService {
  constructor(private repo: UserRepository, private hasher: PasswordHasher) {}
  authenticate(email: string, pw: string): boolean {
    const user = this.repo.findByEmail(email);
    return user !== null && this.hasher.verify(pw, user.passwordHash);
  }
}

class EmailService {
  constructor(private mailer: SmtpClient) {}
  sendWelcome(email: string): void { this.mailer.send(email, "Welcome!", "..."); }
}

class Logger {
  constructor(private sink: LogSink) {}
  log(msg: string): void { this.sink.write(msg); }
}`,
    python: `class AuthService:
    def __init__(self, repo: UserRepository, hasher: PasswordHasher):
        self.repo = repo
        self.hasher = hasher

    def authenticate(self, email: str, pw: str) -> bool:
        user = self.repo.find_by_email(email)
        return user is not None and self.hasher.verify(pw, user.password_hash)

class EmailService:
    def __init__(self, mailer: SmtpClient):
        self.mailer = mailer
    def send_welcome(self, email: str) -> None:
        self.mailer.send(email, "Welcome!", "...")

class Logger:
    def __init__(self, sink: LogSink):
        self.sink = sink
    def log(self, msg: str) -> None:
        self.sink.write(msg)`,
  },

  explanation:
    "The original UserManager handled authentication, email dispatch, and logging -- three independent reasons to change. " +
    "Splitting into AuthService (credentials), EmailService (notifications), and Logger (audit trail) means a change in email " +
    "templates cannot break authentication logic. The UserService facade coordinates them without owning their logic.",
  realWorldExample:
    "In a restaurant, the chef cooks, the waiter serves, and the cashier handles payments. " +
    "If one person did all three, any change (new menu, new POS system) would disrupt everything. " +
    "SRP says each class should own exactly one job, just like each restaurant role owns one responsibility.",
};

// ═════════════════════════════════════════════════════════════
//  2. OCP — Open/Closed Principle (LLD-025)
// ═════════════════════════════════════════════════════════════

const ocp: SOLIDDemo = {
  id: "solid-ocp",
  principle: "OCP",
  name: "Open/Closed Principle",
  description:
    "A power strip with standard outlets is open for extension — plug in new devices anytime — " +
    "but closed for modification — you never rewire the strip for each new appliance. " +
    "That's the Open/Closed Principle: software entities should be open for extension but closed for modification. " +
    "Add new behavior without changing existing code.",
  summary: [
    "OCP = extend behavior by adding new code, not changing existing code",
    "Key insight: use interfaces so new variants plug in without modifying the host",
    "Use when: you keep editing the same switch/if-else block to add features",
  ],

  // -- BEFORE: if/else chain -----------------------------------
  beforeClasses: [
    {
      id: "ocp-b-proc",
      name: "PaymentProcessor",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "ocp-b-proc-meth-0", name: "process", returnType: "boolean", params: ["type: string", "amount: number"], visibility: "+" },
        { id: "ocp-b-proc-meth-1", name: "processCreditCard", returnType: "boolean", params: ["amount: number"], visibility: "-" },
        { id: "ocp-b-proc-meth-2", name: "processPayPal", returnType: "boolean", params: ["amount: number"], visibility: "-" },
        { id: "ocp-b-proc-meth-3", name: "processBitcoin", returnType: "boolean", params: ["amount: number"], visibility: "-" },
      ],
      x: 200,
      y: 120,
    },
  ],
  beforeRelationships: [],

  beforeCode: {
    typescript: `class PaymentProcessor {
  process(type: string, amount: number): boolean {
    if (type === "credit_card") {
      // Validate card, charge via Stripe...
      return true;
    } else if (type === "paypal") {
      // Redirect to PayPal, confirm...
      return true;
    } else if (type === "bitcoin") {
      // Generate wallet address, verify...
      return true;
    }
    // Every new method = edit this file!
    throw new Error(\`Unknown payment type: \${type}\`);
  }
}`,
    python: `class PaymentProcessor:
    def process(self, type: str, amount: float) -> bool:
        if type == "credit_card":
            # Validate card, charge via Stripe...
            return True
        elif type == "paypal":
            # Redirect to PayPal, confirm...
            return True
        elif type == "bitcoin":
            # Generate wallet address, verify...
            return True
        # Every new method = edit this file!
        raise ValueError(f"Unknown payment type: {type}")`,
  },

  // -- AFTER: Strategy pattern ---------------------------------
  afterClasses: [
    {
      id: "ocp-a-iface",
      name: "PaymentMethod",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ocp-a-iface-meth-0", name: "pay", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "ocp-a-iface-meth-1", name: "getName", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "ocp-a-cc",
      name: "CreditCardPayment",
      stereotype: "class",
      attributes: [
        { id: "ocp-a-cc-attr-0", name: "cardNumber", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ocp-a-cc-meth-0", name: "pay", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "ocp-a-cc-meth-1", name: "getName", returnType: "string", params: [], visibility: "+" },
      ],
      x: 50,
      y: 250,
    },
    {
      id: "ocp-a-pp",
      name: "PayPalPayment",
      stereotype: "class",
      attributes: [
        { id: "ocp-a-pp-attr-0", name: "email", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ocp-a-pp-meth-0", name: "pay", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "ocp-a-pp-meth-1", name: "getName", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 250,
    },
    {
      id: "ocp-a-btc",
      name: "BitcoinPayment",
      stereotype: "class",
      attributes: [
        { id: "ocp-a-btc-attr-0", name: "walletAddress", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ocp-a-btc-meth-0", name: "pay", returnType: "boolean", params: ["amount: number"], visibility: "+" },
        { id: "ocp-a-btc-meth-1", name: "getName", returnType: "string", params: [], visibility: "+" },
      ],
      x: 550,
      y: 250,
    },
    {
      id: "ocp-a-proc",
      name: "PaymentProcessor",
      stereotype: "class",
      attributes: [
        { id: "ocp-a-proc-attr-0", name: "method", type: "PaymentMethod", visibility: "-" },
      ],
      methods: [
        { id: "ocp-a-proc-meth-0", name: "process", returnType: "boolean", params: ["amount: number"], visibility: "+" },
      ],
      x: 300,
      y: 440,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "ocp-a-cc", target: "ocp-a-iface", type: "realization" },
    { id: rid(), source: "ocp-a-pp", target: "ocp-a-iface", type: "realization" },
    { id: rid(), source: "ocp-a-btc", target: "ocp-a-iface", type: "realization" },
    { id: rid(), source: "ocp-a-proc", target: "ocp-a-iface", type: "dependency", label: "uses" },
  ],

  afterCode: {
    typescript: `interface PaymentMethod {
  pay(amount: number): boolean;
  getName(): string;
}

class CreditCardPayment implements PaymentMethod {
  pay(amount: number): boolean { /* charge via Stripe */ return true; }
  getName(): string { return "Credit Card"; }
}

class PayPalPayment implements PaymentMethod {
  pay(amount: number): boolean { /* PayPal API call */ return true; }
  getName(): string { return "PayPal"; }
}

class PaymentProcessor {
  constructor(private method: PaymentMethod) {}
  process(amount: number): boolean { return this.method.pay(amount); }
}
// Adding ApplePay? Just implement PaymentMethod. No edits needed.`,
    python: `from abc import ABC, abstractmethod

class PaymentMethod(ABC):
    @abstractmethod
    def pay(self, amount: float) -> bool: ...
    @abstractmethod
    def get_name(self) -> str: ...

class CreditCardPayment(PaymentMethod):
    def pay(self, amount: float) -> bool: return True  # Stripe
    def get_name(self) -> str: return "Credit Card"

class PayPalPayment(PaymentMethod):
    def pay(self, amount: float) -> bool: return True  # PayPal API
    def get_name(self) -> str: return "PayPal"

class PaymentProcessor:
    def __init__(self, method: PaymentMethod):
        self.method = method
    def process(self, amount: float) -> bool:
        return self.method.pay(amount)
# Adding ApplePay? Just implement PaymentMethod. No edits needed.`,
  },

  explanation:
    "The original PaymentProcessor needed modification every time a new payment method was added (violating OCP). " +
    "By extracting a PaymentMethod interface, new methods (e.g., ApplePay) can be added by simply creating a new class " +
    "that implements the interface -- no changes to PaymentProcessor are required.",
  realWorldExample:
    "A power strip with standard outlets is open for extension — plug in new devices — " +
    "but closed for modification — you never rewire the strip. " +
    "Similarly, the Strategy pattern lets you add new payment methods by implementing an interface, " +
    "without ever touching the PaymentProcessor.",
};

// ═════════════════════════════════════════════════════════════
//  3. LSP — Liskov Substitution Principle (LLD-026)
// ═════════════════════════════════════════════════════════════

const lsp: SOLIDDemo = {
  id: "solid-lsp",
  principle: "LSP",
  name: "Liskov Substitution Principle",
  description:
    "If you hire a 'driver' who can drive any car, a 'bus driver' subtype should also be able to drive any car. " +
    "If the bus driver can only drive buses, substitution fails — and so does your program. " +
    "That's the Liskov Substitution Principle: objects of a superclass should be replaceable " +
    "with objects of its subclasses without breaking the program.",
  summary: [
    "LSP = subtypes must be substitutable for their base types without surprises",
    "Key insight: if overriding a method changes its contract, the hierarchy is wrong",
    "Use when: a subclass throws exceptions or no-ops methods the parent promises",
  ],

  // -- BEFORE: Rectangle/Square violation ----------------------
  beforeClasses: [
    {
      id: "lsp-b-rect",
      name: "Rectangle",
      stereotype: "class",
      attributes: [
        { id: "lsp-b-rect-attr-0", name: "width", type: "number", visibility: "#" },
        { id: "lsp-b-rect-attr-1", name: "height", type: "number", visibility: "#" },
      ],
      methods: [
        { id: "lsp-b-rect-meth-0", name: "setWidth", returnType: "void", params: ["w: number"], visibility: "+" },
        { id: "lsp-b-rect-meth-1", name: "setHeight", returnType: "void", params: ["h: number"], visibility: "+" },
        { id: "lsp-b-rect-meth-2", name: "area", returnType: "number", params: [], visibility: "+" },
      ],
      x: 200,
      y: 50,
    },
    {
      id: "lsp-b-sq",
      name: "Square",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "lsp-b-sq-meth-0", name: "setWidth", returnType: "void", params: ["w: number"], visibility: "+" },
        { id: "lsp-b-sq-meth-1", name: "setHeight", returnType: "void", params: ["h: number"], visibility: "+" },
        { id: "lsp-b-sq-meth-2", name: "area", returnType: "number", params: [], visibility: "+" },
      ],
      x: 200,
      y: 280,
    },
  ],
  beforeRelationships: [
    { id: rid(), source: "lsp-b-sq", target: "lsp-b-rect", type: "inheritance" },
  ],

  beforeCode: {
    typescript: `class Rectangle {
  constructor(protected width: number, protected height: number) {}
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area(): number { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w: number) { this.width = w; this.height = w; } // surprise!
  setHeight(h: number) { this.width = h; this.height = h; } // surprise!
}

function printArea(r: Rectangle) {
  r.setWidth(5);
  r.setHeight(4);
  console.log(r.area()); // expects 20, Square gives 16!
}`,
    python: `class Rectangle:
    def __init__(self, width: float, height: float):
        self._width = width
        self._height = height

    def set_width(self, w: float): self._width = w
    def set_height(self, h: float): self._height = h
    def area(self) -> float: return self._width * self._height

class Square(Rectangle):
    def set_width(self, w: float):
        self._width = w; self._height = w  # surprise!
    def set_height(self, h: float):
        self._width = h; self._height = h  # surprise!

def print_area(r: Rectangle):
    r.set_width(5)
    r.set_height(4)
    print(r.area())  # expects 20, Square gives 16!`,
  },

  // -- AFTER: proper Shape hierarchy ---------------------------
  afterClasses: [
    {
      id: "lsp-a-shape",
      name: "Shape",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "lsp-a-shape-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "lsp-a-shape-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "lsp-a-rect",
      name: "Rectangle",
      stereotype: "class",
      attributes: [
        { id: "lsp-a-rect-attr-0", name: "width", type: "number", visibility: "-" },
        { id: "lsp-a-rect-attr-1", name: "height", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lsp-a-rect-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "lsp-a-rect-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
      ],
      x: 100,
      y: 250,
    },
    {
      id: "lsp-a-sq",
      name: "Square",
      stereotype: "class",
      attributes: [
        { id: "lsp-a-sq-attr-0", name: "side", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lsp-a-sq-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "lsp-a-sq-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
      ],
      x: 370,
      y: 250,
    },
    {
      id: "lsp-a-circle",
      name: "Circle",
      stereotype: "class",
      attributes: [
        { id: "lsp-a-circle-attr-0", name: "radius", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "lsp-a-circle-meth-0", name: "area", returnType: "number", params: [], visibility: "+" },
        { id: "lsp-a-circle-meth-1", name: "perimeter", returnType: "number", params: [], visibility: "+" },
      ],
      x: 600,
      y: 250,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "lsp-a-rect", target: "lsp-a-shape", type: "realization" },
    { id: rid(), source: "lsp-a-sq", target: "lsp-a-shape", type: "realization" },
    { id: rid(), source: "lsp-a-circle", target: "lsp-a-shape", type: "realization" },
  ],

  afterCode: {
    typescript: `interface Shape {
  area(): number;
  perimeter(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area(): number { return this.width * this.height; }
  perimeter(): number { return 2 * (this.width + this.height); }
}

class Square implements Shape {
  constructor(private side: number) {}
  area(): number { return this.side ** 2; }
  perimeter(): number { return 4 * this.side; }
}

function printArea(shape: Shape) {
  console.log(shape.area()); // works for any Shape
}`,
    python: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...
    @abstractmethod
    def perimeter(self) -> float: ...

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self._width, self._height = width, height
    def area(self) -> float: return self._width * self._height
    def perimeter(self) -> float: return 2 * (self._width + self._height)

class Square(Shape):
    def __init__(self, side: float):
        self._side = side
    def area(self) -> float: return self._side ** 2
    def perimeter(self) -> float: return 4 * self._side

def print_area(shape: Shape):
    print(shape.area())  # works for any Shape`,
  },

  explanation:
    "When Square extends Rectangle, calling setWidth() on a Square must also set the height (to keep sides equal), " +
    "which breaks the assumption that width and height are independent -- violating LSP. " +
    "Instead, both Rectangle and Square implement a Shape interface with area() and perimeter(). " +
    "Any code using Shape can safely substitute any implementation without surprises.",
  realWorldExample:
    "If you hire a 'driver' (base type) who can drive any car, a 'bus driver' subtype should also " +
    "be able to drive any car. If the bus driver can only drive buses, substitution fails. " +
    "The classic code example is Rectangle/Square: a Square that overrides setWidth to also set height " +
    "breaks any code expecting independent width and height.",
};

// ═════════════════════════════════════════════════════════════
//  4. ISP — Interface Segregation Principle (LLD-027)
// ═════════════════════════════════════════════════════════════

const isp: SOLIDDemo = {
  id: "solid-isp",
  principle: "ISP",
  name: "Interface Segregation Principle",
  description:
    "A restaurant menu with separate sections (appetizers, mains, desserts) is better than one giant list. " +
    "A vegan customer only looks at the relevant section instead of scanning everything. " +
    "That's the Interface Segregation Principle: clients should not be forced to depend on interfaces they do not use. " +
    "Prefer many small, specific interfaces.",
  summary: [
    "ISP = split fat interfaces into small, focused ones",
    "Key insight: clients should only depend on methods they actually call",
    "Use when: implementors are forced to stub methods they don't need",
  ],

  // -- BEFORE: one fat Worker interface ------------------------
  beforeClasses: [
    {
      id: "isp-b-worker",
      name: "Worker",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "isp-b-worker-meth-0", name: "work", returnType: "void", params: [], visibility: "+" },
        { id: "isp-b-worker-meth-1", name: "eat", returnType: "void", params: [], visibility: "+" },
        { id: "isp-b-worker-meth-2", name: "sleep", returnType: "void", params: [], visibility: "+" },
      ],
      x: 250,
      y: 50,
    },
    {
      id: "isp-b-human",
      name: "HumanWorker",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "isp-b-human-meth-0", name: "work", returnType: "void", params: [], visibility: "+" },
        { id: "isp-b-human-meth-1", name: "eat", returnType: "void", params: [], visibility: "+" },
        { id: "isp-b-human-meth-2", name: "sleep", returnType: "void", params: [], visibility: "+" },
      ],
      x: 100,
      y: 280,
    },
    {
      id: "isp-b-robot",
      name: "RobotWorker",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "isp-b-robot-meth-0", name: "work", returnType: "void", params: [], visibility: "+" },
        { id: "isp-b-robot-meth-1", name: "eat", returnType: "void", params: [], visibility: "+" },
        { id: "isp-b-robot-meth-2", name: "sleep", returnType: "void", params: [], visibility: "+" },
      ],
      x: 400,
      y: 280,
    },
  ],
  beforeRelationships: [
    { id: rid(), source: "isp-b-human", target: "isp-b-worker", type: "realization" },
    { id: rid(), source: "isp-b-robot", target: "isp-b-worker", type: "realization" },
  ],

  beforeCode: {
    typescript: `interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class HumanWorker implements Worker {
  work() { console.log("Writing code..."); }
  eat()  { console.log("Eating lunch..."); }
  sleep() { console.log("Sleeping..."); }
}

class RobotWorker implements Worker {
  work() { console.log("Assembling parts..."); }
  eat()  { throw new Error("Robots don't eat!"); }  // forced stub
  sleep() { throw new Error("Robots don't sleep!"); } // forced stub
}`,
    python: `from abc import ABC, abstractmethod

class Worker(ABC):
    @abstractmethod
    def work(self) -> None: ...
    @abstractmethod
    def eat(self) -> None: ...
    @abstractmethod
    def sleep(self) -> None: ...

class HumanWorker(Worker):
    def work(self): print("Writing code...")
    def eat(self): print("Eating lunch...")
    def sleep(self): print("Sleeping...")

class RobotWorker(Worker):
    def work(self): print("Assembling parts...")
    def eat(self): raise NotImplementedError("Robots don't eat!")
    def sleep(self): raise NotImplementedError("Robots don't sleep!")`,
  },

  // -- AFTER: segregated interfaces ----------------------------
  afterClasses: [
    {
      id: "isp-a-workable",
      name: "Workable",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "isp-a-workable-meth-0", name: "work", returnType: "void", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "isp-a-feedable",
      name: "Feedable",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "isp-a-feedable-meth-0", name: "eat", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "isp-a-sleepable",
      name: "Sleepable",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "isp-a-sleepable-meth-0", name: "sleep", returnType: "void", params: [], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "isp-a-human",
      name: "HumanWorker",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "isp-a-human-meth-0", name: "work", returnType: "void", params: [], visibility: "+" },
        { id: "isp-a-human-meth-1", name: "eat", returnType: "void", params: [], visibility: "+" },
        { id: "isp-a-human-meth-2", name: "sleep", returnType: "void", params: [], visibility: "+" },
      ],
      x: 150,
      y: 270,
    },
    {
      id: "isp-a-robot",
      name: "RobotWorker",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "isp-a-robot-meth-0", name: "work", returnType: "void", params: [], visibility: "+" },
      ],
      x: 450,
      y: 270,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "isp-a-human", target: "isp-a-workable", type: "realization" },
    { id: rid(), source: "isp-a-human", target: "isp-a-feedable", type: "realization" },
    { id: rid(), source: "isp-a-human", target: "isp-a-sleepable", type: "realization" },
    { id: rid(), source: "isp-a-robot", target: "isp-a-workable", type: "realization" },
  ],

  afterCode: {
    typescript: `interface Workable { work(): void; }
interface Feedable { eat(): void; }
interface Sleepable { sleep(): void; }

class HumanWorker implements Workable, Feedable, Sleepable {
  work()  { console.log("Writing code..."); }
  eat()   { console.log("Eating lunch..."); }
  sleep() { console.log("Sleeping..."); }
}

class RobotWorker implements Workable {
  work() { console.log("Assembling parts..."); }
  // No eat() or sleep() — not needed!
}

function assignTask(worker: Workable) {
  worker.work(); // only depends on what it needs
}`,
    python: `from abc import ABC, abstractmethod

class Workable(ABC):
    @abstractmethod
    def work(self) -> None: ...

class Feedable(ABC):
    @abstractmethod
    def eat(self) -> None: ...

class Sleepable(ABC):
    @abstractmethod
    def sleep(self) -> None: ...

class HumanWorker(Workable, Feedable, Sleepable):
    def work(self): print("Writing code...")
    def eat(self): print("Eating lunch...")
    def sleep(self): print("Sleeping...")

class RobotWorker(Workable):
    def work(self): print("Assembling parts...")
    # No eat() or sleep() — not needed!`,
  },

  explanation:
    "The original Worker interface forced RobotWorker to implement eat() and sleep() with no-ops or exceptions, " +
    "because robots don't eat or sleep. Segregating into Workable, Feedable, and Sleepable lets RobotWorker " +
    "implement only Workable, while HumanWorker implements all three. Clients depend only on the interface they need.",
  realWorldExample:
    "A restaurant menu with separate sections (appetizers, mains, desserts) is better than one giant list. " +
    "A vegan customer only looks at the relevant section instead of scanning everything. " +
    "In code, a RobotWorker should not be forced to implement eat() and sleep() just because the Worker interface demands it.",
};

// ═════════════════════════════════════════════════════════════
//  5. DIP — Dependency Inversion Principle (LLD-028)
// ═════════════════════════════════════════════════════════════

const dip: SOLIDDemo = {
  id: "solid-dip",
  principle: "DIP",
  name: "Dependency Inversion Principle",
  description:
    "An electrical appliance depends on a 'wall outlet' abstraction, not on specific wiring behind the wall. " +
    "Whether the power comes from solar panels or a coal plant, the appliance works the same way. " +
    "That's the Dependency Inversion Principle: high-level modules should not depend on low-level modules. " +
    "Both should depend on abstractions. Abstractions should not depend on details.",
  summary: [
    "DIP = depend on abstractions (interfaces), not concrete implementations",
    "Key insight: invert the dependency so high-level policy owns the interface",
    "Use when: swapping a database, API, or service should require zero changes upstream",
  ],

  // -- BEFORE: direct dependency on MySQL ----------------------
  beforeClasses: [
    {
      id: "dip-b-order",
      name: "OrderService",
      stereotype: "class",
      attributes: [
        { id: "dip-b-order-attr-0", name: "db", type: "MySQLDatabase", visibility: "-" },
      ],
      methods: [
        { id: "dip-b-order-meth-0", name: "createOrder", returnType: "Order", params: ["items: Item[]"], visibility: "+" },
        { id: "dip-b-order-meth-1", name: "getOrder", returnType: "Order", params: ["id: string"], visibility: "+" },
      ],
      x: 200,
      y: 50,
    },
    {
      id: "dip-b-mysql",
      name: "MySQLDatabase",
      stereotype: "class",
      attributes: [
        { id: "dip-b-mysql-attr-0", name: "connection", type: "Connection", visibility: "-" },
      ],
      methods: [
        { id: "dip-b-mysql-meth-0", name: "query", returnType: "any[]", params: ["sql: string"], visibility: "+" },
        { id: "dip-b-mysql-meth-1", name: "execute", returnType: "void", params: ["sql: string"], visibility: "+" },
      ],
      x: 200,
      y: 280,
    },
  ],
  beforeRelationships: [
    { id: rid(), source: "dip-b-order", target: "dip-b-mysql", type: "dependency", label: "creates directly" },
  ],

  beforeCode: {
    typescript: `class OrderService {
  private db: MySQLDatabase;

  constructor() {
    this.db = new MySQLDatabase("localhost", 3306); // hard-coded!
  }

  createOrder(items: Item[]): Order {
    const order = new Order(items);
    this.db.execute(\`INSERT INTO orders ...\`);
    return order;
  }

  getOrder(id: string): Order {
    const rows = this.db.query(\`SELECT * FROM orders WHERE id='\${id}'\`);
    return Order.fromRow(rows[0]);
  }
}
// Can't test without a real MySQL! Can't swap to Postgres.`,
    python: `class OrderService:
    def __init__(self):
        self.db = MySQLDatabase("localhost", 3306)  # hard-coded!

    def create_order(self, items: list[Item]) -> Order:
        order = Order(items)
        self.db.execute("INSERT INTO orders ...")
        return order

    def get_order(self, id: str) -> Order:
        rows = self.db.query(f"SELECT * FROM orders WHERE id='{id}'")
        return Order.from_row(rows[0])

# Can't test without a real MySQL! Can't swap to Postgres.`,
  },

  // -- AFTER: depends on Repository interface ------------------
  afterClasses: [
    {
      id: "dip-a-order",
      name: "OrderService",
      stereotype: "class",
      attributes: [
        { id: "dip-a-order-attr-0", name: "repo", type: "OrderRepository", visibility: "-" },
      ],
      methods: [
        { id: "dip-a-order-meth-0", name: "createOrder", returnType: "Order", params: ["items: Item[]"], visibility: "+" },
        { id: "dip-a-order-meth-1", name: "getOrder", returnType: "Order", params: ["id: string"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "dip-a-repo",
      name: "OrderRepository",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "dip-a-repo-meth-0", name: "save", returnType: "void", params: ["order: Order"], visibility: "+" },
        { id: "dip-a-repo-meth-1", name: "findById", returnType: "Order", params: ["id: string"], visibility: "+" },
        { id: "dip-a-repo-meth-2", name: "findAll", returnType: "Order[]", params: [], visibility: "+" },
      ],
      x: 300,
      y: 250,
    },
    {
      id: "dip-a-mysql",
      name: "MySQLOrderRepository",
      stereotype: "class",
      attributes: [
        { id: "dip-a-mysql-attr-0", name: "connection", type: "Connection", visibility: "-" },
      ],
      methods: [
        { id: "dip-a-mysql-meth-0", name: "save", returnType: "void", params: ["order: Order"], visibility: "+" },
        { id: "dip-a-mysql-meth-1", name: "findById", returnType: "Order", params: ["id: string"], visibility: "+" },
        { id: "dip-a-mysql-meth-2", name: "findAll", returnType: "Order[]", params: [], visibility: "+" },
      ],
      x: 100,
      y: 460,
    },
    {
      id: "dip-a-mongo",
      name: "MongoOrderRepository",
      stereotype: "class",
      attributes: [
        { id: "dip-a-mongo-attr-0", name: "collection", type: "Collection", visibility: "-" },
      ],
      methods: [
        { id: "dip-a-mongo-meth-0", name: "save", returnType: "void", params: ["order: Order"], visibility: "+" },
        { id: "dip-a-mongo-meth-1", name: "findById", returnType: "Order", params: ["id: string"], visibility: "+" },
        { id: "dip-a-mongo-meth-2", name: "findAll", returnType: "Order[]", params: [], visibility: "+" },
      ],
      x: 500,
      y: 460,
    },
  ],
  afterRelationships: [
    { id: rid(), source: "dip-a-order", target: "dip-a-repo", type: "dependency", label: "depends on" },
    { id: rid(), source: "dip-a-mysql", target: "dip-a-repo", type: "realization" },
    { id: rid(), source: "dip-a-mongo", target: "dip-a-repo", type: "realization" },
  ],

  afterCode: {
    typescript: `interface OrderRepository {
  save(order: Order): void;
  findById(id: string): Order | null;
}

class MySQLOrderRepository implements OrderRepository {
  save(order: Order) { /* INSERT via mysql2 driver */ }
  findById(id: string) { /* SELECT via mysql2 driver */ return null; }
}

class MongoOrderRepository implements OrderRepository {
  save(order: Order) { /* collection.insertOne() */ }
  findById(id: string) { /* collection.findOne() */ return null; }
}

class OrderService {
  constructor(private repo: OrderRepository) {} // injected!
  createOrder(items: Item[]): Order {
    const order = new Order(items);
    this.repo.save(order);
    return order;
  }
}`,
    python: `from abc import ABC, abstractmethod

class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order) -> None: ...
    @abstractmethod
    def find_by_id(self, id: str) -> Order | None: ...

class MySQLOrderRepository(OrderRepository):
    def save(self, order: Order) -> None: pass  # INSERT via mysql
    def find_by_id(self, id: str) -> Order | None: return None

class MongoOrderRepository(OrderRepository):
    def save(self, order: Order) -> None: pass  # insertOne
    def find_by_id(self, id: str) -> Order | None: return None

class OrderService:
    def __init__(self, repo: OrderRepository):  # injected!
        self.repo = repo
    def create_order(self, items: list[Item]) -> Order:
        order = Order(items)
        self.repo.save(order)
        return order`,
  },

  explanation:
    "Originally OrderService directly instantiated MySQLDatabase, creating a hard coupling to a specific technology. " +
    "By introducing an OrderRepository interface, OrderService depends only on the abstraction. " +
    "Swapping from MySQL to MongoDB (or an in-memory store for tests) requires zero changes to OrderService.",
  realWorldExample:
    "An electrical appliance depends on a 'wall outlet' abstraction (interface), not on specific wiring. " +
    "Whether the power comes from solar or coal, the appliance works the same way. " +
    "In code, OrderService depends on an OrderRepository interface — swapping MySQL for MongoDB requires zero changes to the service.",
};

// ═════════════════════════════════════════════════════════════
//  SOLID Violation Quiz (LLD-073)
// ═════════════════════════════════════════════════════════════

export interface SOLIDQuizQuestion {
  id: string;
  code: string;
  language: "typescript" | "python";
  violatedPrinciple: SOLIDPrinciple;
  hint: string;
  explanation: string;
}

export const SOLID_QUIZ_QUESTIONS: SOLIDQuizQuestion[] = [
  // ── SRP Violations (5) ─────────────────────────────────────
  {
    id: "quiz-srp-1",
    code: `class UserService {
  authenticate(email: string, pw: string): boolean { /* ... */ }
  sendEmail(to: string, body: string): void { /* ... */ }
  logActivity(action: string): void { /* ... */ }
  generateReport(): PDF { /* ... */ }
}`,
    language: "typescript",
    violatedPrinciple: "SRP",
    hint: "Count the distinct responsibilities. How many reasons does this class have to change?",
    explanation: "UserService handles authentication, email, logging, and reporting -- four independent reasons to change. Each should be a separate service.",
  },
  {
    id: "quiz-srp-2",
    code: `class Invoice:
    def calculate_total(self) -> float: ...
    def save_to_database(self) -> None: ...
    def generate_pdf(self) -> bytes: ...
    def send_to_customer(self, email: str) -> None: ...`,
    language: "python",
    violatedPrinciple: "SRP",
    hint: "An invoice is a domain object. Should it know about databases, PDFs, and email?",
    explanation: "Invoice mixes domain logic (calculate_total) with persistence (save_to_database), rendering (generate_pdf), and delivery (send_to_customer). Each is a separate responsibility.",
  },
  {
    id: "quiz-srp-3",
    code: `class Employee {
  calculatePay(): number { /* tax logic, overtime, deductions */ }
  saveToDatabase(): void { /* SQL INSERT/UPDATE */ }
  generatePayslip(): string { /* HTML template rendering */ }
}`,
    language: "typescript",
    violatedPrinciple: "SRP",
    hint: "Who asks for changes to pay calculation vs. database schema vs. payslip format?",
    explanation: "Three different stakeholders drive changes: HR (pay rules), DBA (persistence), and Finance (payslip format). The class has three reasons to change.",
  },
  {
    id: "quiz-srp-4",
    code: `class OrderProcessor:
    def validate_order(self, order: Order) -> bool: ...
    def charge_payment(self, card: CreditCard, amount: float) -> bool: ...
    def update_inventory(self, items: list[Item]) -> None: ...
    def send_confirmation(self, email: str) -> None: ...`,
    language: "python",
    violatedPrinciple: "SRP",
    hint: "Each method touches a completely different subsystem. What if the payment provider changes?",
    explanation: "OrderProcessor handles validation, payment, inventory, and notification -- four unrelated concerns. A payment provider change forces editing a class that also manages inventory.",
  },
  {
    id: "quiz-srp-5",
    code: `class Logger {
  log(message: string): void {
    const formatted = \`[\${new Date().toISOString()}] \${message}\`;
    fs.appendFileSync("app.log", formatted + "\\n");
    if (message.includes("ERROR")) {
      this.sendSlackAlert(formatted);
    }
  }
  private sendSlackAlert(msg: string): void { /* Slack API */ }
}`,
    language: "typescript",
    violatedPrinciple: "SRP",
    hint: "Logging to a file and sending Slack alerts are two different responsibilities.",
    explanation: "Logger mixes file I/O formatting with Slack notification logic. Changing the alert threshold or Slack API shouldn't require modifying the file logging code.",
  },

  // ── OCP Violations (5) ─────────────────────────────────────
  {
    id: "quiz-ocp-1",
    code: `class DiscountCalculator {
  calculate(customer: Customer): number {
    if (customer.type === "regular") return 0;
    if (customer.type === "premium") return 0.1;
    if (customer.type === "vip") return 0.2;
    if (customer.type === "employee") return 0.3;
    return 0;
  }
}`,
    language: "typescript",
    violatedPrinciple: "OCP",
    hint: "What happens when a new customer type is added? Which file must be edited?",
    explanation: "Every new customer type requires modifying this class's if/else chain. A Strategy or Map-based approach would let you add new types without touching existing code.",
  },
  {
    id: "quiz-ocp-2",
    code: `class NotificationSender:
    def send(self, channel: str, message: str) -> None:
        if channel == "email":
            self._send_email(message)
        elif channel == "sms":
            self._send_sms(message)
        elif channel == "push":
            self._send_push(message)
        # Adding Slack? Edit this file!`,
    language: "python",
    violatedPrinciple: "OCP",
    hint: "The comment at the bottom is the tell. What pattern would make this extensible?",
    explanation: "Adding a new notification channel requires modifying the if/elif chain. An interface-based approach (Strategy pattern) would allow extension without modification.",
  },
  {
    id: "quiz-ocp-3",
    code: `class ShapeRenderer {
  render(shape: Shape): void {
    switch (shape.kind) {
      case "circle": this.drawCircle(shape); break;
      case "rectangle": this.drawRect(shape); break;
      case "triangle": this.drawTriangle(shape); break;
      // Every new shape = edit this switch
    }
  }
}`,
    language: "typescript",
    violatedPrinciple: "OCP",
    hint: "The switch statement must grow with every new shape. How could shapes render themselves?",
    explanation: "Each new shape forces modification of the switch statement. If Shape had a render() method, new shapes could be added without touching ShapeRenderer.",
  },
  {
    id: "quiz-ocp-4",
    code: `class ReportExporter:
    def export(self, data: Report, fmt: str) -> bytes:
        if fmt == "pdf":
            return self._to_pdf(data)
        elif fmt == "csv":
            return self._to_csv(data)
        elif fmt == "excel":
            return self._to_excel(data)
        raise ValueError(f"Unknown format: {fmt}")`,
    language: "python",
    violatedPrinciple: "OCP",
    hint: "Every new export format means editing this function. What abstraction would help?",
    explanation: "Adding JSON or XML export requires modifying this class. An Exporter interface with format-specific implementations would be open for extension, closed for modification.",
  },
  {
    id: "quiz-ocp-5",
    code: `class TaxCalculator {
  calculateTax(country: string, amount: number): number {
    if (country === "US") return amount * 0.07;
    if (country === "UK") return amount * 0.20;
    if (country === "DE") return amount * 0.19;
    if (country === "JP") return amount * 0.10;
    return 0;
  }
}`,
    language: "typescript",
    violatedPrinciple: "OCP",
    hint: "Expanding to 200 countries means 200 if-statements. What data structure or pattern could replace this?",
    explanation: "Every new country requires modifying the if-chain. A registry of TaxStrategy implementations (or a simple config map) would allow adding countries without changing the calculator.",
  },

  // ── LSP Violations (5) ─────────────────────────────────────
  {
    id: "quiz-lsp-1",
    code: `class Bird {
  fly(): void { console.log("Flying!"); }
}
class Penguin extends Bird {
  fly(): void { throw new Error("Penguins can't fly!"); }
}
function migrate(bird: Bird) {
  bird.fly(); // Crashes for Penguin!
}`,
    language: "typescript",
    violatedPrinciple: "LSP",
    hint: "Can you safely replace Bird with Penguin everywhere Bird is expected?",
    explanation: "Penguin extends Bird but throws on fly(), breaking the contract. Code expecting any Bird to fly() will crash. Penguin should not extend Bird, or Bird needs a canFly() check.",
  },
  {
    id: "quiz-lsp-2",
    code: `class Rectangle:
    def __init__(self, w: float, h: float):
        self._w, self._h = w, h
    def set_width(self, w: float): self._w = w
    def set_height(self, h: float): self._h = h
    def area(self) -> float: return self._w * self._h

class Square(Rectangle):
    def set_width(self, w: float):
        self._w = w; self._h = w
    def set_height(self, h: float):
        self._w = h; self._h = h`,
    language: "python",
    violatedPrinciple: "LSP",
    hint: "If you set width=5 and height=4 on a Square, what's the area? Is that what Rectangle promises?",
    explanation: "Square overrides setWidth/setHeight to keep sides equal, breaking Rectangle's contract that width and height are independent. area() returns unexpected results.",
  },
  {
    id: "quiz-lsp-3",
    code: `class ReadOnlyFile {
  read(): string { return this.content; }
}
class WritableFile extends ReadOnlyFile {
  write(data: string): void { this.content = data; }
}
class LogFile extends ReadOnlyFile {
  read(): string {
    throw new Error("Log files are write-only!");
  }
}`,
    language: "typescript",
    violatedPrinciple: "LSP",
    hint: "LogFile extends ReadOnlyFile but doesn't allow reading. Is it substitutable?",
    explanation: "LogFile inherits from ReadOnlyFile but throws on read(), violating the base class contract. Any code expecting to read a ReadOnlyFile will crash with a LogFile.",
  },
  {
    id: "quiz-lsp-4",
    code: `class Collection:
    def add(self, item: Any) -> None: ...
    def get(self, index: int) -> Any: ...
    def size(self) -> int: ...

class ImmutableCollection(Collection):
    def add(self, item: Any) -> None:
        raise NotImplementedError("Cannot modify!")`,
    language: "python",
    violatedPrinciple: "LSP",
    hint: "ImmutableCollection says 'I am a Collection' but refuses to add items. Is that substitutable?",
    explanation: "ImmutableCollection extends Collection but throws on add(), breaking the base contract. Code written against Collection expects add() to work.",
  },
  {
    id: "quiz-lsp-5",
    code: `class Transport {
  refuel(liters: number): void { this.fuel += liters; }
  drive(km: number): void { /* uses fuel */ }
}
class ElectricCar extends Transport {
  refuel(liters: number): void {
    throw new Error("Electric cars don't use fuel!");
  }
}`,
    language: "typescript",
    violatedPrinciple: "LSP",
    hint: "Can you use an ElectricCar wherever a Transport is expected? What happens at the gas station?",
    explanation: "ElectricCar extends Transport but throws on refuel(), breaking substitutability. The hierarchy should separate fuel-based and electric vehicles behind a common interface.",
  },

  // ── ISP Violations (5) ─────────────────────────────────────
  {
    id: "quiz-isp-1",
    code: `interface SmartDevice {
  turnOn(): void;
  turnOff(): void;
  connectWifi(): void;
  printDocument(): void;
  scanDocument(): void;
  sendFax(): void;
}
class SmartLight implements SmartDevice {
  turnOn() { /* OK */ }
  turnOff() { /* OK */ }
  connectWifi() { /* OK */ }
  printDocument() { throw new Error("Not a printer"); }
  scanDocument() { throw new Error("Not a scanner"); }
  sendFax() { throw new Error("Not a fax"); }
}`,
    language: "typescript",
    violatedPrinciple: "ISP",
    hint: "How many methods does SmartLight actually use vs. how many it's forced to implement?",
    explanation: "SmartDevice forces SmartLight to implement printing, scanning, and faxing methods it doesn't need. Split into Switchable, WifiCapable, Printable, etc.",
  },
  {
    id: "quiz-isp-2",
    code: `class Reportable(ABC):
    @abstractmethod
    def generate_pdf(self) -> bytes: ...
    @abstractmethod
    def generate_csv(self) -> bytes: ...
    @abstractmethod
    def generate_excel(self) -> bytes: ...
    @abstractmethod
    def send_email(self, to: str) -> None: ...

class SimpleReport(Reportable):
    def generate_pdf(self) -> bytes: return b"..."
    def generate_csv(self) -> bytes:
        raise NotImplementedError("CSV not supported")
    def generate_excel(self) -> bytes:
        raise NotImplementedError("Excel not supported")
    def send_email(self, to: str) -> None:
        raise NotImplementedError("No email")`,
    language: "python",
    violatedPrinciple: "ISP",
    hint: "SimpleReport only supports PDF but must implement four methods. Is the interface too fat?",
    explanation: "The Reportable interface forces all implementors to support every format and email. Split into PdfExportable, CsvExportable, Emailable, etc.",
  },
  {
    id: "quiz-isp-3",
    code: `interface Repository<T> {
  findAll(): T[];
  findById(id: string): T | null;
  create(item: T): T;
  update(id: string, item: Partial<T>): T;
  delete(id: string): void;
  bulkInsert(items: T[]): T[];
  aggregate(pipeline: any[]): any[];
  createIndex(field: string): void;
}
class ReadOnlyCache implements Repository<CacheEntry> {
  findAll() { /* OK */ }
  findById(id: string) { /* OK */ }
  create() { throw new Error("Read-only!"); }
  update() { throw new Error("Read-only!"); }
  delete() { throw new Error("Read-only!"); }
  bulkInsert() { throw new Error("Read-only!"); }
  aggregate() { throw new Error("Read-only!"); }
  createIndex() { throw new Error("Read-only!"); }
}`,
    language: "typescript",
    violatedPrinciple: "ISP",
    hint: "The cache only reads, but the interface demands write, bulk, and admin operations. How many stubs?",
    explanation: "Repository is a fat interface. ReadOnlyCache needs only findAll/findById but must stub 6 other methods. Split into Readable, Writable, Indexable, etc.",
  },
  {
    id: "quiz-isp-4",
    code: `class Animal(ABC):
    @abstractmethod
    def walk(self) -> None: ...
    @abstractmethod
    def swim(self) -> None: ...
    @abstractmethod
    def fly(self) -> None: ...

class Dog(Animal):
    def walk(self) -> None: print("Walking")
    def swim(self) -> None: print("Swimming")
    def fly(self) -> None:
        raise NotImplementedError("Dogs can't fly")`,
    language: "python",
    violatedPrinciple: "ISP",
    hint: "Not all animals can do all three. Which methods are forced on Dog unnecessarily?",
    explanation: "The Animal interface forces Dog to implement fly(), which it can't do. Segregate into Walkable, Swimmable, and Flyable interfaces.",
  },
  {
    id: "quiz-isp-5",
    code: `interface UIComponent {
  render(): HTMLElement;
  onClick(handler: () => void): void;
  onHover(handler: () => void): void;
  onDrag(handler: () => void): void;
  onResize(handler: () => void): void;
  animate(keyframes: Keyframe[]): void;
}
class StaticLabel implements UIComponent {
  render() { return document.createElement("span"); }
  onClick() { /* no-op */ }
  onHover() { /* no-op */ }
  onDrag() { /* no-op */ }
  onResize() { /* no-op */ }
  animate() { /* no-op */ }
}`,
    language: "typescript",
    violatedPrinciple: "ISP",
    hint: "A static label needs none of the event or animation methods. How many are wasted?",
    explanation: "StaticLabel only needs render() but is forced to no-op five other methods. Split into Renderable, Clickable, Draggable, Animatable.",
  },

  // ── DIP Violations (5) ─────────────────────────────────────
  {
    id: "quiz-dip-1",
    code: `class OrderService {
  private db = new MySQLDatabase("localhost", 3306);
  private mailer = new SendGridMailer("api-key-123");

  createOrder(items: Item[]): Order {
    const order = new Order(items);
    this.db.insert("orders", order);
    this.mailer.send(order.email, "Order confirmed!");
    return order;
  }
}`,
    language: "typescript",
    violatedPrinciple: "DIP",
    hint: "OrderService creates its own dependencies with 'new'. What if you want to swap MySQL for Postgres?",
    explanation: "OrderService directly instantiates MySQLDatabase and SendGridMailer, creating hard coupling. It should depend on abstractions (interfaces) injected via constructor.",
  },
  {
    id: "quiz-dip-2",
    code: `class WeatherApp:
    def get_weather(self, city: str) -> dict:
        api = OpenWeatherMapClient("api-key")
        data = api.fetch(city)
        return {"temp": data["main"]["temp"]}`,
    language: "python",
    violatedPrinciple: "DIP",
    hint: "The high-level WeatherApp directly creates a low-level API client. What if the API changes?",
    explanation: "WeatherApp creates OpenWeatherMapClient directly. Swapping to a different weather API requires changing WeatherApp. Inject a WeatherProvider interface instead.",
  },
  {
    id: "quiz-dip-3",
    code: `class UserController {
  handleLogin(req: Request): Response {
    const hasher = new BcryptHasher();
    const repo = new PostgresUserRepo();
    const user = repo.findByEmail(req.body.email);
    if (user && hasher.verify(req.body.password, user.hash)) {
      return new Response(200, "OK");
    }
    return new Response(401, "Unauthorized");
  }
}`,
    language: "typescript",
    violatedPrinciple: "DIP",
    hint: "The controller creates BcryptHasher and PostgresUserRepo directly. Can you unit test this without a database?",
    explanation: "UserController is coupled to Bcrypt and Postgres. Testing requires real instances. Inject PasswordHasher and UserRepository interfaces for testability and flexibility.",
  },
  {
    id: "quiz-dip-4",
    code: `class NotificationService:
    def notify(self, user_id: str, message: str) -> None:
        db = MySQLConnection("prod-host", 3306)
        user = db.query(f"SELECT email FROM users WHERE id={user_id}")
        smtp = SmtpClient("mail.company.com", 587)
        smtp.send(user["email"], "Notification", message)`,
    language: "python",
    violatedPrinciple: "DIP",
    hint: "The service creates its own database and SMTP connections. What does 'inversion' mean here?",
    explanation: "NotificationService depends on concrete MySQLConnection and SmtpClient. Invert by depending on UserRepository and EmailSender interfaces, injected from outside.",
  },
  {
    id: "quiz-dip-5",
    code: `class AnalyticsTracker {
  private logger = new FileLogger("/var/log/analytics.log");
  private store = new RedisClient("localhost", 6379);

  track(event: string, data: Record<string, unknown>): void {
    this.store.set(\`event:\${event}\`, JSON.stringify(data));
    this.logger.write(\`Tracked: \${event}\`);
  }
}`,
    language: "typescript",
    violatedPrinciple: "DIP",
    hint: "AnalyticsTracker directly constructs FileLogger and RedisClient. What if you want to use CloudWatch instead of files?",
    explanation: "Hard-coded dependencies on FileLogger and RedisClient mean swapping to CloudWatch or DynamoDB requires rewriting the tracker. Inject Logger and EventStore interfaces.",
  },
];

// ── Exports ──────────────────────────────────────────────────

export const SOLID_DEMOS: SOLIDDemo[] = [srp, ocp, lsp, isp, dip];

export function getSOLIDDemoById(id: string): SOLIDDemo | undefined {
  return SOLID_DEMOS.find((d) => d.id === id);
}

export function getSOLIDDemoByPrinciple(
  principle: SOLIDPrinciple,
): SOLIDDemo | undefined {
  return SOLID_DEMOS.find((d) => d.principle === principle);
}
