// @ts-check
/**@type {import("d3")} (only for the type check) */

var d3 = globalThis.d3;

const colorArray = ['#FF6633', '#00B3E6', '#003050', '#4D80CC', '#9900B3', '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

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
    }

    update() {
        this.rootEl.selectAll("*").remove();
        this.makeContainer();

        const x = d3.scalePoint()
            .range([0, this.width])
            .padding(1)
            .domain(this.dimensionNames);

        let y = {}
        for (let i in this.dimensionNames) {
            let dim = this.dimensionNames[i];
            y[dim] = d3.scaleLinear()
                .domain(d3.extent(this.data, (d) => +d[dim]))
                .range([this.height, 0]);
        }

        const calculateLineCoordinates = (d) => {
            return d3.line()(this.dimensionNames.map((p) => [x(p), y[p](d[p])]));
        }

        this.d3Selection.selectAll("pcp-path")
            .data(this.data)
            .enter().append("path")
            .attr("d", calculateLineCoordinates)
            .style("fill", "none")
            .style("stroke", (line, i) => this.colors[line.class])
            .style("opacity", 0.5)

        this.d3Selection.selectAll("pcp-axis")
            .data(this.dimensionNames).enter()
            .append("g")
            .attr("transform", (d) => "translate(" + x(d) + ")")
            .each(function (d) {
                d3.select(this).call(d3.axisLeft().scale(y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -5)
            .text(d => this.shorten(d))
            .style("fill", "black")
    }

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
