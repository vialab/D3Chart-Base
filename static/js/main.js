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
    postJSON("/query-dimensions", { query: query }, function(result) {
      var lines = [];
      try {
        lines[0] = Object.values(JSON.parse(result.body).year);
      } catch (e) {
        //animate button to display error
        let tmpButton = document.getElementById(buttonID);
        tmpButton.innerHTML = "Query";
        tmpButton.disabled = false;
        tmpButton.classList.toggle("animate");
        return;
      }
      //replace the geotag to everything but Canada
      query = query.replace(`~"Canada" `, `!="Canada" `);
      console.log(query);
      //second query with !Canada
      postJSON("/query-dimensions", { query: query }, function(result) {
        //set button to query as the previous query is finished
        document.getElementById(buttonID).innerHTML = "Query";
        document.getElementById(buttonID).disabled = false;
        lines[1] = Object.values(JSON.parse(result.body).year);
        lines[0].sort(function(first, second) {
          return first.id - second.id;
        });
        lines[1].sort(function(first, second) {
          return first.id - second.id;
        });
        linedata = convertToLineData(lines);
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
    });
  });

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
