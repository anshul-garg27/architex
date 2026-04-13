# Design Amazon / E-Commerce Platform: Requirements and Estimation

## Table of Contents
- [1. Problem Statement](#1-problem-statement)
- [2. Functional Requirements](#2-functional-requirements)
- [3. Non-Functional Requirements](#3-non-functional-requirements)
- [4. Out of Scope](#4-out-of-scope)
- [5. Back-of-Envelope Estimation](#5-back-of-envelope-estimation)
- [6. API Design](#6-api-design)
- [7. Data Model Overview](#7-data-model-overview)

---

## 1. Problem Statement

Design a global e-commerce marketplace (like Amazon) that enables buyers to search for
products, add items to a cart, place orders, track shipments, and leave reviews -- while
sellers can list products, manage inventory, and fulfill orders. The system must handle
hundreds of millions of users, tens of millions of daily orders, a catalog of 500M+
products, and extreme traffic spikes like Prime Day (100x normal load).

**Why this problem is asked at Amazon (and beyond):**
- It tests **catalog design** (hierarchical categories, variants, pricing complexity)
- It tests **inventory management** (preventing overselling across distributed warehouses)
- It tests **search at scale** (full-text + faceted search over 500M products)
- It tests **transactional consistency** (checkout flow spanning multiple services)
- It tests **extreme scalability** (Prime Day is the ultimate stress test)
- It tests **distributed systems** (Amazon's cell-based architecture is legendary)

---

## 2. Functional Requirements

### 2.1 Buyer Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-1 | **Product search** | Buyer searches by keyword, category, or filter (price, brand, rating, Prime eligibility) and gets ranked results |
| FR-2 | **Product detail page** | View product info: images, description, variants (size/color), price, availability, seller info, reviews |
| FR-3 | **Shopping cart** | Add/remove/update items in a persistent cart that survives sessions and works across devices |
| FR-4 | **Checkout and order placement** | Select shipping address, payment method, delivery speed; place order with inventory validation |
| FR-5 | **Order tracking** | View order status (confirmed, shipped, out for delivery, delivered) with real-time tracking |
| FR-6 | **Order history** | View all past orders with re-order capability |
| FR-7 | **Reviews and ratings** | Submit and view product reviews (1-5 stars, text, photos); sort by helpful/recent |
| FR-8 | **Wishlist** | Save products to named wishlists for later purchase |
| FR-9 | **Recommendations** | Personalized product suggestions based on browsing history, purchases, and collaborative filtering |
| FR-10 | **Returns and refunds** | Initiate return within return window, track refund status |

### 2.2 Seller Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-11 | **Seller registration** | Sellers register, verify identity, and set up their storefront |
| FR-12 | **Product listing** | Create/edit product listings with title, description, images, category, variants, price |
| FR-13 | **Inventory management** | Set stock quantities per warehouse/fulfillment center, receive low-stock alerts |
| FR-14 | **Order fulfillment** | View incoming orders, mark as shipped, provide tracking numbers |
| FR-15 | **Seller analytics** | Dashboard with sales metrics, revenue, conversion rates, customer feedback |
| FR-16 | **Pricing management** | Set base price, run promotions/deals, respond to Buy Box competition |

### 2.3 Platform Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-17 | **Buy Box** | Algorithmically select which seller's offer is displayed as the default purchase option |
| FR-18 | **Payment processing** | Multi-method payments (credit card, gift card, bank transfer, Buy Now Pay Later) |
| FR-19 | **Shipping and logistics** | Calculate shipping costs, estimate delivery dates, route to nearest fulfillment center |
| FR-20 | **Notifications** | Order confirmations, shipping updates, delivery alerts, price drop alerts, deal notifications |
| FR-21 | **Promotions and deals** | Lightning deals, coupons, Prime Day offers, Subscribe & Save discounts |
| FR-22 | **Fraud detection** | Detect fraudulent orders, fake reviews, and seller policy violations |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Search latency** | < 200ms (p99 < 500ms) | Users expect instant results; every 100ms of latency costs 1% in sales (Amazon's own research) |
| **Product page load** | < 300ms server-side | Product detail page is the highest-traffic page; must render fast |
| **Cart operations** | < 100ms | Add-to-cart must feel instantaneous |
| **Checkout** | < 2 seconds end-to-end | Inventory reservation + payment authorization in one flow |
| **Order placement** | < 3 seconds | Full checkout submission including fraud check |
| **Recommendation generation** | < 500ms | Real-time recommendations on every page |

### 3.2 Availability and Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **System availability** | 99.99% (52 min downtime/year) | Every minute of downtime = $220K+ revenue loss at Amazon's scale |
| **Cart durability** | 99.999% | Cart is the buyer's intent -- losing a cart means losing a sale |
| **Order processing** | Exactly-once semantics | Duplicate orders or dropped orders are both unacceptable |
| **Payment consistency** | Strong consistency | Money operations must never double-charge or lose transactions |
| **Inventory accuracy** | Eventual consistency < 5s | Near-real-time but absolute consistency too expensive across warehouses |

### 3.3 Scalability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Daily active users** | 500M DAU | Amazon serves customers globally across 20+ country-specific stores |
| **Concurrent users** | 50M peak | Prime Day / Black Friday peaks |
| **Orders per day** | 50M (580+ orders/sec avg) | ~1.5B orders/month globally |
| **Product catalog** | 500M+ products | Including third-party marketplace sellers |
| **Search queries** | 100K QPS avg, 1M QPS peak | Search is the primary entry point |
| **Prime Day scale** | 100x normal traffic | System must handle 100x burst without degradation |

### 3.4 Data Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Product images** | 5 billion+ images | Avg 10 images per product |
| **Review data** | 2B+ reviews | Historical reviews are immutable and append-only |
| **Order history** | 10+ years retention | Regulatory and customer service requirements |
| **Click-stream data** | 50TB/day | For recommendations, analytics, and A/B testing |

---

## 4. Out of Scope

| Feature | Why Excluded |
|---------|--------------|
| Amazon Web Services (AWS) | Separate infrastructure product |
| Alexa voice shopping | Specialized voice interface |
| Amazon Fresh / grocery | Different supply chain and perishable inventory model |
| Amazon Prime Video | Separate streaming service |
| Kindle / digital goods delivery | Different fulfillment model |
| Warehouse robotics (Kiva) | Physical systems, not software design |
| Customer service / chatbot | Separate system |

---

## 5. Back-of-Envelope Estimation

### 5.1 Traffic Estimation

```
Daily Active Users (DAU):     500,000,000

Actions per user per session:
  - Search queries:           5 searches/session
  - Product page views:       10 pages/session
  - Cart operations:          1 add-to-cart / 5 sessions
  - Orders:                   1 order / 10 sessions

Search QPS:
  500M users x 5 searches / 86,400 sec = ~29,000 QPS (avg)
  Peak (Prime Day): 29,000 x 100 = 2,900,000 QPS

Product Page QPS:
  500M x 10 / 86,400 = ~58,000 QPS
  Peak: 5,800,000 QPS

Cart Operations:
  500M x 0.2 / 86,400 = ~1,200 QPS
  Peak: 120,000 QPS

Order Placement:
  50M orders / 86,400 = ~580 QPS
  Peak (Prime Day): 58,000 QPS
  Peak 1-hour spike: 300M orders concentrated = ~83,000 QPS
```

### 5.2 Storage Estimation

```
Product Catalog:
  500M products x 10KB metadata per product = 5 TB
  500M products x 10 images x 500KB avg = 2.5 PB (images in object storage)

User Data:
  500M users x 5KB per profile = 2.5 TB

Cart Data:
  50M active carts x 2KB avg = 100 GB (fits in Redis cluster)

Order Data:
  50M orders/day x 5KB per order = 250 GB/day = 91 TB/year
  10-year retention = ~1 PB

Review Data:
  2B reviews x 2KB avg = 4 TB

Search Index:
  500M products x 3KB indexed fields = 1.5 TB (Elasticsearch)

Click-stream / Analytics:
  50 TB/day (stored in data lake, cold storage after 90 days)
```

### 5.3 Bandwidth Estimation

```
Product Page Bandwidth:
  58,000 QPS x 2MB avg page (including images) = 116 GB/s
  With CDN offloading 90% of images: ~12 GB/s from origin

Search Response Bandwidth:
  29,000 QPS x 50KB per search result page = 1.45 GB/s

Order Write Bandwidth:
  580 QPS x 5KB = 2.9 MB/s (trivial)

Total outbound (origin servers): ~15 GB/s avg
Total outbound (CDN edge): ~150 GB/s avg
Peak (Prime Day): ~1.5 TB/s from CDN
```

### 5.4 Infrastructure Estimation

```
Servers (rough):
  - API Gateway:            200 instances (handles 300K QPS each via async)
  - Product Catalog:        500 instances (read-heavy, heavily cached)
  - Search Service:         1,000 Elasticsearch nodes (500M docs)
  - Cart Service:           50 Redis nodes (100GB dataset)
  - Order Service:          300 instances
  - Inventory Service:      200 instances
  - Payment Service:        100 instances
  - Recommendation Service: 500 instances (ML inference)
  - Total:                  ~3,000-5,000 service instances (normal)
  - Prime Day:              30,000-50,000 instances (auto-scaled)

Databases:
  - Product DB:             Aurora cluster (50 read replicas)
  - Order DB:               Sharded DynamoDB (1,000+ partitions)
  - User DB:                Aurora cluster (20 read replicas)
  - Search:                 1,000-node Elasticsearch cluster
  - Cache:                  1,000-node Redis/Memcached cluster
  - Data Lake:              S3 + EMR/Redshift
```

---

## 6. API Design

### 6.1 Product / Catalog APIs

```
# Search Products
GET /api/v1/products/search
  ?q=wireless+headphones          # Full-text query
  &category=electronics           # Category filter
  &brand=sony,bose                # Brand filter (multi-select)
  &price_min=50&price_max=200     # Price range
  &rating_min=4                   # Minimum star rating
  &prime=true                     # Prime-eligible only
  &sort=relevance|price_asc|price_desc|rating|newest
  &page=1&size=20                 # Pagination
Response: {
  total_results: 12345,
  page: 1,
  results: [
    {
      product_id: "B08N5WRWNW",
      title: "Sony WH-1000XM4 Wireless Headphones",
      thumbnail_url: "https://cdn.amazon.com/...",
      price: { amount: 278.00, currency: "USD", was: 349.99 },
      rating: { average: 4.7, count: 89234 },
      prime_eligible: true,
      badge: "Best Seller",
      delivery_estimate: "Tomorrow"
    }
  ],
  facets: {
    brands: [{ name: "Sony", count: 234 }, ...],
    price_ranges: [{ min: 0, max: 50, count: 1200 }, ...],
    ratings: [{ stars: 4, count: 8900 }, ...]
  }
}

# Get Product Detail
GET /api/v1/products/{product_id}
  ?variant=color:black,size:medium   # Selected variant
Response: {
  product_id: "B08N5WRWNW",
  title: "Sony WH-1000XM4 Wireless Noise Canceling Headphones",
  description: "...",
  bullet_points: ["Industry-leading ANC", "30-hour battery", ...],
  brand: "Sony",
  category_path: ["Electronics", "Headphones", "Over-Ear"],
  images: [{ url: "...", alt: "Front view" }, ...],
  variants: {
    color: [
      { value: "Black", available: true, price: 278.00 },
      { value: "Silver", available: true, price: 278.00 },
      { value: "Blue", available: false, price: 278.00 }
    ]
  },
  price: { amount: 278.00, currency: "USD", list_price: 349.99, savings: 71.99 },
  availability: { in_stock: true, quantity_limit: 5, message: "In Stock" },
  delivery: { prime: true, fastest: "Tomorrow by 9PM", standard: "Wed, Apr 9" },
  seller: { id: "A2FTM...", name: "Amazon.com", rating: 4.9 },
  offers_count: 12,
  reviews_summary: { average: 4.7, count: 89234, distribution: { 5: 67, 4: 18, ... } },
  related_products: [...]
}
```

### 6.2 Cart APIs

```
# Get Cart
GET /api/v1/cart
Headers: Authorization: Bearer <token>
         X-Session-Id: <anonymous_session_id>   # For guest carts
Response: {
  cart_id: "cart_abc123",
  items: [
    {
      item_id: "ci_001",
      product_id: "B08N5WRWNW",
      variant: { color: "Black" },
      title: "Sony WH-1000XM4",
      quantity: 1,
      price: 278.00,
      available: true,
      saved_for_later: false
    }
  ],
  subtotal: 278.00,
  item_count: 1,
  savings: 71.99
}

# Add to Cart
POST /api/v1/cart/items
Body: {
  product_id: "B08N5WRWNW",
  variant_id: "var_black",
  quantity: 1,
  seller_id: "A2FTM..."     # Which seller's offer to add
}
Response: 201 Created { cart_id, item_id, item_count }

# Update Cart Item
PUT /api/v1/cart/items/{item_id}
Body: { quantity: 2 }
Response: 200 OK { updated_item, subtotal }

# Remove from Cart
DELETE /api/v1/cart/items/{item_id}
Response: 204 No Content

# Merge Guest Cart (called on login)
POST /api/v1/cart/merge
Body: { guest_session_id: "sess_xyz" }
Response: 200 OK { merged_cart }
```

### 6.3 Order / Checkout APIs

```
# Initiate Checkout (validate and reserve inventory)
POST /api/v1/checkout
Body: {
  cart_id: "cart_abc123",
  shipping_address_id: "addr_001",
  shipping_speed: "prime_one_day",
  payment_method_id: "pm_visa_001",
  gift_options: { wrap: false, message: null },
  promo_code: "SAVE20"
}
Response: {
  checkout_session_id: "cs_789",
  order_summary: {
    items: [...],
    subtotal: 556.00,
    shipping: 0.00,          # Free Prime shipping
    tax: 45.12,
    discount: -20.00,
    total: 581.12,
    estimated_delivery: "2026-04-08",
    inventory_reserved_until: "2026-04-07T16:00:00Z"  # 10-min hold
  }
}

# Place Order (confirm and charge)
POST /api/v1/orders
Body: {
  checkout_session_id: "cs_789",
  idempotency_key: "ord_idem_abc123"    # Prevents double-submission
}
Response: 201 Created {
  order_id: "111-2345678-9012345",
  status: "confirmed",
  estimated_delivery: "2026-04-08",
  tracking_url: "https://amazon.com/orders/111-2345678-9012345"
}

# Get Order Status
GET /api/v1/orders/{order_id}
Response: {
  order_id: "111-2345678-9012345",
  status: "shipped",
  items: [...],
  shipments: [
    {
      shipment_id: "shp_001",
      carrier: "UPS",
      tracking_number: "1Z999AA...",
      status: "in_transit",
      estimated_delivery: "2026-04-08",
      events: [
        { timestamp: "...", location: "Seattle, WA", status: "departed_facility" }
      ]
    }
  ],
  payment: { method: "Visa ending 1234", amount: 581.12, status: "charged" },
  shipping_address: { ... }
}

# List Orders (with pagination)
GET /api/v1/orders?page=1&size=10&year=2026
```

### 6.4 Review APIs

```
# Submit Review
POST /api/v1/products/{product_id}/reviews
Body: {
  order_id: "111-2345678-9012345",      # Verified purchase link
  rating: 5,
  title: "Best headphones ever",
  body: "Amazing noise cancellation...",
  images: [{ upload_url: "..." }]
}
Response: 201 Created { review_id: "R3FJ..." }

# Get Reviews
GET /api/v1/products/{product_id}/reviews
  ?sort=helpful|recent|rating_high|rating_low
  &rating=5                              # Filter by star rating
  &verified=true                         # Verified purchases only
  &page=1&size=10
Response: {
  summary: { average: 4.7, count: 89234, distribution: {...} },
  reviews: [
    {
      review_id: "R3FJ...",
      author: "John D.",
      verified_purchase: true,
      rating: 5,
      title: "Best headphones ever",
      body: "Amazing noise cancellation...",
      helpful_count: 234,
      date: "2026-03-15",
      images: [...]
    }
  ]
}
```

### 6.5 Seller APIs

```
# Create Product Listing
POST /api/v1/seller/products
Headers: Authorization: Bearer <seller_token>
Body: {
  title: "Wireless Bluetooth Headphones",
  description: "...",
  bullet_points: [...],
  category_id: "cat_electronics_headphones",
  brand: "AudioTech",
  variants: [
    { sku: "AT-BT100-BLK", attributes: { color: "Black" }, price: 49.99 },
    { sku: "AT-BT100-WHT", attributes: { color: "White" }, price: 49.99 }
  ],
  images: [{ upload_url: "..." }],
  keywords: ["bluetooth", "wireless", "headphones"],
  fulfillment: "FBA"           # Fulfilled by Amazon vs. FBM (merchant)
}
Response: 201 Created { product_id, listing_status: "pending_review" }

# Update Inventory
PUT /api/v1/seller/inventory
Body: {
  updates: [
    { sku: "AT-BT100-BLK", fulfillment_center: "SEA3", quantity: 500 },
    { sku: "AT-BT100-WHT", fulfillment_center: "SEA3", quantity: 300 }
  ]
}
Response: 200 OK { updated: 2, warnings: [] }

# Get Seller Dashboard
GET /api/v1/seller/dashboard
  ?period=last_30_days
Response: {
  orders: { total: 1234, pending: 45, shipped: 1100, returned: 89 },
  revenue: { gross: 62000.00, fees: 9300.00, net: 52700.00 },
  metrics: {
    conversion_rate: 0.12,
    buy_box_percentage: 0.67,
    average_rating: 4.3,
    late_shipment_rate: 0.02
  }
}
```

---

## 7. Data Model Overview

### 7.1 Core Entities and Their Databases

```
Entity              Database Choice           Rationale
------              ---------------           ---------
Product Catalog     Aurora PostgreSQL          Complex queries, hierarchical categories,
                    + Redis Cache             ACID for catalog integrity, cache for reads

Product Search      Elasticsearch             Full-text search, faceted filtering,
                                              relevance scoring, 500M document index

Shopping Cart       Redis (primary)           Sub-ms latency, TTL for expiry,
                    + DynamoDB (backup)       Redis for speed, DDB for durability

Orders              DynamoDB                  Massive write throughput, partition by
                                              user_id, global tables for multi-region

Inventory           DynamoDB + Redis          DDB for source of truth, Redis for
                                              real-time stock checks during checkout

Payments            Aurora PostgreSQL          ACID transactions mandatory for money,
                                              strong consistency required

Users / Accounts    Aurora PostgreSQL          Relational data, authentication,
                    + Cognito/Auth            address book, payment methods

Reviews             DynamoDB                  Append-only writes, read-heavy,
                    + Elasticsearch           partition by product_id, ES for search

Sessions            Redis / ElastiCache       Ephemeral, low-latency, auto-expiry

Recommendations     S3 + Redis                Precomputed in batch (S3), served
                                              from cache (Redis)

Images / Media      S3 + CloudFront CDN       Object storage for blobs, CDN for
                                              global low-latency delivery
```

### 7.2 Key Schema Outlines

```
-- Products Table (PostgreSQL)
products (
  product_id        VARCHAR(16) PRIMARY KEY,     -- "B08N5WRWNW"
  title             TEXT NOT NULL,
  description       TEXT,
  brand             VARCHAR(255),
  category_id       INT REFERENCES categories(id),
  seller_id         VARCHAR(32),
  base_price        DECIMAL(12,2),
  list_price        DECIMAL(12,2),
  currency          VARCHAR(3) DEFAULT 'USD',
  status            ENUM('active','inactive','suppressed'),
  prime_eligible    BOOLEAN DEFAULT false,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
)

-- Product Variants Table
product_variants (
  variant_id        VARCHAR(32) PRIMARY KEY,
  product_id        VARCHAR(16) REFERENCES products,
  sku               VARCHAR(64) UNIQUE,
  attributes        JSONB,                        -- { "color": "Black", "size": "M" }
  price             DECIMAL(12,2),
  weight_grams      INT,
  dimensions_cm     JSONB,                        -- { "l": 20, "w": 15, "h": 5 }
  image_urls        JSONB
)

-- Categories Table (hierarchical with materialized path)
categories (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(255),
  parent_id         INT REFERENCES categories(id),
  path              TEXT,                          -- "Electronics.Audio.Headphones"
  depth             INT,
  attributes_schema JSONB                          -- Category-specific attributes
)

-- Orders Table (DynamoDB schema)
orders {
  PK: "USER#<user_id>",
  SK: "ORDER#<order_id>",
  order_id:          "111-2345678-9012345",
  status:            "shipped",
  items:             [...],
  total:             581.12,
  shipping_address:  {...},
  payment_method:    "pm_visa_001",
  created_at:        "2026-04-07T12:00:00Z",
  updated_at:        "2026-04-07T14:30:00Z"
}
-- GSI: order_id-index (PK: order_id) for lookup by order ID
-- GSI: status-index (PK: user_id, SK: status#created_at) for filtering

-- Inventory Table (DynamoDB schema)
inventory {
  PK: "SKU#<sku>",
  SK: "FC#<fulfillment_center_id>",
  available_quantity: 500,
  reserved_quantity:  23,
  version:           147,                         -- Optimistic locking
  updated_at:        "2026-04-07T15:00:00Z"
}

-- Cart (Redis data structure)
-- Key: cart:{user_id}
-- Type: HASH
-- Fields: item:{product_id}:{variant_id} -> JSON { quantity, price, added_at }
-- TTL: 30 days (guest), no TTL (logged-in)
-- Backup: async write to DynamoDB every 30 seconds
```

### 7.3 Key Indexes

```
PostgreSQL Indexes:
  - products: (category_id, status) for category browsing
  - products: (seller_id, status) for seller portal
  - products: GIN index on title (tsvector) for basic text search fallback
  - product_variants: (product_id) for variant lookup
  - categories: (parent_id) and (path) for tree traversal

Elasticsearch Indexes:
  - products index: title, description, brand, category, price, rating,
    prime_eligible, seller_rating, sales_rank
    Mapping: keyword fields for exact filters, text fields for full-text,
    numeric for range queries, nested for variants

DynamoDB GSIs:
  - orders: order_id-index for customer service lookups
  - orders: seller-orders-index (PK: seller_id, SK: created_at)
  - inventory: low-stock-index for alerting
```
