# Minimal System Canvas: Foundations of Scalability

This foundational blueprint provides essential components for constructing a contemporary, expandable web infrastructure. It serves as an initial template that adheres to industry standards regarding component isolation.

## Component Rationale

### Edge Load Balancer
- **Purpose**: Creating separation between public internet access and your servers.
- **Rationale**: A Load Balancer such as Nginx or AWS ALB manages SSL termination and directs incoming requests. This design permits you to maintain, upgrade, or restart your App Servers without interrupting user connections.
- **Implementation Detail**: Configure the Load Balancer with **Health Checks** that monitor a `/health` endpoint on your servers, enabling automatic traffic rerouting away from failing servers and basic self-correction capabilities.

### Stateless Application Server
- **Purpose**: Enabling growth through adding additional instances.
- **Rationale**: "By never storing user files or 'Sessions' on the local disk of the App Server, we can simply add 10 more servers during a traffic spike." All session information transfers to either the Database or Redis cache.
- **Trade-off**: Introduces modest network latency since each request retrieves user session information from remote cache rather than local storage. This compromise enables expansion to massive user populations.

### Database Primary/Replica Pair
- **Purpose**: Dividing read operations from write operations and maintaining redundancy.
- **Rationale**: Typical applications experience roughly 90% read operations versus 10% write operations. A **Read Replica** permits routing reporting queries separately from the Primary DB, preventing write operations from experiencing delays caused by heavy read operations.

## Architectural Strategy

### Scaling: Vertical vs. Horizontal
- **Recommendation**: **Horizontal (Scale-Out)**.
- **Rationale**: Increasing server capacity encounters physical limits and produces vulnerability. Distributing load across numerous smaller servers proves economical and supplies complete redundancy.

### Security: Private Subnets
- **Strategy**: **Network Isolation**.
- **Execution**: For production environments, position the Database and App Servers in a **Private Subnet** without public IP addresses. They remain accessible exclusively through the Load Balancer, establishing a protective perimeter against direct network attacks.
