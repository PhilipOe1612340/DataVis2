class CustomTSNE extends CustomHTMLElement {
    constructor(perplexity, learningRate, nIter) {
        super();
        this.model = new TSNE({
            dim: 2,
            perplexity: perplexity,
            earlyExaggeration: 4.0,
            learningRate: learningRate,
            nIter: nIter,
            metric: 'euclidean'
        })
    }

    update() {

    }
}
window.customElements.define("t-sne-plot", CustomTSNE);
