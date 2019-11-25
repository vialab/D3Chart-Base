let cmp = {
  /*
    Legend Component
  */
  legend: {
    size: { width: 100, height: 100 },
    isSwatch: false,
    swatch: undefined,
    /**
     *
     * @param {Object} colorScale - cmp.colorScale object
     * @param {Element} svg - element to append to
     * @returns {Element} - group containing the legend
     */
    visualize(colorScale, svg, pTitle="Canada vs the World(2008-2018)") {
      let size = { width: 30, height: 15 };
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
        .attr("rx", 15)
        .attr("filter", "url(#dropshadow)");

      let title = group
        .append("text")
        .text(pTitle)
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

      let colorVis = colorScale.visualize(size, group, true);
      let visBBox = colorVis.node().getBBox();
      let titleBBox = title.node().getBBox();
      colorVis.attr(
        "transform",
        `translate(${boxPadding +
          lagTxt.node().getBBox().width +
          leadLagPadding},${boxPadding + titleBBox.height + titlePadding})`
      );

      lagTxt.attr(
        "transform",
        `translate(${boxPadding},${boxPadding +
          titleBBox.height +
          titlePadding +
          12})`
      );

      leadTxt.attr(
        "transform",
        `translate(${boxPadding +
          lagTxt.node().getBBox().width +
          leadLagPadding +
          visBBox.width}, ${boxPadding + titleBBox.height + titlePadding + 12})`
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

      title.attr("text-anchor", "middle");
      title.attr(
        "transform",
        `translate(${background.node().getBBox().width / 2}, ${boxPadding +
          titleBBox.height})`
      );
      let misc = cmp.misclegend;
      let visMisc = misc.visualization(size, group);
      visMisc.attr(
        "transform",
        `translate(${background.node().getBBox().width / 2 -
          visMisc.node().getBBox().width / 2}, ${boxPadding +
          titleBBox.height +
          titlePadding +
          visBBox.height +
          titlePadding})`
      );
      
      background.attr(
        "height",
        boxPadding +
          title.node().getBBox().height +
          titlePadding +
          visBBox.height +
          titlePadding +
          visMisc.node().getBBox().height +
          boxPadding
      );

      background.on(
        "click",
        function() {
          if (this.isSwatch) {
            this.swatch.remove();
            this.isSwatch = false;
          } else {
            let temp = cmp.swatch;
            this.swatch = temp.visualize(
              svg,
              colorScale.scale,
              size,
              colorScale
            );
            this.isSwatch = true;
          }
        }.bind(this)
      );
      return group;
    }
  },

  colorScale: {
    gradient: d3.interpolateRdBu,
    scale: [],
    rect: undefined,
    start: undefined,
    end: undefined,

    setGradient(colorGradient) {
      this.gradient = colorGradient;
      if (this.rect != undefined) {
        this.updateScale();
      }
      return this;
    },

    setScale(values) {
      this.scale = values;
      return this;
    },
    updateScale() {
      const end = this.scale.length - 1;
      this.rect
        .selectAll("rect.scale")
        .data(this.scale)
        .attr(
          "fill",
          function(d, i) {
            return this.gradient(i / end);
          }.bind(this)
        );
      this.start.attr("fill", this.gradient(0));
      this.end.attr("fill", this.gradient(100));
    },
    visualize(size, svg, renderText = false) {
      const radius = size.height / 2;
      const end = this.scale.length - 1;
      const cy = size.height / 2;

      let group = svg.append("g");

      this.rect = group
        .selectAll("rect.scale")
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

      this.start = group
        .append("circle")
        .attr("cx", 0)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", this.gradient(0));

      this.end = group
        .append("circle")
        .attr("cx", this.scale.length * size.width)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", this.gradient(100));

      if (renderText) {
        let text = group
          .selectAll("text")
          .data(this.scale)
          .enter()
          .append("text")
          .text(function(d, i) {
            return d;
          })
          .attr("x", function(d, i) {
            return i * size.width + size.width / 2;
          });
        let textBBox = text.node().getBBox();
        let rectBBox = this.rect.node().getBBox();
        text
          .attr("y", rectBBox.height + textBBox.height)
          .attr("text-anchor", "middle");
      }
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
  },

  swatch: {
    colorList: [
      d3.interpolateBrBG,
      d3.interpolatePRGn,
      d3.interpolatePiYG,
      d3.interpolatePuOr,
      d3.interpolateRdBu,
      d3.interpolateRdGy,
      d3.interpolateRdYlBu,
      d3.interpolateRdYlGn,
      d3.interpolateSpectral,
      d3.interpolateBlues,
      d3.interpolateGreens,
      d3.interpolateGreys,
      d3.interpolateOranges,
      d3.interpolatePurples,
      d3.interpolateReds,
      d3.interpolateTurbo,
      d3.interpolateViridis,
      d3.interpolateInferno,
      d3.interpolateMagma,
      d3.interpolatePlasma,
      d3.interpolateCividis,
      d3.interpolateWarm,
      d3.interpolateCool,
      d3.interpolateCubehelixDefault,
      d3.interpolateBuGn,
      d3.interpolateBuPu,
      d3.interpolateGnBu,
      d3.interpolateOrRd,
      d3.interpolatePuBuGn,
      d3.interpolatePuBu,
      d3.interpolatePuRd,
      d3.interpolateRdPu,
      d3.interpolateYlGnBu,
      d3.interpolateYlGn,
      d3.interpolateYlOrBr,
      d3.interpolateYlOrRd,
      d3.interpolateRainbow,
      d3.interpolateSinebow
    ],

    visualize(svg, yearScale, size, colorScale) {
      let group = svg.append("g");
      const padding = 5;
      for (let i = 0; i < this.colorList.length; ++i) {
        let temp = cmp.colorScale;
        temp.setGradient(this.colorList[i]).setScale(yearScale);
        let visual = temp.visualize(size, group);

        visual
          .attr("transform", `translate(0, ${i * size.height + padding * i})`)
          .on(
            "click",
            function() {
              colorScale.setGradient(this.colorList[i]);
              group.remove();
            }.bind(this)
          );
      }
      return group;
    }
  },
  misclegend: {
    visualization(size, svg) {
      let padding = 10;
      let middlePadding = 30;
      let textHeightPadding = 3;
      let group = svg.append("g");
      let rect = group
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", size.width)
        .attr("height", size.height)
        .attr("rx", 8)
        .attr("fill", "#f5f5f5")
        .attr("border", "1px")
        .attr("stroke", "black");

      let text = group
        .append("text")
        .attr("x", rect.node().getBBox().width + padding)
        .text("No data")
        .attr("font", "Helvetica")
        .attr("font-size", "12px");
      text.attr("y", text.node().getBBox().height - textHeightPadding);
      let rect2 = group
        .append("rect")
        .attr(
          "x",
          rect.node().getBBox().width +
            padding +
            text.node().getBBox().width +
            middlePadding
        )
        .attr("y", 0)
        .attr("width", size.width)
        .attr("height", size.height)
        .attr("rx", 8)
        .attr("border", "1px")
        .attr("stroke", "black")
        .attr("fill", "url(#missing-data)");

      let text2 = group
        .append("text")
        .attr(
          "x",
          rect.node().getBBox().width +
            padding +
            text.node().getBBox().width +
            middlePadding +
            rect2.node().getBBox().width +
            padding
        )
        .attr("y", 0)
        .text("Missing data")
        .attr("font", "Helvetica")
        .attr("font-size", "12px");
      text2.attr("y", text2.node().getBBox().height - textHeightPadding);
      return group;
    }
  }
};
