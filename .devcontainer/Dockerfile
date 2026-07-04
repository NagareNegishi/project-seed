# <placeholder> Swap the base image for your stack, e.g. mcr.microsoft.com/devcontainers/dotnet:2-10.0
# The default builds a working stack-agnostic container.
FROM mcr.microsoft.com/devcontainers/base:debian

# Install firewall tools — required by project-firewall.sh, do not remove.
# Add stack packages (db clients etc.) to this list; see examples/.
# "apt-get update" fetches the latest package lists from Debian/Ubuntu repositories
# "apt-get install" installs the packages. "-y" auto-confirms prompts. "--no-install-recommends" tells apt to install only what's strictly required
# "apt-get clean" — once installed, the original package files serve no purpose inside the image.
# "rm -rf /var/lib/apt/lists/*" deletes the package lists. These are only needed during installation
RUN apt-get update && apt-get install -y --no-install-recommends \
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


# <placeholder> stack tool installs as the vscode user, e.g. dotnet-ef (see examples/)
# USER vscode
# RUN <tool install>
# ENV PATH="$PATH:<tool path>"


# [Optional] Uncomment this line to install global node packages.
# RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && npm install -g <your-package-here>" 2>&1
