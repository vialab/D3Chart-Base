class QueryObject {
  callback = data => {};
  intervals = 1;
  rawQuery;

  ifsubQuery = false;
  subQueries = null;
  query = {
    source: "",
    index: null,
    keyword: "",
    country: [],
    years: [],
    range: "",
    returns: [],
    sort: "",
    aggregate: ""
  };
  responseList = {
    category_for: { x: "year", y: "count", format: this.category_for },
    year: {
      x: "id",
      y: "count",
      format: this.year
    },
    FOR: { x: "year", y: "funding", format: this.FOR }
  };

  reference = {
    sources: {
      publications: "publications",
      grants: "grants",
      patents: "patents"
    },

    indices: {
      publications: {
        title_only: "title_only",
        title_abstract_only: "title_abstract_only",
        full_data_exact: "full_data_exact",
        full_data: "full_data",
        concepts: "concepts",
        authors: "authors"
      },
      grants: {
        title_only: "title_only",
        title_abstract_only: "title_abstract_only",
        investigators: "investigators",
        full_data: "full_data",
        concepts: "concepts"
      },
      patents: {
        title_only: "title_only",
        title_abstract_only: "title_abstract_only",
        inventors: "inventors",
        full_data: "full_data"
      }
    },

    returns: {
      year: "year",
      category_for: "category_for",
      funding: "FOR"
    }
  };
  responses = [];
  responseQuery = [];
  route = "/query-dimensions";
  currentYear;
  currentCountry;
  constructor(query) {
    this.rawQuery = query;
  }

  analyzeQuery() {
    let queries = this.rawQuery.split("+");

    let jsonQuery = JSON.parse(queries[0]);
    if (queries.length > 1) {
      this.subQueries = JSON.parse(queries[1]);
      this.ifsubQuery = true;
    }
    console.log(jsonQuery);
    //source
    if ("source" in jsonQuery) {
      if (jsonQuery.source in this.reference.sources) {
        this.query.source = jsonQuery.source;
      } else {
        throw new Error(
          `Invalid Source ${jsonQuery.source}. Examples: ${JSON.stringify(
            this.reference.sources
          )}`
        );
      }
    } else {
      throw new Error(
        `Requires source. Example sources: ${JSON.stringify(
          this.reference.sources
        )}`
      );
    }
    //indices
    if ("indices" in jsonQuery) {
      console.log("indices");
      for (let index in jsonQuery.indices) {
        if (!(index in this.reference.indices[this.query.source])) {
          throw new Error(
            `Invalid index ${jsonQuery.indices[index]} for source ${
              this.query.source
            } examples: ${JSON.stringify(
              this.reference.indices[this.query.source]
            )}`
          );
        }
      }
      this.query.index = jsonQuery.indices;
    }
    //keywords
    if ("keywords" in jsonQuery) {
      this.query.keyword = jsonQuery.keywords;
    }
    if ("filters" in jsonQuery) {
      //filter
      let filter;
      try {
        console.log(jsonQuery.filters);
        filter = jsonQuery.filters;
        if ("country" in filter) {
          this.query.country = filter.country;
        }
        if ("year" in filter) {
          this.query.years = filter.year;
          if (this.query.years.length < 2) {
            throw new Error(`invalid number of years for query minimum of two`);
          }
          if (this.query.years.length > 2) {
            this.query.range = false;
          } else {
            this.query.range = true;
          }
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
    //returns
    if ("returns" in jsonQuery) {
      for (let returnElement in jsonQuery.returns) {
        if (!(jsonQuery.returns[returnElement] in this.reference.returns)) {
          throw new Error(
            `Error return element ${jsonQuery.returns[returnElement]}`
          );
        }
      }
      this.query.returns = jsonQuery.returns;
    } else {
      throw new Error("Invalid query must have return values");
    }
    this.currentYear = this.query.years[0];
    this.currentCountry = 0;
    if (this.query.years.length == 0) {
      this.currentYear = null;
    }
    if (this.query.country.length == 0) {
      this.currentCountry = null;
    }
    console.log(this.currentCountry);
    console.log(this.buildQuery(this.currentYear, this.currentCountry));
    this.queryDim(this.currentYear, this.currentCountry);
  }

  calculateQueryTime() {
    const YEAR_LIMIT_SINGLE_QUERY = 20;
    //https://javascript.info/recursion
    const RECURSION_LIMIT = 10000;
    let numOfCountries = this.query.country.length;
    let numOfYears = 0;
    let countryTotalQueries = 0;

    if (this.query.range) {
      numOfYears = this.query.range[1] - this.query.range[0];
      countryTotalQueries =
        Math.floor(numOfYears / YEAR_LIMIT_SINGLE_QUERY) + 1;
    } else {
      numOfYears = this.query.range.length;
      countryTotalQueries = numOfYears;
    }

    let totalNumberQueries = numOfCountries * numOfYears + countryTotalQueries;
    if (totalNumberQueries >= RECURSION_LIMIT) {
      throw new Error("Query is to large");
    }
    return totalNumberQueries * this.intervals;
  }

  buildQuery(years, countries) {
    return `search ${
      this.query.source
    } ${this.ifIndex()}${this.ifKeyWord()} ${this.ifCountry(
      countries
    )}${this.ifYears(
      years
    )} ${this.ifFor()}${this.getReturns()}${this.ifAggregate()}`;
  }
  queryDim(years, countries) {
    console.log(years + " " + countries);
    this.responses.push({
      request: {
        year: years,
        country: this.query.country[countries],
        return: this.query.returns
      },
      response: {}
    });
    console.log(this.responses);
    d3.json(this.route, {
      method: "POST",
      body: JSON.stringify({ query: this.buildQuery(years, countries) }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    }).then(this.response.bind(this));
  }

  subQuery(subquery) {
    if ((subquery.source = "grants")) {
      this.query.source = subquery.source;
      this.query.returns = ["FOR"];
    }
    this.reponseQuery = this.responses;
    this.responses = [];
    this.currentYear = this.query.years[0];
    this.currentCountry = 0;
    if (this.query.years.length == 0) {
      this.currentYear = null;
    }
    if (this.query.country.length == 0) {
      this.currentCountry = null;
    }
    this.queryDim(this.currentYear, this.currentCountry);
  }
  response(resp, err) {
    if (err != null) {
      console.error(err);
      return;
    }
    let response = JSON.parse(resp.body);
    if ("errors" in response) {
      console.error(response.errors);
      return;
    }
    delete response._stats;
    delete response._warnings;
    const endElement = this.responses.length - 1;
    this.responses[endElement].response = response;
    console.log(resp);
    if (this.currentYear < this.query.years[1]) {
      this.currentYear++;
      this.queryDim(this.currentYear, this.currentCountry);
    } else {
      if (this.currentCountry < this.query.country.length - 1) {
        this.currentCountry++;
        this.currentYear = this.query.years[0];
        this.queryDim(this.currentYear, this.currentCountry);
      } else {
        this.finished();
      }
    }
  }

  callbackWhenFinished(callback) {
    this.callback = callback;
  }
  finished() {
    console.log(this.responses);
    this.callback(
      this.createChartData(this.aggregate(this.responses, this.query))
    );
    if (this.ifsubQuery) {
      this.ifsubQuery = false;
      this.subQuery(this.subQueries);
    }
  }
  ifAggregate() {
    if (this.query.source == "publications") {
      return "sort by count";
    }
    if (this.query.source == "grants") {
      return "aggregate funding";
    }
  }
  getReturns() {
    let result = "";
    for (let i = 0; i < this.query.returns.length; i++) {
      result += "return " + this.query.returns[i] + " ";
    }
    return `${result}`;
  }
  ifFor(years, country) {
    if (this.query.source == "grants") {
      for (let i = 0; i < this.responseQuery.length; i++) {
        if (
          this.responseQuery[i].request.year == years &&
          this.responseQuery[i].request.country == country
        ) {
          let result = `(`;
          for (
            let j = 0;
            j < this.reponses[i].responseQuery.category_for.length;
            j++
          ) {
            result += `FOR.name=${this.responseQuery[i].response.category_for[j]} or `;
          }
          result += ") ";
          return result;
        }
      }
    }
    return "";
  }
  ifYears(year) {
    const source = () => {
      if (this.query.source == "grants") {
        return "active_year";
      }
      if (this.query.source == "publications") {
        return "year";
      }
    };
    if (year == null) {
      return ``;
    }
    if (this.query.country.length > 0) {
      return `and ${source()}=${year} `;
    } else {
      return `where ${source()}=${year} `;
    }
  }
  ifCountry(index) {
    const source = () => {
      if (this.query.source == "grants") {
        return "research_orgs.name";
      }
      if (this.query.source == "publications") {
        return "research_org_country_names";
      }
    };
    if (index == null) {
      return ``;
    }
    if (this.query.country[index][0] == "!") {
      return `where ${source()}!="${this.query.country[index].replace(
        "!",
        ""
      )}" `;
    }
    return `where ${source()}="${this.query.country[index]}" `;
  }
  ifKeyWord() {
    if (this.query.keyword == null) {
      return ``;
    }
    return `for "${this.query.keyword}"`;
  }
  ifIndex() {
    if (this.query.index == null) {
      return ``;
    }
    return `in ${this.query.index} `;
  }
  /**
   * @param  {{{year: country: returns:},{reponse:}}} data
   */
  aggregate(data, query) {
    let containerByCountry = {};
    for (let country in query.country) {
      containerByCountry[query.country[country]] = {};
      for (let returns in query.returns) {
        containerByCountry[query.country[country]][query.returns[returns]] = {};
      }
    }
    console.log(containerByCountry);
    for (let i = 0; i < data.length; i++) {
      for (let response in query.returns) {
        response = query.returns[response];
        if (data[i].response[response] == undefined) {
          continue;
        }
        console.log(response);
        let tmp = this.format(
          data[i].response[response],
          response,
          data[i].request.year
        );
        for (let key in tmp) {
          if (key in containerByCountry[data[i].request.country][response]) {
            containerByCountry[data[i].request.country][response][key].push(
              tmp[key][0]
            );
          } else {
            containerByCountry[data[i].request.country][response][key] = [];
            containerByCountry[data[i].request.country][response][key].push(
              tmp[key][0]
            );
          }
        }
      }
    }
    console.log(containerByCountry);
    return containerByCountry;
  }
  format(result, category, year) {
    //{chartName: xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
    let tmp = this.responseList[category].format(result, year);
    console.log(tmp);
    return tmp;
  }

  category_for(data, year) {
    let result = {};
    for (let i = 0; i < data.length; i++) {
      let rawData = { x: year, y: data[i].count };
      result[data[i].name] = [];
      result[data[i].name].push(rawData);
    }
    return result;
  }

  year(data, year) {
    result = { year: [] };
    for (let i = 0; i < data.length; i++) {
      result.year.push({ x: data[i].id, y: data[i].count });
    }
    return result;
  }

  FOR(data, year) {
    let result = {};
    if (data == null) {
      return;
    }
    for (let i = 0; i < data.length; i++) {
      let rawData = { x: year, y: data[i].funding };
      result[data[i].name] = [];
      result[data[i].name].push(rawData);
    }
    return result;
  }

  createChartData(aggregatedData) {
    //{viewName: chartName: xdomain:[], ydomain:[], lines:[{name:, rawdata:[{x:,y:}], data:[{x:,y:}]}, {name:, rawdata:[{x:,y:}], data:[{x:,y:}]}]}
    let listOfCharts = {};
    for (let country in aggregatedData) {
      for (let view in aggregatedData[country]) {
        for (let chart in aggregatedData[country][view]) {
          if (chart in listOfCharts) {
            const endXElement = aggregatedData[country][view][chart].length - 1;
            listOfCharts[chart].lines.push({
              name: country,
              rawdata: aggregatedData[country][view][chart],
              data: aggregatedData[country][view][chart]
            });
            listOfCharts[chart].xdomain[0] = Math.min(
              listOfCharts[chart].xdomain[0],
              aggregatedData[country][view][chart][0].x
            );
            listOfCharts[chart].xdomain[1] = Math.max(
              listOfCharts[chart].xdomain[1],
              aggregatedData[country][view][chart][endXElement].x
            );
            const yMin = Math.min.apply(
              Math,
              aggregatedData[country][view][chart].map(element => {
                return element.y;
              })
            );
            const yMax = Math.max.apply(
              Math,
              aggregatedData[country][view][chart].map(element => {
                return element.y;
              })
            );
            listOfCharts[chart].ydomain[0] = Math.min(
              yMin,
              listOfCharts[chart].ydomain[0]
            );
            listOfCharts[chart].ydomain[1] = Math.max(
              yMax,
              listOfCharts[chart].ydomain[1]
            );
          } else {
            const endXElement = aggregatedData[country][view][chart].length - 1;

            listOfCharts[chart] = {};
            listOfCharts[chart] = {
              viewName: view,
              chartName: chart,
              xdomain: [
                aggregatedData[country][view][chart][0].x,
                aggregatedData[country][view][chart][endXElement].x
              ],
              ydomain: [
                Math.min.apply(
                  Math,
                  aggregatedData[country][view][chart].map(element => {
                    return element.y;
                  })
                ),
                Math.max.apply(
                  Math,
                  aggregatedData[country][view][chart].map(element => {
                    return element.y;
                  })
                )
              ],
              lines: [
                {
                  name: country,
                  rawdata: aggregatedData[country][view][chart],
                  data: aggregatedData[country][view][chart]
                }
              ]
            };
          }
        }
      }
    }
    return listOfCharts;
  }
}
