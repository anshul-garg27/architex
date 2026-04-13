// ─────────────────────────────────────────────────────────────
// Architex — Web Attack Simulations  (SEC-011)
// ─────────────────────────────────────────────────────────────
//
// Educational demonstrations of common web vulnerabilities:
// 1. Cross-Site Scripting (XSS)
// 2. Cross-Site Request Forgery (CSRF)
// 3. SQL Injection
//
// Each simulation returns step-by-step explanations showing the
// attack both **without** and **with** the corresponding defense.
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

export type WebAttackType = "xss" | "csrf" | "sql-injection";

export interface AttackStep {
  /** Logical tick/ordering of the step. */
  tick: number;
  /** The entity performing this step (e.g. "Attacker", "Victim", "Server"). */
  actor: "Attacker" | "Victim" | "Server" | "Browser" | "Malicious Site";
  /** Short action label. */
  action: string;
  /** The raw payload involved (if any). */
  payload?: string;
  /** The defense that neutralises the payload (if any). */
  defense?: string;
  /** Longer description of what happens. */
  description: string;
  /** Whether this step represents attack activity (red) vs normal/defense (green). */
  isAttack: boolean;
}

// ── XSS ─────────────────────────────────────────────────────

/**
 * Simulate a reflected XSS attack.
 *
 * Without sanitisation the injected `<script>` tag executes.
 * With DOMPurify / output encoding the script is stripped and
 * rendered as harmless text.
 */
export function simulateXSSAttack(): AttackStep[] {
  return [
    {
      tick: 1,
      actor: "Attacker",
      action: "Craft malicious input",
      payload: `<script>alert('xss')</script>`,
      description:
        "The attacker enters a malicious script tag into a form field (e.g. a search box or comment field) on the target website.",
      isAttack: true,
    },
    {
      tick: 2,
      actor: "Browser",
      action: "Submit form to server",
      payload: `GET /search?q=<script>alert('xss')</script>`,
      description:
        "The browser sends the unsanitised user input to the server as part of a request parameter.",
      isAttack: true,
    },
    {
      tick: 3,
      actor: "Server",
      action: "Reflect input in HTML (no defense)",
      payload: `<p>Results for: <script>alert('xss')</script></p>`,
      description:
        "WITHOUT DEFENSE: The server echoes the raw input directly into the HTML response without encoding or sanitisation.",
      isAttack: true,
    },
    {
      tick: 4,
      actor: "Victim",
      action: "Script executes in victim's browser",
      payload: `alert('xss')  // cookies, tokens, DOM all accessible`,
      description:
        "WITHOUT DEFENSE: The victim's browser parses the response, finds the <script> tag, and executes the attacker's JavaScript. The attacker can steal cookies, session tokens, or redirect the user.",
      isAttack: true,
    },
    {
      tick: 5,
      actor: "Server",
      action: "Apply output encoding (WITH defense)",
      payload: `<p>Results for: &lt;script&gt;alert('xss')&lt;/script&gt;</p>`,
      defense: "HTML entity encoding + DOMPurify sanitisation",
      description:
        "WITH DEFENSE: The server HTML-encodes special characters before inserting user input into the response. The angle brackets become &lt; and &gt;, preventing the browser from interpreting them as HTML tags.",
      isAttack: false,
    },
    {
      tick: 6,
      actor: "Victim",
      action: "Safe text rendered",
      payload: `Displays literal text: <script>alert('xss')</script>`,
      defense: "Content-Security-Policy header blocks inline scripts",
      description:
        "WITH DEFENSE: The browser renders the harmless escaped text. Additionally, a Content-Security-Policy header (script-src 'self') blocks any inline script execution as a second layer of defense.",
      isAttack: false,
    },
  ];
}

// ── CSRF ────────────────────────────────────────────────────

/**
 * Simulate a CSRF attack against a bank transfer endpoint.
 *
 * Without a CSRF token the forged request succeeds because the
 * victim's session cookie is sent automatically.
 * With a CSRF token the server rejects the forged request.
 */
