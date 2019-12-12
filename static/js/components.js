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

    setKeyword(keyword) {
      this.keyword = keyword;
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
            window.visualize(canada, selfCountry, countryName, self.year);
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
    categories: {},
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
          $("#main-view").css({ "overflow-y": "hidden" });
          let counter = 0;
          for (const category in categories) {
            if (category in cmp.info.canadaCategories.categories) {
              let category_id = "category" + counter++;
              self.categories[category_id] = category;
              $("#category-view").append(
                `<div id=${category_id} display="block" class="category" name=${category}><div display="block" style='background-color:#D3D3D3' id=${"head" +
                  category_id}>${category}  +</div></div>`
              );
              $("#" + category_id).on("click", function() {
                if ($("#" + category_id).find("svg").length == 0) {
                  let name = self.categories[category_id];
                  let height = $("#category-view").height();
                  let width = $("#category-view").width();
                  let padding = 30;
                  chart = new D3Chart("#" + category_id, true, name, {
                    x: width - padding,
                    y: height - padding
                  });
                  chart.updateXScale(
                    new Date(year.min, 0),
                    new Date(year.max, 0)
                  );
                  chart.updateYScale(0.0, 1.0);
                  chart.updateLines([
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
                  ]);
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

  timeline: {
    years: { min: null, max: null },
    maxSelection: 5,
    minSelection: 2,
    legend: null,
    get span() {
      return { min: 1950, max: new Date().getFullYear() };
    },
    size: { width: 506, height: 5 },
    group: null,
    brush: null,
    xScale: null,
    scale: null,
    currentSelection: { min: null, max: null },

    setLegend(legend) {
      this.legend = legend;
      return this;
    },
    setYears(years) {
      this.years = years;
      return this;
    },

    visualize(svg, years = { min: null, max: null }) {
      if (years.min == null && this.years.min == null) {
        console.error(
          "timeline.years must be set. See function timeline.setYears(years)."
        );
        return;
      }
      //bind self for use in inline functions
      let self = this;
      //create x scale for timeline
      this.xScale = d3
        .scaleBand()
        .range([0, this.size.width])
        .domain(
          Array.from(Array(this.span.max - this.span.min + 1), (x, i) => {
            return self.span.min + i;
          })
        )
        .padding(0.01);
      //create y scale for creating the bubbles
      let yScale = d3
        .scaleLinear()
        .range([0, this.size.height])
        .domain([0, 1]);
      //timeline ticks
      let axis = d3.axisBottom(this.xScale).tickValues(
        this.xScale.domain().filter(function(d, i) {
          return !(i % 5) || self.xScale.domain().length - 1 == i;
        })
      );
      //timeline group and the return
      this.group = svg.append("g");
      this.scale = function(x) {
        return self.xScale(x) + self.xScale.bandwidth() / 2;
      };
      //create the bubbles
      this.group
        .selectAll("bar")
        .data(
          Array.from(new Array(this.span.max - this.span.min), (x, i) => {
            return i + this.span.min;
          })
        )
        .enter()
        .append("rect")
        .style("fill", function(d, i) {
          if (i % 2) {
            return "white";
          } else {
            return "black";
          }
        })
        .attr("rx", 2)
        .style("stroke", "black")
        .attr("x", function(d, i) {
          return self.scale(self.span.min + i);
        })
        .attr("width", this.xScale.bandwidth())
        .attr("y", function() {
          return self.size.height - yScale(1.0);
        })
        .attr("height", function() {
          return yScale(1.0);
        });
      //translate the axis to the bottom of the size of the timeline
      this.group
        .append("g")
        .attr("transform", "translate(0," + this.size.height + ")")
        .call(axis);
      //create the timeline brush
      this.brush = d3
        .brushX()
        .handleSize(12)
        .extent([
          [0, -5],
          [this.size.width, this.size.height + 5]
        ])
        //when the timeline scrubber has stopped moving call this function
        .on("end", function() {
          let selection = d3.event.selection;
          console.log(d3.event.sourceEvent);
          if (!d3.event.sourceEvent || !selection) {
            return;
          }
          //calculate the difference of the beginning and end of the scrubber
          let diff = Math.round(
            (selection[1] - selection[0]) / self.xScale.bandwidth()
          );
          //check if the scrubber was resized larger than the max selection which is 5
          if (diff > self.maxSelection) {
            selection[0] +=
              (diff - self.maxSelection) * self.xScale.bandwidth();
          }
          //check if the scrubber was resize smaller than the min selection which is 2
          if (diff < self.minSelection) {
            if (
              selection[0] -
                (self.minSelection - diff) * self.xScale.bandwidth() <
              0
            ) {
              selection[1] +=
                (self.minSelection - diff) * self.xScale.bandwidth();
            } else {
              selection[0] -=
                (self.minSelection - diff) * self.xScale.bandwidth();
            }
          }
          //snap brush to year
          let x = selection[0];
          let begin = Math.round(x / self.xScale.bandwidth());
          let end = Math.round(selection[1] / self.xScale.bandwidth());
          if (self.span.min + end > self.span.max) {
            end -= self.span.min + end - self.span.max;
          }
          d3.select(this)
            .transition()
            .call(self.brush.move, [
              self.scale(self.span.min + begin),
              self.scale(self.span.min + end)
            ]);
          self.currentSelection = {
            min: self.span.min + begin,
            max: self.span.min + end
          };
          if (self.legend != null) {
            self.legend.setDate(self.currentSelection);
          }
        });
      //append brush group
      let gBrush = this.group
        .append("g")
        .attr("class", "brush")
        .call(this.brush);
      //move brush to default position
      gBrush.call(this.brush.move, [
        this.scale(this.years.min),
        this.scale(this.years.max)
      ]);
      //keep track of what is selected by the brush
      this.currentSelection = { min: this.years.min, max: this.years.max };
      //return the brush group
      return this.group;
    }
  },
  //This data object contains all of the query information
  dataObject: {
    queries: [],

    queryObject: {
      countryData: {}
    },
    institution: {
      sequence: [],
      total: null,
      citationTotal: null
    },
    categoryData: {
      count: null,
      sequence: [],
      total: null
    }
  }
};
