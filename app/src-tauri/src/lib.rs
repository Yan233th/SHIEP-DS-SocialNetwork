mod graph;
use graph::{Edge, Graph, GraphData};

use std::sync::Mutex;
use tauri::State;
use tauri_specta::{collect_commands, Builder};

struct AppState {
    graph: Mutex<Graph>,
}

// 命令：加载 CSV
#[tauri::command]
#[specta::specta]
fn load_csv(path: String, state: State<AppState>) -> Result<String, String> {
    let mut g = state.graph.lock().map_err(|e| e.to_string())?;
    g.load_from_csv(&path)?;
    Ok(format!("加载成功！节点: {}, 边: {}", g.node_count(), g.edge_count()))
}
// 命令：获取最短路径
#[tauri::command]
#[specta::specta]
fn get_shortest_path(start: String, end: String, state: State<AppState>) -> Result<Vec<String>, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    g.get_path(&start, &end).ok_or_else(|| "未找到路径".to_string())
}
// 命令：获取图数据（给前端渲染）
#[tauri::command]
#[specta::specta]
fn get_graph_data(state: State<AppState>) -> Result<GraphData, String> {
    // 返回类型改了
    let g = state.graph.lock().map_err(|e| e.to_string())?;

    let nodes = g.nodes.clone();

    let mut links = Vec::new();
    for (u, edges) in g.adj.iter().enumerate() {
        for &(v, w) in edges {
            if u < v {
                links.push(Edge {
                    source: g.nodes[u].name.clone(),
                    target: g.nodes[v].name.clone(),
                    weight: w,
                });
            }
        }
    }

    Ok(GraphData { nodes, edges: links })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![load_csv, get_shortest_path, get_graph_data,]);
    #[cfg(debug_assertions)]
    builder
        .export(specta_typescript::Typescript::default(), "../src/bindings.ts")
        .expect("Failed to export typescript bindings");
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            graph: Mutex::new(Graph::default()),
        })
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
