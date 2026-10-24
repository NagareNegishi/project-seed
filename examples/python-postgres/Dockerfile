FROM mcr.microsoft.com/devcontainers/python:3-3.14-trixie

# Install PostgreSQL client and firewall tools
# "apt-get" update Fetches the latest package lists from Debian/Ubuntu repositories
# "apt-get install" Installs the packages. "-y" auto-confirms prompts. "--no-install-recommends" tells apt to install only what's strictly required
# "apt-get clean" Once installed, the original package files serve no purpose inside the image.
# "rm -rf /var/lib/apt/lists/*" Deletes the package lists. These are only needed during installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    iptables \
    ipset \
    iproute2 \
    jq \
    bind9-dnsutils \
    aggregate \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


COPY project-firewall.sh /usr/local/bin/project-firewall.sh
RUN chmod +x /usr/local/bin/project-firewall.sh \
    && echo "vscode ALL=(root) NOPASSWD: /usr/local/bin/project-firewall.sh" > /etc/sudoers.d/vscode-firewall \
    && chmod 0440 /etc/sudoers.d/vscode-firewall


# Install uv from Astral's image, pinned to an exact version
COPY --from=ghcr.io/astral-sh/uv:0.13.5 /uv /uvx /bin/

USER vscode


# [Optional] Uncomment this line to install global node packages.
# RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && npm install -g <your-package-here>" 2>&1


