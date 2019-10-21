class ChartView {
  //contains the DOM objects. Each element can have N graphs
  viewList = {};
  //D3Charts
  charts = {};
  mainView = {
    element_id: null,
    minViewSize: { x: null, y: null }
  };

  shiftData = {};
  contributingGraphs = [];
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
    //skip if there is only one data point
    if (data.xdomain[0] == data.xdomain[1]) {
      return;
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
    this.charts[view][elementId].chart.getGraphOnShiftClick(
      this.shiftAggregate.bind(this)
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

    this.charts[view][elementId].data = {
      xdomain: [new Date(data.xdomain[0], 0), new Date(data.xdomain[1], 0)],
      ydomain: [data.ydomain[0], data.ydomain[1]],
      lines: data.lines
    };
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
      let numOfChartsInView = Object.keys(this.charts[key]).length;
      let numOfSubDivisions = Math.ceil(Math.sqrt(numOfChartsInView));

      let width = this.viewList[key].clientWidth / numOfSubDivisions;
      let height = this.viewList[key].clientHeight / numOfSubDivisions;

      for (let chart in this.charts[key]) {
        this.charts[key][chart].chart.setBaseWidth(width);
        this.charts[key][chart].chart.setBaseHeight(height);
      }
      let children = $("#" + key).children();
      for (let i = 0; i < children.length; i++) {
        $("#" + children[i].id)
          .width(width)
          .height(height);
      }
      this.setDivPositions(
        { width: width, height: height },
        children,
        numOfSubDivisions
      );
    }
  }
  /**
   * @param  {Element} parentContainer - parent container that contains the divs
   * @param  {Number} size - uniform size generally Math.min(parent.width/ numOfSiblings, parent.height/numOfSiblings);
   * @param  {Element[]} divs - divs to set position relative to siblings and parent area
   */
  setDivPositions(size, divs, subDivisions) {
    let counter = divs.length;

    for (let i = 0; i < subDivisions; i++) {
      for (let j = 0; j < subDivisions; j++) {
        if (counter > 0) {
          divs[counter - 1].style.left = size.width * i;
          divs[counter - 1].style.top = size.height * j;
          --counter;
        } else {
          return;
        }
      }
    }
  }
  normalizeChartAxiiByView() {
    for (let key in this.charts) {
      let yAxis = { min: null, max: null };
      let xAxis = { min: null, max: null };
      let keys = Object.keys(this.charts[key]);
      yAxis.min = this.charts[key][keys[0]].chart.Y.domain[0];
      yAxis.max = this.charts[key][keys[0]].chart.Y.domain[1];
      for (let chart in this.charts[key]) {
        yAxis.min = Math.min(
          yAxis.min,
          this.charts[key][chart].chart.Y.domain[0]
        );
        yAxis.max = Math.max(
          yAxis.max,
          this.charts[key][chart].chart.Y.domain[1]
        );
        xAxis.min = Math.min(
          xAxis.min,
          this.charts[key][chart].chart.X.domain[0]
        );
        xAxis.max = Math.max(
          xAxis.max,
          this.charts[key][chart].chart.X.domain[1]
        );
      }
      for (let chart in this.charts[key]) {
        this.charts[key][chart].chart.toggleAxis([yAxis.min, yAxis.max]);
        this.charts[key][chart].chart.updateLines();
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

  clear() {
    for (let key in this.charts) {
      for (let chart in this.charts[key]) {
        this.charts[key][chart].chart.cleanup();
      }
    }
    this.charts = {};
    for (let i = 0; i < this.parent.children.length; i++) {
      this.parent.removeChild(this.parent.children[i]);
    }
    this.viewList = {};
    this.mainView = {
      element_id: null,
      minViewSize: { x: null, y: null }
    };
  }
  leadLag() {
    for (let key in this.charts) {
      for (let chart in this.charts[key]) {
        this.charts[key][chart].chart.leadLag();
      }
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

      //shake the move graphs
      let list = document.getElementById(node_id).classList;
      for (let className in list) {
        if (className == "shake") {
          document.getElementById(node_id).classList.remove("shake");
        }
      }
      document.getElementById(node_id).classList.add("shake");

      list = document.getElementById(this.mainView.element_id).classList;
      for (let className in list) {
        if (className == "shake") {
          document
            .getElementById(this.mainView.element_id)
            .classList.remove("shake");
        }
      }
      document.getElementById(this.mainView.element_id).classList.add("shake");

      console.log(this.charts);
    }
  }

  shiftAggregate(graphInfo) {
    if (graphInfo.parent.node().parentNode.id == this.mainView.element_id) {
      let key = Object.keys(this.charts[this.mainView.element_id]);
      this.charts[this.mainView.element_id][key].chart.updateLines([
        ...this.charts[this.mainView.element_id][key].data.lines
      ]);
      for (let i = 0; i < this.contributingGraphs.length; i++) {
        $(this.contributingGraphs[i]).css("border-width", "0px");
      }
      this.contributingGraphs = [];
      this.shiftData = {};
      return;
    }
    let modify = (currentVal, otherValue) => {
      return currentVal + otherValue;
    };
    if ($("#" + graphInfo.parent.node().id).css("border-width") != "0px") {
      modify = (currentVal, otherValue) => {
        return currentVal - otherValue;
      };
      let index = this.contributingGraphs.indexOf(
        "#" + graphInfo.parent.node().id
      );
      $("#" + graphInfo.parent.node().id).css("border-width", "0px");
      if (index > -1) {
        this.contributingGraphs.splice(index, 1);
      }
      if (this.contributingGraphs.length == 0) {
        let key = Object.keys(this.charts[this.mainView.element_id]);
        this.charts[this.mainView.element_id][key].chart.updateLines([
          ...this.charts[this.mainView.element_id][key].data.lines
        ]);
        this.shiftData = {};
        return;
      }
    } else {
      $("#" + graphInfo.parent.node().id).css("border", "2px solid red");
      this.contributingGraphs.push("#" + graphInfo.parent.node().id);
    }

    for (let i = 0; i < graphInfo.data.length; i++) {
      if (!(graphInfo.data[i].name in this.shiftData)) {
        this.shiftData[graphInfo.data[i].name] = new Map();
        console.log(this.shiftData);
      }
      for (let j = 0; j < graphInfo.data[i].rawdata.length; j++) {
        if (
          this.shiftData[graphInfo.data[i].name].has(
            graphInfo.data[i].rawdata[j].x
          )
        ) {
          let currentVal = this.shiftData[graphInfo.data[i].name].get(
            graphInfo.data[i].rawdata[j].x
          );
          currentVal = modify(currentVal, graphInfo.data[i].rawdata[j].y);
          this.shiftData[graphInfo.data[i].name].set(
            graphInfo.data[i].rawdata[j].x,
            currentVal
          );
        } else {
          this.shiftData[graphInfo.data[i].name].set(
            graphInfo.data[i].rawdata[j].x,
            graphInfo.data[i].rawdata[j].y
          );
        }
      }
    }
    let key = Object.keys(this.charts[this.mainView.element_id]);
    let aggregateData = [];
    const checkA = name => {
      if (name.includes("a_")) {
        return name;
      }
      return "a_" + name;
    };
    for (let name in this.shiftData) {
      let temp = { name: checkA(name), rawdata: [], data: [] };
      let keys = [...this.shiftData[name].keys()];
      for (let i = 0; i < keys.length; i++) {
        temp.rawdata.push({
          x: keys[i],
          y: this.shiftData[name].get(keys[i])
        });
        temp.data.push({
          x: keys[i],
          y: this.shiftData[name].get(keys[i])
        });
      }
      aggregateData.push(temp);
    }
    this.charts[this.mainView.element_id][key].chart.updateLines([
      ...this.charts[this.mainView.element_id][key].data.lines,
      ...aggregateData
    ]);
  }
}
