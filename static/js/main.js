$(function() {
  //the chart object contains all of the d3 graphing
  var chartObj;
  //the lead chart contains all of the d3 graphing
  var leadChart;
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

    Promise.all([
      d3.json(url, {
        method: "POST",
        body: JSON.stringify({
          query: `search publications where research_org_country_names!="Canada" return year`
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      }),
      d3.json(url, {
        method: "POST",
        body: JSON.stringify({
          query: `search publications where research_org_country_names="Canada" return year`
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      }),
      d3.json(url, {
        method: "POST",
        body: JSON.stringify({
          query: `search publications for "${query}" where research_org_country_names!="Canada" return year`
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      }),
      d3.json(url, {
        method: "POST",
        body: JSON.stringify({
          query: `search publications for "${query}" where research_org_country_names="Canada" return year`
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      })
    ]).then(function(values) {
      console.log(values);
      var lines = [];
      try {
        lines[0] = Object.values(JSON.parse(values[3].body).year);
        lines[1] = Object.values(JSON.parse(values[2].body).year);
        lines[2] = Object.values(JSON.parse(values[1].body).year);
        lines[3] = Object.values(JSON.parse(values[0].body).year);
      } catch (e) {
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
      //sort the return data
      for (let i = 0; i < lines.length; i++) {
        lines[i].sort(function(first, second) {
          return first.id - second.id;
        });
      }
      normalize(lines);
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
      let yearlead =
        leadlag(linedata.lines[0].rawdata, linedata.lines[1].rawdata) + 1;
      console.log(yearlead);
    });
    //postJSON("/query-dimensions", { query: query }, function(result) {
    //  var lines = [];
    //  try {
    //    lines[0] = Object.values(JSON.parse(result.body).year);
    //  } catch (e) {
    //    //animate button to display error
    //    let tmpButton = document.getElementById(buttonID);
    //    tmpButton.innerHTML = "Query";
    //    tmpButton.disabled = false;
    //    tmpButton.classList.toggle("animate");
    //    return;
    //  }
    //  //replace the geotag to everything but Canada
    //  query = query.replace(`="Canada" `, `!="Canada" `);
    //  console.log(query);
    //  //second query with !Canada
    //  postJSON("/query-dimensions", { query: query }, function(result) {
    //    //set button to query as the previous query is finished
    //    document.getElementById(buttonID).innerHTML = "Query";
    //    document.getElementById(buttonID).disabled = false;
    //    lines[1] = Object.values(JSON.parse(result.body).year);
    //    lines[0].sort(function(first, second) {
    //      return first.id - second.id;
    //    });
    //    lines[1].sort(function(first, second) {
    //      return first.id - second.id;
    //    });
    //    normalize(lines);
    //    linedata = convertToLineData(lines);
    //    chartObj.smoothing = 1;
    //    chartObj.updateXScale(
    //      new Date(linedata.xdomain[0], 0),
    //      new Date(linedata.xdomain[1], 0)
    //    );
    //    chartObj.updateYScale(linedata.ydomain[0], linedata.ydomain[1]);
    //    chartObj.updateLines(linedata.lines);
    //    let yearlead =
    //      leadlag(linedata.lines[0].rawdata, linedata.lines[1].rawdata) + 1;
    //    console.log(yearlead);
    //  });
    //});
  });

  function normalize(lines) {
    let size = 0;
    if (lines[0].length > lines[1].length) {
      size = lines[0].length;
    } else {
      size = lines[1].length;
    }
    for (let i = 0; i < size; i++) {
      lines[0][i].count = lines[0][i].count / lines[2][i].count;
      lines[1][i].count = lines[1][i].count / lines[3][i].count;
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

  /**
   * gets default view for the graphs. The data being presented has no meaning.
   * @inner
   * @param {JSON} res - format {xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
   */
  postJSON("/default-view", {}, function(res) {
    result = res;

    chartObj = new D3Chart("#ngramchart", true);
    if (result.xdomain) {
      var xmin = new Date(result.xdomain[0], 0);
      var xmax = new Date(result.xdomain[1], 0);
    }
    chartObj.updateXScale(xmin, xmax);
    chartObj.updateYScale(result.ydomain[0], result.ydomain[1]);

    chartObj.updateLines(result.lines);
    //
    let yearlead =
      leadlag(result.lines[0].rawdata, result.lines[1].rawdata) + 1; // always seems to be 1 off.
    console.log(yearlead);
    leadChart = new D3Chart("#leadlag", true);
    leadChart.updateXScale(xmin, xmax);
    leadChart.updateYScale(-0.0005, 0.0005);
    leadChart.updateLines(result.lines);
  });
});
