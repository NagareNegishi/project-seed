FROM mcr.microsoft.com/devcontainers/dotnet:2-10.0

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
    dnsutils \
    aggregate \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


COPY project-firewall.sh /usr/local/bin/project-firewall.sh
RUN chmod +x /usr/local/bin/project-firewall.sh \
    && echo "vscode ALL=(root) NOPASSWD: /usr/local/bin/project-firewall.sh" > /etc/sudoers.d/vscode-firewall \
    && chmod 0440 /etc/sudoers.d/vscode-firewall


# Install dotnet-ef global tool as vscode user
USER vscode
RUN dotnet tool install -g dotnet-ef
ENV PATH="$PATH:/home/vscode/.dotnet/tools"


# [Optional] Uncomment this line to install global node packages.
# RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && npm install -g <your-package-here>" 2>&1


