$(function () {
  //the chart object contains all of the d3 graphing
  document.getElementById(
    "query-field"
  ).value = `{"source":"publications", "keywords":"cancer", "filters":{"country":["Canada", "!Canada"], "year":["2017","2018"]},"returns":["year","category_for"]}+{"source":"grants"}`;
  let viewManager = new ChartView("graph-container");
  viewManager.addView("main-view");
  $("#leadLagToggle").change(function (event) {
    viewManager.leadLag();
  });

  $("#normalize-scale").change((event) => {
    viewManager.normalizeChartAxiiByView();
  });
  $("#newsearch").submit(function (event) {
    let buttonID = "query-search";
    let fieldID = "query-field";
    event.stopPropagation();
    event.preventDefault();
    let tmpButton = document.getElementById(buttonID);

    tmpButton.innerHTML = `<span class="spinner-grow spinner-grow-sm"></span>`;
    tmpButton.disabled = true;
    if (tmpButton.classList.contains("shake")) {
      tmpButton.classList.remove("shake");
    }
    try {
      viewManager.clear();
      var query = document.getElementById(fieldID).value;

      let qObject = new QueryObject(query);
      qObject.callbackWhenFinished((data) => {
        for (let chart in data) {
          viewManager.addChart(data[chart].viewName, data[chart]);
        }
        viewManager.setMainView("year");
        tmpButton.disabled = false;
        tmpButton.innerHTML = "Query";
        if ("FOR" in viewManager.viewList) {
          for (let chart in viewManager.charts["FOR"]) {
            for (let catChart in viewManager.charts["category_for"]) {
              if (
                viewManager.charts["FOR"][chart].chart.legend.titleText ==
                viewManager.charts["category_for"][catChart].chart.legend
                  .titleText
              ) {
                viewManager.charts["category_for"][catChart].chart.addBars(
                  viewManager.charts["FOR"][chart].chart.data,
                  viewManager.charts["FOR"][chart].chart.Y.scale
                );
              }
            }
          }
        }
      });
      qObject.analyzeQuery();
    } catch (e) {
      tmpButton.classList.add("shake");
    }
  });

  /**
   * gets default view for the graphs. The data being presented has no meaning.
   * @inner
   * @param {JSON} res - format {xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
   */
  postJSON("/default-view", {}, function (res) {
    result = res;
    viewManager.addChart("main-view", result, (data) => {
      data.chartName = "total";
    });
    viewManager.getChart("main-view", "main-view-total").addBars([
      {
        rawdata: [
          { x: 2003, y: 0.00025 },
          { x: 2004, y: 0.00035 },
        ],
      },
      {
        rawdata: [
          { x: 2003, y: 0.0002 },
          { x: 2004, y: 0.0003 },
        ],
      },
    ]);
    viewManager.setMainView("main-view");
    viewManager.getChart("main-view", "main-view-total").curtainAnimation();
  });
});
