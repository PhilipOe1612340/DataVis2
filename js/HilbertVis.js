// @ts-check
const Directions = Object.freeze({ RIGHT: 1, LEFT: 2, UP: 3, DOWN: 4 });

class HilbertVis extends CustomHTMLElement {
    constructor(size, dimName) {
        super();
        const margin = {
            left: 35,
            right: 0,
            top: 30,
            bottom: 30,
        };
        this.dimName = dimName;
        this.style.margin = `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`;
        this.height = window.innerHeight / size - margin.top - margin.bottom;
        this.width = window.innerWidth / size - margin.right - margin.left;
    }

    runComputation() {
        const order = 5;
        const layout = new HilbertLayout().order(order).getHilbertPath(this.data.length + 1);

        this.d3Selection.append('text').style('transform', 'translateY(5px)').text(this.dimName);

        // For the pixels
        const sequentialScale = d3.scaleSequential()
            .domain(d3.extent(this.data))
            .interpolator(d3.interpolateCool)

        const largerRange = Math.max(layout.maxX, layout.maxY);
        const smallerDim = Math.min(this.width, this.height)
        const cellWidth = smallerDim / largerRange;

        const scale = d3
            .scaleLinear()
            .domain([0, largerRange])
            .range([10, smallerDim]);

        this.d3Selection
            .selectAll("rect")
            .data(layout.coordinates)
            .enter()
            .append("rect")
            .attr("y", (d) => scale(d.x))
            .attr("x", (d) => scale(d.y))
            .attr("width", cellWidth)
            .attr("height", cellWidth)
            .style("fill", (_, i) => sequentialScale(this.data[i])); // `hsl(200, ${colorSat(this.data[i])}%, ${colorLight(this.data[i])}%)`
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

    pointToDistance(x, y, n) {
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

    convertToAbsoluteCoordinates(vertices) {
        let x = 0, y = 0, maxX = 0, maxY = 0, minX = 0, minY = 0;
        const coords = [];
        for (const vertex of vertices) {
            switch (vertex) {
                case Directions.UP: y += 1; break;
                case Directions.DOWN: y -= 1; break;
                case Directions.RIGHT: x += 1; break;
                case Directions.LEFT: x -= 1; break;
            }
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            if (coords.some(c => c === { x, y })) {
                throw "something is wrong"
            }
            coords.push({ x, y })
        }
        coords.forEach(c => {
            c.x -= minX;
            c.y -= minY;
        });
        return { coordinates: coords, maxX: maxX + minX, maxY: maxY + minY }
    }

    // d: distance, n: sqrt of num cells (square side size)
    distanceToPoint(d, n) {
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

    getHilbertPath(length) {
        const nSide = Math.pow(2, this._order);
        const vertices = [];

        let prevPoint = this.distanceToPoint(0, nSide);
        let pnt;

        for (let i = 1; i < length; i++) {

            pnt = this.distanceToPoint(i, nSide);

            vertices.push(
                pnt[0] > prevPoint[0]
                    ? Directions.RIGHT
                    : (pnt[0] < prevPoint[0]
                        ? Directions.LEFT
                        : (pnt[1] > prevPoint[1]
                            ? Directions.DOWN
                            : Directions.UP
                        )
                    )
            );

            prevPoint = pnt;
        }

        return this.convertToAbsoluteCoordinates(vertices)
    }

    getValAtXY(x, y) {
        const n = Math.pow(2, this._order);
        const xy = [x, y].map((coord) => coord * n);
        return this.pointToDistance(xy[0], xy[1], n);
    }

    getXyAtVal(val) {
        return this.distanceToPoint(val, Math.pow(2, this._order));
    }
}