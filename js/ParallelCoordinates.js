// @ts-check
/**@type {import("d3")} (only for the type check) */

var d3 = globalThis.d3;

class ParallelCoordinates extends HTMLElement {
    constructor() {
        super();
        /**
         * @type {DataNode[]}
         */
        this.data = [];
        this.dimensionNames = null;
        this.rootEl = d3.select(this).append("svg");
        this.margin = {
            left: 10,
            right: 10,
            top: 30,
            bottom: 30,
        };
        this.style.margin = `${this.margin.top}px ${this.margin.right}px ${this.margin.bottom}px ${this.margin.left}px`;
        this.d3Selection = undefined;

        this.height = window.innerHeight - this.margin.top - this.margin.bottom;
        this.width = window.innerWidth - this.margin.right - this.margin.left;
        this.alpha = 0.5;
        this.beta = 0.5;
        this.yScales = {};
        this.xScale = undefined;
        this.clusterCentroids = new Map();
        this.canvas = undefined;
        this.ctx = undefined;
    }

    get bundleDimension() {
        return this.dimensionNames[0];
    }

    makeContainer() {
        clearContainer('scatterplot-container');
        this.d3Selection = this.rootEl
            .attr("width", window.innerWidth)
            .attr("height", window.innerHeight)
            .append("g")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.canvas = d3.select(this)
            .append("canvas")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("class", 'foreground')
            .node();
        this.ctx = this.canvas.getContext("2d");
        // this.ctx.stroke = 'orange';
    }

