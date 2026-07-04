# Example: C++ (JUCE, CMake + Ninja)

The DJ-App's real dev-container files, unmodified. Merge the stack-specific
parts into the seed's `.devcontainer/` placeholders:

- `Dockerfile` — base image `mcr.microsoft.com/devcontainers/cpp:1-ubuntu-24.04` (ships cmake, clang, gcc, gdb, lldb, vcpkg), adds `ninja-build` + `clang-tools-18` (with a `clang-scan-deps` PATH symlink for C++20 module scanning), installs the JUCE Linux build deps, then builds and installs JUCE 8.0.12 to `/usr/local` so `find_package(JUCE)` resolves. Shows the "bake a pinned framework into the image" pattern.
- `docker-compose.yml` — single `app` service, no database. A commented stub notes where a second service (Node sync server) would go.
- `devcontainer.json` — fragments to copy: `node` feature (Claude Code needs it on this base image), `cpptools-extension-pack` extension. No `forwardPorts`: the GUI app runs on the host, and the sync-server port is a commented placeholder.
- `project-firewall.sh` — stack domain block: npm (`registry.npmjs.org`), `api.osv.dev`, VS Code (`marketplace.visualstudio.com`, `vscode.blob.core.windows.net`, `update.code.visualstudio.com`). No C++-specific domains: JUCE is fetched at image build time, before the firewall exists.

Project-specific values still inside these files: the `name` field (`dj-app`),
`TZ` (`Pacific/Auckland`), and the JUCE version, which is pinned to match the
project's `client/CMakeLists.txt`. Replace them when instantiating.
