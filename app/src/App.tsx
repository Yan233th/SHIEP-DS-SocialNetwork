import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { commands, GraphData } from "./bindings";

function App() {
  const [status, setStatus] = useState("等待加载...");
  const [pathResult, setPathResult] = useState("");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  async function handleLoadCSV() {
    const filePath = await open({
      multiple: false,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (filePath) {
      setStatus("加载中...");
      const result = await commands.loadCsv(filePath);

      if (result.status === "ok") {
        setStatus(result.data);
      } else {
        setStatus(`错误: ${result.error}`);
      }
    }
  }
  async function handleFindPath() {
    const result = await commands.getShortestPath(start, end);

    if (result.status === "ok") {
      setPathResult(result.data.join(" → "));
    } else {
      setPathResult(`错误: ${result.error}`);
    }
  }
  async function handleGetGraphData() {
    const result = await commands.getGraphData();

    if (result.status === "ok") {
      setGraphData(result.data);
      setStatus("图数据已加载");
    } else {
      setStatus(`错误: ${result.error}`);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Test Page</h1>

      {/* 加载 CSV */}
      <section style={{ marginBottom: 20 }}>
        <button onClick={handleLoadCSV}>选择 CSV 文件</button>
        <p>状态: {status}</p>
      </section>

      {/* 最短路径测试 */}
      <section style={{ marginBottom: 20 }}>
        <h3>最短路径测试</h3>
        <input
          placeholder="起点"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          style={{ marginRight: 10, padding: 5 }}
        />
        <input
          placeholder="终点"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          style={{ marginRight: 10, padding: 5 }}
        />
        <button onClick={handleFindPath}>查找路径</button>
        <p>结果: {pathResult || "无"}</p>
      </section>

      {/* 获取图数据 */}
      <section style={{ marginBottom: 20 }}>
        <button onClick={handleGetGraphData}>获取图数据</button>
      </section>

      {/* 数据展示区*/}
      {graphData && (
        <section>
          <h3>图数据</h3>
          <pre
            style={{
              // background: "#1e1e1e",
              // color: "#0f0",
              padding: 15,
              borderRadius: 5,
              maxHeight: 400,
              overflow: "auto", fontSize: 12,
            }}
          >
            {graphData && (
              <section>
                <h3>图数据</h3>
                <p>节点: {graphData.nodes.length}, 边: {graphData.edges.length}</p>

                <h4>节点列表</h4>
                <ul style={{ maxHeight: 200, overflow: "auto" }}>
                  {graphData.nodes.slice(0, 20).map(node => (
                    <li key={node.name}>
                      {node.name} ({node.loc.x.toFixed(2)}, {node.loc.y.toFixed(2)})
                    </li>
                  ))}
                  {graphData.nodes.length > 20 && <li>... 等 {graphData.nodes.length - 20} 个</li>}
                </ul>

                <h4>边列表</h4>
                <ul style={{ maxHeight: 200, overflow: "auto" }}>
                  {graphData.edges.slice(0, 20).map((edge, i) => (
                    <li key={i}>
                      {edge.source} → {edge.target} (权重: {edge.weight.toFixed(2)})
                    </li>
                  ))}
                  {graphData.edges.length > 20 && <li>... 等 {graphData.edges.length - 20} 条</li>}
                </ul>
              </section>
            )}
          </pre>
        </section>
      )}
    </div>
  );
}

export default App;
