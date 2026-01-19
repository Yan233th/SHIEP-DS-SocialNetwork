import { GraphView } from "@/components/GraphView";
import { ControlPanel } from "@/components/ControlPanel";
import { useSocialGraph } from "@/hooks/useSocialGraph";

export default function App() {
  const sg = useSocialGraph();

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground font-sans">
      <GraphView nodes={sg.nodes} edges={sg.edges} highlight={sg.highlight} onReset={sg.reset} />
      <ControlPanel {...sg} />
    </div>
  );
}
