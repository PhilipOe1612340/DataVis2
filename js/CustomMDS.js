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
        let plotConfig = {
            width: this.width,
            height: this.height,
            margin: margin
        }
        ScatterPlotUtils.drawScatterPlot(this.d3Selection, this.projectedData, this.colors, plotConfig);
    }

    convertDataset(data) {
        return data.map((elem, i) => new DataNode(i, elem.data[0], elem.data[1], elem.class));
    }
}

window.customElements.define("mds-plot", CustomMDS);
