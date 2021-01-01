class CustomHTMLElement extends HTMLElement {
    constructor() {
        super();
        const margin = {
            left: 10,
            right: 10,
            top: 30,
            bottom: 30,
        };
        this.data = [];
        this.dimensionNames = null;
        this.rootEl = d3.select(this).append("svg");
        this.style.margin = `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`;
        // this.style.width = "100%";
        this.d3Selection = undefined;

        this.height = window.innerHeight - margin.top - margin.bottom;
        this.width = window.innerWidth  - margin.right - margin.left;
        console.log(this.height, this.width)
    }

    makeContainer() {
        this.d3Selection = this.rootEl
            .attr("width", this.width + margin.left + margin.right)
            .attr("height", this.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    setDataset(data) {
        this.data = data;
        this.uniqueClasses = this.data.map((d) => d.className).filter((value, index, self) => self.indexOf(value) === index);

        this.colors = {};
        for (let i = 0; i < this.uniqueClasses.length; i++) {
            const c = this.uniqueClasses[i];
            this.colors[c] = colorArray[i];
        }
    }

    setDimensions(dimensionNames) {
        this.dimensionNames = dimensionNames;
    }
}