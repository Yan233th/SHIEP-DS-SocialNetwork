import { makeEdgeId, pathToEdgeIds } from "./graphIds";

export type Highlight = { nodes: string[]; edges: string[] };

export function clearHighlight(): Highlight {
  return { nodes: [], edges: [] };
}

export function highlightOnlyNodes(nodes: string[]): Highlight {
  return { nodes, edges: [] };
}

export function highlightPath(path: string[]): Highlight {
  return { nodes: path, edges: pathToEdgeIds(path) };
}

export function highlightCircle(center: string, members: string[]): Highlight {
  return {
    nodes: [center, ...members],
    edges: members.map((m) => makeEdgeId(center, m)),
  };
}
