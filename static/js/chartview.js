class ChartView {
  //contains the DOM objects. Each element can have N graphs
  viewList = {};
  //D3Charts
  charts = {};

  constructor() {}

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

    this.charts[view].push(new D3Chart("#" + view, true, data.chartName));
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
      throw new Error(`Element with ID of ${view} does not exist`);
    }
  }
}
