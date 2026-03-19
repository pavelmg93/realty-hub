# ADR 003: Use Cloudflare Proxy for HTTPS

**Date:** 2026-03-19
**Status:** Accepted

---

## Context / Problem

Realty Hub deploys to 10 real FIDT agents on Monday Mar 23. The app runs on a GCP VM at `http://136.110.34.97:8888` — plain HTTP, raw IP. Real users need HTTPS.

Pavel already manages `xeldon.com` via Cloudflare (registered on Porkbun). The subdomain `realtyhub.xeldon.com` is available.

Constraints:
- Single GCP VM running Docker Compose
- Domain managed by Cloudflare (DNS + proxy available)
- Must be zero-maintenance
- Minimal changes to existing docker-compose.yml

---

## Considered Options

**Option A: Cloudflare proxy (orange cloud)** — A record pointing to VM IP, proxied through Cloudflare. TLS terminated at Cloudflare edge. Origin rule routes to port 8888. No changes to docker-compose.

**Option B: Caddy reverse proxy in Docker** — Add Caddy container for auto-HTTPS via Let's Encrypt. Requires domain, cert volumes, docker-compose changes.

**Option C: Nginx + Certbot** — Traditional reverse proxy. Most config, manual cert renewal.

---

## Decision

**Option A: Cloudflare proxy.**

Cloudflare provides automatic TLS for any proxied subdomain at no cost. The setup is entirely in the Cloudflare dashboard — no application-level changes needed for basic functionality.

### Configuration

1. **Cloudflare DNS:** A record `realtyhub.xeldon.com` → `136.110.34.97` (proxied / orange cloud)
2. **Cloudflare Origin Rule:** Match hostname `realtyhub.xeldon.com` → override destination port to `8888`
3. **Cloudflare SSL/TLS mode:** Flexible (HTTPS user→Cloudflare, HTTP Cloudflare→origin)
4. **GCP firewall:** Port 8888 open. Optionally restrict to Cloudflare IP ranges.

### Application changes (Claude Code)

- Verify `X-Forwarded-Proto` and `X-Forwarded-For` headers are handled correctly (Next.js respects these by default)
- Update any hardcoded `http://` or `localhost:8888` references
- Add `DOMAIN=realtyhub.xeldon.com` to `.env.example`
- Ensure JWT cookie `secure` flag works with Flexible SSL (cookie set over HTTP from origin, but browser sees HTTPS)

---

## Rationale

Option A requires zero Docker changes, zero cert management, and zero ongoing maintenance. Cloudflare handles TLS, DDoS protection, and caching out of the box. For a 10-user pilot on a single VM, adding Caddy (Option B) is unnecessary complexity — it solves a problem Cloudflare already solves.

The "Flexible" SSL mode means Cloudflare→origin traffic is unencrypted HTTP. This is acceptable for pilot: the traffic traverses Google's internal network, not the public internet. For production scale, upgrade to "Full (Strict)" with a Cloudflare Origin Certificate installed on the VM.

---

## Consequences

**Positive:**
- HTTPS live in ~10 minutes (DNS propagation)
- Zero Docker changes — existing docker-compose.yml untouched
- Free Cloudflare DDoS protection and CDN caching as bonus
- Easy to upgrade to Full SSL later by adding origin cert

**Negative / Risks:**
- Cloudflare "Flexible" mode: origin traffic is HTTP. Acceptable for pilot, not for production with sensitive data at scale.
- Dependency on Cloudflare availability (99.99% SLA — negligible risk)
- JWT `secure` cookie flag: if set, browser sends cookie only over HTTPS (which it sees), but origin receives it over HTTP. Next.js handles this correctly with `X-Forwarded-Proto`.

**Mitigation:**
- Upgrade to "Full (Strict)" post-pilot by generating a Cloudflare Origin Certificate and configuring the web container to serve HTTPS on origin.
- Restrict GCP firewall to Cloudflare IP ranges to prevent direct HTTP access bypassing the proxy.
