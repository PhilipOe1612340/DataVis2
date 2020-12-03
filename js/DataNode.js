class DataNode {
  /**
   * @param {number} id
   * @param {number | string} x
   * @param {number | string} y
   * @param {string} className
   */
  constructor(id, x, y, className) {
    this.id = id;
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.className = className;
    this.isOutlier = false;
    /**
     * @type {{weight: number, source: number | DataNode, target: number | DataNode}[]}
     */
    this.links = [];
  }

  scale(xScale, yScale) {
    this.xCoord = xScale(this.x);
    this.yCoord = yScale(this.y);
  }

  markAsOutlier() {
    this.isOutlier = true;
  }

  get degree() {
    return this.links.length;
  }

  /**
   * @param {any[] & {columns: string[]}} data
   */
  static convertDataset(data) {
    const axes = data.columns;
    const hasClass = axes.includes("class");
    return data.map((d, i) => new DataNode(i, d[axes[0]], d[axes[1]], d[hasClass ? "class" : d[d.length - 1]]));
  }

  /**
   *
   * @param {DataNode[]} dataset
   */
  static bakeInLinkReferences(dataset) {
    for (const dataPoint of dataset) {
      for (const link of dataPoint.links) {
        link.target = dataset.find((d) => d.id === link.target || d === link.target);
        link.source = dataset.find((d) => d.id === link.source || d === link.source);
      }
    }
  }
}
