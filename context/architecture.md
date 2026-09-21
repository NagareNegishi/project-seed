# Architecture

checked: <date>

The parts and the seams between them. Every line ends in a citation; the citation is
the truth, the line is a hint. Verify before relying.

CLAUDE.md "Architecture" is the prose companion but lags the code -> CLAUDE.md
"Architecture", <entry point file>

## Parts

### Backend - `<backend-dir>/`

- <layer: what it owns> -> `<path>`

### Frontend - `<frontend-dir>/`

- <layer: what it owns> -> `<path>`

### Database - <database + access layer>

- <schema-change mechanism> -> CLAUDE.md "Configuration"

### Tests - `<test-dir>/`

- <isolation strategy> -> CLAUDE.md "Tests"

## Seams

Each interface between parts and to the outside.

- <seam name>: <what it does> -> `<path>`

## What crosses each seam

- <contract detail not obvious from the code> -> `<path>`

## Weak or missing seams

- <known gap, stated plainly, not as a complaint> -> `<path>`

<!-- SKELETON: structure only. Content fill is a separate session. -->
