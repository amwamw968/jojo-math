/** Directed "learn this first" edges. These are not the undirected `related` links. */

export function prerequisiteCycle(edges: Map<string, readonly string[]>): string[] | null {
  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];

  function visit(id: string): string[] | null {
    const state = color.get(id) ?? 0;
    if (state === 1) {
      const start = stack.indexOf(id);
      return [...stack.slice(start), id];
    }
    if (state === 2) return null;
    color.set(id, 1);
    stack.push(id);
    for (const next of edges.get(id) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    stack.pop();
    color.set(id, 2);
    return null;
  }

  for (const id of edges.keys()) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return null;
}
