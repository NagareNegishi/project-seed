#!/bin/bash

# Standard defensive bash scripting
set -uo pipefail  # Exit on error, undefined vars, and pipeline failures
IFS=$'\n\t'       # Stricter word splitting


# Reset policies to ACCEPT before flushing to avoid blocking during setup
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT


# Flush existing rules and delete existing ipsets. Clean slate before applying new rules.
# But DO NOT flush the nat table - we want to keep Docker's DNS NAT rules intact,
# because Docker's embedded DNS relies on NAT rules to redirect port 53 to the embedded DNS server.
iptables -F
iptables -X
iptables -t mangle -F
iptables -t mangle -X
ipset destroy allowed-domains 2>/dev/null || true


# First allow DNS and localhost before any restrictions
# Need DNS for hostname resolution
# Allow DNS via Docker's embedded resolver (NAT rewrites port 53 to ephemeral port)
iptables -A OUTPUT -d 127.0.0.11 -j ACCEPT
iptables -A INPUT -s 127.0.0.11 -j ACCEPT

# Need SSH for git operations over SSH
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT

# Allow localhost
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Create ipset with CIDR support (Creates a set that stores IP ranges, Essential for the whitelist approach)
ipset create allowed-domains hash:net


# GitHub publishes their IP ranges at api.github.com/meta. (Essential if you use GitHub)
# This fetches them dynamically and adds all web/api/git ranges to the whitelist.
echo "Fetching GitHub IP ranges..."
gh_ranges=$(curl -s https://api.github.com/meta)
if [ -z "$gh_ranges" ]; then
    echo "ERROR: Failed to fetch GitHub IP ranges"
    exit 1
fi

if ! echo "$gh_ranges" | jq -e '.web and .api and .git' >/dev/null; then
    echo "ERROR: GitHub API response missing required fields"
    exit 1
fi

echo "Processing GitHub IPs..."
while read -r cidr; do
    if [[ ! "$cidr" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        echo "ERROR: Invalid CIDR range from GitHub meta: $cidr"
        exit 1
    fi
    echo "Adding GitHub range $cidr"
    ipset add allowed-domains "$cidr" 2>/dev/null || true
done < <(echo "$gh_ranges" | jq -r '(.web + .api + .git)[]' | aggregate -q)


# Resolve and add other allowed domains
# registry.npmjs.org — essential for npm installs
# api.anthropic.com — essential for Claude Code to function
# Other 3 are for VS Code extension marketplace access
for domain in \
    "registry.npmjs.org" \
    "api.anthropic.com" \
    "ui.shadcn.com" \
    "api.osv.dev" \
    "marketplace.visualstudio.com" \
    "vscode.blob.core.windows.net" \
    "update.code.visualstudio.com"; do
    echo "Resolving $domain..."
    ips=$(dig +noall +answer A "$domain" | awk '$4 == "A" {print $5}')
    if [ -z "$ips" ]; then
        echo "ERROR: Failed to resolve $domain"
        exit 1
    fi
    
    while read -r ip; do
        if [[ ! "$ip" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo "ERROR: Invalid IP from DNS for $domain: $ip"
            exit 1
        fi
        echo "Adding $ip for $domain"
        # Avoid failing for duplicate entries
        ipset add allowed-domains "$ip" 2>/dev/null || true
    done < <(echo "$ips")
done


# Get host IP from default route
# Detects Docker host's IP and allows traffic to/from the host subnet. Essential
HOST_IP=$(ip route | grep default | cut -d" " -f3)
if [ -z "$HOST_IP" ]; then
    echo "ERROR: Failed to detect host IP"
    exit 1
fi

HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\.[0-9]*$/.0\/24/")
echo "Host network detected as: $HOST_NETWORK"


# Set up remaining iptables rules
iptables -A INPUT -s "$HOST_NETWORK" -j ACCEPT
iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT


# Set default policies to DROP first
# Everything not explicitly allowed above is dropped. Essential
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP


# Block all IPv6 traffic (our whitelist is IPv4 only)
ip6tables -P INPUT DROP
ip6tables -P FORWARD DROP
ip6tables -P OUTPUT DROP
ip6tables -A OUTPUT -o lo -j ACCEPT
ip6tables -A INPUT -i lo -j ACCEPT


# First allow established connections for already approved traffic
# Allows the response packets through without re-checking the whitelist. Essential — without this, TCP handshakes break.
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT


# Then allow only specific outbound traffic to allowed domains, allow outbound to anything in the ipset
iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT


# Explicitly REJECT all other outbound traffic for immediate feedback
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited


# confirms a non-whitelisted site is blocked, and GitHub is reachable.
echo "Firewall configuration complete"
echo "Verifying firewall rules..."
if curl --connect-timeout 5 https://example.com >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - was able to reach https://example.com"
    exit 1
else
    echo "Firewall verification passed - unable to reach https://example.com as expected"
fi


# Verify GitHub API access
if ! curl --connect-timeout 5 https://api.github.com/zen >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - unable to reach https://api.github.com"
    exit 1
else
    echo "Firewall verification passed - able to reach https://api.github.com as expected"
fi