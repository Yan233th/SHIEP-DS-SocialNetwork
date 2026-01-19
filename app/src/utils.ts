export function makeEdgeId(a: string, b: string): string {
    return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function pathToEdgeIds(path: string[]): string[] {
    return path.slice(0, -1).map((node, i) => makeEdgeId(node, path[i + 1]));
}
