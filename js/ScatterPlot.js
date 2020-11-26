// @ts-check
/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

const margin = {
  left: 50,
  right: 50,
  top: 10,
  bottom: 50,
};
const height = window.innerHeight * 0.8;
const width = window.innerWidth * 0.8;

class ScatterPlot extends HTMLElement {
  constructor() {
    super();
    /**
     * @type {DataNode[]}
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

  addMSTInformation() {
    const tree = new MST(this.data).calculate();
    this.data = tree.nodes;

    const outlying = new Scagnostics(tree.links).calculateOutlying();
    console.log("Outlying measure: " + outlying.measure);

    DataNode.bakeInLinkReferences(this.data);
    outlying.longEdges.forEach((i) => {
      if (i.target.degree === 1) {
        i.target.markAsOutlier();
      }
      if (i.source.degree === 1) {
        i.source.markAsOutlier();
      }
    });
  }

  update(showMst) {
    this.rootEl.selectAll("*").remove();
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

    this.data.forEach((d) => d.scale(x, y));

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
      .attr("transform", "translate(" + width / 2 + " ," + (height + margin.top + 30) + ")")
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
      this.addMSTInformation();
    } else {
      this.data.forEach((d) => (d.isOutlier = false));
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

    // Add dots layer
    const dots = this.d3Selection.append("g");

    // plot mst lines
    if (showMst) {
      dots
        .selectAll("line")
        .data(this.data)
        .enter()
        .each((d) => {
          for (const link of d.links) {
            dots
              .append("line")
              .attr("x1", link.source.xCoord)
              .attr("y1", link.source.yCoord)
              .attr("x2", link.target.xCoord)
              .attr("y2", link.target.yCoord)
              .attr("stroke-width", 1.5)
              .attr("opacity", 0.65)
              .attr("stroke", "black");
          }
        });
    } else {
      this.d3Selection.selectAll("line").remove();
    }

    dots
      .selectAll("cicle")
      .data(this.data)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.xCoord)
      .attr("cy", (d) => d.yCoord)
      .attr("r", 4)
      .style("stroke", (d) => (d.isOutlier ? "red" : ""))
      .style("stroke-width", "2px")
      .style("fill", (d) => this.colors[d.className])
      .on("mouseover", (event, d) => {
        const id = this.data.indexOf(d);
        tooltip.html(`<table>
                        <tr>
                        <td>Class:</td>
                        <td>${d.className}</td>
                        </tr>
                        <tr>
                        <td>ID:</td>
                        <td>${id}</td>
                        </tr>
                        <tr>
                        <td>Screen Pos:</td>
                        <td>(${event.pageX}, ${event.pageY})</td>
                        </tr>
                        <tr>
                        <td>Datapoint:</td>
                        <td>(${d.x.toFixed(1)}, ${d.y.toFixed(1)})</td>
                        </tr>
                        <tr>
                        <td>Degree:</td>
                        <td>${showMst ? d.degree : "??"}</td>
                        </tr>
                        </table>`);
        tooltip.transition().duration(0);
        tooltip.style("top", event.pageY - 27 + "px");
        tooltip.style("left", event.pageX + 15 + "px");
        tooltip.style("border", "2px solid " + this.colors[d.className]);
        tooltip.style("display", "block");
      })
      .on("mouseout", (d, i) => {
        tooltip.transition().delay(500).style("display", "none");
      });
  }

  /**
   * @param {DataNode[]} data
   */
  setDataset(data) {
    this.data = data;
    this.uniqueClasses = this.data.map((d) => d.className).filter((value, index, self) => self.indexOf(value) === index);
    // Assign random color to each class label
    this.colors = {};
    for (let c of this.uniqueClasses) {
      this.colors[c] = "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
    }
  }

  setDimensions(dimensionNames) {
    this.dimensionNames = dimensionNames;
  }
}

window.customElements.define("scatter-plot", ScatterPlot);
