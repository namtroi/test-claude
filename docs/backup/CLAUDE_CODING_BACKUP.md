- In all interactions and commit messages, be extreamly concise and sacrifice grammar for the sake of concision.

## Tech Stack

- Framework: Next.js 14 (App Router)
- Language: TypeScript 5.x (Strict Mode)
- Styling: Tailwind CSS 4
- State Management: Zustand
- Package Manager: npm

## Project Structure

src/
├── app/ # Next.js App Router pages, layouts, & route handlers
├── components/
│ ├── ui/ # Generic/Reusable UI components (e.g., Shadcn buttons, inputs)
│ └── [features]/ # Domain-specific components (e.g., auth-form, dashboard-card)
├── lib/ # Utility functions, API clients, helpers
├── hooks/ # Custom React hooks
├── types/ # Shared TypeScript interfaces & types (Global)
└── services/ # External API calls & Backend logic

## Code Style & Rules

- **Concision**: In all interactions and commit messages, be extremely concise. Sacrifice grammar for the sake of concision.
- **TypeScript**:
  - STRICTLY NO `any` type. Use `unknown` or define specific interfaces.
  - Use `type` for unions/primitives, `interface` for objects.
  - Explicitly type component props and return types.
- **Components**:
  - Use Functional Components with arrow functions.
  - separate Logic (hooks) from View (JSX) where possible.

## Git & PR Workflow

- **Branches**: Prefix branches with `nam/` (e.g., `nam/feature-login`).
- **Commits**: Be extremely concise. Start with verb (e.g., "add auth", "fix type error").
- **PR Comments**:
  - When adding a TODO in a PR comment, MUST use markdown checkbox format:
    <example>
  - [ ] Description of the todo
        </example>

## Development Workflow

- **Type Check**: RUN `tsc --noEmit` to verify types after any logic change.
- **Step-by-Step Fixes**:
  1. Fix Type errors first.
  2. Fix Logic/Runtime errors second.
  3. Refactor/Clean up last.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Type Check: `tsc --noEmit`
