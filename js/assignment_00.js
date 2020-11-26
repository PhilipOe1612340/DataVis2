// @ts-check

/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

const datasets = ["artificial_labeled.csv", "education_labeled.csv", "iris_labeled.csv", "mtcars_labeled.csv", "wine_labeled.csv"];
const loadedDatasets = {};

/**
 * @type {HTMLSelectElement}
 */
const sel = document.getElementById("select");
const nothing = document.createElement("option");
nothing.innerText = "select dataset";
sel.appendChild(nothing);

const mstCheckbox = document.getElementById("checkbox-mst");

function setDatasetFromHash(e) {
    sel.value = window.location.hash.substr(1);
    sel.dispatchEvent(new Event('change'));
}
window.onpopstate = window.history.onpushstate = setDatasetFromHash

customElements.whenDefined("scatter-plot").then(() => {
    document.body.appendChild(new ScatterPlot());

    datasets.forEach((d) => {
        const node = document.createElement("option");
        node.value = d;
        node.innerText = d;
        sel.appendChild(node);
    });
    setDatasetFromHash();
});


sel.addEventListener("change", async (e) => {
    const value = e.target.value;
    if (!value) return;
    const data = await loadData(value);
    showData(data);
    window.history.replaceState(value, 'Dataset: ' + value, '#' + value);
});

mstCheckbox.addEventListener("change", async (e) => {
    const plot = document.querySelector("scatter-plot");
    plot.update(mstCheckbox.checked);
})



/**
 *
 * @param {string} value
 */
async function loadData(value) {
    const data = loadedDatasets[value] || (await d3.csv("/datasets/" + value));

    // cache datasets
    if (!loadedDatasets[value]) {
        loadedDatasets[value] = data;
    }
    return data;
}

/**
 * @param {any[]} data
 */
function showData(data) {
    /**
     * @type {ScatterPlot}
     */
    const plot = document.querySelector("scatter-plot");
    const axes = Object.keys(data[0]);
    const hasClass = axes.includes("class");
    const dimensionNames = Object.values(data.columns).slice(0, 2);

    /**
     * @param {string | any[]} d
     */
    const firstDimensions = data.map((d) => {
        return { x: d[axes[0]], y: d[axes[1]], class: d[hasClass ? "class" : d[d.length - 1]] };
    });
    plot.setDataset(firstDimensions);
    plot.setDimensions(dimensionNames);
    plot.update(mstCheckbox.checked);
}
