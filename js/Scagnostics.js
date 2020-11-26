class Scagnostics {
  constructor(data) {
    this.data = data;
  }

  calculateOutlying() {
    const weights = this.data.map((elem) => elem.weight);

    const q25 = this.quantile(weights, 0.25);
    const q75 = this.quantile(weights, 0.75);

    const longEdges = [];
    this.data.map((elem) => {
      if (elem.weight > q75 + 1.5 * (q75 - q25)) {
        longEdges.push(elem);
      }
    });

    const overallEdgesSum = weights.reduce((a, b) => a + b, 0);
    const longEdgesSum = longEdges.reduce((a, b) => a.weight + b.weight, 0);
    return { measure: longEdgesSum / overallEdgesSum, longEdges };
  }

  quantile(arr, q) {
    const asc = (arr) => arr.sort((a, b) => a - b);
    const sorted = asc(arr);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  }
}
