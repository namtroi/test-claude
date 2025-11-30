# Action Plan: Repository Visualization Tool Implementation

## Overview

Phased implementation plan for building a developer tool that visualizes local repository structure and detects architectural drift. Based on ARCHITECTURE.md, API_SPECS.md, PROJECT_STRUCTURE.md, and IMPLEMENTATION_GUIDE.md.

**Architecture**: Client-Server model with Next.js frontend, Fastify backend, shared Zod schemas.

---

## Phase 1: Foundation & Monorepo Setup

### Objectives
Establish monorepo structure, shared type system, base configurations.

### Tasks

#### 1.1 Monorepo Initialization
- Initialize pnpm workspace
- Create `pnpm-workspace.yaml` with workspace globs
- Configure root `package.json` with monorepo scripts
- Set up root `tsconfig.json` (strict mode, base config)
- Create `.npmrc` for pnpm settings
- Configure `.gitignore` (build outputs, dependencies, environment files)

#### 1.2 Workspace Structure
- Create workspace directories:
  - `apps/api/` - Backend server
  - `apps/web/` - Frontend client
  - `packages/shared/` - Shared schemas
  - `docs/` - Documentation (existing)

#### 1.3 Shared Schemas Package
- Initialize `packages/shared/` workspace
- Install Zod dependency
- Create schema files:
  - `file.schema.ts` - File input/output schemas
  - `analyze.schema.ts` - Analyze request/response
  - `drift.schema.ts` - Drift request/response
  - `error.schema.ts` - Error response
- Export TypeScript types via `z.infer<>`
- Configure build process (TypeScript compilation)
- Set up package name `@shared` for workspace references

#### 1.4 Verification
- Run `pnpm install` to bootstrap monorepo
- Verify workspace linking
- Test shared package build

**Deliverables**: Functional monorepo with shared schemas package.

---

## Phase 2: API Server Development

### Objectives
Build Fastify REST API with AST parsing, drift detection, Mermaid generation.

### Tasks

#### 2.1 API Project Setup
- Initialize `apps/api/` workspace
- Install dependencies:
  - Runtime: `fastify`, `@fastify/cors`, `zod`, `ts-morph`
  - Dev: `typescript`, `@types/node`, `tsx`
- Reference `@shared` workspace dependency
- Configure `tsconfig.json` (extends root)
- Set up environment variables (`.env.local`: PORT, LOG_LEVEL)

#### 2.2 Fastify Server Initialization
- Create `src/index.ts` entry point
- Initialize Fastify instance
- Configure CORS (development: all origins)
- Set up request body size limit (10MB)
- Configure timeout (30s)
- Add request logging
- Implement graceful shutdown

#### 2.3 Parser Service (ts-morph)
- Create `src/services/parser.service.ts`
- Implement `parseFile()`:
  - Use ts-morph in-memory file system
  - Extract exports (functions, classes, variables)
  - Extract imports (source, specifiers)
  - Handle .ts, .tsx, .js, .jsx files
- Implement `parseProject()`:
  - Parse multiple files
  - Build dependency graph
  - Generate canonical architecture JSON
- Handle parsing errors gracefully

#### 2.4 Mermaid Service
- Create `src/services/mermaid.service.ts`
- Implement `generateMermaid()`:
  - Convert dependency graph to Mermaid syntax
  - Use `graph LR` format (horizontal flow)
  - Generate node labels from file paths
  - Create edges from dependencies
- Handle edge cases (circular dependencies, orphaned files)

#### 2.5 Drift Service
- Create `src/services/drift.service.ts`
- Implement comparison logic:
  - Detect added files (in current, not in previous)
  - Detect removed files (in previous, not in current)
  - Detect modified dependencies
- Generate change details (before/after comparison)

#### 2.6 Route Handlers
- Create `src/routes/analyze.ts`:
  - POST /analyze endpoint
  - Validate request with Zod schema
  - Call parser service
  - Call mermaid service
  - Return response with architecture JSON + Mermaid syntax
- Create `src/routes/drift.ts`:
  - POST /drift endpoint
  - Validate current/previous snapshots
  - Call drift service
  - Return added/removed/modified lists
- Create `src/routes/health.ts`:
  - GET /health endpoint
  - Return status + timestamp
