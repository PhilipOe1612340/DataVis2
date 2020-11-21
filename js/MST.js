
class MST {
    /**
     * @param data where our graph is stored
     */
    constructor(data) {
        this.data = data;
        this.graph = this.makeGraph(this.data.map((d) => ({ x: parseFloat(d.x), y: parseFloat(d.y), class: d.class })));
    }

    static calculate(graph) {
        const vertices = graph.nodes,
            edges = graph.links.slice(0),
            selectedEdges = [],
            edgeGroups = new DisjointSet();

        // Each vertex begins disconnected from all the others
        vertices.forEach((vertex) => {
            edgeGroups.makeSet(vertex.id);
        });

        // Sort edges in descending order of weight
        edges.sort((a, b) => {
            return -(a.weight - b.weight);
        });

        while (edges.length && edgeGroups.size() > 1) {
            const edge = edges.pop(); // Start with "cheapest" edge

            if (edgeGroups.find(edge.source) !== edgeGroups.find(edge.target)) {
                edgeGroups.union(edge.source, edge.target);
                selectedEdges.push(edge);
            }
        }

        return {
            nodes: vertices,
            links: selectedEdges,
        };
    }

    /**
     * Connect all original nodes to get a fully connected graph
     * @param {{x: number, y: number}[]} nodeList
     * @returns {{nodes: GraphNode[], links: {weight: number, source: number, target: number}[]}[]}
     */
    makeGraph(nodeList) {
        nodeList.forEach((n, id) => (n.id = id));
        // @ts-ignore
        return {
            nodes: nodeList,
            links: nodeList.flatMap((source) =>
                nodeList
                    .filter((target) => target !== source)
                    .map((target) => ({weight: this.distance(source, target), source: source.id, target: target.id}))
            ),
        };
    }

    /**
     * Compute Euclidean distance between points
     * @param source
     * @param target
     * @returns {number}
     */
    distance(source, target) {
        const a = source.x - target.x;
        const b = source.y - target.y;
        return Math.sqrt(a ** 2 + b ** 2);
    }
}

class GraphNode {
    constructor(id) {
        this.id = id;
        this.parent = this;
        this.rank = 0;
    }
}

class DisjointSet {
    constructor() {
        this.index = {};
    }

    makeSet(id) {
        if (!this.index[id]) {
            let created = new GraphNode(id);
            this.index[id] = created;
        }
    }

    /**
     * Return the id of the set that this node belongs to
     * @param nodeId
     * @returns id (group id)
     */
    find(nodeId) {
        if (this.index[nodeId] === undefined) {
            return undefined;
        }

        let current = this.index[nodeId].parent;
        while (current !== current.parent) {
            current = current.parent;
        }
        return current.id;
    }

    /**
     * When connecting x and y, assign them to the corresponding set
     * @param {GraphNode[]} x
     * @param {GraphNode[]} y
     */
    union(x, y) {
        let xRoot = this.index[this.find(x)];
        let yRoot = this.index[this.find(y)];

        if (xRoot === undefined || yRoot === undefined || xRoot === yRoot) {
            // x and y already belong to the same set.
            return;
        }

        if (xRoot.rank < yRoot.rank) {
            // Move x into the set of y
            xRoot.parent = yRoot;
        } else if (yRoot.rank < xRoot.rank) {
            // Move y into the set of x
            yRoot.parent = xRoot;
        } else {
            // Arbitrarily choose to move y into the set x is a member of
            yRoot.parent = xRoot;
            xRoot.rank++;
        }
    }

    /**
     * Return the current number of disjoint sets
     * @returns {number}
     */
    size() {
        let uniqueIndices = {};

        Object.keys(this.index).forEach((id) => {
            uniqueIndices[id] = true;
        });

        return Object.keys(uniqueIndices).length;
    }
}
