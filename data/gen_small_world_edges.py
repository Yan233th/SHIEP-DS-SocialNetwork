#!/usr/bin/env python3
import csv
import random

# =========================
# Config (edit here)
# =========================
OUT_FILE = "small_world_edges.csv"

NODE_COUNT = 200
NAME_PREFIX = "user"

# Small-world (Watts–Strogatz style)
K_NEIGHBORS = 4  # even, 0 < K_NEIGHBORS < NODE_COUNT
REWIRE_PROB = 0.10  # beta in [0, 1]

# Optional: add extra random edges after rewiring to make graph denser
EXTRA_EDGES = 100  # additional undirected edges to add after WS generation (>=0)

WEIGHT_MIN = 1.0
WEIGHT_MAX = 100.0

OUTPUT_BIDIRECTIONAL = True  # True: write both u->v and v->u with same weight
ENSURE_CONNECTED = True  # regenerate until connected
RANDOM_SEED = 114514  # set None for random each time
# =========================


def make_names(n: int, prefix: str):
    return [f"{prefix}{i}" for i in range(n)]


def rand_weight():
    return random.uniform(WEIGHT_MIN, WEIGHT_MAX)


def is_connected(adj):
    n = len(adj)
    seen = set([0])
    stack = [0]
    while stack:
        u = stack.pop()
        for v in adj[u]:
            if v not in seen:
                seen.add(v)
                stack.append(v)
    return len(seen) == n


def ws_small_world_adj(n: int, k: int, beta: float):
    if k <= 0 or k >= n or (k % 2 != 0):
        raise ValueError("K_NEIGHBORS must be even and 0 < K_NEIGHBORS < NODE_COUNT")
    if not (0.0 <= beta <= 1.0):
        raise ValueError("REWIRE_PROB must be in [0, 1]")

    adj = [set() for _ in range(n)]
    half = k // 2

    # 1) Ring lattice
    for i in range(n):
        for d in range(1, half + 1):
            j = (i + d) % n
            adj[i].add(j)
            adj[j].add(i)

    # 2) Rewire edges (each original edge once: i -> (i+d))
    for i in range(n):
        for d in range(1, half + 1):
            j = (i + d) % n
            # Only consider the edge once (i < j in ring sense)
            if random.random() < beta:
                # Remove i-j
                if j in adj[i]:
                    adj[i].remove(j)
                if i in adj[j]:
                    adj[j].remove(i)

                # Pick new target t (avoid self-loop and duplicate)
                t = random.randrange(n)
                while t == i or t in adj[i]:
                    t = random.randrange(n)

                adj[i].add(t)
                adj[t].add(i)

    return adj


def add_extra_edges(adj, extra: int):
    n = len(adj)
    added = 0
    while added < extra:
        u = random.randrange(n)
        v = random.randrange(n)
        if u == v:
            continue
        if v in adj[u]:
            continue
        adj[u].add(v)
        adj[v].add(u)
        added += 1


def adj_to_edge_list(adj, names):
    edges = []
    n = len(adj)
    for u in range(n):
        for v in adj[u]:
            if u < v:
                edges.append((names[u], names[v], rand_weight()))
    return edges


def main():
    if RANDOM_SEED is not None:
        random.seed(RANDOM_SEED)

    names = make_names(NODE_COUNT, NAME_PREFIX)

    while True:
        adj = ws_small_world_adj(NODE_COUNT, K_NEIGHBORS, REWIRE_PROB)
        if EXTRA_EDGES > 0:
            add_extra_edges(adj, EXTRA_EDGES)
        if not ENSURE_CONNECTED or is_connected(adj):
            break

    edges = adj_to_edge_list(adj, names)

    with open(OUT_FILE, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["source", "target", "value"])
        for u, v, weight in edges:
            w.writerow([u, v, f"{weight:.6f}"])
            if OUTPUT_BIDIRECTIONAL:
                w.writerow([v, u, f"{weight:.6f}"])

    undirected_m = len(edges)
    lines = undirected_m * (2 if OUTPUT_BIDIRECTIONAL else 1)
    avg_degree = (2 * undirected_m) / NODE_COUNT

    print(f"Generated: {OUT_FILE}")
    print(f"Nodes: {NODE_COUNT}")
    print(f"Undirected edges: {undirected_m} (avg degree ~ {avg_degree:.2f})")
    print(f"CSV lines (without header): {lines}")
    print(f"WS params: K={K_NEIGHBORS}, beta={REWIRE_PROB}, extra_edges={EXTRA_EDGES}")
    print(f"Connected: {is_connected(adj)}")


if __name__ == "__main__":
    main()
