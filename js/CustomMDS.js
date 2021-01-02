class CustomMDS extends CustomHTMLElement{
    constructor() {
        super();
        this.projectedData = [];
    }

    runComputation() {
        const data = this.transformData(this.data);
        let mdsData = mdsjs.convertToMatrix(data, true);
        // TODO somehow MDS returns less rows/points than in the original data
        console.log(mdsData.rows());
        mdsjs.landmarkMDSAsync(mdsData, 2, function(points) {
            points.rowsIter(row => {
                console.log(row)
            })
        });
    }

    update() {
        this.runComputation();
    }
}

window.customElements.define("mds-plot", CustomMDS);
