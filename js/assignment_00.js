// @ts-check
/**@type {import("d3")} (only for the type check) */
var d3 = globalThis.d3;

const btn = document.getElementById("button");
btn.addEventListener("click", loadData);

async function loadData() {
  const datasetNames = ["artificial_labeled.csv", "education_labeled.csv", "iris_labeled.csv", "mtcars_labeled.csv", "wine_labeled.csv"];

  // load datasets using the d3 csv method
  const loadingDatasets = datasetNames.map((file) => d3.csv("/datasets/" + file));

  // wait for all datasets to load
  const datasets = await Promise.all(loadingDatasets);

  datasets.forEach((d, i) => {
    console.log(`%cdataset ${i}:`, "background: #222; color: #bada55");
    console.table(d[0]);
  });

  alert('Datasets loaded. Check console to see the results.')
}
