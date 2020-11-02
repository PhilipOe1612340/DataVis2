/**@type {import("d3")} (only for the typecheck) */
var d3 = globalThis.d3;

const datasets = [
    "artificial.csv",
    "education.csv",
    "iris_labeled.csv",
    "mtcars.csv",
    "wine_labeled.csv"
]


// load datasets using the d3 csv method
const loadingDatasets = datasets.map((file) => d3.csv("/datasets/" + file));

// wait for all datasets to load
Promise.all(loadingDatasets).then(datasets => {

    datasets.forEach((d, i) => {
        console.log(`%cdataset ${i}:`, 'background: #222; color: #bada55');
        console.table(d[0]);
    });
});