# GraphQL Deep Dive

## 1. What Is GraphQL and Why Does It Exist?

GraphQL is a query language for APIs and a runtime for executing those queries. Developed
internally at Facebook in 2012 and open-sourced in 2015, it solves two fundamental
problems with REST APIs.

### The Over-Fetching Problem

REST returns fixed data shapes. A mobile app that only needs a user's name and avatar
still receives the entire user object.

```
REST: GET /users/123
Returns: { id, name, email, avatar, address, phone, bio, created_at, ... }
Mobile only needs: { name, avatar }

GraphQL:
query { user(id: 123) { name avatar } }
Returns: { "data": { "user": { "name": "Alice", "avatar": "url" } } }
```

### The Under-Fetching Problem

To show a user profile page with their posts and followers, REST requires multiple
round-trips:

```
REST:
  GET /users/123                 --> user data
  GET /users/123/posts           --> user posts
  GET /users/123/followers       --> follower list
  (3 round-trips, 3 waterfalls)

GraphQL (single request):
  query {
    user(id: 123) {
      name
      posts { title createdAt }
      followers { name avatar }
    }
  }
```

---

## 2. Schema Definition Language (SDL)

The schema is the contract between client and server. It defines types, queries,
mutations, and subscriptions.

### Scalar Types

```graphql
# Built-in scalars
String, Int, Float, Boolean, ID

# Custom scalars
scalar DateTime
scalar JSON
scalar URL
```

### Object Types

```graphql
type User {
  id: ID!                           # ! = non-nullable
  name: String!
  email: String!
  age: Int
  posts: [Post!]!                   # Non-null list of non-null Posts
  profile: Profile
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  body: String!
  author: User!
  comments: [Comment!]!
  tags: [String!]
  publishedAt: DateTime
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
}
```

### Queries (Read Operations)

```graphql
type Query {
  user(id: ID!): User
  users(limit: Int = 20, offset: Int = 0): [User!]!
  searchUsers(query: String!): [User!]!
  post(id: ID!): Post
  feed(first: Int, after: String): PostConnection!
}
```

### Mutations (Write Operations)

```graphql
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  createPost(input: CreatePostInput!): Post!
  likePost(postId: ID!): Post!
}

input CreateUserInput {
  name: String!
  email: String!
  age: Int
}

input UpdateUserInput {
  name: String
  email: String
  age: Int
}
```

### Subscriptions (Real-Time)

```graphql
type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
  userStatusChanged(userId: ID!): UserStatus!
}
```

### Enums and Interfaces

```graphql
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  name: String!
}

type Post implements Node {
  id: ID!
  title: String!
}
```

### Unions

```graphql
union SearchResult = User | Post | Comment

type Query {
  search(query: String!): [SearchResult!]!
}

# Client query:
query {
  search(query: "alice") {
    ... on User { name email }
    ... on Post { title }
    ... on Comment { text }
  }
}
```

---

## 3. Resolvers -- How Data Gets Fetched

Resolvers are functions that populate fields in the schema. Each field has a resolver.

```javascript
const resolvers = {
  Query: {
    user: async (parent, args, context) => {
      return context.db.users.findById(args.id);
    },
    users: async (parent, args, context) => {
      return context.db.users.findAll({
        limit: args.limit,
        offset: args.offset
      });
    }
  },

  User: {
    // Resolver chain: after Query.user resolves, these run for each field
    posts: async (user, args, context) => {
      return context.db.posts.findByAuthorId(user.id);
    },
    followers: async (user, args, context) => {
      return context.db.follows.findFollowers(user.id);
    }
  },

  Mutation: {
    createUser: async (parent, { input }, context) => {
      return context.db.users.create(input);
    }
  }
};
```

### Resolver Chain

```
query { user(id: 1) { name posts { title } } }

Execution order:
1. Query.user(_, {id: 1}, ctx)  --> returns User object
2. User.name(user, _, ctx)      --> returns user.name (default resolver)
3. User.posts(user, _, ctx)     --> returns [Post] array
4. Post.title(post, _, ctx)     --> for EACH post (default resolver)
```

The default resolver simply returns `parent[fieldName]`, so you only write custom
resolvers for computed or async fields.

---

## 4. The N+1 Problem and DataLoader

### The Problem

```graphql
query {
  posts {           # 1 query: SELECT * FROM posts
    title
    author {        # N queries: SELECT * FROM users WHERE id = ?
      name          #   (one per post, even if authors repeat)
    }
  }
}
```

If 50 posts are returned, this fires 1 + 50 = 51 database queries.

### The Solution: DataLoader

DataLoader batches and caches individual loads within a single request tick.

```javascript
const DataLoader = require('dataloader');

// Create a batch function
const userLoader = new DataLoader(async (userIds) => {
  // Single query for ALL requested IDs
  const users = await db.users.findByIds(userIds);
  // MUST return results in same order as input IDs
  const userMap = new Map(users.map(u => [u.id, u]));
  return userIds.map(id => userMap.get(id) || null);
});

// In resolvers
const resolvers = {
  Post: {
    author: (post) => userLoader.load(post.authorId)
    // 50 calls to .load() are batched into ONE db query
  }
};
```

