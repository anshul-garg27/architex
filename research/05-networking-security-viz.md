# Networking & Security Visualization Tools

---

## NETWORKING

### TCP Handshake
- **Best:** Cisco Packet Tracer (simulation mode, step-by-step protocol exchange)
- Browser tools exist on GitHub (d3.js TCP visualizations)

### HTTP/2 vs HTTP/3
- **HTTP/2 demo:** Akamai (http2.akamai.com) — side-by-side multiplexing demo
- **HTTP/3:** Cloudflare blog (animated diagrams of QUIC 0-RTT)
- **GAP:** NO single tool compares HTTP/1.1 vs 2 vs 3 at frame level

### DNS Resolution
- **DNSViz:** DNSSEC chain visualization (gold standard for DNS pros)
- **Mess with DNS** (Julia Evans): Hands-on real DNS configuration
- **GAP:** No animated iterative resolution flow (stub→recursive→root→TLD→auth)

### TLS 1.3 Handshake
- **BEST:** tls13.xargs.org — byte-by-byte walkthrough, every field annotated
- **Beginner:** howhttps.works — comic-book style illustrated guide

### WebSocket Lifecycle
- **Testing:** Hoppscotch (open-source, supports WS + SSE + MQTT + Socket.IO)
- **GAP:** NO animated lifecycle diagram exists (upgrade→frames→ping/pong→close)

### gRPC vs REST vs GraphQL
- **GAP:** NO single tool shows same operation in all three with protocol details

### CDN Request Flow
- **Fastly Fiddle:** Test CDN edge logic (VCL) in browser
- **Cloudflare Radar:** Global traffic map

### CORS Flow
- **Best resource:** Jake Archibald's article (decision tree diagrams)
- **GAP:** NO interactive CORS simulator despite being one of the most confusing web concepts

---

## SECURITY & CRYPTOGRAPHY

### OAuth 2.0 / OIDC
- **Google OAuth Playground:** Real OAuth flow against production APIs
- **oauth.com (Aaron Parecki):** Interactive walkthrough by OAuth spec editor

### JWT
- **jwt.io:** THE standard. Paste→decode→edit→verify. Color-coded header/payload/signature.

### SSL/TLS Certificate Chain
- **SSL Labs:** Industry-standard TLS assessment. A-F grade, full chain analysis.

### Cryptography
- **CrypTool 2/Online:** AES round visualization, RSA, Diffie-Hellman, elliptic curves
- **sha256algorithm.com:** SHA-256 step-by-step (64 rounds)

### Authentication Flows
- **Auth0 docs:** Best architecture scenario diagrams across OAuth/OIDC flows

---

## 6 MAJOR GAPS

1. **HTTP/2 vs HTTP/3 vs QUIC** interactive side-by-side — nothing exists
2. **WebSocket lifecycle** animated visualization — only testing tools
3. **gRPC vs REST vs GraphQL** unified comparison — no single tool
4. **CORS flow simulator** — despite being universally confusing
5. **End-to-end auth flow visualizer** (login→token→API→refresh) — vendor-specific only
6. **CDN request routing** (anycast, POP selection, cache hierarchy) — nothing interactive
