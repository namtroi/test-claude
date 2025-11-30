import type {
  AnalyzeResponse,
  DriftResponse,
  FileChange,
} from '@repo-viz/shared';

export class DriftService {
  detectDrift(current: AnalyzeResponse, previous: AnalyzeResponse): DriftResponse {
    const currentPaths = new Set(current.graph.map((n) => n.path));
    const previousPaths = new Set(previous.graph.map((n) => n.path));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    const changes: FileChange[] = [];

    current.graph.forEach((currentNode) => {
      if (!previousPaths.has(currentNode.path)) {
        added.push(currentNode.path);
        changes.push({
          path: currentNode.path,
          changeType: 'added',
          after: {
            dependencies: currentNode.dependencies,
          },
        });
      }
    });

    previous.graph.forEach((previousNode) => {
      if (!currentPaths.has(previousNode.path)) {
        removed.push(previousNode.path);
        changes.push({
          path: previousNode.path,
          changeType: 'removed',
          before: {
            dependencies: previousNode.dependencies,
          },
        });
      }
    });

    current.graph.forEach((currentNode) => {
      const previousNode = previous.graph.find((n) => n.path === currentNode.path);
      if (previousNode) {
        const hasChanged = this.hasDependenciesChanged(
          currentNode.dependencies,
          previousNode.dependencies
        );

        if (hasChanged) {
          modified.push(currentNode.path);
          changes.push({
            path: currentNode.path,
            changeType: 'modified',
            before: {
              dependencies: previousNode.dependencies,
            },
            after: {
              dependencies: currentNode.dependencies,
            },
          });
        }
      }
    });

    return {
      added,
      removed,
      modified,
      changes,
    };
  }

  private hasDependenciesChanged(current: string[], previous: string[]): boolean {
    if (current.length !== previous.length) return true;

    const currentSet = new Set(current);
    const previousSet = new Set(previous);

    return (
      current.some((dep) => !previousSet.has(dep)) ||
      previous.some((dep) => !currentSet.has(dep))
    );
  }
}
