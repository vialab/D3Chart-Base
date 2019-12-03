$(function() {
  let previousQueries = [];
  let cmpCountries = cmp.countries;
  let cmpInstitutes = cmp.glyphs;
  let transformView = {
    x: 0,
    y: 0,
    scale: 0
  };
  let numYears = 5;
  let yearScale = createRange(numYears);
  let yearSpan = { min: 2012, max: 2017 };
  let svg;
  let projection;
  let legend = cmp.legend;
  let legendVis;
  let defs;
  let currentKeyword;

  let colorScale = cmp.colorScale;
  colorScale.setGradient(d3.interpolateRdBu).setScale(yearScale);

  d3.json("./custom.geo.json").then(function(json) {
    onLoad(json);
  });

  $("#keyword-form").on("submit", keywordSubmission);

  function keywordSubmission(event) {
    event.preventDefault();
    cmpCountries.reset();
    cmpInstitutes.reset();
    let keyword = $("#search-field").val();
    $("#keyword-form")
      .get(0)
      .reset();
    currentKeyword = keyword;
    let year = { min: 2012, max: 2017 };
    result = [];
    for (let i = year.min; i < year.max; ++i) {
      let response = getNotCanada({ keyword: keyword, year: i });
      result.push(response);
    }
    for (let i = year.min; i < year.max; ++i) {
      let response = getCanada({ keyword: keyword, year: i });
      result.push(response);
    }
    Promise.all(result).then(function(res) {
      console.log(res);
      let result = {
        countries: { total: {}, sequence: {}, deviation: {} },
        institutions: { total: {}, sequence: {}, grid_id: {}, country_name: {} }
      };

      let yearSpan = year.max - year.min;
      let worldLine = [];
      let canadaLine = [];

      for (let i = 0; i < yearSpan; ++i) {
        let worldQuery = JSON.parse(res[i].body);
        let data = worldQuery.research_orgs;
        let element = { x: year.min + i, y: worldQuery._stats.total_count };
        worldLine.push(JSON.parse(JSON.stringify(element)));
        for (let j = 0; j < data.length; ++j) {
          if (data[j].country_name in result.countries.total) {
            result.countries.total[data[j].country_name] += data[j].count;
          } else {
            result.countries.total[data[j].country_name] = data[j].count;
            result.countries.sequence[data[j].country_name] = [];
          }
          if (data[j].name in result.institutions.total) {
            result.institutions.total[data[j].name] += data[j].count;
            result.institutions.sequence[data[j].name].push(data[j].count);
          } else {
            result.institutions.total[data[j].name] = data[j].count;
            result.institutions.sequence[data[j].name] = [];
            result.institutions.grid_id[data[j].name] = data[j].id;
            result.institutions.sequence[data[j].name].push(data[j].count);
            result.institutions.country_name[data[j].name] =
              data[j].country_name;
          }
        }
        //add time sequence
        for (const key in result.countries.total) {
          result.countries.sequence[key].push(
            result.countries.total[key] -
              result.countries.sequence[key].reduce((a, b) => a + b, 0)
          );
        }
      }

      result.countries.total["Canada"] = 0;
      result.countries.sequence["Canada"] = [];
      for (let i = yearSpan; i < res.length; ++i) {
        let canadaQuery = JSON.parse(res[i].body);
        let data = canadaQuery.research_orgs;
        let element = {
          x: year.min + i - yearSpan,
          y: canadaQuery._stats.total_count
        };
        canadaLine.push(JSON.parse(JSON.stringify(element)));
        for (let j = 0; j < data.length; ++j) {
          result.countries.total["Canada"] += data[j].count;
          if (data[j].name in result.institutions.total) {
            result.institutions.total[data[j].name] += data[j].count;
            result.institutions.sequence[data[j].name].push(data[j].count);
          } else {
            result.institutions.total[data[j].name] = data[j].count;
            result.institutions.sequence[data[j].name] = [];
            result.institutions.sequence[data[j].name].push(data[j].count);
            result.institutions.country_name[data[j].name] =
              data[j].country_name;
            result.institutions.grid_id[data[j].name] = data[j].id;
          }
        }
        result.countries.sequence["Canada"].push(
          result.countries.total["Canada"] -
            result.countries.sequence["Canada"].reduce((a, b) => a + b, 0)
        );
      }

      countryInstitutes = {};

      for (const key in result.institutions.total) {
        if (result.institutions.country_name[key] in countryInstitutes) {
          countryInstitutes[result.institutions.country_name[key]].push(
            result.institutions.total[key]
          );
        } else {
          countryInstitutes[result.institutions.country_name[key]] = [];
          countryInstitutes[result.institutions.country_name[key]].push(
            result.institutions.total[key]
          );
        }
      }

      for (const key in result.countries.total) {
        deviation = stdDeviation(countryInstitutes[key]);
        result.countries.deviation[key] = deviation;
      }

      for (const key in result.countries.total) {
        for (let i = 0; i < result.countries.sequence[key].length; ++i) {
          result.countries.sequence[key][i] /= result.countries.total[key];
        }
      }
      for (const key in result.institutions.total) {
        for (let i = 0; i < result.institutions.sequence[key].length; ++i) {
          result.institutions.sequence[key][i] /=
            result.institutions.total[key];
        }
      }
      console.log(worldLine);
      console.log(canadaLine);
      previousQueries.push(result);

      calculateLeadLag(result);
    });
  }

  function calculateLeadLag(data) {
    let countries = [];
    let institutions = [];
    let missingCountries = [];
    let missingInstitutions = [];
    for (const country in data.countries.sequence) {
      if (
        data.countries.sequence[country].length !=
        data.countries.sequence["Canada"].length
      ) {
        missingCountries.push(country);
        continue;
      }
      if (country != "Canada") {
        let leadLag = leadlag(
          Array.from(data.countries.sequence["Canada"], y => (y = { y: y })),
          Array.from(data.countries.sequence[country], y => (y = { y: y }))
        );
        countries.push({ leadlag: leadLag, country_name: country });
      }
    }
    for (const institute in data.institutions.sequence) {
      if (
        data.institutions.sequence[institute].length !=
        data.countries.sequence["Canada"].length
      ) {
        missingInstitutions.push({
          id: data.institutions.grid_id[institute],
          name: institute
        });
        continue;
      }
      let leadLag = leadlag(
        Array.from(data.countries.sequence["Canada"], y => (y = { y: y })),
        Array.from(data.institutions.sequence[institute], y => (y = { y: y }))
      );

      institutions.push({
        leadlag: leadLag,
        id: data.institutions.grid_id[institute],
        name: institute,
        stdDeviation:
          data.countries.deviation[data.institutions.country_name[institute]]
      });
    }
    cmpCountries.color(countries, missingCountries, colorScale);
    colorInstitutions(institutions, data).then(function() {
      legendVis.remove();
      legendVis = createLegend(yearScale, svg);
    });
  }

  async function colorInstitutions(data, query) {
    let location_ids = Array.from(data, x => x.id);
    let locations = await getLocations(location_ids);
    let renderData = [];
    console.log(locations);
    for (let index in locations) {
      const country_name = query.institutions.country_name[data[index].name];
      const countryTotal = query.countries.total[country_name];
      const instituteTotal = query.institutions.total[data[index].name];
      const end = query.institutions.sequence[data[index].name].length - 1;
      const trend =
        query.institutions.sequence[data[index].name][0] -
        query.institutions.sequence[data[index].name][end];
      let avg = data[index].stdDeviation.average;
      let stdDev = data[index].stdDeviation.stdDeviation;
      let scale = 14 + ((instituteTotal - avg) / stdDev) * 4;
      let coords = projection([locations[index].lng, locations[index].lat]);

      renderData.push({
        lat: coords[0],
        lng: coords[1],
        scale: scale,
        lead: data[index].leadlag,
        trend: trend,
        name: data[index].name,
        total: instituteTotal,
        country_name: country_name,
        country_total: countryTotal,
        stdDeviation: data[index].stdDeviation
      });
    }
    cmpInstitutes.visualize(svg, colorScale, renderData, transformView);
  }

  function stdDeviation(institutes) {
    const len = institutes.length;
    let avg = institutes.reduce((y, x) => y + x) / len;
    std = institutes.reduce((y, x) => y + (x - avg) * (x - avg));
    deviation = Math.sqrt(std / len);
    return { stdDeviation: deviation, average: avg };
  }
  function createRange(year) {
    let result = [];
    for (let i = -year; i <= year; ++i) {
      result.push(i);
    }
    return result;
  }

  function getOffset(element) {
    var bound = element.node().getBoundingClientRect();
    var html = document.documentElement;

    return {
      top: bound.top + window.pageYOffset - html.clientTop,
      left: bound.left + window.pageXOffset - html.clientLeft
    };
  }

  function createLegend(yearScale, svg) {
    let group = svg.append("g");
    group.attr("class", "noselect");
    let padding = 20;
    let y = $(window).height();
    legendVis = legend.visualize(
      colorScale,
      group,
      `Canada vs the World (${yearSpan.min}-${yearSpan.max -
        1}), "${currentKeyword}"`
    );
    legendVis.attr(
      "transform",
      `translate(${padding},${y - legendVis.node().getBBox().height - padding})`
    );
    return group;
  }

  function onLoad(json) {
    //projection
    projection = d3.geoMercator().scale($("#map-holder").width());
    //path generation based on projection
    let path = d3.geoPath().projection(projection);
    tooltip = d3
      .select("#map-holder")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px");

    //main svg
    svg = d3
      .select("#map-holder")
      .append("svg")
      // set to the same size as the "map-holder" div
      .attr("width", $("#map-holder").width())
      .attr("height", $("#map-holder").height());
    defs = svg.append("defs");
    var filter = defs.append("filter").attr("id", "dropshadow");
    defs
      .append("svg:pattern")
      .attr("id", "missing-data-img")
      .attr("width", 50)
      .attr("height", 25)
      .attr("patternUnits", "userSpaceOnUse")
      .append("image")
      .attr("xlink:href", "/resources/patternFill.png")
      .attr("width", 50)
      .attr("height", 25)
      .attr("x", 0)
      .attr("y", 0);
    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 1)
      .attr("result", "blur");

    filter
      .append("feOffset")
      .attr("in", "blur")
      .attr("dx", 0.5)
      .attr("dy", 0.5)
      .attr("result", "offsetBlur");

    var feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode").attr("in", "offsetBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    defs
      .append("pattern")
      .attr("id", "missing-data")
      .attr("width", 40)
      .attr("height", 25)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#335553")
      .attr("stroke-width", "3")
      .attr("d", "M0,0 Q10,20  20,10 T 40,0");
    //group containing countries
    let countriesGroup = svg.append("g").attr("id", "map");
    //the rect to be drawn on
    countriesGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", $("#map").width())
      .attr("height", $("#map").height());
    cmpCountries.data(json.features).visualize(countriesGroup, path);
    //  .on("click", function(d, i) {
    //    let end = previousQueries.length - 1;
    //    if (!(d.properties.name in previousQueries[end].countries.sequence)) {
    //      return;
    //    }
    //    $("#map-holder").append(
    //      `<div class="graph-window row" id="graph-holder"></div>`
    //    );
    //
    //    $("#graph-holder").mouseleave(function() {
    //      $("#graph-holder").remove();
    //    });
    //
    //    $("#graph-holder").one(
    //      "animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd",
    //      function() {
    //        let result = [];
    //        let category = [];
    //        for (let i = yearSpan.min; i < yearSpan.max; ++i) {
    //          let temp = getCategory({
    //            keyword: currentKeyword,
    //            year: i,
    //            country_name: d.properties.name
    //          });
    //          result.push(temp);
    //        }
    //        for (let i = yearSpan.min; i < yearSpan.max; ++i) {
    //          let temp = getCategory({
    //            keyword: currentKeyword,
    //            year: i,
    //            country_name: "Canada"
    //          });
    //          result.push(temp);
    //        }
    //        Promise.all(result).then(function(res) {
    //          console.log(res);
    //          lines = {};
    //          lines2 = {};
    //          for (let j = 0; j < yearSpan.max - yearSpan.min; ++j) {
    //            let obj = JSON.parse(res[j].body).category_for;
    //            let count = JSON.parse(res[j].body)._stats.total_count;
    //
    //            for (let i = 0; i < obj.length; ++i) {
    //              if (obj[i].name in lines) {
    //                lines[obj[i].name].push({
    //                  x: yearSpan.min + j,
    //                  y: obj[i].count / count
    //                });
    //              } else {
    //                lines[obj[i].name] = [];
    //                lines[obj[i].name].push({
    //                  x: yearSpan.min + j,
    //                  y: obj[i].count / count
    //                });
    //              }
    //            }
    //          }
    //          for (let j = yearSpan.max - yearSpan.min; j < res.length; ++j) {
    //            let obj = JSON.parse(res[j].body).category_for;
    //            let count = JSON.parse(res[j].body)._stats.total_count;
    //            console.log(obj);
    //            for (let i = 0; i < obj.length; ++i) {
    //              if (obj[i].name in lines2) {
    //                lines2[obj[i].name].push({
    //                  x: yearSpan.min + j - (yearSpan.max - yearSpan.min),
    //                  y: obj[i].count / count
    //                });
    //              } else {
    //                lines2[obj[i].name] = [];
    //                lines2[obj[i].name].push({
    //                  x: yearSpan.min + j - (yearSpan.max - yearSpan.min),
    //                  y: obj[i].count / count
    //                });
    //              }
    //            }
    //          }
    //
    //          let chartView = new ChartView("graph-holder");
    //          chartView.addView("main-view");
    //          chartView.addView("category-view");
    //          chartView.setMainView("main-view");
    //          let CanadaArray = Array.from(
    //            previousQueries[end].countries.sequence["Canada"],
    //            function(d, i) {
    //              return { x: yearSpan.min + i, y: d };
    //            }
    //          );
    //          let OtherArray = Array.from(
    //            previousQueries[end].countries.sequence[d.properties.name],
    //            function(d, i) {
    //              return { x: yearSpan.min + i, y: d };
    //            }
    //          );
    //
    //          chartView.addChart(
    //            "main-view",
    //            {
    //              xdomain: [yearSpan.min, yearSpan.max - 1],
    //              ydomain: [0.0, 1.0],
    //              lines: [
    //                {
    //                  name: "Canada",
    //                  rawdata: CanadaArray,
    //                  data: CanadaArray
    //                },
    //                {
    //                  name: d.properties.name,
    //                  rawdata: OtherArray,
    //                  data: OtherArray
    //                }
    //              ]
    //            },
    //            data => {
    //              data.chartName = "total";
    //            }
    //          );
    //
    //          for (let key in lines) {
    //            if (key in lines2) {
    //              chartView.addChart(
    //                "category-view",
    //                {
    //                  xdomain: [yearSpan.min, yearSpan.max - 1],
    //                  ydomain: [0.0, 1.0],
    //                  lines: [
    //                    {
    //                      name: "Canada",
    //                      rawdata: lines2[key],
    //                      data: lines2[key]
    //                    },
    //                    {
    //                      name: d.properties.name,
    //                      rawdata: lines[key],
    //                      data: lines[key]
    //                    }
    //                  ]
    //                },
    //                data => {
    //                  data.chartName = key;
    //                }
    //              );
    //            }
    //          }
    //        });
    //      }
    //    );
    //  });
    //
    //legend
    legendVis = createLegend(yearScale, svg);
    let pz = new EasyPZ(
      svg.node(),
      function(transform) {
        transformView.x = transform.translateX;
        transformView.y = transform.translateY;
        transformView.scale = transform.scale;
        countriesGroup.attr(
          "transform",
          "translate(" +
            [transform.translateX, transform.translateY] +
            ")scale(" +
            transform.scale +
            ")"
        );
        let bbox = countriesGroup.node().getBBox();
        pz.options = {
          minScale: 0.1,
          maxScale: 5,
          bounds: {
            top: bbox.y,
            bottom: bbox.y + bbox.height,
            left: bbox.x,
            right: bbox.x + bbox.width
          }
        };
        if (!cmpInstitutes.rendered) {
          return;
        }
        cmpInstitutes.group.attr(
          "transform",
          "translate(" +
            [transform.translateX, transform.translateY] +
            ")scale(" +
            transform.scale +
            ")"
        );
      },
      {
        minScale: 0.1,
        maxScale: 5,
        bounds: { top: -6000, bottom: 6000, left: -1000, right: 1000 }
      },
      ["SIMPLE_PAN", "WHEEL_ZOOM", "PINCH_ZOOM"]
    );
    console.log(pz);
  }

  /**
   *
   * @param {[string]} grid_ids
   */
  async function getLocations(grid_ids) {
    let response = await d3.json("/geo-locations", {
      method: "POST",
      body: JSON.stringify({ grid_ids: grid_ids }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
    return response;
  }
  /**
   *
   * @param {{keyword:string, year:number}} params
   * @param {function(response)} callback
   */
  async function getNotCanada(params) {
    let response = await d3.json("/querynotcanada", {
      method: "POST",
      body: JSON.stringify({ keyword: params.keyword, year: params.year }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
    return response;
  }

  async function getCanada(params) {
    let response = await d3.json("/querycanada", {
      method: "POST",
      body: JSON.stringify({ keyword: params.keyword, year: params.year }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
    return response;
  }
});
