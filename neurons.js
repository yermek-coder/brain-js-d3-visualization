class neuronsUI {
  dimensions = {
    width: 500,
    height: 500,
  };
  wrapper;
  svg;
  bounds;
  yAxis;
  xAxis;

  nodesWrapper;
  nodesData;

  xDomain;
  yDomain;
  colorScale;
  yScale;
  xScale;

  layers;
  sizes;
  maxHeight;

  linksData;
  linkGen;
  linksWrapper;
  linkScale;
  linkColorScale;

  constructor(data) {
    this.initData(data);
    document.querySelector('#neurons-wrapper').innerHTML = "";

    this.radius = this.dimensions.height / (this.maxHeight * 5);
    this.yDomain = [0, this.maxHeight];
    this.xDomain = [0, this.layers.length - 1];
    console.log('this.xDomain', this.xDomain);
    this.yScale = d3
      .scaleLinear()
      .domain(this.yDomain)
      .range([0, this.dimensions.height]);
    this.xScale = d3
      .scaleLinear()
      .domain(this.xDomain)
      .range([0, this.dimensions.width]);
    this.colorScale = d3
      .scaleLinear()
      .domain([-1, 1])
      .range(["red", "green"])
      .clamp(true);

    this.updateLinksData();

    this.wrapper = d3.select("#neurons-wrapper");
    this.svg = this.wrapper
      .append("svg")
      .attr("width", this.dimensions.width)
      .attr("height", this.dimensions.height)

    this.bounds = this.svg
      .append("g")
      .classed("bounds", true)
      .style(
        "transform",
        `translateX(${this.radius}px)`
      );

    this.linkGen = d3.linkHorizontal();
    this.linksWrapper = this.bounds.append("g").classed('links', true);
    this.linkScale = d3
      .scaleLinear()
      .domain([-0.2, 0.2])
      .range([1, 4])
      .clamp(true);
    this.linkColorScale = d3
      .scaleLinear()
      .domain([-0.2, 0.2])
      .range(["red", "green"])
      .clamp(true);
    this.linksWrapper
      .selectAll("path")
      .data(this.linksData)
      .join("path")
      .attr("d", this.linkGen)
      .attr("fill", "none")
      .attr("stroke", d => this.linkColorScale(d.weight))
      .attr("stroke-width", d => this.linkScale(d.weight));

    this.nodesWrapper = this.bounds.append("g").classed('nodes', true);
    this.nodesWrapper
      .selectAll("circle")
      .data(this.nodesData)
      .enter()
      .append("circle")
      .attr("cx", (d) => {
        return this.xScale(d.x)
      })
      .attr("cy", (d) => this.yScale(d.y))
      .attr("r", this.radius)
      .attr("fill", (d) => this.colorScale(d.bias));
  }

  initData(data) {
    this.sizes = data.sizes;
    this.maxHeight = this.sizes.reduce((acc, size) => Math.max(acc, size), 0);
    this.updateData(data);
  }

  updateLinksData() {
    this.linksData = this.sizes.map((layerSize, layerIndex, sizes) => {
      const currentNodesCount = sizes.slice(0, layerIndex + 1).reduce((acc, size) => size + acc, 0);
      const currNodes = this.nodesData.slice(currentNodesCount - layerSize, currentNodesCount);
      const nextNodes = this.nodesData.slice(currentNodesCount, currentNodesCount + this.sizes[layerIndex + 1]);
      if (!nextNodes.length) return null;
      return currNodes.map((node, sourceIndex) => {
        const source = [this.xScale(node.x), this.yScale(node.y)];
        return nextNodes.map((node2) => (
          {
            source,
            target: [this.xScale(node2.x), this.yScale(node2.y)],
            weight: node2.weights[sourceIndex],
          }
        ))
      });
    }).flat(2).filter((link) => !!link);
  }

  setNewData() {

  }

  updateData(data) {
    data.layers.splice(0, 1, {
      biases: [-1, 1],
      weights: [],
    });
    this.layers = data.layers;
    this.nodesData = data.layers = data.layers.map((layer, layerIndex) => {
      const height = this.maxHeight;
      const count = layer.biases.length;
      const step = height / (count + 1);
      const yPositions = d3.range(0 + step, height, step).slice(0, count);
      return layer.biases.map((bias, nodeIndex) => {
        return {
          y: yPositions[nodeIndex],
          x: layerIndex,
          bias,
          weights: layer.weights[nodeIndex] || []
        }
      })
    }).flat(2);
  }

  updateLinks() {
    this.linksWrapper
      .selectAll("path")
      .data(this.linksData)
      .attr("stroke", d => this.linkColorScale(d.weight))
      .attr("stroke-width", d => this.linkScale(d.weight));
  }

  updateNodes(data) {
    this.updateData(data);
    this.nodesWrapper
      .selectAll("circle")
      .data(this.nodesData)
      .attr("fill", (d) => this.colorScale(d.bias));
  }
}
