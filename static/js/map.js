$(function() {
  //These are all cmp objects see components.js
  let cmpCountries = cmp.countries;
  let cmpInstitutes = cmp.glyphs;
  let timeline = cmp.timeline;
  let legend = cmp.legend;
  //default variables like the d3.projection, svg, the svg defs, currentKeyword, and the easyPZ variable
  let yearSpan = { min: 2012, max: 2016 };
  let numYears = yearSpan.max - yearSpan.min + 1;
  let yearScale = createRange(numYears);
  let svg;
  let projection;
  let legendVis;
  let defs;
  let currentKeyword;
  let pz;
  let test = new MapObj();
  test.dataObject.getAllPapers("soy");
  let colorScale = cmp.colorScale;
  //setting the color gradient to be the red->blue color scale
  colorScale.setGradient(d3.interpolateRdBu).setScale(yearScale);
  //this is the country/map data
  //once we receive the json we call the load function which creates the map, legend and timeline
  d3.json("./custom.geo.json").then(function(json) {
    onLoad(json);
  });

  $("#metric-selection").on("change", async function() {
    if (!cmp.dataObject.hasData()) {
      return;
    }
    let selection = $("#metric-selection").val();
    let result = await cmp.metricSelection.getMetric(selection);
    cmpInstitutes.updateScale(result, function(x) {
      return x;
    });
  });
  $("#form").on("submit", keywordSubmission);

  function keywordSubmission(event) {
    event.preventDefault();
    let defaultSelection = 1;
    $("#metric-selection").val(defaultSelection);
    cmpCountries.reset();
    cmpInstitutes.reset();
    let keyword = $("#search-field").val();
    cmp.info.currentKeyword = keyword;
    legend.setKeyword(keyword);
    $("#form")
      .get(0)
      .reset();
    currentKeyword = keyword;
    result = [];
    yearSpan = timeline.currentSelection;
    for (let i = yearSpan.min; i <= yearSpan.max; ++i) {
      let response = getNotCanada({ keyword: keyword, year: i });
      result.push(response);
    }
    for (let i = yearSpan.min; i <= yearSpan.max; ++i) {
      let response = getCanada({ keyword: keyword, year: i });
      result.push(response);
    }
    Promise.all(result).then(function(res) {
      console.log(res);
      let parsedResults = [];
      for (let i = 0; i < res.length / 2; ++i) {
        parsedResults.push(parse(res[i], false));
      }
      for (let i = res.length / 2; i < res.length; ++i) {
        parsedResults.push(parse(res[i], true));
      }
      let aggData = aggregateParsedData(parsedResults);
      //calculate standard deviation of institution output in each country
      for (const key in aggData.countries) {
        let deviation = stdDeviation(aggData.countries[key].institutions);
        aggData.countries[key].deviation = deviation;
      }

      normalizeAggregatedData(aggData);
      calculateLeadLag(aggData);
    });
  }

  /**
   * Parses the query data
   * @param {} data
   */
  function parse(res, isCanada) {
    let query = JSON.parse(res.body);
    let countries = {};
    if (!("research_orgs" in query)) {
      console.error("Response missing research_orgs");
      return;
    }

    let data = query.research_orgs;
    if (isCanada) {
      data = data.filter(x => {
        return x.country_name == "Canada";
      });
    }
    for (let i = 0; i < data.length; ++i) {
      if (data[i].country_name in countries) {
        countries[data[i].country_name].total += data[i].count;
      } else {
        countries[data[i].country_name] = {
          institutes: {},
          total: data[i].count
        };
      }
      countries[data[i].country_name].institutes[data[i].name] = {
        count: data[i].count,
        grid_id: data[i].id
      };
    }
    return { countries: countries };
  }
  /**
   *
   * @param {*} data
   * Normalizes the totals of output papers
   * This is essentially required for us to do any sort of comparison
   */
  function aggregateParsedData(data) {
    countries = {};
    for (let i = 0; i < data.length; ++i) {
      for (const country_name in data[i].countries) {
        if (country_name in countries) {
          countries[country_name].total +=
            data[i].countries[country_name].total;
          countries[country_name].sequence.push(
            data[i].countries[country_name].total
          );
        } else {
          countries[country_name] = {
            total: data[i].countries[country_name].total,
            sequence: [],
            deviation: 0,
            institutions: {}
          };
          countries[country_name].sequence.push(
            data[i].countries[country_name].total
          );
        }
        for (const institute_name in data[i].countries[country_name]
          .institutes) {
          if (institute_name in countries[country_name].institutions) {
            countries[country_name].institutions[institute_name].total +=
              data[i].countries[country_name].institutes[institute_name].count;
            countries[country_name].institutions[institute_name].sequence.push(
              data[i].countries[country_name].institutes[institute_name].count
            );
          } else {
            countries[country_name].institutions[institute_name] = {
              total:
                data[i].countries[country_name].institutes[institute_name]
                  .count,
              sequence: [],
              grid_id:
                data[i].countries[country_name].institutes[institute_name]
                  .grid_id
            };
            countries[country_name].institutions[institute_name].sequence.push(
              data[i].countries[country_name].institutes[institute_name].count
            );
          }
        }
      }
    }
    return { countries: countries };
  }

  function normalizeAggregatedData(data) {
    for (const key in data.countries) {
      const total = data.countries[key].total;
      for (let i = 0; i < data.countries[key].sequence.length; ++i) {
        data.countries[key].sequence[i] /= total;
      }
      for (const institute in data.countries[key].institutions) {
        for (
          let i = 0;
          i < data.countries[key].institutions[institute].sequence.length;
          ++i
        ) {
          data.countries[key].institutions[institute].sequence[i] /=
            data.countries[key].institutions[institute].total;
        }
      }
    }
  }
  /**
   *
   * @param {*} data
   * Calculates lead lag for countries and institutions relative to canada's graph
   */
  function calculateLeadLag(data) {
    let countries = [];
    let institutions = [];
    let missingCountries = [];
    let missingInstitutions = [];
    for (const country in data.countries) {
      if (country != "Canada") {
        if (
          data.countries[country].sequence.length !=
          data.countries["Canada"].sequence.length
        ) {
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
      for (const ins in data.countries[country].institutions) {
        if (
          data.countries[country].institutions[ins].sequence.length !=
          data.countries["Canada"].sequence.length
        ) {
          missingInstitutions.push({
            id: data.countries[country].institutions[ins].grid_id,
            name: ins
          });
          continue;
        }
        let leadLag = leadlag(
          Array.from(data.countries["Canada"].sequence, y => (y = { y: y })),
          Array.from(
            data.countries[country].institutions[ins].sequence,
            y => (y = { y: y })
          )
        );
        data.countries[country].institutions[ins].leadlag = leadlag;
        institutions.push({
          leadlag: leadLag,
          id: data.countries[country].institutions[ins].grid_id,
          name: ins,
          stdDeviation: data.countries[country].deviation,
          country_name: country,
          totalPapers: data.countries[country].institutions[ins].total
        });
      }
    }
    let total = institutions.reduce((acc, currentVal) => {
      return acc + currentVal.totalPapers;
    }, 0);
    let avg = total / institutions.length;
    let std = institutions.reduce((acc, currentVal) => {
      return (
        acc + (currentVal.totalPapers - avg) * (currentVal.totalPapers - avg)
      );
    }, 0);

    cmp.dataObject.metaData.push({
      std: Math.sqrt(std / institutions.length),
      averagePaper: avg,
      years: yearSpan,
      keyword: currentKeyword
    });
    cmpCountries.color(countries, missingCountries, colorScale, data);
    colorInstitutions(institutions, data).then(function() {
      legendVis.raise();
      timeline.group.raise();
    });
  }
  /**
   *
   * @param {*} data
   * @param {*} query
   * creates and colors the institutions
   */
  async function colorInstitutions(data, query) {
    let location_ids = Array.from(data, x => x.id);
    let locations = await getLocations(location_ids);
    let renderData = [];
    for (let index in locations) {
      const country_name = data[index].country_name;
      const countryTotal = query.countries[country_name].total;
      const instituteTotal =
        query.countries[country_name].institutions[data[index].name].total;
      const end =
        query.countries[country_name].institutions[data[index].name].sequence
          .length - 1;
      const trend =
        query.countries[country_name].institutions[data[index].name]
          .sequence[0] -
        query.countries[country_name].institutions[data[index].name].sequence[
          end
        ];
      let avg = data[index].stdDeviation.average;
      let stdDev = data[index].stdDeviation.stdDeviation;
      let scale = 14 + ((instituteTotal - avg) / stdDev) * 4;
      let coords = projection([locations[index].lng, locations[index].lat]);
      query.countries[country_name].institutions[
        data[index].name
      ].scale = scale;

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
    //creating the base data for the institutions
    let base = {};
    for (const index in renderData) {
      base[renderData[index].name] = renderData[index].scale;
    }
    //storing the base data
    cmp.dataObject.queries.push(query);
    cmp.dataObject.metaData[cmp.dataObject.end].base = {};
    cmp.dataObject.metaData[cmp.dataObject.end].base = base;
    //visualizing the institutions
    cmpInstitutes.visualize(svg, colorScale, renderData, pz.totalTransform);
  }
  /**
   *
   * @param {*} institutes
   * calculates the standard deviation for the institutions. The set used for the calculation is all the institutions in a single country.
   */
  function stdDeviation(institutes) {
    let len = 0;
    let sum = 0;
    for (const institute in institutes) {
      len += 1;
      sum += institutes[institute].total;
    }

    let avg = sum / len;
    let std = 0;
    for (const institute in institutes) {
      std +=
        (institutes[institute].total - avg) *
        (institutes[institute].total - avg);
    }
    deviation = Math.sqrt(std / len);
    return { stdDeviation: deviation, average: avg };
  }
  /**
   *
   * @param {Number} year
   * This function creates an array that contains the year range
   * Example: if input is 5 the resulting array will be [-5,-4,-3,-2,-1,0,1,2,3,4,5]
   */
  function createRange(year) {
    let result = [];
    for (let i = -year; i <= year; ++i) {
      result.push(i);
    }
    return result;
  }
  /**
   *
   * @param {Element} svg
   * This function creates the legend
   */
  function createLegend(svg) {
    let group = svg.append("g");
    group.attr("class", "noselect");
    let padding = 20;
    let y = $(window).height();
    legendVis = legend
      .setKeyword(currentKeyword)
      .setDate(yearSpan)
      .visualize(colorScale, group);
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
    //tooltip on hover
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
    /*
     *These are definitions, The drop shadow is for applying a shadow to the border of objects
     *The Missing data is for filling countries and institutes with wavey lines to symbolize incomplete data
     */
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
      .attr("stdDeviation", 2)
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
      .attr("opacity", 0.8)
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
    //cmpCountries contains all of the country rendering data
    //json.features is all of the country names and their svg line data
    cmpCountries
      .data(json.features)
      .setYear(yearSpan)
      .visualize(countriesGroup, path);
    //defining map boundaries, struggled with this working with the easyPZ library
    //TODO implement map boundary
    mapBoundaries = countriesGroup.node().getBBox();

    //legend element
    legendVis = createLegend(svg);
    //translating the countries into the center of the viewport
    $("#map").attr(
      "transform",
      `translate(${$(window).width() / 2}, ${$(window).height() / 2 +
        152})scale(0.1)`
    );
    //This is EasyPZ *ironically not so easy*
    //The EasyPz library is responsible for handling mouse events on the svg
    //If you add an element to the svg you must add it to the transform function below
    pz = new EasyPZ(
      svg.node(),
      function(transform) {
        countriesGroup.attr(
          "transform",
          "translate(" +
            [transform.translateX, transform.translateY] +
            ")scale(" +
            transform.scale +
            ")"
        );
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

    //This is the timeline object
    let tg = timeline
      .setYears(yearSpan)
      .setLegend(legend)
      .visualize(svg);
    //setting easyPZ default transform and scale to that of the #map
    //If you look above you will notice its the same translation as the #map
    pz.totalTransform = {
      scale: 0.1,
      translateX: $(window).width() / 2,
      translateY: $(window).height() / 2 + 152
    };
    //moving the timeline to the bottom right hand corner 30 pixels from the bottom and 30 pixels from the right
    tg.attr(
      "transform",
      `translate(${$(window).width() -
        tg.node().getBoundingClientRect().width -
        30}, ${$(window).height() -
        tg.node().getBoundingClientRect().height -
        30})`
    );
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
