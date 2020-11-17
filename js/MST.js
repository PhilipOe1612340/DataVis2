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
        this.graphs = this.filterByClass(
            this.data.map((d) => ({ x: parseFloat(d.x), y: parseFloat(d.y), class: d.class })),
            classes
        ).map(this.makeGraph);
    }

    static calculate(graph) {
        debugger;
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
        // edges.sort((a, b) => {
        //   return -(a.weight - b.weight);
        // });

        while (edges.length && forest.size() > 1) {
            let edge = edges.pop();

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
     * @returns {{nodes: GraphNode[], links: {weight: number, source: number, target: number}}[]}
     */
    makeGraph(nodeList) {
        const nodes = nodeList.map((n) => ({ ...n, id: ~~(Math.random() * 1000) }));
        const graphs = {
            nodes,
            links: nodes.flatMap((source) =>
                nodes.filter((target) => target != source).map((target) => ({ weight: 1, source: source.id, target: target.id }))
            ),
        };
        console.log(graphs);
        // @ts-ignore
        return graphs;
    }
}

class GraphNode {
    constructor(id) {
        this.id_ = id;
        this.parent_ = this;
        this.rank_ = 0;
    }
}

class DisjointSet {
    constructor() {
        this.index_ = {};
    }

    makeSet(id) {
        if (!this.index_[id]) {
            let created = new GraphNode(id);
            this.index_[id] = created;
        }
    }

    // Returns the id of the representative element of this set that (id)
    // belongs to.
    find(id) {
        if (this.index_[id] === undefined) {
            return undefined;
        }

        let current = this.index_[id].parent_;
        while (current !== current.parent_) {
            current = current.parent_;
        }
        return current.id_;
    }

    /**
     *
     * @param {GraphNode[]} x
     * @param {GraphNode[]} y
     */
    union(x, y) {
        let xRoot = this.index_[this.find(x)];
        let yRoot = this.index_[this.find(y)];

        if (xRoot === undefined || yRoot === undefined || xRoot === yRoot) {
            // x and y already belong to the same set.
            return;
        }

        if (xRoot.rank < yRoot.rank) {
            // Move x into the set y is a member of.
            xRoot.parent_ = yRoot;
        } else if (yRoot.rank_ < xRoot.rank_) {
            // Move y into the set x is a member of.
            yRoot.parent_ = xRoot;
        } else {
            // Arbitrarily choose to move y into the set x is a member of.
            yRoot.parent_ = xRoot;
            xRoot.rank_++;
        }
    }

    // Returns the current number of disjoint sets.
    size() {
        let uniqueIndices = {};

        Object.keys(this.index_).forEach((id) => {
            let representative = this.find(id);

            uniqueIndices[id] = true;
        });

        return Object.keys(uniqueIndices).length;
    }
}
