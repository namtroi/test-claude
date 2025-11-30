import type { DependencyNode } from '@repo-viz/shared';

export class MermaidService {
  generateMermaid(graph: DependencyNode[]): string {
    const lines: string[] = ['graph LR'];

    const nodeLabels = new Map<string, string>();
    graph.forEach((node, index) => {
      const nodeId = `N${index}`;
      const label = this.getNodeLabel(node.path);
      nodeLabels.set(node.path, nodeId);
      lines.push(`  ${nodeId}["${label}"]`);
    });

    graph.forEach((node) => {
      const sourceId = nodeLabels.get(node.path);
      if (!sourceId) return;

      node.dependencies.forEach((dep) => {
        const targetId = nodeLabels.get(dep);
        if (targetId) {
          lines.push(`  ${sourceId} --> ${targetId}`);
        }
      });
    });

    if (graph.length === 0) {
      lines.push('  empty["No files analyzed"]');
    }

    return lines.join('\n');
  }

  private getNodeLabel(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }
}
