import { useMemo, useRef, useEffect } from "react";
import { GraphCanvas, darkTheme, type GraphCanvasRef } from "reagraph";
import { RotateCcw } from "lucide-react";

import type { Node, Edge } from "@/bindings";
import type { Highlight } from "@/utils/highlight";
import { makeEdgeId } from "@/utils/graphIds";
import { Button } from "@/components/ui/button";

type Props = {
  nodes: Node[];
  edges: Edge[];
  highlight: Highlight;
  onReset: () => void;
  onNodePick: (name: string) => void;
};

export function GraphView({ nodes, edges, highlight, onReset, onNodePick }: Props) {
  const graphRef = useRef<GraphCanvasRef | null>(null);

  const graphNodes = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.name,
        label: n.name,
        size: 25,
      })),
    [nodes]
  );

  const graphEdges = useMemo(
    () =>
      edges.map((e) => ({
        id: makeEdgeId(e.source, e.target),
        source: e.source,
        target: e.target,
        size: 2,
        label: e.weight.toFixed(1),
      })),
    [edges]
  );

  useEffect(() => {
    if (highlight.nodes.length === 0) return;
    graphRef.current?.fitNodesInView?.(highlight.nodes);
  }, [highlight.nodes]);

  const resetAll = () => {
    onReset();
    graphRef.current?.fitNodesInView?.();
  };

  return (
    <div className="flex-1 h-full relative overflow-hidden bg-zinc-950">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="secondary" size="icon" onClick={resetAll} title="Reset view">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {graphNodes.length > 0 ? (
        <GraphCanvas
          // animated={false}
          ref={graphRef}
          nodes={graphNodes}
          edges={graphEdges}
          selections={highlight.nodes}
          actives={highlight.edges}
          layoutType="forceDirected2d"
          layoutOverrides={{ nodeStrength: -300, linkDistance: 120 }}
          labelType="all"
          draggable
          theme={{
            ...darkTheme,
            canvas: { background: "#09090b" },
            node: {
              ...darkTheme.node,
              fill: "#818cf8",
              activeFill: "#4ade80",
              opacity: 0.8,
              selectedOpacity: 1,
              inactiveOpacity: 0.3,
              label: { color: "#ffffff", stroke: "#000000", activeColor: "#ffffff" },
            },
            edge: {
              ...darkTheme.edge,
              fill: "#52525b",
              activeFill: "#4ade80",
              opacity: 0.6,
              selectedOpacity: 1,
              inactiveOpacity: 0.1,
              label: { color: "#cbd5e1", stroke: "#09090b", activeColor: "#ffffff" },
            },
          }}
          onNodeClick={(n: any) => onNodePick(String(n.id))}
        />
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Load a CSV to show the graph
        </div>
      )}
    </div>
  );
}
