// @ts-check

class MST {
    /**
     *
     * @param {{x: string, y: string, class: string}[]} data
     * @param {string[]} classes
     */
    constructor(data, classes) {
        this.data = data;
        this.classes = classes;
        // this.graphs = this.filterByClass(
        //     this.data.map((d) => ({ x: parseFloat(d.x), y: parseFloat(d.y), class: d.class })),
        //     classes
        // ).map((d) => this.makeGraph(d));

        this.graph = this.makeGraph(this.data.map((d) => ({ x: parseFloat(d.x), y: parseFloat(d.y), class: d.class })));
    }

    static calculate(graph) {
        const vertices = graph.nodes,
            edges = graph.links.slice(0),
            selectedEdges = [],
            forest = new DisjointSet();

        // Each vertex begins "disconnected" and isolated from all the others.
        vertices.forEach((vertex) => {
            forest.makeSet(vertex.id);
        });

        // Sort edges in descending order of weight. We will pop edges beginning
        // from the end of the array.
        edges.sort((a, b) => {
            return -(a.weight - b.weight);
        });

        while (edges.length && forest.size() > 1) {
            const edge = edges.pop();

            if (forest.find(edge.source) !== forest.find(edge.target)) {
                forest.union(edge.source, edge.target);
                selectedEdges.push(edge);
            }
        }

        return {
            nodes: vertices,
            links: selectedEdges,
        };
    }

    /**
     * @param {{x: number, y: number, class: string}[]} data
     * @param {string[]} classes
     */
    filterByClass(data, classes) {
        return classes.map((c) => data.filter((d) => d.class === c));
    }

    /**
     * connect all the nodes to each other
     * @param {{x: number, y: number}[]} nodeList
     * @returns {{nodes: GraphNode[], links: {weight: number, source: number, target: number}[]}[]}
     */
    makeGraph(nodeList) {
        nodeList.forEach((n, id) => (n.id = id));
        const graphs = {
            nodes: nodeList,
            links: nodeList.flatMap((source) =>
                nodeList
                    .filter((target) => target != source)
                    .map((target) => ({ weight: this.distance(source, target), source: source.id, target: target.id }))
            ),
        };
        // @ts-ignore
        return graphs;
    }

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

    // Returns the id of the representative element of this set that (id)
    // belongs to.
    find(id) {
        if (this.index[id] === undefined) {
            return undefined;
        }

        let current = this.index[id].parent;
        while (current !== current.parent) {
            current = current.parent;
        }
        return current.id;
    }

    /**
     *
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
            // Move x into the set y is a member of.
            xRoot.parent = yRoot;
        } else if (yRoot.rank < xRoot.rank) {
            // Move y into the set x is a member of.
            yRoot.parent = xRoot;
        } else {
            // Arbitrarily choose to move y into the set x is a member of.
            yRoot.parent = xRoot;
            xRoot.rank++;
        }
    }

    // Returns the current number of disjoint sets.
    size() {
        let uniqueIndices = {};

        Object.keys(this.index).forEach((id) => {
            uniqueIndices[id] = true;
        });

        return Object.keys(uniqueIndices).length;
    }
}
