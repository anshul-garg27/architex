# Load Balancing Technologies

---

## Software Load Balancers

### Nginx

**What it is:** Reverse proxy, web server, and load balancer. The most widely deployed web server in the world. Open-source version handles L7 LB; Nginx Plus adds advanced features (active health checks, session persistence, dynamic config).

#### Basic Load Balancing Configuration

```nginx
# /etc/nginx/conf.d/loadbalancer.conf

# Define the upstream server pool
upstream api_servers {
    # Default: round robin
    server 10.0.1.1:8080;
    server 10.0.1.2:8080;
    server 10.0.1.3:8080;
}

# Weighted round robin
upstream weighted_api {
    server 10.0.1.1:8080 weight=5;    # 50% of traffic
    server 10.0.1.2:8080 weight=3;    # 30% of traffic
    server 10.0.1.3:8080 weight=2;    # 20% of traffic
}

# Least connections
upstream least_conn_api {
    least_conn;
    server 10.0.1.1:8080;
    server 10.0.1.2:8080;
}

# IP hash (sticky sessions)
upstream sticky_api {
    ip_hash;
    server 10.0.1.1:8080;
    server 10.0.1.2:8080;
}

server {
    listen 80;
    server_name api.example.com;

    location /api/ {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        proxy_pass http://cdn_servers;
    }
}
```

#### Health Checks (Nginx Plus)

```nginx
upstream api_servers {
    zone api_zone 64k;    # shared memory for health check state

    server 10.0.1.1:8080;
    server 10.0.1.2:8080;
    server 10.0.1.3:8080 backup;   # standby, only used if others are down

    # Passive health check (open-source Nginx)
    # Marks server as failed after N failed attempts
    server 10.0.1.4:8080 max_fails=3 fail_timeout=30s;
}

# Active health check (Nginx Plus only)
server {
    location /api/ {
        proxy_pass http://api_servers;
        health_check interval=5s fails=3 passes=2;
        # Check every 5s; 3 failures = mark down; 2 passes = mark up
    }
}
```

**Key characteristics:**
- Open-source: round robin, weighted, IP hash, least_conn
- Nginx Plus: active health checks, session persistence, dynamic reconfiguration, least_time
- Event-driven architecture: handles 10K+ concurrent connections efficiently
- Also serves static files, does SSL termination, caching

---

### HAProxy

**What it is:** Purpose-built, high-performance TCP and HTTP load balancer. The gold standard for software LB. Known for reliability, zero-downtime reloads, and detailed stats.

#### Basic Configuration

```
# /etc/haproxy/haproxy.cfg

global
    maxconn 50000
    log /dev/log local0
    stats socket /var/run/haproxy.sock mode 600 level admin

defaults
    mode http
    timeout connect 5s
    timeout client  30s
    timeout server  30s
    option httplog
    option dontlognull
    option http-server-close
    retries 3

# Frontend: where clients connect
frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/mysite.pem

    # ACL-based routing
    acl is_api path_beg /api
    acl is_admin path_beg /admin
    acl is_websocket hdr(Upgrade) -i WebSocket

    use_backend api_servers    if is_api
    use_backend admin_servers  if is_admin
    use_backend ws_servers     if is_websocket
    default_backend web_servers

# Backend: server pools
backend api_servers
    balance roundrobin
    option httpchk GET /health HTTP/1.1\r\nHost:\ api.local
    server api1 10.0.1.1:8080 check inter 5s fall 3 rise 2
    server api2 10.0.1.2:8080 check inter 5s fall 3 rise 2
    server api3 10.0.1.3:8080 check inter 5s fall 3 rise 2 backup

backend web_servers
    balance leastconn
    cookie SERVERID insert indirect nocache
    server web1 10.0.2.1:8080 check cookie web1
    server web2 10.0.2.2:8080 check cookie web2

backend admin_servers
    balance source       # IP hash
    server admin1 10.0.3.1:8080 check

# TCP mode for non-HTTP (e.g., database)
frontend mysql_front
    mode tcp
    bind *:3306
    default_backend mysql_servers

backend mysql_servers
    mode tcp
    balance leastconn
    server db1 10.0.4.1:3306 check
    server db2 10.0.4.2:3306 check

# Stats page
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST
```

