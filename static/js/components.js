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
    onColorChangeCallback: null,
    /**
     *
     * @param {function(colorScale)} callback
     */ onColorChange(callback) {
      this.onColorChangeCallback = callback;
    },
    setKeyword(keyword) {
      this.keyword = keyword;
      if (this.title != null) {
        this.title.text(
          `Canada vs the World (${this.date.min}, ${this.date.max}) "${this.keyword}"`
        );
      }
      return this;
    },
    setDate(date) {
      this.date = date;
      if (this.title != null) {
        this.title.text(
          `Canada vs the World (${date.min}, ${date.max}) "${this.keyword}"`
        );
      }
      return this;
    },
    raise() {
      this.svg.raise();
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
        .attr("fill", "white")
        .attr("opacity", "0.3")
        .attr("rx", 15)
        .attr("filter", "url(#dropshadow)");

      this.title = this.group
        .append("text")
        .text(
          `Canada vs the World (${this.date.min}, ${this.date.max}) "${this.keyword}"`
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
        `translate(${
          boxPadding + lagTxt.node().getBBox().width + leadLagPadding
        },${boxPadding + titleBBox.height + titlePadding})`
      );

      lagTxt.attr(
        "transform",
        `translate(${boxPadding},${
          boxPadding + titleBBox.height + titlePadding + 12
        })`
      );

      leadTxt.attr(
        "transform",
        `translate(${
          boxPadding +
          lagTxt.node().getBBox().width +
          leadLagPadding +
          visBBox.width
        }, ${boxPadding + titleBBox.height + titlePadding + 12})`
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
        `translate(${background.node().getBBox().width / 2}, ${
          boxPadding + titleBBox.height
        })`
      );
      let misc = cmp.misclegend;
      let visMisc = misc.visualize(size, this.group);
      visMisc.attr(
        "transform",
        `translate(${
          background.node().getBBox().width / 2 -
          visMisc.node().getBBox().width / 2
        }, ${
          boxPadding +
          titleBBox.height +
          titlePadding +
          visBBox.height +
          titlePadding
        })`
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
          function () {
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
            if (self.onColorChangeCallback != null) {
              self.onColorChangeCallback(self.colorScale);
            }
          }
        );
        console.log(self.title.node().getBoundingClientRect().y);
        this.swatch.attr(
          "transform",
          `translate(${self.colorVis.node().getBoundingClientRect().x},${
            self.title.node().getBoundingClientRect().y -
            this.swatch.node().getBoundingClientRect().height -
            40
          })`
        );
        this.isSwatch = true;
      }
    },
    updateColorScaleYears(colorScale) {
      let transform = this.group
        .attr("transform")
        .replace(/[^0-9\-.,]/g, "")
        .split(",");
      let y = transform[1];
      this.group.remove();
      this.visualize(colorScale, this.svg);
      let box = this.group.node().getBoundingClientRect();
      let x = $(window).width() - box.width - 30;
      this.group.attr("transform", `translate(${x}, ${y})`);
    },
  },

  colorScale: {
    gradient: d3.interpolateRdBu,
    scale: [],
    rect: undefined,
    start: undefined,
    end: undefined,
    size: undefined,
    svg: undefined,
    group: undefined,
    setGradient(colorGradient) {
      this.gradient = colorGradient;
      return this;
    },
    setScaleByYearsSelected(value) {
      let tmp = [];
      const max = value * 2 + 1;
      for (let i = 0; i < max; ++i) {
        tmp.push(-value + i);
      }
      this.scale = tmp;
      return this;
    },
    setScale(values) {
      this.scale = values;
      return this;
    },
    setRange(numYears) {
      this.scale = [];
      for (let i = 0 - numYears; i <= 0 + numYears; ++i) {
        this.scale.push(i);
      }
    },
    updateScale() {
      let transform = this.group.attr("transform");
      this.group.remove();
      this.visualize(this.size, this.svg, true);
      this.group.attr("transform", transform);
    },
    visualize(size, svg, renderText = false) {
      const radius = size.height / 2;
      const end = this.scale.length - 1;
      const cy = size.height / 2;
      this.size = size;
      this.svg = svg;
      this.group = svg.append("g");

      this.rect = this.group
        .selectAll("rect.scale")
        .data(this.scale)
        .enter()
        .append("rect")
        .attr("class", "rect.scale")
        .attr("x", function (d, i) {
          return i * size.width;
        })
        .attr("y", 0)
        .attr("width", size.width)
        .attr("height", size.height)
        .attr(
          "fill",
          function (d, i) {
            return this.gradient(i / end);
          }.bind(this)
        );

      this.start = this.group
        .append("circle")
        .attr("cx", 0)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", this.gradient(0));

      this.end = this.group
        .append("circle")
        .attr("cx", this.scale.length * size.width)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", this.gradient(100));

      if (renderText) {
        let text = this.group
          .selectAll("text")
          .data(this.scale)
          .enter()
          .append("text")
          .text(function (d, i) {
            return d;
          })
          .attr("x", function (d, i) {
            return i * size.width + size.width / 2;
          });
        let textBBox = text.node().getBBox();
        let rectBBox = this.rect.node().getBBox();
        text
          .attr("y", rectBBox.height + textBBox.height)
          .attr("text-anchor", "middle");
      }
      return this.group;
    },
    get(value) {
      let index = this.scale.indexOf(value);
      if (index == -1) {
        throw "value does not exist. {components.colorScale.get}";
      }
      const end = this.scale.length - 1;
      return this.gradient(index / end);
    },
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
      d3.interpolateCividis,
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
            function () {
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
            function () {
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
            function () {
              colorScale.setGradient(this.colorList[i]);
              group.remove();
              callback();
            }.bind(this)
          );
      }

      return group;
    },
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
        .style("fill", "url(#missing-data-misc)");

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
    },
  },
  graphwindow: {
    graph: null,
    chartView: null,
    categories: {},
    recommended: [],
    numberRecommended: 4,
    /**
     *
     * @param {string} keyword
     * @param {string} otherName
     * @param {{min:Number, max:Number}} year
     * @param {DataObject} dataObject
     */
    async getData(keyword, otherName, year, dataObject) {
      let response = [];
      for (let i = year.min; i <= year.max; ++i) {
        response.push(
          await this.getCategory({
            keyword: keyword,
            year: i,
            country_name: otherName,
          })
        );
      }
      if (!("categories" in dataObject.canadaCategories)) {
        let canResponse = [];
        for (let i = year.min; i <= year.max; ++i) {
          canResponse.push(
            await this.getCategory({
              keyword: keyword,
              year: i,
              country_name: "Canada",
            })
          );
        }
        dataObject.canadaCategories = { categories: {} };
        for (let i = 0; i < canResponse.length; ++i) {
          let obj = JSON.parse(canResponse[i].body);
          let categories = obj.category_for;
          for (const category in categories) {
            if (
              categories[category].name in
              dataObject.canadaCategories.categories
            ) {
              dataObject.canadaCategories.categories[
                categories[category].name
              ].push(categories[category].count);
            } else {
              dataObject.canadaCategories.categories[
                categories[category].name
              ] = [];
              dataObject.canadaCategories.categories[
                categories[category].name
              ].push(categories[category].count);
            }
          }
        }
        for (const category in dataObject.canadaCategories.categories) {
          dataObject.canadaCategories.categories[
            category
          ] = dataObject.canadaCategories.categories[category].map((x, i) => {
            return x / dataObject.getYearTotal("Canada", year.min + i);
          });
        }
      }
      return response;
    },
    /**
     *
     * @param {*} canada
     * @param {*} other
     * @param {string} keyword
     * @param {string} otherName
     * @param {{min:Number, max:Number}} year
     * @param {DataObject} dataObject
     */
    async visualize(canada, other, keyword, otherName, year, dataObject) {
      dataObject.pauseLoading();
      let res = await this.getData(keyword, otherName, year, dataObject);
      let categories = this.parse(res);
      let categoryMax = 0;
      //normalize
      for (const category in categories) {
        for (let i = 0; i < categories[category].length; ++i) {
          categories[category][i] /= dataObject.getYearTotal(
            otherName,
            year.min + i
          );
          if (categories[category][i] > categoryMax) {
            categoryMax = categories[category][i];
          }
        }
      }
      var self = this;
      $(".graph-window").remove();
      $("#map-holder").append(`<div class="graph-window"></div>`);
      $(".graph-window").append(`<div id="graph-holder"></div>`);
      $(document).on("click", function (e) {
        let check = $.contains($("#graph-holder")[0], $(e.target)[0]);
        if ($(e.target).is("#graph-holder") === false && !check) {
          $(".graph-window").remove();
          $(document).prop("onclick", null).off("click");
          e.stopPropagation();
        }
      });
      $(".graph-window").on(
        "animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd",
        function () {
          self.chartView = new ChartView("graph-holder");
          self.chartView.addView("main-view");
          self.chartView.addView("recommended-view");
          self.chartView.addView("category-view");
          self.chartView.setMainView("main-view");
          let max = Math.max.apply(Math, canada.concat(other));
          let buffer = 0.1;
          self.chartView.addChart(
            "main-view",
            {
              xdomain: [year.min, year.max],
              ydomain: [0.0, max + buffer],
              lines: [
                {
                  name: "Canada",
                  rawdata: Array.from(canada, (d, i) => {
                    return { x: year.min + i, y: d };
                  }),
                  data: Array.from(canada, (d, i) => {
                    return { x: year.min + i, y: d };
                  }),
                },
                {
                  name: otherName,
                  rawdata: Array.from(other, (d, i) => {
                    return { x: year.min + i, y: d };
                  }),
                  data: Array.from(other, (d, i) => {
                    return { x: year.min + i, y: d };
                  }),
                },
              ],
            },
            (data) => {
              data.chartName = "Total";
            }
          );

          $("#recommended-view").css({ "overflow-y": "hidden" });
          $("#main-view").css({ "overflow-y": "hidden" });

          $("#category-view").append(
            `<div id=${"total"} display="block" class="category" name=${"total"}><div display="block" style='background-color:#ffffff' id=${
              "head" + "total"
            }><p style="font-family:helvetica">${"\t\tTotal"}</p></div></div>`
          );
          $("#" + "total").on("click", function () {
            self.chartView.clearView("main-view");

            self.chartView.addChart(
              "main-view",
              {
                xdomain: [year.min, year.max],
                ydomain: [0.0, max + buffer],
                lines: [
                  {
                    name: "Canada",
                    rawdata: Array.from(canada, (d, i) => {
                      return { x: year.min + i, y: d };
                    }),
                    data: Array.from(canada, (d, i) => {
                      return { x: year.min + i, y: d };
                    }),
                  },
                  {
                    name: otherName,
                    rawdata: Array.from(other, (d, i) => {
                      return { x: year.min + i, y: d };
                    }),
                    data: Array.from(other, (d, i) => {
                      return { x: year.min + i, y: d };
                    }),
                  },
                ],
              },
              (data) => {
                data.chartName = "Total";
              }
            );
          });
          let counter = 0;
          for (const category in categories) {
            if (category in dataObject.canadaCategories.categories) {
              let line1 = Array.from(
                dataObject.canadaCategories.categories[category],
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
            if (category in dataObject.canadaCategories.categories) {
              if (self.isRecommended(category)) {
                self.chartView.addChart(
                  "recommended-view",
                  {
                    xdomain: [year.min, year.max],
                    ydomain: [0.0, categoryMax + buffer],
                    lines: [
                      {
                        name: "Canada",
                        rawdata: Array.from(
                          dataObject.canadaCategories.categories[category],
                          (d, i) => {
                            return { x: year.min + i, y: d };
                          }
                        ),
                        data: Array.from(
                          dataObject.canadaCategories.categories[category],
                          (d, i) => {
                            return { x: year.min + i, y: d };
                          }
                        ),
                      },
                      {
                        name: otherName,
                        rawdata: Array.from(categories[category], (d, i) => {
                          return { x: year.min + i, y: d };
                        }),
                        data: Array.from(categories[category], (d, i) => {
                          return { x: year.min + i, y: d };
                        }),
                      },
                    ],
                  },
                  (data) => {
                    data.chartName = category;
                  },
                  false
                );
                continue;
              }
              let category_id = "category" + counter++;
              self.categories[category_id] = category;
              let codeIndex = category.indexOf(" ");
              let space = "";
              for (let i = 0; i < 3 - codeIndex; ++i) {
                space += " ";
              }
              $("#category-view").append(
                `<div id=${category_id} display="block" class="category" name=${category}><div display="block" style='background-color:#ffffff' id=${
                  "head" + category_id
                }><p style="font-family:helvetica">${
                  "    " + category.replace(" ", space + "\t\t")
                } </p></div></div>`
              );
              $("#" + category_id).on("click", function () {
                if ($("#" + category_id).find("svg").length == 0) {
                  self.chartView.clearView("main-view");
                  let name = self.categories[category_id];
                  let clickMax = categoryMax + buffer;
                  self.chartView.addChart(
                    "main-view",
                    {
                      xdomain: [year.min, year.max],
                      ydomain: [0.0, clickMax],
                      lines: [
                        {
                          name: "Canada",
                          rawdata: Array.from(
                            dataObject.canadaCategories.categories[name],
                            (d, i) => {
                              return { x: year.min + i, y: d };
                            }
                          ),
                          data: Array.from(
                            dataObject.canadaCategories.categories[name],
                            (d, i) => {
                              return { x: year.min + i, y: d };
                            }
                          ),
                        },
                        {
                          name: otherName,
                          rawdata: Array.from(categories[name], (d, i) => {
                            return { x: year.min + i, y: d };
                          }),
                          data: Array.from(categories[name], (d, i) => {
                            return { x: year.min + i, y: d };
                          }),
                        },
                      ],
                    },
                    (data) => {
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
      dataObject.unpauseLoading();
      $("#main-view").attr("width", "30%");
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
      return result;
    },
    async getCategory(params) {
      let response = await d3.json("/querycategories", {
        method: "POST",
        body: JSON.stringify({
          keyword: params.keyword,
          year: params.year,
          country_name: params.country_name,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
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
    },
  },
};
class LoadingSpinner {
  /**
   *
   * @param {Array.<Element>} svg
   * @param {Element} parent
   */
  constructor(svg, parent = null) {
    for (let i = 0; i < svg.length; ++i) {
      let box = svg[i].node().getBoundingClientRect();
      this.greyBox.push(
        svg[i]
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", box.width)
          .attr("height", box.height)
          .attr("fill", "rgba(0.8,0.8,0.8,0.3)")
          .attr("stroke", "none")
      );
    }
    if (parent != null) {
      $(parent).append('<div class="lds-dual-ring"></div>');
    }
  }
  greyBox = [];
  destroy() {
    for (let i = 0; i < this.greyBox.length; ++i) {
      this.greyBox[i].remove();
    }
    $(".lds-dual-ring").remove();
  }
}
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
        [size.width, size.height],
      ])
      .on("brush", this.brushed.bind(this))
      .on("end", this.endCallbacks.bind(this));
    this.brushVis = parent.append("g").attr("class", "brush").call(this.brush);

    this.parent = parent;
    this.scales = scales;

    this.minYear = this.scales.x.invert(0);
    this.maxYear = this.scales.x.invert(size.width);
    //move brush to default position
    this.brushVis.call(this.brush.move, [
      scales.x(this.currentSelection.min),
      scales.x(this.currentSelection.max),
    ]);
  }

  /**
   *
   * @param {{min:number, max:number}} extent - extent year selection
   */
  setExtent(extent) {
    this.brush.extent([
      [this.scales.x(extent.min), -5],
      [this.scales.x(extent.max), this.scales.y(1)],
    ]);
    this.minYear = extent.min;
    this.maxYear = extent.max;
    this.maxSelection = Math.min(
      ...[10, Math.floor((this.maxYear - this.minYear) / 4)]
    );
  }
  setOpacity(value) {
    this.parent.select(".brush").attr("opacity", `${value}%`);
  }
  hidden() {
    this.parent.select(".brush").attr("opacity", `${0}%`);
    this.hiddenCheck = true;
  }
  visible() {
    this.parent.select(".brush").attr("opacity", `${30}%`);
    this.hiddenCheck = false;
  }
  brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
    const d0 = d3.event.selection.map(this.scales.x.invert);
    d0[0] = Math.round(d0[0]);
    d0[1] = Math.round(d0[1]);
    if (d0[1] - d0[0] >= this.maxSelection) {
      d0[0] += d0[1] - d0[0] - this.maxSelection;
    }
    if (d0[1] - d0[0] <= this.minSelection) {
      d0[1] += this.minSelection - (d0[1] - d0[0]);
    }
    let selection = d0[1] - d0[0] + 1;
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
    let resize =
      this.currentSelection.max - this.currentSelection.min != d0[1] - d0[0];
    this.currentSelection = { min: d0[0], max: d0[1] };
    0;
    this.updateOnBrushed(d0);
    this.brushVis.call(this.brush.move, [
      this.scales.x(d0[0]),
      this.scales.x(d0[1]),
    ]);
    if (resize) {
      this.updateOnResize(d0);
    }
  }
  /**
   * @return {Number}
   */
  getNumYearsSelected() {
    return this.currentSelection.max - this.currentSelection.min + 1;
  }
  /**
   * @return {{min:Number, max:Number}}
   */
  getSelected() {
    return this.currentSelection;
  }

  isHidden() {
    return this.hiddenCheck;
  }
  hiddenCheck = true;
  scales = null;
  parent = null;
  brush = null;
  brushVis = null;
  onEndCallbacks = [];
  onResizeCallbacks = [];
  minSelection = 3;
  maxSelection = 10;
  minYear = 1950;
  maxYear = new Date().getFullYear();
  currentSelection = {
    min: new Date().getFullYear() - 7,
    max: new Date().getFullYear() - 4,
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
   * @param {function({min:Number, max:Number})} callbacks
   */
  onEnd(callbacks) {
    this.onEndCallbacks.push(callbacks);
  }

  /**
   *
   * @param {function({min:Number, max:Number})} callbacks
   */
  onResize(callbacks) {
    this.onResizeCallbacks.push(callbacks);
  }
  updateOnResize(position) {
    for (let i = 0; i < this.onResizeCallbacks.length; ++i) {
      this.onResizeCallbacks[i]({ min: position[0], max: position[1] });
    }
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
  reset() {
    d3.select("#publishing-output").remove();
  }
  data = [];
  size = { width: null, height: null };

  margin = { top: 10, right: 30, bottom: 35, left: 40 };
  svg = null;
  parentID = null;

  xRange = [1950, new Date().getFullYear() - 1]; // not including current year in graph, it is problematic due to partial year completion

  scales = { x: null, y: null };
  axii = { x: null, y: null };

  line = null;
  scrubber = null;
  loadingSpinner = null;

  /**
   *
   * @param {Array<>.{x:Number, y:Number}} data
   */
  updateData(data) {
    this.data = data;
    if (this.scrubber != null && this.data.length > 12) {
      this.scrubber.visible();
      this.loadingSpinner.destroy();
    }
    let self = this;

    let maxY = Math.max(...data.map((val) => val.y));
    let minY = Math.min(...data.map((val) => val.y));

    let minX = Math.min(...data.map((val) => val.x));
    let maxX = Math.max(...data.map((val) => val.x));
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

    var u = this.svg.selectAll(".line-path").data([data]);

    this.scrubber.setExtent({ min: minX, max: maxX + 1 }); // plus 1 due to removing the current year from displaying. We can still use it for lead lag even though it is not displayed.
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
          .x(function (d) {
            return self.scales.x(d.x);
          })
          .y(function (d) {
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
      .attr("id", "publishing-output")
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

    let maxY = Math.max(...this.data.map((val) => val.y));
    let minY = Math.min(...this.data.map((val) => val.y));
    if (this.data.length == 0) {
      maxY = 0;
      minY = 0;
    }
    this.scales.y = d3
      .scaleLinear()
      .domain([minY, maxY])
      .range([this.size.height, 0]);
    this.axii.y = d3.axisLeft(this.scales.y);
    this.svg.append("g").attr("class", "y-axis").call(this.axii.y);

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
          .x(function (d) {
            return self.scales.x(d.x);
          })
          .y(function (d) {
            return self.scales.y(d.y);
          })
      )
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2.5);
    this.scrubber = new Scrubber(this.size, this.svg, this.scales);
    this.scrubber.onResize(this.onScrubberResize.bind(this));
    this.scrubber.onBrushed(this.onScrubberBrushed.bind(this));
    this.scrubber.hidden();
    this.loadingSpinner = new LoadingSpinner([
      d3.select(this.parentID).select("svg"),
    ]);
  }
  onScrubberResize(selection) {
    let years = this.scrubber.getNumYearsSelected();

    this.svg.selectAll(".deadzone").remove();
    this.svg
      .append("rect")
      .attr("class", "deadzone")
      .attr("x", this.scales.x(this.xRange[1] - years))
      .attr("y", -this.margin.top / 2)
      .attr(
        "width",
        this.scales.x(this.xRange[1]) -
          this.scales.x(this.xRange[1] - (years - 1)) // -1 is added due to the current year being left out
      )
      .attr("height", this.size.height + this.margin.top / 2)
      .attr("rx", 0)
      .attr("ry", 0)
      .style("fill", "#9746b433")
      .attr("stroke", "none")
      .transition()
      .duration(2000)
      .style("opacity", 0)
      .remove();

    this.svg
      .append("rect")
      .attr("class", "deadzone")
      .attr("x", this.scales.x(this.xRange[0]))
      .attr("y", -this.margin.top / 2)
      .attr("width", this.scales.x(this.xRange[0] + years))
      .attr("height", this.size.height + this.margin.top / 2)
      .attr("rx", 0)
      .attr("ry", 0)
      .style("fill", "#9746b433")
      .attr("stroke", "#9746b433")
      .transition()
      .duration(2000)
      .style("opacity", 0)
      .remove();
  }

  onScrubberBrushed(selection) {
    let years = this.scrubber.getNumYearsSelected();

    this.svg.selectAll(".deadzone").remove();
    this.svg
      .append("rect")
      .attr("class", "deadzone")
      .attr("x", this.scales.x(this.xRange[1] - (years - 1))) // -1 is added due to the current year being left out
      .attr("y", -this.margin.top / 2)
      .attr(
        "width",
        this.scales.x(this.xRange[1]) -
          this.scales.x(this.xRange[1] - (years - 1))
      )
      .attr("height", this.size.height + this.margin.top / 2)
      .attr("rx", 0)
      .attr("ry", 0)
      .style("fill", "#9746b433")
      .attr("stroke", "none")
      .transition()
      .duration(2000)
      .style("opacity", 0)
      .remove();
    this.svg
      .append("rect")
      .attr("class", "deadzone")
      .attr("x", this.scales.x(this.xRange[0])) // +1 is added due to the current year being left out
      .attr("y", -this.margin.top / 2)
      .attr("width", this.scales.x(this.xRange[0] + years))
      .attr("height", this.size.height + this.margin.top / 2)
      .attr("rx", 0)
      .attr("ry", 0)
      .style("fill", "#9746b433")
      .attr("stroke", "#9746b433")
      .transition()
      .duration(2000)
      .style("opacity", 0)
      .remove();
  }
}
class EventGraph {
  parent = null;
  margin = { top: 0, right: 30, bottom: 0, left: 40 };
  data = [];
  value = 0;
  size = null;
  xRange = [1950, new Date().getFullYear() - 1];
  scales = { x: null, y: null };
  events = null;
  eventName = null;
  color = null;
  title = null;
  selection = { x1: 0, x2: 0 };
  constructor(
    size,
    data,
    parentID,
    eventName,
    title = null,
    color = null,
    margin = null
  ) {
    if (margin != null) {
      this.margin = margin;
    }
    if (title != null) {
      this.title = title;
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
  reset() {
    d3.select(this.svg.node().parentNode).remove();
  }
  /**
   *
   * @param {string} color - example "#f5f5f5"
   */
  setColor(color) {
    this.color = color;
  }

  updateData(data, value, color = null) {
    if (color != null) {
      this.color = color;
    }
    this.value = value;
    this.data = data;
    let self = this;
    this.svg.selectAll("." + this.eventName).remove();
    this.svg.selectAll(".event-line").remove();
    let minX = self.scales.x.domain()[0];
    let maxX = self.scales.x.domain()[self.scales.x.domain().length - 1];
    this.svg
      .append("line")
      .attr("class", "event-line")
      .attr("x1", self.scales.x(minX))
      .attr("y1", Math.abs((self.scales.y(0) - self.scales.y(1)) / 2))
      .attr("x2", self.scales.x(maxX))
      .attr("y2", Math.abs((self.scales.y(0) - self.scales.y(1)) / 2))
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .style("stroke-dasharray", "1,5");
    this.selection.x1 = data[0].x1;
    this.selection.x2 = data[0].x2;
    this.svg
      .selectAll("." + this.eventName)
      .data(this.data)
      .enter()
      .append("line")
      .attr("class", this.eventName)
      .attr("x1", function (d) {
        return self.scales.x(d.x1);
      })
      .attr("y1", function (d) {
        return self.scales.y(0.5);
      })
      .attr("y2", function (d) {
        return self.scales.y(0.5);
      })
      .attr("x2", function (d) {
        console.log(d);
        return self.scales.x(d.x2);
      })
      .attr("stroke-width", 6)
      .style("stroke", this.color);
  }
  /**
   *
   * @param {x:number, width:number} position
   */
  createScrubberLines(position) {
    let self = this;
    this.svg.selectAll(".scrubber-rect").remove();
    this.svg
      .selectAll(".scrubber-rect")
      .data([position])
      .enter()
      .append("rect")
      .attr("class", "scrubber-rect")
      .attr("x", function (d) {
        return self.scales.x(d.x);
      })
      .attr("y", this.scales.y(1))
      .attr("width", function (d) {
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
    let minX = self.scales.x.domain()[0];
    let maxX = self.scales.x.domain()[self.scales.x.domain().length - 1];
    this.svg
      .append("line")
      .attr("class", "event-line")
      .attr("x1", self.scales.x(minX))
      .attr("y1", Math.abs((self.scales.y(0) - self.scales.y(1)) / 2))
      .attr("x2", self.scales.x(maxX))
      .attr("y2", Math.abs((self.scales.y(0) - self.scales.y(1)) / 2))
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .style("stroke-dasharray", "1,5");

    this.svg
      .selectAll("." + this.eventName)
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", this.eventName)
      .attr("x", function (d) {
        return self.scales.x(d.x1);
      })
      .attr("y", function (d) {
        return self.scales.y(0.75);
      })
      .attr("height", function (d) {
        return Math.abs((self.scales.y(0) - self.scales.y(1)) / 2);
      })
      .attr("width", function (d) {
        console.log(d);
        return self.scales.x(d.x2) - self.scales.x(d.x1);
      })
      .style("fill", this.color);
    this.svg
      .append("text")
      .attr("x", 0)
      .attr("y", self.scales.y(0.1))
      .text(this.title)
      .attr("font-family", "helvetica")
      .attr("font-size", "8px");
  }
  /**
   *
   * @param {string} color
   */
  updateColor(color) {
    this.color = color;
    this.svg.select("." + this.eventName).style("stroke", this.color);
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
  grid_id = null;

  /**
   *
   * @param {string} id
   */
  setGridID(id) {
    this.grid_id = id;
  }
  /**
   * @return {string}
   */
  getGridID() {
    return this.grid_id;
  }
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
   * @param {{min:Number, max:Number}} range - the year range you want the total number of papers of
   * @returns {Number}
   */
  getPaperTotalAtYears(range) {
    let sum = 0;
    for (let i = range.min; i <= range.max; ++i) {
      if (this.hasPapers(i)) {
        sum += this.getPapers(i);
      }
    }
    return sum;
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
  /**
   *
   * @param {Number} year
   * @return {Boolean}
   */
  hasCitations(year) {
    return year in this.citations;
  }
  /**
   *
   * @param {Number} year
   * @return {Number}
   */
  getCitations(year) {
    return this.citations[year];
  }
  /**
   *
   * @param {Number} year
   * @param {Number} value
   */
  addCitations(year, value) {
    this.citations[year] = value;
  }
}
class CountryData {
  institutes = {};
  countryTotal = {};
  contributors = {};
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
   * @param {string} institute - institute to get papers from
   * @param {{min:Number, max:Number}} range - inclusive range of years to get back for normalized data
   * @returns {Array.<Number>}
   */
  getNormalizedPapers(institute, range) {
    let result = [];
    if (!this.hasInstitute(institute)) {
      console.error(`the institute ${institute} does not exist`);
      return [];
    }
    let currentInstitute = this.getInstitute(institute);
    for (let i = range.min; i <= range.max; ++i) {
      if (currentInstitute.hasPapers(i)) {
        //if institutes has papers then country.total must exist. Therefore, we can skip the if check.
        result.push(currentInstitute.getPapers(i) / this.getTotal(i));
      }
    }
    return result;
  }
  getInstitutionTotals(range) {
    let result = [];
    for (const institute in this.institutes) {
      let sum = 0;
      let ins = this.getInstitute(institute);
      for (let i = range.min; i <= range.max; ++i) {
        if (!ins.hasPapers(i)) {
          sum = 0;
          break;
        }
        sum += ins.getPapers(i);
      }
      if (sum) {
        result.push(sum);
      }
    }
    return result;
  }
  /**
   *
   * @param {{min: Number, max:Number}} range - inclusive range to get the average institution contribution
   * @return {{avg:Number, std:Number}} - returns average contribution and std for the paper totals for the country
   */
  getAverageContribution(range) {
    let sumAvg = 0;
    let numYears = 0;
    let runningAvg = [];
    for (let i = range.min; i < range.max; ++i) {
      if (this.hasTotal(i)) {
        sumAvg += this.getTotal(i) / this.getContributors(i);
        runningAvg.push(this.getTotal(i) / this.getContributors(i));
        ++numYears;
      }
    }
    let avg = sumAvg / numYears;
    let std = runningAvg.reduce((acc, currentVal) => {
      return acc + (currentVal - avg) * (currentVal - avg);
    }, 0);
    std /= runningAvg.length;
    std = Math.sqrt(std);

    return { avg: avg, std: std };
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
   * @param {{min:Number, max:Number}} range - inclusive range of years you want the total number of papers from.
   * @return {Number}
   */
  getPaperTotalAtYears(range) {
    let sum = 0;
    for (let i = range.min; i <= range.max; ++i) {
      if (this.hasTotal(i)) {
        sum += this.getTotal(i);
      }
    }
    return sum;
  }
  /**
   *
   * @param {{min:Number, max:Number}} range
   * @returns {Array.<Number>}
   * returns empty array if country is missing any year of data
   */

  getPapersAtYears(range) {
    let result = [];
    for (let i = range.min; i <= range.max; ++i) {
      if (this.hasTotal(i)) {
        result.push(this.getTotal(i));
      } else {
        return [];
      }
    }
    return result;
  }
  /**
   *
   * @param {string} year - year of interest
   * @param {Number} value - country total
   */
  addTotal(year, value) {
    if (!value) {
      return;
    }
    this.countryTotal[year] = value;
  }
  /**
   *
   * @param {string} year
   * @param {Number} numOfContributors
   */
  addContributors(year, numOfContributors) {
    this.contributors[year] = numOfContributors;
  }
  /**
   *
   * @param {string} year
   * @return {Boolean}
   */
  hasContributors(year) {
    return year in this.contributors;
  }
  /**
   *
   * @param {string} year
   * @return {Number}
   */
  getContributors(year) {
    return this.contributors[year];
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
    this.addTotal(year, sum);
  }
}
class DataObject {
  currentYearLoading = new Date().getFullYear() - 1;
  queryReturned = { canada: false, notCanada: false };
  minYearLoaded = 1950;
  intervalRate = 5000;
  countries = {};

  canadaCategories = {};
  currentKeyword = "";
  callback = null;
  intervalVar = null;

  paused = false;

  onDataCallbacks = [];

  countryYearTotals = {};
  constructor() {}
  /**
   *
   * @param {JSON} json
   */
  setYearTotals(json) {
    this.countryYearTotals = json;
  }
  /**
   *
   * @param {string} countryName
   * @param {string} year
   */
  getYearTotal(countryName, year) {
    if (countryName in this.countryYearTotals) {
      if (year in this.countryYearTotals[countryName]) {
        return this.countryYearTotals[countryName][year];
      }
    }
    console.error(countryName, year, "not in dataset");
    return null;
  }
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
    if (this.paused) {
      return;
    }
    let self = this;
    this.currentKeyword = keyword;
    this.intervalVar = setInterval(function () {
      self.queryPapers(keyword);
    }, this.intervalRate);
  }
  pauseLoading() {
    if (this.intervalVar != null) {
      clearInterval(this.intervalVar);
    }
    this.paused = true;
  }
  unpauseLoading() {
    this.paused = false;
    this.getAllPapers(this.currentKeyword);
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
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then(function (data) {
        callback(data, year, keyword);
      })
      .catch(function (err) {
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
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then(function (data) {
        callback(data, year, keyword);
      })
      .catch(function (err) {
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
    result = result.filter(function (x) {
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
        country.getInstitute(result[i].name).setGridID(result[i].id);
      }
    }
    //once we have added all of the papers to the institutes within the country, calculate the total for the country
    this.getCountry("Canada").addTotal(
      year,
      result.reduce((acc, val) => acc + val.count, 0)
    );
    this.getCountry("Canada").addContributors(year, result.length);
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
        country.getInstitute(result[i].name).setGridID(result[i].id);
      }
      let institute = country.getInstitute(result[i].name);
      institute.addPapers(year, result[i].count);
    }
    //calculate total papers for countries in the specified year
    for (let country in this.countries) {
      if (country == "Canada") {
        continue;
      }
      this.getCountry(country).calculateTotal(year);
      let contributions = result.filter((val) => val.country_name == country);
      this.getCountry(country).addContributors(year, contributions.length);
    }

    if (this.queryReturned.notCanada && this.queryReturned.canada) {
      this.updateOnData();
      if (year > this.minYearLoaded) {
        this.getAllPapers(keyword);
      }
    }
  }
  reset() {
    this.pauseLoading();
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
      this.countryNames[data[i].properties.name] = String(
        data[i].properties.iso_a3
      );
    }
  }
  /**
   *
   * @param {Element} svg
   * @param {*} projection
   * @param {function(string)} onclickCallback
   */
  render(svg, projection, onclickCallback) {
    var self = this;
    this.group = svg
      .selectAll("path")
      .data(this.data)
      .enter()
      .append("path")
      .attr("d", projection)
      .attr("id", function (d, i) {
        return "country" + d.properties.iso_a3;
      })
      .attr("name", function (d, i) {
        return d.properties.name;
      })
      .attr("class", "country")
      .on("mouseover", function (d, i) {
        d3.select(this).raise();
        d3.select(this).style("stroke", "black");
        d3.select(this).style("stroke-width", "5px");
        if (self.onHoverCallback == null) {
          console.log(d3.mouse(d3.select("#main-svg").node())[0]);
          let box = d3.select(this).node().getBoundingClientRect();
          box.x = d3.mouse(d3.select("#main-svg").node())[0];
          self.tooltip = new Tooltip(
            "#map-holder",
            box,
            `<p>${d.properties.name}</p`
          );
        } else {
          self.tooltip = self.onHoverCallback(
            d3.select(this).node().getBoundingClientRect(),
            d,
            d3.select(this).attr("leadlag")
          );
        }
      })
      .on("mouseout", function (d, i) {
        d3.select(this).style("stroke", "white");
        d3.select(this).style("stroke-width", "1px");
        if (self.tooltip != null) self.tooltip.destroy();
        self.tooltip = null;
      })
      .on("click", function (d, i) {
        onclickCallback(d.properties.name);
      });
  }
  /**
   *
   * @param {Array.<{country_name:string, leadlag:number}>} data
   * @param {Array.<String>} missingData
   * @param {} colorScale
   */
  color(data, colorScale, missingData) {
    this.reset();
    for (let i = 0; i < data.length; ++i) {
      if (data[i].country_name in this.countryNames) {
        let acronym = this.countryNames[data[i].country_name];
        $(`#country${acronym}`).css({
          fill: colorScale.get(data[i].leadlag),
        });
        $(`#country${acronym}`).attr("leadlag", data[i].leadlag);
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
  updateColor(colorScale) {
    let countries = $(".country");
    for (let i = 0; i < countries.length; ++i) {
      let lead = $(countries[i]).attr("leadlag");
      if (lead != undefined) {
        $(countries[i]).css({ fill: colorScale.get(Number(lead)) });
      }
    }
  }
  reset(color = "#f5f5f5") {
    $(".country").removeAttr("leadlag").css("fill", color);
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
  /**
   *
   * @param {Element} svg
   * @param {*} data
   * @param {ColorScale} colorScale
   * @param {MapInteraction} mapInteraction
   * @param {*} projection
   * @param {function(box,d):Tooltip} toolTipFunction
   * @param {function()} afterLoaded
   */
  constructor(
    svg,
    data,
    colorScale,
    mapInteraction,
    projection,
    afterLoaded = null,
    toolTipFunction = null
  ) {
    if (toolTipFunction != null) {
      this.tooltipFunction = toolTipFunction;
    }
    let location_ids = Array.from(data, (x) => x.id);
    let self = this;
    this.getLocations(location_ids, function (res) {
      let locations = res;
      for (const idx in locations) {
        let coords = projection([locations[idx].lng, locations[idx].lat]);
        data[idx].lat = coords[0];
        data[idx].lng = coords[1];
      }
      self.render(svg, data, colorScale, mapInteraction);
      if (afterLoaded != null) {
        afterLoaded();
      }
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
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then(callback)
      .catch(function (err) {
        console.error(err);
      });
  }
  render(svg, data, colorScale, mapInteraction) {
    var self = this;
    let transform = mapInteraction.getTransform();
    this.group = svg.append("g");
    this.group.attr("class", "noselect");
    this.group.attr(
      "transform",
      `translate(${transform.translateX}, ${transform.translateY})scale(${transform.scale})`
    );
    data = data.filter((x) => {
      return !isNaN(x.scale);
    });
    let g = this.group
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", function (d, i) {
        d.x = Number(d.lat);
        d.y = Number(d.lng);
        return `translate(${d.lat},${d.lng})`;
      });
    g.each(function (d, i) {
      d3.select(this)
        .append("circle")
        .attr("class", "institution")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d.scale)
        .attr("stroke", "black")
        .attr("stroke-width", 3)
        .attr("leadlag", d.lead)
        .attr("fill", colorScale.get(d.lead));
    });
    g.each(function (d, i) {
      d3.select(this)
        .append("line")
        .attr("x1", d.scale)
        .attr("y1", 0)
        .attr("x2", 0 - d.scale)
        .attr("y2", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 5)
        .attr("transform", function () {
          let rotation = 0;
          if (d.trend > 0.25) {
            rotation = -45;
          }
          if (d.trend < -0.25) {
            rotation = 45;
          }

          return `rotate(${rotation},${0},${0})`;
        });
    });
    g.on("mouseenter", function (d) {
      let box = d3.select(this).select("circle").node().getBoundingClientRect();
      if (self.tooltipFunction != null) {
        self.tooltip = self.tooltipFunction(box, d);
        return;
      }
      self.tooltip = new Tooltip(
        "#map-holder",
        box,
        `<p>${d.country_name} total papers: ${d.country_total} <br>${d.name} total papers: ${d.total}</p>`
      );
    }).on("mouseleave", function () {
      self.tooltip.destroy();
    });
    this.collision = d3.forceCollide().radius(function (d) {
      return d.scale;
    });
    mapInteraction.addElementToTransform(this.group);
    this.simulation = d3
      .forceSimulation(data)
      .force(
        "x",
        d3.forceX(function (d) {
          return d.lat;
        })
      )
      .force(
        "y",
        d3.forceY(function (d) {
          return d.lng;
        })
      )
      .force("collide", this.collision)
      .alpha(1)
      .on("tick", this.tick.bind(this));
  }
  setRadius(scale) {
    let g = this.group.selectAll("g");
    g.each(function (d, i) {
      d3.select(this)
        .select("circle")
        .attr("r", function (d) {
          if (d.name in scale) {
            d.scale = scale[d.name];
            return d.scale;
          }
        });
      d3.select(this)
        .select("line")
        .attr("x1", function (d) {
          if (d.name in scale) {
            return scale[d.name];
          }
        })
        .attr("x2", function (d) {
          if (d.name in scale) {
            return 0 - scale[d.name];
          }
        });
    });
    this.collision.initialize(this.simulation.nodes());
    this.simulation.alpha(1).restart();
  }
  tick() {
    this.group.selectAll("g").attr("transform", function (d, i) {
      return `translate(${d.x},${d.y})`;
    });
  }
  updateColor(colorScale) {
    d3.selectAll(".institution").style("fill", function (d, i) {
      return colorScale.get(d.lead);
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
  tooltipFunction = null;
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
          left: NaN,
        },
      },
      ["SIMPLE_PAN", "WHEEL_ZOOM", "PINCH_ZOOM"]
    );
    if (defaultPosition == null) {
      this.easyPZ.totalTransform = {
        scale: 0.1,
        translateX: $(window).width() / 2,
        translateY: $(window).height() / 2 + 152,
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
class GlyphLegend {
  constructor(color) {
    this.svg = d3.select("#glyph-legend");
    if (this.svg == null) {
      console.error("Error finding glyph legend svg");
      return;
    }
    this.color = color;
    this.render();
  }
  svg = null;
  color = null;
  render() {
    if (this.svg == null) {
      return;
    }
    const box = this.svg.node().getBoundingClientRect();
    const radius = box.height / 4;
    this.svg
      .append("circle")
      .attr("cx", box.width / 2)
      .attr("cy", box.height / 2)
      .attr("r", radius)
      .attr("fill", this.color)
      .attr("stroke-width", 3)
      .attr("filter", "url(#dropshadow)");
    this.svg
      .append("line")
      .attr("x1", box.width / 2 - radius)
      .attr("y1", box.height / 2)
      .attr("x2", box.width / 2 + radius)
      .attr("y2", box.height / 2)
      .attr("stroke-width", "3px");

    var defs = this.svg.append("defs");
    const thickness = 2;
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", "arrowHead");

    this.svg
      .append("svg:line")
      .attr("x1", box.width / 2 - radius)
      .attr("x2", box.width / 2)
      .attr("y1", 10)
      .attr("y2", box.height / 2 - 6)
      .attr("marker-end", "url(#arrow)")
      .attr("stroke", "#000")
      .attr("stroke-width", thickness);

    this.svg
      .append("text")
      .attr("x", box.width / 2 - radius)
      .attr("y", 8)
      .text("Trend Line")
      .attr("font-size", 10)
      .attr("text-anchor", "middle");

    this.svg
      .append("svg:line")
      .attr("x1", box.width / 4)
      .attr("x2", box.width / 2 - radius / 2)
      .attr("y1", box.height - 30)
      .attr("y2", box.height / 2 + radius / 2)
      .attr("marker-end", "url(#arrow)")
      .attr("stroke", "#000")
      .attr("stroke-width", thickness);

    this.svg
      .append("text")
      .attr("x", box.width / 4)
      .attr("y", box.height - 20)
      .text("Lead Lag")
      .attr("font-size", 10)
      .attr("text-anchor", "middle");

    this.svg
      .append("svg:line")
      .attr("x1", box.width * 0.75)
      .attr("x2", box.width * 0.64)
      .attr("y1", box.height / 2 - radius)
      .attr("y2", box.height / 2 - radius * 0.88)
      .attr("marker-end", "url(#arrow)")
      .attr("stroke", "#000")
      .attr("stroke-width", thickness);

    this.svg
      .append("text")
      .attr("x", box.width * 0.76)
      .attr("y", box.height / 2 - radius * 0.97)
      .text("# of papers")
      .attr("font-size", 10);
  }
  updateColor(color) {
    this.color = color;
    this.svg.select("circle").attr("fill", color);
  }
}
class ColorScale {
  constructor(numYears) {
    //account for negative
    this.setRange(numYears);
  }
  gradient = d3.interpolateRdBu;
  values = [];
  vis = null;

  setGradient(gradient) {
    this.gradient = gradient;
  }
  setRange(numYears) {
    this.values = [];
    for (let i = 0 - numYears; i <= 0 + numYears; ++i) {
      this.values.push(i);
    }
  }
  get(value) {
    let idx = this.values.indexOf(value);
    if (idx == -1) {
      console.error("Color Scale does not have value of " + value);
      return NaN;
    }
    return this.gradient(idx / (this.values.length - 1));
  }

  /**
   *
   * @param {Element} svg
   * @param {{width:Number, height:Number}} size
   */
  render(parent, size) {
    let self = this;
    this.vis = parent
      .append("svg")
      .attr("width", size.width)
      .attr("height", size.height);

    const visWidth = size.width * 0.7;
    const widthPerElement = visWidth / self.values.length;
    this.vis
      .selectAll("rect")
      .data(this.values)
      .enter()
      .append("rect")
      .attr("x", function (d, i) {
        i * widthPerElement;
      })
      .attr("width", function (d, i) {
        widthPerElement;
      })
      .attr("y", 0)
      .attr("height", size.height / 2);
  }
}
class MetricButtonGroup {
  /**
   *
   * @param {DataObject} dataObject
   * @param {Scrubber} scrubber
   * @param {Institutions} institutes
   * @param {function({min:Number, max:Number})} deviationCountry
   */
  constructor(dataObject, scrubber, deviationCountry, stdGraph, svg) {
    this.dataObject = dataObject;
    this.scrubber = scrubber;
    this.stdGraph = stdGraph;
    this.svg = svg;
    this.deviationCountry = deviationCountry;
    $("#deviation-world").on("click", this.deviationToWorld.bind(this));
    $("#paper-citations").on("click", this.paperCitations.bind(this));
    $("#consistency").on("click", this.consistency.bind(this));
    $("#funding").on("click", this.funding.bind(this));
    $("#deviation-country").on("click", this.deviationCountryClick.bind(this));
    $("#deviation-country").css("background-color", this.highlightColor);
  }
  reset() {
    $("#deviation-world").css("background-color", "white");
    $("#paper-citations").css("background-color", "white");
    $("#consistency").css("background-color", "white");
    $("#funding").css("background-color", "white");
    $("#deviation-country").css("background-color", "white");
  }
  stdGraph = null;
  dataObject = null;
  scrubber = null;
  institutes = null;
  fundingHistory = {};
  citationHistory = {};
  deviationCountry = null;
  spinner = null;
  svg = null;
  highlightColor = "#4682b460";
  highlightDefault() {
    $("#deviation-country").css("background-color", this.highlightColor);
  }
  deviationCountryClick() {
    if (this.scrubber.isHidden()) {
      return;
    }
    let selection = this.scrubber.getSelected();
    this.reset();
    $("#deviation-country").css("background-color", this.highlightColor);
    this.deviationCountry(selection);
  }
  /**
   *
   * @param {Institutions} institutes
   */
  setInstitutions(institutes) {
    this.institutes = institutes;
  }

  deviationToWorld() {
    if (this.scrubber.isHidden()) {
      return;
    }
    this.reset();
    $("#deviation-world").css("background-color", this.highlightColor);
    let selection = this.scrubber.getSelected();
    //calculate institution sizes.
    let institutes = {};
    for (const country in this.dataObject.countries) {
      let tmpCountry = this.dataObject.getCountry(country);
      for (const ins in tmpCountry.institutes) {
        let instituteSequence = [];
        for (let i = selection.min; i <= selection.max; ++i) {
          let tmpInstitute = tmpCountry.getInstitute(ins);
          if (tmpInstitute.hasPapers(i)) {
            instituteSequence.push(tmpInstitute.getPapers(i));
          }
        }
        if (instituteSequence.length == this.scrubber.getNumYearsSelected()) {
          institutes[ins] = instituteSequence.reduce(
            (acc, cur) => acc + cur,
            0
          );
        }
      }
    }
    let result = this.standardDeviation(Object.values(institutes));
    for (const ins in institutes) {
      institutes[ins] = 14 + ((institutes[ins] - result.avg) / result.std) * 4;
    }
    this.institutes.setRadius(institutes);
  }

  async paperCitations() {
    let selection = this.scrubber.getSelected();
    if (this.scrubber.isHidden()) {
      return;
    }
    this.reset();
    $("#paper-citations").css("background-color", this.highlightColor);
    if (selection.min + "-" + selection.max in this.citationHistory) {
      this.institutes.setRadius(
        this.citationHistory[selection.min + "-" + selection.max]
      );
      return;
    }
    this.spinner = new LoadingSpinner(
      [this.svg, d3.select("#publishing-output")],
      "#map-holder"
    );
    this.dataObject.pauseLoading();
    let promises = await this.getPaperCitations();
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
    this.citationHistory[selection.min + "-" + selection.max] = citations;
    this.institutes.setRadius(citations);
    this.dataObject.unpauseLoading();
    this.spinner.destroy();
  }

  consistency() {
    if (this.scrubber.isHidden()) {
      return;
    }
    let result = {};
    this.reset();
    $("#consistency").css("background-color", this.highlightColor);

    let selection = this.scrubber.getSelected();
    for (const country in this.dataObject.countries) {
      for (const institute in this.dataObject.countries[country].institutes) {
        let tmpInstitute = this.dataObject.countries[country].institutes[
          institute
        ];
        let sequence = [];
        for (let i = selection.min; i <= selection.max; ++i) {
          if (tmpInstitute.hasPapers(i)) {
            sequence.push(tmpInstitute.getPapers(i));
          }
        }
        if (sequence.length != this.scrubber.getNumYearsSelected()) {
          continue;
        }
        let slopes = [];
        const sequenceEnd = sequence.length - 1;
        //calculate slope assume x distance is 1 || which it has to be for lead lag so it is fine to assume
        for (let i = 0; i < sequenceEnd; ++i) {
          const next = i + 1;
          let slope = sequence[next] - sequence[i];
          slopes.push(slope);
        }
        let sum = slopes.reduce(function (acc, val) {
          return acc + val;
        }, 0);
        let avg = sum / slopes.length;
        let std = 0;
        for (let i = 0; i < slopes.length; ++i) {
          std += (slopes[i] - avg) * (slopes[i] - avg);
        }
        std /= slopes.length;
        std = Math.sqrt(std);
        let deviationSum = 0;
        for (let i = 0; i < slopes.length; ++i) {
          deviationSum += Math.abs(slopes[i] - avg) / std;
        }
        //deviationSum /= slopes.length;
        result[institute] = 40 - deviationSum * 8;
      }
    }

    this.institutes.setRadius(result);
  }

  async funding() {
    if (this.scrubber.isHidden()) {
      return;
    }
    this.reset();
    $("#funding").css("background-color", this.highlightColor);
    let selection = this.scrubber.getSelected();
    if (selection.min + "-" + selection.max in this.fundingHistory) {
      this.institutes.setRadius(
        this.fundingHistory[selection.min + "-" + selection.max]
      );
      return;
    }
    this.spinner = new LoadingSpinner(
      [this.svg, this.stdGraph.svg],
      "#map-holder"
    );
    this.dataObject.pauseLoading();
    let results = [];
    for (let i = selection.min; i <= selection.max; ++i) {
      results.push(
        await this.query("/funding-can", {
          year: i,
          keyword: this.dataObject.currentKeyword,
        })
      );
    }
    for (let i = selection.min; i <= selection.max; ++i) {
      results.push(
        await this.query("/funding", {
          year: i,
          keyword: this.dataObject.currentKeyword,
        })
      );
    }
    let funding = {};
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

    this.fundingHistory[selection.min + "-" + selection.max] = funding;
    this.institutes.setRadius(funding);
    this.dataObject.unpauseLoading();
    this.spinner.destroy();
  }
  async getPaperCitations() {
    let selection = this.scrubber.getSelected();
    let promises = [];
    for (let i = selection.min; i <= selection.max; ++i) {
      promises.push(
        await this.query("/institute-citations", {
          country: "Canada",
          year: i,
          keyword: this.dataObject.currentKeyword,
        })
      );
    }
    for (let i = selection.min; i <= selection.max; ++i) {
      promises.push(
        await this.query("/institute-citations-not", {
          country: "Canada",
          year: i,
          keyword: this.dataObject.currentKeyword,
        })
      );
    }
    return promises;
  }

  standardDeviation(values) {
    let sum = 0;
    let avg = 0;
    for (let i = 0; i < values.length; ++i) {
      sum += values[i];
    }
    avg = sum / values.length;
    let std = 0;
    for (let i = 0; i < values.length; ++i) {
      std += (values[i] - avg) * (values[i] - avg);
    }
    std /= values.length - 1;
    std = Math.sqrt(std);
    return { avg: avg, std: std, total: sum };
  }
  async query(route, params) {
    let response = await d3.json(route, {
      method: "POST",
      body: JSON.stringify({
        country_name: params.country,
        keyword: params.keyword,
        year: params.year,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    });
    return response;
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
      this.vis = d3.select(parent).append("div").style(style);
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
class RecommendedKeywords {
  /**
   *
   * @param {string} parent
   * @param {function(null)} submission
   */
  constructor(parent, submission) {
    this.getRecommended(function (result) {
      let filteredResult = result.slice(0, 6);
      d3.select(parent)
        .selectAll("input")
        .data(filteredResult)
        .enter()
        .append("button")
        .attr("class", "recommend-button")
        .html(function (d, i) {
          return `<b>${
            i + 1
          }. </b> <span style="color:#b46e46;"><b>${d.keyword}, ${d.selection} years</b></span>`;
        })
        .on("click", function (d) {
          d3.event.stopPropagation();
          d3.event.preventDefault();
          d3.select("#search-field").attr("value", d.keyword);
          submission(null);
        });
    });
  }

  async getRecommended(callback) {
    d3.json("/get-recommended-list", {
      method: "POST",
      body: "",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }).then(function (res) {
      callback(res);
    });
  }
  /**
   *
   * @param {Array.<{val:Number, keyword:String, selection:Number}>} recommended
   */
  async putRecommended(recommended) {
    d3.json("/recommended-list", {
      method: "POST",
      body: JSON.stringify({
        recommended: recommended,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }).catch(function (err) {
      console.log(err);
    });
  }
}

class Erudit {
  constructor() {
    this.yearTotals = {};
    this.data = {};
  }
  static setEruditColor(color) {
    $(".erudit-logo").css({ backgroundColor: color });
  }
  async init() {
    try {
      this.yearTotals = await d3.json("/erudit/total-years", {
        method: "GET",
      });
    } catch (err) {
      console.error(err);
    }
  }
  /**
   *
   * @param {string} term
   */
  async search(term) {
    try {
      let result = await d3.json("/erudit/search", {
        method: "POST",
        body: JSON.stringify({ term }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });
      for (const x of result) {
        this.data[x.year] = x.count / this.yearTotals[x.year];
      }
      console.log(this.data);
    } catch (err) {
      console.error(err);
    }
  }
}
class MapObj {
  leadLagThreshold = 2.0;
  countries = null;
  institutes = null;
  interaction = null;
  legend = null;
  svg = null;
  spinner = null;
  projection = null;
  colorScale = new ColorScale(3);
  dataObject = new DataObject();
  glyphLegend = new GlyphLegend(this.colorScale.get(1));
  stdGraph = new STDGraph(
    { width: $("#timeline").width(), height: 300 },
    [],
    "#timeline"
  );
  metricButtons = new MetricButtonGroup(
    this.dataObject,
    this.stdGraph.scrubber,
    this.onScrubberSelection.bind(this),
    this.stdGraph,
    this.svg
  );
  eventGraph = new EventGraph(
    { width: $("#timeline").width(), height: 35 },
    [],
    "#timeline",
    "testEvent",
    "Most Lead"
  );
  eventGraph2 = new EventGraph(
    { width: $("#timeline").width(), height: 35 },
    [],
    "#timeline",
    "testEvent2",
    "Most Lag"
  );
  eventGraph3 = new EventGraph(
    { width: $("#timeline").width(), height: 35 },
    [],
    "#timeline",
    "testEvent3",
    "Most Countries"
  );
  eventGraph4 = new EventGraph(
    { width: $("#timeline").width(), height: 35 },
    [],
    "#timeline",
    "testEvent4",
    "Largest Total Lead Lag"
  );
  erudit = new Erudit();
  recommendedList = null;

  constructor(submission) {
    d3.json("./resources/countryTotals.json")
      .then((res) => {
        this.dataObject.setYearTotals(JSON.parse(JSON.stringify(res)));
      })
      .catch((err) => {
        console.error(err);
      });
    this.dataObject.onData(this.onDataUpdateSTDGraph.bind(this));
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph.createScrubberLines.bind(this.eventGraph)
    );
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph2.createScrubberLines.bind(this.eventGraph2)
    );
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph3.createScrubberLines.bind(this.eventGraph3)
    );
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph4.createScrubberLines.bind(this.eventGraph4)
    );
    this.stdGraph.scrubber.onEnd(this.onScrubberSelection.bind(this));
    this.stdGraph.scrubber.onResize(this.onScrubberResize.bind(this));
    this.dataObject.onData(this.mostLead.bind(this));
    this.dataObject.onData(this.mostLag.bind(this));
    this.dataObject.onData(this.getMostChaoticLeadLagCountries.bind(this));
    this.dataObject.onData(this.getLargestSumOfCountries.bind(this));
    this.dataObject.onData(this.recommendedAnalysis.bind(this));
    this.recommendedList = new RecommendedKeywords(
      "#recommended-list",
      submission
    );
  }
  onLeadLagThresholdChange(value) {
    if (isNaN(value)) {
      return;
    }
    this.leadLagThreshold = value;
    if (this.stdGraph.scrubber.isHidden()) {
      return;
    }
    let selection = this.stdGraph.scrubber.getSelected();
    let result = this.getLeadLagCountries(selection);
    for (const el in result.data) {
      if (result.data[el].distance > this.leadLagThreshold) {
        result.data[el].leadlag = 0;
      }
    }
    this.countries.color(
      result.data,
      this.legend.colorScale,
      result.missingData
    );
  }
  setLegend(legend) {
    this.legend = legend;
    this.legend.onColorChange(this.updateColor.bind(this));
    this.legend.colorScale.setScaleByYearsSelected(
      this.stdGraph.scrubber.getNumYearsSelected()
    );
    this.legend.updateColorScaleYears(this.legend.colorScale);
  }
  updateColor(colorScale) {
    this.countries.updateColor(colorScale);
    if (this.institutes != null) {
      this.institutes.updateColor(colorScale);
    }
    this.glyphLegend.updateColor(colorScale.get(1));
    this.eventGraph.updateColor(
      colorScale.get(-this.stdGraph.scrubber.getNumYearsSelected())
    );
    this.eventGraph2.updateColor(
      colorScale.get(this.stdGraph.scrubber.getNumYearsSelected())
    );
    this.eventGraph3.updateColor(colorScale.get(1));
    this.eventGraph4.updateColor(colorScale.get(-1));
    this.colorScale = colorScale;
    this.legend.raise();
  }
  createCountries(svg, json, projection) {
    this.countries = new Countries(json);
    this.countries.onHoverCallback = this.onHoverCountryToolTip.bind(this);
    this.countries.render(svg, projection, this.countryClick.bind(this));
    this.projection = projection;
  }

  /**
   *
   * @param {Element} svg svg element
   */
  createInteraction(svg) {
    this.interaction = new MapInteraction(svg);
    this.svg = svg;
  }
  onDataUpdateSTDGraph(dataObject) {
    if (!dataObject.hasCountry("Canada")) {
      return;
    }
    let canada = dataObject.countries["Canada"];
    let sum = 0;
    let counter = 0;
    for (let value in canada.countryTotal) {
      ++counter;
      sum += canada.countryTotal[value];
    }
    let data = [];
    for (let value in canada.countryTotal) {
      if (value == new Date().getFullYear()) {
        continue;
      }
      data.push({ x: Number(value), y: canada.countryTotal[value] });
    }
    this.stdGraph.updateData(data);
  }
  onScrubberResize(selection) {
    console.log("resize event");
    this.legend.colorScale.setScaleByYearsSelected(
      this.stdGraph.scrubber.getNumYearsSelected()
    );
    this.metricButtons.reset();
    this.metricButtons.highlightDefault();
    this.mostLag(this.dataObject);
    this.mostLead(this.dataObject);
    this.getLargestSumOfCountries(selection);
    this.getMostChaoticLeadLagCountries(selection);
    this.recommendedAnalysis(selection);
    this.legend.updateColorScaleYears(this.legend.colorScale);
    this.legend.setDate(selection);
    this.legend.raise();
  }
  onScrubberSelection(selection) {
    console.log(selection);
    this.legend.setDate(selection);
    this.metricButtons.reset();
    this.metricButtons.highlightDefault();
    //update the color of the countries
    this.colorScale.setRange(this.stdGraph.scrubber.getNumYearsSelected());
    let result = this.getLeadLagCountries(selection);
    for (const el in result.data) {
      if (result.data[el].distance > this.leadLagThreshold) {
        result.data[el].leadlag = 0;
      }
    }
    //erudit bit hard coded
    let canada = this.dataObject.getCountry("Canada");
    let canadaData = [];
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();

    for (let i = selection.min; i <= selection.max; ++i) {
      if (!canada.hasTotal(i)) {
        console.error("Canada does not have data for year: " + i);
        return;
      }
      canadaData.push(
        canada.getTotal(i) / this.dataObject.getYearTotal("Canada", i)
      );
    }
    const minWindow = selection.min - leadLagWindow;
    const maxWindow = selection.max + leadLagWindow;
    let eruditData = [];
    for (let i = minWindow; i <= maxWindow; ++i) {
      eruditData.push(this.erudit.data[i]);
    }
    let eruditLeadLag = leadlag(canadaData, eruditData);
    Erudit.setEruditColor(this.legend.colorScale.get(eruditLeadLag.bestOffset));
    //end of erudit
    this.countries.color(
      result.data,
      this.legend.colorScale,
      result.missingData
    );
    //update the institutions
    let institutionsResult = this.getLeadLagInstitutes(selection);
    if (this.institutes != null) {
      this.institutes.destroy();
    }
    this.institutes = new Institutions(
      this.svg,
      institutionsResult,
      this.legend.colorScale,
      this.interaction,
      this.projection,
      function () {
        this.legend.raise();
      }.bind(this),
      this.onHoverToolTip.bind(this)
    );
    this.metricButtons.setInstitutions(this.institutes);
  }
  getLeadLagInstitutes(selection) {
    let canada = this.dataObject.getCountry("Canada");
    let canadaData = [];
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();

    for (let i = selection.min; i <= selection.max; ++i) {
      if (!canada.hasTotal(i)) {
        console.error("Canada does not have data for year: " + i);
        return;
      }
      canadaData.push(
        canada.getTotal(i) / this.dataObject.getYearTotal("Canada", i)
      );
    }

    let otherData = [];
    for (const country in this.dataObject.countries) {
      let otherCountry = this.dataObject.getCountry(country);
      for (const institute in otherCountry.institutes) {
        let currentInstituteData = [];
        const minWindow = selection.min - leadLagWindow;
        const maxWindow = selection.max + leadLagWindow;
        let ins = otherCountry.getInstitute(institute);
        for (let j = minWindow; j <= maxWindow; ++j) {
          if (ins.hasPapers(j)) {
            currentInstituteData.push(
              ins.getPapers(j) / this.dataObject.getYearTotal("Canada", j)
            );
          }
        }
        if (currentInstituteData.length == maxWindow - minWindow + 1) {
          let result = leadlag(canadaData, currentInstituteData);
          let total = otherCountry
            .getInstitute(institute)
            .getPaperTotalAtYears(selection);
          let countryTotal = otherCountry.getPaperTotalAtYears(selection);
          let otherInstitutions = otherCountry.getInstitutionTotals(selection);
          let avg = otherInstitutions.reduce((curr, acc) => {
            return curr + acc;
          }, 0);
          avg /= otherInstitutions.length;
          const std = (acc, cur) => {
            return acc + (cur - avg) * (cur - avg);
          };
          let dev = otherInstitutions.reduce(std, 0);
          dev /= otherInstitutions.length;
          dev = Math.sqrt(dev);
          let scale = 14 + ((total - avg) / dev) * 4;
          let trendAverage = currentInstituteData.reduce((cur, acc) => {
            return cur + acc;
          }, 0);
          trendAverage /= currentInstituteData.length;
          otherData.push({
            country_name: country,
            name: institute,
            lead: result.bestOffset,
            data: currentInstituteData,
            trend:
              (currentInstituteData[leadLagWindow] -
                currentInstituteData[
                  currentInstituteData.length - 1 - leadLagWindow
                ]) /
              trendAverage,
            total: total,
            country_total: countryTotal,
            scale: scale,
            id: otherCountry.getInstitute(institute).getGridID(),
          });
        }
      }
    }
    return otherData;
  }
  getMostChaoticLeadLagCountries(selection) {
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();
    const currentYear = this.dataObject.currentYearLoading + 1;
    if (new Date().getFullYear() - currentYear < leadLagWindow * 3) {
      return;
    }
    let maxNumOfCountries = 0;
    let eventLocation = {};
    for (
      let max = new Date().getFullYear() - leadLagWindow,
        min = new Date().getFullYear() - leadLagWindow * 2;
      min > currentYear + leadLagWindow;
      --min, --max
    ) {
      let result = [];
      for (const country in this.dataObject.countries) {
        const currentCountry = this.dataObject.countries[country];
        for (let i = min; i <= max; ++i) {
          if (!currentCountry.hasTotal(i)) {
            break;
          }
          result.push(i);
        }
        if (result.length == max - min + 1) {
          result.push(country);
        }
      }
      if (result.length > maxNumOfCountries) {
        maxNumOfCountries = result.length;
        eventLocation = { min: min + 1, max: max };
      }
    }
    this.eventGraph3.updateData(
      [{ x1: eventLocation.min, x2: eventLocation.max }],
      maxNumOfCountries,
      this.legend.colorScale.get(1)
    );
  }
  getLargestSumOfCountries(selection) {
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();
    const currentYear = this.dataObject.currentYearLoading + 1;
    if (new Date().getFullYear() - currentYear < leadLagWindow * 3) {
      return;
    }
    let maxNumOfCountries = 0;
    let eventLocation = {};
    for (
      let max = new Date().getFullYear() - leadLagWindow,
        min = new Date().getFullYear() - (leadLagWindow * 2 - 1);
      min > currentYear + leadLagWindow;
      --min, --max
    ) {
      let result = this.getLeadLagCountries({ min: min, max: max });
      let sum = 0;
      if (!("data" in result)) {
        break;
      }
      for (let i = 0; i < result.data.length; ++i) {
        sum += Math.abs(result.data[i].leadlag);
      }
      if (sum > maxNumOfCountries) {
        maxNumOfCountries = sum;
        eventLocation = { min: min, max: max };
      }
    }
    this.eventGraph4.updateData(
      [{ x1: eventLocation.min, x2: eventLocation.max }],
      maxNumOfCountries,
      this.legend.colorScale.get(-1)
    );
  }
  /**
   *
   * @param {{min:Number, max:Number}} selection
   */
  getLeadLagCountries(selection) {
    let canada = this.dataObject.getCountry("Canada");
    let canadaData = [];
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();
    for (let i = selection.min; i <= selection.max; ++i) {
      if (!canada.hasTotal(i)) {
        console.error("Canada does not have data for year: " + i);
        return;
      }
      canadaData.push(
        canada.getTotal(i) / this.dataObject.getYearTotal("Canada", i)
      );
    }

    let otherData = [];
    let missingData = [];
    const minWindow = selection.min - leadLagWindow;
    const maxWindow = selection.max + leadLagWindow;
    for (const country in this.dataObject.countries) {
      if (country == "Canada") {
        continue;
      }
      let currentCountry = this.dataObject.getCountry(country);
      let currentCountryData = [];
      for (let i = minWindow; i <= maxWindow; ++i) {
        if (!currentCountry.hasTotal(i)) {
          missingData.push(country);
          break;
        }
        currentCountryData.push(
          currentCountry.getTotal(i) / this.dataObject.getYearTotal(country, i)
        );
      }
      if (currentCountryData.length == maxWindow - minWindow + 1) {
        let result = leadlag(canadaData, currentCountryData);
        let shiftedArray = currentCountryData.slice(
          leadLagWindow + result.bestOffset,
          leadLagWindow + result.bestOffset + canadaData.length
        );
        let distance = shiftedArray.reduce((acc, cur, idx) => {
          return acc + Math.pow(cur - canadaData[idx], 2);
        }, 0);
        distance = Math.sqrt(distance);
        otherData.push({
          country_name: country,
          leadlag: result.bestOffset,
          data: currentCountryData,
          distance: distance,
        });
      }
    }
    otherData.push({
      country_name: "Canada",
      leadlag: 0,
      data: canadaData,
      distance: 0,
    }); // leadlag and distance are both 0 because they are compared with itself.

    return {
      data: otherData,
      missingData: missingData,
      canadaData: canadaData,
    };
  }
  mostLead(dateObject) {
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();
    const currentYear = this.dataObject.currentYearLoading + 1;
    if (new Date().getFullYear() - currentYear < leadLagWindow * 3) {
      return;
    }
    let mostLead = 0;
    let eventRange = {
      max: new Date().getFullYear() - leadLagWindow,
      min: new Date().getFullYear() - (leadLagWindow * 2 - 1),
    };
    for (
      let max = new Date().getFullYear() - leadLagWindow,
        min = new Date().getFullYear() - leadLagWindow * 2;
      min > currentYear + leadLagWindow;
      --min, --max
    ) {
      let val = this.leadSum({ min: min, max: max });
      if (val < mostLead) {
        eventRange = { max: max, min: min + 1 };
        mostLead = val;
      }
    }
    this.eventGraph.updateData(
      [{ x1: eventRange.min, x2: eventRange.max }],
      mostLead,
      this.legend.colorScale.get(-leadLagWindow)
    );
  }
  mostLag(dataObject) {
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();
    const currentYear = this.dataObject.currentYearLoading + 1;
    if (new Date().getFullYear() - currentYear < leadLagWindow * 3) {
      return;
    }
    let mostLag = 0;
    let eventRange = {
      max: new Date().getFullYear() - leadLagWindow,
      min: new Date().getFullYear() - (leadLagWindow * 2 - 1),
    };
    for (
      let max = new Date().getFullYear() - leadLagWindow,
        min = new Date().getFullYear() - leadLagWindow * 2;
      min > currentYear + leadLagWindow;
      --min, --max
    ) {
      let val = this.lagSum({ min: min, max: max });
      if (val > mostLag) {
        eventRange = { max: max, min: min + 1 };
        mostLag = val;
      }
    }
    this.eventGraph2.updateData(
      [{ x1: eventRange.min, x2: eventRange.max }],
      mostLag,
      this.legend.colorScale.get(leadLagWindow)
    );
  }
  /**
   *
   * @param {{min:number, max:number}} years
   */
  leadSum(years) {
    let offset = years.max - years.min + 1;
    const canada = this.dataObject.getCountry("Canada");
    let canadaData = [];
    let leadsum = 0;
    for (let i = years.min; i <= years.max; ++i) {
      if (!canada.hasTotal(i)) {
        return 0;
      }
      canadaData.push(
        canada.getTotal(i) / this.dataObject.getYearTotal("Canada", i)
      );
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
        currentCountryData.push(
          currentCountry.getTotal(i) / this.dataObject.getYearTotal(country, i)
        );
      }
      if (currentCountryData.length == canadaData.length * 3) {
        let lead = leadlag(canadaData, currentCountryData);
        if (lead.bestOffset < 0) {
          leadsum += lead.bestOffset;
        }
      }
    }
    return leadsum;
  }
  /**
   *
   * @param {{min:number, max:number}} years
   */
  lagSum(years) {
    let offset = years.max - years.min + 1;
    const canada = this.dataObject.getCountry("Canada");
    let canadaData = [];
    let lagsum = 0;
    for (let i = years.min; i <= years.max; ++i) {
      if (!canada.hasTotal(i)) {
        return 0;
      }
      canadaData.push(
        canada.getTotal(i) / this.dataObject.getYearTotal("Canada", i)
      );
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
        currentCountryData.push(
          currentCountry.getTotal(i) / this.dataObject.getYearTotal(country, i)
        );
      }
      if (currentCountryData.length == canadaData.length * 3) {
        let lead = leadlag(canadaData, currentCountryData);
        if (lead.bestOffset > 0) {
          lagsum += lead.bestOffset;
        }
      }
    }
    return lagsum;
  }
  countryClick(countryName) {
    if (this.stdGraph.scrubber.isHidden()) {
      return;
    }
    let self = this;
    let temp = cmp.graphwindow;
    let selection = this.stdGraph.scrubber.getSelected();
    let canada = this.dataObject
      .getCountry("Canada")
      .getPapersAtYears(this.stdGraph.scrubber.getSelected());
    let other = this.dataObject
      .getCountry(countryName)
      .getPapersAtYears(this.stdGraph.scrubber.getSelected());
    if (canada.length && other.length) {
      canada = canada.map(function (d, i) {
        return d / self.dataObject.getYearTotal("Canada", selection.min + i);
      });
      other = other.map(function (d, i) {
        return d / self.dataObject.getYearTotal(countryName, selection.min + i);
      });
      temp.visualize(
        canada,
        other,
        this.dataObject.currentKeyword,
        countryName,
        this.stdGraph.scrubber.getSelected(),
        this.dataObject
      );
    }
  }
  onHoverCountryToolTip(box, d, leadlag) {
    let ins = this.dataObject.getCountry(d.properties.name);
    if (ins == null || leadlag == null) {
      return null;
    }
    console.log(d);
    let result = new Tooltip("#map-holder", box, `<p>${d.properties.name}</p>`);
    let visBox = result.vis.node().getBoundingClientRect();
    let insLine2 = [];
    let selection = this.stdGraph.scrubber.getSelected();
    let canada = this.dataObject.getCountry("Canada");
    let canLine = [];
    let insLine = [];
    for (let i = selection.min; i <= selection.max; ++i) {
      insLine.push({
        x: i,
        y: ins.getTotal(i) / this.dataObject.getYearTotal(d.properties.name, i),
      });
      canLine.push({
        x: i,
        y: canada.getTotal(i) / this.dataObject.getYearTotal("Canada", i),
      });
    }
    let leadLagSelection = {
      min: selection.min + Number(leadlag),
      max: selection.max + Number(leadlag),
    };
    for (let i = leadLagSelection.min; i <= leadLagSelection.max; ++i) {
      insLine2.push({
        x: i - Number(leadlag),
        y: ins.getTotal(i) / this.dataObject.getYearTotal(d.properties.name, i),
      });
    }
    let distance = insLine2.reduce((acc, cur, idx) => {
      return acc + Math.pow(cur.y - canLine[idx].y, 2);
    }, 0);
    distance = Math.sqrt(distance);

    let distance2 = insLine.reduce((acc, cur, idx) => {
      return acc + Math.pow(cur.y - canLine[idx].y, 2);
    }, 0);
    distance2 = Math.sqrt(distance2);
    console.log(`original distance: ${distance2}, new distance: ${distance}`);
    result.vis.append("div").html(`Distance: ${distance.toPrecision(3)}`);
    let maxY = Math.max(
      ...canLine
        .map(function (d) {
          return d.y;
        })
        .concat(
          insLine.map(function (d) {
            return d.y;
          })
        )
    );
    let max2Y = Math.max(
      ...canLine
        .map(function (d) {
          return d.y;
        })
        .concat(
          insLine2.map(function (d) {
            return d.y;
          })
        )
    );
    let minY = Math.min(
      ...canLine
        .map(function (d) {
          return d.y;
        })
        .concat(
          insLine.map(function (d) {
            return d.y;
          })
        )
    );
    let min2Y = Math.min(
      ...canLine
        .map(function (d) {
          return d.y;
        })
        .concat(
          insLine2.map(function (d) {
            return d.y;
          })
        )
    );
    maxY = Math.max(maxY, max2Y);
    minY = Math.min(minY, min2Y);

    const scale = 1;
    result.vis
      .append("div")
      .style("width", `${visBox.width}px`)
      .style("height", `${visBox.height / 4}px`);
    let svg5 = result.vis
      .append("svg")
      .attr("width", visBox.width / 2)
      .attr("height", visBox.height / 2)
      .attr("display", "inline-block")
      .attr("margin-top", "15px");

    svg5
      .append("circle")
      .attr("cx", visBox.width / 4)
      .attr("cy", visBox.height / 4)
      .attr("r", visBox.height / 4 - 3)
      .attr("stroke-width", 3)
      .style("fill", this.colorScale.get(Number(0)));

    svg5
      .append("text")
      .attr("dx", visBox.width / 4)
      .attr("dy", visBox.height / 4)
      .style("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("font-family", "helvetica")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text(0);
    let svg = result.vis
      .append("svg")
      .attr("width", visBox.width * scale)
      .attr("height", visBox.height / 2)
      .attr("display", "inline-block");
    let xScale = d3
      .scaleLinear()
      .domain([selection.min, selection.max])
      .range([0, visBox.width]);
    let yScale = d3
      .scaleLinear()
      .domain([minY, maxY])
      .range([visBox.height / 4, 0]);
    svg
      .append("path")
      .datum(insLine)
      .attr("class", "path1")
      .attr(
        "d",
        d3
          .line()
          .x(function (e) {
            return xScale(e.x);
          })
          .y(function (e) {
            return yScale(e.y);
          })
      )
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2.5)
      .style("opacity", "0.5");
    svg
      .append("path")
      .datum(canLine)
      .attr("class", "path2")
      .attr(
        "d",
        d3
          .line()
          .x(function (e) {
            return xScale(e.x);
          })
          .y(function (e) {
            return yScale(e.y);
          })
      )
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2.5)
      .style("opacity", "0.5");
    result.vis
      .append("div")
      .attr("width", visBox.width)
      .attr("height", visBox.height / 4);
    let svg6 = result.vis
      .append("svg")
      .attr("width", visBox.width / 2)
      .attr("height", visBox.height / 2)
      .attr("display", "inline-block");

    svg6
      .append("circle")
      .attr("cx", visBox.width / 4)
      .attr("cy", visBox.height / 4)
      .attr("r", visBox.height / 4 - 3)
      .attr("stroke-width", 3)
      .style("fill", this.colorScale.get(Number(leadlag)));

    svg6
      .append("text")
      .attr("dx", visBox.width / 4)
      .attr("dy", visBox.height / 4)
      .style("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("font-family", "helvetica")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text(leadlag);

    let svg2 = result.vis
      .append("svg")
      .attr("width", visBox.width * scale)
      .attr("height", visBox.height / 2)
      .attr("display", "inline-block");
    console.log(leadlag);
    xScale = d3
      .scaleLinear()
      .domain([selection.min, selection.max])
      .range([0, visBox.width]);
    yScale = d3
      .scaleLinear()
      .domain([minY, maxY])
      .range([visBox.height / 4, 0]);
    svg2
      .append("path")
      .datum(insLine2)
      .attr("class", "path1")
      .attr(
        "d",
        d3
          .line()
          .x(function (e) {
            return xScale(e.x);
          })
          .y(function (e) {
            return yScale(e.y);
          })
      )
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2.5)
      .style("opacity", "0.5");
    svg2
      .append("path")
      .datum(canLine)
      .attr("class", "path2")
      .attr(
        "d",
        d3
          .line()
          .x(function (e) {
            return xScale(e.x);
          })
          .y(function (e) {
            return yScale(e.y);
          })
      )
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2.5)
      .style("opacity", "0.5");

    return result;
  }
  onHoverToolTip(box, d) {
    let result = new Tooltip(
      "#map-holder",
      box,
      `<p>${d.country_name} total papers: ${d.country_total} <br>${d.name} total papers: ${d.total}</p>`
    );

    let visBox = result.vis.node().getBoundingClientRect();
    let selection = this.stdGraph.scrubber.getSelected();
    let svg5 = result.vis
      .append("svg")
      .attr("width", visBox.width)
      .attr("height", visBox.height / 2)
      .attr("display", "block");

    svg5
      .append("circle")
      .attr("cx", visBox.width / 2)
      .attr("cy", visBox.height / 4)
      .attr("r", visBox.height / 4 - 3)
      .attr("stroke-width", 3)
      .style("fill", this.colorScale.get(Number(d.lead)));

    svg5
      .append("text")
      .attr("dx", visBox.width / 2)
      .attr("dy", visBox.height / 4)
      .style("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 0.5)
      .attr("font-family", "helvetica")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text(d.lead);

    return result;
  }

  recommendedAnalysis(d) {
    let leadLagWindow = this.stdGraph.scrubber.getNumYearsSelected();
    const currentYear = this.dataObject.currentYearLoading + 1;
    if (new Date().getFullYear() - currentYear < leadLagWindow * 3) {
      return;
    }
    let mostLead = {
      selection: {
        min: this.eventGraph.selection.x1,
        max: this.eventGraph.selection.x2,
      },
      value: this.eventGraph.value,
    };
    let mostLag = {
      selection: {
        min: this.eventGraph2.selection.x1,
        max: this.eventGraph2.selection.x2,
      },
      value: this.eventGraph2.value,
    };
    let largestTotalLeadLag = {
      selection: {
        min: this.eventGraph4.selection.x1,
        max: this.eventGraph4.selection.x2,
      },
      value: this.eventGraph4.value,
    };
    let numOfCountries = { mostLead: 0, mostLag: 0, largestTotalLeadLag: 0 };
    let recommendedValue = 0;
    for (const country in this.dataObject.countries) {
      let result = this.dataObject
        .getCountry(country)
        .getPapersAtYears(mostLead.selection);
      if (result.length) {
        numOfCountries.mostLead += 1;
      }
      result = this.dataObject
        .getCountry(country)
        .getPapersAtYears(mostLag.selection);
      if (result.length) {
        numOfCountries.mostLag += 1;
      }
      result = this.dataObject
        .getCountry(country)
        .getPapersAtYears(largestTotalLeadLag.selection);
      if (result.length) {
        numOfCountries.largestTotalLeadLag += 1;
      }
    }
    let countryLeadLag = this.getLeadLagCountries(mostLead.selection);
    let diff = 0;
    for (let i = 0; i < countryLeadLag.data.length; ++i) {
      let offset = countryLeadLag.data[i].leadlag;
      let currentCountry = countryLeadLag.data[i].data;
      let canData = countryLeadLag.canadaData;
      currentCountry = currentCountry.slice(
        canData.length + offset,
        canData.length + offset + canData.length
      );
      let sum = currentCountry.reduce(function (acc, cur) {
        return acc + cur;
      }, 0);
      currentCountry = currentCountry.map(function (x) {
        return x / sum;
      });
      sum = canData.reduce(function (acc, cur) {
        return acc + cur;
      }, 0);
      canData = canData.map(function (x) {
        return x / sum;
      });

      for (let j = 0; j < currentCountry.length; ++j) {
        diff += Math.abs(canData[j] - currentCountry[j]);
      }
    }
    //diff /= leadLagWindow;
    recommendedValue += (mostLead.value / diff) * countryLeadLag.data.length;
    diff = 0;
    countryLeadLag = this.getLeadLagCountries(mostLag.selection);
    for (let i = 0; i < countryLeadLag.data.length; ++i) {
      let offset = countryLeadLag.data[i].leadlag;
      let currentCountry = countryLeadLag.data[i].data;
      let canData = countryLeadLag.canadaData;
      currentCountry = currentCountry.slice(
        canData.length + offset,
        canData.length + offset + canData.length
      );
      let sum = currentCountry.reduce(function (acc, cur) {
        return acc + cur;
      }, 0);
      currentCountry = currentCountry.map(function (x) {
        return x / sum;
      });
      sum = canData.reduce(function (acc, cur) {
        return acc + cur;
      }, 0);
      canData = canData.map(function (x) {
        return x / sum;
      });
      for (let j = 0; j < currentCountry.length; ++j) {
        diff += Math.abs(canData[j] - currentCountry[j]);
      }
    }
    //diff /= leadLagWindow;
    recommendedValue += (mostLag.value / diff) * countryLeadLag.data.length;
    diff = 0;
    countryLeadLag = this.getLeadLagCountries(largestTotalLeadLag.selection);
    for (let i = 0; i < countryLeadLag.data.length; ++i) {
      let offset = countryLeadLag.data[i].leadlag;
      let currentCountry = countryLeadLag.data[i].data;
      let canData = countryLeadLag.canadaData;
      currentCountry = currentCountry.slice(
        canData.length + offset,
        canData.length + offset + canData.length
      );
      let sum = currentCountry.reduce(function (acc, cur) {
        return acc + cur;
      }, 0);
      currentCountry = currentCountry.map(function (x) {
        return x / sum;
      });
      sum = canData.reduce(function (acc, cur) {
        return acc + cur;
      }, 0);
      canData = canData.map(function (x) {
        return x / sum;
      });
      for (let j = 0; j < currentCountry.length; ++j) {
        diff += Math.abs(canData[j] - currentCountry[j]);
      }
    }
    //diff /= leadLagWindow;
    recommendedValue +=
      (largestTotalLeadLag.value / diff) * countryLeadLag.data.length;
    diff = 0;
    recommendedValue /= leadLagWindow;
    console.log("recommender value: " + recommendedValue);
    this.recommendedList.putRecommended({
      keyword: this.dataObject.currentKeyword,
      val: recommendedValue,
      selection: leadLagWindow,
    });
  }
  reset() {
    if (this.countries != null) {
      this.countries.reset();
    }
    if (this.institutes != null) {
      this.institutes.destroy();
    }
    this.dataObject.reset();
    this.dataObject = new DataObject();
    d3.json("./resources/countryTotals.json")
      .then((res) => {
        this.dataObject.setYearTotals(JSON.parse(JSON.stringify(res)));
      })
      .catch((err) => {
        console.error(err);
      });
    this.stdGraph.reset();
    this.eventGraph.reset();
    this.eventGraph2.reset();
    this.eventGraph3.reset();
    this.eventGraph4.reset();
    this.stdGraph = new STDGraph(
      { width: $("#timeline").width(), height: 300 },
      [],
      "#timeline"
    );
    this.metricButtons.reset();
    this.eventGraph = new EventGraph(
      { width: $("#timeline").width(), height: 35 },
      [],
      "#timeline",
      "testEvent",
      "Most Lead"
    );
    this.eventGraph2 = new EventGraph(
      { width: $("#timeline").width(), height: 35 },
      [],
      "#timeline",
      "testEvent2",
      "Most Lag"
    );
    this.eventGraph3 = new EventGraph(
      { width: $("#timeline").width(), height: 35 },
      [],
      "#timeline",
      "testEvent3",
      "Most Countries"
    );
    this.eventGraph4 = new EventGraph(
      { width: $("#timeline").width(), height: 35 },
      [],
      "#timeline",
      "testEvent4",
      "Largest Total Lead Lag"
    );
    this.metricButtons = new MetricButtonGroup(
      this.dataObject,
      this.stdGraph.scrubber,
      this.onScrubberSelection.bind(this),
      this.stdGraph,
      this.svg
    );
    this.dataObject.onData(this.onDataUpdateSTDGraph.bind(this));
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph.createScrubberLines.bind(this.eventGraph)
    );
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph2.createScrubberLines.bind(this.eventGraph2)
    );
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph3.createScrubberLines.bind(this.eventGraph3)
    );
    this.stdGraph.scrubber.onBrushed(
      this.eventGraph4.createScrubberLines.bind(this.eventGraph4)
    );
    this.stdGraph.scrubber.onEnd(this.onScrubberSelection.bind(this));
    this.stdGraph.scrubber.onResize(this.onScrubberResize.bind(this));
    this.dataObject.onData(this.mostLead.bind(this));
    this.dataObject.onData(this.mostLag.bind(this));
    this.dataObject.onData(this.getMostChaoticLeadLagCountries.bind(this));
    this.dataObject.onData(this.getLargestSumOfCountries.bind(this));
    this.dataObject.onData(this.recommendedAnalysis.bind(this));
  }
}
