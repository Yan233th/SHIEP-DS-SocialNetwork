use std::{
    collections::{HashMap, VecDeque},
    fs::File,
    io::{BufRead, BufReader},
};

use rand::Rng;
use serde::Serialize;
use specta::Type;

// Basic Structures
#[derive(Clone, Serialize, Type)]
pub struct Coordinate {
    pub x: f64,
    pub y: f64,
}
#[derive(Clone, Serialize, Type)]
pub struct Node {
    pub name: String,
    pub loc: Coordinate,
}
#[derive(Serialize, Type)]
pub struct Edge {
    pub source: String,
    pub target: String,
    pub weight: f64,
}

// Return Structures
#[derive(Serialize, Type)]
pub struct GraphData {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}
#[derive(Serialize, Type)]
pub struct PathResult {
    pub path: Vec<String>,
    pub hops: usize,
}
#[derive(Serialize, Type)]
pub struct NearbyPerson {
    pub name: String,
    pub distance: f64,
}
#[derive(Serialize, Type)]
pub struct PersonStats {
    pub name: String,
    pub degree: usize,
    pub weight_sum: f64,
}
#[derive(Serialize, Type)]
pub struct AnalysisResult {
    pub core: Vec<PersonStats>,   // top 20%
    pub active: Vec<PersonStats>, // middle 40%
    pub edge: Vec<PersonStats>,   // bottom 40%
}
#[derive(Serialize, Type)]
pub struct CircleMember {
    pub name: String,
    pub weight: f64,
}
#[derive(Serialize, Type)]
pub struct PersonInfo {
    pub name: String,
    pub index: usize,
    pub loc: Coordinate,
    pub connections: usize,
}

// Graph Structure
#[derive(Default)]
pub struct Graph {
    pub nodes: Vec<Node>,
    pub adj: Vec<Vec<(usize, f64)>>,
    pub name2idx: HashMap<String, usize>,
}
impl Graph {
    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    pub fn edge_count(&self) -> usize {
        self.adj.iter().map(|e| e.len()).sum::<usize>() / 2
    }

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
                // self.adj[v].push((u, w));
            }
        }
        Ok(())
    }

    pub fn get_path(&self, start: &str, end: &str) -> Option<PathResult> {
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
                let hops = path.len() - 1;
                return Some(PathResult { path, hops });
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

    pub fn distance(&self, i: usize, j: usize) -> f64 {
        let dx = self.nodes[i].loc.x - self.nodes[j].loc.x;
        let dy = self.nodes[i].loc.y - self.nodes[j].loc.y;
        (dx * dx + dy * dy).sqrt()
    }

    pub fn get_nearby(&self, person: &str, radius: f64) -> Option<Vec<NearbyPerson>> {
        let &idx = self.name2idx.get(person)?;
        let mut result = Vec::new();
        for i in 0..self.nodes.len() {
            if i == idx {
                continue;
            }
            let dist = self.distance(idx, i);
            if dist <= radius {
                result.push(NearbyPerson {
                    name: self.nodes[i].name.clone(),
                    distance: dist,
                });
            }
        }
        result.sort_by(|a, b| a.distance.partial_cmp(&b.distance).unwrap());
        Some(result)
    }

    pub fn get_reachable(&self, person: &str, hops: usize) -> Option<Vec<String>> {
        let &idx = self.name2idx.get(person)?;
        let mut dist = vec![usize::MAX; self.nodes.len()];
        let mut queue = VecDeque::new();
        queue.push_back(idx);
        dist[idx] = 0;
        while let Some(u) = queue.pop_front() {
            if dist[u] >= hops {
                continue;
            }
            for &(v, _) in &self.adj[u] {
                if dist[v] == usize::MAX {
                    dist[v] = dist[u] + 1;
                    queue.push_back(v);
                }
            }
        }
        let result: Vec<String> = (0..self.nodes.len())
            .filter(|&i| dist[i] == hops)
            .map(|i| self.nodes[i].name.clone())
            .collect();
        Some(result)
    }

    pub fn analyze(&self) -> AnalysisResult {
        // Calculate the degree and weight for each person
        let mut stats: Vec<(usize, f64, usize)> = self
            .adj
            .iter()
            .enumerate()
            .map(|(i, edges)| {
                let weight_sum: f64 = edges.iter().map(|(_, w)| w).sum();
                (edges.len(), weight_sum, i)
            })
            .collect();
        // Sort by weight in descending order, then by degree in descending order
        stats.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap().then_with(|| b.0.cmp(&a.0)));
        let n = self.nodes.len();
        let core_end = n / 5;
        let active_end = n * 3 / 5;
        let to_person_stats = |&(degree, weight_sum, idx): &(usize, f64, usize)| PersonStats {
            name: self.nodes[idx].name.clone(),
            degree,
            weight_sum,
        };
        AnalysisResult {
            core: stats[..core_end].iter().map(to_person_stats).collect(),
            active: stats[core_end..active_end].iter().map(to_person_stats).collect(),
            edge: stats[active_end..].iter().map(to_person_stats).collect(),
        }
    }

    pub fn get_circle(&self, person: &str) -> Option<Vec<CircleMember>> {
        let &idx = self.name2idx.get(person)?;
        let result: Vec<CircleMember> = self.adj[idx]
            .iter()
            .map(|&(v, weight)| CircleMember {
                name: self.nodes[v].name.clone(),
                weight,
            })
            .collect();
        Some(result)
    }

    pub fn get_info(&self, person: &str) -> Option<PersonInfo> {
        let &idx = self.name2idx.get(person)?;
        let node = &self.nodes[idx];
        Some(PersonInfo {
            name: node.name.clone(),
            index: idx,
            loc: node.loc.clone(),
            connections: self.adj[idx].len(),
        })
    }
}
