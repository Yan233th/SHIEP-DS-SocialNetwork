import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { Activity, FileText, Info, Search, Users } from "lucide-react";
import type { useSocialGraph } from "@/hooks/useSocialGraph";

type Props = ReturnType<typeof useSocialGraph>;

export function ControlPanel(p: Props) {
  const disabled = p.nodeCount === 0;

  return (
    <div className="w-80 min-w-[20rem] max-w-[20rem] h-full border-l border-border bg-card flex flex-col z-10 shadow-xl">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <FeatureCard title="数据源" icon={<FileText className="w-4 h-4" />}>
            <Button onClick={p.loadFromDialog} variant="secondary" className="w-full">
              加载 CSV 文件
            </Button>
            <div className="text-xs text-muted-foreground break-words p-2 bg-muted/50 rounded">
              {p.status}
            </div>
            <div className="text-xs text-muted-foreground">
              节点: {p.nodeCount} / 边: {p.edgeCount}
            </div>
          </FeatureCard>

          <FeatureCard title="查询最短路径" icon={<Search className="w-4 h-4" />}>
            <div className="flex gap-2">
              <Input
                placeholder="start"
                value={p.pathStart}
                onChange={(e) => p.setPathStart(e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="end"
                value={p.pathEnd}
                onChange={(e) => p.setPathEnd(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Button onClick={p.findPath} size="sm" className="w-full" disabled={disabled}>
              运行
            </Button>

            {p.pathResult ? (
              <div className="text-xs bg-muted p-2 rounded break-words">
                <div className="font-medium">跳数: {p.pathResult.hops}</div>
                <div className="opacity-80">{p.pathResult.path.join(" → ")}</div>
              </div>
            ) : null}
          </FeatureCard>

          <FeatureCard title="社交信息" icon={<Info className="w-4 h-4" />}>
            <Tabs value={p.socialTab} onValueChange={(v) => p.setSocialTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="circle" className="text-xs">
                  社交圈
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs">
                  节点信息
                </TabsTrigger>
              </TabsList>

              <TabsContent value="circle" className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="name"
                    value={p.circleTarget}
                    onChange={(e) => p.setCircleTarget(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button onClick={p.findCircle} size="sm" variant="outline" disabled={disabled}>
                    Go
                  </Button>
                </div>
                {p.circleResult ? (
                  <div className="text-xs text-muted-foreground">
                    已高亮: {p.circleResult.length} 邻居
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="info" className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="name"
                    value={p.infoTarget}
                    onChange={(e) => p.setInfoTarget(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button onClick={p.findInfo} size="sm" variant="outline" disabled={disabled}>
                    Go
                  </Button>
                </div>

                {p.infoResult ? (
                  <div className="text-xs space-y-1 bg-muted p-2 rounded">
                    <div className="flex justify-between">
                      <span>索引编号</span>
                      <span>{p.infoResult.index}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>坐标</span>
                      <span>
                        ({p.infoResult.loc.x.toFixed(1)}, {p.infoResult.loc.y.toFixed(1)})
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>连接数</span>
                      <span>{p.infoResult.connections}</span>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </FeatureCard>

          <FeatureCard title="周边信息" icon={<Users className="w-4 h-4" />}>
            <Tabs defaultValue="nearby" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="nearby" className="text-xs">
                  邻近节点
                </TabsTrigger>
                <TabsTrigger value="reach" className="text-xs">
                  N跳可达
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nearby" className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="name"
                    value={p.nearbyTarget}
                    onChange={(e) => p.setNearbyTarget(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="r"
                    type="number"
                    value={p.nearbyRadius}
                    onChange={(e) => p.setNearbyRadius(e.target.value)}
                    className="h-8 text-sm w-16"
                  />
                </div>
                <Button onClick={p.findNearby} size="sm" className="w-full h-8" disabled={disabled}>
                  运行
                </Button>
                {p.nearbyResult ? (
                  <div className="text-xs text-muted-foreground">
                    已高亮: {p.nearbyResult.length} 节点
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="reach" className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="name"
                    value={p.reachTarget}
                    onChange={(e) => p.setReachTarget(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="h"
                    type="number"
                    value={p.reachHops}
                    onChange={(e) => p.setReachHops(e.target.value)}
                    className="h-8 text-sm w-16"
                  />
                </div>
                <Button onClick={p.findReachable} size="sm" className="w-full h-8" disabled={disabled}>
                  运行
                </Button>
                {p.reachResult ? (
                  <div className="text-xs text-muted-foreground">
                    已高亮: {p.reachResult.length} 节点
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </FeatureCard>

          <FeatureCard title="社交网络分析" icon={<Activity className="w-4 h-4" />}>
            <Button
              onClick={p.runAnalyze}
              variant="outline"
              className="w-full h-8"
              disabled={disabled}
            >
              分析
            </Button>

            {p.analysis ? (
              <div className="space-y-3">
                <Tabs
                  value={p.analysisTab}
                  onValueChange={(v) => p.setAnalysisTab(v as any)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 h-7">
                    <TabsTrigger value="core" className="text-[10px]">核心</TabsTrigger>
                    <TabsTrigger value="active" className="text-[10px]">活跃</TabsTrigger>
                    <TabsTrigger value="edge" className="text-[10px]">边缘</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="text-xs text-muted-foreground">
                  已高亮: {p.analysisList.length} 节点
                </div>

                <ScrollArea className="h-44 rounded border p-2 bg-muted/20">
                  {p.analysisList.slice(0, 60).map((x, i) => (
                    <div
                      key={x.name}
                      className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground w-5">{i + 1}</span>
                        <Badge variant="outline" className="h-5 px-1 font-normal truncate">
                          {x.name}
                        </Badge>
                      </div>

                      <div className="text-[10px] text-muted-foreground shrink-0">
                        deg:{x.degree} / w:{x.weight_sum.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            ) : null}
          </FeatureCard>

        </div>
      </ScrollArea>
    </div>
  );
}
