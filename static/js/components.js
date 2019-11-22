let cmp = {
  legend: {
    size: { width: 100, height: 100 },

    visualize(colorScale, svg) {
      let boxPadding = 30;
      let leadLagPadding = 15;
      let titlePadding = 15;
      let group = svg.append("g");
      let background = group
        .append("rect")
        .attr("height", this.size.height)
        .attr("width", this.size.width)
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("border", "3px")
        .attr("rx", 15);

      let title = group
        .append("text")
        .text("Canada vs the World")
        .attr("x", 0)
        .attr("y", 0)
        .style("font", "Helvetica")
        .style("font-size", "20px");

      let leadTxt = group
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Lead")
        .style("font", "Helvetica")
        .style("font-size", "20px");

      let lagTxt = group
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Lag")
        .style("font", "Helvetica")
        .style("font-size", "20px");

      let colorVis = colorScale.visualize({ width: 30, height: 15 }, group);
      let visBBox = colorVis.node().getBBox();
      let titleBBox = title.node().getBBox();
      colorVis.attr(
        "transform",
        `translate(${boxPadding +
          lagTxt.node().getBBox().width +
          leadLagPadding},${boxPadding +
          (leadTxt.node().getBBox().height - visBBox.height) / 2 +
          titleBBox.height +
          titlePadding})`
      );
      lagTxt.attr(
        "transform",
        `translate(${boxPadding},${boxPadding +
          visBBox.height +
          titleBBox.height +
          titlePadding})`
      );

      leadTxt.attr(
        "transform",
        `translate(${boxPadding +
          lagTxt.node().getBBox().width +
          leadLagPadding +
          visBBox.width}, ${boxPadding +
          visBBox.height +
          titleBBox.height +
          titlePadding})`
      );

      background.attr(
        "width",
        boxPadding +
          lagTxt.node().getBBox().width +
          leadLagPadding +
          visBBox.width +
          leadLagPadding +
          leadTxt.node().getBBox().width +
          boxPadding
      );

      background.attr(
        "height",
        boxPadding +
          title.node().getBBox().height +
          titlePadding +
          leadTxt.node().getBBox().height +
          boxPadding
      );

      title.attr(
        "transform",
        `translate(${background.node().getBBox().width / 2 -
          title.node().getBBox().width / 2}, ${boxPadding + titleBBox.height})`
      );
      return group;
    }
  },

  colorScale: {
    gradient: d3.interpolateRdBu,
    scale: [],
    setGradient(colorGradient) {
      this.gradient = colorGradient;
      return this;
    },

    setScale(values) {
      this.scale = values;
      return this;
    },
    visualize(size, svg) {
      const radius = size.height / 2;
      const end = this.scale.length - 1;
      const cy = size.height / 2;
      let group = svg.append("g");
      group
        .selectAll("rect")
        .data(this.scale)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
          return i * size.width;
        })
        .attr("y", 0)
        .attr("width", size.width)
        .attr("height", size.height)
        .attr(
          "fill",
          function(d, i) {
            return this.gradient(i / end);
          }.bind(this)
        );

      group
        .append("circle")
        .attr("cx", 0)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", this.gradient(0));
      group
        .append("circle")
        .attr("cx", this.scale.length * size.width)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", this.gradient(100));

      return group;
    },
    get(value) {
      let index = this.scale.indexOf(value);
      if (index == -1) {
        throw "value does not exist. {components.colorScale.get}";
      }
      const end = this.scale.length - 1;
      return this.gradient(index / end);
    }
  }
};
