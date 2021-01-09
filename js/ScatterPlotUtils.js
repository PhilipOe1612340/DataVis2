class ScatterPlotUtils {

    static drawScatterPlot(d3Selection, data, colors, plotConfig) {
        // Add X axis
        const x = d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => +d.x))
            .range([0, plotConfig.width - plotConfig.margin.left - plotConfig.margin.right]);

        // Add Y axis
        const y = d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => +d.y))
            .range([plotConfig.height, plotConfig.margin.top]);

        data.forEach((d) => {
            d.xCoord = x(d.x);
            d.yCoord = y(d.y);
        });

        // Plot x axis
        d3Selection
            .append("g")
            .attr("transform", "translate(0," + plotConfig.height + ")")
            .call(d3.axisBottom(x).ticks(5));

        // Plot y axis
        d3Selection.append("g").call(d3.axisLeft(y).ticks(5));

        const dots = d3Selection.append("g");
        dots
            .selectAll("cicle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", (d) => d.xCoord)
            .attr("cy", (d) => d.yCoord)
            .attr("r", 4)
            .style("fill", (d) => colors[d.className]);
    }
}