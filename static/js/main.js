$(function() {
  //the chart object contains all of the d3 graphing
  document.getElementById(
    "query-field"
  ).value = `{"source":"", "keywords":"", "filters":{"country":[], "year":[]},"returns":[]}`;
  var chartObj;
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
    //
    //tmpButton.innerHTML = `<span class="spinner-grow spinner-grow-sm"></span>`;
    //tmpButton.disabled = true;
    //if (tmpButton.classList.contains("animate")) {
    //  tmpButton.classList.remove("animate");
    //}
    var query = document.getElementById(fieldID).value;

    let qObject = new QueryObject(query);

    console.log(qObject.query);
    // Promise.all(queryDim(2015, 2018, query)).then(function(values) {
    //   console.log(values);
    //   var lines = [];
    //   let totals = [];
    //   let subGraphData = [];
    //   try {
    //     let result = aggregateQuery(values);
    //     console.log(result);
    //     totals[0] = JSON.parse(values[values.length - 2].body).year;
    //     totals[1] = JSON.parse(values[values.length - 1].body).year;
    //     lines[0] = result.notCanada.keyWordTotal;
    //     lines[1] = result.canada.keyWordTotal;
    //     let keys = [...result.canada.categories.keys()];
    //     for (let i = 0; i < keys.length; i++) {
    //       normalize(
    //         [
    //           result.notCanada.categories.get(keys[i]),
    //           result.canada.categories.get(keys[i])
    //         ],
    //         lines
    //       );
    //     }
    //     for (let i = 0; i < keys.length; i++) {
    //       subGraphData.push(
    //         convertToLineData([
    //           result.canada.categories.get(keys[i]),
    //           result.notCanada.categories.get(keys[i])
    //         ])
    //       );
    //       subGraphData[i].graphName = keys[i];
    //     }
    //     console.log(subGraphData.length);
    //     for (let i = 0; i < multiCharts.length; i++) {
    //       multiCharts[i].cleanup();
    //     }
    //     multiCharts = [];
    //     createMultiGraphs(subGraphData, multiCharts, "multicharts");
    //   } catch (e) {
    //     console.log(e);
    //     //animate button to display error
    //     let tmpButton = document.getElementById(buttonID);
    //     tmpButton.innerHTML = "Query";
    //     tmpButton.disabled = false;
    //     tmpButton.classList.toggle("animate");
    //     return;
    //   }
    //   //set button to query as the previous query is finished
    //   document.getElementById(buttonID).innerHTML = "Query";
    //   document.getElementById(buttonID).disabled = false;
    //
    //   normalize(lines, totals);
    //   console.log([lines[0], lines[1]]);
    //   linedata = convertToLineData([lines[0], lines[1]]);
    //   console.log(linedata);
    //   chartObj.smoothing = 1;
    //   chartObj.updateXScale(
    //     new Date(linedata.xdomain[0], 0),
    //     new Date(linedata.xdomain[1], 0)
    //   );
    //   chartObj.updateYScale(linedata.ydomain[0], linedata.ydomain[1]);
    //   chartObj.updateLines(linedata.lines);
    //   lead = leadlag(linedata.lines[0].rawdata, linedata.lines[1].rawdata);
    //   console.log(lead);
    // });
  });

  /**
   * @param  {Array} line - [{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]
   * @param  {Number} offset - the offset to shift the raw data elements by. For example if we shift this array [1,2,3] by 1 it becomes [3,1,2]
   */
  function shift(line, offset) {
    let result = [];
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

  /**
   * @param  {Object} data - format {xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
   * @param  {Array} graphContainer - This array or list will contain the charts
   * @param  {String} containgElement - A string of the element's id that will contain the graphs
   */
  function createMultiGraphs(data, graphContainer, containingElement) {
    let containerHeight = document.getElementById(containingElement)
      .clientHeight;
    let height = containerHeight / data.length;
    let maxY = 0;
    let minY = 1;
    for (let i = 0; i < data.length; i++) {
      maxY = Math.max(data[i].ydomain[1], maxY);
      minY = Math.min(data[i].ydomain[0], minY);
    }
    for (let i = 0; i < data.length; i++) {
      if (data[i].xdomain[0] == data[i].xdomain[1]) {
        continue;
      }
      graphContainer.push(
        new D3Chart("#" + containingElement, true, data[i].graphName)
      );
      let size = graphContainer.length - 1;
      graphContainer[size].setHeight(300);
      graphContainer[size].setBaseHeight(300);
      graphContainer[size].smoothing = 1;
      graphContainer[size].updateXScale(
        new Date(data[i].xdomain[0], 0),
        new Date(data[i].xdomain[1], 0)
      );
      graphContainer[size].updateYScale(minY, maxY);
      graphContainer[size].updateLines(data[i].lines);
    }
  }

  /**
   * @param  {Array[Array]} lines - expects [[{count:}], [{count:}]] the array to be normalized
   * @param  {Array} totals - expects[{count:}]. The elements in this array are used to normalize the lines array
   */
  function normalize(lines, totals) {
    console.log(lines);
    if (lines[0] != null) {
      for (let i = 0; i < lines[0].length; i++) {
        lines[0][i].count = lines[0][i].count / totals[0][i].count;
      }
    }
    if (lines[1] != null) {
      for (let i = 0; i < lines[1].length; i++) {
        lines[1][i].count = lines[1][i].count / totals[1][i].count;
      }
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
    if (lines[0] != null) {
      result.xdomain[0] = lines[0][0].id;
      result.xdomain[1] = lines[0][lines[0].length - 1].id;
      result.ydomain[0] = lines[0][0].count;
      result.ydomain[1] = lines[0][0].count;
    } else {
      result.xdomain[0] = lines[1][0].id;
      result.xdomain[1] = lines[1][lines[1].length - 1].id;
      result.ydomain[0] = lines[1][0].count;
      result.ydomain[1] = lines[1][0].count;
    }
    if (lines[0] != null) {
      for (let i = 0; i < lines[0].length; i++) {
        if (lines[0][i].count > result.ydomain[1]) {
          result.ydomain[1] = lines[0][i].count;
        }
        if (lines[0][i].count < result.ydomain[0]) {
          result.ydomain[0] = lines[0][i].count;
        }
        result.lines[0].rawdata[i] = {
          x: lines[0][i].id,
          y: lines[0][i].count
        };
        result.lines[0].data[i] = { x: lines[0][i].id, y: lines[0][i].count };
      }
    }
    if (lines[1] != null) {
      for (let i = 0; i < lines[1].length; i++) {
        if (lines[1][i].count > result.ydomain[1]) {
          result.ydomain[1] = lines[1][i].count;
        }
        if (lines[1][i].count < result.ydomain[0]) {
          result.ydomain[0] = lines[1][i].count;
        }
        result.lines[1].rawdata[i] = {
          x: lines[1][i].id,
          y: lines[1][i].count
        };
        result.lines[1].data[i] = { x: lines[1][i].id, y: lines[1][i].count };
      }
    }
    return result;
  }
  /**
   * @param  {Number} minYear - the starting year to query (inclusive)
   * @param  {Number} maxYear - the maximum year to query (inclusive)
   * @param  {string} keyword - the keyword to search for
   * @returns {Array[Promise]}  returns array of promises
   */
  function queryDim(minYear, maxYear, keyword) {
    let url = "/query-dimensions";
    let promises = [];
    for (let i = minYear; i <= maxYear; i++) {
      console.log(i);
      promises.push(
        d3.json(url, {
          method: "POST",
          body: JSON.stringify({
            query: `search publications in title_abstract_only for "${keyword}" where research_org_country_names!="Canada" and year=${i} return year return category_for sort by count`
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
            query: `search publications in title_abstract_only for "${keyword}" where research_org_country_names="Canada" and year=${i} return year return category_for sort by count`
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
  /**
   * @param  {Array[Reponse]} values - an array of response objects
   * @returns {Object} format { canada: {categories: new Map(), keyWordTotal: [], total: []}, notCanada: {categories: new Map(), keyWordTotal: [], total: []}}
   */
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
        for (let j = 0; j < json.category_for.length; j++) {
          if (
            aggregatedResult.canada.categories.has(json.category_for[j].name)
          ) {
            aggregatedResult.canada.categories
              .get(json.category_for[j].name)
              .push({ id: json.year[0].id, count: json.category_for[j].count });
          } else {
            aggregatedResult.canada.categories.set(
              json.category_for[j].name,
              []
            );
            aggregatedResult.canada.categories
              .get(json.category_for[j].name)
              .push({ id: json.year[0].id, count: json.category_for[j].count });
          }
        }
      } else {
        aggregatedResult.notCanada.keyWordTotal.push(json.year[0]);
        for (let j = 0; j < json.category_for.length; j++) {
          if (
            aggregatedResult.notCanada.categories.has(json.category_for[j].name)
          ) {
            aggregatedResult.notCanada.categories
              .get(json.category_for[j].name)
              .push({ id: json.year[0].id, count: json.category_for[j].count });
          } else {
            aggregatedResult.notCanada.categories.set(
              json.category_for[j].name,
              []
            );
            aggregatedResult.notCanada.categories
              .get(json.category_for[j].name)
              .push({ id: json.year[0].id, count: json.category_for[j].count });
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

    chartObj = new D3Chart("#ngramchart", true, "Total");
    if (result.xdomain) {
      var xmin = new Date(result.xdomain[0], 0);
      var xmax = new Date(result.xdomain[1], 0);
    }
    chartObj.updateXScale(xmin, xmax);
    chartObj.updateYScale(result.ydomain[0], result.ydomain[1]);

    chartObj.updateLines(result.lines);
  });
});
