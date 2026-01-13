#include <iostream>
#include <string>
#include <string_view>

#include "graph.hpp"

void printHelp(std::string_view program) {
    std::cout << "Usage: " << program << " [options]\n"
        << "\n"
        << "Options:\n"
        << "  -h, --help              Show this help\n"
        << "  -l, --load <file>       Load CSV file (default: ../data/stackoverflow_edges.csv)\n"
        << "  -p, --path <A> <B>      Find shortest path between A and B\n"
        << "  -n, --nearby <p> <r>    Find people near p within radius r\n"
        << "  -r, --reach <p> <d>     Find people reachable within d hops\n"
        << "  -a, --analyze           Analyze core/active/edge people\n"
        << "  -c, --circle <p>        Find social circle of p\n"
        << "  -i, --info <p>          Show info of person p\n";
}

int main(int argc, char *argv[]) {
    std::string datafile = "../data/stackoverflow_edges.csv";

    for (int i = 1; i < argc; i++) {
        std::string_view arg = argv[i];

        if (arg == "-h" || arg == "--help") {
            printHelp(argv[0]);
            return 0;
        }
        else if (arg == "-l" || arg == "--load") {
            datafile = argv[++i];
        }
    }

    std::cout << "Loading data from: " << datafile << std::endl;
    Graph graph;
    if (!graph.loadFromCSV(datafile)) {
        std::cerr << "Data loading failed!" << std::endl;
        return 1;
    }
    std::cout << "Data loaded successfully." << std::endl;

    for (int i = 1; i < argc; i++) {
        std::string_view arg = argv[i];

        if (arg == "-l" || arg == "--load") {
            i++;
        }
        else if (arg == "-p" || arg == "--path") {
            std::string_view from = argv[++i];
            std::string_view to = argv[++i];
            std::cout << "Path: " << from << "->" << to << std::endl;
        }
        else if (arg == "-n" || arg == "--nearby") {
            std::string_view person = argv[++i];
            std::size_t radius = std::stoul(argv[++i]);
            std::cout << "Nearby: " << person << ", radius=" << radius << std::endl;
        }
        else if (arg == "-r" || arg == "--reach") {
            std::string_view person = argv[++i];
            std::size_t depth = std::stoul(argv[++i]);
            std::cout << "Reach: " << person << ", depth=" << depth << std::endl;
        }
        else if (arg == "-a" || arg == "--analyze") {
            std::cout << "Analyzing core people..." << std::endl;
        }
        else if (arg == "-c" || arg == "--circle") {
            std::string_view person = argv[++i];
            std::cout << "Circle: " << person << std::endl;
        }
        else if (arg == "-i" || arg == "--info") {
            std::string_view person = argv[++i];
            std::cout << "Info: " << person << std::endl;
        }
        else {
            std::cerr << "Unknown option: " << arg << std::endl;
            return 1;
        }
    }

    return 0;
}
