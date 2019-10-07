class ChartView {
  //contains the DOM objects. Each element can have N graphs
  viewList = {};
  //D3Charts
  charts = {};
  //minimum size for the main viewport
  minViewSize = { x: null, y: null };

  parent;
  /**
   * @param  {string} Parent - element id that will contain all of the views
   */
  constructor(parent) {
    try {
      this.parent = document.getElementById(parent);
    } catch (e) {
      throw new Error(`Parent ${parent} does not exist in DOM`);
    }
  }

  /**
   * @param  {string} view - DOM element ID that will contain the graphs. Example: <div id='myCharts'></div> | view='myCharts';
   * @param  {Response} data - The reponse data from the query. It can already be in the D3Chart format: {xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
   * @param  {function(data)} formatFunction=null - function to format data to the correct D3Chart format: {chartName:'', xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
   */
  addChart(view, data, formatFunction = null) {
    if (formatFunction != null) {
      formatFunction(data);
    }

    if (!(view in this.viewList)) {
      try {
        this.addView(view);
      } catch (e) {
        console.error(e);
        return;
      }
    }
    const elementId = view + "-" + data.chartName;
    let div = document.createElement("div");
    div.setAttribute("id", `${elementId}`);
    div.setAttribute("class", "chart");
    this.viewList[view].appendChild(div);

    this.charts[view][data.chartName] = { data: null, chart: null };
    this.charts[view][data.chartName].chart = new D3Chart(
      "#" + elementId,
      true,
      data.chartName
    );
    this.charts[view][data.chartName]["data"] = data;
    this.getChart(view, data.chartName).updateXScale(
      new Date(data.xdomain[0], 0),
      new Date(data.xdomain[1], 0)
    );
    this.getChart(view, data.chartName).updateYScale(
      data.ydomain[0],
      data.ydomain[1]
    );
    this.getChart(view, data.chartName).updateLines(data.lines);
    this.scaleCharts();
  }
  getChart(view, chartName) {
    return this.charts[view][chartName]["chart"];
  }
  /**
   * @param  {string} view - DOM element ID that will contain the graphs. Example: <div id='myCharts'></div> | view='myCharts';
   */
  addView(view) {
    let check = document.getElementById(view);
    if (check != null) {
      if (!(view in this.viewList)) {
        this.viewList[view] = check;
      }
    } else {
      this.viewList[view] = document.createElement("div");
      this.viewList[view].setAttribute("id", `${view}`);
      this.viewList[view].setAttribute("class", "multi-container");
      this.parent.prepend(this.viewList[view]);
      this.charts[view] = {};
      this.scaleViews();
      this.scaleCharts();
    }
  }
  scaleViews() {
    let childNodes = this.parent.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      childNodes[i].style.width = 100 / childNodes.length + "%";
    }
  }

  scaleCharts() {
    for (let key in this.charts) {
      let numOfChartsInView = Object.keys(this.charts[key]).length;
      let size = Math.min(
        this.viewList[key].offsetHeight / numOfChartsInView,
        this.viewList[key].offsetWidth / numOfChartsInView
      );
      for (let chart in this.charts[key]) {
        this.charts[key][chart].chart.uniformSize(size);
      }
    }
  }
  /**
   * @param  {{x:Number, y:Number}} size - minimum size for main viewport
   */
  setMainViewSize(size) {}
}
