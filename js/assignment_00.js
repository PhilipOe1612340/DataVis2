// @ts-check

/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

let selectedTab = 'pcp-tab';

const colorArray = ['#FF6633', '#00B3E6', '#003050', '#4D80CC', '#9900B3', '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
const datasets = ["artificial_labeled.csv", "education_labeled.csv", "iris_labeled.csv", "mtcars_labeled.csv", "wine_labeled.csv"];
let outlyingMeasures = [];

const sel = document.getElementById("select");
const nothing = document.createElement("option");
nothing.innerText = "select dataset";
sel.appendChild(nothing);

const mstCheckbox = document.getElementById("checkbox-mst");
const outlyingMeasureSlider = document.getElementById("outlying-slider");
const currentOutlyingMeasure = document.getElementById("current-outlying");

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
  if (selectedTab === 'scatterplot-tab') {
    showDataScatterPlot(data);
  } else {
    showDataParallelCoordinates(data);
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

/**
 * @param {string} value
 */
async function loadData(value) {
  return await d3.csv("/datasets/" + value);
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
  return plot.update(mstCheckbox.checked);
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