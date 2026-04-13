# Design a Payment System -- 45-Minute Interview Script

## How to Use This Script

This is a minute-by-minute simulation of a real system design interview for
"Design a Payment System." Read both the **Interviewer** and **Candidate** lines
aloud to internalize the pacing, the transitions, and the depth expected at each
stage. The Candidate responses represent a strong Senior / Staff-level answer.

---

## Opening (0:00 -- 1:00)

**Interviewer:** Today I want you to design a payment system for an e-commerce
platform. Think of something like what Stripe or Amazon handles internally -- a user
clicks "Pay," their credit card is charged, the merchant gets paid, and everyone's
books balance. Take a moment to organize your thoughts.

**Candidate:** Thank you. This is one of the most unforgiving domains in system
design -- money can't be lost, duplicated, or stuck. I'll start with clarifying
questions, then requirements, estimation, high-level design, APIs, data model, and
I'd like to deep-dive into two areas: idempotency and double-entry ledger
accounting. Let me begin.

**Interviewer:** Let's go.

---

## Clarifying Questions (1:00 -- 4:00)

**Candidate:** First -- are we designing a payment gateway like Stripe, or an
internal payment system for a single e-commerce company?

**Interviewer:** An internal payment system for a large e-commerce company. You will
integrate with external Payment Service Providers like Stripe, Adyen, or PayPal.
You're not building the PSP itself.

**Candidate:** Understood. What payment methods are in scope? Credit/debit cards,
bank transfers, wallets?

**Interviewer:** Start with credit/debit cards. Mention wallets and bank transfers
as extensions.

**Candidate:** Do we need to handle refunds?

**Interviewer:** Yes, full and partial refunds are in scope.

**Candidate:** What about currency? Single currency or multi-currency?

**Interviewer:** Assume USD primarily, but mention multi-currency considerations.

**Candidate:** Do we need to be PCI DSS compliant? Are we storing card numbers?

**Interviewer:** Great question. We should NOT store raw card numbers. Tokenize
through the PSP. But I want you to explain what PCI compliance means for our
architecture.

**Candidate:** Last -- what about reconciliation? Do we need to match our records
against bank settlement files?

**Interviewer:** Absolutely. Reconciliation is critical. I want to hear how you
detect discrepancies.

**Candidate:** Perfect. Let me summarize requirements.

---

## Requirements (4:00 -- 7:00)

### Functional Requirements

**Candidate:** Here's what I'll design:

1. **Pay-in** -- charge a customer's card for an order (authorize + capture)
2. **Refund** -- full or partial refund for a completed payment
3. **Payment status** -- track the lifecycle: pending -> authorized -> captured ->
   settled (or failed / refunded)
4. **Idempotency** -- retrying the same payment request never double-charges
5. **Double-entry ledger** -- every money movement is recorded as balanced debits
   and credits
6. **Reconciliation** -- daily process to match our ledger against PSP settlement
   reports
7. **Webhook notifications** -- inform the order service when payment status changes

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Correctness | Zero tolerance for double-charges or lost payments |
| Latency | < 2 seconds end-to-end for a payment |
| Availability | 99.99% -- payment failure = lost revenue |
| Consistency | Strong consistency for payment state transitions |
| PCI compliance | No raw card data in our systems |
| Audit trail | Complete, immutable log of every state change |
| Throughput | 10,000 payments per second at peak (e.g., flash sale) |

**Interviewer:** That correctness requirement is key. Let's see how you enforce it.

---

## Estimation (7:00 -- 10:00)

**Candidate:** Let me size this.

**Transaction volume:**
- 500 million orders per year (large e-commerce)
- Peak: 10,000 payments/second during flash sales (Black Friday)
- Average: ~1,500 payments/second
- Each payment involves: 1 auth + 1 capture = 2 PSP calls
- PSP call latency: 200-800 ms each

**Storage:**
- Payment record: ~1 KB (IDs, amounts, status, timestamps, metadata)
- Ledger entries: 2 rows per payment (debit + credit) * ~200 bytes = 400 bytes
- Daily: 500M/365 = ~1.4M payments/day, ~1.4 GB/day for payment records
- Yearly: ~500 GB for payment data, ~200 GB for ledger entries
- Retention: 7 years for financial records (regulatory)

