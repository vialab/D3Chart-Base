class QueryObject {
  intervals = 1;
  rawQuery;
  query = {
    source: "",
    index: null,
    keyword: "",
    country: [],
    years: "",
    range: "",
    returns: [],
    sort: "",
    aggregate: ""
  };
  reponseList = {
    category_for: { count: "", name: "" },
    year: { id: "", count: "" }
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
      year: "year"
    }
  };
  responses = [];
  route = "/query-dimensions";
  currentYear;
  currentCountry;
  constructor(query) {
    this.rawQuery = query;
    this.analyzeQuery();
  }

  analyzeQuery() {
    let jsonQuery = JSON.parse(this.rawQuery);
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
      this.query.keyword = jsonQuery.keyword;
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
    )}${this.ifYears(years)} ${this.getReturns()}sort by count`;
  }
  queryDim(years, countries) {
    console.log(years + " " + countries);
    this.responses.push({
      request: { year: years, country: this.query.country[countries] },
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

  finished() {
    console.log(this.responses);
  }
  getReturns() {
    let result = "";
    for (let i = 0; i < this.query.returns.length; i++) {
      result += "return " + this.query.returns[i] + " ";
    }
    return `${result}`;
  }
  ifYears(year) {
    if (year == null) {
      return ``;
    }
    if (this.query.country.length > 0) {
      return `and year=${year} `;
    } else {
      return `where year=${year} `;
    }
  }
  ifCountry(index) {
    if (index == null) {
      return ``;
    }
    if (this.query.country[index][0] == "!") {
      return `where research_org_country_names!="${
        this.query.country[index].split("!")[0]
      }" `;
    }
    return `where research_org_country_names="${this.query.country[index]}" `;
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
  format(data) {}
}
