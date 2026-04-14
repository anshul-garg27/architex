"use client";

/**
 * SOLIDViolationSpotter -- Interactive exercise where users identify lines that
 * violate a specific SOLID principle in a code snippet.
 *
 * Features:
 * - Code display with clickable line numbers
 * - Progressive hints
 * - Answer checking with color-coded feedback (green=correct, red=missed, orange=wrong)
 * - Before/after code comparison
 * - Score tracking across exercises
 * - Cycles through 2 exercises per SOLID principle (10 total)
 */

import React, { memo, useState, useCallback, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Eye,
  Trophy,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SOLIDPrinciple } from "@/lib/lld";
import { PRINCIPLE_COLORS, SOLID_PRINCIPLE_LABELS } from "../constants";

// ── Types ───────────────────────────────────────────────────

interface ViolationExercise {
  id: string;
  principle: SOLIDPrinciple;
  title: string;
  code: string;
  violationLines: number[];
  explanation: string;
  fixedCode: string;
  hints: string[];
}

// ── Exercise Data (2 per principle = 10 total) ──────────────

const EXERCISES: ViolationExercise[] = [
  // ── SRP ──────────────────────────────────────────────────
  {
    id: "srp-1",
    principle: "SRP",
    title: "God Class: UserService",
    code: `class UserService {
  private db: Database;
  private mailer: SmtpClient;
  private logger: Logger;

  createUser(name: string, email: string): User {
    const user = this.db.insert({ name, email });
    this.sendWelcomeEmail(user);
    this.logAction("user_created", user.id);
    return user;
  }

  sendWelcomeEmail(user: User): void {
    const html = this.renderTemplate("welcome", user);
    this.mailer.send(user.email, "Welcome!", html);
  }

  renderTemplate(name: string, data: any): string {
    return templates[name].replace(/\\{\\{(\\w+)\\}\\}/g,
      (_, k) => data[k]);
  }

  logAction(action: string, userId: string): void {
    const entry = { action, userId, ts: Date.now() };
    this.db.insert("audit_log", entry);
    console.log(JSON.stringify(entry));
  }

  getAuditLog(userId: string): AuditEntry[] {
    return this.db.query("audit_log", { userId });
  }
}`,
    violationLines: [13, 14, 15, 18, 19, 20, 22, 23, 24, 25, 27, 28],
    explanation:
      "UserService has THREE distinct responsibilities: user CRUD, email sending/templating, and audit logging. " +
      "A change in email templates forces a change in the same class as user creation logic. " +
      "Each responsibility should be extracted into its own class: UserRepository, EmailService, and AuditLogger.",
    fixedCode: `class UserRepository {
  private db: Database;

  createUser(name: string, email: string): User {
    return this.db.insert({ name, email });
  }
}

class EmailService {
  private mailer: SmtpClient;

  sendWelcomeEmail(user: User): void {
    const html = this.renderTemplate("welcome", user);
    this.mailer.send(user.email, "Welcome!", html);
  }

  private renderTemplate(name: string, data: any): string {
    return templates[name].replace(/\\{\\{(\\w+)\\}\\}/g,
      (_, k) => data[k]);
  }
}

class AuditLogger {
  private db: Database;

  logAction(action: string, userId: string): void {
    const entry = { action, userId, ts: Date.now() };
    this.db.insert("audit_log", entry);
  }

  getAuditLog(userId: string): AuditEntry[] {
    return this.db.query("audit_log", { userId });
  }
}`,
    hints: [
      "Count how many distinct responsibilities this class handles.",
      "Would a change to the email template format require modifying user creation logic?",
      "Look for methods that deal with email, logging, and user CRUD -- they should be in separate classes.",
    ],
  },
  {
    id: "srp-2",
    principle: "SRP",
    title: "Mixed Concerns: ReportGenerator",
    code: `class ReportGenerator {
  generateReport(data: SalesData[]): Report {
    // Business logic: calculate totals
    const total = data.reduce((sum, d) => sum + d.amount, 0);
    const avg = total / data.length;
    const report = { total, avg, items: data };

    // Formatting: convert to HTML
    const html = this.toHTML(report);

    // Persistence: save to file system
    fs.writeFileSync(\`/reports/\${Date.now()}.html\`, html);

    // Notification: email the report
    this.emailReport(html, "admin@company.com");

    return report;
  }

  private toHTML(report: Report): string {
    return \`<h1>Sales: \${report.total}</h1>\`;
  }

  private emailReport(html: string, to: string): void {
    smtp.send({ to, subject: "Report", body: html });
  }
}`,
    violationLines: [9, 12, 15, 19, 20, 21, 23, 24, 25],
    explanation:
      "This class mixes FOUR concerns: business calculation, HTML formatting, file persistence, and email notification. " +
      "Any change to the output format, storage location, or notification channel requires modifying the same class. " +
      "Extract: ReportCalculator, ReportFormatter, ReportStorage, ReportNotifier.",
    fixedCode: `class ReportCalculator {
  calculate(data: SalesData[]): Report {
    const total = data.reduce((sum, d) => sum + d.amount, 0);
    const avg = total / data.length;
    return { total, avg, items: data };
  }
}

class ReportFormatter {
  toHTML(report: Report): string {
    return \`<h1>Sales: \${report.total}</h1>\`;
  }
}

class ReportStorage {
  save(html: string): void {
    fs.writeFileSync(\`/reports/\${Date.now()}.html\`, html);
  }
}

class ReportNotifier {
  send(html: string, to: string): void {
    smtp.send({ to, subject: "Report", body: html });
  }
}`,
    hints: [
      "How many different 'reasons to change' does this class have?",
      "The generateReport method does calculation, formatting, saving, AND emailing.",
      "Lines that handle formatting, file I/O, and email sending are separate responsibilities from calculation.",
    ],
  },

  // ── OCP ──────────────────────────────────────────────────
  {
    id: "ocp-1",
    principle: "OCP",
    title: "Switch Statement: PaymentProcessor",
    code: `class PaymentProcessor {
  processPayment(method: string, amount: number): boolean {
    switch (method) {
      case "credit_card":
        return this.chargeCreditCard(amount);
      case "paypal":
        return this.chargePayPal(amount);
      case "stripe":
        return this.chargeStripe(amount);
      case "bitcoin":
        return this.chargeBitcoin(amount);
      default:
        throw new Error(\`Unknown method: \${method}\`);
    }
  }

  private chargeCreditCard(amount: number): boolean {
    // credit card logic
    return true;
  }

  private chargePayPal(amount: number): boolean {
    // paypal logic
    return true;
  }

  private chargeStripe(amount: number): boolean {
    // stripe logic
    return true;
  }

  private chargeBitcoin(amount: number): boolean {
    // bitcoin logic
    return true;
  }
}`,
    violationLines: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    explanation:
      "Adding a new payment method (e.g., Apple Pay) requires MODIFYING this class -- adding a new case to the switch. " +
      "OCP says classes should be open for extension but closed for modification. " +
      "Use a PaymentStrategy interface and register new strategies without touching existing code.",
    fixedCode: `interface PaymentStrategy {
  charge(amount: number): boolean;
}

class CreditCardPayment implements PaymentStrategy {
  charge(amount: number): boolean { return true; }
}

class PayPalPayment implements PaymentStrategy {
  charge(amount: number): boolean { return true; }
}

class PaymentProcessor {
  private strategies = new Map<string, PaymentStrategy>();

  register(method: string, strategy: PaymentStrategy) {
    this.strategies.set(method, strategy);
  }

  processPayment(method: string, amount: number): boolean {
    const strategy = this.strategies.get(method);
    if (!strategy) throw new Error(\`Unknown: \${method}\`);
    return strategy.charge(amount);
  }
}`,
    hints: [
      "What happens when you need to add Apple Pay as a payment method?",
      "The switch statement forces you to MODIFY this class for every new payment type.",
      "The entire switch block violates OCP because adding new cases = modifying existing code.",
    ],
  },
  {
    id: "ocp-2",
    principle: "OCP",
    title: "If/Else Chain: AreaCalculator",
    code: `class AreaCalculator {
  calculateArea(shape: Shape): number {
    if (shape.type === "circle") {
      return Math.PI * shape.radius * shape.radius;
    } else if (shape.type === "rectangle") {
      return shape.width * shape.height;
    } else if (shape.type === "triangle") {
      return 0.5 * shape.base * shape.height;
    } else if (shape.type === "trapezoid") {
      return 0.5 * (shape.topWidth + shape.bottomWidth)
        * shape.height;
    } else {
      throw new Error(\`Unknown shape: \${shape.type}\`);
    }
  }

  calculatePerimeter(shape: Shape): number {
    if (shape.type === "circle") {
      return 2 * Math.PI * shape.radius;
    } else if (shape.type === "rectangle") {
      return 2 * (shape.width + shape.height);
    } else if (shape.type === "triangle") {
      return shape.sideA + shape.sideB + shape.sideC;
    } else {
      throw new Error(\`Unknown shape: \${shape.type}\`);
    }
  }
}`,
    violationLines: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 18, 19, 20, 21, 22, 23, 24, 25],
    explanation:
      "Every new shape type requires modifying BOTH calculateArea and calculatePerimeter methods. " +
      "The class is not closed for modification. Each shape should implement its own area() and perimeter() methods.",
    fixedCode: `interface Shape {
  area(): number;
  perimeter(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
  perimeter() { return 2 * Math.PI * this.radius; }
}

class Rectangle implements Shape {
  constructor(private w: number, private h: number) {}
  area() { return this.w * this.h; }
  perimeter() { return 2 * (this.w + this.h); }
}

class AreaCalculator {
  calculateArea(shape: Shape): number {
    return shape.area();
  }
}`,
    hints: [
      "What code changes are needed to add a Pentagon shape?",
      "Both methods use if/else chains that check shape.type -- adding a new shape means editing both.",
      "The if/else chains in lines 3-14 and 18-25 both need modification when a new shape is added.",
    ],
  },

  // ── LSP ──────────────────────────────────────────────────
  {
    id: "lsp-1",
    principle: "LSP",
    title: "Square extends Rectangle",
    code: `class Rectangle {
  constructor(
    protected width: number,
    protected height: number
  ) {}

  setWidth(w: number): void {
    this.width = w;
  }

  setHeight(h: number): void {
    this.height = h;
  }

  area(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  constructor(side: number) {
    super(side, side);
  }

  setWidth(w: number): void {
    this.width = w;
    this.height = w;
  }

  setHeight(h: number): void {
    this.width = h;
    this.height = h;
  }
}

// Client code that breaks:
function resizeAndCheck(rect: Rectangle) {
  rect.setWidth(5);
  rect.setHeight(10);
  console.assert(rect.area() === 50);  // FAILS for Square!
}`,
    violationLines: [25, 26, 27, 30, 31, 32],
    explanation:
      "Square overrides setWidth and setHeight to enforce the square invariant (width === height), " +
      "but this breaks the postcondition of Rectangle: setting width should NOT affect height, and vice versa. " +
      "Any code expecting a Rectangle will get unexpected results when given a Square. " +
      "LSP says subtypes must be substitutable for their base type without altering correctness.",
    fixedCode: `interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number
  ) {}

  setWidth(w: number): void { this.width = w; }
  setHeight(h: number): void { this.height = h; }
  area(): number { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}

  setSide(s: number): void { this.side = s; }
  area(): number { return this.side * this.side; }
}

// No inheritance relationship -- no LSP violation.`,
    hints: [
      "What happens when client code calls setWidth(5) then setHeight(10) on a Square?",
      "The overridden setWidth and setHeight methods silently change BOTH dimensions.",
      "Lines 25-27 and 30-32 break the Rectangle contract: setting one dimension should not affect the other.",
    ],
  },
  {
    id: "lsp-2",
    principle: "LSP",
    title: "Penguin extends FlyingBird",
    code: `class FlyingBird {
  protected altitude: number = 0;

  fly(height: number): void {
    this.altitude = height;
    console.log(\`Flying at \${height}m\`);
  }

  land(): void {
    this.altitude = 0;
  }

  getAltitude(): number {
    return this.altitude;
  }
}

class Eagle extends FlyingBird {
  fly(height: number): void {
    super.fly(Math.min(height, 3000));
  }
}

class Penguin extends FlyingBird {
  fly(height: number): void {
    throw new Error("Penguins can't fly!");
  }

  land(): void {
    // already on the ground
  }
}

// Client code that breaks:
function migrate(birds: FlyingBird[]): void {
  for (const bird of birds) {
    bird.fly(500);  // throws for Penguin!
  }
}`,
    violationLines: [24, 25, 26],
    explanation:
      "Penguin throws an exception in fly(), but the base class FlyingBird promises that fly() works. " +
      "Any code that iterates over FlyingBird[] and calls fly() will crash when encountering a Penguin. " +
      "LSP violation: Penguin cannot be substituted for FlyingBird without breaking the program. " +
      "Fix: separate Bird and FlyingBird hierarchies, or use a CanFly interface.",
    fixedCode: `interface Bird {
  name: string;
}

interface CanFly {
  fly(height: number): void;
  land(): void;
}

interface CanSwim {
  swim(depth: number): void;
}

class Eagle implements Bird, CanFly {
  name = "Eagle";
  private altitude = 0;

  fly(height: number): void {
    this.altitude = Math.min(height, 3000);
  }
  land(): void { this.altitude = 0; }
}

class Penguin implements Bird, CanSwim {
  name = "Penguin";

  swim(depth: number): void {
    console.log(\`Swimming at \${depth}m\`);
  }
}

function migrate(flyers: CanFly[]): void {
  for (const f of flyers) f.fly(500);  // safe!
}`,
    hints: [
      "What happens when you call fly() on every bird in a FlyingBird array?",
      "Penguin inherits from FlyingBird but throws an error when fly() is called.",
      "Lines 24-26: Penguin.fly() throws an exception, breaking the FlyingBird contract that fly() should work.",
    ],
  },

  // ── ISP ──────────────────────────────────────────────────
  {
    id: "isp-1",
    principle: "ISP",
    title: "Fat Interface: MultiFunctionDevice",
    code: `interface MultiFunctionDevice {
  print(doc: Document): void;
  scan(doc: Document): Image;
  fax(doc: Document): void;
  staple(doc: Document): void;
  photocopy(doc: Document): Document;
}

class AllInOnePrinter implements MultiFunctionDevice {
  print(doc: Document): void { /* works */ }
  scan(doc: Document): Image { /* works */ return img; }
  fax(doc: Document): void { /* works */ }
  staple(doc: Document): void { /* works */ }
  photocopy(doc: Document): Document { /* works */ return doc; }
}

class SimplePrinter implements MultiFunctionDevice {
  print(doc: Document): void { /* works */ }

  scan(doc: Document): Image {
    throw new Error("SimplePrinter cannot scan");
  }
  fax(doc: Document): void {
    throw new Error("SimplePrinter cannot fax");
  }
  staple(doc: Document): void {
    throw new Error("SimplePrinter cannot staple");
  }
  photocopy(doc: Document): Document {
    throw new Error("SimplePrinter cannot photocopy");
  }
}`,
    violationLines: [21, 22, 24, 25, 27, 28, 30, 31],
    explanation:
      "SimplePrinter is forced to implement scan(), fax(), staple(), and photocopy() that it cannot support. " +
      "ISP says clients should not be forced to depend on methods they don't use. " +
      "Break the fat interface into smaller, focused interfaces: Printable, Scannable, Faxable, etc.",
    fixedCode: `interface Printable {
  print(doc: Document): void;
}

interface Scannable {
  scan(doc: Document): Image;
}

interface Faxable {
  fax(doc: Document): void;
}

class SimplePrinter implements Printable {
  print(doc: Document): void { /* works */ }
  // No forced empty methods!
}

class AllInOnePrinter implements Printable, Scannable, Faxable {
  print(doc: Document): void { /* works */ }
  scan(doc: Document): Image { return img; }
  fax(doc: Document): void { /* works */ }
}`,
    hints: [
      "How many methods does SimplePrinter actually need?",
      "SimplePrinter only needs print(), but must implement 4 other methods that throw errors.",
      "Lines 21-31: all the throw statements are forced implementations of methods SimplePrinter doesn't support.",
    ],
  },
  {
    id: "isp-2",
    principle: "ISP",
    title: "Fat Interface: Worker",
    code: `interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
  writeReport(): void;
}

class FullTimeEmployee implements Worker {
  work(): void { /* works */ }
  eat(): void { /* works */ }
  sleep(): void { /* goes home */ }
  attendMeeting(): void { /* works */ }
  writeReport(): void { /* works */ }
}

class Robot implements Worker {
  work(): void { /* works 24/7 */ }

  eat(): void {
    // Robots don't eat -- forced empty implementation
  }
  sleep(): void {
    // Robots don't sleep -- forced empty implementation
  }
  attendMeeting(): void {
    // Robots don't attend meetings
  }
  writeReport(): void {
    // Robots don't write reports
  }
}`,
    violationLines: [20, 21, 23, 24, 26, 27, 29, 30],
    explanation:
      "Robot is forced to provide empty (no-op) implementations for eat(), sleep(), attendMeeting(), and writeReport(). " +
      "ISP says no client should be forced to depend on methods it does not use. " +
      "Split into Workable, Feedable, Restable interfaces so Robot only implements Workable.",
    fixedCode: `interface Workable {
  work(): void;
}

interface Feedable {
  eat(): void;
}

interface Restable {
  sleep(): void;
}

interface Reportable {
  attendMeeting(): void;
  writeReport(): void;
}

class FullTimeEmployee implements Workable, Feedable, Restable, Reportable {
  work(): void { /* ... */ }
  eat(): void { /* ... */ }
  sleep(): void { /* ... */ }
  attendMeeting(): void { /* ... */ }
  writeReport(): void { /* ... */ }
}

class Robot implements Workable {
  work(): void { /* works 24/7 */ }
  // No forced empty methods!
}`,
    hints: [
      "Does a Robot really need eat(), sleep(), and attendMeeting() methods?",
      "Robot has empty implementations for 4 methods it logically cannot perform.",
      "Lines 20-30: Robot provides meaningless empty bodies for eat, sleep, attendMeeting, and writeReport.",
    ],
  },

  // ── DIP ──────────────────────────────────────────────────
  {
    id: "dip-1",
    principle: "DIP",
    title: "Concrete Dependency: NotificationService",
    code: `class EmailSender {
  send(to: string, message: string): void {
    // SMTP logic
  }
}

class SMSSender {
  send(to: string, message: string): void {
    // Twilio logic
  }
}

class NotificationService {
  private emailSender = new EmailSender();
  private smsSender = new SMSSender();

  notifyByEmail(to: string, msg: string): void {
    this.emailSender.send(to, msg);
  }

  notifyBySMS(to: string, msg: string): void {
    this.smsSender.send(to, msg);
  }
}`,
    violationLines: [14, 15],
    explanation:
      "NotificationService directly instantiates EmailSender and SMSSender -- concrete low-level modules. " +
      "DIP says high-level modules should depend on abstractions, not concretions. " +
      "If you want to add PushNotificationSender or switch to SendGrid, you must modify NotificationService. " +
      "Instead, depend on a NotificationChannel interface and inject implementations.",
    fixedCode: `interface NotificationChannel {
  send(to: string, message: string): void;
}

class EmailSender implements NotificationChannel {
  send(to: string, message: string): void {
    // SMTP logic
  }
}

class SMSSender implements NotificationChannel {
  send(to: string, message: string): void {
    // Twilio logic
  }
}

class NotificationService {
  constructor(private channels: NotificationChannel[]) {}

  notify(to: string, msg: string): void {
    for (const ch of this.channels) {
      ch.send(to, msg);
    }
  }
}

// Usage: inject dependencies
const service = new NotificationService([
  new EmailSender(),
  new SMSSender(),
]);`,
    hints: [
      "Where are EmailSender and SMSSender created? Inside or outside the service?",
      "The 'new' keyword inside the class tightly couples it to concrete implementations.",
      "Lines 14-15: creating concrete instances inside the class means the high-level module depends on low-level details.",
    ],
  },
  {
    id: "dip-2",
    principle: "DIP",
    title: "Concrete Dependency: OrderService",
    code: `class MySQLDatabase {
  query(sql: string): any[] {
    // MySQL-specific query
    return [];
  }

  insert(table: string, data: any): void {
    // MySQL-specific insert
  }
}

class OrderService {
  private db = new MySQLDatabase();

  getOrders(): Order[] {
    return this.db.query("SELECT * FROM orders");
  }

  createOrder(order: Order): void {
    this.db.insert("orders", order);
    // Directly using MySQL -- cannot switch to Postgres
    // without rewriting OrderService
  }

  getOrdersByUser(userId: string): Order[] {
    return this.db.query(
      \`SELECT * FROM orders WHERE user_id = '\${userId}'\`
    );
  }
}`,
    violationLines: [13],
    explanation:
      "OrderService directly instantiates MySQLDatabase, coupling the high-level business logic to a specific database vendor. " +
      "DIP says high-level modules should depend on abstractions. " +
      "Switching from MySQL to Postgres or MongoDB requires rewriting OrderService. " +
      "Instead, define a Database or OrderRepository interface and inject it via the constructor.",
    fixedCode: `interface OrderRepository {
  findAll(): Order[];
  findByUser(userId: string): Order[];
  create(order: Order): void;
}

class MySQLOrderRepository implements OrderRepository {
  private db: MySQLDatabase;

  findAll(): Order[] {
    return this.db.query("SELECT * FROM orders");
  }

  findByUser(userId: string): Order[] {
    return this.db.query(
      \`SELECT * FROM orders WHERE user_id = ?\`, [userId]
    );
  }

  create(order: Order): void {
    this.db.insert("orders", order);
  }
}

class OrderService {
  constructor(private repo: OrderRepository) {}

  getOrders(): Order[] {
    return this.repo.findAll();
  }

  createOrder(order: Order): void {
    this.repo.create(order);
  }
}

// Inject: new OrderService(new MySQLOrderRepository())`,
    hints: [
      "What happens if you need to switch from MySQL to PostgreSQL?",
      "Look for the 'new' keyword inside the class -- where is the database instantiated?",
      "Line 13: 'new MySQLDatabase()' tightly couples OrderService to a specific database implementation.",
    ],
  },
];

