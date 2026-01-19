import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

import { commands } from "@/bindings";
import type {
  AnalysisResult,
  CircleMember,
  Edge,
  NearbyPerson,
  Node,
  PathResult,
  PersonInfo,
} from "@/bindings";

import { unwrap } from "@/utils/tauriResult";
import {
  clearHighlight,
  highlightCircle,
  highlightOnlyNodes,
  highlightPath,
  type Highlight,
} from "@/utils/highlight";

type AnalysisTab = "core" | "active" | "edge";

export function useSocialGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [status, setStatus] = useState("Please load a CSV file.");

  const [highlight, setHighlight] = useState<Highlight>(clearHighlight());

  // Path
  const [pathStart, setPathStart] = useState("");
  const [pathEnd, setPathEnd] = useState("");
  const [pathResult, setPathResult] = useState<PathResult | null>(null);

  // Nearby
  const [nearbyTarget, setNearbyTarget] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState("30");
  const [nearbyResult, setNearbyResult] = useState<NearbyPerson[] | null>(null);

  // Reachable
  const [reachTarget, setReachTarget] = useState("");
  const [reachHops, setReachHops] = useState("2");
  const [reachResult, setReachResult] = useState<string[] | null>(null);

  // Circle
  const [circleTarget, setCircleTarget] = useState("");
  const [circleResult, setCircleResult] = useState<CircleMember[] | null>(null);

  // Info
  const [infoTarget, setInfoTarget] = useState("");
  const [infoResult, setInfoResult] = useState<PersonInfo | null>(null);

  // Analyze
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>("core");

  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  const clearAllResults = () => {
    setPathResult(null);
    setNearbyResult(null);
    setReachResult(null);
    setCircleResult(null);
    setInfoResult(null);
    setAnalysis(null);
  };

  const loadFromDialog = async () => {
    try {
      const file = await open({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (!file || Array.isArray(file)) return;

      setStatus("Loading...");
      setNodes([]);
      setEdges([]);
      clearAllResults();
      setHighlight(clearHighlight());

      setStatus(unwrap(await commands.loadCsv(file)));
      const data = unwrap(await commands.getGraphData());
      setNodes(data.nodes);
      setEdges(data.edges);
      setStatus(`Loaded: ${data.nodes.length} nodes / ${data.edges.length} edges`);
    } catch (e) {
      setStatus(`Error: ${String(e)}`);
    }
  };

  const reset = () => {
    setHighlight(clearHighlight());
    setPathResult(null);
    setStatus("Reset.");
  };

  const findPath = async () => {
    try {
      if (!pathStart || !pathEnd) return;
      const res = unwrap(await commands.getShortestPath(pathStart, pathEnd));
      setPathResult(res);
      setHighlight(highlightPath(res.path));
      setStatus(`Path: ${res.hops} hops`);
    } catch (e) {
      setPathResult(null);
      setStatus(`Path error: ${String(e)}`);
    }
  };

  const findNearby = async () => {
    try {
      const r = Number(nearbyRadius);
      if (!nearbyTarget || !Number.isFinite(r)) return;
      const res = unwrap(await commands.getNearby(nearbyTarget, r));
      setNearbyResult(res);
      setHighlight(highlightOnlyNodes([nearbyTarget, ...res.map((x) => x.name)]));
      setStatus(`Nearby: ${res.length} results`);
    } catch (e) {
      setNearbyResult(null);
      setStatus(`Nearby error: ${String(e)}`);
    }
  };

  const findReachable = async () => {
    try {
      const h = Number(reachHops);
      if (!reachTarget || !Number.isFinite(h)) return;
      const res = unwrap(await commands.getReachable(reachTarget, h));
      setReachResult(res);
      setHighlight(highlightOnlyNodes([reachTarget, ...res]));
      setStatus(`Reachable: ${res.length} results`);
    } catch (e) {
      setReachResult(null);
      setStatus(`Reachable error: ${String(e)}`);
    }
  };

  const findCircle = async () => {
    try {
      if (!circleTarget) return;
      const res = unwrap(await commands.getCircle(circleTarget));
      setCircleResult(res);
      setHighlight(highlightCircle(circleTarget, res.map((m) => m.name)));
      setStatus(`Circle: ${res.length} neighbors`);
    } catch (e) {
      setCircleResult(null);
      setStatus(`Circle error: ${String(e)}`);
    }
  };

  const findInfo = async () => {
    try {
      if (!infoTarget) return;
      const res = unwrap(await commands.getInfo(infoTarget));
      setInfoResult(res);
      setHighlight(highlightOnlyNodes([infoTarget]));
      setStatus(`Info loaded: ${infoTarget}`);
    } catch (e) {
      setInfoResult(null);
      setStatus(`Info error: ${String(e)}`);
    }
  };

  const runAnalyze = async () => {
    try {
      const res = unwrap(await commands.analyze());
      setAnalysis(res);
      setAnalysisTab("core");
      setHighlight(highlightOnlyNodes(res.core.map((p) => p.name)));
      setStatus("Analysis done.");
    } catch (e) {
      setAnalysis(null);
      setStatus(`Analyze error: ${String(e)}`);
    }
  };

  useEffect(() => {
    if (!analysis) return;
    const list = analysis[analysisTab];
    setHighlight(highlightOnlyNodes(list.map((p) => p.name)));
  }, [analysis, analysisTab]);

  const analysisList = useMemo(() => {
    if (!analysis) return [];
    return analysis[analysisTab];
  }, [analysis, analysisTab]);

  return {
    // data
    nodes,
    edges,
    nodeCount,
    edgeCount,
    status,

    // highlight
    highlight,
    setHighlight,
    reset,

    // actions
    loadFromDialog,
    findPath,
    findNearby,
    findReachable,
    findCircle,
    findInfo,
    runAnalyze,

    // path
    pathStart,
    setPathStart,
    pathEnd,
    setPathEnd,
    pathResult,

    // nearby
    nearbyTarget,
    setNearbyTarget,
    nearbyRadius,
    setNearbyRadius,
    nearbyResult,

    // reachable
    reachTarget,
    setReachTarget,
    reachHops,
    setReachHops,
    reachResult,

    // circle
    circleTarget,
    setCircleTarget,
    circleResult,

    // info
    infoTarget,
    setInfoTarget,
    infoResult,

    // analysis
    analysis,
    analysisTab,
    setAnalysisTab,
    analysisList,
  };
}
