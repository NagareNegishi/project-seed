FROM mcr.microsoft.com/devcontainers/base:debian

# iptables, ipset, iproute2, jq, dnsutils and aggregate: used by project-firewall.sh.
# python3 (the full package, not the minimal one): runs `python3 -m http.server`.
RUN apt-get update && apt-get install -y --no-install-recommends \
    iptables \
    ipset \
    iproute2 \
    jq \
    dnsutils \
    aggregate \
    python3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# The firewall script lives in the image, not the workspace, so Claude cannot edit
# a script that runs as root. sudo is allowed for this one path only.
COPY project-firewall.sh /usr/local/bin/project-firewall.sh
RUN chmod +x /usr/local/bin/project-firewall.sh \
    && echo "vscode ALL=(root) NOPASSWD: /usr/local/bin/project-firewall.sh" > /etc/sudoers.d/vscode-firewall \
    && chmod 0440 /etc/sudoers.d/vscode-firewall
