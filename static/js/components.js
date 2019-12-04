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
    visualize(colorScale, svg, pTitle = "Canada vs the World(2008-2018)") {
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
      let visMisc = misc.visualize(size, group);
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
    visualize(size, svg) {
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
        .style("fill", "url(#missing-data-img)");

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
        .text("Incomplete data")
        .attr("font", "Helvetica")
        .attr("font-size", "12px");
      text2.attr("y", text2.node().getBBox().height - textHeightPadding);
      return group;
    }
  },

  countries: {
    coloredList: [],
    countryNames: {},
    rawData: [],
    group: null,
    data(dataVals) {
      this.rawData = dataVals;
      for (let i = 0; i < dataVals.length; ++i) {
        this.countryNames[dataVals[i].properties.name] =
          dataVals[i].properties.iso_a3;
      }
      return this;
    },
    visualize(svg, projection) {
      this.group = svg
        .selectAll("path")
        .data(this.rawData)
        .enter()
        .append("path")
        .attr("d", projection)
        .attr("id", function(d, i) {
          return "country" + d.properties.iso_a3;
        })
        .attr("class", "country")
        .on("mouseover", function(d, i) {
          d3.select(this).raise();
          d3.select(this).style("stroke", "black");
          d3.select(this).style("stroke-width", "5px");
        })
        .on("mouseout", function(d, i) {
          d3.select(this).style("stroke", "white");
          d3.select(this).style("stroke-width", "1px");
        });
      return this.group;
    },
    color(data, missingData = [], colorScale) {
      for (let i = 0; i < data.length; ++i) {
        if (data[i].country_name in this.countryNames) {
          let acronym = this.countryNames[data[i].country_name];
          $(`#country${acronym}`).css({
            fill: colorScale.get(data[i].leadlag)
          });
          this.coloredList.push(`#country${acronym}`);
        } else {
          console.log(`${data[i].country_name} does not exist in dictionary`);
        }
      }
      for (let i = 0; i < missingData.length; ++i) {
        if (missingData[i] in this.countryNames) {
          let acronym = this.countryNames[missingData[i]];
          $(`#country${acronym}`).css({ fill: "url(#missing-data)" });
          this.coloredList.push(`#country${acronym}`);
        }
      }
    },
    reset(color = "#f5f5f5") {
      for (let i = 0; i < this.coloredList.length; ++i) {
        $(this.coloredList[i]).css({ fill: color });
      }
      this.coloredList = [];
    }
  },
  tooltip: {
    visual: d3
      .select("#map-holder")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("box-shadow", "0 0 3px")
      .style("stroke", "black"),
    visualize(data, box) {
      this.visual
        .style("visibility", "visible")
        .style("left", box.left + box.width + "px")
        .style("top", box.top + box.height + "px")
        .style("padding-left", "20px")
        .style("padding-right", "20px")
        .style("padding-top", "10px")
        .style("padding-bottom", "10px")
        .html(
          `<p>${data.name}<br>${data.total} papers<br>${data.country_name}<br>${data.country_total} papers</p>`
        );
    },

    reset() {
      this.visual.style("visibility", "hidden");
    }
  },
  glyphs: {
    nodes: [],
    group: null,
    rendered: false,
    tooltip: null,
    /**
     *
     * @param {Element} svg
     * @param {cmp.ColorScale} colorScale
     * @param {{lat:number, lng:number}} data
     * @param {{x:number, y:number, scale:number}} transform
     */
    visualize(svg, colorScale, data, transform) {
      var self = this;
      self.tooltip = cmp.tooltip;
      this.rendered = true;
      this.group = svg.append("g");
      this.group.attr("class", "noselect");
      let g = this.group
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", function(d, i) {
          return `translate(${d.lat},${d.lng})`;
        });
      g.each(function(d, i) {
        d3.select(this)
          .append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", d.scale)
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .attr("fill", colorScale.get(d.lead));
      });

      g.each(function(d, i) {
        d3.select(this)
          .append("line")
          .attr("x1", d.scale)
          .attr("y1", 0)
          .attr("x2", 0 - d.scale)
          .attr("y2", 0)
          .attr("stroke", "black")
          .attr("stroke-width", 5)
          .attr("transform", function() {
            let rotation = 0;
            if (d.trend > 0.05) {
              rotation = 45;
            }
            if (d.trend > -0.05) {
              rotation = -45;
            }
            return `rotate(${rotation},${0},${0})`;
          });
      });
      g.on("mouseenter", function(d) {
        let box = d3
          .select(this)
          .select("circle")
          .node()
          .getBoundingClientRect();
        self.tooltip.visualize(d, box);
      }).on("mouseleave", function() {
        self.tooltip.reset();
      });
      this.group.attr(
        "transform",
        `translate(${transform.x}, ${transform.y})scale(${transform.scale})`
      );

      let force = d3
        .forceSimulation(data)
        .force(
          "x",
          d3.forceX(function(d) {
            return d.lat;
          })
        )
        .force(
          "y",
          d3.forceY(function(d) {
            return d.lng;
          })
        )
        .force(
          "collide",
          d3.forceCollide(function(d) {
            return d.scale;
          })
        )
        .alpha(1)
        .on("tick", this.onTick.bind(this));
    },
    reset() {
      if (this.group != null) {
        this.rendered = false;
        this.group.remove();
      }
    },
    onTick() {
      this.group.selectAll("g").attr("transform", function(d, i) {
        return `translate(${d.x},${d.y})`;
      });
    }
  },

  graphwindow: {
    graph: null,
    chartView: null,
    visualize(canada, other, otherName, years) {
      var self = this;
      $("#map-holder").append(
        `<div class="graph-window row" id="graph-holder"></div>`
      );
      $("#graph-holder").one(
        "animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd",
        function() {
          self.chartView = new ChartView("graph-holder");
          self.chartView.addView("main-view");
          self.chartView.setMainView("main-view");
          self.chartView.addView("categories-views");
          self.chartView.addChart(
            "main-view",
            {
              ydomain: [0.0, 1.0],
              xdomain: [years.min, years.max],
              lines: [
                {
                  name: "Canada",
                  rawData: canada,
                  data: canada
                },
                {
                  name: otherName,
                  rawData: other,
                  data: other
                }
              ]
            },
            data => {
              data.chartName = "Total";
            }
          );
        }
      );
    },
    async getCategory(params) {
      let response = await d3.json("/querycategories", {
        method: "POST",
        body: JSON.stringify({
          keyword: params.keyword,
          year: params.year,
          country_name: params.country_name
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      return response;
    }
  }
};
