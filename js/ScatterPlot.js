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

    // Add X axis
    var x = d3
      .scaleLinear()
      .domain([d3.min(xData), d3.max(xData)])
      .range([0, width - margin.left - margin.right]);

    this.d3Selection
      .append("g")
      .attr("transform", "translate(30," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain([d3.min(yData), d3.max(yData)])
      .range([height - margin.top - margin.bottom, 0]);
    this.d3Selection.append("g").attr("transform", "translate(30, 0)").call(d3.axisLeft(y));

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
      .attr('title', (d) => d.class)
      .attr("r", 1.5)
      .style("fill", "#69b3a2");
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
