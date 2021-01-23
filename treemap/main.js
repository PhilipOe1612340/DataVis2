// @ts-check

/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

async function onLoad() {
    const flare = await d3.json('./flare.json');
    const el = document.getElementById('treemap');
    const root = d3.hierarchy(flare);
    treeView(el, root);
}

onLoad();

function treeView(element, hierarchy) {
    const width = 800, height = 600;
    const svg = d3.select(element).append('svg')
        .attr('width', width)
        .attr('height', height);

    const spaces = assignSpace(hierarchy, width, height);
    const colorScale = d3.scaleSequential().domain([0, 1]).interpolator(d3.interpolateViridis);

    // Add tooltip
    const tooltip = d3
        .select('#treemap')
        .append('div')
        .attr('class', 'plot-tooltip')
        .on('mouseover', () => {
            tooltip.transition().duration(0);
        })
        .on('mouseout', () => {
            tooltip.style('display', 'none');
        });

    svg.selectAll('rect')
        .data(spaces)
        .enter()
        .append('rect')
        .attr('width', (d) => d.width)
        .attr('height', (d) => d.height)
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .style('stroke', 'black')
        .style('stroke-width', 1)
        .style('fill', (d) => colorScale(d.index))
        .on('mouseover', (event, d, i) => {
            tooltip.html(`<table>
                <tr>
                    <td>Name:</td>
                    <td>${d.name}</td>
                </tr>
                <tr>
                    <td>Depth:</td>
                    <td>${d.depth}</td>
                </tr>
                <tr>
                    <td>Value:</td>
                    <td>${d.value}</td>
                </tr>
                 <tr>
                    <td>Siblings:</td>
                    <td>${d.numSiblings}</td>
                </tr>
                </table>`
            );
            tooltip.transition().duration(0);
            tooltip.style('top', event.pageY - 27 + 'px');
            tooltip.style('left', event.pageX + 15 + 'px');
            tooltip.style('display', 'block');
        })
        .on('mouseout', () => {
            tooltip.style('display', 'none');
        });
}


/**
 * recursively assign space to child nodes based on their value
 * @param {d3.HierarchyNode < {name: string, value: number} >} hierarchy
 * @param {number} rootWidth
 * @param {number} rootHeight
 * @param {number} rootX
 * @param {number} rootY
 * @param {boolean} rotate
 * @param {number} index
 * @returns {{
                name: string,
                x: number,
                y: number,
                width: number,
                height: number,
                depth: number,
                value: number,
                numSiblings: number,
                index: number
            }[]}
 */
function assignSpace(hierarchy, rootWidth, rootHeight, rootX = 0, rootY = 0, rotate = false, index = 0) {
    if (!hierarchy.children || hierarchy.children.length === 0) {
        return [{
            name: hierarchy.data.name,
            x: rootX,
            y: rootY,
            width: rootWidth,
            height: rootHeight,
            depth: hierarchy.depth,
            value: hierarchy.data.value,
            numSiblings: hierarchy.parent.children.length - 1,
            index
        }];
    }

    const rootValue = getChildValue(hierarchy);
    let other = 0;
    return hierarchy.children
        .map(c => [c, getChildValue(c)])    // include values
        .sort((a, b) => a[1] - b[1])        // sort
        // @ts-ignore
        .flatMap(([c, val], i, t) => {      // assign space based on ratio
            // calculate the ratio of the parent element
            const ratio = val / rootValue;
            if (rotate) {
                const height = rootHeight * ratio;
                other += height;
                return assignSpace(c, rootWidth, height, rootX, rootY + other - height, !rotate, i / t.length);
            } else {
                const width = rootWidth * ratio;
                other += width;
                return assignSpace(c, width, rootHeight, rootX + other - width, rootY, !rotate, i / t.length);
            }
        })
}

/**
 * sum up value of every child node
 * @param {d3.HierarchyNode < {name: string, value: number} >} hierarchy
 */
function getChildValue(hierarchy) {
    if (hierarchy.children) {
        return hierarchy.children.reduce((sum, child) => sum + getChildValue(child), 0);
    }
    return hierarchy.data.value;
}