// ── Feedback state per line ────────────────────────────────

type LineFeedback = "correct" | "missed" | "wrong" | null;

// ── Component ──────────────────────────────────────────────

interface SOLIDViolationSpotterProps {
  /** Optional: filter to exercises matching this principle */
  principle?: SOLIDPrinciple;
}

export const SOLIDViolationSpotter = memo(function SOLIDViolationSpotter({
  principle,
}: SOLIDViolationSpotterProps) {
  const exercises = useMemo(() => {
    if (principle) return EXERCISES.filter((e) => e.principle === principle);
    return EXERCISES;
  }, [principle]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [lineFeedback, setLineFeedback] = useState<Map<number, LineFeedback>>(new Map());
  const [hintIdx, setHintIdx] = useState(-1);
  const [showFixed, setShowFixed] = useState(false);
  const [scores, setScores] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  const exercise = exercises[currentIdx];
  if (!exercise) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-foreground-subtle">No exercises available.</p>
      </div>
    );
  }

  const codeLines = exercise.code.split("\n");
  const violationSet = new Set(exercise.violationLines);

  const handleLineClick = (lineNum: number) => {
    if (checked) return;
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) {
        next.delete(lineNum);
      } else {
        next.add(lineNum);
      }
      return next;
    });
  };

  const handleCheck = () => {
    const feedback = new Map<number, LineFeedback>();
    let correctCount = 0;

    // Mark correct selections (user selected & is a violation)
    for (const line of selectedLines) {
      if (violationSet.has(line)) {
        feedback.set(line, "correct");
        correctCount++;
      } else {
        feedback.set(line, "wrong");
      }
    }

    // Mark missed violations (user didn't select but is a violation)
    for (const line of violationSet) {
      if (!selectedLines.has(line)) {
        feedback.set(line, "missed");
      }
    }

    const isFullyCorrect = correctCount === violationSet.size && selectedLines.size === violationSet.size;

    setLineFeedback(feedback);
    setChecked(true);
    setScores((prev) => ({
      correct: prev.correct + (isFullyCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    const nextIdx = (currentIdx + 1) % exercises.length;
    setCurrentIdx(nextIdx);
    setSelectedLines(new Set());
    setChecked(false);
    setLineFeedback(new Map());
    setHintIdx(-1);
    setShowFixed(false);
  };

  const handleReset = () => {
    setSelectedLines(new Set());
    setChecked(false);
    setLineFeedback(new Map());
    setHintIdx(-1);
    setShowFixed(false);
  };

  const handlePrev = () => {
    const prevIdx = (currentIdx - 1 + exercises.length) % exercises.length;
    setCurrentIdx(prevIdx);
    setSelectedLines(new Set());
    setChecked(false);
    setLineFeedback(new Map());
    setHintIdx(-1);
    setShowFixed(false);
  };

  const handleShowHint = () => {
    setHintIdx((prev) => Math.min(prev + 1, exercise.hints.length - 1));
  };

  const principleColor = PRINCIPLE_COLORS[exercise.principle];

  // Count correct/missed/wrong in feedback
  let correctCount = 0;
  let missedCount = 0;
  let wrongCount = 0;
  for (const [, fb] of lineFeedback) {
    if (fb === "correct") correctCount++;
    if (fb === "missed") missedCount++;
    if (fb === "wrong") wrongCount++;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-5 w-8 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold backdrop-blur-sm"
            style={{
              color: principleColor,
              backgroundColor: `${principleColor}18`,
              borderColor: `${principleColor}30`,
            }}
          >
            {exercise.principle}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {exercise.title}
          </span>
          <span className="text-[10px] text-foreground-subtle">
            ({SOLID_PRINCIPLE_LABELS[exercise.principle]})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-foreground-subtle">
            <Trophy className="h-3 w-3" />
            {scores.correct}/{scores.total}
          </span>
          <span className="text-[10px] text-foreground-subtle">
            {currentIdx + 1}/{exercises.length}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-2 border-b border-border/30 bg-primary/5">
        <p className="text-[11px] text-foreground-muted leading-relaxed">
          Click on the lines that violate the <strong>{SOLID_PRINCIPLE_LABELS[exercise.principle]}</strong> principle.
          Then press <strong>Check Answer</strong> to see how you did.
        </p>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Code panel (or side-by-side when showing fixed) */}
        <div className={cn("flex-1 overflow-auto", showFixed && "w-1/2 border-r border-border/30")}>
          <div className="px-2 py-1">
            {showFixed && (
              <div className="px-2 py-1 mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Before (Violation)
              </div>
            )}
            <pre className="text-[11px] leading-relaxed font-mono">
              {codeLines.map((line, idx) => {
                const lineNum = idx + 1;
                const isSelected = selectedLines.has(lineNum);
                const feedback = lineFeedback.get(lineNum);

                let bgClass = "";
                let textExtra = "";
                if (checked) {
                  if (feedback === "correct") {
                    bgClass = "bg-green-500/15 border-l-2 border-green-500";
                  } else if (feedback === "missed") {
                    bgClass = "bg-red-500/15 border-l-2 border-red-500 animate-pulse";
                  } else if (feedback === "wrong") {
                    bgClass = "bg-orange-500/15 border-l-2 border-orange-500";
                  }
                } else if (isSelected) {
                  bgClass = "bg-yellow-500/15 border-l-2 border-yellow-500";
                }

                return (
                  <div
                    key={lineNum}
                    onClick={() => handleLineClick(lineNum)}
                    className={cn(
                      "flex cursor-pointer rounded-sm px-1 py-px transition-colors hover:bg-accent/30",
                      bgClass,
                      checked && "cursor-default",
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label={`Line ${lineNum}${isSelected ? " (selected)" : ""}${feedback ? ` (${feedback})` : ""}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleLineClick(lineNum);
                      }
                    }}
                  >
                    <span className="w-8 shrink-0 select-none text-right text-foreground-subtle/50 pr-2">
                      {lineNum}
                    </span>
                    <span className="whitespace-pre">{line}</span>
                    {checked && feedback === "wrong" && (
                      <span className="ml-2 text-[9px] text-orange-400 shrink-0">
                        not a violation
                      </span>
                    )}
                    {checked && feedback === "missed" && (
                      <span className="ml-2 text-[9px] text-red-400 shrink-0">
                        missed
                      </span>
                    )}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Fixed code panel (shown after checking) */}
        {showFixed && (
          <div className="w-1/2 overflow-auto">
            <div className="px-2 py-1">
              <div className="px-2 py-1 mb-1 text-[10px] font-semibold uppercase tracking-wider text-green-400">
                After (Fixed)
              </div>
              <pre className="text-[11px] leading-relaxed font-mono px-1">
                {exercise.fixedCode.split("\n").map((line, idx) => (
                  <div key={idx} className="flex px-1 py-px">
                    <span className="w-8 shrink-0 select-none text-right text-foreground-subtle/50 pr-2">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Feedback panel */}
      {checked && (
        <div className="border-t border-border/30 px-4 py-2 space-y-2 bg-elevated/30">
          {/* Score summary */}
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle className="h-3 w-3" /> {correctCount} correct
            </span>
            {missedCount > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="h-3 w-3" /> {missedCount} missed
              </span>
            )}
            {wrongCount > 0 && (
              <span className="flex items-center gap-1 text-orange-400">
                <AlertTriangle className="h-3 w-3" /> {wrongCount} false positives
              </span>
            )}
          </div>

          {/* Explanation */}
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-3">
            <p className="text-[11px] leading-relaxed text-foreground-muted">
              {exercise.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Hints */}
      {!checked && hintIdx >= 0 && (
        <div className="border-t border-border/30 px-4 py-2 bg-amber-500/5">
          <div className="space-y-1">
            {exercise.hints.slice(0, hintIdx + 1).map((hint, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-300">
                <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between border-t border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          {!checked && (
            <>
              <button
                onClick={handleCheck}
                disabled={selectedLines.size === 0}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all",
                  selectedLines.size > 0
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(110,86,207,0.3)] hover:bg-primary/90"
                    : "bg-elevated/50 text-foreground-subtle cursor-not-allowed",
                )}
              >
                Check Answer
              </button>
              <button
                onClick={handleShowHint}
                disabled={hintIdx >= exercise.hints.length - 1}
                className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-foreground-subtle transition-all hover:bg-elevated hover:text-foreground disabled:opacity-40"
              >
                <Lightbulb className="h-3 w-3" />
                Hint {hintIdx >= 0 ? `(${hintIdx + 1}/${exercise.hints.length})` : ""}
              </button>
            </>
          )}
          {checked && (
            <>
              <button
                onClick={() => setShowFixed((p) => !p)}
                className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-foreground-subtle transition-all hover:bg-elevated hover:text-foreground"
              >
                <Eye className="h-3 w-3" />
                {showFixed ? "Hide Fix" : "Show Fix"}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2.5 py-1.5 text-[10px] font-medium text-foreground-subtle transition-all hover:bg-elevated hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-[10px] font-medium text-foreground-subtle transition-all hover:bg-elevated hover:text-foreground"
            aria-label="Previous exercise"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-2.5 py-1.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary/20"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default SOLIDViolationSpotter;
