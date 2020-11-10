// @ts-check

const margin = {
    left: 50,
    right: 50,
    top: 10,
    bottom: 10,
};
const height = window.innerHeight * 0.8;
const width = window.innerWidth * 0.8;

class ScatterPlot extends HTMLElement {
    constructor() {
        super();
        /**
         * @type {{x: number, y: number, class: string}[]}
         */
        this.data = [];
        this.d3Selection = d3.select(this).append("svg");
        this.onresize = this.resize;
        this.style.margin = `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`;
        this.style.width = "80vw";
    }

    resize() {
        this.d3Selection
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    update() {
        this.resize();
        const xData = this.data.map((d) => d.x);
        const yData = this.data.map((d) => d.y);

        const uniqueClasses = this.data.map(d => d.class)
            .filter((value, index, self) => self.indexOf(value) === index);
        // Assign random color to each class label
        let colors = {};
        for (let c of uniqueClasses) {
            colors[c] = "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
        }

        // Add X axis
        const x = d3
            .scaleLinear()
            .domain([d3.min(xData), d3.max(xData)])
            .range([0, width - margin.left - margin.right]);

        // Add Y axis
        const y = d3
            .scaleLinear()
            .domain([d3.min(yData), d3.max(yData)])
            .range([height - margin.top - margin.bottom, 0]);
        this.d3Selection.append("g").attr("transform", "translate(30, 0)").call(d3.axisLeft(y));

        // Add tooltip
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "plot-tooltip")
            .on("mouseover", function (d, i) {
                tooltip.transition().duration(0);
            })
            .on("mouseout", function (d, i) {
                tooltip.style("display", "none");
            });

        // Add dots
        this.d3Selection
            .append("g")
            .selectAll("dot")
            .data(this.data)
            .enter()
            .append("circle")
            .attr("cx", (d) => x(d.x) + 30)
            .attr("cy", (d) => y(d.y))
            .text((d) => d.class)
            .attr("title", (d) => d.class)
            .attr("r", 4)
            .style("fill", (d, i) => colors[d.class])
            .on("mouseover", (event, d) => {
                const id = this.data.indexOf(d);
                tooltip.html(`<table>
                        <tr>
                        <td>Class:</td>
                        <td style="text-align: right">${d.class}</td>
                        </tr>
                        <tr>
                        <td>ID:</td>
                        <td style="text-align: right">${id}</td>
                        </tr>
                        <tr>
                        <td>Screen Pos:</td>
                        <td style="text-align: right">(${event.pageX}, ${event.pageY})</td>
                        </tr>
                        <tr>
                        <td>Datapoint:</td>
                        <td style="text-align: right">(${parseFloat(d.x).toFixed(1)}, ${parseFloat(d.y).toFixed(1)})</td>
                        </tr>
                        </table>`)
                tooltip.transition().duration(0);
                tooltip.style("top", (event.pageY - 27) + "px");
                tooltip.style("left", (event.pageX + 15) + "px");
                tooltip.style("border", "2px solid " + colors[d.class])
                tooltip.style("display", "block");
            })
            .on("mouseout", (d, i) => {
                tooltip.transition()
                    .delay(500)
                    .style("display", "none");
            });

    }

    /**
     * @param {{x: number, y: number, class: string}[]} data
     */
    setDataset(data) {
        this.data = data;
        this.d3Selection.selectAll("*").remove();
    }
}

window.customElements.define("scatter-plot", ScatterPlot);
