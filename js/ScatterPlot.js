// @ts-check
/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

const margin = {
  left: 50,
  right: 50,
  top: 10,
  bottom: 30,
};
const height = window.innerHeight * 0.8;
const width = window.innerWidth * 0.8;

class ScatterPlot extends HTMLElement {
  constructor() {
    super();
    /**
     * @type {{x: string, y: string, class: string}[]}
     */
    this.data = [];
    this.dimensionNames = null;
    this.rootEl = d3.select(this).append("svg");
    this.style.margin = `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`;
    this.style.width = "80vw";
    this.d3Selection = undefined;
  }

  makeContainer() {
    this.d3Selection = this.rootEl
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }

  plotMST(x, y) {
    const tree = new MST(this.data).calculate();
    tree.links.forEach((link) => {
      const source = tree.nodes.find((g) => g.id === link.source);
      const target = tree.nodes.find((g) => g.id === link.target);
      this.d3Selection
        .append("line")
        .attr("x1", x(source.x))
        .attr("y1", y(source.y))
        .attr("x2", x(target.x))
        .attr("y2", y(target.y))
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.65)
        .attr("stroke", "black");
    });
    const outlying = new Scagnostics(tree.links).calculateOutlying();
    console.log("Outlying measure: " + outlying);
  }

  update(showMst) {
    this.makeContainer();

    // Add X axis
    const x = d3
      .scaleLinear()
      .domain(d3.extent(this.data, (d) => +d.x))
      .range([0, width - margin.left - margin.right]);

    // Add Y axis
    const y = d3
      .scaleLinear()
      .domain(d3.extent(this.data, (d) => +d.y))
      .range([height, margin.top]);

    // Plot x axis
    this.d3Selection
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5));
    
    // Plot y axis
    this.d3Selection.append("g").call(d3.axisLeft(y).ticks(5));

    // Set label for the X axis
    this.rootEl
      .append("text")
      .attr("transform", "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .text(this.dimensionNames[0]);

    // Set label for the Y axis
    this.rootEl
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", height / -2)
      .attr("y", 0)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(this.dimensionNames[1]);

    // Plot Minimum Spanning Tree if wanted
    if (showMst) {
      this.plotMST(x, y);
    } else {
      this.d3Selection.selectAll("line").remove();
    }

    // Add tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "plot-tooltip")
      .on("mouseover", (d, i) => {
        tooltip.transition().duration(0);
      })
      .on("mouseout", (d, i) => {
        tooltip.style("display", "none");
      });

    // Add dots
    this.d3Selection
      .append("g")
      .selectAll("dot")
      .data(this.data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(+d.x))
      .attr("cy", (d) => y(+d.y))
      .text((d) => d.class)
      .attr("title", (d) => d.class)
      .attr("r", 4)
      .style("fill", (d, i) => this.colors[d.class])
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
                        </table>`);
        tooltip.transition().duration(0);
        tooltip.style("top", event.pageY - 27 + "px");
        tooltip.style("left", event.pageX + 15 + "px");
        tooltip.style("border", "2px solid " + this.colors[d.class]);
        tooltip.style("display", "block");
      })
      .on("mouseout", (d, i) => {
        tooltip.transition().delay(500).style("display", "none");
      });
  }

  /**
   * @param {{x: string, y: string, class: string}[]} data
   */
  setDataset(data) {
    this.data = data;
    this.uniqueClasses = this.data.map((d) => d.class).filter((value, index, self) => self.indexOf(value) === index);
    // Assign random color to each class label
    this.colors = {};
    for (let c of this.uniqueClasses) {
      this.colors[c] = "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
    }
    this.rootEl.selectAll("*").remove();
  }

  setDimensions(dimensionNames) {
    this.dimensionNames = dimensionNames;
  }
}

window.customElements.define("scatter-plot", ScatterPlot);
