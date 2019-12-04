import { normalize } from "path";

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
      let parsedResults=[];
      for (let i = 0; i < res.length; ++i) {
        parsedResults.push(parse(res[i]));
      }
      let result = aggregateParsedData(parsedResults);
      //calculate standard deviation of institution output in each country
      for (const key in result.countries) {
        let deviation = stdDeviation(result.countries[key].institutes);
        result.countries[key].deviation = deviation;
      }

      normalizeAggregatedData(result);
      previousQueries.push(result);
      calculateLeadLag(result);
    });
  }
  /**
   * Parses the query data
   * @param {} data
   */
  function parse(res) {
    let query = JSON.parse(res.body);
    let countries = {};
    if (!("research_orgs" in query)) {
      console.error("Response missing research_orgs");
      return;
    }

    let data = query.research_orgs;

    for (let i = 0; i < data.length; ++i) {
      if (data[i].country_name in countries) {
        countries[data[i].country_name].total += data[i].count;
      } else {
        countries[data[i].country_name] = {institutes:{}, total:data[i].count};
      }
      countries[data[i].country_name].institutes[data[i].name] = {
        count: data[i].count,
        grid_id: data[i].id
      };
    }
    return { countries: countries};
  }

  function aggregateParsedData(data)
  {
    countries={};
    for(let i = 0; i < data.length; ++i)
      {
        for(const country_name in data[i])
        {
          if(country_name in countries)
          {
            countries[country_name].total += data[i][country_name].total;
            countries[country_name].sequence.push(data[i][country_name].total);
          }
          else
          {
            countries[country_name] = {total:data[i][country_name].total, sequence:[], deviation=0, institutions:{}};
            countries[country_name].sequence.push(data[i][country_name].total);
          }
          for(const institute_name in data[i][country_name].institutes)
          {
            if(institute_name in countries[country_name].institutions)
            {
              countries[country_name].institutions[institute_name].total += data[i][country_name].institutes[institute_name].count;
              countries[country_name].institutions[institute_name].sequence.push(data[i][country_name].institutes[institute_name].count);
            }
            else
            {
              countries[country_name].institutions[institute_name] = {
                total: data[i][country_name].institutes[institute_name].count,
                sequence:[],
                grid_id: data[i][country_name].institutes[institute_name].grid_id,
              }
              countries[country_name].institutions[institute_name].sequence.push(data[i][country_name].institutes[institute_name].count);
            }
          }
        }
      }
      return {countries: countries};
  }
  function normalizeAggregatedData(data)
  {
    for(const key in data)
    {
      const total = data[key].total;
      for(let i=0; i < data[key].sequence.length; ++i)
      { 
        data[key].sequence[i] /= total;
      }
      for(const institute in data[key].institutions)
      {
          for(let i=0; i < data[key].insitutions[institute].sequence.length; ++i)
          {
            data[key].institutions[institute].sequence[i] /= data[key].institutions[institute].total;
          }
      }
    }
  }
  function calculateLeadLag(data) {
    let countries = [];
    let institutions = [];
    let missingCountries = [];
    let missingInstitutions = [];
    for (const country in data.countries) {
      if(!(country == "Canada"))
      {
      
      if (
        data.countries[country].sequence.length !=
        data.countries["Canada"].sequence.length
      ) 
      {
        missingCountries.push(country);
        continue;
      }
      if (country != "Canada") {
        let leadLag = leadlag(
          Array.from(data.countries["Canada"].sequence, y => (y = { y: y })),
          Array.from(data.countries[country].sequence, y => (y = { y: y }))
        );
        countries.push({ leadlag: leadLag, country_name: country });
      }
    }
      for (let i=0; i < data.countries[country].institutions.sequence.length; ++i) {
        if (
          data.countries[country].sequence[i].length !=
          data.countries["Canada"].institutions.sequence.length
        ) {
          missingInstitutions.push({
            id: data.countries[country].institutions.grid_id[institute],
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
          stdDeviation: data.countries.deviation[data.institutions.country_name[institute]]
        });
      }
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
      const country_name = query.institutions[data[index].name].country_name;
      const countryTotal = query.countries[country_name].total;
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