- Register all routes in `src/routes/index.ts`

#### 2.7 Middleware
- Create `src/middleware/validation.ts`:
  - Zod schema validation middleware
  - Extract validation errors
- Create `src/middleware/error-handler.ts`:
  - Global error handler
  - Standardized error responses
  - Handle ZodError (422), generic errors (500)
  - Log errors
- Create `src/middleware/cors.ts`:
  - CORS configuration
  - Environment-based origin whitelist

#### 2.8 Utilities
- Create `src/utils/response.ts` - Response formatters
- Create `src/utils/logger.ts` - Logging utility
- Create `src/utils/errors.ts` - Custom error classes

#### 2.9 Dev & Build Scripts
- Add scripts to `package.json`:
  - `dev`: tsx watch mode
  - `build`: TypeScript compilation
  - `start`: Run compiled output

**Deliverables**: Functional REST API with /analyze, /drift, /health endpoints.

---

## Phase 3: Web Client - Core Infrastructure

### Objectives
Set up Next.js application, state management, API client, file upload.

### Tasks

#### 3.1 Web Project Setup
- Initialize `apps/web/` workspace
- Install dependencies:
  - Runtime: `next`, `react`, `react-dom`, `zustand`, `zod`, `mermaid`
  - Dev: `typescript`, `tailwindcss`, `postcss`, `autoprefixer`
- Reference `@shared` workspace dependency
- Configure `tsconfig.json` (extends root, Next.js paths)
- Set up environment variables (`.env.local`: NEXT_PUBLIC_API_URL)

#### 3.2 Next.js Configuration
- Configure `next.config.js`
- Set up App Router structure (`src/app/`)
- Create root layout (`layout.tsx`):
  - HTML structure
  - Tailwind CSS imports
  - Metadata
- Create home page (`page.tsx`)

#### 3.3 Tailwind CSS Setup
- Configure `tailwind.config.js`:
  - Content paths
  - Theme customization
  - Plugins
- Configure `postcss.config.js`
- Create `globals.css` with Tailwind directives

#### 3.4 State Management (Zustand)
- Create `src/stores/appStore.ts`:
  - State: currentAnalysis, previousSnapshot, driftResult
  - Actions: setAnalysis, setPreviousSnapshot, setDrift, clearAnalysis
  - Action: exportSnapshot (download JSON file)
- Create `src/stores/uiStore.ts`:
  - State: isLoading, error, activeTab
  - Actions: setLoading, setError, setActiveTab, clearError

#### 3.5 API Client
- Create `src/utils/api-client.ts`:
  - Class-based client with base URL
  - Method: `analyze(files)` - POST /analyze
  - Method: `drift(current, previous)` - POST /drift
  - Request validation with Zod schemas
  - Response validation with Zod schemas
  - Error handling (network, validation, server errors)
  - 30s timeout via AbortSignal

#### 3.6 Custom Hooks
- Create `src/hooks/useAnalyze.ts`:
  - Hook for analyzing files
  - Calls API client
  - Updates appStore with results
  - Updates uiStore (loading, errors)
- Create `src/hooks/useDrift.ts`:
  - Hook for drift detection
  - Calls API client
  - Updates appStore with drift results
  - Updates uiStore (loading, errors)
- Create `src/hooks/useFiles.ts`:
  - Hook for file input state
  - File validation
  - File filtering (.ts, .tsx, .js, .jsx)

#### 3.7 File Upload Handler
- Create `src/utils/file-handler.ts`:
  - Primary: File System Access API (`showDirectoryPicker`)
  - Implement recursive directory reading
  - Filter source files only (.ts, .tsx, .js, .jsx)
  - Detect language from file extension
  - Fallback: Standard file input (multiple files)
  - Browser capability detection
  - Error handling (permission denied, abort)

#### 3.8 Dev & Build Scripts
- Add scripts to `package.json`:
  - `dev`: Next.js development server
  - `build`: Next.js production build
  - `start`: Next.js production server

**Deliverables**: Next.js app with state management, API client, file upload capability.

---

## Phase 4: Web Client - UI Components & Visualization

### Objectives
Build user interface components, diagram rendering, drift visualization.

### Tasks

