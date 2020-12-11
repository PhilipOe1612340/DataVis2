// @ts-check
/**@type {import("d3")} (only for the type check) */
// @ts-ignore

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
            left: 35,
            right: 0,
            top: 10,
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
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
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
            let dim = this.dimensionNames[i]
            y[dim] = d3.scaleLinear()
                .domain(d3.extent(this.data,  (d) => {
                    return +d[dim];
                }))
                .range([this.height, 0])
        }

        const calculateLineCoordinates = (d) => {
            return d3.line()(this.dimensionNames.map((p) => {
                return [x(p), y[p](d[p])];
            }));
        }

        this.d3Selection.selectAll("pcp-path")
            .data(this.data)
            .enter().append("path")
            .attr("d", calculateLineCoordinates)
            .style("fill", "none")
            .style("stroke", "#69b3a2")
            .style("opacity", 0.5)

        this.d3Selection.selectAll("pcp-axis")
            .data(this.dimensionNames).enter()
            .append("g")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            })
            .each((d) => {
                d3.select(this).call(d3.axisLeft().scale(y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", 2)
            .text( (d) => {
                return d;
            })
            .style("fill", "black")


    }

    setDataset(data) {
        this.data = data;
        this.uniqueClasses = this.data.map((d) => d.className).filter((value, index, self) => self.indexOf(value) === index);
        // Assign random color to each class label
        this.colors = {};
        for (let c of this.uniqueClasses) {
            this.colors[c] = "#00" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 4);
        }
    }

    setDimensions(dimensionNames) {
        this.dimensionNames = dimensionNames;
    }
}

window.customElements.define("pcp-plot", ParallelCoordinates);
