$(function() {
  //the chart object contains all of the d3 graphing
  var chartObj;
  //the lead chart contains all of the d3 graphing
  var leadChart;
  let checked = false;
  let lead = 0;
  let linedata = null;
  var multiCharts = [];
  $("#leadLagToggle").change(function(event) {
    checked = !checked;
    if (checked) {
      if (linedata != null) {
        let temp = shift(linedata.lines[0], lead);
        chartObj.updateLines([
          {
            name: "Canada",
            rawdata: temp,
            data: temp
          },
          {
            name: "!Canada",
            rawdata: linedata.lines[1].rawdata,
            data: linedata.lines[1].data
          }
        ]);
      }
    } else {
      if (linedata != null) {
        chartObj.updateLines(linedata.lines);
      }
    }
  });

  $("#newsearch").submit(function(event) {
    let buttonID = "query-search";
    let fieldID = "query-field";
    event.stopPropagation();
    event.preventDefault();
    let tmpButton = document.getElementById(buttonID);

    tmpButton.innerHTML = `<span class="spinner-grow spinner-grow-sm"></span>`;
    tmpButton.disabled = true;
    if (tmpButton.classList.contains("animate")) {
      tmpButton.classList.remove("animate");
    }
    var query = document.getElementById(fieldID).value;
    let url = "/query-dimensions";
    //Promise.all([
    //  d3.json(url, {
    //    method: "POST",
    //    body: JSON.stringify({
    //      query: `search publications where research_org_country_names!="Canada" return year`
    //    }),
    //    headers: {
    //      "Content-type": "application/json; charset=UTF-8"
    //    }
    //  }),
    //  d3.json(url, {
    //    method: "POST",
    //    body: JSON.stringify({
    //      query: `search publications where research_org_country_names="Canada" return year`
    //    }),
    //    headers: {
    //      "Content-type": "application/json; charset=UTF-8"
    //    }
    //  }),
    //  d3.json(url, {
    //    method: "POST",
    //    body: JSON.stringify({
    //      query: `search publications for "${query}" where research_org_country_names!="Canada" return year`
    //    }),
    //    headers: {
    //      "Content-type": "application/json; charset=UTF-8"
    //    }
    //  }),
    //  d3.json(url, {
    //    method: "POST",
    //    body: JSON.stringify({
    //      query: `search publications for "${query}" where research_org_country_names="Canada" return year`
    //    }),
    //    headers: {
    //      "Content-type": "application/json; charset=UTF-8"
    //    }
    //  }),
    //  d3.json(url, {
    //    method: "POST",
    //    body: JSON.stringify({
    //      query: `search publications in title_abstract_only for "Malaria" return category_bra return year sort by count`
    //    }),
    //    headers: {
    //      "Content-type": "application/json; charset=UTF-8"
    //    }
    //  })
    //]).then(function(values) {
    //  console.log(values);
    //  var lines = [];
    //  try {
    //    lines[0] = Object.values(JSON.parse(values[3].body).year);
    //    lines[1] = Object.values(JSON.parse(values[2].body).year);
    //    lines[2] = Object.values(JSON.parse(values[1].body).year);
    //    lines[3] = Object.values(JSON.parse(values[0].body).year);
    //    console.log(values[4].body);
    //  } catch (e) {
    //    //animate button to display error
    //    let tmpButton = document.getElementById(buttonID);
    //    tmpButton.innerHTML = "Query";
    //    tmpButton.disabled = false;
    //    tmpButton.classList.toggle("animate");
    //    return;
    //  }
    //  //set button to query as the previous query is finished
    //  document.getElementById(buttonID).innerHTML = "Query";
    //  document.getElementById(buttonID).disabled = false;
    //  //sort the return data
    //  for (let i = 0; i < lines.length; i++) {
    //    lines[i].sort(function(first, second) {
    //      return first.id - second.id;
    //    });
    //  }
    //  normalize(lines);
    //  console.log([lines[0], lines[1]]);
    //  linedata = convertToLineData([lines[0], lines[1]]);
    //  console.log(linedata);
    //  chartObj.smoothing = 1;
    //  chartObj.updateXScale(
    //    new Date(linedata.xdomain[0], 0),
    //    new Date(linedata.xdomain[1], 0)
    //  );
    //  chartObj.updateYScale(linedata.ydomain[0], linedata.ydomain[1]);
    //  chartObj.updateLines(linedata.lines);
    //  lead = leadlag(linedata.lines[0].rawdata, linedata.lines[1].rawdata);
    //  console.log(lead);
    //});
    Promise.all(queryDim(2016, 2018, query)).then(function(values) {
      console.log(values);
      var lines = [];
      let totals = [];
      let subGraphData = [];
      try {
        let result = aggregateQuery(values);
        console.log(result);
        totals[0] = JSON.parse(values[values.length - 2].body).year;
        totals[1] = JSON.parse(values[values.length - 1].body).year;
        lines[0] = result.notCanada.keyWordTotal;
        lines[1] = result.canada.keyWordTotal;
        let keys = [...result.canada.categories.keys()];
        for (let i = 0; i < keys.length; i++) {
          subGraphData.push(
            convertToLineData([
              result.canada.categories.get(keys[i]),
              result.notCanada.categories.get(keys[i])
            ])
          );
        }
        console.log(subGraphData.length);
        createMultiGraphs(subGraphData, multiCharts, { x: 393, y: 800 });
      } catch (e) {
        console.log(e);
        //animate button to display error
        let tmpButton = document.getElementById(buttonID);
        tmpButton.innerHTML = "Query";
        tmpButton.disabled = false;
        tmpButton.classList.toggle("animate");
        return;
      }
      //set button to query as the previous query is finished
      document.getElementById(buttonID).innerHTML = "Query";
      document.getElementById(buttonID).disabled = false;

      normalize(lines, totals);
      console.log([lines[0], lines[1]]);
      linedata = convertToLineData([lines[0], lines[1]]);
      console.log(linedata);
      chartObj.smoothing = 1;
      chartObj.updateXScale(
        new Date(linedata.xdomain[0], 0),
        new Date(linedata.xdomain[1], 0)
      );
      chartObj.updateYScale(linedata.ydomain[0], linedata.ydomain[1]);
      chartObj.updateLines(linedata.lines);
      lead = leadlag(linedata.lines[0].rawdata, linedata.lines[1].rawdata);
      console.log(lead);
    });
  });

  function shift(line, offset) {
    let result = [];
    console.log();
    for (let i = offset; i < line.rawdata.length; i++) {
      result.push({ x: line.rawdata[i - offset].x, y: line.rawdata[i].y });
    }
    for (let i = 0; i < offset; i++) {
      result.push({
        x: line.rawdata[i + (line.rawdata.length - offset)].x,
        y: line.rawdata[i].y
      });
    }
    return result;
  }
  function createMultiGraphs(data, graphContainer, area) {
    let height = area.y / data.length;

    for (let i = 0; i < data.length; i++) {
      graphContainer.push(new D3Chart("#multicharts", true, false));
      graphContainer[i].setHeight(height);
      graphContainer[i].setBaseHeight(height);
      graphContainer[i].smoothing = 1;
      graphContainer[i].updateXScale(
        new Date(data[i].xdomain[0], 0),
        new Date(data[i].xdomain[1], 0)
      );
      graphContainer[i].updateYScale(data[i].ydomain[0], data[i].ydomain[1]);
      graphContainer[i].updateLines(data[i].lines);
    }
  }
  function normalize(lines, totals) {
    let size = 0;
    if (lines[0].length > lines[1].length) {
      size = lines[0].length;
    } else {
      size = lines[1].length;
    }
    for (let i = 0; i < size; i++) {
      lines[0][i].count = lines[0][i].count / totals[0][i].count;
      lines[1][i].count = lines[1][i].count / totals[1][i].count;
    }
  }
  /**
   * @param  {Object[]} lines - expects [[{id:, count}],[{id:, count}]] the inner array can have any amount of elements
   * @returns {Object} - format {xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
   */
  function convertToLineData(lines) {
    result = {
      ydomain: [],
      xdomain: [],
      lines: [
        { name: "Canada", rawdata: [], data: [] },
        { name: "!Canada", rawdata: [], data: [] }
      ]
    };
    result.xdomain[0] = lines[0][0].id;
    result.xdomain[1] = lines[0][lines[0].length - 1].id;
    result.ydomain[0] = lines[0][0].count;
    result.ydomain[1] = lines[0][0].count;
    for (let j = 0; j < lines.length; j++) {
      for (let i = 0; i < lines[j].length; i++) {
        if (lines[j][i].count > result.ydomain[1]) {
          result.ydomain[1] = lines[j][i].count;
        }
        if (lines[j][i].count < result.ydomain[0]) {
          result.ydomain[0] = lines[j][i].count;
        }
        result.lines[j].rawdata[i] = {
          x: lines[j][i].id,
          y: lines[j][i].count
        };
        result.lines[j].data[i] = { x: lines[j][i].id, y: lines[j][i].count };
      }
    }
    return result;
  }

  function queryDim(minYear, maxYear, keyword) {
    let url = "/query-dimensions";
    let promises = [];
    for (let i = minYear; i <= maxYear; i++) {
      console.log(i);
      promises.push(
        d3.json(url, {
          method: "POST",
          body: JSON.stringify({
            query: `search publications in title_abstract_only for "${keyword}" where research_org_country_names!="Canada" and year=${i} return year return category_bra sort by count`
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8"
          }
        })
      );
      promises.push(
        d3.json(url, {
          method: "POST",
          body: JSON.stringify({
            query: `search publications in title_abstract_only for "${keyword}" where research_org_country_names="Canada" and year=${i} return year return category_bra sort by count`
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8"
          }
        })
      );
    }
    //totals for normalizing that year
    promises.push(
      d3.json(url, {
        method: "POST",
        body: JSON.stringify({
          query: `search publications where research_org_country_names!="Canada" and year>=${minYear} and year<=${maxYear} return year`
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      })
    );
    promises.push(
      d3.json(url, {
        method: "POST",
        body: JSON.stringify({
          query: `search publications where research_org_country_names="Canada" and year>=${minYear} and year<=${maxYear} return year`
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      })
    );

    return promises;
  }

  function aggregateQuery(values) {
    aggregatedResult = {
      canada: {
        categories: new Map(),
        keyWordTotal: [],
        total: []
      },
      notCanada: {
        categories: new Map(),
        keyWordTotal: [],
        total: []
      }
    };
    canada = false;
    //the last two elements are total queries used for normalizing
    endOfYearlyData = values.length - 2;
    for (let i = 0; i < endOfYearlyData; i++) {
      json = JSON.parse(values[i].body);
      if (canada) {
        aggregatedResult.canada.keyWordTotal.push(json.year[0]);
        for (let j = 0; j < json.category_bra.length; j++) {
          if (
            aggregatedResult.canada.categories.has(json.category_bra[j].name)
          ) {
            aggregatedResult.canada.categories
              .get(json.category_bra[j].name)
              .push({ id: json.year[0].id, count: json.category_bra[j].count });
          } else {
            aggregatedResult.canada.categories.set(
              json.category_bra[j].name,
              []
            );
            aggregatedResult.canada.categories
              .get(json.category_bra[j].name)
              .push({ id: json.year[0].id, count: json.category_bra[j].count });
          }
        }
      } else {
        aggregatedResult.notCanada.keyWordTotal.push(json.year[0]);
        for (let j = 0; j < json.category_bra.length; j++) {
          if (
            aggregatedResult.notCanada.categories.has(json.category_bra[j].name)
          ) {
            aggregatedResult.notCanada.categories
              .get(json.category_bra[j].name)
              .push({ id: json.year[0].id, count: json.category_bra[j].count });
          } else {
            aggregatedResult.notCanada.categories.set(
              json.category_bra[j].name,
              []
            );
            aggregatedResult.notCanada.categories
              .get(json.category_bra[j].name)
              .push({ id: json.year[0].id, count: json.category_bra[j].count });
          }
        }
      }
      canada = !canada;
    }
    return aggregatedResult;
  }

  /**
   * gets default view for the graphs. The data being presented has no meaning.
   * @inner
   * @param {JSON} res - format {xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
   */
  postJSON("/default-view", {}, function(res) {
    result = res;

    chartObj = new D3Chart("#ngramchart", true, false);
    if (result.xdomain) {
      var xmin = new Date(result.xdomain[0], 0);
      var xmax = new Date(result.xdomain[1], 0);
    }
    chartObj.updateXScale(xmin, xmax);
    chartObj.updateYScale(result.ydomain[0], result.ydomain[1]);

    chartObj.updateLines(result.lines);
  });
});