**PSP integration:**
- At 10K payments/sec peak with 2 PSP calls each = 20K outbound HTTP calls/sec
- Need connection pooling, circuit breakers, and PSP failover (primary + backup PSP)

**Candidate:** The key constraint is that PSP calls are the bottleneck -- 200-800 ms
of network latency that we can't optimize away. The architecture must be async-friendly.

---

## High-Level Design (10:00 -- 18:00)

**Candidate:** Here's the architecture:

```
    ┌──────────────────────┐
    │   Order Service       │
    │   "User clicks Pay"   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │    API Gateway        │
    │    Auth, Rate Limit   │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────────────────────────────────┐
    │              Payment Service                      │
    │                                                   │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
    │  │ Payment  │  │ Idempot. │  │ State Machine │   │
    │  │ API      │  │ Store    │  │ Engine        │   │
    │  └────┬─────┘  └──────────┘  └──────┬────────┘   │
    │       │                             │            │
    │       ▼                             ▼            │
    │  ┌──────────────────────────────────────┐        │
    │  │        Payment Database (Postgres)    │        │
    │  │   - payments table (source of truth)  │        │
    │  │   - idempotency_keys table            │        │
    │  │   - payment_events table (audit log)  │        │
    │  └──────────────────────────────────────┘        │
    └──────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────────┐
          │            │                │
    ┌─────▼─────┐  ┌───▼──────────┐  ┌──▼──────────────┐
    │  PSP      │  │  Ledger      │  │  Notification    │
    │  Gateway  │  │  Service     │  │  Service         │
    │  (Stripe, │  │  (double     │  │  (webhooks to    │
    │   Adyen)  │  │   entry)     │  │   order service) │
    └─────┬─────┘  └───┬──────────┘  └─────────────────┘
          │            │
          ▼            ▼
    ┌───────────┐  ┌───────────────────┐
    │ External  │  │ Ledger Database   │
    │ PSPs      │  │ (Postgres)        │
    │ (Stripe,  │  │ - journal_entries │
    │  Adyen)   │  │ - accounts        │
    └───────────┘  └───────────────────┘
                          │
                   ┌──────▼───────────┐
                   │  Reconciliation  │
                   │  Service         │
                   │  (daily batch)   │
                   └──────────────────┘
```

**Candidate:** Let me trace through a payment flow:

**Step 1: Order Service calls Payment Service.**
The Order Service sends a payment request with an `idempotency_key`, the order_id,
amount, currency, and a payment token (tokenized card from the client-side Stripe.js
integration -- we never see the raw card number).

**Step 2: Idempotency check.**
The Payment Service checks the `idempotency_keys` table. If this key exists and has
a completed response, return the cached response immediately. If it exists with
status `in_progress`, return 409 Conflict (concurrent duplicate). If new, insert
with status `in_progress` and proceed.

**Step 3: Create payment record.**
Insert a row into the `payments` table with status `CREATED`. Write a
`payment_events` audit entry.

**Step 4: Authorize with PSP.**
The PSP Gateway sends an authorization request to Stripe with the payment token and
amount. Stripe returns an `authorization_id` and status (approved / declined).

**Step 5: Update payment status.**
If approved: status -> `AUTHORIZED`. If declined: status -> `FAILED`.
Write another audit event.

**Step 6: Capture.**
For most e-commerce, we authorize at checkout and capture at shipment. When the
warehouse ships, the Order Service calls `POST /payments/{id}/capture`. We call the
PSP's capture API with the `authorization_id`.

**Step 7: Ledger entry.**
On successful capture, the Ledger Service creates double-entry records. Write audit
event. Status -> `CAPTURED`.

**Step 8: Notification.**
The Notification Service sends a webhook to the Order Service: "Payment captured
successfully."

**Interviewer:** What if the user is charged but the order fails? Say Stripe says
"approved" but your database write fails?

**Candidate:** This is the critical failure case. Here's how we handle it:

The PSP authorization succeeded, so the customer's card has a hold. But our database
write to record the authorization failed. Without our record, we've lost track of
the charge.

