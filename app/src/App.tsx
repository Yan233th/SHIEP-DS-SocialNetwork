import { useState, useMemo, useRef, ReactNode, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { GraphCanvas, darkTheme, GraphCanvasRef } from "reagraph";
import { commands, Node, Edge, PathResult, NearbyPerson, AnalysisResult, CircleMember, PersonInfo } from "./bindings";
import { makeEdgeId, pathToEdgeIds } from "./utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, FileText, Search, Activity, Users, Info } from "lucide-react";

// --- 工具函数 ---
function unwrap<T>(r: { status: "ok"; data: T } | { status: "error"; error: string }): T {
  if (r.status === "ok") return r.data;
  throw new Error(r.error);
}

// --- 复用组件 ---
interface FeatureCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}
function FeatureCard({ title, icon, children }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

// --- 主应用 ---
export default function App() {
  const graphRef = useRef<GraphCanvasRef | null>(null);

  // 数据源
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [status, setStatus] = useState("请先加载数据");

  // 统一高亮状态 (核心改动)
  const [highlight, setHighlight] = useState<{ nodes: string[], edges: string[] }>({ nodes: [], edges: [] });

  // 各功能输入/结果状态
  const [path, setPath] = useState<{ start: string, end: string, result: PathResult | null }>({ start: "", end: "", result: null });
  const [nearby, setNearby] = useState<{ target: string, radius: string, result: NearbyPerson[] | null }>({ target: "", radius: "30", result: null });
  const [reach, setReach] = useState<{ target: string, hops: string, result: string[] | null }>({ target: "", hops: "2", result: null });
  const [circle, setCircle] = useState<{ target: string, result: CircleMember[] | null }>({ target: "", result: null });
  const [info, setInfo] = useState<{ target: string, result: PersonInfo | null }>({ target: "", result: null });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // --- Graph Data Prep ---
  const graphNodes = useMemo(() => nodes.map(n => ({
    id: n.name,
    label: n.name,
    size: 25,
    fill: "#818cf8"
  })), [nodes]);

  const graphEdges = useMemo(() => edges.map(e => ({
    id: makeEdgeId(e.source, e.target),
    source: e.source,
    target: e.target,
    size: 2, // 平时细一点
    label: e.weight.toFixed(1)
  })), [edges]);

  // --- Handlers ---

  // 1. 加载
  async function handleLoad() {
    try {
      const file = await open({ filters: [{ name: "CSV", extensions: ["csv"] }] });
      if (!file) return;

      setStatus("数据加载中...");
      // 清空所有状态
      setNodes([]); setEdges([]); setHighlight({ nodes: [], edges: [] });
      setPath(p => ({ ...p, result: null }));
      setAnalysis(null);

      unwrap(await commands.loadCsv(file));
      const data = unwrap(await commands.getGraphData());

      setNodes(data.nodes);
      setEdges(data.edges);
      setStatus(`已加载: ${data.nodes.length} 人 / ${data.edges.length} 关系`);
    } catch (e) {
      setStatus(`错误: ${e}`);
    }
  }

  // 2. 复原
  function handleReset() {
    setHighlight({ nodes: [], edges: [] });
    graphRef.current?.centerGraph();
  }

  // 3. 最短路径 (高亮路径和点)
  async function runFindPath() {
    try {
      const res = unwrap(await commands.getShortestPath(path.start, path.end));
      setPath(p => ({ ...p, result: res }));

      // 设置高亮
      setHighlight({
        nodes: res.path,
        edges: pathToEdgeIds(res.path)
      });
    } catch (e) {
      setStatus(`路径查找失败: ${e}`);
    }
  }

  // 4. 附近的人 (高亮中心点 + 结果点)
  async function runNearby() {
    try {
      const res = unwrap(await commands.getNearby(nearby.target, parseFloat(nearby.radius)));
      setNearby(p => ({ ...p, result: res }));

      setHighlight({
        nodes: [nearby.target, ...res.map(p => p.name)],
        edges: [] // 几何距离不代表有边，不亮边
      });
    } catch (e) {
      setStatus(`附近查找失败: ${e}`);
    }
  }

  // 5. N跳可达 (高亮中心点 + 结果点)
  async function runReachable() {
    try {
      const res = unwrap(await commands.getReachable(reach.target, parseInt(reach.hops)));
      setReach(p => ({ ...p, result: res }));

      setHighlight({
        nodes: [reach.target, ...res],
        edges: [] // 树状结构边太多，只亮人
      });
    } catch (e) {
      setStatus(`可达查找失败: ${e}`);
    }
  }

  // 6. 社交圈 (高亮中心点 + 朋友 + 连接边)
  async function runCircle() {
    try {
      const res = unwrap(await commands.getCircle(circle.target));
      setCircle(p => ({ ...p, result: res }));

      setHighlight({
        nodes: [circle.target, ...res.map(m => m.name)],
        edges: res.map(m => makeEdgeId(circle.target, m.name)) // 计算连接边
      });
    } catch (e) {
      setStatus(`圈子查找失败: ${e}`);
    }
  }

  // 7. 个人信息 (只高亮该用户)
  async function runInfo() {
    try {
      const res = unwrap(await commands.getInfo(info.target));
      setInfo(p => ({ ...p, result: res }));

      setHighlight({
        nodes: [info.target],
        edges: []
      });
    } catch (e) {
      setStatus(`信息获取失败: ${e}`);
    }
  }

  // 8. 分析 (获取数据 + 默认高亮核心)
  async function runAnalyze() {
    try {
      const res = unwrap(await commands.analyze());
      setAnalysis(res);
      // 默认高亮核心
      setHighlight({
        nodes: res.core.map(p => p.name),
        edges: []
      });
    } catch (e) {
      setStatus(`分析失败: ${e}`);
    }
  }

  // 9. 分析面板切换 Tab 时切换高亮
  function handleAnalyzeTabChange(value: string) {
    if (!analysis) return;
    const category = value as "core" | "active" | "edge";
    const people = analysis[category];
    setHighlight({
      nodes: people.map(p => p.name),
      edges: []
    });
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground font-sans">
      {/* 左侧图表 */}
      <div className="flex-1 h-full relative overflow-hidden bg-zinc-950">
        <div className="absolute top-4 left-4 z-10">
          <Button variant="secondary" size="icon" onClick={handleReset} title="复原视图">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {graphNodes.length > 0 ? (
          <GraphCanvas
            ref={graphRef}
            nodes={graphNodes}
            edges={graphEdges}
            selections={highlight.nodes}
            actives={highlight.edges}
            layoutType="forceDirected2d"
            layoutOverrides={{ nodeStrength: -300, linkDistance: 120 }}
            labelType="all"
            draggable={true}
            theme={{
              ...darkTheme,
              canvas: { background: "#09090b" },
              node: {
                ...darkTheme.node,
                fill: "#818cf8",
                activeFill: "#4ade80", // 高亮变绿
                opacity: 0.8, // 没选中的稍微淡一点
                selectedOpacity: 1,
                inactiveOpacity: 0.3, // 没选中的变暗，突出高亮
                label: { color: "#ffffff", stroke: "#000000", activeColor: "#ffffff" }
              },
              edge: {
                ...darkTheme.edge,
                fill: "#52525b",
                activeFill: "#4ade80",
                opacity: 0.6,
                selectedOpacity: 1,
                inactiveOpacity: 0.1, // 没选中的边几乎隐形
                label: { color: "#cbd5e1", stroke: "#09090b", activeColor: "#ffffff" }
              },
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Search className="w-10 h-10 opacity-20" />
            <p>请在右侧面板加载 CSV 数据</p>
          </div>
        )}
      </div>

      {/* 右侧控制面板 */}
      <div className="w-80 min-w-[20rem] max-w-[20rem] h-full border-l border-border bg-card flex flex-col z-10 shadow-xl">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">

            <FeatureCard title="数据源" icon={<FileText className="w-4 h-4" />}>
              <Button onClick={handleLoad} variant="secondary" className="w-full">加载 CSV 文件</Button>
              <div className="text-xs text-muted-foreground break-words p-2 bg-muted/50 rounded">{status}</div>
            </FeatureCard>

            <FeatureCard title="最短路径" icon={<Search className="w-4 h-4" />}>
              <div className="flex gap-2">
                <Input placeholder="起点" value={path.start} onChange={e => setPath(p => ({ ...p, start: e.target.value }))} className="h-8 text-sm" />
                <Input placeholder="终点" value={path.end} onChange={e => setPath(p => ({ ...p, end: e.target.value }))} className="h-8 text-sm" />
              </div>
              <Button onClick={runFindPath} size="sm" className="w-full">查找</Button>
            </FeatureCard>

            <FeatureCard title="社交查询" icon={<Info className="w-4 h-4" />}>
              <Tabs defaultValue="circle" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="circle" className="text-xs">社交圈</TabsTrigger>
                  <TabsTrigger value="info" className="text-xs">个人信息</TabsTrigger>
                </TabsList>

                <TabsContent value="circle" className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input placeholder="用户名" value={circle.target} onChange={e => setCircle(p => ({ ...p, target: e.target.value }))} className="h-8 text-sm" />
                    <Button onClick={runCircle} size="sm" variant="outline">查询</Button>
                  </div>
                </TabsContent>

                <TabsContent value="info" className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input placeholder="用户名" value={info.target} onChange={e => setInfo(p => ({ ...p, target: e.target.value }))} className="h-8 text-sm" />
                    <Button onClick={runInfo} size="sm" variant="outline">查询</Button>
                  </div>
                  {info.result && (
                    <div className="text-xs space-y-1 bg-muted p-2 rounded">
                      <div className="flex justify-between"><span>索引:</span> <span>{info.result.index}</span></div>
                      <div className="flex justify-between"><span>坐标:</span> <span>({info.result.loc.x.toFixed(1)}, {info.result.loc.y.toFixed(1)})</span></div>
                      <div className="flex justify-between font-bold"><span>连接数:</span> <span>{info.result.connections}</span></div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </FeatureCard>

            <FeatureCard title="范围搜索" icon={<Users className="w-4 h-4" />}>
              <Tabs defaultValue="nearby" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="nearby" className="text-xs">附近的人</TabsTrigger>
                  <TabsTrigger value="reach" className="text-xs">N跳可达</TabsTrigger>
                </TabsList>

                <TabsContent value="nearby" className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input placeholder="用户" value={nearby.target} onChange={e => setNearby(p => ({ ...p, target: e.target.value }))} className="h-8 text-sm" />
                    <Input placeholder="半径" type="number" value={nearby.radius} onChange={e => setNearby(p => ({ ...p, radius: e.target.value }))} className="h-8 text-sm w-16" />
                  </div>
                  <Button onClick={runNearby} size="sm" className="w-full h-8">搜索</Button>
                </TabsContent>

                <TabsContent value="reach" className="space-y-2 mt-2">
                  <div className="flex gap-2">
                    <Input placeholder="用户" value={reach.target} onChange={e => setReach(p => ({ ...p, target: e.target.value }))} className="h-8 text-sm" />
                    <Input placeholder="跳数" type="number" value={reach.hops} onChange={e => setReach(p => ({ ...p, hops: e.target.value }))} className="h-8 text-sm w-16" />
                  </div>
                  <Button onClick={runReachable} size="sm" className="w-full h-8">搜索</Button>
                </TabsContent>
              </Tabs>
            </FeatureCard>

            <FeatureCard title="网络分析" icon={<Activity className="w-4 h-4" />}>
              <Button onClick={runAnalyze} variant="outline" className="w-full mb-2 h-8">执行全网分析</Button>
              {analysis && (
                <Tabs defaultValue="core" className="w-full" onValueChange={handleAnalyzeTabChange}>
                  <TabsList className="grid w-full grid-cols-3 h-7">
                    <TabsTrigger value="core" className="text-[10px]">核心</TabsTrigger>
                    <TabsTrigger value="active" className="text-[10px]">活跃</TabsTrigger>
                    <TabsTrigger value="edge" className="text-[10px]">边缘</TabsTrigger>
                  </TabsList>
                  {["core", "active", "edge"].map((key) => (
                    <TabsContent key={key} value={key}>
                      <ScrollArea className="h-40 rounded border p-2 bg-muted/20">
                        {/* @ts-ignore */}
                        {analysis[key].slice(0, 50).map((p, i) => (
                          <div key={p.name} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-4">{i + 1}</span>
                              <Badge variant="outline" className="h-5 px-1 font-normal">{p.name}</Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              度:{p.degree}
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </FeatureCard>

          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
