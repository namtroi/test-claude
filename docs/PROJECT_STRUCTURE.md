# Project Structure

## Overview

Monorepo using pnpm workspaces. Three workspaces: API (Fastify), Web (Next.js), Shared (Zod schemas). Each owns dependencies, build process, entry point.

```
root/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   └── shared/
└── docs/
```

## Workspace Architecture

### Root Level

| Path | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Defines workspace globs (`apps/*`, `packages/*`) |
| `package.json` | Root dependencies (dev tools), monorepo scripts |
| `tsconfig.json` | Base TypeScript config (strict: true), extended by workspaces |
| `.npmrc` | pnpm settings (registry, install strategy) |
| `docs/` | Project documentation |

### apps/api/ - Fastify Backend

REST API server. Handles AST parsing, drift detection, Mermaid generation.

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── analyze.ts          # POST /analyze endpoint
│   │   ├── drift.ts            # POST /drift endpoint
│   │   ├── health.ts           # GET /health endpoint
│   │   └── index.ts            # Route registration
│   │
│   ├── services/
│   │   ├── parser.service.ts   # AST parsing (ts-morph)
│   │   ├── drift.service.ts    # Comparison logic
│   │   ├── mermaid.service.ts  # Mermaid syntax generation
│   │   └── index.ts            # Service exports
│   │
│   ├── middleware/
│   │   ├── validation.ts       # Zod schema validation
│   │   ├── error-handler.ts    # Standardized error responses
│   │   └── cors.ts             # CORS configuration
│   │
│   ├── utils/
│   │   ├── response.ts         # Standard response formatter
│   │   ├── logger.ts           # Logging utility
│   │   └── errors.ts           # Custom error classes
│   │
│   └── index.ts                # Fastify app initialization
│
├── dist/                        # Build output (compiled JS)
├── package.json
└── tsconfig.json
```

**Dependencies**:
- Runtime: `fastify`, `@fastify/cors`, `zod`, `ts-morph`, `@shared` (workspace)
- Dev: `typescript`, `@types/node`, `tsx`

**Scripts**:
```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

### apps/web/ - Next.js Frontend

Interactive UI for folder selection, diagram rendering, drift visualization.

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (Tailwind, theme)
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Tailwind imports
│   │
│   ├── components/
│   │   ├── Upload.tsx          # File picker + upload form
│   │   ├── Diagram.tsx         # Mermaid.js renderer
│   │   ├── DriftViewer.tsx     # Display drift results
│   │   ├── Navbar.tsx          # Header/navigation
│   │   └── shared/
│   │       ├── Button.tsx      # Tailwind button
│   │       ├── Modal.tsx       # Modal wrapper
│   │       └── Spinner.tsx     # Loading indicator
│   │
│   ├── hooks/
│   │   ├── useAnalyze.ts       # POST /analyze hook
│   │   ├── useDrift.ts         # POST /drift hook
│   │   └── useFiles.ts         # File input/state hook
│   │
│   ├── stores/
│   │   ├── appStore.ts         # Zustand: analysis, drift results
│   │   └── uiStore.ts          # Zustand: modal state, loading
│   │
│   ├── types/
│   │   └── index.ts            # App-specific types
│   │
│   └── utils/
│       ├── api-client.ts       # Fetch wrapper (/analyze, /drift)
│       ├── file-handler.ts     # File System Access API
│       └── formatters.ts       # JSON display, error messages
│
├── .next/                       # Build output (Next.js generated)
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

**Dependencies**:
- Runtime: `next`, `react`, `react-dom`, `zustand`, `zod`, `mermaid`, `@shared`
- Dev: `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `@types/react`

**Scripts**:
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

### packages/shared/ - Zod Schemas + Types

Single source of truth for request/response contracts. Imported by API and Web.

```
packages/shared/
├── src/
│   ├── schemas/
│   │   ├── file.schema.ts      # FileInputSchema, FileSchema
│   │   ├── analyze.schema.ts   # AnalyzeRequestSchema, AnalyzeResponseSchema
│   │   ├── drift.schema.ts     # DriftRequestSchema, DriftResponseSchema
│   │   ├── error.schema.ts     # ErrorResponseSchema
│   │   └── index.ts            # Re-exports
│   │
│   ├── types.ts                # TypeScript interfaces (z.infer<>)
│   └── index.ts                # Main export
│
├── dist/                        # Build output
├── package.json
└── tsconfig.json
```

**Dependencies**:
- Runtime: `zod`
- Dev: `typescript`

**Scripts**:
```json
{
  "build": "tsc",
  "watch": "tsc --watch"
}
```

**Principle**: Zod schemas define shape + runtime validation. TypeScript types inferred via `z.infer<>`.

## Build Outputs

| Workspace | Source | Output | Command |
|-----------|--------|--------|---------|
| API | `apps/api/src/` | `apps/api/dist/` | `pnpm build` |
| Web | `apps/web/src/` | `apps/web/.next/` | `pnpm build` |
| Shared | `packages/shared/src/` | `packages/shared/dist/` | `pnpm build` |

## Dev Workflow

### Root Scripts

**package.json**:
```json
{
  "scripts": {
    "dev": "pnpm --parallel -r run dev",
    "build": "pnpm -r run build",
    "api": "pnpm --filter @api run dev",
    "web": "pnpm --filter @web run dev"
  }
}
```

### Entry Points

- **API**: `apps/api/src/index.ts` → `localhost:3001`
- **Web**: `apps/web/src/app/page.tsx` → `localhost:3000`

### Development Servers

**Run all**:
```bash
pnpm dev
```

**Run individually**:
```bash
pnpm api      # Terminal 1
pnpm web      # Terminal 2
```

## Config File Locations

| Config | Location | Scope |
|--------|----------|-------|
| TypeScript (base) | `tsconfig.json` | Project-wide |
| TypeScript (API) | `apps/api/tsconfig.json` | Extends root |
| TypeScript (Web) | `apps/web/tsconfig.json` | Extends root |
| Tailwind | `apps/web/tailwind.config.js` | Web only |
| PostCSS | `apps/web/postcss.config.js` | Web only |
| Next.js | `apps/web/next.config.js` | Web only |
| Fastify | `apps/api/src/index.ts` (inline) | API only |
| pnpm | `pnpm-workspace.yaml`, `.npmrc` | Monorepo |

## Dependency Management

### Workspace References

**apps/api/package.json**:
```json
{
  "name": "@api",
  "dependencies": {
    "@shared": "workspace:*"
  }
}
```

**apps/web/package.json**:
```json
{
  "name": "@web",
  "dependencies": {
    "@shared": "workspace:*"
  }
}
```

pnpm resolves `@shared` to local `packages/shared/`, creates symlinks during install.

### Root Dependencies

**Root package.json**: Dev tools only (prettier, eslint, typescript)
**Workspace package.json**: Production + workspace dependencies

## Git Ignore

```gitignore
# Build outputs
apps/api/dist/
apps/web/.next/
packages/shared/dist/

# Dependencies
node_modules/
.pnpm-store/

# Environment
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

## Installation & Setup

### Bootstrap Monorepo

```bash
pnpm install
```

pnpm reads `pnpm-workspace.yaml`, installs all workspace dependencies, creates symlinks for `@shared`.

### Verify Setup

```bash
pnpm list                 # Show all packages
pnpm -r list              # Tree view of dependencies
```

### Environment Variables

**apps/api/.env.local**:
```env
PORT=3001
LOG_LEVEL=debug
```

**apps/web/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Workspace Configuration

**pnpm-workspace.yaml**:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root tsconfig.json**:
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  }
}
```
