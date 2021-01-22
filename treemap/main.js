// @ts-check

/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

/**@type {import("jquery")} (only for the type check) */
// @ts-ignore
var $ = window.$;

async function onLoad() {
    const flare = await d3.json('./flare.json');
    const el = document.getElementById('treemap');
    const root = d3.hierarchy(flare)
    treeView(el, root);
}

onLoad();

function treeView(element, hierarchy) {
    const svg = d3.select(element).append("svg")
        .attr("width", 800)
        .attr("height", 600);

    const spaces = assignSpace(hierarchy, 800, 600, 0, 0, false).sort((sq1, sq2) => sq1.depth - sq2.depth);

    svg.selectAll('rect')
        .data(spaces)
        .enter()
        .append('rect')
        .attr('width', (d) => d.width)
        .attr('height', (d) => d.height)
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .style('stroke', '#9aa6cc')
        .style('stroke-width', 1)
        .style('fill', (d) => `hsl(${d.index * 50 + 200}, ${d.index * 100}%, ${d.index * 90}%)`)
        .html(d => d.name);
}


/**
 * recursively assign space to child nodes based on their value
 * @param {d3.HierarchyNode<{name: string, value: number}>} hierarchy 
 * @param {number} rootWidth 
 * @param {number} rootHeight 
 * @param {number} rootX 
 * @param {number} rootY 
 * @param {boolean} rotate
 * @param {number} index
 * @returns {{name: string, x: number, y: number, width: number, height: number, depth: number, index: number}[]}
 */
function assignSpace(hierarchy, rootWidth, rootHeight, rootX, rootY, rotate, index = 0) {
    if (!hierarchy.children || hierarchy.children.length === 0) {
        return [{ name: hierarchy.data.name, x: rootX, y: rootY, width: rootWidth, height: rootHeight, depth: hierarchy.depth, index }];
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
 * @param {d3.HierarchyNode<{name: string, value: number}>} hierarchy 
 */
function getChildValue(hierarchy) {
    if (hierarchy.children) {
        return hierarchy.children.reduce((sum, child) => sum + getChildValue(child), 0);
    }
    return hierarchy.data.value;
}