**Defense 1: Transaction wrapping.** We write the payment record with status
`AUTHORIZING` BEFORE calling the PSP. If the PSP call succeeds and the subsequent
status update fails, we have a record in `AUTHORIZING` state that we can reconcile.

**Defense 2: PSP reconciliation.** Our daily reconciliation process pulls all
transactions from Stripe's API and compares against our database. Any authorization
on Stripe's side that we don't have a record for is flagged. We either capture it
(if the order is valid) or void/reverse it.

**Defense 3: Idempotent retry.** The Order Service retries the payment request with
the same idempotency key. On retry, we see the payment in `AUTHORIZING` state, check
with Stripe using the idempotency key, get the authorization result, and update our
record. No double charge because Stripe's idempotency key prevents a second auth.

---

## API Design (18:00 -- 21:00)

**Candidate:** Here are the core payment APIs.

### Create Payment (Authorize)

```
POST /v1/payments
Headers:
    Idempotency-Key: idk_order_12345_attempt_1
    X-Tenant-Id: merchant_abc

{
    "order_id": "order_12345",
    "amount": 9999,              // $99.99 in cents -- ALWAYS use minor units
    "currency": "USD",
    "payment_method": {
        "type": "card",
        "token": "tok_stripe_abc123"   // tokenized by client-side Stripe.js
    },
    "description": "Order #12345",
    "metadata": {
        "customer_id": "cust_789",
        "items": "3 widgets"
    },
    "capture": false               // authorize only; capture later
}

Response 201:
{
    "payment_id": "pay_a1b2c3",
    "status": "authorized",
    "amount": 9999,
    "currency": "USD",
    "psp_reference": "ch_stripe_xyz",
    "authorized_at": "2026-04-07T12:00:01Z"
}
```

### Capture Payment

```
POST /v1/payments/{payment_id}/capture
Headers:
    Idempotency-Key: idk_capture_pay_a1b2c3

{
    "amount": 9999     // can be less than authorized (partial capture)
}

Response 200:
{
    "payment_id": "pay_a1b2c3",
    "status": "captured",
    "captured_amount": 9999,
    "captured_at": "2026-04-07T14:00:00Z"
}
```

### Refund

```
POST /v1/payments/{payment_id}/refund
Headers:
    Idempotency-Key: idk_refund_pay_a1b2c3_1

{
    "amount": 4999,         // partial refund of $49.99
    "reason": "customer_request"
}

Response 200:
{
    "refund_id": "ref_d4e5f6",
    "payment_id": "pay_a1b2c3",
    "status": "refund_pending",
    "amount": 4999,
    "created_at": "2026-04-07T16:00:00Z"
}
```

**Interviewer:** Why amounts in cents instead of dollars?

**Candidate:** Floating point arithmetic is dangerous for money. `0.1 + 0.2 != 0.3`
in IEEE 754. By using integer cents (minor units), all math is exact integer
arithmetic. This is industry standard -- Stripe, Adyen, and every serious payment
system uses minor units. For currencies without minor units (like JPY), the amount
is already in the base unit.

---

## Data Model (21:00 -- 24:00)

### Payment Record (PostgreSQL)

