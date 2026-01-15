import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

function App() {
  const [status, setStatus] = useState("等待加载...");
  const [pathResult, setPathResult] = useState("");
  const [graphData, setGraphData] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // 1. 选择并加载 CSV
  async function handleLoadCSV() {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (filePath) {
        setStatus("加载中...");
        const result = await invoke<string>("load_csv", { path: filePath });
        setStatus(result);
      }
    } catch (e) {
      setStatus(`错误: ${e}`);
    }
  }

  // 2. 测试最短路径
  async function handleFindPath() {
    try {
      const path = await invoke<string[]>("get_shortest_path", { start, end });
      setPathResult(path.join(" → "));
    } catch (e) {
      setPathResult(`错误: ${e}`);
    }
  }

  // 3. 测试获取图数据
  async function handleGetGraphData() {
    try {
      const data = await invoke("get_graph_data");
      // 格式化 JSON 显示在页面上
      setGraphData(JSON.stringify(data, null, 2));
      setStatus("图数据已加载，见下方");
    } catch (e) {
      setGraphData(`错误: ${e}`);
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
            {graphData.split("\n").slice(0, 100).join("\n")}{graphData.split("\n").length > 100 && "\n... (截断)"}
          </pre>
        </section>
      )}
    </div>
  );
}

export default App;
