// @ts-check

/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

let selectedTab = 'pcp-tab';

const colorArray = ['#FF6633', '#00B3E6', '#003050', '#4D80CC', '#9900B3', '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
const datasets = ["artificial_labeled.csv", "education_labeled.csv", "iris_labeled.csv", "mtcars_labeled.csv", "wine_labeled.csv"];
let outlyingMeasures = [];
const loadedDatasets = {};
let valueAlpha = 0.125;
let valueBeta = 0.5;

const sel = document.getElementById("select");
const nothing = document.createElement("option");
nothing.innerText = "select dataset";
sel.appendChild(nothing);

const mstCheckbox = document.getElementById("checkbox-mst");
const outlyingMeasureSlider = document.getElementById("outlying-slider");
const currentOutlyingMeasure = document.getElementById("current-outlying");

// T-SNE values
let nIter = 100;
let learningRate = 150;
let perplexity = 15;
let tSneModel = null;

function readDatasetFromHash() {
    sel.value = window.location.hash.substr(1);
    sel.dispatchEvent(new Event("change"));
}

window.onpopstate = window.history.onpushstate = readDatasetFromHash;

customElements.whenDefined("scatter-plot").then(() => {
    datasets.forEach((d) => {
        const node = document.createElement("option");
        node.value = d;
        node.innerText = d;
        sel.appendChild(node);
    });
    readDatasetFromHash();
});


sel.addEventListener("change", async (e) => {
    $('#plot-tabs a').on('show.bs.tab', (e) => {
        selectedTab = e.target.id;
        sel.dispatchEvent(new Event("change"));
    })
    const value = e.target.value;
    if (!value) return;
    const data = await loadData(value);
    switch (selectedTab) {
        // Not calling the functions for TSNE and MDS because they have a button
        case "pcp-tab": {
            showDataParallelCoordinates(data);
            break;
        }
        case "scatterplot-tab": {
            showDataScatterPlot(data);
            break;
        }
        case "mds-tab": {
            showDataMDS(data);
            break;
        }
        case "pixel-tab": {
            showHilbert(data);
            break;
        }
    }
    window.history.replaceState(value, "Dataset: " + value, "#" + value);
});

mstCheckbox.addEventListener("change", async (e) => {
    const data = await loadData(window.location.hash.substr(1));
    if (selectedTab === 'scatterplot-tab') {
        showDataScatterPlot(data);
    } else {
        showDataParallelCoordinates(data);
    }
    readDatasetFromHash();
});

const sliderAlpha = document.getElementById('alphaSlider');
sliderAlpha.addEventListener('input', () => {
    valueAlpha = sliderAlpha.value;
    document.getElementById('alphaLabel').innerHTML = "&alpha; = " + valueAlpha;
    updateSliders();
})
const sliderBeta = document.getElementById('betaSlider');
sliderBeta.addEventListener('input', () => {
    valueBeta = sliderBeta.value;
    document.getElementById('betaLabel').innerHTML = "&beta; = " + valueBeta;
    updateSliders();
})

// T-SNE controls
const tSneIterSlider = document.getElementById("iterations-slider");
tSneIterSlider.addEventListener("input", () => {
  nIter = tSneIterSlider.value;
  document.getElementById("iterations-label").innerHTML = "Iterations = "+ nIter;
});
const tSnePerplexitySlider = document.getElementById("perplexity-slider");
tSnePerplexitySlider.addEventListener("input", () => {
  perplexity = tSnePerplexitySlider.value;
  document.getElementById("perplexity-label").innerHTML = "Perplexity = "+ perplexity;
})
const tSneLearningRateSlider = document.getElementById("epsilon-slider");
tSneLearningRateSlider.addEventListener("input", () => {
  learningRate = tSneLearningRateSlider.value;
  document.getElementById("epsilon-label").innerHTML = "&epsilon; = "+ learningRate;
});
const tSneStartButton = document.getElementById("project-t-sne");
tSneStartButton.addEventListener("click", async () => {
    const data = await loadData(sel.value);
    showDataTSNE(data);
});

async function updateSliders() {
    const data = await loadData(window.location.hash.substr(1));
    showDataParallelCoordinates(data);
}


/**
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
 * @param {any[] & {columns: string[]}} data
 */
function showDataScatterPlot(data) {
    clearContainer('scatterplot-container');
    outlyingMeasures = [];

    const axes = data.columns;
    const hasClass = axes.includes("class");
    const classDimension = axes.find((dim, i) => hasClass ? dim === 'class' : i === axes.length - 1);
    data.columns = data.columns.filter(d => d !== classDimension);
    document.documentElement.style.setProperty('--grid', '1fr '.repeat(data.columns.length));

    makeDataMatrix(data).forEach(dim => {
        data.columns = [...dim, classDimension];
        const dataset = DataNode.convertDataset(data);
        let plotOutlyingMeasure = addNewPlot(dataset, data.columns, axes.length);
        outlyingMeasures.push(parseFloat(plotOutlyingMeasure).toFixed(2));
    });

    outlyingMeasureSlider.min = Math.min(...outlyingMeasures).toString();
    outlyingMeasureSlider.max = Math.max(...outlyingMeasures).toString()
    outlyingMeasureSlider.step = "0.01";
    outlyingMeasureSlider.value = Math.max(...outlyingMeasures).toString();

    currentOutlyingMeasure.innerText = "Outlying measure: " + outlyingMeasureSlider.value;

    outlyingMeasureSlider.addEventListener("change", async (e) => {
        let plots = document.getElementById('scatterplot-container').children;
        for (let i = 0; i < plots.length; i++) {
            plots[i].className = "";
        }
        currentOutlyingMeasure.innerText = "Outlying measure: " + outlyingMeasureSlider.value;
        const maxOutlying = parseFloat(outlyingMeasureSlider.value);
        let plotIndexesToHide = outlyingMeasures.map((elem, idx) => elem > maxOutlying ? idx : '').filter(String);
        plotIndexesToHide.map((idx) => plots[idx].className = "faded");
    })


}

function showDataParallelCoordinates(data) {
    clearContainer('pcp-container');

    const plot = document.getElementById('pcp-container').appendChild(new ParallelCoordinates());

    plot.setDimensions(data.columns);
    plot.setDataset(data);
    return plot.update(valueAlpha, valueBeta);
}

function showDataTSNE(data) {
    clearContainer("t-sne-container");
    tSneModel = new CustomTSNE(perplexity, learningRate, nIter);
    const plot = document.getElementById("t-sne-container").appendChild(tSneModel);
    plot.setDimensions(data.columns);
    plot.setDataset(data);
    return plot.update();
}

function showHilbert(data){
    clearContainer("pix-container");

    const axes = data.columns;
    const hasClass = axes.includes("class");
    const classDimension = axes.find((dim, i) => hasClass ? dim === 'class' : i === axes.length - 1);
    data.columns = data.columns.filter(d => d !== classDimension);
    document.documentElement.style.setProperty('--grid', '1fr '.repeat(data.columns.length));

    data.columns.forEach(dim => {
        let dataset = data.map(e => parseFloat(e[dim])); // Get data for current dimension
        addNewHilbert(dataset, data.columns, axes.length, dim);
    });
}

function showDataMDS(data){
    clearContainer("mds-container");
    const plot = document.getElementById("mds-container").appendChild(new CustomMDS());
    plot.setDimensions(data.columns);
    plot.setDataset(data);
    return plot.update();
}

/**
 *
 * @param {DataNode[]} dataset
 * @param {string[]} dimensions
 * @param size
 */
function addNewPlot(dataset, dimensions, size) {
    const plot = document.getElementById('scatterplot-container').appendChild(new ScatterPlot(size));

    plot.setDataset(dataset);
    plot.setDimensions(dimensions);
    return plot.update(mstCheckbox.checked);
}

// TODO merge this and previous function into one
function addNewHilbert(dataset, dimensions, size, currentDim) {
    const plot = document.getElementById("pix-container").appendChild(new HilbertVis(size, currentDim));
    plot.setDataset(dataset);
    plot.setDimensions(dimensions);
    return plot.update();
}

/**
 *
 * @param {any[] & {columns: string[]}} data
 * @returns {string[][]}
 */
function makeDataMatrix(data) {
    const matrix = data.columns.flatMap((dim1, _i, all) => all.map(dim2 => [dim1, dim2]));
    return matrix;
}

function clearContainer(elementId) {
    const el = document.getElementById(elementId);
    Array.from(el.children).forEach(child => child.remove());
}