```sql
CREATE TABLE payments (
    payment_id      UUID PRIMARY KEY,
    order_id        VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    amount          BIGINT NOT NULL,          -- in minor units (cents)
    currency        VARCHAR(3) NOT NULL,      -- ISO 4217
    status          VARCHAR(24) NOT NULL,     -- CREATED, AUTHORIZING, AUTHORIZED,
                                              -- CAPTURING, CAPTURED, FAILED,
                                              -- REFUND_PENDING, REFUNDED
    payment_method  VARCHAR(16),              -- card, bank_transfer, wallet
    psp_provider    VARCHAR(16),              -- stripe, adyen
    psp_reference   VARCHAR(128),             -- PSP's transaction ID
    psp_response    JSONB,                    -- raw PSP response for debugging
    captured_amount BIGINT DEFAULT 0,
    refunded_amount BIGINT DEFAULT 0,
    metadata        JSONB,
    version         INT DEFAULT 1,            -- optimistic locking
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Idempotency Store

```sql
CREATE TABLE idempotency_keys (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    payment_id      UUID,
    request_hash    VARCHAR(64),    -- SHA-256 of the request body
    status          VARCHAR(16),    -- in_progress, completed, failed
    response_code   INT,
    response_body   JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ     -- auto-cleanup after 24 hours
);
```

### Payment Events (Audit Log)

```sql
CREATE TABLE payment_events (
    event_id        UUID PRIMARY KEY,
    payment_id      UUID NOT NULL,
    event_type      VARCHAR(32) NOT NULL,   -- CREATED, AUTH_REQUESTED, AUTH_APPROVED,
                                            -- AUTH_DECLINED, CAPTURE_REQUESTED,
                                            -- CAPTURED, REFUND_REQUESTED, REFUNDED
    old_status      VARCHAR(24),
    new_status      VARCHAR(24),
    psp_response    JSONB,
    actor           VARCHAR(64),            -- system, user, reconciliation
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- This table is APPEND-ONLY. Never update or delete rows.
```

### Ledger Entries (Double-Entry)

```sql
CREATE TABLE journal_entries (
    entry_id        UUID PRIMARY KEY,
    transaction_id  UUID NOT NULL,       -- groups the debit and credit
    account_id      VARCHAR(64) NOT NULL,
    entry_type      VARCHAR(8) NOT NULL, -- DEBIT or CREDIT
    amount          BIGINT NOT NULL,     -- always positive
    currency        VARCHAR(3) NOT NULL,
    payment_id      UUID,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- Invariant: SUM(DEBIT) = SUM(CREDIT) for every transaction_id

CREATE TABLE accounts (
    account_id      VARCHAR(64) PRIMARY KEY,
    account_name    VARCHAR(128),
    account_type    VARCHAR(16),   -- asset, liability, revenue, expense
    currency        VARCHAR(3),
    balance         BIGINT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Interviewer:** Walk me through what ledger entries look like for a $100 payment.

**Candidate:** When a customer pays $100 for an order, the double-entry journal
records:

```
Transaction: txn_pay_001
  DEBIT   accounts_receivable (asset)     $100.00
  CREDIT  customer_payments (liability)   $100.00

When captured and settled:
Transaction: txn_settle_001
  DEBIT   cash (asset)                    $100.00
  CREDIT  accounts_receivable (asset)     $100.00
```

For a $30 refund:

```
Transaction: txn_refund_001
  DEBIT   customer_payments (liability)   $30.00
  CREDIT  cash (asset)                    $30.00
```

The invariant: for every transaction, total debits equal total credits. If this
invariant ever breaks, we have a bug. We check it with a database constraint and a
background audit job.

---

## Deep Dive 1: Idempotency and the Timeout Problem (24:00 -- 33:00)

**Interviewer:** Let's go deep on idempotency. Specifically -- how do you handle a
timeout from the PSP? You send a charge request to Stripe, and the connection times
out after 30 seconds. Did the charge go through or not?

**Candidate:** This is the single most dangerous scenario in payment systems. Let me
walk through the complete mechanism.

**The problem:** We call Stripe's charge API. Our HTTP client times out after 30
seconds. Three things might have happened:
1. Stripe never received the request (network failed outbound).
2. Stripe received and processed it, but the response was lost (network failed
   inbound).
3. Stripe received it, is still processing, and will complete later.

We don't know which case we're in.

**Step 1: Pre-call state.**
Before calling Stripe, we write the payment record with status `AUTHORIZING` and
store the idempotency key we'll send to Stripe:

```sql
UPDATE payments
SET status = 'AUTHORIZING',
    psp_idempotency_key = 'psp_idk_pay_a1b2c3'
WHERE payment_id = 'pay_a1b2c3';
```

**Step 2: The PSP call with our idempotency key.**
We include `Idempotency-Key: psp_idk_pay_a1b2c3` in the header to Stripe. Stripe
guarantees that if it receives two requests with the same idempotency key, it only
processes the first.

**Step 3: Timeout occurs.**
Our HTTP client gives up after 30 seconds. We catch the timeout exception.

**Step 4: We do NOT mark the payment as failed.**
This is critical. Marking it as `FAILED` when the charge might have gone through
would mean we lose track of money. Instead, we set status to `UNKNOWN`:

```sql
UPDATE payments
SET status = 'UNKNOWN',
    psp_response = '{"error": "timeout after 30s"}'
WHERE payment_id = 'pay_a1b2c3';
```

**Step 5: Async resolution.**
A background **payment resolver** job runs every 30 seconds. It queries for all
payments in `UNKNOWN` status and for each one:
1. Calls Stripe's retrieve API: `GET /v1/charges?idempotency_key=psp_idk_pay_a1b2c3`
2. If Stripe says "charge succeeded" -> update to `AUTHORIZED`
3. If Stripe says "charge failed" -> update to `FAILED`
4. If Stripe says "no charge found" -> the request never arrived, safe to retry
   with the same idempotency key, or mark as `FAILED`
5. If Stripe is unreachable -> try again on the next cycle

**Step 6: Human escalation.**
If a payment stays in `UNKNOWN` for more than 15 minutes, we alert the payments
on-call team. They manually check the PSP dashboard and resolve.

**Interviewer:** What if the client retries the original payment request while we're
in `UNKNOWN` state?

**Candidate:** The client sends the same `Idempotency-Key`. Our idempotency store
shows status `in_progress`. We return **409 Conflict** with a message: "Payment is
being processed. Please retry after 30 seconds." We do NOT create a second payment
or send a second request to Stripe.

If the client retries and the resolver has already moved the payment to `AUTHORIZED`,
the idempotency store returns the cached successful response.

**Interviewer:** What about race conditions? The resolver and a client retry running
simultaneously?

**Candidate:** We use optimistic locking on the `payments` table:

```sql
UPDATE payments
SET status = 'AUTHORIZED', version = version + 1
WHERE payment_id = 'pay_a1b2c3'
  AND version = 3;
```

If two processes try to update simultaneously, one succeeds (affected rows = 1) and
the other fails (affected rows = 0). The loser re-reads the current state and
acts accordingly. Combined with the PSP idempotency key, there's no risk of double
charging.

**Interviewer:** I've seen systems where the authorize succeeds but the capture
fails. How do you handle an orphaned authorization?

**Candidate:** Great edge case. An authorized-but-never-captured payment means the
customer's credit limit has a hold that will expire in 7 days (varies by card
network). We handle this:

1. **Capture timeout job.** If a payment stays in `AUTHORIZED` for more than 48
   hours without a capture request, we auto-void it. This releases the hold on the
   customer's card.
2. **Reconciliation catches it.** The daily reconciliation compares our `AUTHORIZED`
   payments against Stripe's settlement report. Authorizations that Stripe auto-
   expired are flagged and cleaned up in our records.
3. **Order Service callback.** If the order is cancelled before capture, the Order
   Service calls `POST /payments/{id}/void` to explicitly release the authorization.

---

## Deep Dive 2: Reconciliation and the Double-Entry Ledger (33:00 -- 40:00)

**Interviewer:** Tell me about reconciliation. How do you know your system's records
match what the bank actually processed?

**Candidate:** Reconciliation is the safety net that catches every bug, race
condition, and edge case we didn't think of. It runs daily and compares three
sources of truth:

**Source 1: Our payment database.** All payments with status `CAPTURED` or
`REFUNDED` and their amounts.

**Source 2: PSP settlement report.** Every day, Stripe/Adyen sends a settlement file
listing every charge and refund they processed and the net amount they'll wire to
our bank account.

**Source 3: Bank statement.** The actual wire transfer that lands in our bank.

**The reconciliation process has three stages:**

**Stage 1 -- PSP matching (T+1).**
For each entry in Stripe's settlement report, find the matching payment in our
database by `psp_reference`. Possible outcomes:

| Our Record | Stripe Record | Action |
|------------|--------------|--------|
| CAPTURED, $100 | Settled, $100 | Match. Mark reconciled. |
| CAPTURED, $100 | Settled, $97 | Amount mismatch (probably PSP fees). Flag for review. |
| CAPTURED, $100 | Not found | We think we charged but Stripe disagrees. Critical alert. |
| Not found | Settled, $100 | Stripe charged but we have no record. Critical alert. Likely the timeout scenario. |
| AUTHORIZED | Settled, $100 | We never captured but Stripe settled. Very unusual. Alert. |
| REFUNDED, $50 | Refund, $50 | Match. Mark reconciled. |

**Stage 2 -- Ledger balancing (daily).**
Verify the fundamental accounting equation:

```sql
-- For every transaction, debits must equal credits
SELECT transaction_id,
       SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as debits,
       SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as credits
FROM journal_entries
GROUP BY transaction_id
HAVING debits != credits;
-- This query MUST return zero rows. If it doesn't, stop everything.
```

We also verify account balances:

```sql
-- Running balance must match sum of entries
SELECT a.account_id, a.balance,
       SUM(CASE WHEN je.entry_type = 'DEBIT' AND at.normal_balance = 'DEBIT' THEN je.amount
                WHEN je.entry_type = 'CREDIT' AND at.normal_balance = 'CREDIT' THEN je.amount
                ELSE -je.amount END) as computed_balance
FROM accounts a
JOIN journal_entries je ON je.account_id = a.account_id
JOIN account_types at ON at.type = a.account_type
GROUP BY a.account_id, a.balance
HAVING a.balance != computed_balance;
```

**Stage 3 -- Bank reconciliation (T+2 to T+3).**
When the bank wire arrives (typically 2-3 business days after settlement), we verify
that the total matches the PSP's net settlement amount minus fees.

**Interviewer:** What happens when reconciliation finds a discrepancy?

**Candidate:** The response depends on severity:

**Low severity (< $10 difference):** Likely rounding or PSP fee variation. Auto-
create an adjustment journal entry to balance the books. Flag for monthly review.

**Medium severity ($10-$1000):** Alert the payments team. Investigate within 24
hours. Common causes: partial captures, currency conversion differences, or a refund
processed on our side but not yet on the PSP's.

**High severity (> $1000 or structural mismatch):** Page on-call immediately. Could
indicate a bug in the payment flow, a PSP error, or fraud. Pause affected payment
processing if necessary.

**For the "Stripe charged but we have no record" case:** This is usually from the
timeout scenario. The reconciliation service:
1. Creates a payment record in our database matching Stripe's charge
2. Creates the corresponding ledger entries
3. Notifies the Order Service to link this payment to the order
4. Marks it for human review

**Interviewer:** Why double-entry bookkeeping? Isn't a simple transaction log enough?

**Candidate:** A transaction log tells you what happened. Double-entry tells you
that everything adds up. The power of double-entry is that errors are self-revealing:

1. **Every entry has a counterpart.** If money enters one account, it must leave
   another. If a bug creates a credit without a debit, the daily balance check
   catches it immediately.

2. **Account balances are derivable.** We can recompute any account's balance from
   scratch by replaying journal entries. If the running balance drifts from the
   derived balance, we know we have a bug.

3. **Audit trail.** Regulators and auditors can trace every dollar through the
   system. "Show me every entry that touched the revenue account in March" is a
   simple query.

4. **Revenue recognition.** The accounting team needs to know the difference between
   "money the customer promised to pay" (accounts receivable) and "money in our
   bank" (cash). Double-entry naturally tracks this through different accounts.

A simple log cannot provide these guarantees. You'd have to build ad-hoc checks that
effectively reinvent double-entry.

---

## Trade-offs Discussion (40:00 -- 42:00)

**Candidate:** Key trade-offs in this design:

| Decision | Trade-off |
|----------|-----------|
| **UNKNOWN status for PSP timeouts vs. auto-retry** | Adds operational complexity (resolver job, human escalation) but prevents the catastrophic failure of double-charging a customer. |
| **Separate ledger database vs. embedded in payment DB** | More infrastructure, but the ledger has different write patterns (append-only, never update) and different query patterns (aggregation, balance computation). Separation enables optimization. |
| **Authorize + capture (two-step) vs. single charge** | Higher PSP costs (two API calls) but enables the "charge at shipment" pattern that reduces refunds and chargebacks. |
| **Idempotency keys with 24-hour expiry vs. permanent** | Saves storage and simplifies cleanup, but means a retry after 24 hours isn't deduplicated. Acceptable because payment retries beyond 24 hours are manual and use new idempotency keys. |
| **Minor units (cents) vs. decimal amounts** | Slightly harder for API consumers to read, but eliminates floating-point errors. Every major PSP uses this convention. |
| **PSP abstraction layer vs. direct integration** | Adds a layer of indirection, but lets us switch PSPs, route to different PSPs by region, and implement PSP failover without changing business logic. |

**Interviewer:** What's the scariest production incident you'd worry about?

**Candidate:** A bug in the idempotency layer that allows duplicate charges during
high load. For example, a race condition where two concurrent requests with the same
idempotency key both see "not found" and both proceed to charge the PSP. This is why
the idempotency key insert must be done with `INSERT ... ON CONFLICT DO NOTHING` and
checked in the same transaction -- not with a separate read-then-write.

---

## Future Improvements (42:00 -- 43:30)

**Candidate:** Extensions I'd build with more time:

1. **Multi-PSP routing.** Route payments to the PSP with the highest approval rate
   for the card's issuing bank and region. This alone can increase revenue by 2-5%.

2. **Fraud scoring.** Before authorizing, run the transaction through an ML fraud
   model. High-risk transactions get 3D Secure authentication or manual review.

3. **Multi-currency.** Store amounts in the payment currency and the settlement
   currency. Use exchange rates at time of capture. Reconciliation must account for
   FX rate differences.

4. **Payment orchestration.** For orders with multiple sellers (marketplace model),
   split one customer payment into multiple merchant payouts with platform commission.

5. **PCI vault.** If we need to support recurring payments without re-collecting the
   card, build a PCI-compliant token vault (or use Stripe's customer/token APIs).

---

## Red Flags to Avoid

| Red Flag | Why It's Bad |
|----------|-------------|
| Storing raw credit card numbers | Instant PCI compliance failure; use PSP tokenization |
| Using floating-point for money | 0.1 + 0.2 != 0.3; use integer minor units (cents) |
| No idempotency on payment creation | Client retries WILL happen; double-charging is lawsuit territory |
| Marking payment as "failed" on PSP timeout | The charge might have gone through; you just lost track of money |
| No reconciliation process | Bugs, network issues, and PSP errors WILL cause discrepancies; recon is how you find them |
| Single payment status (success/fail) | Payments have a lifecycle (created -> authorized -> captured -> settled -> refunded); a binary status loses critical state |
| No audit log of state transitions | When regulators ask "what happened to payment X at 3:47 AM," you need an immutable answer |

---

## Power Phrases

Use these exact phrases to signal expertise during the interview:

- "We use **integer minor units** for all monetary amounts -- cents for USD, pence
  for GBP -- to eliminate floating-point arithmetic errors."
- "Every PSP call includes an **idempotency key** so that network retries never
  result in duplicate charges."
- "On PSP timeout, we set status to **UNKNOWN**, not FAILED, because the charge may
  have succeeded. A background resolver queries the PSP to determine the true state."
- "The **double-entry ledger** ensures that for every transaction, total debits equal
  total credits. This is our first line of defense against accounting bugs."
- "We tokenize cards on the client side using Stripe.js, so **raw card numbers never
  touch our servers**, keeping us out of PCI DSS scope for card data storage."
- "**Reconciliation** runs daily across three sources: our database, the PSP
  settlement report, and the bank statement. Discrepancies are auto-classified by
  severity and escalated accordingly."
- "The payment lifecycle is a **state machine**: CREATED -> AUTHORIZING -> AUTHORIZED
  -> CAPTURING -> CAPTURED -> SETTLED. Every transition is recorded in the immutable
  event log."
- "We use **optimistic locking** (version column) on the payment record to prevent
  race conditions between the background resolver and client retries."
- "Authorize at checkout, **capture at shipment** -- this reduces chargebacks and
  means we only charge for what we actually ship."
- "The **transactional outbox** ensures that the payment status update and the
  downstream notification are atomically consistent -- no phantom notifications for
  failed payments."
