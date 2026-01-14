#pragma once

#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <fstream>
#include <sstream>
#include <cstddef>
#include <random>
#include <cstdint>
#include <queue>

struct Coordinate {
    double x;
    double y;
};

struct Node {
    std::string name;
    Coordinate loc;
};

struct Graph {
    std::vector<Node> nodes;
    std::vector<std::vector<std::pair<std::size_t, double>>> adj;
    std::unordered_map<std::string, std::size_t> nameToIdx;

    std::mt19937 gen{std::random_device{}()};
    std::uniform_real_distribution<double> dis{0.0, 100.0};


    std::size_t updateNode(const std::string &name) {
        auto it = nameToIdx.find(name);
        if (it != nameToIdx.end()) return it->second;

        std::size_t idx = nodes.size();
        nameToIdx[name] = idx;

        nodes.emplace_back(name, Coordinate{dis(gen), dis(gen)});
        adj.emplace_back();

        return idx;
    }

    bool loadFromCSV(const std::string &datafile) {
        std::ifstream file(datafile);
        if (!file.is_open()) return false;

        std::string line;
        std::getline(file, line);
        while (std::getline(file, line)) {
            if (line.empty()) continue;
            std::stringstream ss(line);
            std::string from, to;
            double weight;

            std::getline(ss, from, ',');
            std::getline(ss, to, ',');
            ss >> weight;

            if (from.empty() || to.empty()) continue;

            std::size_t fromIdx = updateNode(from);
            std::size_t toIdx = updateNode(to);

            // std::println("{}->{}: {}->{}", from, to, fromIdx, toIdx);

            adj[fromIdx].emplace_back(toIdx, weight);
            adj[toIdx].emplace_back(fromIdx, weight);
        }
        return true;
    }

    double distance(std::size_t i, std::size_t j) const {
        double dx = nodes[i].loc.x - nodes[j].loc.x;
        double dy = nodes[i].loc.y - nodes[j].loc.y;
        return std::sqrt(dx * dx + dy * dy);
    }

    bool getPath(const std::string &from, const std::string &to) {
        if (!nameToIdx.contains(from) || !nameToIdx.contains(to)) {
            std::cout << "Node not found!" << std::endl;
            return false;
        }
        std::size_t fromIdx = nameToIdx[from];
        std::size_t toIdx = nameToIdx[to];

        std::vector<std::uint8_t> vis(nodes.size(), false);
        std::vector<std::size_t> prev(nodes.size(), SIZE_MAX);
        std::queue<std::size_t> q;
        q.push(fromIdx);
        vis[fromIdx] = true;

        while (!q.empty()) {
            std::size_t u = q.front(); q.pop();
            if (u == toIdx) break;
            for (const auto &[v, _] : adj[u]) {
                if (!vis[v]) {
                    prev[v] = u;
                    q.push(v);
                    vis[v] = true;
                }
            }
        }
        if (!vis[toIdx]) {
            std::cout << "No path between " << from << " and " << to << std::endl;
            return false;
        }
        std::vector<std::size_t> path;
        for (std::size_t cur = toIdx; cur != SIZE_MAX;) {
            path.push_back(cur);
            cur = prev[cur];
        }
        for (auto it = path.rbegin(); it != path.rend(); it++) {
            if (it != path.rbegin()) std::cout << "-> ";
            std::cout << nodes[*it].name << ' ';
        }
        std::cout << std::endl;
        std::cout << "Distance: " << path.size() - 1 << " hops" << std::endl;
        return true;
    }

    bool getNearby(const std::string &person, double radius) {
        if (!nameToIdx.contains(person)) {
            std::cout << "Node not found!" << std::endl;
            return false;
        }
        std::size_t idx = nameToIdx[person];
        std::cout << "People near " << person << " (radius=" << radius << "):" << std::endl;
        bool found = false;
        for (std::size_t i = 0; i < nodes.size(); i++) {
            if (i == idx) continue;
            double dist = distance(idx, i);
            if (dist <= radius) {
                std::cout << "  " << nodes[i].name << " (distance: " << dist << ")" << std::endl;
                found = true;
            }
        }
        if (!found) {
            std::cout << "No one nearby." << std::endl;
        }
        return true;
    }

    bool getReachable(const std::string &person, std::size_t hops) {
        if (!nameToIdx.contains(person)) {
            std::cout << "Node not found!" << std::endl;
            return false;
        }
        std::size_t idx = nameToIdx[person];
        std::vector<std::size_t> dist(nodes.size(), SIZE_MAX);
        std::queue<std::size_t> q;
        q.push(idx);
        dist[idx] = 0;
        while (!q.empty()) {
            std::size_t u = q.front(); q.pop();
            if (dist[u] >= hops) continue;
            for (const auto &[v, _] : adj[u]) {
                if (dist[v] == SIZE_MAX) {
                    dist[v] = dist[u] + 1;
                    q.push(v);
                }
            }
        }
        std::cout << "People reachable from " << person << " within " << hops << " hops:" << std::endl;
        for (std::size_t i = 0; i < nodes.size(); i++) {
            if (i != idx && dist[i] <= hops) {
                std::cout << "  " << nodes[i].name << " (" << dist[i] << " hops)" << std::endl;
            }
        }
        return true;
    }

    void analyze() {
        std::vector<std::pair<std::size_t, std::size_t>> degrees;
        for (std::size_t i = 0; i < nodes.size(); i++) {
            degrees.emplace_back(adj[i].size(), i);
        }
        std::sort(degrees.begin(), degrees.end(), std::greater<>());
        std::size_t n = nodes.size();
        std::size_t coreEnd = n / 5;
        std::size_t activeEnd = n * 3 / 5;
        std::cout << "=== Core People (top 20%) ===" << std::endl;
        for (std::size_t i = 0; i < coreEnd && i < n; i++) {
            auto [deg, idx] = degrees[i];
            std::cout << "  " << nodes[idx].name << " (degree: " << deg << ")" << std::endl;
        }
        std::cout << "=== Active People (middle 40%) ===" << std::endl;
        for (std::size_t i = coreEnd; i < activeEnd && i < n; i++) {
            auto [deg, idx] = degrees[i];
            std::cout << "  " << nodes[idx].name << " (degree: " << deg << ")" << std::endl;
        }
        std::cout << "=== Edge People (bottom 40%) ===" << std::endl;
        for (std::size_t i = activeEnd; i < n; i++) {
            auto [deg, idx] = degrees[i];
            std::cout << "  " << nodes[idx].name << " (degree: " << deg << ")" << std::endl;
        }
    }

    bool getCircle(const std::string &person) {
        if (!nameToIdx.contains(person)) {
            std::cout << "Node not found!" << std::endl;
            return false;
        }
        std::size_t idx = nameToIdx[person];
        std::cout << person << "'s social circle (" << adj[idx].size() << " connections):" << std::endl;
        for (const auto &[v, weight] : adj[idx]) {
            std::cout << "  " << nodes[v].name << " (weight: " << weight << ")" << std::endl;
        }
        return true;
    }

    bool getInfo(const std::string &person) {
        if (!nameToIdx.contains(person)) {
            std::cout << "Node not found!" << std::endl;
            return false;
        }
        std::size_t idx = nameToIdx[person];
        const auto &node = nodes[idx];
        std::cout << "=== " << node.name << " ===" << std::endl;
        std::cout << "  Index: " << idx << std::endl;
        std::cout << "  Location: (" << node.loc.x << ", " << node.loc.y << ")" << std::endl;
        std::cout << "  Connections: " << adj[idx].size() << std::endl;
        return true;
    }
};