export function simulateCSRFAttack(): AttackStep[] {
  return [
    {
      tick: 1,
      actor: "Victim",
      action: "Log in to bank",
      payload: `Set-Cookie: session=abc123; HttpOnly; Secure`,
      description:
        "The victim logs in to their bank. The server sets an authenticated session cookie that the browser will automatically attach to every subsequent request to the bank's domain.",
      isAttack: false,
    },
    {
      tick: 2,
      actor: "Attacker",
      action: "Craft malicious page",
      payload: `<form action="https://bank.com/transfer" method="POST">\n  <input name="to" value="attacker-acct" />\n  <input name="amount" value="10000" />\n</form>\n<script>document.forms[0].submit()</script>`,
      description:
        "The attacker hosts a page on evil.com containing a hidden form that auto-submits a POST request to the bank's transfer endpoint.",
      isAttack: true,
    },
    {
      tick: 3,
      actor: "Victim",
      action: "Visit attacker's page",
      description:
        "The victim clicks a link (e.g. in a phishing email) that navigates to evil.com. The hidden form auto-submits immediately.",
      isAttack: true,
    },
    {
      tick: 4,
      actor: "Malicious Site",
      action: "Forge POST to bank (no defense)",
      payload: `POST /transfer HTTP/1.1\nHost: bank.com\nCookie: session=abc123\nContent-Type: application/x-www-form-urlencoded\n\nto=attacker-acct&amount=10000`,
      description:
        "WITHOUT DEFENSE: The browser sends the POST to bank.com with the victim's session cookie attached automatically (same-site cookies not enforced). The bank cannot distinguish this from a legitimate request.",
      isAttack: true,
    },
    {
      tick: 5,
      actor: "Server",
      action: "Transfer succeeds (no defense)",
      payload: `HTTP/1.1 200 OK\n{"status":"success","transferred":"$10,000"}`,
      description:
        "WITHOUT DEFENSE: The bank processes the forged request. $10,000 is transferred to the attacker's account because the session cookie validated the request.",
      isAttack: true,
    },
    {
      tick: 6,
      actor: "Server",
      action: "Require CSRF token (WITH defense)",
      payload: `<input type="hidden" name="_csrf" value="rand0m-t0ken-xyz" />`,
      defense: "Synchronizer Token Pattern + SameSite=Strict cookie",
      description:
        "WITH DEFENSE: The bank embeds a unique CSRF token in every legitimate form. The token is tied to the user's session and validated on the server for every state-changing request.",
      isAttack: false,
    },
    {
      tick: 7,
      actor: "Server",
      action: "Reject forged request (WITH defense)",
      payload: `HTTP/1.1 403 Forbidden\n{"error":"CSRF token missing or invalid"}`,
      defense: "SameSite=Strict prevents cookie from being sent cross-origin",
      description:
        "WITH DEFENSE: The forged request from evil.com does not include the correct CSRF token (the attacker cannot read it due to same-origin policy). The server rejects the request with 403. Additionally, SameSite=Strict on the cookie prevents the browser from sending it on cross-site requests.",
      isAttack: false,
    },
  ];
}

// ── SQL Injection ───────────────────────────────────────────

/**
 * Simulate a SQL injection attack on a login form.
 *
 * Without parameterised queries the attacker bypasses authentication.
 * With prepared statements the input is treated as a literal string.
 */
export function simulateSQLInjection(): AttackStep[] {
  return [
    {
      tick: 1,
      actor: "Attacker",
      action: "Enter malicious username",
      payload: `' OR '1'='1' --`,
      description:
        "The attacker enters a specially crafted string into the username field of a login form. The single quotes and SQL operators are designed to alter the query logic.",
      isAttack: true,
    },
    {
      tick: 2,
      actor: "Browser",
      action: "Submit login form",
      payload: `POST /login\nusername=' OR '1'='1' --&password=anything`,
      description:
        "The browser sends the form data to the server. The malicious input travels as a normal form field value.",
      isAttack: true,
    },
    {
      tick: 3,
      actor: "Server",
      action: "Build query via concatenation (no defense)",
      payload: `SELECT * FROM users\nWHERE username = '' OR '1'='1' --'\nAND password = 'anything'`,
      description:
        "WITHOUT DEFENSE: The server concatenates the user input directly into the SQL string. The injected OR '1'='1' always evaluates to TRUE, and the -- comments out the password check.",
      isAttack: true,
    },
    {
      tick: 4,
      actor: "Server",
      action: "Query returns all users (no defense)",
      payload: `Result: [{id:1, username:'admin', role:'superadmin'},\n {id:2, username:'alice', role:'user'}, ...]`,
      description:
        "WITHOUT DEFENSE: The database returns ALL user rows because the WHERE clause is always true. The server logs the attacker in as the first user (typically the admin).",
      isAttack: true,
    },
    {
      tick: 5,
      actor: "Server",
      action: "Use parameterised query (WITH defense)",
      payload: `SELECT * FROM users\nWHERE username = $1 AND password = $2\n-- $1 = "' OR '1'='1' --"  (literal string)`,
      defense: "Prepared statements / parameterised queries",
      description:
        "WITH DEFENSE: The server uses a parameterised query. The database driver treats $1 as a literal string value, not as SQL syntax. The single quotes and operators have no special meaning.",
      isAttack: false,
    },
    {
      tick: 6,
      actor: "Server",
      action: "Query returns no rows (WITH defense)",
      payload: `Result: []  -- No user with username literally "' OR '1'='1' --"`,
      defense: "Input validation + least-privilege DB account",
      description:
        "WITH DEFENSE: The query finds no matching user because no one has that literal username. Login fails. Additionally, the DB connection uses a least-privilege account that cannot access other tables.",
      isAttack: false,
    },
  ];
}

// ── Helpers ─────────────────────────────────────────────────

export const WEB_ATTACK_META: Record<WebAttackType, { name: string; short: string }> = {
  xss: { name: "Cross-Site Scripting (XSS)", short: "XSS" },
  csrf: { name: "Cross-Site Request Forgery (CSRF)", short: "CSRF" },
  "sql-injection": { name: "SQL Injection", short: "SQLi" },
};

export function getWebAttackSteps(type: WebAttackType): AttackStep[] {
  switch (type) {
    case "xss":
      return simulateXSSAttack();
    case "csrf":
      return simulateCSRFAttack();
    case "sql-injection":
      return simulateSQLInjection();
  }
}

/** Column actors for the three-column attack visualization. */
export const WEB_ATTACK_COLUMNS = ["Attacker", "Victim / Browser", "Server"] as const;

/** Map an actor to its display column. */
export function actorToColumn(actor: AttackStep["actor"]): (typeof WEB_ATTACK_COLUMNS)[number] {
  switch (actor) {
    case "Attacker":
    case "Malicious Site":
      return "Attacker";
    case "Victim":
    case "Browser":
      return "Victim / Browser";
    case "Server":
      return "Server";
  }
}
