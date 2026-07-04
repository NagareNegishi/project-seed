# Base image: Microsoft's official C++ devcontainer image.
# Already includes: build-essential, cmake, clang, gcc, gdb, lldb, llvm, vcpkg.
FROM mcr.microsoft.com/devcontainers/cpp:1-ubuntu-24.04

# Install Ninja, clang-tools-18, and firewall tools.
# - ninja-build: the CMake generator.
# - clang-tools-18: provides clang-scan-deps-18
# "apt-get" update Fetches the latest package lists from Debian/Ubuntu repositories
# "apt-get install" Installs the packages. "-y" auto-confirms prompts. "--no-install-recommends" tells apt to install only what's strictly required
# "apt-get clean" Once installed, the original package files serve no purpose inside the image.
# "rm -rf /var/lib/apt/lists/*" Deletes the package lists. These are only needed during installation
RUN apt-get update && apt-get install -y --no-install-recommends \
    ninja-build \
    clang-tools-18 \
    iptables \
    ipset \
    iproute2 \
    jq \
    dnsutils \
    aggregate \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Put clang-scan-deps on PATH. The LLVM apt packages on Ubuntu ship this binary inside /usr/lib/llvm-18/bin/
# but, unlike clang/clang++/clang-format, do not create a symlink into /usr/bin/.
# CMake 3.28+ needs it on PATH to scan C++20 module dependencies.
# Drop this line once the upstream packages start providing the symlink themselves.
# Update the llvm-18 version number if the base image bumps LLVM.
RUN ln -sf /usr/lib/llvm-18/bin/clang-scan-deps /usr/local/bin/clang-scan-deps

# JUCE Linux build dependencies.
# https://github.com/juce-framework/JUCE/blob/master/docs/Linux%20Dependencies.md
# Required in the container even though the GUI app runs on the host.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libasound2-dev \
    libjack-jackd2-dev \
    ladspa-sdk \
    libcurl4-openssl-dev \
    libfreetype-dev \
    libfontconfig1-dev \
    libx11-dev \
    libxcomposite-dev \
    libxcursor-dev \
    libxext-dev \
    libxinerama-dev \
    libxrandr-dev \
    libxrender-dev \
    libwebkit2gtk-4.1-dev \
    libglu1-mesa-dev \
    mesa-common-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install JUCE 8.0.12 to /usr/local so find_package(JUCE CONFIG REQUIRED) resolves it.
# Pinned to the same tag as client/CMakeLists.txt — bump both together when upgrading.
# Reference: https://github.com/juce-framework/JUCE/blob/master/docs/CMake%20API.md
# --depth=1: tagged commit only, skips full JUCE history.
# Release build: install output only — no debug symbols needed.
RUN git clone --depth=1 --branch 8.0.12 https://github.com/juce-framework/JUCE.git /tmp/JUCE \
    && cmake -S /tmp/JUCE -B /tmp/JUCE/build -G Ninja -DCMAKE_BUILD_TYPE=Release \
    && cmake --build /tmp/JUCE/build \
    && cmake --install /tmp/JUCE/build \
    && rm -rf /tmp/JUCE

# Install the firewall script and grant the non-root vscode user
COPY project-firewall.sh /usr/local/bin/project-firewall.sh
RUN chmod +x /usr/local/bin/project-firewall.sh \
    && echo "vscode ALL=(root) NOPASSWD: /usr/local/bin/project-firewall.sh" > /etc/sudoers.d/vscode-firewall \
    && chmod 0440 /etc/sudoers.d/vscode-firewall

# Make clang the default C/C++ compiler per setup doc.
ENV CC=clang
ENV CXX=clang++