#### 4.1 Shared UI Components
- Create `src/components/shared/Button.tsx`:
  - Tailwind-styled button
  - Variants (primary, secondary, danger)
  - Disabled state
- Create `src/components/shared/Modal.tsx`:
  - Reusable modal wrapper
  - Backdrop click handling
  - ESC key handling
- Create `src/components/shared/Spinner.tsx`:
  - Loading indicator
  - Tailwind animations

#### 4.2 Navigation Component
- Create `src/components/Navbar.tsx`:
  - Header with branding
  - Navigation links
  - Actions (export snapshot, clear)
  - Responsive design

#### 4.3 Upload Component
- Create `src/components/Upload.tsx`:
  - File/folder selection UI
  - Browser capability detection (File System Access API)
  - File count display
  - Validation feedback
  - Submit button (triggers analysis)
  - Disabled during loading
  - Uses `useAnalyze()` hook
  - Uses `useFiles()` hook

#### 4.4 Diagram Component
- Create `src/components/Diagram.tsx`:
  - Mermaid.js integration
  - Render Mermaid syntax from appStore
  - Handle render errors gracefully
  - Loading state
  - Empty state (no data)
  - Optional features:
    - Zoom controls
    - Pan controls
    - Export SVG
    - Fullscreen mode

#### 4.5 Drift Viewer Component
- Create `src/components/DriftViewer.tsx`:
  - Display added files (green highlight)
  - Display removed files (red highlight)
  - Display modified files (orange highlight)
  - Show change details (before/after)
  - Conditional rendering (only if previous snapshot exists)
  - Empty state (no drift detected)

#### 4.6 Loading Overlay
- Integrate loading overlay:
  - Block UI during requests
  - Display spinner
  - Show timeout warning after 20s
  - Cancel button (abort request)

#### 4.7 Page Layout & Integration
- Update `src/app/page.tsx`:
  - Main layout structure
  - Integrate Navbar
  - Section: Upload
  - Section: Viewer (tabs for Diagram/Drift)
  - Loading overlay
  - Error display
  - Responsive grid layout

#### 4.8 Snapshot Management UI
- Add "Export Snapshot" button:
  - Calls appStore.exportSnapshot()
  - Downloads JSON file
- Add "Import Snapshot" button:
  - Opens file picker
  - Validates JSON schema
  - Sets previousSnapshot in appStore
  - Enables drift detection

**Deliverables**: Fully functional UI with diagram visualization and drift detection.

---

## Phase 5: Integration, Error Handling & Testing

### Objectives
End-to-end integration, comprehensive error handling, testing setup.

### Tasks

#### 5.1 Error Handling Refinement
- API: Enhance error responses:
  - Include request IDs for tracing
  - Detailed Zod validation errors
  - User-friendly error messages
- Web: Enhance error display:
  - Toast notifications for errors
  - Retry button for failed requests
  - Detailed error modals
  - Network error detection

#### 5.2 Integration Testing
- Test complete workflow:
  - Upload folder → Analyze → View diagram
  - Export snapshot → Modify code → Analyze → Import snapshot → Detect drift
- Test cross-browser compatibility:
  - Chrome/Edge (File System Access API)
  - Firefox (fallback)
  - Safari (fallback)
- Test error scenarios:
  - Invalid files
  - Parsing errors
  - Network failures
  - Timeout handling

#### 5.3 Unit Testing Setup
- Install Vitest in both workspaces
- API tests:
  - Parser service tests (export/import extraction)
  - Drift service tests (comparison logic)
  - Route handler tests (mock requests)
  - Schema validation tests
- Web tests:
  - Component tests (Upload, Diagram, DriftViewer)
  - Hook tests (useAnalyze, useDrift)
  - Store tests (appStore, uiStore)
  - Utility tests (file-handler, api-client)

#### 5.4 Testing Scripts
- Add test scripts to workspaces:
  - `test`: Run unit tests
  - `test:watch`: Watch mode
  - `test:coverage`: Coverage report
- Add root script:
  - `test`: Run all workspace tests

#### 5.5 CI/CD Pipeline
- Create `.github/workflows/test.yml`:
  - Trigger on push to main
  - Trigger on pull requests
  - Setup Node.js + pnpm
  - Install dependencies
  - Run build
  - Run tests
  - Report coverage

