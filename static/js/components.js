let cmp = {
  /*
    Legend Component
  */
  legend: {
    size: { width: 100, height: 100 },
    isSwatch: false,
    swatch: undefined,
    title: null,
    date: null,
    keyword: undefined,
    colorVis: null,
    group: null,
    svg: null,
    colorScale: null,

    countries: null,

    institutions: null,

    setKeyword(keyword) {
      this.keyword = keyword;
      if (this.title != null) {
        this.title.text(
          `Canada vs the World(${this.date.min}, ${this.date.max})"${this.keyword}"`
        );
      }
      return this;
    },
    setDate(date) {
      this.date = date;
      if (this.title != null) {
        this.title.text(
          `Canada vs the World(${date.min}, ${date.max})"${this.keyword}"`
        );
      }
      return this;
    },
    /**
     *
     * @param {Object} colorScale - cmp.colorScale object
     * @param {Element} svg - element to append to
     * @returns {Element} - group containing the legend
     */
    visualize(colorScale, svg) {
      let size = { width: 30, height: 15 };
      let boxPadding = 30;
      let leadLagPadding = 15;
      let titlePadding = 15;
      this.svg = svg;
      this.group = svg.append("g");
      let self = this;
      this.colorScale = colorScale;
      let background = this.group
        .append("rect")
        .attr("height", this.size.height)
        .attr("width", this.size.width)
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "none")
        .attr("rx", 15)
        .attr("filter", "url(#dropshadow)");

      this.title = this.group
        .append("text")
        .text(
          `Canada vs the World(${this.date.min}, ${this.date.max})"${this.keyword}"`
        )
        .attr("x", 0)
        .attr("y", 0)
        .style("font", "Helvetica")
        .style("font-size", "20px");

      let leadTxt = this.group
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Lead")
        .style("font", "Helvetica")
        .style("font-size", "20px");

      let lagTxt = this.group
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Lag")
        .style("font", "Helvetica")
        .style("font-size", "20px");

      this.colorVis = colorScale.visualize(size, this.group, true);
      this.colorVis.style("cursor", "help");
      let visBBox = this.colorVis.node().getBBox();
      let titleBBox = this.title.node().getBBox();
      this.colorVis.attr(
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

      this.title.attr("text-anchor", "middle");
      this.title.attr(
        "transform",
        `translate(${background.node().getBBox().width / 2}, ${boxPadding +
          titleBBox.height})`
      );
      let misc = cmp.misclegend;
      let visMisc = misc.visualize(size, this.group);
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
          this.title.node().getBBox().height +
          titlePadding +
          visBBox.height +
          titlePadding +
          visMisc.node().getBBox().height +
          boxPadding
      );

      this.colorVis.on("click", this.swatchClick.bind(this));
      return this.group;
    },
    swatchClick() {
      let size = { width: 30, height: 15 };
      let self = this;
      if (this.isSwatch) {
        this.swatch.remove();
        this.isSwatch = false;
      } else {
        let temp = cmp.swatch;
        this.swatch = temp.visualize(
          self.svg,
          self.colorScale.scale,
          size,
          self.colorScale,
          function() {
            let matrix = self.colorVis
              .attr("transform")
              .replace(/[^0-9\-.,]/g, "")
              .split(",");
            let x = matrix[0];
            let y = matrix[1];
            self.colorVis.remove();
            self.colorVis = self.colorScale.visualize(size, self.group, true);
            self.colorVis.attr("transform", `translate(${x},${y})`);
            self.colorVis.on("click", self.swatchClick.bind(self));
            self.colorVis.style("cursor", "help");
            self.isSwatch = false;
          }
        );
        console.log(self.title.node().getBoundingClientRect().y);
        this.swatch.attr(
          "transform",
          `translate(${
            self.colorVis.node().getBoundingClientRect().x
          },${self.title.node().getBoundingClientRect().y -
            this.swatch.node().getBoundingClientRect().height -
            40})`
        );
        this.isSwatch = true;
      }
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
      d3.interpolateBrBG,
      d3.interpolatePRGn,
      d3.interpolatePiYG,
      d3.interpolateRdBu,
      d3.interpolateRdGy,
      d3.interpolateRdYlBu,
      d3.interpolateViridis,
      d3.interpolatePlasma,
      d3.interpolateCividis
    ],

    visualize(svg, yearScale, size, colorScale, callback) {
      let group = svg.append("g");
      let padding = 5;
      const firstGroup = 12;
      const secondGroup = 18;
      let group1 = group.append("g");
      const groupPadding = 15;
      for (let i = 0; i < firstGroup; ++i) {
        let temp = cmp.colorScale;
        temp.setScale(yearScale).setGradient(this.colorList[i]);
        let visual = temp.visualize(size, group1);
        visual
          .attr("transform", `translate(0, ${i * size.height + padding * i})`)
          .on(
            "click",
            function() {
              colorScale.setGradient(this.colorList[i]);
              group.remove();
              callback();
            }.bind(this)
          );
      }
      let group2 = group.append("g");
      group2.attr("transform", `translate(0, ${groupPadding})`);
      for (let i = firstGroup; i < secondGroup; ++i) {
        let temp = cmp.colorScale;
        temp.setScale(yearScale).setGradient(this.colorList[i]);
        let visual = temp.visualize(size, group2);
        visual
          .attr("transform", `translate(0, ${i * size.height + padding * i})`)
          .on(
            "click",
            function() {
              colorScale.setGradient(this.colorList[i]);
              group.remove();
              callback();
            }.bind(this)
          );
      }
      let group3 = group.append("g");
      group3.attr("transform", `translate(0, ${groupPadding * 2})`);
      for (let i = secondGroup; i < this.colorList.length; ++i) {
        let temp = cmp.colorScale;
        temp.setScale(yearScale).setGradient(this.colorList[i]);
        let visual = temp.visualize(size, group3);
        visual
          .attr("transform", `translate(0, ${i * size.height + padding * i})`)
          .on(
            "click",
            function() {
              colorScale.setGradient(this.colorList[i]);
              group.remove();
              callback();
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
    countryData: null,
    year: { min: 0, max: 0 },
    data(dataVals) {
      this.rawData = dataVals;
      for (let i = 0; i < dataVals.length; ++i) {
        this.countryNames[dataVals[i].properties.name] =
          dataVals[i].properties.iso_a3;
      }
      return this;
    },

    setYear(year) {
      this.year = year;
      return this;
    },
    visualize(svg, projection) {
      var self = this;
      this.group = svg
        .selectAll("path")
        .data(this.rawData)
        .enter()
        .append("path")
        .attr("d", projection)
        .attr("id", function(d, i) {
          return "country" + d.properties.iso_a3;
        })
        .attr("name", function(d, i) {
          return d.properties.name;
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
        })
        .on("click", function(d, i) {
          if (self.countryData == null) {
            return;
          }
          let countryName = d3.select(this).attr("name");
          let canada = self.countryData.countries["Canada"].sequence;
          let selfCountry = self.countryData.countries[countryName].sequence;
          if (canada != null && selfCountry != null) {
            let window = cmp.graphwindow;
            window.visualize(
              canada,
              selfCountry,
              countryName,
              cmp.dataObject.metaData[cmp.dataObject.end].years
            );
          }
        });
      return this.group;
    },
    color(data, missingData = [], colorScale, countryData) {
      this.countryData = countryData;
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
    simulation: null,
    collision: null,
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
      data = data.filter(x => {
        return x.scale != NaN;
      });
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
          .attr("stroke-width", 3)
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
            if (d.trend > 0.01) {
              rotation = -45;
            }
            if (d.trend < -0.01) {
              rotation = 45;
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
        `translate(${transform.translateX}, ${transform.translateY})scale(${transform.scale})`
      );
      this.collision = d3.forceCollide().radius(function(d) {
        return d.scale;
      });
      this.simulation = d3
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
        .force("collide", this.collision)
        .alpha(1)
        .on("tick", this.onTick.bind(this));
    },
    updateColor(colorScale) {
      let g = this.group.selectAll("g");
      g.each(function(d, i) {
        d3.select(this).attr("fill", colorScale.get(d.lead));
      });
    },
    updateScale(scale, scalarFunction) {
      let svg = d3.select("svg");
      let g = this.group.selectAll("g");
      g.each(function(d, i) {
        d3.select(this)
          .select("circle")
          .attr("r", function(d) {
            if (d.name in scale) {
              d.scale = scalarFunction(scale[d.name]);
              return d.scale;
            }
          });
        d3.select(this)
          .select("line")
          .attr("x1", function(d) {
            if (d.name in scale) {
              return scalarFunction(scale[d.name]);
            }
          })
          .attr("x2", function(d) {
            if (d.name in scale) {
              return 0 - scalarFunction(scale[d.name]);
            }
          });
      });
      this.collision.initialize(this.simulation.nodes());
      this.simulation.alpha(1).restart();
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
    categories: {},
    recommended: [],
    numberRecommended: 4,
    async getData(keyword, otherName, year) {
      let response = [];
      for (let i = year.min; i <= year.max; ++i) {
        response.push(
          await this.getCategory({
            keyword: keyword,
            year: i,
            country_name: otherName
          })
        );
      }
      if (cmp.info.canadaCategories == null) {
        let canResponse = [];
        for (let i = year.min; i <= year.max; ++i) {
          canResponse.push(
            await this.getCategory({
              keyword: keyword,
              year: i,
              country_name: "Canada"
            })
          );
        }
        cmp.info.canadaCategories = { categories: {} };
        for (let i = 0; i < canResponse.length; ++i) {
          let obj = JSON.parse(canResponse[i].body);
          let categories = obj.category_for;
          for (const category in categories) {
            if (
              categories[category].name in cmp.info.canadaCategories.categories
            ) {
              cmp.info.canadaCategories.categories[
                categories[category].name
              ].push(categories[category].count);
            } else {
              cmp.info.canadaCategories.categories[
                categories[category].name
              ] = [];
              cmp.info.canadaCategories.categories[
                categories[category].name
              ].push(categories[category].count);
            }
          }
          cmp.info.normalizeCategories();
        }
      }
      return response;
    },
    async visualize(canada, other, otherName, year) {
      let res = await this.getData(cmp.info.currentKeyword, otherName, year);
      let categories = this.parse(res);
      var self = this;
      $("#graph-holder").remove();
      $("#map-holder").append(
        `<div class="graph-window" id="graph-holder"></div>`
      );
      $(document).on("click", function(e) {
        let check = $.contains($("#graph-holder")[0], $(e.target)[0]);
        if ($(e.target).is("#graph-holder") === false && !check) {
          $("#graph-holder").remove();
          $(document)
            .prop("onclick", null)
            .off("click");
          e.stopPropagation();
        }
      });
      $("#graph-holder").one(
        "animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd",
        function() {
          self.chartView = new ChartView("graph-holder");
          self.chartView.addView("main-view");
          self.chartView.addView("recommended-view");
          self.chartView.addView("category-view");
          self.chartView.setMainView("main-view");
          self.chartView.addChart(
            "main-view",
            {
              xdomain: [year.min, year.max],
              ydomain: [0.0, 1.0],
              lines: [
                {
                  name: "Canada",
                  rawdata: Array.from(canada, (d, i) => {
                    return { x: year.min + i, y: d };
                  }),
                  data: Array.from(canada, (d, i) => {
                    return { x: year.min + i, y: d };
                  })
                },
                {
                  name: otherName,
                  rawdata: Array.from(other, (d, i) => {
                    return { x: year.min + i, y: d };
                  }),
                  data: Array.from(other, (d, i) => {
                    return { x: year.min + i, y: d };
                  })
                }
              ]
            },
            data => {
              data.chartName = "total";
            }
          );

          $("#recommended-view").css({ "overflow-y": "hidden" });
          $("#main-view").css({ "overflow-y": "hidden" });
          let counter = 0;
          for (const category in categories) {
            if (category in cmp.info.canadaCategories.categories) {
              let line1 = Array.from(
                cmp.info.canadaCategories.categories[category],
                (d, i) => {
                  return d;
                }
              );
              let line2 = Array.from(categories[category], (d, i) => {
                return d;
              });
              let area = self.getAreaBetweenCurve(line1, line2);
              self.checkArea(area, category);
            }
          }
          for (const category in categories) {
            if (category in cmp.info.canadaCategories.categories) {
              if (self.isRecommended(category)) {
                self.chartView.addChart(
                  "recommended-view",
                  {
                    xdomain: [year.min, year.max],
                    ydomain: [0.0, 1.0],
                    lines: [
                      {
                        name: "Canada",
                        rawdata: Array.from(
                          cmp.info.canadaCategories.categories[category],
                          (d, i) => {
                            return { x: year.min + i, y: d };
                          }
                        ),
                        data: Array.from(
                          cmp.info.canadaCategories.categories[category],
                          (d, i) => {
                            return { x: year.min + i, y: d };
                          }
                        )
                      },
                      {
                        name: otherName,
                        rawdata: Array.from(categories[category], (d, i) => {
                          return { x: year.min + i, y: d };
                        }),
                        data: Array.from(categories[category], (d, i) => {
                          return { x: year.min + i, y: d };
                        })
                      }
                    ]
                  },
                  data => {
                    data.chartName = category;
                  }
                );
                continue;
              }
              let category_id = "category" + counter++;
              self.categories[category_id] = category;
              $("#category-view").append(
                `<div id=${category_id} display="block" class="category" name=${category}><div display="block" style='background-color:#D3D3D3' id=${"head" +
                  category_id}>${category}  +</div></div>`
              );
              $("#" + category_id).on("click", function() {
                if ($("#" + category_id).find("svg").length == 0) {
                  self.chartView.clearView("main-view");
                  let name = self.categories[category_id];
                  //chart = new D3Chart("#" + category_id, true, name, {
                  //  x: width - padding,
                  //  y: height - padding
                  //});
                  self.chartView.addChart(
                    "main-view",
                    {
                      xdomain: [year.min, year.max],
                      ydomain: [0.0, 1.0],
                      lines: [
                        {
                          name: "Canada",
                          rawdata: Array.from(
                            cmp.info.canadaCategories.categories[name],
                            (d, i) => {
                              return { x: year.min + i, y: d };
                            }
                          ),
                          data: Array.from(
                            cmp.info.canadaCategories.categories[name],
                            (d, i) => {
                              return { x: year.min + i, y: d };
                            }
                          )
                        },
                        {
                          name: otherName,
                          rawdata: Array.from(categories[name], (d, i) => {
                            return { x: year.min + i, y: d };
                          }),
                          data: Array.from(categories[name], (d, i) => {
                            return { x: year.min + i, y: d };
                          })
                        }
                      ]
                    },
                    data => {
                      data.chartName = category;
                    }
                  );
                } else {
                  $("#" + category_id)
                    .find("svg")[0]
                    .remove();
                }
              });
            }
          }
        }
      );
    },
    parse(res) {
      let result = {};
      for (let i = 0; i < res.length; ++i) {
        let obj = JSON.parse(res[i].body);
        let categories = obj.category_for;
        for (const category in categories) {
          if (categories[category].name in result) {
            result[categories[category].name].push(categories[category].count);
          } else {
            result[categories[category].name] = [];
            result[categories[category].name].push(categories[category].count);
          }
        }
      }
      //normalize
      for (const category in result) {
        let sum = result[category].reduce((a, b) => a + b, 0);
        for (let i = 0; i < result[category].length; ++i) {
          result[category][i] /= sum;
        }
      }
      return result;
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
    },

    getAreaBetweenCurve(line1, line2) {
      if (line1.length != line2.length) {
        return 0;
      }
      let sum = 0;
      for (let i = 0; i < line1.length; ++i) {
        sum += Math.abs(line1[i] - line2[i]);
      }
      return sum;
    },

    checkArea(value, name) {
      if (this.recommended.length < this.numberRecommended) {
        this.recommended.push({ val: value, name: name });
        return true;
      }
      for (let i = 0; i < this.recommended.length; ++i) {
        if (value > this.recommended[i].val) {
          this.recommended[i].val = value;
          this.recommended[i].name = name;
          return true;
        }
      }
      return false;
    },
    isRecommended(name) {
      for (let i = 0; i < this.recommended.length; ++i) {
        if (this.recommended[i].name == name) {
          return true;
        }
      }
      return false;
    }
  },

  info: {
    currentKeyword: null,
    canadaCategories: null,
    normalizeCategories() {
      for (const category in this.canadaCategories.categories) {
        let sum = this.canadaCategories.categories[category].reduce(
          (a, b) => a + b,
          0
        );
        for (
          let i = 0;
          i < this.canadaCategories.categories[category].length;
          ++i
        ) {
          this.canadaCategories.categories[category][i] /= sum;
        }
      }
    }
  },
  //This data object contains all of the query information
  dataObject: {
    queries: [],
    metaData: [],
    get end() {
      return this.queries.length - 1;
    },
    hasData() {
      return this.queries.length;
    }
  },

  metricSelection: {
    async getMetric(selection) {
      if (selection == 5) {
        if ("contribution" in cmp.dataObject.metaData[cmp.dataObject.end]) {
          return cmp.dataObject.metaData[cmp.dataObject.end].contribution;
        }
        return this.getContribution();
      } else if (selection == 2) {
        if ("timesCited" in cmp.dataObject.metaData[cmp.dataObject.end]) {
          return cmp.dataObject.metaData[cmp.dataObject.end].timesCited;
        }
        return this.getTimesCited();
      } else if (selection == 4) {
        if ("funding" in cmp.dataObject.metaData[cmp.dataObject.end]) {
          return cmp.dataObject.metaData[cmp.dataObject.end].funding;
        }
        return await this.getFunding();
      } else if (selection == 3) {
        if ("consistency" in cmp.dataObject.metaData[cmp.dataObject.end]) {
          return cmp.dataObject.metaData[cmp.dataObject.end].consistency;
        }
        return await this.getConsistency();
      } else if (selection == 1) {
        return cmp.dataObject.metaData[cmp.dataObject.end].base;
      }
    },

    getMetrics() {
      this.getContribution();
    },
    getContribution() {
      const end = cmp.dataObject.queries.length - 1;
      let result = {};
      for (const country in cmp.dataObject.queries[end].countries) {
        for (const institute in cmp.dataObject.queries[end].countries[country]
          .institutions) {
          cmp.dataObject.queries[end].countries[country].institutions[
            institute
          ].contribution =
            14 +
            ((cmp.dataObject.queries[end].countries[country].institutions[
              institute
            ].total -
              cmp.dataObject.metaData[end].averagePaper) /
              cmp.dataObject.metaData[end].std) *
              4;
          result[institute] =
            cmp.dataObject.queries[end].countries[country].institutions[
              institute
            ].contribution;
        }
      }
      cmp.dataObject.metaData[end].contribution = result;
      return result;
    },

    async getTimesCited() {
      let promises = [];
      for (
        let i = cmp.dataObject.metaData[cmp.dataObject.end].years.min;
        i <= cmp.dataObject.metaData[cmp.dataObject.end].years.max;
        ++i
      ) {
        promises.push(
          await this.query("/institute-citations", {
            country: "Canada",
            year: i,
            keyword: cmp.dataObject.metaData[cmp.dataObject.end].keyword
          })
        );
      }
      for (
        let i = cmp.dataObject.metaData[cmp.dataObject.end].years.min;
        i <= cmp.dataObject.metaData[cmp.dataObject.end].years.max;
        ++i
      ) {
        promises.push(
          await this.query("/institute-citations-not", {
            country: "Canada",
            year: i,
            keyword: cmp.dataObject.metaData[cmp.dataObject.end].keyword
          })
        );
      }
      let citations = {};
      for (let i = 0; i < promises.length; ++i) {
        let data = JSON.parse(promises[i].body).publications;
        console.log(data);
        for (let j = 0; j < data.length; ++j) {
          if ("research_orgs" in data[j] && "times_cited" in data[j]) {
            for (let k = 0; k < data[j].research_orgs.length; ++k) {
              if (data[j].research_orgs[k].name in citations) {
                citations[data[j].research_orgs[k].name] += data[j].times_cited;
              } else {
                citations[data[j].research_orgs[k].name] = data[j].times_cited;
              }
            }
          }
        }
      }
      let max = 0;
      for (const ins in citations) {
        let comp = citations[ins];
        if (comp > max) {
          max = comp;
        }
      }
      for (const ins in citations) {
        citations[ins] = 10 + (citations[ins] / max) * 15;
      }
      cmp.dataObject.metaData[cmp.dataObject.end].timesCited = citations;
      return citations;
    },

    async getFunding() {
      let results = [];
      for (
        let i = cmp.dataObject.metaData[cmp.dataObject.end].years.min;
        i < cmp.dataObject.metaData[cmp.dataObject.end].years.max;
        ++i
      ) {
        results.push(
          await this.query("/funding-can", {
            year: i,
            keyword: cmp.dataObject.metaData[cmp.dataObject.end].keyword
          })
        );
      }
      for (
        let i = cmp.dataObject.metaData[cmp.dataObject.end].years.min;
        i < cmp.dataObject.metaData[cmp.dataObject.end].years.max;
        ++i
      ) {
        results.push(
          await this.query("/funding", {
            year: i,
            keyword: cmp.dataObject.metaData[cmp.dataObject.end].keyword
          })
        );
      }
      funding = {};
      for (let i = 0; i < results.length; ++i) {
        let data = JSON.parse(results[i].body).research_orgs;
        for (let j = 0; j < data.length; ++j) {
          if (data[j].name in funding) {
            funding[data[j].name] += data[j].funding;
          } else {
            funding[data[j].name] = data[j].funding;
          }
        }
      }
      cmp.dataObject.metaData[cmp.dataObject.end].funding = funding;
      let max = 0;
      for (const ins in funding) {
        let comp = funding[ins];
        if (comp > max) {
          max = comp;
        }
      }
      for (const ins in funding) {
        funding[ins] = 10 + (funding[ins] / max) * 15;
      }
      return funding;
    },

    getConsistency() {
      result = {};
      const end = cmp.dataObject.queries.length - 1;
      for (const country in cmp.dataObject.queries[end].countries) {
        for (const institute in cmp.dataObject.queries[end].countries[country]
          .institutions) {
          let sequence =
            cmp.dataObject.queries[end].countries[country].institutions[
              institute
            ].sequence;
          let slopes = [];
          const sequenceEnd = sequence.length - 1;
          //calculate slope assume x distance is 1 || which it has to be for lead lag so it is fine to assume
          for (let i = 0; i < sequenceEnd; ++i) {
            const next = i + 1;
            let slope = sequence[next] - sequence[i];
            slopes.push(slope);
          }
          let sum = slopes.reduce(function(acc, val) {
            return acc + val;
          }, 0);
          let avg = sum / slopes.length;
          let std = 0;
          for (let i = 0; i < slopes.length; ++i) {
            std += (slopes[i] - avg) * (slopes[i] - avg);
          }
          std /= slopes.length - 1;
          std = Math.sqrt(std);
          cmp.dataObject.queries[end].countries[country].institutions[
            institute
          ].consistency = 20 - std * 50;
          result[institute] = 20 - std * 50;
        }
      }
      cmp.dataObject.metaData[end].consistency = result;
      return result;
    },
    async query(route, params) {
      let response = await d3.json(route, {
        method: "POST",
        body: JSON.stringify({
          country_name: params.country,
          keyword: params.keyword,
          year: params.year
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      return response;
    }
  }
};
class ProgressBar {
  /**
   *
   * @param {string} id - element id
   */
  constructor(id) {
    $(id).append(`<div class='progressBackground'></div>`);
    this.root = $(".progressBackground");
    $(this.root).append(`<div class='progressBar'></div>`);
    this.bar = $(".progressBar");
  }
  /**
   *
   * @param {number} percent number 0-100
   */
  setProgress(percent) {
    $(this.bar).width(`${percent}%`);
  }
  root = null;
  bar = null;
  gradient = null;
}
class Scrubber {
  /**
   *
   * @param {{width: Number, height: Number}} size
   */
  constructor(size, parent, scales) {
    this.brush = d3
      .brushX()
      .extent([
        [0, -5],
        [size.width, size.height]
      ])
      .on("brush", this.brushed.bind(this));
    this.brushVis = parent
      .append("g")
      .attr("class", "brush")
      .call(this.brush);

    this.parent = parent;
    this.scales = scales;

    this.minYear = this.scales.x.invert(0);
    this.maxYear = this.scales.x.invert(size.width);
    //move brush to default position
    this.brushVis.call(this.brush.move, [
      scales.x(this.currentSelection.min),
      scales.x(this.currentSelection.max)
    ]);
  }

  /**
   *
   * @param {{min:number, max:number}} extent - extent year selection
   */
  setExtent(extent) {
    this.brush.extent([
      [this.scales.x(extent.min), -5],
      [this.scales.x(extent.max), this.scales.y(1)]
    ]);
    this.minYear = extent.min;
    this.maxYear = extent.max;
  }
  setOpacity(value) {
    this.parent.select(".brush").attr("opacity", `${value}%`);
  }
  hidden() {
    this.parent.select(".brush").attr("opacity", `${0}%`);
  }
  visible() {
    this.parent.select(".brush").attr("opacity", `${30}%`);
  }
  brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
    const d0 = d3.event.selection.map(this.scales.x.invert);
    d0[0] = Math.round(d0[0]);
    d0[1] = Math.round(d0[1]);
    if (d0[1] - d0[0] > this.maxSelection) {
      d0[0] += d0[1] - d0[0] - this.maxSelection;
    }
    if (d0[1] - d0[0] < this.minSelection) {
      d0[1] += this.minSelection - (d0[1] - d0[0]);
      if (d0[1] > this.maxYear) {
        let offset = d0[1] - this.maxYear;
        d0[1] = this.maxYear;
        d0[0] -= offset;
      }
    }
    let selection = d0[1] - d0[0];
    if (d0[1] > this.maxYear - selection) {
      let offset = this.maxYear - selection - d0[1];
      d0[1] += offset;
      d0[0] += offset;
    }
    if (d0[0] < this.minYear + selection) {
      let offset = this.minYear + selection - d0[0];
      d0[1] += offset;
      d0[0] += offset;
    }
    this.currentSelection = { min: d0[0], max: d0[1] };
    this.updateOnBrushed(d0);
    this.brushVis.call(this.brush.move, [
      this.scales.x(d0[0]),
      this.scales.x(d0[1])
    ]);
  }
  getNumYearsSelected() {
    return this.currentSelection.max - this.currentSelection.min;
  }
  scales = null;
  parent = null;
  brush = null;
  brushVis = null;
  onEndCallbacks = [];
  minSelection = 3;
  maxSelection = 10;
  minYear = 1950;
  maxYear = new Date().getFullYear();
  currentSelection = {
    min: new Date().getFullYear() - 3,
    max: new Date().getFullYear()
  };
  onBrushedCallbacks = [];
  /**
   *
   * @param {function(Array.<number>)} callback
   */
  onBrushed(callback) {
    this.onBrushedCallbacks.push(callback);
  }
  /**
   *
   * @param {function({min:Number max:Number})} callbacks
   */
  onEnd(callbacks) {
    this.onEndCallbacks.push(callbacks);
  }
  updateOnBrushed(position) {
    for (let i = 0; i < this.onBrushedCallbacks.length; ++i) {
      this.onBrushedCallbacks[i]({ x: position[0], width: position[1] });
    }
  }
  endCallbacks() {
    for (let i = 0; i < this.onEndCallbacks.length; ++i) {
      this.onEndCallbacks[i](this.currentSelection);
    }
  }
}
class STDGraph {
  /**
   *
   * @param {{width:Number, height:Number}} size
   * @param {Array.<{x: Number, y: Number}>} data
   * @param {String} parentID
   * @param {{top:Number, right: Number, left: Number, bottom: Number}} margin - default is {top: 10, right:30, bottom:30, left:60}
   */
  constructor(size, data, parentID, margin = null) {
    if (margin != null) {
      this.margin = margin;
    }
    this.size = size;
    this.data = [...data];
    this.parentID = parentID;
    this.size.width = this.size.width - this.margin.left - this.margin.right;
    this.size.height = this.size.height - this.margin.top - this.margin.bottom;
    this.render();
  }
  data = [];
  size = { width: null, height: null };

  margin = { top: 10, right: 30, bottom: 35, left: 40 };
  svg = null;
  parentID = null;

  xRange = [1950, new Date().getFullYear()];

  scales = { x: null, y: null };
  axii = { x: null, y: null };

  line = null;
  scrubber = null;

  raise() {
    this.svg.raise();
  }
  /**
   *
   * @param {Array<>.{x:Number, y:Number}} data
   */
  updateData(data) {
    this.data = data;
    if (this.scrubber != null && this.data.length > 8) {
      this.scrubber.visible();
    }
    let maxY = Math.max(...data.map(val => val.y));
    let minY = Math.min(...data.map(val => val.y));

    if (maxY > this.scales.y.domain()[1]) {
      this.scales.y.domain([this.scales.y.domain()[0], maxY]);

      if (minY < this.scales.y.domain()[0]) {
        this.scales.y.domain([minY, this.scales.y.domain()[1]]);
      }
      this.svg
        .selectAll(".y-axis")
        .transition()
        .duration(3000)
        .call(this.axii.y);
    }
    let self = this;
    var u = this.svg.selectAll(".line-path").data([this.data]);

    // Updata the line
    u.enter()
      .append("path")
      .attr("class", "line-path")
      .merge(u)
      .transition()
      .duration(500)
      .attr(
        "d",
        d3
          .line()
          .x(function(d) {
            return self.scales.x(d.x);
          })
          .y(function(d) {
            return self.scales.y(d.y);
          })
      )
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2.5);
  }
  render() {
    this.svg = d3
      .select(this.parentID)
      .append("svg")
      .attr("width", this.size.width + this.margin.left + this.margin.right)
      .attr("height", this.size.height + this.margin.bottom + this.margin.top)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );
    this.scales.x = d3
      .scaleLinear()
      .domain(this.xRange)
      .range([0, this.size.width]);

    this.axii.x = this.svg
      .append("g")
      .attr("transform", "translate(0," + this.size.height + ")")
      .attr("class", "x-axis")
      .call(d3.axisBottom(this.scales.x).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start")
      .style("font-family", "helvetica-lite")
      .style("font-size", "12px");

    let maxY = Math.max(...this.data.map(val => val.y));
    let minY = Math.min(...this.data.map(val => val.y));
    if (this.data.length == 0) {
      maxY = 0;
      minY = 0;
    }
    this.scales.y = d3
      .scaleLinear()
      .domain([minY, maxY])
      .range([this.size.height, 0]);
    this.axii.y = d3.axisLeft(this.scales.y);
    this.svg
      .append("g")
      .attr("class", "y-axis")
      .call(this.axii.y);

    let self = this;
    var u = this.svg.selectAll(".line-path").data([this.data]);

    // Updata the line
    u.enter()
      .append("path")
      .attr("class", "line-path")
      .merge(u)
      .transition()
      .duration(500)
      .attr(
        "d",
        d3
          .line()
          .x(function(d) {
            return self.scales.x(d.x);
          })
          .y(function(d) {
            return self.scales.y(d.y);
          })
      )
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2.5);
    this.scrubber = new Scrubber(this.size, this.svg, this.scales);
    //his.scrubber.hidden();
  }
}

class EventGraph {
  parent = null;
  margin = { top: 0, right: 30, bottom: 0, left: 40 };
  data = [];
  size = null;
  xRange = [1950, new Date().getFullYear()];
  scales = { x: null, y: null };
  events = null;
  eventName = null;
  color = null;
  constructor(size, data, parentID, eventName, color = null, margin = null) {
    if (margin != null) {
      this.margin = margin;
    }
    this.size = size;
    this.data = [...data];
    this.parent = parentID;
    this.size.width = this.size.width - this.margin.left - this.margin.right;
    this.size.height = this.size.height - this.margin.top - this.margin.bottom;
    if (color != null) {
      this.color = color;
    }
    const randomHsl = () => `hsla(${Math.random() * 360}, 100%, 50%, 1)`;
    this.color = randomHsl();
    this.eventName = eventName;
    this.render();
  }
  updateData(data) {
    this.data = data;
    let self = this;
    this.svg.selectAll("." + this.eventName).remove();
    this.svg
      .selectAll("." + this.eventName)
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", this.eventName)
      .attr("x", function(d) {
        return self.scales.x(d.x1);
      })
      .attr("y", function(d) {
        return self.scales.y(1);
      })
      .attr("height", function(d) {
        return Math.abs((self.scales.y(0) - self.scales.y(1)) / 2);
      })
      .attr("width", function(d) {
        console.log(d);
        return self.scales.x(d.x2) - self.scales.x(d.x1);
      })
      .attr("rx", "5px")
      .style("fill", this.color);
  }
  createScrubberLines(position) {
    let self = this;
    this.svg.selectAll(".scrubber-rect").remove();
    this.svg
      .selectAll(".scrubber-rect")
      .data([position])
      .enter()
      .append("rect")
      .attr("class", "scrubber-rect")
      .attr("x", function(d) {
        return self.scales.x(d.x);
      })
      .attr("y", this.scales.y(1))
      .attr("width", function(d) {
        return self.scales.x(d.width) - self.scales.x(d.x);
      })
      .attr("height", this.scales.y(0))
      .style("fill", "steelblue")
      .style("opacity", 0.5)
      .style("stroke-opacity", 0)
      .transition()
      .duration(2000)
      .style("opacity", 0)
      .remove();
  }
  render() {
    this.svg = d3
      .select(this.parent)
      .append("svg")
      .attr("width", this.size.width + this.margin.left + this.margin.right)
      .attr("height", this.size.height + this.margin.bottom + this.margin.top)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    this.scales.x = d3
      .scaleLinear()
      .domain(this.xRange)
      .range([0, this.size.width]);

    this.scales.y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([this.size.height, 0]);

    let self = this;
    this.svg
      .selectAll("." + this.eventName)
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", this.eventName)
      .attr("x", function(d) {
        return self.scales.x(d.x1);
      })
      .attr("y", function(d) {
        return self.scales.y(0.75);
      })
      .attr("height", function(d) {
        return Math.abs((self.scales.y(0) - self.scales.y(1)) / 2);
      })
      .attr("width", function(d) {
        console.log(d);
        return self.scales.x(d.x2) - self.scales.x(d.x1);
      })
      .attr("rx", "5px")
      .style("fill", this.color);
  }
}
class TimeView {
  constructor(id) {
    this.progressBar = new ProgressBar(id);
  }
  setProgress(value) {
    this.progressBar.setProgress(value);
  }
  progressBar = null;
}

class InstitutionData {
  papers = {};
  funding = {};
  citations = {};
  /**
   *
   * @param {Number} year
   * @returns {Boolean}
   */
  hasPapers(year) {
    return year in this.papers;
  }
  /**
   *
   * @param {Number} year
   * @returns {Number}
   */
  getPapers(year) {
    return this.papers[year];
  }
  /**
   *
   * @param {Number} year
   * @param {Number} value
   */
  addPapers(year, value) {
    this.papers[year] = value;
  }
  /**
   *
   * @param {Number} year
   * @returns {Boolean}
   */
  hasFunding(year) {
    return year in this.funding;
  }
  /**
   *
   * @param {Number} year
   * @returns {Number}
   */
  getFunding(year) {
    return this.funding[year];
  }
  /**
   *
   * @param {Number} year
   * @param {Number} value
   */
  addFunding(year, value) {
    this.funding[year] = value;
  }
}
class CountryData {
  institutes = [];
  countryTotal = {};
  /**
   *
   * @param {string} name
   * @returns {InstitutionData}
   */
  getInstitute(name) {
    return this.institutes[name];
  }
  /**
   *
   * @param {string} name
   * @returns {boolean}
   */
  hasInstitute(name) {
    return name in this.institutes;
  }
  /**
   *
   * @param {string} name
   * @param {InstitutionData} institute
   */
  addInstitute(name, institute) {
    this.institutes[name] = institute;
  }
  /**
   *
   * @param {string} year - year of interest
   * @returns {Boolean}
   */
  hasTotal(year) {
    return year in this.countryTotal;
  }
  /**
   *
   * @param {string} year - year of interest
   * @returns {Number} total papers for country
   */
  getTotal(year) {
    return this.countryTotal[year];
  }
  /**
   *
   * @param {string} year - year of interest
   * @param {Number} value - country total
   */
  addTotal(year, value) {
    this.countryTotal[year] = value;
  }

  /**
   *
   * @param {Number} year
   */
  calculateTotal(year) {
    let sum = 0;
    for (const institute in this.institutes) {
      if (this.institutes[institute].hasPapers(year)) {
        sum += this.institutes[institute].getPapers(year);
      }
    }
    this.countryTotal[year] = sum;
  }
}

class DataObject {
  currentYearLoading = new Date().getFullYear();
  queryReturned = { canada: false, notCanada: false };
  minYearLoaded = 1950;
  intervalRate = 5000;
  countries = {};

  callback = null;
  intervalVar = null;

  onDataCallbacks = [];

  /**
   *
   * @param {TimeView} timeview
   */
  constructor() {}
  onFinished(callback) {
    this.callback = callback;
  }

  /**
   *
   * @param {string} name - country name
   * @returns {Boolean}
   */
  hasCountry(name) {
    return name in this.countries;
  }
  /**
   *
   * @param {string} name - country name
   * @returns {CountryData}
   */
  getCountry(name) {
    return this.countries[name];
  }
  /**
   *
   * @param {string} name - country name
   * @param {CountryData} country
   */
  addCountry(name, country) {
    this.countries[name] = country;
  }
  /**
   *
   * @param {function(DataObject)} callback
   */
  onData(callback) {
    this.onDataCallbacks.push(callback);
  }
  updateOnData() {
    for (let i = 0; i < this.onDataCallbacks.length; ++i) {
      this.onDataCallbacks[i](this);
    }
  }

  /**
   *
   * @param {string} keyword
   */
  getAllPapers(keyword) {
    let self = this;
    this.intervalVar = setInterval(function() {
      self.queryPapers(keyword);
    }, this.intervalRate);
  }
  pauseLoading() {
    if (this.intervalVar != null) {
      clearInterval(this.intervalVar);
    }
  }
  /**
   *
   * @param {Number} year
   * @param {string} keyword
   */
  queryPapers(keyword) {
    //suspend the interval until after the query has returned
    clearInterval(this.intervalVar);
    console.log(this.currentYearLoading);
    this.queryReturned = { canada: false, notCanada: false };
    this.getCanadaPapers(
      this.currentYearLoading,
      keyword,
      this.queryCanadaCallback.bind(this)
    );
    this.getWorldPapers(
      this.currentYearLoading,
      keyword,
      this.queryWorldCallback.bind(this)
    );
    --this.currentYearLoading;
    if (this.currentYearLoading < this.minYearLoaded) {
      if (this.callback != null) {
        this.callback();
      }
      clearInterval(this.intervalVar);
    }
  }
  /**
   *
   * @param {Number} year
   * @param {string} keyword
   * @param {function} callback
   */
  getCanadaPapers(year, keyword, callback) {
    d3.json("/querycanada", {
      method: "POST",
      body: JSON.stringify({ keyword: keyword, year: year }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
      .then(function(data) {
        callback(data, year, keyword);
      })
      .catch(function(err) {
        console.log(err);
      });
  }
  /**
   *
   * @param {Number} year
   * @param {string} keyword
   * @param {function} callback
   */
  getWorldPapers(year, keyword, callback) {
    d3.json("/querynotcanada", {
      method: "POST",
      body: JSON.stringify({ keyword: keyword, year: year }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
      .then(function(data) {
        callback(data, year, keyword);
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  queryCanadaCallback(data, year, keyword) {
    this.queryReturned.canada = true;
    let result = JSON.parse(data.body);
    //this could break if they change the research_orgs property
    //currently I do not see a way to avoid this potential failpoint
    let property = "research_orgs";
    if (!(property in result)) {
      if (this.queryReturned.notCanada && this.queryReturned.canada) {
        if (year > this.minYearLoaded) {
          this.getAllPapers(keyword);
        }
      }
      return;
    }
    result = result.research_orgs;
    //sometimes there is collaborations, we have chosen to filters those out
    //essentially, we only look at the institutes that reside in canada
    result = result.filter(function(x) {
      return x.country_name == "Canada";
    });
    //add canada country to data object
    if (!this.hasCountry("Canada")) {
      this.addCountry("Canada", new CountryData());
    }
    //iterate through query and add all institutes and their number of papers for this year
    for (let i = 0; i < result.length; ++i) {
      if (this.getCountry("Canada").hasInstitute(result[i].name)) {
        this.getCountry("Canada")
          .getInstitute(result[i].name)
          .addPapers(year, result[i].count);
      } else {
        let country = this.getCountry("Canada");
        country.addInstitute(result[i].name, new InstitutionData());
        country.getInstitute(result[i].name).addPapers(year, result[i].count);
      }
    }
    //once we have added all of the papers to the institutes within the country, calculate the total for the country
    this.getCountry("Canada").addTotal(
      year,
      result.reduce((acc, val) => acc + val.count, 0)
    );
    if (this.queryReturned.notCanada && this.queryReturned.canada) {
      this.updateOnData();
      if (year > this.minYearLoaded) {
        this.getAllPapers(keyword);
      }
    }
  }
  queryWorldCallback(data, year, keyword) {
    this.queryReturned.notCanada = true;
    let result = JSON.parse(data.body);
    let property = "research_orgs";
    //this could break if they change the research_orgs property
    //currently I do not see a way to avoid this potential failpoint
    if (!(property in result)) {
      if (this.queryReturned.notCanada && this.queryReturned.canada) {
        if (year > this.minYearLoaded) {
          this.getAllPapers(keyword);
        }
      }
      return;
    }
    result = result.research_orgs;
    //add the countries and their institutes
    //add the paper count to institutes
    for (let i = 0; i < result.length; ++i) {
      if (!this.hasCountry(result[i].country_name)) {
        this.addCountry(result[i].country_name, new CountryData());
      }
      let country = this.getCountry(result[i].country_name);
      if (!country.hasInstitute(result[i].name)) {
        country.addInstitute(result[i].name, new InstitutionData());
      }
      let institute = country.getInstitute(result[i].name);
      institute.addPapers(year, result[i].count);
    }
    //calculate total papers for countries in the specified year
    for (let country in this.countries) {
      this.getCountry(country).calculateTotal(year);
    }

    if (this.queryReturned.notCanada && this.queryReturned.canada) {
      this.updateOnData();
      if (year > this.minYearLoaded) {
        this.getAllPapers(keyword);
      }
    }
  }
}
class Countries {
  coloredList = [];
  countryNames = {};
  group = null;
  data = null;
  onHoverCallback = null;
  tooltip = null;
  constructor(data) {
    this.data = data;
    for (let i = 0; i < data.length; ++i) {
      this.countryNames[data[i].properties.name] = data[i].properties.iso_a3;
    }
  }

  render(svg, projection) {
    var self = this;
    this.group = svg
      .selectAll("path")
      .data(this.data)
      .enter()
      .append("path")
      .attr("d", projection)
      .attr("id", function(d, i) {
        return "country" + d.properties.iso_a3;
      })
      .attr("name", function(d, i) {
        return d.properties.name;
      })
      .attr("class", "country")
      .on("mouseover", function(d, i) {
        d3.select(this).raise();
        d3.select(this).style("stroke", "black");
        d3.select(this).style("stroke-width", "5px");
        if (self.onHoverCallback == null) {
          let box = d3
            .select(this)
            .node()
            .getBoundingClientRect();
          self.tooltip = new Tooltip(
            "#map-holder",
            box,
            `<p>${d.properties.name}</p`
          );
        } else {
          self.onHoverCallback(self.tooltip);
        }
      })
      .on("mouseout", function(d, i) {
        d3.select(this).style("stroke", "white");
        d3.select(this).style("stroke-width", "1px");
        self.tooltip.destroy();
        self.tooltip = null;
      })
      .on("click", function(d, i) {});
  }
  /**
   *
   * @param {Array.<{country_name:string, leadlag:number}>} data
   * @param {Array.<String>} missingData
   * @param {} colorScale
   */
  color(data, colorScale, missingData) {
    for (let i = 0; i < data.length; ++i) {
      if (data[i].country_name in this.countryNames) {
        let acronym = this.countryNames[data[i].country_name];
        $(`#country${acronym}`).css({
          fill: colorScale.get(data[i].leadlag)
        });
      } else {
        console.log(`${data[i].country_name} does not exist in dictionary`);
      }
    }
    for (let i = 0; i < missingData.length; ++i) {
      if (missingData[i] in this.countryNames) {
        let acronym = this.countryNames[missingData[i]];
        $(`#country${acronym}`).css({ fill: "url(#missing-data)" });
      }
    }
  }
  reset(color = "#f5f5f5") {
    this.group.selectAll("path").style("fill", color);
  }
  /**
   *
   * @param {function(Tooltip)} callback
   */
  onHover(callback) {
    this.onHoverCallback = callback;
  }
}
class Institutions {
  constructor(svg, data, colorScale, transform, projection) {
    let location_ids = Array.from(data, x => x.id);
    let self = this;
    this.getLocations(location_ids, function(res) {
      let locations = JSON.parse(res.body);
      //TODO finish institution location
      self.render(svg, data, colorScale, transform);
    });
  }
  /**
   *
   * @param {[string]} grid_ids
   */
  getLocations(grid_ids, callback) {
    d3.json("/geo-locations", {
      method: "POST",
      body: JSON.stringify({ grid_ids: grid_ids }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    })
      .then(callback)
      .catch(function(err) {
        console.error(err);
      });
  }
  render(svg, data, colorScale, transform) {
    var self = this;
    this.group = svg.append("g");
    this.group.attr("class", "noselect");
    this.group.attr(
      "transform",
      `translate(${transform.translateX}, ${transform.translateY})scale(${transform.scale})`
    );
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
        .attr("stroke-width", 3)
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
          if (d.trend > 0.01) {
            rotation = -45;
          }
          if (d.trend < -0.01) {
            rotation = 45;
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
    this.collision = d3.forceCollide().radius(function(d) {
      return d.scale;
    });
    this.simulation = d3
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
      .force("collide", this.collision)
      .alpha(1)
      .on("tick", this.tick.bind(this));
  }
  color(colorScale) {
    let g = this.group.selectAll("g");
    g.each(function(d, i) {
      d3.select(this).attr("fill", colorScale.get(d.lead));
    });
  }
  setRadius() {
    let svg = d3.select("svg");
    let g = this.group.selectAll("g");
    g.each(function(d, i) {
      d3.select(this)
        .select("circle")
        .attr("r", function(d) {
          if (d.name in scale) {
            d.scale = scalarFunction(scale[d.name]);
            return d.scale;
          }
        });
      d3.select(this)
        .select("line")
        .attr("x1", function(d) {
          if (d.name in scale) {
            return scalarFunction(scale[d.name]);
          }
        })
        .attr("x2", function(d) {
          if (d.name in scale) {
            return 0 - scalarFunction(scale[d.name]);
          }
        });
    });
    this.collision.initialize(this.simulation.nodes());
    this.simulation.alpha(1).restart();
  }
  tick() {
    this.group.selectAll("g").attr("transform", function(d, i) {
      return `translate(${d.x},${d.y})`;
    });
  }
  destroy() {
    if (this.group != null) {
      this.group.remove();
    }
  }
  nodes = [];
  group = null;
  rendered = false;
  tooltip = null;
  simulation = null;
  collision = null;
}

class MapInteraction {
  easyPZ = null;
  elements = [];
  /**
   *
   * @param {Element} svg
   * @param {{scale:Number, translateX: Number, translateY: Number}} defaultPosition
   */
  constructor(svg, defaultPosition = null) {
    this.easyPZ = new EasyPZ(
      svg,
      this.transform.bind(this),
      {
        minScale: 0.1,
        maxScale: 2,
        bounds: {
          top: NaN,
          right: NaN,
          bottom: NaN,
          left: NaN
        }
      },
      ["SIMPLE_PAN", "WHEEL_ZOOM", "PINCH_ZOOM"]
    );
    if (defaultPosition == null) {
      this.easyPZ.totalTransform = {
        scale: 0.1,
        translateX: $(window).width() / 2,
        translateY: $(window).height() / 2 + 152
      };
    } else {
      this.easyPZ.totalTransform = defaultPosition;
    }
  }
  /**
   * @returns {{translateX:Number, translateY:Number, scale:Number}}
   */
  getTransform() {
    return this.easyPZ.totalTransform;
  }
  transform(transform) {
    for (let i = 0; i < this.elements.length; ++i) {
      this.elements[i].attr(
        "transform",
        `translate(${transform.translateX}, ${transform.translateY})scale(${transform.scale})`
      );
    }
  }
  /**
   *
   * @param {Element} element
   */
  addElementToTransform(element) {
    this.elements.push(element);
  }
  /**
   *
   * @param {Element} element
   */
  removeElementToTransform(element) {
    this.elements.splice(this.elements.indexOf(element), 1);
  }
}
class Tooltip {
  /**
   *
   * @param {Element} parent
   * @param {{x:number, y:number: height:number, width:number}} rect
   * @param {InnerHTML} html
   * @param {Object} style
   */
  vis = null;
  constructor(parent, rect, html, style = null) {
    if (style == null) {
      this.vis = d3
        .select(parent)
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0 0 3px")
        .style("stroke", "black");
    } else {
      this.vis = d3
        .select(parent)
        .append("div")
        .style(style);
    }
    this.vis
      .style("visibility", "visible")
      .style("left", rect.x + rect.width + "px")
      .style("top", rect.y + rect.height + "px")
      .style("padding-left", "20px")
      .style("padding-right", "20px")
      .style("padding-top", "10px")
      .style("padding-bottom", "10px")
      .html(html);
  }
  destroy() {
    this.vis.remove();
  }
}
class MapObj {
  countries = null;
  interaction = null;
  dataObject = new DataObject();
  stdGraph = new STDGraph(
    { width: $("#timeline").width(), height: 300 },
    [],
    "#timeline"
  );
  eventGraph = new EventGraph(
    { width: $("#timeline").width(), height: 30 },
    [],
    "#timeline",
    "testEvent"
  );
  eventGraph2 = new EventGraph(
    { width: $("#timeline").width(), height: 30 },
    [],
    "#timeline",
    "testEvent2"
  );
  constructor() {
    this.dataObject.onData(this.onDataUpdateSTDGraph.bind(this));
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph.createScrubberLines.bind(this.eventGraph)
    );
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph2.createScrubberLines.bind(this.eventGraph2)
    );
    this.dataObject.onData(this.mostLead.bind(this));
    this.dataObject.onData(this.mostLag.bind(this));
  }
  createCountries(svg, json, projection) {
    this.countries = new Countries(json);
    this.countries.render(svg, projection);
  }
  /**
   *
   * @param {Element} svg svg element
   */
  createInteraction(svg) {
    this.interaction = new MapInteraction(svg);
  }
  onDataUpdateSTDGraph(dataObject) {
    if (!dataObject.hasCountry("Canada")) {
      return;
    }
    let previousYear = dataObject.currentYearLoading + 1;
    let canada = dataObject.countries["Canada"];
    let sum = 0;
    let counter = 0;
    for (let value in canada.countryTotal) {
      ++counter;
      sum += canada.countryTotal[value];
    }
    let avg = sum / counter;
    let data = [];
    for (let value in canada.countryTotal) {
      data.push({ x: Number(value), y: canada.countryTotal[value] });
    }
    this.stdGraph.updateData(data);
  }

  mostLead(dateObject) {
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected() + 1;
    const currentYear = this.dataObject.currentYearLoading + 1;
    if (new Date().getFullYear() - currentYear < leadLagWindow * 3) {
      return;
    }
    let mostLead = 0;
    let eventRange = {
      max: new Date().getFullYear() - leadLagWindow,
      min: new Date().getFullYear() - leadLagWindow * 2
    };
    for (
      let max = new Date().getFullYear() - leadLagWindow,
        min = new Date().getFullYear() - leadLagWindow * 2;
      min > currentYear + leadLagWindow;
      --min, --max
    ) {
      let val = this.leadSum({ min: min, max: max });
      if (val < mostLead) {
        eventRange = { max: max, min: min };
        mostLead = val;
      }
    }
    this.eventGraph.updateData([{ x1: eventRange.min, x2: eventRange.max }]);
  }
  mostLag(dataObject) {
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected() + 1;
    const currentYear = this.dataObject.currentYearLoading + 1;
    if (new Date().getFullYear() - currentYear < leadLagWindow * 3) {
      return;
    }
    let mostLead = 0;
    let eventRange = {
      max: new Date().getFullYear() - leadLagWindow,
      min: new Date().getFullYear() - leadLagWindow * 2
    };
    for (
      let max = new Date().getFullYear() - leadLagWindow,
        min = new Date().getFullYear() - leadLagWindow * 2;
      min > currentYear + leadLagWindow;
      --min, --max
    ) {
      let val = this.lagSum({ min: min, max: max });
      if (val > mostLead) {
        eventRange = { max: max, min: min };
        mostLead = val;
      }
    }
    this.eventGraph2.updateData([{ x1: eventRange.min, x2: eventRange.max }]);
  }
  /**
   *
   * @param {{min:number, max:number}} years
   */
  leadSum(years) {
    let offset = years.max - years.min + 1;
    const canada = this.dataObject.getCountry("Canada");
    let canadaData = [];
    let sum = 0;
    for (let i = years.min; i <= years.max; ++i) {
      if (!canada.hasTotal(i)) {
        return 0;
      }
      canadaData.push(canada.getTotal(i));
    }

    for (const country in this.dataObject.countries) {
      if (country == "Canada") {
        continue;
      }
      const currentCountry = this.dataObject.getCountry(country);
      let currentCountryData = [];
      for (let i = years.min - offset; i <= years.max + offset; ++i) {
        if (!currentCountry.hasTotal(i)) {
          break;
        }
        currentCountryData.push(currentCountry.getTotal(i));
      }
      if (currentCountryData.length == canadaData.length * 3) {
        let lead = leadlag(canadaData, currentCountryData);
        if (lead.bestOffset < 0) {
          sum += lead.bestOffset;
        }
      }
    }
    return sum;
  }
  /**
   *
   * @param {{min:number, max:number}} years
   */
  lagSum(years) {
    let offset = years.max - years.min + 1;
    const canada = this.dataObject.getCountry("Canada");
    let canadaData = [];
    let sum = 0;
    for (let i = years.min; i <= years.max; ++i) {
      if (!canada.hasTotal(i)) {
        return 0;
      }
      canadaData.push(canada.getTotal(i));
    }

    for (const country in this.dataObject.countries) {
      if (country == "Canada") {
        continue;
      }
      const currentCountry = this.dataObject.getCountry(country);
      let currentCountryData = [];
      for (let i = years.min - offset; i <= years.max + offset; ++i) {
        if (!currentCountry.hasTotal(i)) {
          break;
        }
        currentCountryData.push(currentCountry.getTotal(i));
      }
      if (currentCountryData.length == canadaData.length * 3) {
        let lead = leadlag(canadaData, currentCountryData);
        if (lead.bestOffset > 0) {
          sum += lead.bestOffset;
        }
      }
    }
    return sum;
  }

  reset() {
    if (this.countries != null) {
      this.countries.reset();
    }
  }
}
