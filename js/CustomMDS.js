class CustomMDS extends CustomHTMLElement {
    constructor() {
        super();
        this.projectedData = [];
    }

    runComputation() {
        const data = this.transformData(this.data);
        let matrix = druid.Matrix.from(data);
        const mds = new druid.MDS(matrix);
        const output = mds.transform()._data;
        let result = [];
        for (let i = 0; i < output.length; i += 2) {
            const point = [output[i], output[i + 1]];
            const className = this.data[i / 2]['class'];
            result.push({'data': point, 'class': className});
        }
        this.projectedData = this.convertDataset(result);

    }

    update() {
        this.runComputation();

        this.rootEl.selectAll("*").remove();
        this.makeContainer();

        // Add X axis
        const x = d3
            .scaleLinear()
            .domain(d3.extent(this.projectedData, (d) => +d.x))
            .range([0, this.width - margin.left - margin.right]);

        // Add Y axis
        const y = d3
            .scaleLinear()
            .domain(d3.extent(this.projectedData, (d) => +d.y))
            .range([this.height, margin.top]);

        this.projectedData.forEach((d) => {
            d.xCoord = x(d.x);
            d.yCoord = y(d.y);
        });

        // Plot x axis
        this.d3Selection
            .append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(x).ticks(5));

        // Plot y axis
        this.d3Selection.append("g").call(d3.axisLeft(y).ticks(5));

        const dots = this.d3Selection.append("g");
        dots
            .selectAll("cicle")
            .data(this.projectedData)
            .enter()
            .append("circle")
            .attr("cx", (d) => d.xCoord)
            .attr("cy", (d) => d.yCoord)
            .attr("r", 4)
            .style("fill", (d) => this.colors[d.className]);
    }

    convertDataset(data) {
        return data.map((elem, i) => new DataNode(i, elem.data[0], elem.data[1], elem.class));
    }
}

window.customElements.define("mds-plot", CustomMDS);
