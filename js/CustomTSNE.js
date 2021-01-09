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
        let plotConfig = {
            width: this.width,
            height: this.height,
            margin: margin
        }
        ScatterPlotUtils.drawScatterPlot(this.d3Selection, this.projectedData, this.colors, plotConfig);
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

    convertDataset(data) {
        return data.map((elem, i) => new DataNode(i, elem.data[0], elem.data[1], elem.class));
    }
}

window.customElements.define("t-sne-plot", CustomTSNE);
