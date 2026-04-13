# Real-time Ride Sharing: Geospatial Mobility Architecture

This system handles concurrent location tracking and rapid driver-rider matching across a 2D geographic space.

## Component Rationale

### Redis Geospatial (with City-level Sharding)
- **Purpose**: Maintains an active index for driver locations
- **Technical Basis**: "Standard databases are too slow for 'find neighbors' queries when the data changes every 3 seconds." Redis uses Geohashes enabling sub-millisecond lookups via `GEOADD` and `GEORADIUS` operations
- **Scaling Strategy**: Sharding by City ID prevents global bottlenecks since riders typically match with nearby drivers
- **Resource Management**: Only active driver data persists; offline entries are immediately removed to control memory consumption

### S2 Routing Service (Google S2)
- **Purpose**: Hierarchical cell decomposition for supply and demand assessment
- **Advantage**: Unlike simple radius queries, "S2 cells allow us to aggregate data into buckets (cells) of uniform size" for consistent surge pricing across regions
- **Cost**: Requires specialized libraries and developer expertise beyond basic latitude/longitude calculations, but necessary for planetary-scale accuracy

### WebSocket Gateway
- **Purpose**: Maintains bidirectional, persistent connections with driver and rider applications
- **Efficiency**: "Standard HTTP polling would create 10x the header overhead and latency" compared to WebSocket architecture
- **Distribution**: Leverages Redis or NATS pub/sub so any gateway node routes ride requests to connected drivers
- **Battery Impact**: GPS payloads transmitted every 3 seconds with minimal device power consumption

## Architectural Trade-offs

### Matching Latency vs. Optimization
- **Chosen Approach**: Greedy matching prioritizing speed under 2 seconds
- **Reasoning**: User abandonment rises sharply beyond 5 seconds during the matching phase; a rapidly available acceptable match outweighs algorithmic optimization requiring 10 seconds

### Delivery Guarantees
- **Model**: At-Least-Once delivery semantics
- **Implementation**: "It is better to send a 'Ride Offer' twice (which the app can deduplicate) than to never send it at all" through idempotent request identifiers enabling safe retries
