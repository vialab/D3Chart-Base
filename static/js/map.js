$(function() {
  let previousQueries = [];
  let countryNames={};
  let numYears = 4;
  let yearScale = createRange(numYears);
  let colorScale = d3
    .scaleOrdinal()
    .range(d3.schemePastel1)
    .domain(yearScale);

  d3.json("./custom.geo.json").then(function(json) {
    onLoad(json);
  });
  $("#keyword-form").submit(keywordSubmission);

  let colorScaleList = createColorSchemes(yearScale);

  function createColorSchemes(yearScale) {
    let result = [
      d3.schemeCategory10,
      d3.schemeAccent,
      d3.schemeDark2,
      d3.schemePaired,
      d3.schemePastel1,
      d3.schemePastel2,
      d3.schemeSet1,
      d3.schemeSet2,
      d3.schemeSet3,
      d3.schemeTableau10,
      d3.schemeBrBG[yearScale.length],
      d3.schemePRGn[yearScale.length],
      d3.schemePiYG[yearScale.length],
      d3.schemePuOr[yearScale.length],
      d3.schemeRdBu[yearScale.length],
      d3.schemeRdGy[yearScale.length],
      d3.schemeRdYlBu[yearScale.length],
      d3.schemeRdYlGn[yearScale.length],
      d3.schemeSpectral[yearScale.length],
      d3.schemeBlues[yearScale.length],
      d3.schemeGreens[yearScale.length],
      d3.schemeGreys[yearScale.length],
      d3.schemeOranges[yearScale.length],
      d3.schemePurples[yearScale.length],
      d3.schemeReds[yearScale.length],
      d3.schemeBuGn[yearScale.length],
      d3.schemeBuPu[yearScale.length],
      d3.schemeGnBu[yearScale.length],
      d3.schemeOrRd[yearScale.length],
      d3.schemePuBuGn[yearScale.length],
      d3.schemePuBu[yearScale.length],
      d3.schemePuRd[yearScale.length],
      d3.schemeYlGnBu[yearScale.length]
    ];
    return result;
  }

  function keywordSubmission(event) {
    event.preventDefault();
    let keyword = $("#search-field").val();
    let year = { min: 2014, max: 2016 };
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
        institutions: { total: {}, sequence: {}, grid_id: {} }
      };
      let yearSpan = year.max - year.min;

      for (let i = 0; i < yearSpan; ++i) {
        let data = JSON.parse(res[i].body).research_orgs;
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
        let data = JSON.parse(res[i].body).research_orgs;
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
      calculateLeadLag(result);
    });
  }

  function calculateLeadLag(data)
  {
    let result = [];
    for(const country in data.countries.sequence)
    {
      if(data.countries.sequence[country].length <2)
      {
        continue;
      }
      if(country != 'Canada')
      {
        let leadLag = leadlag(Array.from(data.countries.sequence["Canada"],y=>y={y:y}), Array.from(data.countries.sequence[country],y=>y={y:y}));
        result.push({leadlag:leadlag, country_name: country});
      }
    }
    colorMap(result);
  }

  function colorMap(data)
  {
    for(let i=0; i < data.length; ++i)
    {
      if(data[i].country_name in countryNames)
      {
        let acronym = countryNames[data[i].country_name];
        $(`#country${acronym}`).css({fill: colorScale(data[i].leadlag)});
      }
      else
      {
        console.log(`${data[i].country_name} does not exist in dictionary`);
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
  function createGlyph(scale, coords, trend, svg) {
    let rotation = 0;
    if (trend == "up") {
      rotation = -45;
    }
    if (trend == "down") {
      rotation = 45;
    }
    let glyph = svg.append("g");
    glyph
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
      .attr("stroke", "red")
      .attr("stroke-width", scale / 5)
      .attr("transform", `rotate(${rotation},${coords[0]},${coords[1]})`);
    return glyph;
  }

  function createLegend(yearScale, svg) {
    let group = svg.append("g");
    let radius = 30;
    let diameter = radius * 2;
    let padding = 10;
    group
      .selectAll("circle")
      .data(yearScale)
      .enter()
      .append("circle")
      .attr("r", radius)
      .attr("cx", 0)
      .attr("cy", function(d, i) {
        return i * diameter + radius;
      })
      .attr("fill", function(d) {
        return colorScale(d);
      });
    group.on("mouseenter", function() {
      group
        .transition()
        .attr("transform", "translate(30)")
        .duration(500);
      d3.event.stopPropagation();
    });
    group.on("mouseleave", function() {
      group
        .transition()
        .attr("transform", "translate(0)")
        .duration(500);
    });
    group
      .selectAll("text")
      .data(yearScale)
      .enter()
      .append("text")
      .attr("x", 0)
      .attr("y", function(d, i) {
        return i * diameter + radius;
      })
      .text(function(d) {
        return d;
      })
      .attr("text-anchor", "middle");

    group.on("click", function() {
      let viableScales = colorScaleList.filter(function(i) {
        return yearScale.length == i.length;
      });
      let swatches = svg.append("g");
      for (let i = 0; i < viableScales.length; ++i) {
        let swatch = swatches.append("g").attr("class", "group");
        let mouseRect = swatch
          .append("rect")
          .attr(
            "x",
            i * ((diameter + padding) / 5) + diameter + padding - radius / 5
          )
          .attr("y", radius - radius / 5)
          .attr("width", diameter / 5)
          .attr(
            "height",
            (viableScales[i].length - 1) * diameter + diameter / 5
          )
          .attr("class", "group")
          .style("visibility", "hidden")
          .attr("fill", "blue")
          .attr("opacity", "0.1")
          .on("mouseenter", function() {
            d3.select(this).style("visibility", "visible");
          })
          .on("mouseout", function() {
            d3.select(this).style("visibility", "hidden");
          })
          .on("click", function() {
            colorScale = d3
              .scaleOrdinal()
              .range(viableScales[i])
              .domain(yearScale);
            swatches.remove();
            group.remove();
            createLegend(yearScale, svg);
          });
        swatch
          .selectAll("circle")
          .data(viableScales[i])
          .enter()
          .append("circle")
          .attr("cx", i * ((diameter + padding) / 5) + diameter + padding)
          .attr("cy", function(d, j) {
            return j * diameter + radius;
          })
          .attr("r", radius / 5)
          .attr("fill", function(d) {
            return d;
          })
          .on("mouseenter", function() {
            mouseRect.style("visibility", "visible");
          })
          .on("mouseout", function() {
            mouseRect.style("visibility", "hidden");
          })
          .on("click", function() {
            colorScale = d3
              .scaleOrdinal()
              .range(viableScales[i])
              .domain(yearScale);
            swatches.remove();
            group.remove();
            createLegend(yearScale, svg);
          });
      }
    });
    return group;
  }
  function createTimeline(svg, data, margin, bbox) {
    let renderWindow = svg.append("g");
    let timeScale = d3
      .scaleLinear()
      .domain([data.time.min, data.time.max])
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
  }

  function onLoad(json) {
    for(let i=0; i < json.features.length; i++)
    {
      countryNames[json.features[i].properties.name] = json.features[i].properties.iso_a3;
    }
    console.log(countryNames);
    let oshawaCoords = [-78.865128, 43.89608];
    let scale = 1;
    //projection
    let projection = d3.geoMercator().scale($("#map-holder").width());
    //path generation based on projection
    let path = d3.geoPath().projection(projection);
    console.log(projection(oshawaCoords));
    //main svg
    let svg = d3
      .select("#map-holder")
      .append("svg")
      // set to the same size as the "map-holder" div
      .attr("width", $("#map-holder").width())
      .attr("height", $("#map-holder").height());
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
        d3.select(this).style("fill", `${colorScale(getRandom(-4, 4))}`);
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
    let glyph = createGlyph(45, projection(oshawaCoords), "down", svg);
    //legend
    let legend = createLegend(yearScale, svg);

    createTimeline(
      svg,
      {
        min: 0,
        max: 200,
        time: { min: 2014, max: 2018 },
        lines: [
          [
            { x: 2014, y: 100 },
            { x: 2015, y: 150 },
            { x: 2016, y: 100 },
            { x: 2017, y: 100 },
            { x: 2018, y: 80 }
          ],
          [
            { x: 2014, y: 80 },
            { x: 2015, y: 150 },
            { x: 2016, y: 10 },
            { x: 2017, y: 90 },
            { x: 2018, y: 190 }
          ]
        ]
      },
      { left: 10, right: 10, bottom: 50 },
      { width: 400, height: 100, x: 760, y: 869 }
    );
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
        glyph.attr(
          "transform",
          "translate(" +
            [transform.translateX, transform.translateY] +
            ")scale(" +
            transform.scale +
            ")"
        );
      },
      ["SIMPLE_PAN"]
    );
  }

  /**
   *
   * @param {[string]} grid_ids
   * @param {function(response)} callback
   */
  function getLocations(grid_ids, callback) {
    d3.json("/geo-locations", {
      method: "POST",
      body: JSON.stringify({ grid_ids: grid_ids }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    }).then(callback);
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
