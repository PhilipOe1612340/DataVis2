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
        clearContainer('pcp-container');
        this.d3Selection = this.rootEl
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    }

    update() {
        this.rootEl.selectAll("*").remove();
        this.makeContainer();

        let g = this.rootEl.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        const x = d3.scalePoint()
            .range([0, this.width])
            .padding(1)
            .domain(this.dimensionNames);

        let y = {}
        for (let i in this.dimensionNames) {
            let dim = this.dimensionNames[i]
            y[dim] = d3.scaleLinear()
                .domain(d3.extent(data, function (d) {
                    return +d[dim];
                }))
                .range([this.height, 0])
        }

        const calculateLineCoordinates = (d) => {
            return d3.line()(this.dimensionNames.map((p) => {
                return [x(p), y[p](d[p])];
            }));
        }

        g.selectAll("pcp-path")
            .data(data)
            .enter().append("path")
            .attr("d", calculateLineCoordinates)
            .style("fill", "none")
            .style("stroke", "#69b3a2")
            .style("opacity", 0.5)

        // Draw the axis:
        g.selectAll("pcp-axis")
            // For each dimension of the dataset I add a 'g' element:
            .data(this.dimensionNames).enter()
            .append("g")
            // I translate this element to its right position on the x axis
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            })
            // And I build the axis with the call function
            .each((d) => {
                d3.select(this).call(d3.axisLeft().scale(y[d]));
            })
            // Add axis title
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text( (d) => {
                return d;
            })
            .style("fill", "black")


    }

    setDimensions(dimensionNames) {
        this.dimensionNames = dimensionNames;
    }
}