**Key characteristics:**
- Both L4 (TCP mode) and L7 (HTTP mode)
- ACL system for complex routing rules
- Built-in stats dashboard
- Cookie-based sticky sessions
- Zero-downtime reloads (seamless config updates)
- Connection rate limiting, request queuing
- Used by GitHub, Stack Overflow, Tumblr, Airbnb

---

### Envoy Proxy

**What it is:** Modern, cloud-native L4/L7 proxy designed for microservices. Originally built at Lyft. The data plane in Istio, Consul Connect, and AWS App Mesh. Configured via APIs (xDS) rather than static config files.

#### Key Architecture

```
Control Plane (Istio / Consul)
    |
    | xDS API (dynamic config push)
    v
+-------------------+
|   Envoy Proxy     |
|                   |
|  Listeners        |   Listeners: ports to accept traffic on
|    |              |   Filter Chains: processing pipeline
|  Filter Chains    |   Clusters: groups of upstream endpoints
|    |              |   Routes: mapping rules (L7)
|  Routes           |
|    |              |
|  Clusters         |   All configurable dynamically via xDS
|    |              |   No restarts needed
|  Endpoints        |
+-------------------+
```

#### Static Configuration Example

```yaml
# envoy.yaml
static_resources:
  listeners:
    - name: http_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters
                         .network.http_connection_manager.v3
                         .HttpConnectionManager
                stat_prefix: ingress_http
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/api"
                          route:
                            cluster: api_service
                        - match:
                            prefix: "/"
                          route:
                            cluster: web_service

  clusters:
    - name: api_service
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: LEAST_REQUEST     # Power of Two Choices (P2C)
      load_assignment:
        cluster_name: api_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: api-server
                      port_value: 8080
      health_checks:
        - timeout: 2s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check:
            path: "/health"
```

**Key characteristics:**
- xDS API for dynamic configuration (no restart needed)
- Built-in observability: distributed tracing, metrics, access logs
- Advanced LB: P2C, ring hash, Maglev, round robin, random
- Circuit breaking, outlier detection, retries
- gRPC native support, HTTP/2 throughout
- Used by Lyft, Airbnb, Uber, Salesforce, eBay

---

### Traefik

**What it is:** Modern reverse proxy and LB with **automatic service discovery**. Natively integrates with Docker, Kubernetes, Consul, and others. Discovers services and configures routes automatically via labels and annotations.

#### Docker Compose Example

```yaml
# docker-compose.yml
version: "3"

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  api:
    image: myapp/api:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.example.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=8080"
    deploy:
      replicas: 3   # Traefik auto-discovers all 3 replicas
```

**Key characteristics:**
- Auto-discovery: Docker labels, K8s Ingress, Consul catalog
- Automatic TLS with Let's Encrypt
- Hot reload: no restart when services change
- Middleware: rate limiting, auth, circuit breaker, headers
- Dashboard for routing visualization
- Great for Docker/Kubernetes environments

---

### Software Load Balancer Comparison

```
+----------------+----------+----------+----------+----------+
| Feature        | Nginx    | HAProxy  | Envoy    | Traefik  |
+----------------+----------+----------+----------+----------+
| Layer          | L7       | L4 + L7  | L4 + L7  | L7       |
| (primary mode) | (mainly) |          |          |          |
+----------------+----------+----------+----------+----------+
| Config         | Files    | Files    | xDS API  | Auto-    |
|                | (static) | (static) | (dynamic)| discovery|
+----------------+----------+----------+----------+----------+
| Reload         | Graceful | Zero-    | Hot (API)| Hot      |
|                | restart  | downtime |          | (auto)   |
+----------------+----------+----------+----------+----------+
| Performance    | Very High| Highest  | High     | Good     |
+----------------+----------+----------+----------+----------+
| Observability  | Access   | Stats    | Best     | Dashboard|
|                | logs     | dashboard| (tracing,| + metrics|
|                |          |          | metrics) |          |
+----------------+----------+----------+----------+----------+
| Health Checks  | Passive  | Active + | Active + | Active   |
| (open-source)  | only*    | Passive  | Passive  |          |
+----------------+----------+----------+----------+----------+
| Service Mesh   | No       | No       | Yes      | Yes      |
|                |          |          | (Istio)  | (Maesh)  |
+----------------+----------+----------+----------+----------+
| gRPC Support   | Yes      | Yes      | Native   | Yes      |
+----------------+----------+----------+----------+----------+
| Best For       | Web      | High-    | Micro-   | Docker/  |
|                | serving  | perf LB  | services | K8s      |
|                | + LB     | + TCP    | + mesh   | simple   |
+----------------+----------+----------+----------+----------+
| Used By        | Most     | GitHub,  | Lyft,    | Small to |
|                | websites | Stack    | Google,  | medium   |
|                |          | Overflow | Uber     | startups |
+----------------+----------+----------+----------+----------+

* Nginx Plus (paid) adds active health checks
```

