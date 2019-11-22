$(function() {
  let previousQueries = [];
  let countryNames = {};
  let nodes = [];
  let numYears = 4;
  let yearScale = createRange(numYears);
  let tooltip;
  let svg;
  let projection;
  let timeline;
  let defs;
  let timelineAttr = {
    margin: { left: 10, right: 10, bottom: 50 },
    bbox: {
      width: 400,
      height: 100,
      x: $(window).width() / 2 - 200,
      y: $(window).height() - 100
    }
  };
  let colorScale = cmp.colorScale;
  colorScale.setGradient(d3.interpolateRdBu).setScale(yearScale);

  d3.json("./custom.geo.json").then(function(json) {
    onLoad(json);
  });
  $("#keyword-form").submit(keywordSubmission);

  let colorScaleList = createColorSchemes();

  function createColorSchemes() {
    let result = [
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
    ];
    return result;
  }
  function createGradients(colorSchemes) {
    for (let i = 0; i < colorSchemes.length; ++i) {
      let gradient = defs
        .append("linearGradient")
        .attr("id", `svgGradient${i}`)
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "100%");
      gradient
        .append("stop")
        .attr("class", "start")
        .attr("offset", "0%")
        .attr("stop-color", colorSchemes[i](0))
        .attr("stop-opacity", 1);

      for (let j = 1; j < 10; ++j) {
        gradient
          .append("stop")
          .attr("offset", `${j / 10}%`)
          .attr("stop-color", colorSchemes[i](j / 10))
          .attr("stop-opacity", 1);
      }
      gradient
        .append("stop")
        .attr("class", "end")
        .attr("offset", "100%")
        .attr("stop-color", colorSchemes[i](10 / 10))
        .attr("stop-opacity", 1);
    }
  }
  function keywordSubmission(event) {
    event.preventDefault();
    let keyword = $("#search-field").val();
    let year = { min: 2012, max: 2018 };
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
        countries: { total: {}, sequence: {} },
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
            result.countries.total[data[j].country_name] = 0;
            result.countries.total[data[j].country_name] += data[j].count;
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
        }
        result.countries.sequence["Canada"].push(
          result.countries.total["Canada"] -
            result.countries.sequence["Canada"].reduce((a, b) => a + b, 0)
        );
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
      timeline.remove();
      let worldSum = 0;
      let canadaSum = 0;
      for (let i = 0; i < worldLine.length; ++i) {
        worldSum += worldLine[i].y;
      }
      for (let i = 0; i < canadaLine.length; ++i) {
        canadaSum += canadaLine[i].y;
      }
      for (let i = 0; i < canadaLine.length; ++i) {
        canadaLine[i].y /= canadaSum;
      }
      for (let i = 0; i < worldLine.length; ++i) {
        worldLine[i].y /= worldSum;
      }
      timeline = createTimeline(
        svg,
        {
          min: 0.0,
          max: 1.0,
          time: year,
          lines: [canadaLine, worldLine]
        },
        timelineAttr.margin,
        timelineAttr.bbox
      );
      calculateLeadLag(result);
    });
  }

  function calculateLeadLag(data) {
    let countries = [];
    let institutions = [];
    let missingCountries = [];
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
        continue;
      }
      let leadLag = leadlag(
        Array.from(data.countries.sequence["Canada"], y => (y = { y: y })),
        Array.from(data.institutions.sequence[institute], y => (y = { y: y }))
      );
      institutions.push({
        leadlag: leadLag,
        id: data.institutions.grid_id[institute],
        name: institute
      });
    }
    colorMap(countries, missingCountries);
    colorInstitutions(institutions, data);
  }

  async function colorInstitutions(data, query) {
    let location_ids = Array.from(data, x => x.id);
    let locations = await getLocations(location_ids);
    console.log(locations);
    for (let index in locations) {
      const country_name = query.institutions.country_name[data[index].name];
      const countryTotal = query.countries.total[country_name];
      const instituteTotal = query.institutions.total[data[index].name];
      const end = query.institutions.sequence[data[index].name].length - 1;
      const trend =
        query.institutions.sequence[data[index].name][0] -
        query.institutions.sequence[data[index].name][end];
      createGlyph(
        20 * (instituteTotal / countryTotal) + 20,
        projection([locations[index].lng, locations[index].lat]),
        trend,
        svg,
        {
          sequence: query.institutions.sequence[data[index].name],
          total: query.institutions.total[data[index].name],
          name: data[index].name
        }
      );
    }
  }

  function colorMap(data, missingData) {
    for (let i = 0; i < data.length; ++i) {
      if (data[i].country_name in countryNames) {
        let acronym = countryNames[data[i].country_name];
        $(`#country${acronym}`).css({ fill: colorScale.get(data[i].leadlag) });
      } else {
        console.log(`${data[i].country_name} does not exist in dictionary`);
      }
    }
    for (let i = 0; i < missingData.length; ++i) {
      if (missingData[i] in countryNames) {
        let acronym = countryNames[missingData[i]];
        $(`#country${acronym}`).css({ fill: "url(#missing-data)" });
      }
    }
  }

  function createRange(year) {
    let result = [];
    for (let i = -year; i <= year; ++i) {
      result.push(i);
    }
    return result;
  }

  function getRandom(bottom, top) {
    let time = Math.random();
    return Math.floor((1 - time) * bottom + time * top);
  }

  function range(min, max, step) {
    let result = [];
    for (let i = min; i <= max; i += step) {
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
  /**
   *
   * @param {Number} scale
   * @param {[Number,Number]} coords
   * @param {Number} trend
   * @param {Element} svg
   * @param {{sequence:[Number...], total:Number, name:String}} data
   * @returns {Element}
   */
  function createGlyph(scale, coords, trend, svg, data) {
    let rotation = 0;
    if (trend > 0.05) {
      rotation = 45;
    }
    if (trend > -0.05) {
      rotation = -45;
    }
    let glyph = svg.append("g");
    glyph.attr("class", "noselect");
    let circle = glyph
      .append("circle")
      .attr("cx", coords[0])
      .attr("cy", coords[1])
      .attr("r", scale)
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .attr("fill", "#69a3b2");
    glyph
      .append("line")
      .attr("x1", coords[0] + scale)
      .attr("y1", coords[1])
      .attr("x2", coords[0] - scale)
      .attr("y2", coords[1])
      .attr("stroke", "black")
      .attr("stroke-width", scale / 5)
      .attr("transform", `rotate(${rotation},${coords[0]},${coords[1]})`);

    circle.on("mouseenter", function() {
      let rect = getOffset(circle);
      tooltip
        .style("visibility", "visible")
        .style("left", rect.left + scale + "px")
        .style("top", rect.top + scale + "px")
        .html(
          `<p>sequence: ${data.sequence} <br> total: ${data.total} <br> name:${data.name}</p>`
        );
    });
    circle.on("mouseleave", function() {
      tooltip.style("visibility", "hidden");
    });
    nodes.push(glyph);
    return glyph;
  }

  function createLegend(yearScale, svg) {
    let group = svg.append("g");
    group.attr("class", "noselect");
    let padding = 20;
    let y = $(window).height();
    let x = $(window).width();
    const end = yearScale.length - 1;

    let legend = cmp.legend;
    let legendVis = legend.visualize(colorScale, svg);
    legendVis.attr(
      "transform",
      `translate(${padding},${y - legendVis.node().getBBox().height - padding})`
    );
    return group;
  }
  function createTimeline(svg, data, margin, bbox) {
    let renderWindow = svg.append("g");
    let timeScale = d3
      .scaleLinear()
      .domain([data.time.min, data.time.max - 1])
      .range([margin.left, bbox.width - margin.right]);

    let valueScale = d3
      .scaleLinear()
      .domain([data.min, data.max])
      .range([bbox.height, 0]);
    let axis = renderWindow.append("g").call(
      d3
        .axisBottom(timeScale)
        .ticks(4)
        .tickFormat(d3.format("d"))
    );
    axis.attr(
      "transform",
      `translate(${bbox.x}, ${bbox.y + bbox.height - margin.bottom})`
    );
    for (let i = 0; i < data.lines.length; ++i) {
      renderWindow
        .append("path")
        .datum(data.lines[i])
        .attr("fill", "none")
        .attr("stroke", d3.interpolateSinebow(i / data.lines.length))
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round")
        .attr(
          "d",
          d3
            .line()
            .x(function(d) {
              return timeScale(d.x);
            })
            .y(function(d) {
              return valueScale(d.y);
            })
        )
        .attr("transform", `translate(${bbox.x}, ${bbox.y - margin.bottom})`);
    }
    return renderWindow;
  }

  function onLoad(json) {
    for (let i = 0; i < json.features.length; i++) {
      countryNames[json.features[i].properties.name] =
        json.features[i].properties.iso_a3;
    }
    console.log(countryNames);
    let scale = 1;
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
    createGradients(colorScaleList);
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

    let countries = countriesGroup
      .selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id", function(d, i) {
        return "country" + d.properties.iso_a3;
      })
      .attr("class", "country")
      .on("mouseover", function(d, i) {
        d3.select(this).style("stroke", "black");
        d3.select(this).style("stroke-width", "5px");
      })
      .on("mouseout", function(d, i) {
        d3.select(this).style("stroke", "white");
        d3.select(this).style("stroke-width", "1px");
      })
      .on("click", function(d, i) {
        console.log(d3.zoomTransform(countriesGroup.node()));
        let bbox = d3
          .select(this)
          .node()
          .getBBox();
        let x = bbox.x + bbox.width / 2;
        let y = bbox.y + bbox.height / 2;
        console.log(`${x} ${y}`);
        countriesGroup
          .transition()
          .duration(800)
          .attr(
            "transform",
            `translate(${$("#map-holder").width() / 2 - x * scale}, ${$(
              "#map-holder"
            ).height() /
              2 -
              y * scale})scale(${scale})`
          );
      });

    //legend
    let legend = createLegend(yearScale, svg);
    console.log($(window).width());

    new EasyPZ(
      svg.node(),
      function(transform) {
        scale = transform.scale;
        countriesGroup.attr(
          "transform",
          "translate(" +
            [transform.translateX, transform.translateY] +
            ")scale(" +
            transform.scale +
            ")"
        );
        for (let node in nodes) {
          nodes[node].attr(
            "transform",
            "translate(" +
              [transform.translateX, transform.translateY] +
              ")scale(" +
              transform.scale +
              ")"
          );
        }
      },
      ["SIMPLE_PAN"]
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
    let response = d3.json("/querycanada", {
      method: "POST",
      body: JSON.stringify({ keyword: params.keyword, year: params.year }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
    return response;
  }
});