### How DataLoader Works

```
Tick 1: post1.author -> userLoader.load(10)
        post2.author -> userLoader.load(20)
        post3.author -> userLoader.load(10)  <- duplicate, cached
        post4.author -> userLoader.load(30)

End of tick: DataLoader fires batch function with [10, 20, 30]
             Single SQL: SELECT * FROM users WHERE id IN (10, 20, 30)
             Results cached for this request

Result: 51 queries --> 2 queries (1 for posts + 1 batched for authors)
```

**Key rule:** Create a new DataLoader instance per request to avoid caching stale data
across different users/permissions.

---

## 5. Fragments

Fragments let you reuse field selections across queries.

```graphql
fragment UserBasic on User {
  id
  name
  avatar
}

query {
  me { ...UserBasic email }
  post(id: 1) {
    title
    author { ...UserBasic }
    comments {
      text
      author { ...UserBasic }
    }
  }
}
```

### Inline Fragments (for Unions/Interfaces)

```graphql
query {
  search(query: "test") {
    __typename
    ... on User { name email }
    ... on Post { title body }
    ... on Comment { text }
  }
}
```

---

## 6. Pagination: Relay Connection Spec

The standard for cursor-based pagination in GraphQL.

### Schema

```graphql
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}

type PostEdge {
  cursor: String!       # Opaque cursor for this edge
  node: Post!           # The actual data
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  posts(first: Int, after: String, last: Int, before: String): PostConnection!
}
```

### Query Example

```graphql
# First page
query {
  posts(first: 10) {
    edges {
      cursor
      node { id title }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}

# Next page
query {
  posts(first: 10, after: "cursor_from_previous") {
    edges { node { id title } }
    pageInfo { hasNextPage endCursor }
  }
}
```

---

## 7. Apollo Federation for Microservices

Federation lets multiple GraphQL services compose into a single unified graph.

```
                    +-------------------+
                    |   Apollo Gateway   |
                    +-------------------+
                   /         |           \
          +--------+   +---------+   +----------+
          | Users  |   | Orders  |   | Products |
          | Service|   | Service |   | Service  |
          +--------+   +---------+   +----------+
```

### Service Definitions

```graphql
# Users Service
type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

type Query {
  user(id: ID!): User
}

# Orders Service -- extends User from another service
extend type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!
}

type Order @key(fields: "id") {
  id: ID!
  total: Float!
  items: [OrderItem!]!
}

# Products Service -- extends Order from another service
extend type Order @key(fields: "id") {
  id: ID! @external
  items: [OrderItem!]! @external
}

type Product @key(fields: "id") {
  id: ID!
  name: String!
  price: Float!
}
```

The gateway composes these into a unified schema. A query can span services:
```graphql
query {
  user(id: 1) {         # Resolved by Users Service
    name
    orders {             # Resolved by Orders Service
      total
      items {
        product {        # Resolved by Products Service
          name
          price
        }
      }
    }
  }
}
```

---

## 8. Security: Persisted Queries

Persisted queries prevent arbitrary query execution in production. Instead of sending raw
GraphQL strings, clients send a hash that maps to a pre-registered query.

```
# During build: extract and register queries
{ "query_id": "abc123", "query": "query GetUser($id: ID!) { user(id: $id) { name } }" }

# At runtime: client sends only the hash
POST /graphql
{ "id": "abc123", "variables": { "id": "1" } }
```

Benefits:
- Prevents malicious queries (exfiltration, DoS via deep nesting)
- Reduces payload size (hash vs. full query string)
- Enables CDN caching of queries via GET with query ID

---

## 9. Query Complexity Analysis and Depth Limiting

### Depth Limiting

Prevents deeply nested queries that could overwhelm the server.

```graphql
# Dangerous: unlimited depth
query {
  user(id: 1) {
    friends {
      friends {
        friends {
          friends { ... }  # Recursion attack
        }
      }
    }
  }
}
```

```javascript
// Limit query depth to 5 levels
const depthLimit = require('graphql-depth-limit');
const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(5)]
});
```

### Complexity Analysis

Assign cost to each field and reject queries exceeding a threshold.

```javascript
const { createComplexityRule } = require('graphql-query-complexity');

const rule = createComplexityRule({
  maximumComplexity: 1000,
  estimators: [
    // List fields: cost = child cost * estimated list size
    simpleEstimator({ defaultComplexity: 1 }),
    fieldExtensionsEstimator()  // reads @complexity directives
  ],
  onComplete: (complexity) => {
    console.log(`Query complexity: ${complexity}`);
  }
});

// In schema
type Query {
  users(first: Int): [User!]!  @complexity(value: 5, multipliers: ["first"])
}
```

---

## 10. Introspection

GraphQL APIs are self-documenting. Clients can query the schema itself.