---

## Cloud Load Balancers

### AWS Application Load Balancer (ALB)

```
Type:       Layer 7 (HTTP/HTTPS/gRPC/WebSocket)
Use for:    Microservices, path/host routing, modern web apps
```

```
Internet
    |
    v
+--------+
|  ALB   |----> /api/*     --> Target Group A (API containers)
|        |----> /web/*     --> Target Group B (Web servers)
|        |----> /grpc/*    --> Target Group C (gRPC service)
|        |----> default    --> Target Group D (fallback)
+--------+

Features:
  - Path-based routing: /api, /images, /admin
  - Host-based routing: api.example.com, admin.example.com
  - HTTP/2 and gRPC support
  - WebSocket support
  - Sticky sessions (cookie-based)
  - Integrated with AWS WAF (web application firewall)
  - Redirect and fixed-response actions
  - Authentication (Cognito, OIDC) built-in
  - Cross-zone load balancing (default: on)
  - Target types: instances, IP addresses, Lambda functions
```

---

### AWS Network Load Balancer (NLB)

```
Type:       Layer 4 (TCP/UDP/TLS)
Use for:    Extreme performance, static IP, non-HTTP protocols
```

```
Internet
    |
    v
+--------+
|  NLB   |----> TCP:3306  --> Target Group (MySQL replicas)
|        |----> TCP:6379  --> Target Group (Redis cluster)
|        |----> TLS:443   --> Target Group (TLS passthrough)
+--------+

Features:
  - Handles millions of requests per second
  - Ultra-low latency (~100 microseconds added)
  - Static IP per AZ (or Elastic IP)
  - Preserves client source IP (unlike ALB which adds X-Forwarded-For)
  - TCP/UDP/TLS protocols
  - TLS termination or passthrough
  - Cross-zone load balancing (default: off, enable for even distribution)
  - Long-lived connections (database, IoT)
  - PrivateLink compatible (expose services to other VPCs)
  - Target types: instances, IP addresses, ALB (NLB in front of ALB)
```

---

### AWS Classic Load Balancer (CLB)

```
Type:       Layer 4 + Layer 7 (legacy)
Status:     DEPRECATED -- use ALB or NLB for new deployments
```

```
Features:
  - Both L4 and L7 but limited compared to ALB/NLB
  - No path-based or host-based routing
  - No target groups (maps directly to instances)
  - Sticky sessions (cookie-based)
  - SSL termination

Migration:
  CLB with HTTP listeners     --> ALB
  CLB with TCP listeners      --> NLB
  CLB with both               --> ALB + NLB (or just ALB)
```

---

### GCP Cloud Load Balancing

```
Type:       Global L4 + L7 (single anycast IP for worldwide traffic)
Use for:    Global applications, auto-scaling, GKE ingress
```

```
                   Single Anycast IP: 34.120.0.1
                            |
       +--------------------+--------------------+
       |                    |                    |
  US region            EU region            Asia region
  (auto-routed)        (auto-routed)        (auto-routed)
       |                    |                    |
  Instance Group       Instance Group       Instance Group

Key Products:
  - Global External HTTP(S) LB:  L7, global anycast, auto-scaling, CDN
  - Global External TCP/SSL LB:  L4, global anycast, SSL offload
  - Regional External TCP/UDP LB: L4, regional, network-level
  - Internal HTTP(S) LB:        L7, VPC-internal microservices
  - Internal TCP/UDP LB:        L4, VPC-internal, passthrough

Features:
  - Single anycast IP (no DNS round-robin needed)
  - Automatic multi-region failover
  - Cloud CDN integration
  - Cloud Armor (DDoS + WAF) integration
  - Serverless NEGs (Cloud Run, App Engine, Cloud Functions)
  - GKE Ingress controller built-in
```

