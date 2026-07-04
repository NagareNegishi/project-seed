# SSL/TLS on a Production Web Server — Concept Reference

## Overview

This document covers the core concepts behind setting up SSL/TLS on a production web server using Let's Encrypt and Certbot. It uses a specific setup as a running example but the concepts apply broadly.

**Reference setup:**

- EC2 instance (Ubuntu) running Docker containers
- nginx running inside a Docker container, serving HTTP on port 80
- Certbot installed on the host OS in standalone mode
- Domain: `jobtracker.nagarenegishi.com`
- Goal: HTTPS with automated certificate renewal

---

## 1. ACME Protocol

**ACME** (Automatic Certificate Management Environment) is a protocol that automates the process of proving domain ownership and obtaining TLS certificates from a Certificate Authority (CA).

Before ACME, getting an SSL certificate involved manual verification, multi-day wait times, and payment. ACME eliminates all of that by defining a machine-to-machine protocol between a client (like Certbot) and a CA (like Let's Encrypt).

### How ACME Domain Validation Works

1. The ACME client requests a certificate for a domain.
2. The CA responds with a **challenge** — a task the client must complete to prove domain control.
3. The client completes the challenge.
4. The CA verifies the challenge and issues the certificate.

### Challenge Types

| Challenge | How It Proves Ownership | Port Required | Notes |
|-----------|------------------------|---------------|-------|
| **HTTP-01** | Serve a token at `http://<YOUR_DOMAIN>/.well-known/acme-challenge/<token>` | 80 | Most common. Cannot issue wildcard certs. |
| **DNS-01** | Create a TXT record `_acme-challenge.<YOUR_DOMAIN>` with a specific value | None | Slower (DNS propagation). Can issue wildcard certs. |
| **TLS-ALPN-01** | Respond to a TLS connection on port 443 with a special self-signed cert | 443 | Less commonly used. |

### Core Principle

DNS maps `<YOUR_DOMAIN>` to your server's IP. If you can serve the correct token on port 80 of that IP, you've proven you control what the domain resolves to. No one else could do that without access to your server or your DNS.

---

## 2. Certbot and Its Modes

**Certbot** is a command-line ACME client written in Python. It communicates with Let's Encrypt's ACME server, completes challenges, and manages certificate files on disk.

Certbot runs on the **host OS** — the machine where Docker is installed — not inside a container and not from a remote laptop. If you SSH into the server, that's where you run Certbot.

### Standalone Mode

Certbot starts its own temporary HTTP server on port 80 to answer the challenge.

**Sequence:**

1. Certbot binds to port 80 and starts a temporary web server.
2. Certbot contacts Let's Encrypt, receives a challenge token.
3. Certbot configures its temporary server to serve the token at `/.well-known/acme-challenge/<token>`.
4. Let's Encrypt requests the token from `http://<YOUR_DOMAIN>/.well-known/acme-challenge/<token>`.
5. Validation passes, certificate is issued, temporary server shuts down.

**Key constraint:** Port 80 must be free. Any other process bound to port 80 (such as nginx or another web server) must be stopped first.

### Webroot Mode

Certbot writes the challenge token file into an existing web server's document root. The running web server serves it — no need to stop anything.

**Requirement:** The web server must already be running and configured to serve files from the webroot path over HTTP. In a Docker setup, this means volume-mounting a shared challenge directory between the host and the container.

### DNS Challenge Mode

No web server involvement at all. Certbot asks you (or a DNS plugin) to create a DNS TXT record. Let's Encrypt queries DNS to verify. Works when port 80 is blocked and supports wildcard certificates.

### Mode Comparison

| Mode | Stops Web Server? | Requires Port 80? | Supports Wildcards? | Complexity |
|------|-------------------|-------------------|---------------------|------------|
| Standalone | Yes | Yes | No | Low |
| Webroot | No | Yes (existing server) | No | Medium |
| DNS-01 | No | No | Yes | Medium–High |

---

## 3. Certificate Files

After a successful run, Certbot writes files to `/etc/letsencrypt/` on the host.

### Directory Structure

```
/etc/letsencrypt/
├── live/<YOUR_DOMAIN>/        # Symlinks to current cert files
│   ├── fullchain.pem
│   ├── privkey.pem
│   ├── cert.pem
│   └── chain.pem
├── archive/<YOUR_DOMAIN>/     # Versioned actual files (kept across renewals)
├── renewal/<YOUR_DOMAIN>.conf # Remembers how the cert was obtained
└── accounts/                  # ACME account credentials (key pair)
```

### The Two Files That Matter

**`privkey.pem`** — Your private key. Generated locally by Certbot. Never sent to Let's Encrypt or anyone else. This is the secret that proves your server's identity. Protect it.

**`fullchain.pem`** — Your server certificate + the intermediate certificate, bundled together. The intermediate certificate connects your cert to a root CA that browsers already trust, forming the **chain of trust**:

```
Root CA (pre-installed in browsers)
  └── Intermediate CA (Let's Encrypt)
        └── Your server certificate (jobtracker.nagarenegishi.com)
```

### What nginx Does With Them (The TLS Handshake)

1. **ClientHello** — Browser initiates a connection.
2. **Certificate** — nginx sends `fullchain.pem`. The browser verifies the chain of trust up to a root CA it already trusts.
3. **Key Exchange** — The browser generates a session key and encrypts it using the public key embedded in your certificate.
4. **Decryption** — nginx uses `privkey.pem` to decrypt the session key. Only your server can do this.
5. **Symmetric Encryption** — Both sides now share the session key and use it to encrypt all subsequent traffic.

### nginx Configuration (General Pattern)

```nginx
server {
    listen 443 ssl;
    server_name <YOUR_DOMAIN>;

    ssl_certificate     /etc/letsencrypt/live/<YOUR_DOMAIN>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<YOUR_DOMAIN>/privkey.pem;

    # ... other config
}
```

In a Docker setup, the cert directory on the host must be **volume-mounted** into the container so nginx can access the files.

---

## 4. The Chicken-and-Egg Problem (Standalone + Docker)

When nginx runs in a Docker container mapped to port 80 on the host, Docker's networking holds port 80 on behalf of the container. This creates a conflict with Certbot standalone mode.

### Why You Must Stop nginx First

Certbot standalone needs to bind its own temporary server to port 80. If Docker/nginx already holds port 80:

- Certbot fails immediately with `Address already in use`.
- Even if it could start, Let's Encrypt's challenge request would hit nginx (which doesn't know about the challenge) and get a 404.

### The Required Sequence

```
1. Stop nginx container        → frees port 80
2. Run certbot --standalone    → Certbot grabs port 80, completes challenge
3. Certbot finishes            → releases port 80
4. Start nginx container       → now configured for HTTPS with cert files mounted
```

### The Trade-off

Your site is briefly offline during this process. For initial setup, this is acceptable. For recurring renewals, it means a few seconds of downtime every 90 days.

---

## 5. Certificate Renewal

Let's Encrypt certificates expire after **90 days**. Renewal must be automated.

### Why nginx Needs an Explicit Reload

When nginx starts, it reads `fullchain.pem` and `privkey.pem` **into memory**. It never checks the files on disk again while running. After Certbot writes renewed cert files, nginx continues using the old (now expired) cert from memory until told to re-read.

`nginx -s reload` sends a signal to the nginx master process to gracefully re-read configuration and cert files. Existing connections finish normally; new connections get the fresh cert. No downtime.

### What Actually Happened (Ubuntu + snap install)

When Certbot is installed via `sudo snap install --classic certbot` on Ubuntu, it automatically sets up a **systemd timer** — no manual cron needed. Verified on this project's EC2 instance (March 2026):

```
● snap.certbot.renew.timer - Timer renew for snap application certbot.renew
   Loaded: loaded (/etc/systemd/system/snap.certbot.renew.timer; enabled; preset: enabled)
   Active: active (waiting)
```

- `enabled` — survives reboots automatically
- Runs twice daily, renews only when cert is within 30 days of expiry (~every 60 days in practice)
- No pre/post hooks configured — renewal stops nginx briefly (standalone mode), restarts it after

To verify the timer is active after your own install:
```bash
sudo systemctl status snap.certbot.renew.timer
```

### Cron-Based Renewal (reference — not used here)

If Certbot was installed via apt or on a non-Ubuntu system, you may need to set up renewal manually. The approaches below are kept as reference.

**Standalone mode** (briefly stops nginx):
```bash
certbot renew --quiet \
  --pre-hook "docker stop <NGINX_CONTAINER_NAME>" \
  --post-hook "docker start <NGINX_CONTAINER_NAME>"
```

- `--pre-hook` stops nginx to free port 80 (only runs if renewal is actually needed).
- `--post-hook` starts nginx back up, which naturally loads the new cert.
- `--quiet` suppresses output unless there's an error.

**Webroot mode** (no downtime):
```bash
certbot renew --quiet \
  --post-hook "docker exec <NGINX_CONTAINER_NAME> nginx -s reload"
```

### What Can Go Wrong With Cron-Based Renewal

- Container name changes after a rebuild — hooks break silently.
- Server reboots and cron daemon doesn't start.
- File permission issues prevent Certbot from writing the new cert.
- Port 80 is occupied by another process during standalone renewal.
- `--quiet` suppresses error output, so failures go unnoticed.
- 90 days is long enough to forget this exists entirely.

### Alternative: Built-in TLS (e.g., Caddy)

Web servers like Caddy have ACME built directly into the server. No separate Certbot, no cron, no hooks. Certificate issuance and renewal happen automatically in the background as part of normal server operation. Fewer moving parts means fewer failure points.

**The core trade-off:** Certbot + cron = more control but more things to maintain and monitor. Built-in ACME = less flexibility but near-zero maintenance.

**Recommendation:** If using Certbot + cron, add monitoring that checks your cert's expiry date and alerts you before it lapses.

---

## 6. HSTS

**HSTS** (HTTP Strict Transport Security) is a response header that instructs browsers to only connect to your site over HTTPS.

### What It Does

When nginx sends:

```
Strict-Transport-Security: max-age=31536000
```

It tells the browser: "For the next year, never make an HTTP request to this domain. Always use HTTPS, even if the user types `http://` or clicks an old link."

The browser enforces this **locally**. An HTTP URL is upgraded to HTTPS before the request ever leaves the machine.

### Why It Matters

Without HSTS, there's a vulnerability window:

1. User visits `http://<YOUR_DOMAIN>`.
2. That first request travels **unencrypted**.
3. Server redirects to HTTPS.
4. An attacker on the same network (e.g., public wifi) could intercept the initial HTTP request and perform a **MITM** (Man-in-the-Middle) or **SSL stripping** attack before the redirect happens.

With HSTS, after the browser's first visit, it never makes that vulnerable HTTP request again.

### Why You Add HSTS After HTTPS Is Confirmed Working

HSTS is a **commitment**. Once a browser receives the header, it refuses HTTP connections for the duration of `max-age`. If your HTTPS is misconfigured (wrong cert, expired cert, nginx not listening on 443), the browser won't fall back to HTTP — it shows an error with no bypass option.

**Safe order:**

1. Get HTTPS fully working.
2. Test thoroughly.
3. Add HSTS header.
4. Start with a short `max-age` (e.g., 300 seconds) and increase once confident.

### nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name <YOUR_DOMAIN>;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ... other config
}
```

---

## Quick Reference: Setup Checklist

```
[ ] DNS A record points <YOUR_DOMAIN> → server IP
[ ] Certbot installed on host OS
[ ] Port 80 reachable from the internet (security group / firewall)
[ ] Stop web server container
[ ] Run: certbot certonly --standalone -d <YOUR_DOMAIN>
[ ] Volume-mount /etc/letsencrypt/ into web server container
[ ] Configure nginx for port 443 with ssl_certificate and ssl_certificate_key
[ ] Add HTTP → HTTPS redirect (port 80 → 443)
[ ] Start web server container
[ ] Verify HTTPS works in browser
[ ] Add HSTS header (start with short max-age)
[ ] Set up cron job for automated renewal
[ ] Add monitoring for certificate expiry
```