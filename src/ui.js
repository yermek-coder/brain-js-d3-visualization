import * as d3 from "d3";

export default class UI {
  dimensions = {
    width: 500,
    height: 500,
  };
  wrapper;
  svg;
  bounds;
  yAxis;
  xAxis;
  circles;

  domain = [0, 1];
  pointColors = ["red", "green"];
  yScale;
  xScale;
  yAxisGenerator;
  xAxisGenertor;
  colorScale;
  color;
  canvas;

  constructor(data) {
    this.dimensions.boundedWidth =
      this.dimensions.width;
    this.dimensions.boundedHeight =
      this.dimensions.height;

    this.wrapper = d3.select("#wrapper");
    this.svg = this.wrapper
      .append("svg")
      .attr("width", this.dimensions.width)
      .attr("height", this.dimensions.height);

    this.bounds = this.svg
      .append("g")
      .classed("bounds", true);
      // .style(
      //   "transform",
      //   `translate(${this.dimensions.margin.left}px,${this.dimensions.margin.top}px)`
      // );

    this.canvas = this.wrapper
      .append("canvas")
      .style("z-index", "-1")
      .attr("width", 100)
      .attr("height", 100)
      .style("width", this.dimensions.boundedWidth + "px")
      .style("height", this.dimensions.boundedHeight + "px")
      .style("position", "absolute")
      .style("top", 0)
      .style("left", 0);

    let tmpScale = d3
      .scaleLinear()
      .domain([0, 0.5, 1])
      .range(["#f59322", "#e8eaeb", "#0877bd"])
      .clamp(true);
    let colors = d3.range(0, 1 + 1e-9, 1 / 30).map((a) => {
      return tmpScale(a);
    });
    this.color = d3.scaleQuantize().domain(this.domain).range(colors);

    this.yScale = d3
      .scaleLinear()
      .domain(this.domain)
      .range([0, this.dimensions.boundedHeight]);
    this.xScale = d3
      .scaleLinear()
      .domain(this.domain)
      .range([0, this.dimensions.boundedWidth]);

    // this.yAxisGenerator = d3.axisRight().scale(this.yScale);
    // this.xAxisGenertor = d3.axisBottom().scale(this.xScale);

    this.colorScale = d3
      .scaleLinear()
      .domain(this.domain)
      .range(this.pointColors);

    // this.yAxis = this.svg
    //   .append("g")
    //   .call(this.yAxisGenerator)
    //   .style(
    //     "transform",
    //     `translate(${
    //       this.dimensions.boundedWidth
    //     }px, ${0}px)`
    //   );
    // this.xAxis = this.svg
    //   .append("g")
    //   .call(this.xAxisGenertor)
    //   .style(
    //     "transform",
    //     `translate(${0}px, ${
    //       this.dimensions.boundedHeight
    //     }px)`
    //   );

    this.circles = this.bounds.append("g").classed("circles", true);

    this.circles
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => this.xScale(d.x))
      .attr("cy", (d) => this.yScale(d.y))
      .attr("r", 2)
      .attr("fill", (d) => this.colorScale(d.label));
  }

  updateCircles(data) {
    this.circles
      .selectAll("circle")
      .data(data)
      .attr("cx", (d) => this.xScale(d.x))
      .attr("cy", (d) => this.yScale(d.y))
      .attr("r", 2)
      .attr("fill", (d) => this.colorScale(d.label));
  }

  reduceMatrix(matrix) {
    const factor = 2;

    let result = new Array(matrix.length / factor);
    for (let i = 0; i < matrix.length; i += factor) {
      result[i / factor] = new Array(matrix.length / factor);
      for (let j = 0; j < matrix.length; j += factor) {
        let avg = 0;
        // Sum all the values in the neighborhood.
        for (let k = 0; k < factor; k++) {
          for (let l = 0; l < factor; l++) {
            avg += matrix[i + k][j + l];
          }
        }
        avg /= factor * factor;
        result[i / factor][j / factor] = avg;
      }
    }
    return result;
  }

  updateCanvas(data) {
    let dx = data[0].length;
    let dy = data.length;

    let context = this.canvas.node().getContext("2d");
    let image = context.createImageData(dx, dy);

    for (let y = 0, p = -1; y < dy; ++y) {
      for (let x = 0; x < dx; ++x) {
        let value = data[x][y];
        let c = d3.rgb(this.color(value));
        image.data[++p] = c.r;
        image.data[++p] = c.g;
        image.data[++p] = c.b;
        image.data[++p] = 160;
      }
    }
    context.putImageData(image, 0, 0);
  }
}