---

### Azure Load Balancer

```
Type:       Layer 4 (TCP/UDP)
Use for:    VM scale sets, zone-redundant, internal services
```

```
Azure LB Products:
  - Azure Load Balancer:        L4, regional, zone-redundant
  - Azure Application Gateway:  L7, WAF, SSL termination, path routing
  - Azure Front Door:           Global L7, CDN, WAF, anycast
  - Azure Traffic Manager:      DNS-based, global, failover/performance

Selection Guide:
  Internal L4 traffic       --> Azure Load Balancer (internal)
  Public L4 traffic         --> Azure Load Balancer (public)
  HTTP/HTTPS smart routing  --> Application Gateway
  Global HTTP/HTTPS         --> Azure Front Door
  Multi-region DNS failover --> Traffic Manager
```

---

## When to Use Which Cloud Load Balancer

```
+-----------------------------+------------------+------------------+------------------+
| Scenario                    | AWS              | GCP              | Azure            |
+-----------------------------+------------------+------------------+------------------+
| HTTP microservices,         | ALB              | Global HTTP(S)   | Application      |
| path/host routing           |                  | LB               | Gateway          |
+-----------------------------+------------------+------------------+------------------+
| High-throughput TCP,        | NLB              | Regional TCP/UDP | Azure LB         |
| static IP, non-HTTP         |                  | LB               |                  |
+-----------------------------+------------------+------------------+------------------+
| Global distribution,        | CloudFront +     | Global HTTP(S)   | Azure Front Door |
| single entry point          | Route 53 +       | LB (anycast)     |                  |
|                             | ALB              |                  |                  |
+-----------------------------+------------------+------------------+------------------+
| Internal service-to-        | Internal ALB     | Internal HTTP(S) | Internal Azure   |
| service (HTTP)              |                  | LB               | App Gateway      |
+-----------------------------+------------------+------------------+------------------+
| Database / Redis            | NLB (internal)   | Internal TCP/UDP | Internal Azure   |
| proxying                    |                  | LB               | LB               |
+-----------------------------+------------------+------------------+------------------+
| Multi-region DNS            | Route 53         | Cloud DNS        | Traffic Manager  |
| failover                    | (failover policy)| (routing policy) |                  |
+-----------------------------+------------------+------------------+------------------+
| WebSocket, gRPC             | ALB              | Global HTTP(S)   | Application      |
|                             |                  | LB               | Gateway          |
+-----------------------------+------------------+------------------+------------------+
| Kubernetes ingress          | AWS LB           | GKE Ingress      | AKS + App        |
|                             | Controller       | Controller       | Gateway Ingress  |
+-----------------------------+------------------+------------------+------------------+
```

---

## Quick Decision Flowchart

```
Need a load balancer?
  |
  v
Is this a cloud deployment?
  |          |
  YES        NO (on-prem / self-hosted)
  |          |
  |          v
  |        Need L4 + L7?
  |          |        |
  |         YES       L7 only?
  |          |          |     |
  |          v         YES    L4 only?
  |        HAProxy      |      |
  |                     v      v
  |                   Nginx   HAProxy (TCP mode)
  |                   or       or Linux IPVS
  |                   Traefik
  |
  v
Which cloud?
  |
  +-- AWS:   HTTP? --> ALB.   TCP? --> NLB.   Global? --> CloudFront + Route 53
  |
  +-- GCP:   Almost everything --> Global HTTP(S) LB.  TCP raw --> Regional LB.
  |
  +-- Azure: HTTP? --> App Gateway.  TCP? --> Azure LB.  Global? --> Front Door.

Service mesh / internal?
  --> Envoy sidecar (Istio / Consul Connect)
  --> gRPC client-side LB
```
