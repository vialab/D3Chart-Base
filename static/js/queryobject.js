class QueryObject {
  intervals = 1;
  rawQuery;
  query = {
    source: "",
    index: null,
    keyword: "",
    country: "",
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

    returns: {}
  };
  response = [];
  route = "./dimensions-query";
  constructor(query) {
    this.rawQuery = query;
  }

  analyzeQuery() {
    let splitQuery = this.rawQuery.split(":");
    let currentIndex = 0;

    //sources
    if (!(splitQuery[currentIndex] in this.reference.sources)) {
      throw new Error(`${splitQuery[currentIndex]} is not a valid source`);
    }
    this.query.source = splitQuery[currentIndex];
    currentIndex++;

    //indices
    if (splitQuery[currentIndex] in this.reference.indices[this.query.source]) {
      this.query.index = splitQuery[currentIndex];
      currentIndex++;
    } else {
      //keyword
      this.query.keyword = splitQuery[currentIndex].split(",");
      currentIndex++;
    }

    //filter
    let filter;
    try {
      filter = JSON.parse(splitQuery[currentIndex]);
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
        currentIndex++;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }

    //returns
    let returns = splitQuery[currentIndex].split(",");

    for (returnElement in returns) {
      if (!(returnElement in this.query.returns)) {
        throw new Error(`Error return element ${returnElement}`);
      }
    }

    this.query.returns = returns;
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

  async query(query, years, countries) {
    d3.json(this.route, {
      method: "POST",
      body: JSON.stringify({
        query: `search ${
          this.query.source
        } ${this.ifIndex()} ${this.ifKeyWord()} ${this.ifCountry(
          countries
        )} ${this.ifYears(years)} ${this.getReturns()} sort by count`
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    });
  }

  getReturns() {
    let result = "return ";
    for (i = 0; i < this.query.returns.length; i++) {
      result += this.query.returns[i] + " return ";
    }
    return `${result}`;
  }
  ifYears(year) {
    if (!this.query.country.length) {
      return `where year=${year} `;
    } else `and year=${year} `;
  }
  ifCountry(index) {
    if (index == null) {
      return ``;
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
    return `in ${this.query.index}`;
  }
  format(data) {}
}
