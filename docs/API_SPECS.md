# API Specification

## Overview

REST API for repository structure visualization and architectural drift detection. Stateless design, Zod validation at all boundaries.

**Base URL**: `http://localhost:3001` (development)
**Content-Type**: `application/json`
**Authentication**: None (public API)

## Endpoints

### POST /analyze

Parses uploaded files, generates Mermaid diagram syntax and canonical architecture JSON.

**Request**

```typescript
import { z } from 'zod';

const FileInputSchema = z.object({
  path: z.string().describe('Relative file path'),
  content: z.string().describe('File content'),
  language: z.enum(['typescript', 'javascript', 'tsx', 'jsx']).optional()
});

const AnalyzeRequestSchema = z.object({
  files: z.array(FileInputSchema).min(1).describe('Files to analyze')
});

type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
```

**Example Request**

```json
{
  "files": [
    {
      "path": "src/index.ts",
      "content": "import { helper } from './utils';\nexport const main = () => helper();",
      "language": "typescript"
    },
    {
      "path": "src/utils.ts",
      "content": "export const helper = () => 'Hello';"
    }
  ]
}
```

**Response (200)**

```typescript
const CanonicalArchitectureSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    language: z.string(),
    exports: z.array(z.string()),
    imports: z.array(z.object({
      source: z.string(),
      specifiers: z.array(z.string())
    }))
  })),
  dependencies: z.array(z.object({
    source: z.string().describe('Source file path'),
    target: z.string().describe('Target file path'),
    type: z.enum(['import', 'dynamic', 'type']),
    specifiers: z.array(z.string()).optional()
  })),
  metadata: z.object({
    timestamp: z.string().datetime(),
    version: z.string().default('1.0.0'),
    fileCount: z.number()
  })
});

const AnalyzeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    mermaid: z.string().describe('Mermaid.js diagram syntax'),
    architecture: CanonicalArchitectureSchema
  })
});

type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
```

**Example Response**

```json
{
  "success": true,
  "data": {
    "mermaid": "graph LR\n  A[src/index.ts] --> B[src/utils.ts]",
    "architecture": {
      "files": [
        {
          "path": "src/index.ts",
          "language": "typescript",
          "exports": ["main"],
          "imports": [
            {
              "source": "./utils",
              "specifiers": ["helper"]
            }
          ]
        },
        {
          "path": "src/utils.ts",
          "language": "typescript",
          "exports": ["helper"],
          "imports": []
        }
      ],
      "dependencies": [
        {
          "source": "src/index.ts",
          "target": "src/utils.ts",
          "type": "import",
          "specifiers": ["helper"]
        }
      ],
      "metadata": {
        "timestamp": "2025-11-29T10:30:00Z",
        "version": "1.0.0",
        "fileCount": 2
      }
    }
  }
}
```

**Errors**

| Code | Condition | Description |
|------|-----------|-------------|
| 400 | Invalid JSON | Request body malformed |
| 422 | Validation fails | Zod schema validation error |
| 500 | Parsing error | AST parsing failed |

---

### POST /drift

Compares current architecture snapshot against previous snapshot, detects changes.

**Request**

```typescript
const DriftRequestSchema = z.object({
  current: CanonicalArchitectureSchema,
  previous: CanonicalArchitectureSchema
});

type DriftRequest = z.infer<typeof DriftRequestSchema>;
```

**Example Request**

```json
{
  "current": {
    "files": [
      {"path": "src/index.ts", "language": "typescript", "exports": ["main"], "imports": []},
      {"path": "src/new.ts", "language": "typescript", "exports": ["feature"], "imports": []}
    ],
    "dependencies": [],
    "metadata": {"timestamp": "2025-11-29T11:00:00Z", "version": "1.0.0", "fileCount": 2}
  },
  "previous": {
    "files": [
      {"path": "src/index.ts", "language": "typescript", "exports": ["main"], "imports": []}
    ],
    "dependencies": [],
    "metadata": {"timestamp": "2025-11-28T10:00:00Z", "version": "1.0.0", "fileCount": 1}
  }
}
```

**Response (200)**

```typescript
const ChangeSchema = z.object({
  path: z.string(),
  type: z.enum(['added', 'removed', 'modified']),
  details: z.object({
    before: z.any().optional(),
    after: z.any().optional()
  }).optional()
});

const DriftResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    added: z.array(z.string()).describe('New file paths'),
    removed: z.array(z.string()).describe('Deleted file paths'),
    modified: z.array(ChangeSchema).describe('Changed dependencies')
  })
});

type DriftResponse = z.infer<typeof DriftResponseSchema>;
```

**Example Response**

```json
{
  "success": true,
  "data": {
    "added": ["src/new.ts"],
    "removed": [],
    "modified": []
  }
}
```

**Errors**

| Code | Condition | Description |
|------|-----------|-------------|
| 400 | Invalid JSON | Request body malformed |
| 422 | Validation fails | Invalid architecture schema |
| 500 | Comparison error | Drift detection failed |

---

### GET /health

Health check endpoint.

**Response (200)**

```typescript
const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime()
});
```

**Example Response**

