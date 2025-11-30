- In all interactions, be extremely concise. Sacrifice grammar.

## Tech Context & Constraints (STRICT)

- **Architecture**: Monorepo (Turborepo). `apps/web` (Next.js), `apps/api` (Fastify).
- **Language**: TypeScript (Strict). Shared types in `packages/shared-types`.
- **Database**: NONE (Stateless). Data flows in-memory during processing.
- **Communication**: REST API.

## Planning & Documentation Strategy

- **Visual First**: STRICTLY use **Mermaid.js** for architecture/data flows.
- **The "Brain" Pillars**:
  1. **Architecture**: Boundaries between Web (UI) and API (Logic).
  2. **Contracts**: Shared Zod Schemas (DTOs) in `packages/shared-types`.
  3. **Data**: Canonical JSON Schema structure.
  4. **Decisions**: ADRs for tech choices.
- **Decision Principles**:
  - **Simplicity**: Stateless API over stateful DB.
  - **Type Safety**: End-to-end type safety (Web <-> API).
  - **Dependencies**: Native solutions over heavy libs.
- **Execution**: Plans must end with **Phased Checklist**.

## Plans & Questions

- End with unresolved questions.
- Max 3 questions. Extremely concise.
