# Examples

Two groups, both real files pulled unmodified from working projects:

- `stack/` — `.devcontainer/` setups. Pick one, merge its pieces into the
  seed's `.devcontainer/` placeholders. See the root `README.md`
  ("Instantiation checklist") for the merge steps, and `stack/README.md`
  for what each folder contains.
- `cicd/` — GitHub Actions pipelines (test gates, deploy, dependency
  updates). See `cicd/README.md`.

Neither group is wired into anything — copy what a new project needs, delete
the rest.