**Deliverables**: Tested, integrated system with CI/CD pipeline.

---

## Phase 6: Polish, Optimization & Documentation

### Objectives
Performance optimization, user experience enhancements, deployment preparation.

### Tasks

#### 6.1 Performance Optimization
- API:
  - Profile large file parsing
  - Optimize dependency graph generation
  - Add request/response compression
  - Implement rate limiting (optional)
- Web:
  - Lazy load Mermaid.js for large graphs
  - Optimize Zustand selectors (prevent unnecessary re-renders)
  - Implement virtual scrolling for large file lists
  - Code splitting for routes

#### 6.2 User Experience Enhancements
- Add keyboard shortcuts:
  - Upload folder
  - Export snapshot
  - Clear analysis
- Add drag-and-drop file upload
- Add progress indicators for long operations
- Add success notifications
- Improve empty states with helpful instructions
- Add tooltips for complex features

#### 6.3 Browser Compatibility Testing
- Test File System Access API fallback:
  - Firefox
  - Safari
  - Mobile browsers
- Test responsive design:
  - Desktop (1920x1080, 1366x768)
  - Tablet (768x1024)
  - Mobile (375x667) - limited support
- Add browser compatibility warnings

#### 6.4 Documentation Updates
- Update README.md:
  - Project overview
  - Installation instructions
  - Development workflow
  - Testing instructions
  - Deployment guide
- Create CONTRIBUTING.md:
  - Code style guidelines
  - Pull request process
  - Testing requirements
- Add inline comments for complex logic
- Generate API documentation (JSDoc)

#### 6.5 Deployment Preparation
- Production environment configuration:
  - API: Configure production PORT, CORS whitelist
  - Web: Configure production API_URL
- Add health check endpoint monitoring
- Add error tracking (optional: Sentry)
- Add analytics (optional)
- Create deployment documentation:
  - Docker setup (optional)
  - VPS deployment
  - Serverless deployment options

#### 6.6 Final QA & Bug Fixes
- Complete testing checklist:
  - All features functional
  - All tests passing
  - No console errors
  - Responsive on all devices
  - Cross-browser compatibility
- Performance audit:
  - Lighthouse score
  - Bundle size analysis
  - API response times
- Security audit:
  - Input validation
  - XSS prevention
  - CORS configuration
  - Dependency vulnerabilities

**Deliverables**: Production-ready application with documentation.

---

## Implementation Order Summary

```
Phase 1: Foundation (1-2 days)
  → Monorepo setup
  → Shared schemas package

Phase 2: API Development (3-4 days)
  → Fastify server
  → Parser service (ts-morph)
  → Endpoints + middleware

Phase 3: Web Core (2-3 days)
  → Next.js setup
  → State management
  → API client + file upload

Phase 4: Web UI (3-4 days)
  → Components
  → Diagram rendering
  → Drift visualization

Phase 5: Integration & Testing (2-3 days)
  → Error handling
  → Unit tests
  → CI/CD

Phase 6: Polish (1-2 days)
  → Performance optimization
  → Documentation
  → Deployment prep
```

**Total Estimated Effort**: 12-18 days

---

## Critical Dependencies

- **Phase 2 depends on Phase 1**: API needs shared schemas
- **Phase 3 depends on Phase 1**: Web needs shared schemas
- **Phase 4 depends on Phase 3**: UI needs state management + API client
- **Phase 5 depends on Phases 2-4**: Integration needs both API and Web
- **Phase 6 depends on Phase 5**: Optimization needs working system

## Success Criteria

- [ ] Monorepo builds successfully (`pnpm build`)
- [ ] API endpoints respond correctly (200, 422, 500)
- [ ] Web client analyzes uploaded files
- [ ] Mermaid diagram renders accurately
- [ ] Drift detection identifies changes
- [ ] Snapshot export/import works
- [ ] Tests pass with 70%+ coverage
- [ ] Works in Chrome, Firefox, Safari
- [ ] Documentation complete
- [ ] CI/CD pipeline green

---

## Notes

- **No code implementation**: This plan focuses on WHAT to build, not HOW
- **Parallel work possible**: Phases 2 and 3 can overlap after Phase 1
- **Testing throughout**: Write tests alongside features, not after
- **Iterative refinement**: Each phase builds on previous work
