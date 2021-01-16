// @ts-check

class HilbertVis extends CustomHTMLElement {
    constructor() {
        super();
    }

    runComputation() {
        const order = 6;
        const range = { start: 0, length: Math.pow(2, order) * 8 };
        const layout = new HilbertLayout().order(order).getHilbertPath(range);

        const path = layout.vertices.reduce((path, dir) => path + dir, 'M0 0L0 0');
        const mutate = `scale(${20}) translate(${layout.startCell[0] + 0.5}, ${layout.startCell[1] + 0.5})`;

        // TODO: change from path to pixel display
        this.d3Selection.append('path').attr('d', path).attr('transform', mutate);
    }

    update() {
        this.rootEl.selectAll("*").remove();
        this.makeContainer();
        this.runComputation();
    }
}

window.customElements.define("pix-plot", HilbertVis);


class HilbertLayout {
    constructor() {
        this._order = 4;
    }

    order(order) {
        this._order = +order;
        return this;
    };

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

    getHilbertPath({ length, start }) {
        const nSide = Math.pow(2, this._order);
        const startCell = this.distance2Point(start, nSide);
        const vertices = [];

        let prevPoint = startCell;
        let pnt;

        for (let i = 1; i < length; i++) {
            
            pnt = this.distance2Point(start + i, nSide);

            vertices.push(
                pnt[0] > prevPoint[0]
                    ? 'h1' // Right
                    : (pnt[0] < prevPoint[0]
                        ? 'h-1' // Left
                        : (pnt[1] > prevPoint[1]
                            ? 'v1' // Down
                            : 'v-1' // Up
                        )
                    )
            );

            prevPoint = pnt;
        }

        return { start, length, startCell, vertices }
    }

    getValAtXY(x, y) {
        const n = Math.pow(2, this._order);
        const xy = [x, y].map((coord) => coord * n);
        return this.point2Distance(xy[0], xy[1], n);
    }

    getXyAtVal(val) {
        return this.distance2Point(val, Math.pow(2, this._order));
    }
}