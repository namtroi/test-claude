# Implementation Guide

## Overview

Technical decisions, architectural patterns, development workflow for repository visualization tool. Covers AST parsing, component architecture, state management, file upload, testing.

## AST Parser Choice

### Decision Matrix

| Parser | Pros | Cons | Use Case |
|--------|------|------|----------|
| **ts-morph** | Full TS support, accurate, official API | Larger bundle, slower | Strict TS projects ✓ |
| Babel | Lightweight, JSX expert, CommonJS | Less TS metadata | JS-heavy codebases |
| SWC | Fast (Rust-based), modern | Less mature ecosystem | Future consideration |

**Chosen**: **ts-morph** (TypeScript Compiler API wrapper)

**Rationale**:
- Project uses strict TypeScript
- Accurate export/import tracking
- Single parser for all file types (.ts, .tsx, .js, .jsx)

### Implementation Pattern

**apps/api/src/services/parser.service.ts**:
```typescript
import { Project, SyntaxKind } from 'ts-morph';

export const parseFile = (path: string, content: string) => {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(path, content);

  const exports = sourceFile.getExportedDeclarations();
  const imports = sourceFile.getImportDeclarations();

  return {
    exports: Array.from(exports.keys()),
    imports: imports.map(imp => ({
      source: imp.getModuleSpecifierValue(),
      specifiers: imp.getNamedImports().map(n => n.getName())
    }))
  };
};

export const parseProject = (files: FileInput[]) => {
  const parsedFiles = files.map(f => ({
    path: f.path,
    ...parseFile(f.path, f.content)
  }));

  const dependencies = buildDependencyGraph(parsedFiles);

  return { files: parsedFiles, dependencies };
};
```

## Frontend Component Breakdown

### Component Hierarchy

```
<App>
  ├── <Navbar />
  ├── <main>
  │   ├── <UploadSection />
  │   ├── <LoadingOverlay />
  │   └── <ViewerSection>
  │       ├── <DiagramPanel />
  │       └── <DriftPanel />
  │
  └── Stores: appStore, uiStore
```

### Component Details

**UploadSection** (`components/Upload.tsx`):
- File System Access API or `<input type="file" multiple />`
- Validates: .ts, .tsx, .js, .jsx only
- Reads file content (text)
- Calls `useAnalyze()` hook on submit
- Disabled during loading

**DiagramPanel** (`components/Diagram.tsx`):
- Receives Mermaid syntax from `appStore`
- Wraps `mermaid.render()` or `<Mermaid />` component
- Handles render errors gracefully
- Optional: zoom, export SVG

**DriftPanel** (`components/Drift.tsx`):
- Shows added (green), removed (red), modified (orange) files
- Renders lists from drift response
- Visible only if previous snapshot exists

**LoadingOverlay** (`components/shared/Spinner.tsx`):
- Blocks UI during requests
- Shows timeout warning after 20s

## State Management (Zustand)

### Store Architecture

**appStore** (`stores/appStore.ts`):
```typescript
import { create } from 'zustand';

interface AppState {
  currentAnalysis: AnalyzeResponse | null;
  previousSnapshot: ArchitectureJSON | null;
  driftResult: DriftResponse | null;

  setAnalysis: (response: AnalyzeResponse) => void;
  setPreviousSnapshot: (json: ArchitectureJSON) => void;
  setDrift: (response: DriftResponse) => void;
  clearAnalysis: () => void;
  exportSnapshot: () => void;
}

export const appStore = create<AppState>((set, get) => ({
  currentAnalysis: null,
  previousSnapshot: null,
  driftResult: null,

  setAnalysis: (response) => set({ currentAnalysis: response }),
  setPreviousSnapshot: (json) => set({ previousSnapshot: json }),
  setDrift: (response) => set({ driftResult: response }),
  clearAnalysis: () => set({
    currentAnalysis: null,
    driftResult: null
  }),
  exportSnapshot: () => {
    const analysis = get().currentAnalysis;
    if (!analysis) return;

    const blob = new Blob(
      [JSON.stringify(analysis.data.architecture, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}));
```