    update(alpha, beta) {
        this.alpha = alpha;
        this.beta = beta;
        this.rootEl.selectAll("*").remove();
        this.makeContainer();

        this.xScale = d3.scalePoint()
            .range([0, this.width])
            .padding(1)
            .domain(this.dimensionNames);


        for (let i in this.dimensionNames) {
            let dim = this.dimensionNames[i];
            this.yScales[dim] = d3.scaleLinear()
                .domain(d3.extent(this.data, (d) => +d[dim]))
                .range([this.height, 0]);
        }

        const yScales = this.yScales;
        this.d3Selection.selectAll("pcp-axis")
            .data(this.dimensionNames).enter()
            .append("g")
            .attr("transform", (d) => "translate(" + this.xScale(d) + ")")
            .each(function (d) {
                d3.select(this).call(d3.axisLeft().scale(yScales[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -5)
            .text(d => this.shorten(d))
            .style("fill", "black");

        this.clusterCentroids = this.compute_cluster_centroids(this.bundleDimension);
        for (const row of this.data) {
            this.ctx.strokeStyle = this.colors[row.class];
            this.ctx.beginPath();
            this.single_curve(row, this.ctx);
            this.ctx.stroke();
        }
    }

    single_curve(d, ctx) {
        const centroids = this.compute_centroids(d);
        const cps = this.compute_control_points(centroids);

        ctx.moveTo(cps[0].e(1), cps[0].e(2));
        for (let i = 1; i < cps.length; i += 3) {
            // for (let j = 0; j < 3; j++) {
            //     ctx.fillRect(cps[i + j].e(1), cps[i + j].e(2), 2, 2);
            // }
            ctx.bezierCurveTo(cps[i].e(1), cps[i].e(2), cps[i + 1].e(1), cps[i + 1].e(2), cps[i + 2].e(1), cps[i + 2].e(2));
        }
    };

    compute_centroids(row) {
        const centroids = [];

        const p = this.dimensionNames;
        const cols = p.length;
        const a = 0.5;			// center between axes
        for (let i = 0; i < cols; ++i) {
            // centroids on 'real' axes
            const x = this.xScale(p[i]);      // x value where the scale is
            const y = this.yScales[p[i]](row[p[i]]);      // y value where the scale is
            centroids.push(new Vector(x, y));

            // centroids on 'virtual' axes
            if (i < cols - 1) {
                const cx = x + a * (this.xScale(p[i + 1]) - x);
                let cy = y + a * (this.yScales[p[i + 1]](row[p[i + 1]]) - y);
                if (this.bundleDimension !== null) {
                    const leftCentroid = this.clusterCentroids.get(this.yScales[this.bundleDimension](row[this.bundleDimension])).get(p[i]);
                    const rightCentroid = this.clusterCentroids.get(this.yScales[this.bundleDimension](row[this.bundleDimension])).get(p[i + 1]);
                    const centroid = 0.5 * (leftCentroid + rightCentroid);
                    cy = centroid + (1 - this.beta) * (cy - centroid);
                }
                centroids.push(new Vector(cx, cy));
            }
        }

        return centroids;
    }

    compute_cluster_centroids(d) {
        const clusterCentroids = new Map();
        const clusterCounts = new Map();
        this.data.forEach((row) => {
            const scaled = this.yScales[d](row[d]);
            if (!clusterCounts.has(scaled)) {
                clusterCounts.set(scaled, 0);
            }
            const count = clusterCounts.get(scaled);
            clusterCounts.set(scaled, count + 1);
        });

        this.data.forEach((row) => {
            this.dimensionNames.map((p) => {
                const scaled = this.yScales[d](row[d]);
                if (!clusterCentroids.has(scaled)) {
                    const map = new Map();
                    clusterCentroids.set(scaled, map);
                }
                if (!clusterCentroids.get(scaled).has(p)) {
                    clusterCentroids.get(scaled).set(p, 0);
                }
                let value = clusterCentroids.get(scaled).get(p);
                value += this.yScales[p](row[p]) / clusterCounts.get(scaled);
                clusterCentroids.get(scaled).set(p, value);
            });
        });

        return clusterCentroids;
    }

    compute_control_points(centroids) {
        const cols = centroids.length;
        const a = this.alpha;
        const cps = [];

        cps.push(centroids[0]);
        cps.push(new Vector(centroids[0].e(1) + a * 2 * (centroids[1].e(1) - centroids[0].e(1)), centroids[0].e(2)));
        for (let col = 1; col < cols - 1; ++col) {
            const mid = centroids[col];
            const left = centroids[col - 1];
            const right = centroids[col + 1];

            const diff = left.subtract(right);
            cps.push(mid.add(diff.x(a)));
            cps.push(mid);
            cps.push(mid.subtract(diff.x(a)));
        }
        cps.push(new Vector(centroids[cols - 1].e(1) + a * 2 * (centroids[cols - 2].e(1) - centroids[cols - 1].e(1)), centroids[cols - 1].e(2)));
        cps.push(centroids[cols - 1]);

        return cps;
    };


    /**
     * 
     * @param {any[] & {columns: string[]}} data 
     */
    setDataset(data) {
        this.data = data;
        this.uniqueClasses = this.data.map((d) => d.class).filter((value, index, self) => self.indexOf(value) === index);

        this.colors = {};
        for (let i = 0; i < this.uniqueClasses.length; i++) {
            const c = this.uniqueClasses[i];
            this.colors[c] = colorArray[i];
        }

    }

    setDimensions(dimensionNames) {
        this.dimensionNames = dimensionNames.filter(d => d !== "class");
    }

    shorten(dim) {
        if (dim.length > 10) {
            dim = dim.slice(0, 10) + "...";
        }
        return dim;
    }
}

window.customElements.define("pcp-plot", ParallelCoordinates);


class Vector {

    constructor(...arr) {
        this.elements = arr;
        this.x = this.multiply;
    }

    e(i) {
        return this.elements[i - 1];
    }

    dimensions() {
        return this.elements.length;
    }

    subtract(vector) {
        return new Vector(this.e(1) - vector.e(1), this.e(2) - vector.e(2))
    }

    add(vector) {
        return new Vector(this.e(1) + vector.e(1), this.e(2) + vector.e(2))
    }

    multiply(k) {
        return new Vector(this.e(1) * k, this.e(2) * k)
    }

}