```json
{
  "status": "ok",
  "timestamp": "2025-11-29T10:30:00Z"
}
```

---

## Data Schemas

All schemas use Zod for runtime validation. Shared between API and Web client.

### Core Types

```typescript
// File representation
const FileSchema = z.object({
  path: z.string(),
  language: z.string(),
  exports: z.array(z.string()),
  imports: z.array(z.object({
    source: z.string(),
    specifiers: z.array(z.string())
  }))
});

// Dependency relationship
const DependencySchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(['import', 'dynamic', 'type']),
  specifiers: z.array(z.string()).optional()
});

// Metadata
const MetadataSchema = z.object({
  timestamp: z.string().datetime(),
  version: z.string(),
  fileCount: z.number().int().nonnegative()
});

// Canonical Architecture
const CanonicalArchitectureSchema = z.object({
  files: z.array(FileSchema),
  dependencies: z.array(DependencySchema),
  metadata: MetadataSchema
});
```

---

## Error Handling

All errors return standardized format.

**Error Response Schema**

```typescript
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().describe('Error code'),
    message: z.string().describe('Human-readable error'),
    details: z.array(z.object({
      path: z.array(z.string()).describe('Field path'),
      message: z.string().describe('Validation error')
    })).optional().describe('Zod validation errors')
  })
});

type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

**HTTP Status Codes**

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Invalid JSON or malformed request |
| 422 | Unprocessable Entity | Zod validation failed |
| 500 | Internal Server Error | Server-side error (AST parsing, etc.) |

**Example Error Response (Validation)**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": ["files"],
        "message": "Expected array, received string"
      }
    ]
  }
}
```

**Example Error Response (Server)**

```json
{
  "success": false,
  "error": {
    "code": "PARSE_ERROR",
    "message": "Failed to parse TypeScript file: src/index.ts"
  }
}
```

---

## API Configuration

### CORS

- **Development**: All origins (`*`)
- **Production**: Whitelist (configure via environment)

### Request Limits

- **Body Size**: 10MB maximum
- **Timeout**: 30 seconds per request
- **File Count**: No hard limit (10MB constraint applies)

### Headers

**Required**:
- `Content-Type: application/json`

**Optional**:
- `X-Request-ID: <uuid>` - Request tracing

### Timeouts

Long-running operations (large codebases) timeout at 30s. Client should implement retry with exponential backoff.

---

## Examples

### Complete Flow: Analyze → Drift

**Step 1: Initial Analysis**

```bash
POST /analyze
Content-Type: application/json

{
  "files": [
    {
      "path": "src/app.ts",
      "content": "import { config } from './config';\nexport const app = config;",
      "language": "typescript"
    },
    {
      "path": "src/config.ts",
      "content": "export const config = { port: 3000 };"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "mermaid": "graph LR\n  A[src/app.ts] --> B[src/config.ts]",
    "architecture": {
      "files": [...],
      "dependencies": [
        {
          "source": "src/app.ts",
          "target": "src/config.ts",
          "type": "import",
          "specifiers": ["config"]
        }
      ],
      "metadata": {
        "timestamp": "2025-11-29T10:00:00Z",
        "version": "1.0.0",
        "fileCount": 2
      }
    }
  }
}
```

**Step 2: Save Architecture** (client stores `architecture` JSON)

**Step 3: Later Analysis** (user modifies code, adds new file)

```bash
POST /analyze
Content-Type: application/json

{
  "files": [
    {
      "path": "src/app.ts",
      "content": "import { config } from './config';\nimport { logger } from './logger';\nexport const app = config;",
      "language": "typescript"
    },
    {
      "path": "src/config.ts",
      "content": "export const config = { port: 3000 };"
    },
    {
      "path": "src/logger.ts",
      "content": "export const logger = console.log;"
    }
  ]
}
```

**Step 4: Detect Drift**

```bash
POST /drift
Content-Type: application/json

{
  "current": {
    "files": [...],
    "dependencies": [
      {
        "source": "src/app.ts",
        "target": "src/config.ts",
        "type": "import",
        "specifiers": ["config"]
      },
      {
        "source": "src/app.ts",
        "target": "src/logger.ts",
        "type": "import",
        "specifiers": ["logger"]
      }
    ],
    "metadata": {
      "timestamp": "2025-11-29T11:00:00Z",
      "version": "1.0.0",
      "fileCount": 3
    }
  },
  "previous": {
    "files": [...],
    "dependencies": [
      {
        "source": "src/app.ts",
        "target": "src/config.ts",
        "type": "import",
        "specifiers": ["config"]
      }
    ],
    "metadata": {
      "timestamp": "2025-11-29T10:00:00Z",
      "version": "1.0.0",
      "fileCount": 2
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "added": ["src/logger.ts"],
    "removed": [],
    "modified": [
      {
        "path": "src/app.ts",
        "type": "modified",
        "details": {
          "before": {"imports": 1},
          "after": {"imports": 2}
        }
      }
    ]
  }
}
```

---

## Versioning

No API versioning initially. Stateless design allows breaking changes without migration complexity.

Future: Add `/v1` prefix if backward compatibility required.
