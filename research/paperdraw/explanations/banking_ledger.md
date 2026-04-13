# Secure Banking Ledger: High-Integrity Financial Architecture

This system prioritizes **correctness and data integrity** over performance, built on double-entry bookkeeping and immutable audit trails.

## Key Components

**Immutable Transaction Log (Append-Only)**

The architecture implements an append-only ledger where transactions are never edited. As the documentation states, "If an error is made, a reversing transaction is added" to maintain auditability. Each entry uses cryptographic chaining with HMAC-SHA256, where hash chains would break if any prior transaction were modified.

**Hardware Security Module (HSM)**

Private keys are stored in tamper-proof physical appliances rather than disk storage. The system accepts "limited throughput and high latency" to protect against compromised servers. This is mitigated through HSM clustering and secure caching for ephemeral session keys.

**Fraud Detection Pipeline**

Real-time stream processing analyzes transactions against user profiles. The design implements "Low-Latency Blocking (Pre-authorization)" to stop suspicious activity before funds transfer, accepting 50-100ms latency for security assurance.

## Architectural Decisions

**Consistency Priority**: The system enforces strict ACID compliance rather than eventual consistency, recognizing that "Financial systems cannot be 'Eventually Consistent.'" This constraint necessitates relational databases and complicates cross-region sharding.

**Asynchronous Notifications**: Transaction notifications use reliable queues, ensuring "a failure in the SMS provider never blocks a million-dollar money transfer."