```graphql
{
  __schema {
    types { name kind }
    queryType { name }
    mutationType { name }
  }
}

{
  __type(name: "User") {
    name
    fields {
      name
      type { name kind }
    }
  }
}
```

**Security note:** Disable introspection in production to prevent schema exposure:
```javascript
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production'
});
```

---

## 11. GraphQL vs REST: Decision Matrix

| Criterion                   | REST                           | GraphQL                        |
|-----------------------------|--------------------------------|--------------------------------|
| Data fetching efficiency    | Fixed payloads (over/under)    | Client specifies exact needs   |
| Number of round-trips       | Multiple for related data      | Single request                 |
| Caching                     | HTTP caching built-in          | Requires custom (Apollo Cache) |
| File uploads                | Native multipart support       | Needs spec extension           |
| Real-time                   | Webhooks/SSE/WebSocket         | Subscriptions built-in         |
| Learning curve              | Low (HTTP fundamentals)        | Medium (SDL, resolvers, etc.)  |
| Versioning                  | URL/header versioning          | Schema evolution (no versions) |
| Error handling              | HTTP status codes              | Always 200, errors in body     |
| Tooling                     | Postman, curl, any HTTP client | GraphiQL, Apollo DevTools      |
| Microservices               | API Gateway routing            | Federation                     |
| Mobile performance          | Over-fetching wastes bandwidth | Minimal data transfer          |
| Backend complexity          | Simple (one handler per route) | Resolver chains, N+1 risk     |
| Team autonomy               | Each team owns endpoints       | Schema coordination needed     |
| API discovery               | OpenAPI docs                   | Introspection built-in         |

### When to Use Which

```
Use REST when:
  - Public APIs with broad consumer base
  - Simple CRUD with well-defined resources
  - Heavy caching requirements (CDN-friendly)
  - File upload/download is primary function
  - Team is small and data relationships are simple

Use GraphQL when:
  - Multiple frontends (web, mobile, TV) need different data shapes
  - Complex, deeply nested data relationships
  - Rapid frontend iteration without backend changes
  - Aggregating data from multiple microservices
  - Real-time features (subscriptions)
```

---

## 12. Complete Code Example

### Schema

```graphql
type Query {
  user(id: ID!): User
  feed(first: Int = 10, after: String): PostConnection!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
}

type Subscription {
  postCreated: Post!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts(first: Int = 10): [Post!]!
}

type Post {
  id: ID!
  title: String!
  body: String!
  author: User!
  createdAt: String!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}

type PostEdge {
  cursor: String!
  node: Post!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

input CreatePostInput {
  title: String!
  body: String!
}
```

### Query

```graphql
query GetFeed($first: Int, $after: String) {
  feed(first: $first, after: $after) {
    edges {
      cursor
      node {
        id
        title
        body
        createdAt
        author {
          id
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Resolvers (Node.js)

```javascript
const { PubSub } = require('graphql-subscriptions');
const DataLoader = require('dataloader');
const pubsub = new PubSub();

// DataLoader for batching user lookups
function createLoaders() {
  return {
    userLoader: new DataLoader(async (ids) => {
      const users = await db.users.findByIds(ids);
      const map = new Map(users.map(u => [u.id, u]));
      return ids.map(id => map.get(id));
    })
  };
}

const resolvers = {
  Query: {
    user: (_, { id }, { loaders }) => loaders.userLoader.load(id),

    feed: async (_, { first = 10, after }, { db }) => {
      const cursor = after ? decodeCursor(after) : null;
      const posts = await db.posts.find({
        ...(cursor && { where: { createdAt: { $lt: cursor } } }),
        orderBy: { createdAt: 'DESC' },
        limit: first + 1  // Fetch one extra to check hasNextPage
      });

      const hasNextPage = posts.length > first;
      const edges = posts.slice(0, first).map(post => ({
        cursor: encodeCursor(post.createdAt),
        node: post
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0
            ? edges[edges.length - 1].cursor
            : null
        }
      };
    }
  },

  Post: {
    author: (post, _, { loaders }) => loaders.userLoader.load(post.authorId)
  },

  Mutation: {
    createPost: async (_, { input }, { db, user }) => {
      const post = await db.posts.create({
        ...input,
        authorId: user.id,
        createdAt: new Date().toISOString()
      });
      pubsub.publish('POST_CREATED', { postCreated: post });
      return post;
    }
  },

  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterableIterator(['POST_CREATED'])
    }
  }
};
```

---

## Quick Reference Card

```
GraphQL Cheat Sheet
====================
SDL:        type, input, enum, interface, union, scalar
Operations: query (read), mutation (write), subscription (real-time)
Nullability: String = nullable, String! = non-null, [String!]! = non-null list of non-null
Pagination: Relay Connection spec (edges, nodes, pageInfo, cursors)
N+1 Fix:   DataLoader (batching + per-request caching)
Security:  Depth limiting, complexity analysis, persisted queries, disable introspection
Federation: @key, @external, extend type -- compose microservice schemas
Always 200: Errors returned in { "errors": [...] } alongside { "data": ... }
```
