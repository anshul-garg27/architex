# Social Media Feed: Distributed Fan-Out Architecture

Engineering a social feed requires solving the "Celebrity Fan-out" problem while maintaining a responsive, personalized timeline for millions of concurrent users.

## Component Rationale

### Hybrid Fan-out Engine
- **Why**: Separates processing logic for regular users vs. high-follower accounts (celebrities).
- **Rationale**: For users with <10k followers, we use **Push-on-Write**. When they post, we immediately push the Post ID to the pre-computed feeds of all their followers in Redis. For celebrities (e.g., 50M followers), pushing to 50M Redis rows is too slow and resource-intensive.
- **Trade-off**: For celebrities, we use **Pull-on-Read**. We store their posts in a separate "Celebrity Table" and merge them into the follower's feed only when that follower opens the app. This balances system load but increases the complexity of the Feed Retrieval service.

### Graph Database (Neo4j/Neptune)
- **Why**: Managing follow/unfollow relationships.
- **Rationale**: Relational databases require expensive recursive JOINs to find "friends of friends" or even deep follower lists. A Graph DB treats relationships as first-class citizens, allowing us to traverse the social graph in constant time (O(1) or O(depth)).
- **Implementation**: We use this to power the "Suggested Users" feature based on shared edges in the graph.

### Redis Cluster for Live Feeds
- **Why**: In-memory storage of the most recent 200 posts for every active user.
- **Rationale**: Reading from a disk-based DB for every scroll event would kill the UX. Redis allows us to serve the "top of the feed" with <10ms latency.
- **Trade-off**: High memory costs. We mitigate this by only keeping the feeds of "active" users (users who have logged in within the last 30 days) in the hot cache.

## Architectural Trade-offs

### Eventual vs. Strong Consistency
- **Decision**: **Eventual Consistency**.
- **Rationale**: When a user posts, it doesn't matter if their friend sees it 2 seconds later. It *does* matter if the "Post" button hangs for 5 seconds waiting for a global lock. We prioritize a fast "Post" experience and use asynchronous workers to propagate the data.

### Message Queue (Kafka)
- **Why**: Asynchronous processing foundation.
- **Rationale**: By putting every post into a Kafka topic, we can have multiple consumers (Fan-out, Search Indexer, ML Safety Filter, Analytics) process the same post in parallel without blocking the main user request.
- **Cost**: Increases infrastructure complexity and operational overhead, but is essential for decoupling services at scale.
