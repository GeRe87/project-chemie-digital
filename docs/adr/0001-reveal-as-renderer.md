# ADR-0001: Use Reveal.js as an encapsulated presentation renderer

- Status: Proposed
- Date: 2026-07-15

## Context

The platform must render live presentations while its source model represents semantic knowledge resources and learning paths rather than authored slides.

## Decision

Use Reveal.js as an npm dependency behind a renderer adapter. Do not fork Reveal.js initially. The core domain, path resolver, and scene composer remain independent of Reveal.js.

## Consequences

- Existing presentation capabilities are reused.
- Upstream updates remain manageable.
- A later renderer can be added without migrating semantic content.
- Reveal-specific lifecycle behavior must be handled within `packages/renderer-reveal`.

## Fork trigger

A fork may be reconsidered only after a documented proof shows that a required behavior cannot be implemented through public APIs, plugins, React integration, or renderer-side state management.
