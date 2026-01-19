#!/usr/bin/env python3
import csv
import random
from itertools import combinations

# =========================
# Config (edit here)
# =========================
OUT_FILE = "test_edges.csv"

NODE_COUNT = 30  # number of nodes
EDGE_COUNT = 60  # number of undirected edges (must be >= NODE_COUNT-1 if ENSURE_CONNECTED)
NAME_PREFIX = "user"  # node name prefix: user0, user1, ...

WEIGHT_MIN = 1.0
WEIGHT_MAX = 100.0

OUTPUT_BIDIRECTIONAL = True  # True: write both u->v and v->u
ENSURE_CONNECTED = True  # guarantee connectivity
RANDOM_SEED = 114514  # set None for random each time
# =========================


def make_names(n: int, prefix: str):
    return [f"{prefix}{i}" for i in range(n)]


def edge_key(a: str, b: str):
    return (a, b) if a < b else (b, a)


def rand_weight():
    return random.uniform(WEIGHT_MIN, WEIGHT_MAX)


def gen_edges_connected(names, m: int):
    n = len(names)
    if m < n - 1:
        raise ValueError("EDGE_COUNT must be >= NODE_COUNT-1 when ENSURE_CONNECTED=True")

    edges = set()

    # 1) Spanning tree: ensure connected
    order = names[:]
    random.shuffle(order)
    for i in range(1, n):
        u = order[i]
        v = order[random.randrange(0, i)]
        edges.add(edge_key(u, v))

    # 2) Add remaining edges randomly
    all_pairs = list(combinations(names, 2))
    random.shuffle(all_pairs)
    for u, v in all_pairs:
        if len(edges) >= m:
            break
        k = edge_key(u, v)
        if k not in edges:
            edges.add(k)

    return [(u, v, rand_weight()) for (u, v) in edges]


def gen_edges_random(names, m: int):
    all_pairs = list(combinations(names, 2))
    if m > len(all_pairs):
        raise ValueError(f"EDGE_COUNT too large, max={len(all_pairs)} for NODE_COUNT={len(names)}")

    random.shuffle(all_pairs)
    chosen = all_pairs[:m]
    return [(u, v, rand_weight()) for (u, v) in chosen]


def main():
    if RANDOM_SEED is not None:
        random.seed(RANDOM_SEED)

    names = make_names(NODE_COUNT, NAME_PREFIX)

    if ENSURE_CONNECTED:
        edges = gen_edges_connected(names, EDGE_COUNT)
    else:
        edges = gen_edges_random(names, EDGE_COUNT)

    with open(OUT_FILE, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["source", "target", "value"])
        for u, v, weight in edges:
            w.writerow([u, v, f"{weight:.6f}"])
            if OUTPUT_BIDIRECTIONAL:
                w.writerow([v, u, f"{weight:.6f}"])

    print(f"Generated: {OUT_FILE}")
    print(f"Nodes: {NODE_COUNT}, Edges: {len(edges)}, Connected: {ENSURE_CONNECTED}")
    lines = len(edges) * (2 if OUTPUT_BIDIRECTIONAL else 1)
    print(f"CSV lines (without header): {lines}")


if __name__ == "__main__":
    main()
