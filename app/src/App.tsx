import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { commands } from "./bindings";
import type { 
  GraphData, 
  PathResult, 
  NearbyPerson, 
  AnalysisResult, 
  CircleMember, 
  PersonInfo 
} from "./bindings";

// 封装 Result 处理
function unwrap<T>(result: { status: "ok"; data: T } | { status: "error"; error: string }): T {
  if (result.status === "ok") return result.data;
  throw new Error(result.error);
}

function App() {
  // 状态
  const [status, setStatus] = useState("等待加载...");
  
  // 各功能的输入和结果
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  
  const [pathStart, setPathStart] = useState("");
  const [pathEnd, setPathEnd] = useState("");
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  
  const [nearbyPerson, setNearbyPerson] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState("30");
  const [nearbyResult, setNearbyResult] = useState<NearbyPerson[] | null>(null);
  
  const [reachPerson, setReachPerson] = useState("");
  const [reachHops, setReachHops] = useState("2");
  const [reachResult, setReachResult] = useState<string[] | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const [circlePerson, setCirclePerson] = useState("");
  const [circleResult, setCircleResult] = useState<CircleMember[] | null>(null);
  
  const [infoPerson, setInfoPerson] = useState("");
  const [infoResult, setInfoResult] = useState<PersonInfo | null>(null);

  // 1. 加载 CSV
  async function handleLoadCSV() {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (filePath) {
        setStatus("加载中...");
        const result = unwrap(await commands.loadCsv(filePath));
        setStatus(result);
      }
    } catch (e) {
      setStatus(`错误: ${e}`);
    }
  }

  // 2. 获取图数据
  async function handleGetGraphData() {
    try {
      const data = unwrap(await commands.getGraphData());
      setGraphData(data);
      setStatus(`图数据: ${data.nodes.length} 节点, ${data.edges.length} 边`);
    } catch (e) {
      setStatus(`错误: ${e}`);
    }
  }

  // 3. 最短路径
  async function handleGetPath() {
    try {
      const result = unwrap(await commands.getShortestPath(pathStart, pathEnd));
      setPathResult(result);
    } catch (e) {
      setPathResult(null);
      setStatus(`错误: ${e}`);
    }
  }

  // 4. 附近的人
  async function handleGetNearby() {
    try {
      const result = unwrap(await commands.getNearby(nearbyPerson, parseFloat(nearbyRadius)));
      setNearbyResult(result);
    } catch (e) {
      setNearbyResult(null);
      setStatus(`错误: ${e}`);
    }
  }

  // 5. N跳可达
  async function handleGetReachable() {
    try {
      const result = unwrap(await commands.getReachable(reachPerson, parseInt(reachHops)));
      setReachResult(result);
    } catch (e) {
      setReachResult(null);
      setStatus(`错误: ${e}`);
    }
  }

  // 6. 分析
  async function handleAnalyze() {
    try {
      const result = unwrap(await commands.analyze());
      setAnalysisResult(result);
    } catch (e) {
      setAnalysisResult(null);
      setStatus(`错误: ${e}`);
    }
  }

  // 7. 社交圈
  async function handleGetCircle() {
    try {
      const result = unwrap(await commands.getCircle(circlePerson));
      setCircleResult(result);
    } catch (e) {
      setCircleResult(null);
      setStatus(`错误: ${e}`);
    }
  }

  // 8. 个人信息
  async function handleGetInfo() {
    try {
      const result = unwrap(await commands.getInfo(infoPerson));
      setInfoResult(result);
    } catch (e) {
      setInfoResult(null);
      setStatus(`错误: ${e}`);
    }
  }

  const inputStyle = { padding: 5, marginRight: 10, width: 120 };
  const sectionStyle = { marginBottom: 20, padding: 10, border: "1px solid #ccc", borderRadius: 5 };

  return (
    <div style={{ padding: 20, fontFamily: "monospace", maxWidth: 800 }}>
      <h1>社交网络 API 测试</h1>
      <p><strong>状态:</strong> {status}</p>

      {/* 1. 加载 CSV */}
      <section style={sectionStyle}>
        <h3>1. 加载数据</h3>
        <button onClick={handleLoadCSV}>选择 CSV 文件</button>
        <button onClick={handleGetGraphData} style={{ marginLeft: 10 }}>获取图数据</button>
        {graphData && (
          <p>节点: {graphData.nodes.length}, 边: {graphData.edges.length}</p>
        )}
      </section>

      {/* 2. 最短路径 */}
      <section style={sectionStyle}>
        <h3>2. 最短路径</h3>
        <input
          placeholder="起点"
          value={pathStart}
          onChange={(e) => setPathStart(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="终点"
          value={pathEnd}
          onChange={(e) => setPathEnd(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleGetPath}>查找</button>
        {pathResult && (
          <div style={{ marginTop: 10 }}>
            <p>路径: {pathResult.path.join(" → ")}</p>
            <p>跳数: {pathResult.hops}</p>
          </div>
        )}
      </section>

      {/* 3. 附近的人 */}
      <section style={sectionStyle}>
        <h3>3. 附近的人（地理位置）</h3>
        <input
          placeholder="用户名"
          value={nearbyPerson}
          onChange={(e) => setNearbyPerson(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="半径"
          type="number"
          value={nearbyRadius}
          onChange={(e) => setNearbyRadius(e.target.value)}
          style={{ ...inputStyle, width: 60 }}
        />
        <button onClick={handleGetNearby}>查找</button>
        {nearbyResult && (
          <ul style={{ marginTop: 10 }}>
            {nearbyResult.length === 0 && <li>无结果</li>}
            {nearbyResult.map((p) => (
              <li key={p.name}>
                {p.name} (距离: {p.distance.toFixed(2)})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. N跳可达 */}
      <section style={sectionStyle}>
        <h3>4. N跳可达</h3>
        <input
          placeholder="用户名"
          value={reachPerson}
          onChange={(e) => setReachPerson(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="跳数"
          type="number"
          value={reachHops}
          onChange={(e) => setReachHops(e.target.value)}
          style={{ ...inputStyle, width: 60 }}
        />
        <button onClick={handleGetReachable}>查找</button>
        {reachResult && (
          <div style={{ marginTop: 10 }}>
            {reachResult.length === 0 && <p>无结果</p>}
            <p>{reachResult.join(", ")}</p>
          </div>
        )}
      </section>

      {/* 5. 分析 */}
      <section style={sectionStyle}>
        <h3>5. 人物分析</h3>
        <button onClick={handleAnalyze}>分析</button>
        {analysisResult && (
          <div style={{ marginTop: 10, display: "flex", gap: 20 }}>
            <div>
              <h4>核心人物 (前20%)</h4>
              <ul>
                {analysisResult.core.slice(0, 5).map((p) => (
                  <li key={p.name}>
                    {p.name} (度:{p.degree}, 权重:{p.weight_sum.toFixed(1)})
                  </li>
                ))}
                {analysisResult.core.length > 5 && <li>...</li>}
              </ul>
            </div>
            <div>
              <h4>活跃人物 (中40%)</h4>
              <ul>
                {analysisResult.active.slice(0, 5).map((p) => (
                  <li key={p.name}>
                    {p.name} (度:{p.degree}, 权重:{p.weight_sum.toFixed(1)})
                  </li>
                ))}
                {analysisResult.active.length > 5 && <li>...</li>}
              </ul>
            </div>
            <div>
              <h4>边缘人物 (后40%)</h4>
              <ul>
                {analysisResult.edge.slice(0, 5).map((p) => (
                  <li key={p.name}>
                    {p.name} (度:{p.degree}, 权重:{p.weight_sum.toFixed(1)})
                  </li>
                ))}
                {analysisResult.edge.length > 5 && <li>...</li>}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* 6. 社交圈 */}
      <section style={sectionStyle}>
        <h3>6. 社交圈</h3>
        <input
          placeholder="用户名"
          value={circlePerson}
          onChange={(e) => setCirclePerson(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleGetCircle}>查看</button>
        {circleResult && (
          <ul style={{ marginTop: 10 }}>
            {circleResult.map((m) => (
              <li key={m.name}>
                {m.name} (权重: {m.weight.toFixed(2)})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 7. 个人信息 */}
      <section style={sectionStyle}>
        <h3>7. 个人信息</h3>
        <input
          placeholder="用户名"
          value={infoPerson}
          onChange={(e) => setInfoPerson(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleGetInfo}>查看</button>
        {infoResult && (
          <div style={{ marginTop: 10 }}>
            <p>名称: {infoResult.name}</p>
            <p>索引: {infoResult.index}</p>
            <p>位置: ({infoResult.loc.x.toFixed(2)}, {infoResult.loc.y.toFixed(2)})</p>
            <p>连接数: {infoResult.connections}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
