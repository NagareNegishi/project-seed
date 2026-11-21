# Example: static site

A static site served by `python3 -m http.server`. No build step, no database,
no Docker-in-Docker. Merge the stack-specific parts into the seed's
`.devcontainer/` placeholders:

- `Dockerfile` - seed base image plus `python3` (the full package, for `http.server`).
- `docker-compose.yml` - single `app` service, no database.
- `devcontainer.json` - fragments to copy: `forwardPorts` and `portsAttributes` for the server port.
- `project-firewall.sh` - the seed firewall minus the Docker-in-Docker parts. Allows DNS, GitHub, Anthropic and npm only.

Replace these placeholders when instantiating: `name` (`<project-name>`), the
port (`8000`) and its `label` (`<site-label>`), and `TZ`.
