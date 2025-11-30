import { Project, Node } from 'ts-morph';
import type {
  FileInput,
  ParsedFile,
  ExportInfo,
  ImportInfo,
  DependencyNode,
} from '@repo-viz/shared';
import { ParseError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class ParserService {
  parseFile(file: FileInput): ParsedFile {
    try {
      const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          target: 99, // ESNext
          module: 99, // ESNext
        },
      });

      const sourceFile = project.createSourceFile(file.path, file.content);

      const exports: ExportInfo[] = [];
      const imports: ImportInfo[] = [];

      // Extract exports
      sourceFile.getExportedDeclarations().forEach((declarations, name) => {
        declarations.forEach((declaration) => {
          if (Node.isFunctionDeclaration(declaration)) {
            exports.push({ name, type: 'function' });
          } else if (Node.isClassDeclaration(declaration)) {
            exports.push({ name, type: 'class' });
          } else if (Node.isVariableDeclaration(declaration)) {
            exports.push({ name, type: 'variable' });
          } else if (Node.isInterfaceDeclaration(declaration)) {
            exports.push({ name, type: 'interface' });
          } else if (Node.isTypeAliasDeclaration(declaration)) {
            exports.push({ name, type: 'type' });
          }
        });
      });

      // Extract imports
      sourceFile.getImportDeclarations().forEach((importDecl) => {
        const source = importDecl.getModuleSpecifierValue();
        const specifiers: string[] = [];

        importDecl.getNamedImports().forEach((namedImport) => {
          specifiers.push(namedImport.getName());
        });

        const defaultImport = importDecl.getDefaultImport();
        if (defaultImport) {
          specifiers.push(defaultImport.getText());
        }

        const namespaceImport = importDecl.getNamespaceImport();
        if (namespaceImport) {
          specifiers.push(`* as ${namespaceImport.getText()}`);
        }

        if (specifiers.length > 0 || importDecl.getModuleSpecifier()) {
          imports.push({ source, specifiers });
        }
      });

      return {
        path: file.path,
        exports,
        imports,
      };
    } catch (error) {
      logger.error('Parse error', { path: file.path, error });
      throw new ParseError(`Failed to parse file: ${file.path}`, error);
    }
  }

  parseProject(files: FileInput[]): {
    files: ParsedFile[];
    graph: DependencyNode[];
  } {
    const parsedFiles = files.map((file) => this.parseFile(file));
    const graph = this.buildDependencyGraph(parsedFiles, files);

    return { files: parsedFiles, graph };
  }

  private buildDependencyGraph(
    parsedFiles: ParsedFile[],
    originalFiles: FileInput[]
  ): DependencyNode[] {
    const fileMap = new Map(originalFiles.map((f) => [f.path, f]));
    const nodes: DependencyNode[] = [];

    parsedFiles.forEach((parsed) => {
      const dependencies: string[] = [];

      parsed.imports.forEach((imp) => {
        const resolvedPath = this.resolveImportPath(imp.source, parsed.path, fileMap);
        if (resolvedPath && fileMap.has(resolvedPath)) {
          dependencies.push(resolvedPath);
        }
      });

      nodes.push({
        id: parsed.path,
        path: parsed.path,
        dependencies: [...new Set(dependencies)],
      });
    });

    return nodes;
  }

  private resolveImportPath(
    importSource: string,
    currentFilePath: string,
    fileMap: Map<string, FileInput>
  ): string | null {
    if (importSource.startsWith('.')) {
      const currentDir = currentFilePath.split('/').slice(0, -1).join('/');
      const resolved = this.normalizePath(`${currentDir}/${importSource}`);

      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

      for (const ext of extensions) {
        const candidate = resolved.endsWith('.ts') || resolved.endsWith('.tsx') ||
                         resolved.endsWith('.js') || resolved.endsWith('.jsx')
          ? resolved
          : resolved + ext;

        if (fileMap.has(candidate)) {
          return candidate;
        }
      }
    }

    return null;
  }

  private normalizePath(path: string): string {
    const parts = path.split('/');
    const normalized: string[] = [];

    parts.forEach((part) => {
      if (part === '..') {
        normalized.pop();
      } else if (part !== '.' && part !== '') {
        normalized.push(part);
      }
    });

    return normalized.join('/');
  }
}
