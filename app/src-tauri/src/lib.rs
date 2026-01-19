mod graph;
use graph::{AnalysisResult, CircleMember, Edge, Graph, GraphData, NearbyPerson, PathResult, PersonInfo};

use std::sync::Mutex;
use tauri::State;
use tauri_specta::{collect_commands, Builder};

struct AppState {
    graph: Mutex<Graph>,
}

#[tauri::command]
#[specta::specta]
fn load_csv(path: String, state: State<AppState>) -> Result<String, String> {
    let mut g = state.graph.lock().map_err(|e| e.to_string())?;
    g.load_from_csv(&path)?;
    Ok(format!("加载成功！节点: {}, 边: {}", g.node_count(), g.edge_count()))
}

#[tauri::command]
#[specta::specta]
fn get_graph_data(state: State<AppState>) -> Result<GraphData, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    let nodes = g.nodes.clone();
    let mut edges = Vec::new();
    for (u, adj) in g.adj.iter().enumerate() {
        for &(v, w) in adj {
            if u < v {
                edges.push(Edge {
                    source: g.nodes[u].name.clone(),
                    target: g.nodes[v].name.clone(),
                    weight: w,
                });
            }
        }
    }
    Ok(GraphData { nodes, edges })
}

#[tauri::command]
#[specta::specta]
fn get_shortest_path(start: String, end: String, state: State<AppState>) -> Result<PathResult, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    g.get_path(&start, &end)
        .ok_or_else(|| format!("未找到 {} 到 {} 的路径", start, end))
}

#[tauri::command]
#[specta::specta]
fn get_nearby(person: String, radius: f64, state: State<AppState>) -> Result<Vec<NearbyPerson>, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    g.get_nearby(&person, radius).ok_or_else(|| format!("未找到用户: {}", person))
}

#[tauri::command]
#[specta::specta]
fn get_reachable(person: String, hops: usize, state: State<AppState>) -> Result<Vec<String>, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    g.get_reachable(&person, hops)
        .ok_or_else(|| format!("未找到用户: {}", person))
}

#[tauri::command]
#[specta::specta]
fn analyze(state: State<AppState>) -> Result<AnalysisResult, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    Ok(g.analyze())
}

#[tauri::command]
#[specta::specta]
fn get_circle(person: String, state: State<AppState>) -> Result<Vec<CircleMember>, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    g.get_circle(&person).ok_or_else(|| format!("未找到用户: {}", person))
}

#[tauri::command]
#[specta::specta]
fn get_info(person: String, state: State<AppState>) -> Result<PersonInfo, String> {
    let g = state.graph.lock().map_err(|e| e.to_string())?;
    g.get_info(&person).ok_or_else(|| format!("未找到用户: {}", person))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![load_csv, get_shortest_path, get_graph_data,]);
    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default().bigint(specta_typescript::BigIntExportBehavior::Number),
            "../src/bindings.ts",
        )
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
