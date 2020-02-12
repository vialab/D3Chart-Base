$(function() {
  //These are all cmp objects see components.js
  let cmpCountries = cmp.countries;
  let cmpInstitutes = cmp.glyphs;
  //let timeline = cmp.timeline;
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
  let mapObj = new MapObj(keywordSubmission.bind(this));
  //test.dataObject.getAllPapers("Video cassette recorder");
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
    if (event != null) {
      event.preventDefault();
    }
    mapObj.reset();
    let defaultSelection = 1;
    $("#metric-selection").val(defaultSelection);
    let keyword = $("#search-field").val();
    legend.setKeyword(keyword);
    mapObj.dataObject.getAllPapers(keyword);
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
      `translate(${$(window).width() -
        legendVis.node().getBoundingClientRect().width -
        padding},${y - legendVis.node().getBBox().height - padding})`
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
    mapObj.createCountries(countriesGroup, json.features, path);
    mapObj.projection = projection;
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
    mapObj.createInteraction(svg.node());
    mapObj.svg = svg;
    mapObj.metricButtons.svg = svg;
    mapObj.setLegend(legend);
    mapObj.interaction.addElementToTransform(countriesGroup);
  }
});
