class Chart {
  attributes = {
    width: null,
    height: null,
    aspect: null
  };
  constructor(parent, width = null, height = null) {
    try {
      this.attributes.width = document.getElementById(parent.offsetWidth);
      this.attributes.height = document.getElementById(parent.offsetHeight);
    } catch (e) {
      throw Error("Error parent does not exists");
    }
    if (width != null) {
      this.attributes.width = width;
    }
    if (height != null) {
      this.attributes.height = height;
    }
    this.attributes.aspect = this.attributes.width / this.attributes.height;

    d3.select("#" + parent)
      .append("svg")
      .attr("width", width)
      .attr("height", height);
  }
}
