// @ts-check

class HilbertVis extends CustomHTMLElement {
    constructor() {
        super();
    }


    runComputation() {
        const range = { start: 0, length: 40 };
        const order = 3;
        const layout = new HilbertLayout()
            .order(order)
            .layout(range)

        const path = layout.pathVertices.reduce((path, dir) => path + dir, 'M0 0L0 0');
        const mutate = `scale(${100/*layout.cellWidth */}) translate(${layout.startCell[0] + 0.5}, ${layout.startCell[1] + 0.5})`;

        console.log(path, mutate);
        this.d3Selection.append('path').attr('d', path).attr('transform', mutate);

        // this.d3Selection.select('path:not(.skeleton)')
        //     .transition().duration(order * 1000).ease(d3.easePoly)
        //     .attrTween('stroke-dasharray', tweenDash);

        // function tweenDash() {
        //     var l = this.getTotalLength(),
        //         i = d3.interpolateString("0," + l, l + "," + l);
        //     return function (t) { return i(t); };
        // }
    }

    update() {
        this.rootEl.selectAll("*").remove();
        this.makeContainer();
        this.runComputation();
    }

    convertDataset(data) {
        return data.map((elem, i) => new DataNode(i, elem.data[0], elem.data[1], elem.class));
    }
}

window.customElements.define("pix-plot", HilbertVis);


class HilbertLayout {
    constructor() {
        this._layout = {};
        this._canvasWidth = 1;
        this._order = 4;
        // this._simplifyCurves = true;
    }

    /**
     * @param {string | number} width
     */
    canvasWidth(width) {
        this._canvasWidth = +width;
        return this;
    };

    // Note: Maximum safe order is 26, due to JS numbers upper-boundary of 53 bits
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
    order(order) {
        this._order = +order;
        return this;
    };

    // simplifyCurves(simplify) {
    //     if (simplify === undefined) return this._simplifyCurves;
    //     this._simplifyCurves = simplify;
    //     return this;
    // };


    //rotate/flip a quadrant appropriately
    rotate(n, xy, rx, ry) {
        if (ry == 0) {
            if (rx == 1) {
                xy[0] = (n - 1 - xy[0]);
                xy[1] = (n - 1 - xy[1]);
            }

            //Swap x and y
            xy.push(xy.shift());
        }
    }

    // Note: this function will start breaking down for n > 2^26 (MAX_SAFE_INTEGER = 2^53)
    // x,y: cell coordinates, n: sqrt of num cells (square side size)
    point2Distance(x, y, n) {
        let rx, ry, d = 0,
            xy = [x, y];

        for (let s = n / 2; s >= 1; s /= 2) {
            rx = (xy[0] & s) > 0;
            ry = (xy[1] & s) > 0;
            d += s * s * ((3 * rx) ^ ry);
            this.rotate(s, xy, rx, ry);
        }
        return d;
    }

    // d: distance, n: sqrt of num cells (square side size)
    distance2Point(d, n) {
        let rx, ry, t = d,
            xy = [0, 0];

        for (let s = 1; s < n; s *= 2) {
            rx = 1 & (t / 2);
            ry = 1 & (t ^ rx);
            this.rotate(s, xy, rx, ry);

            xy[0] += (s * rx);
            xy[1] += (s * ry);
            t /= 4;
        }
        return xy;
    }

    getHilbertPath(start, length) {
        // nSide is on a binary boundary 2^0, 2^1, 2^2, ...
        const sideSize = 4
        let nSide = Math.pow(2, this._order),
            cellWidth = sideSize / nSide;

        let startCell = this.distance2Point(start, nSide),
            vertices = [],
            prevPnt = startCell,
            pnt;

        for (let i = 1; i < length; i++) {
            pnt = this.distance2Point(start + i, nSide);

            vertices.push(
                pnt[0] > prevPnt[0]
                    ? 'h1' // Right
                    : (pnt[0] < prevPnt[0]
                        ? 'h-1' // Left
                        : (pnt[1] > prevPnt[1]
                            ? 'v1' // Down
                            : 'v-1' // Up
                        )
                    )
            );

            prevPnt = pnt;
        }

        return {
            cellWidth: cellWidth,
            startCell: startCell,
            pathVertices: vertices
        };
    }

    layout(range) {
        const path = this.getHilbertPath(range.start, range.length);
        return { ...range, ...path };
    }

    getValAtXY(x, y) {
        const n = Math.pow(2, this._order);
        const xy = [x, y].map((coord) => Math.floor(coord * n / this._canvasWidth));
        return this.point2Distance(xy[0], xy[1], n);
    }

    getXyAtVal(val) {
        return this.distance2Point(val, Math.pow(2, this._order));
    }
}