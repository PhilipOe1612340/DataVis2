// @ts-check

/**@type {import("d3")} (only for the type check) */
// @ts-ignore
var d3 = globalThis.d3;

const datasets = ["artificial_labeled.csv", "education_labeled.csv", "iris_labeled.csv", "mtcars_labeled.csv", "wine_labeled.csv"];
const loadedDatasets = {};
let outlyingMeasures = [];

const sel = document.getElementById("select");
const nothing = document.createElement("option");
nothing.innerText = "select dataset";
sel.appendChild(nothing);

const mstCheckbox = document.getElementById("checkbox-mst");
const outlyingSlider = document.getElementById("outlying-range");
const currentOutlying = document.getElementById("current-outlying");

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
  const value = e.target.value;
  if (!value) return;
  const data = await loadData(value);
  showData(data);
  outlyingSlider.setAttribute("min", 100);
  outlyingSlider.setAttribute("max", 200);

  window.history.replaceState(value, "Dataset: " + value, "#" + value);
});

mstCheckbox.addEventListener("change", async (e) => {
  showData();
});

outlyingSlider.addEventListener("change", async (e) => {
  currentOutlying.innerText = "Outlying measure: " + outlyingSlider.value;

})

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
function showData(data) {
  clearContainer();
  outlyingMeasures = [];

  const axes = data.columns;
  const hasClass = axes.includes("class");
  const classDimension = axes.find((dim, i) => hasClass ? dim === 'class' : i === axes.length - 1);
  data.columns = data.columns.filter(d => d !== classDimension);
  document.documentElement.style.setProperty('--grid', '1fr '.repeat(data.columns.length));

  makeDataMatrix(data).forEach(dim => {
    data.columns = [...dim, classDimension];
    const dataset = DataNode.convertDataset(data)
    addNewPlot(dataset, data.columns, axes.length);
  })

}

/**
 * 
 * @param {DataNode[]} dataset
 * @param {string[]} dimensions
 */
function addNewPlot(dataset, dimensions, size) {
  const plot = document.getElementById('plotContainer').appendChild(new ScatterPlot(size));

  plot.setDataset(dataset);
  plot.setDimensions(dimensions);
  plot.update(mstCheckbox.value);
}

/**
 *
 * @param {any[] & {columns: string[]}} data
 * @returns {string[][]}
 */
function makeDataMatrix(data) {
  const matrix = data.columns.flatMap((dim1, _i, all) => all.map(dim2 => [dim1, dim2]));
  matrix.forEach(([dim1, dim2]) => {
    if(dim1 === dim2){

    }
    
  });
  return matrix;
}

function clearContainer() {
  const el = document.getElementById('plotContainer');
  Array.from(el.children).forEach(child => child.remove());
}