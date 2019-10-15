class ChartView {
  //contains the DOM objects. Each element can have N graphs
  viewList = {};
  //D3Charts
  charts = {};
  mainView = {
    element_id: null,
    minViewSize: { x: null, y: null }
  };

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
    let id = data.chartName.replace(/^[^a-z]+|[^\w:.-]+/gi, "");
    id = id.replace(".", "");
    const elementId = view + "-" + id;
    console.log(elementId);
    let div = document.createElement("div");
    div.setAttribute("id", `${elementId}`);
    div.setAttribute("class", "chart");
    const width = this.parent.offsetWidth;
    const height = this.parent.offsetHeight;
    let uniformSize = Math.min(width, height);
    this.viewList[view].appendChild(div);

    this.charts[view][elementId] = { data: null, chart: null };
    this.charts[view][elementId].chart = new D3Chart(
      "#" + elementId,
      true,
      data.chartName,
      { x: uniformSize, y: uniformSize }
    );
    this.charts[view][elementId].chart.getParentOnClick(
      this.chartClicked.bind(this)
    );
    this.charts[view][elementId]["data"] = data;
    this.getChart(view, elementId).updateXScale(
      new Date(data.xdomain[0], 0),
      new Date(data.xdomain[1], 0)
    );
    this.getChart(view, elementId).updateYScale(
      data.ydomain[0],
      data.ydomain[1]
    );
    this.getChart(view, elementId).updateLines(data.lines);
    this.scaleCharts(this.parent.children);
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
      this.viewList[view].setAttribute("itemscale", 1.0);
      this.parent.appendChild(this.viewList[view]);
      this.charts[view] = {};
      this.scaleViews(this.parent.children);
      this.scaleCharts(this.parent.children);
    }
  }
  /**
   * @param  {Element[]} views
   */
  scaleViews(views) {
    for (let i = 0; i < views.length; i++) {
      views[i].style.width = 100 / views.length + "%";
    }
  }

  scaleCharts(views) {
    for (let i = 0; i < views.length; i++) {
      let key = views[i].id;
      console.log("key: " + key);
      let numOfChartsInView = Object.keys(this.charts[key]).length;
      let itemScale = this.viewList[key].getAttribute("itemscale");
      let size = Math.floor(
        Math.min(
          this.viewList[key].clientHeight * itemScale,
          this.viewList[key].clientWidth * itemScale
        )
      );

      if (
        numOfChartsInView >
        this.viewList[key].clientHeight / size +
          this.viewList[key].clientWidth / size
      ) {
        this.viewList[key].setAttribute("itemscale", itemScale * 0.5);
        this.scaleCharts(views);
        return;
      }
      for (let chart in this.charts[key]) {
        this.charts[key][chart].chart.setBaseWidth(size);
        this.charts[key][chart].chart.setBaseHeight(size);
      }
      let children = document.getElementById(key).children;
      for (let i = 0; i < children.length; i++) {
        children[i].style.width = size;
        children[i].style.height = size;
      }
      this.setDivPositions(document.getElementById(key), size, children);
    }
  }
  /**
   * @param  {Element} parentContainer - parent container that contains the divs
   * @param  {Number} size - uniform size generally Math.min(parent.width/ numOfSiblings, parent.height/numOfSiblings);
   * @param  {Element[]} divs - divs to set position relative to siblings and parent area
   */
  setDivPositions(parentContainer, size, divs) {
    const width = parentContainer.clientWidth;
    const height = parentContainer.clientHeight;
    const numCol = Math.floor(width / size);
    const numRow = Math.floor(height / size);
    let counter = divs.length;

    for (let i = 0; i < numCol; i++) {
      for (let j = 0; j < numRow; j++) {
        if (counter > 0) {
          divs[counter - 1].style.left = size * i;
          divs[counter - 1].style.top = size * j;
          --counter;
        } else {
          return;
        }
      }
    }
  }
  /**
   * @param  {String} element_id - element id that will contain the main view. The main view is the only view that will not scale infinitely
   */
  setMainView(element_id) {
    if (document.getElementById(element_id) != null) {
      this.mainView.element_id = element_id;
    } else {
      throw new Error("Element id does not exist in DOM.");
    }
  }

  /**
   * @param  {{x:Number, y:Number}} size - minimum size for main viewport
   */
  setMainViewSize(size) {
    if (!size.hasOwnProperty("x") || !size.hasOwnProperty("y")) {
      this.mainView.minViewSize.x = size.x;
      this.mainView.minViewSize.y = size.y;
    } else {
      throw new Error(
        `${size} does not contain the required properties: x, y.`
      );
    }
  }

  chartClicked(e) {
    const parent_id = e.node().parentNode.id;
    //compounded ids
    const node_id = e.node().id;
    if (parent_id != this.mainView.element_id) {
      //move node to main view
      this.viewList[parent_id].removeChild(e.node());
      this.viewList[this.mainView.element_id].appendChild(e.node());

      //$("#" + e.node().id).find('svg').animate({ height: "-=100px", width: "-=100px" });
      //move main view node to view the above node came from
      let tempNode = this.viewList[this.mainView.element_id].children[0];
      this.viewList[this.mainView.element_id].removeChild(tempNode);
      this.viewList[parent_id].appendChild(tempNode);
      //update charts;
      let mainKey = Object.keys(this.charts[this.mainView.element_id]);
      let tempMainChart = this.charts[this.mainView.element_id][mainKey];
      delete this.charts[this.mainView.element_id][mainKey];

      let tempSubChart = this.charts[parent_id][node_id];
      delete this.charts[parent_id][node_id];

      this.charts[this.mainView.element_id][node_id] = tempSubChart;
      this.charts[parent_id][mainKey] = tempMainChart;

      this.scaleCharts([
        this.viewList[this.mainView.element_id],
        this.viewList[parent_id]
      ]);
      //$(this.parent.id)
      //  .hide()
      //  .show(0);
      //$("#" + e.node().id)
      //  .children("svg")
      //  .animate({ width: "+=20px", height: "+=20px" }, "fast")
      //  .animate({ width: "-=20px", height: "-=20px" }, "fast");
      //
      //$("#" + tempNode.id)
      //  .children("svg")
      //  .animate({ width: "+=20px", height: "+=20px" }, "fast")
      //  .animate({ width: "-=20px", height: "-=20px" }, "fast");
      console.log(this.charts);
    }
  }
}
