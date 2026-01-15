mod graph;
use graph::Graph;

use std::sync::Mutex;
use tauri::State;

struct AppState {
    graph: Mutex<Graph>,
}

// 命令：加载 CSV
#[tauri::command]
fn load_csv(path: String, state: State<AppState>) -> Result<String, String> {
    let mut g = state.graph.lock().map_err(|e| e.to_string())?;
    g.load_from_csv(&path)?;
    Ok(format!("加载成功！节点: {}, 边: {}", g.node_count(), g.edge_count()))
}
// 命令：获取最短路径
#[tauri::command]
fn get_shortest_path(start: String, end: String, state: State<AppState>) -> Result<Vec<String>, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    g.get_path(&start, &end).ok_or_else(|| "未找到路径".to_string())
}
// 命令：获取图数据（给前端渲染）
#[tauri::command]
fn get_graph_data(state: State<AppState>) -> Result<serde_json::Value, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    let nodes: Vec<_> = g
        .nodes
        .iter()
        .map(|n| {
            serde_json::json!({
                "id": n.name,
                "x": n.loc.x,
                "y": n.loc.y
            })
        })
        .collect();
    let mut links = Vec::new();
    for (u_idx, edges) in g.adj.iter().enumerate() {
        for &(v_idx, w) in edges {
            if u_idx < v_idx {
                links.push(serde_json::json!({
                    "source": g.nodes[u_idx].name,
                    "target": g.nodes[v_idx].name,
                    "value": w
                }));
            }
        }
    }
    Ok(serde_json::json!({ "nodes": nodes, "links": links }))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            graph: Mutex::new(Graph::default()),
        })
        .invoke_handler(tauri::generate_handler![load_csv, get_shortest_path, get_graph_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
