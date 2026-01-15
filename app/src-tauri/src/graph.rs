use std::{
    collections::{HashMap, VecDeque},
    fs::File,
    io::{BufRead, BufReader},
};

use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Coordinate {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub name: String,
    pub loc: Coordinate,
}

#[derive(Default)]
pub struct Graph {
    pub nodes: Vec<Node>,
    pub adj: Vec<Vec<(usize, f64)>>,
    pub name2idx: HashMap<String, usize>,
}

impl Graph {
    pub fn update_node(&mut self, name: &str) -> usize {
        if let Some(&idx) = self.name2idx.get(name) {
            return idx;
        }
        let idx = self.nodes.len();
        self.name2idx.insert(name.to_string(), idx);
        self.nodes.push(Node {
            name: name.to_string(),
            loc: Coordinate {
                x: rand::rng().random_range(0.0..100.0),
                y: rand::rng().random_range(0.0..100.0),
            },
        });
        self.adj.push(Vec::new());
        idx
    }

    pub fn load_from_csv(&mut self, filepath: &str) -> Result<(), String> {
        self.nodes.clear();
        self.adj.clear();
        self.name2idx.clear();
        let file = File::open(filepath).map_err(|e| format!("无法打开文件: {}", e))?;
        let reader = BufReader::new(file);
        for line in reader.lines().skip(1) {
            let line = line.map_err(|e| e.to_string())?;
            if line.trim().is_empty() {
                continue;
            }
            let parts = line.split(',').collect::<Vec<_>>();
            if let [u_str, v_str, w_str] = parts.as_slice() {
                let w = w_str.trim().parse().unwrap_or(0.0);
                let u = self.update_node(u_str.trim());
                let v = self.update_node(v_str.trim());
                self.adj[u].push((v, w));
                self.adj[v].push((u, w));
            }
        }
        Ok(())
    }

    pub fn get_path(&self, start: &str, end: &str) -> Option<Vec<String>> {
        let &start_idx = self.name2idx.get(start)?;
        let &end_idx = self.name2idx.get(end)?;
        let mut queue = VecDeque::new();
        queue.push_back(start_idx);
        let mut prev = vec![None; self.nodes.len()];
        prev[start_idx] = Some(start_idx);
        while let Some(u) = queue.pop_front() {
            if u == end_idx {
                let mut path = Vec::new();
                let mut cur = end_idx;
                while cur != start_idx {
                    path.push(self.nodes[cur].name.clone());
                    cur = prev[cur].unwrap();
                }
                path.push(self.nodes[start_idx].name.clone());
                path.reverse();
                return Some(path);
            }
            for &(v, _) in &self.adj[u] {
                if prev[v].is_none() {
                    prev[v] = Some(u);
                    queue.push_back(v);
                }
            }
        }
        None
    }

    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    pub fn edge_count(&self) -> usize {
        self.adj.iter().map(|e| e.len()).sum::<usize>() / 2
    }
}
