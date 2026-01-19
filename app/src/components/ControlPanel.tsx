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
          <FeatureCard title="Data" icon={<FileText className="w-4 h-4" />}>
            <Button onClick={p.loadFromDialog} variant="secondary" className="w-full">
              Load CSV
            </Button>
            <div className="text-xs text-muted-foreground break-words p-2 bg-muted/50 rounded">
              {p.status}
            </div>
            <div className="text-xs text-muted-foreground">
              Nodes: {p.nodeCount} / Edges: {p.edgeCount}
            </div>
          </FeatureCard>

          <FeatureCard title="Shortest Path" icon={<Search className="w-4 h-4" />}>
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
              Run
            </Button>

            {p.pathResult ? (
              <div className="text-xs bg-muted p-2 rounded break-words">
                <div className="font-medium">hops: {p.pathResult.hops}</div>
                <div className="opacity-80">{p.pathResult.path.join(" → ")}</div>
              </div>
            ) : null}
          </FeatureCard>

          <FeatureCard title="Social" icon={<Info className="w-4 h-4" />}>
            <Tabs defaultValue="circle" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="circle" className="text-xs">
                  Circle
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs">
                  Info
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
                    highlighted: {p.circleResult.length} neighbors
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
                      <span>index</span>
                      <span>{p.infoResult.index}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>loc</span>
                      <span>
                        ({p.infoResult.loc.x.toFixed(1)}, {p.infoResult.loc.y.toFixed(1)})
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>connections</span>
                      <span>{p.infoResult.connections}</span>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </FeatureCard>

          <FeatureCard title="Range" icon={<Users className="w-4 h-4" />}>
            <Tabs defaultValue="nearby" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="nearby" className="text-xs">
                  Nearby
                </TabsTrigger>
                <TabsTrigger value="reach" className="text-xs">
                  N-hops
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
                  Run
                </Button>
                {p.nearbyResult ? (
                  <div className="text-xs text-muted-foreground">
                    highlighted: {p.nearbyResult.length} nodes
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
                  Run
                </Button>
                {p.reachResult ? (
                  <div className="text-xs text-muted-foreground">
                    highlighted: {p.reachResult.length} nodes
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </FeatureCard>

          <FeatureCard title="Analysis" icon={<Activity className="w-4 h-4" />}>
            <Button
              onClick={p.runAnalyze}
              variant="outline"
              className="w-full h-8"
              disabled={disabled}
            >
              Analyze
            </Button>

            {p.analysis ? (
              <>
                <Tabs
                  value={p.analysisTab}
                  onValueChange={(v) => p.setAnalysisTab(v as any)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 h-7">
                    <TabsTrigger value="core" className="text-[10px]">
                      core
                    </TabsTrigger>
                    <TabsTrigger value="active" className="text-[10px]">
                      active
                    </TabsTrigger>
                    <TabsTrigger value="edge" className="text-[10px]">
                      edge
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="text-xs text-muted-foreground">
                  highlighted: {p.analysisList.length} nodes
                </div>

                <div className="flex flex-wrap gap-2">
                  {p.analysisList.slice(0, 8).map((x) => (
                    <Badge key={x.name} variant="outline" className="font-normal">
                      {x.name}
                    </Badge>
                  ))}
                </div>
              </>
            ) : null}
          </FeatureCard>
        </div>
      </ScrollArea>
    </div>
  );
}
