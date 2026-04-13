# Global URL Shortener: Engineering Rationale Analysis

## System Design Philosophy

The architecture prioritizes read performance and horizontal scalability, accepting eventual consistency for non-critical metadata. This represents a deliberate trade-off favoring availability over strict real-time synchronization.

## Key Components

**Key Generation Service (KGS)**
The system pre-generates unique 7-character identifiers rather than computing hashes on-demand. As noted, "Generating hashes on-the-fly (e.g., MD5) and checking for collisions in the database introduces significant latency" and database overhead. Apache Zookeeper manages ID ranges across clustered nodes to prevent single points of failure.

**NoSQL Persistence**
The document explains that "Relational databases (RDBMS) struggle with the horizontal scaling required for billions of rows without complex sharding logic." NoSQL stores handle the high-volume writes and simple key-value lookups that this problem requires, though they sacrifice complex queries and multi-row transactions.

**Redis Caching Layer**
Recognizing that "80% of traffic typically goes to 20% of URLs," the system caches frequently accessed redirects at the regional level using LRU eviction policies.

## Notable Technical Decisions

The platform defaults to 301 redirects, allowing browser-side caching to reduce server load. Clients requiring detailed analytics can opt into 302 responses instead. The consistency philosophy embraces availability-first principles, accepting regional latency over mandatory global synchronization for read-heavy redirect operations.
