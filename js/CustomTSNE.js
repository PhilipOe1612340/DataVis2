class CustomTSNE extends CustomHTMLElement {
    constructor(perplexity, learningRate, nIter) {
        super();
        this.data = [];
        this.projectedData = [];
        this.model = this.updateModel(perplexity, learningRate, nIter);
    }

    updateModel(perplexity, learningRate, nIter) {
        this.model = new TSNE({
            dim: 2,
            perplexity: perplexity,
            earlyExaggeration: 4.0,
            learningRate: learningRate,
            nIter: nIter,
            metric: 'euclidean'
        });
    }

    update() {
        this.updateModel(perplexity, learningRate, nIter);
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

    runComputation() {
        const data = this.transformData(this.data);
        this.model.init({
            data: data,
            type: 'dense'
        });
        let [error, iter] = this.model.run();
        let output = this.model.getOutput();
        let result = [];
        for (let i in output) {
            const point = output[i];
            const className = this.data[i]['class'];
            result.push({'data': point, 'class': className});
        }
        this.projectedData = this.convertDataset(result);
    }

    transformData(data) {
        let result = [];
        data.map((elem) => {
            let values = [];
            Object.keys(elem).forEach(key => {
                if (key !== 'class') {
                    values.push(elem[key]);
                }
            });
            result.push(values);
        });
        return result;
    }

    convertDataset(data) {
        return data.map((elem, i) => new DataNode(i, elem.data[0], elem.data[1], elem.class));
    }
}

window.customElements.define("t-sne-plot", CustomTSNE);