**uiStore** (`stores/uiStore.ts`):
```typescript
interface UIState {
  isLoading: boolean;
  error: string | null;
  activeTab: 'diagram' | 'drift';

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'diagram' | 'drift') => void;
  clearError: () => void;
}

export const uiStore = create<UIState>((set) => ({
  isLoading: false,
  error: null,
  activeTab: 'diagram',

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  clearError: () => set({ error: null })
}));
```

### Hook Integration

**hooks/useAnalyze.ts**:
```typescript
export const useAnalyze = () => {
  const setAnalysis = appStore(s => s.setAnalysis);
  const setLoading = uiStore(s => s.setLoading);
  const setError = uiStore(s => s.setError);

  return async (files: FileData[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.analyze(files);
      setAnalysis(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };
};
```

**Pattern**: Store is source of truth. Components read via selectors, dispatch actions.

## File Upload Strategy

### Approach

**Primary**: File System Access API (modern browsers)
**Fallback**: `<input type="file" multiple />` (universal)

### File System Access API

**Pros**:
- Folder picker (preserves structure)
- Recursive read
- Better UX

**Cons**:
- Not supported in all browsers (Safari, Firefox partial)
- Requires user permission

### Implementation

**utils/file-handler.ts**:
```typescript
export const selectFolder = async (): Promise<FileData[]> => {
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      return await readDirRecursive(dirHandle);
    } catch (e) {
      if (e.name === 'AbortError') return [];
      throw e;
    }
  } else {
    // Fallback: manual file selection
    return await selectFilesManually();
  }
};

const readDirRecursive = async (
  dirHandle: FileSystemDirectoryHandle,
  basePath = ''
): Promise<FileData[]> => {
  const files: FileData[] = [];

  for await (const entry of dirHandle.values()) {
    const path = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.kind === 'file' && isSourceFile(entry.name)) {
      const file = await entry.getFile();
      files.push({
        path,
        content: await file.text(),
        language: detectLanguage(entry.name)
      });
    } else if (entry.kind === 'directory') {
      files.push(...await readDirRecursive(entry, path));
    }
  }

  return files;
};

const isSourceFile = (name: string) =>
  /\.(ts|tsx|js|jsx)$/.test(name);

const detectLanguage = (name: string) => {
  if (name.endsWith('.tsx')) return 'tsx';
  if (name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.jsx')) return 'jsx';
  return 'javascript';
};
```

**Fallback**:
```typescript
const selectFilesManually = (): Promise<FileData[]> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.ts,.tsx,.js,.jsx';

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const fileData = await Promise.all(
        files.map(async (file) => ({
          path: file.name,
          content: await file.text(),
          language: detectLanguage(file.name)
        }))
      );
      resolve(fileData);
    };

    input.click();
  });
};
```

## API Client

### Pattern

Typed wrapper around fetch. Validates requests/responses via Zod schemas from `@shared`.

**utils/api-client.ts**:
```typescript
import {
  AnalyzeRequestSchema,
  AnalyzeResponseSchema,
  DriftRequestSchema,
  DriftResponseSchema
} from '@shared';

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  async analyze(files: FileData[]): Promise<AnalyzeResponse> {
    const payload = AnalyzeRequestSchema.parse({ files });

    const response = await fetch(`${this.baseURL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return AnalyzeResponseSchema.parse(await response.json());
  }

  async drift(
    current: ArchitectureJSON,
    previous: ArchitectureJSON
  ): Promise<DriftResponse> {
    const payload = DriftRequestSchema.parse({ current, previous });

    const response = await fetch(`${this.baseURL}/drift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return DriftResponseSchema.parse(await response.json());
  }
}

export const apiClient = new APIClient();
```

## Development Workflow

### Setup

```bash
pnpm install              # Bootstrap monorepo
pnpm dev                  # Start all workspaces (parallel)
```

**Individual workspaces**:
```bash
pnpm api                  # Terminal 1: API on :3001
pnpm web                  # Terminal 2: Web on :3000
```

### Dev Server Configuration

**API** (`apps/api/package.json`):
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts"
  }
}
```
- Auto-restarts on file changes
- Port: 3001 (via `PORT` env var)

**Web** (`apps/web/package.json`):
```json
{
  "scripts": {
    "dev": "next dev"
  }
}
```
- Hot reload enabled
- Port: 3000

### Hot Reload Behavior

- **API**: Server restart required
- **Web**: Live reload (Fast Refresh)

### Build for Production

```bash
pnpm build                # All workspaces
pnpm --filter @api start  # Run built API
pnpm --filter @web start  # Run built Web
```

### Environment Variables

**apps/api/.env.local**:
```env
PORT=3001
LOG_LEVEL=debug
NODE_ENV=development
```

**apps/web/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Testing Strategy

### Framework

**Vitest** (fast, TypeScript-native, Vite-based)

**Installation**:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

### Test Structure

```
apps/api/src/__tests__/
  ├── services/
  │   ├── parser.test.ts
  │   └── drift.test.ts
  └── routes/
      └── analyze.test.ts

