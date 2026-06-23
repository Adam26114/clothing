# Architecture Decision Records

This directory captures non-trivial technical decisions made during the development of the platform. Each ADR is a small, self-contained document explaining the context, the decision, and the consequences.

## Index

| # | Title | Status | Date |
| --- | --- | --- | --- |
| [0001](0001-ui-lib-cycle.md) | Resolving the `@workspace/ui` ↔ `@workspace/lib` dependency cycle | Accepted | June 2026 |

## Conventions

- File names: `NNNN-short-slug.md`, zero-padded to 4 digits.
- Each ADR opens with a header block: `Status`, `Date`, `Phase`, `Deciders`, `Source`.
- Statuses: `Proposed`, `Accepted`, `Superseded`, `Deprecated`.
- Superseding an ADR: keep the old file, change its status, and add a "Superseded by NNNN" line.