apps/web/src/__tests__/
  └── components/
      └── Upload.test.tsx
```

### Unit Tests

**Parser service** (`apps/api/src/__tests__/services/parser.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { parseFile } from '../../services/parser.service';

describe('parseFile', () => {
  it('extracts exports from TypeScript file', () => {
    const result = parseFile(
      'test.ts',
      'export const foo = "bar";'
    );

    expect(result.exports).toContain('foo');
  });

  it('extracts imports from TypeScript file', () => {
    const result = parseFile(
      'test.ts',
      'import { bar } from "./utils";'
    );

    expect(result.imports).toHaveLength(1);
    expect(result.imports[0].source).toBe('./utils');
    expect(result.imports[0].specifiers).toContain('bar');
  });
});
```

**Drift service**:
- Test comparison logic (added, removed, modified)
- Edge cases (empty snapshots, identical snapshots)

**Zod schemas**:
- Validate parsing + serialization
- Test invalid inputs

### E2E Tests (Optional)

**Playwright**: Full flow (upload → analyze → drift)

**Coverage Target**: 70%+ for critical paths

### Run Tests

```bash
pnpm test                 # All workspaces
pnpm --filter @api test   # API only
pnpm --filter @web test   # Web only
```

## Error Handling

### API Layer

**middleware/error-handler.ts**:
```typescript
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (error instanceof ZodError) {
    return reply.status(422).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.errors.map(e => ({
          path: e.path,
          message: e.message
        }))
      }
    });
  }

  request.log.error(error);

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message
    }
  });
};
```

### Frontend Layer

**User feedback**:
- Toast/modal with error message
- Retry button on network errors
- 30s timeout warning

**utils/api-client.ts** (enhanced):
```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(30000) // 30s timeout
});
```

## Performance Considerations

### API

- **File size limit**: 10MB total (enforced via Fastify body limit)
- **Parser**: Use in-memory file system (ts-morph)
- **Timeout**: 30s per request

### Frontend

- **Mermaid**: Lazy load for large graphs (1000+ nodes)
  ```typescript
  const { default: mermaid } = await import('mermaid');
  ```
- **State**: Use Zustand selectors to avoid re-renders
  ```typescript
  const analysis = appStore(s => s.currentAnalysis); // Subscribed only
  ```
- **File reading**: Stream large folders incrementally

## Browser Support

### Desktop

- Chrome/Edge: Full support (File System Access API)
- Firefox: Partial (fallback to file input)
- Safari: Partial (fallback to file input)

### Mobile

- Limited file access (no directory picker)
- Use file input fallback
- Secondary experience

**Recommendation**: Desktop-first, mobile as fallback.

## Snapshot Storage

**Approach**: File download (user manages JSON)

**Export**:
```typescript
const exportSnapshot = () => {
  const blob = new Blob(
    [JSON.stringify(architecture, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `architecture-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Import**:
```typescript
const importSnapshot = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const text = await file.text();
    const json = JSON.parse(text);
    setPreviousSnapshot(CanonicalArchitectureSchema.parse(json));
  };

  input.click();
};
```

## CI/CD (GitHub Actions)

**Workflow** (`.github/workflows/test.yml`):
```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
```

**Triggers**:
- Push to `main`
- Pull requests to `main`
