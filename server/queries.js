//https://docs.dimensions.ai/dsl/
const request = require("request");
const callLimit = require("./apicallrestrict");
const fs = require("fs");
//use the exampleconfiglogin and input your credentials there
const login = require("./resources/configlogin.json");
//var jwt_token;
var api_url_auth = "https://app.dimensions.ai/api/auth.json";
var api_url = "https://app.dimensions.ai/api/dsl.json";

let jwt_token = JSON.parse(process.env.KEY);

let recommended = JSON.parse(process.env.RECOMMEND_LIST);

let geoData = require("./resources/custom.geo.json");
let countryTotals = require("./resources/countryTotals.json");

//keeps track of the usage and restricts if we are approaching the limit
var timer = new callLimit();
/**
 * @param  {JSON} date - JSON object containing date
 * @returns {boolean} - returns false if authorization has not expired, returns true if it has expired and writes to file the current date(it assumes one will get new credentials immediately)
 */
const getAPIKey = async function() {
  return new Promise(function(resolve, reject) {
    request.post(api_url_auth, function(error, resp) {
      if (error) {
        reject(error);
      }
      let cacheToken = JSON.parse(resp.body).token;
      if (cacheToken != null) {
        jwt_token = { Authorization: "JWT " + cacheToken };
        process.env.KEY = JSON.stringify(jwt_token);
        resolve(cacheToken);
      } else {
        console.log("Error getting token.");
        reject(error);
      }
    }).body = JSON.stringify(login);
  });
};

const checkKey = async function() {
  let date = new Date(process.env.LAST_AUTHORIZED);
  let oneDay = 60 * 60 * 1000 * 24;
  if (new Date() - date > oneDay) {
    await getAPIKey();
    process.env.LAST_AUTHORIZED = new Date().toString();
  }
};

/**
 * @param  {JSON} req - format {query:}
 * @param  {} resp
 */
const queryDimensions = async (req, resp) => {
  await checkKey();
  timer.incrementCalls();
  console.log(req.body.query);
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: req.body.query
  };

  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
      throw error;
    }
    resp.send(res);
  });
};

function sleepFor(sleepDuration) {
  var now = new Date().getTime();
  while (new Date().getTime() < now + sleepDuration) {
    /* do nothing */
  }
}

const queryNotCanada = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  await checkKey();
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names!="Canada" and year=${req.body.year} return research_orgs limit 1000`
  };
  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }

    console.log(res.body);
    resp.status(200).send(res);
  });
};

const queryCanada = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  await checkKey();
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names="Canada" and year=${req.body.year} return research_orgs limit 1000`
  };

  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res.body);
    resp.status(200).send(res);
  });
};

const queryCategory = async function(req, resp) {
  await checkKey();
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names="${req.body.country_name}" and year=${req.body.year} return category_for limit 1000`
  };
  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }

    console.log(res.body);
    resp.status(200).send(res);
  });
};

const queryInstituteCitationsCan = async function(req, resp) {
  await checkKey();
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names="${req.body.country_name}" and year=${req.body.year} return publications[research_orgs + times_cited] limit 1000`
  };
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};
const queryInstituteCitationsNotCan = async function(req, resp) {
  await checkKey();
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names!="${req.body.country_name}" and year=${req.body.year} return publications[research_orgs + times_cited] limit 1000`
  };
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};

const queryCanadaFunding = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  await checkKey();
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search grants for "${req.body.keyword}" where research_org_countries.name="Canada" and active_year=${req.body.year} return research_orgs aggregate funding limit 1000`
  };

  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};
const queryFunding = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  await checkKey();
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search grants for "${req.body.keyword}" where research_org_countries.name!="Canada" and active_year=${req.body.year} return research_orgs aggregate funding limit 1000`
  };

  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};

const recommendedList = async function(req, res) {
  if ("recommended" in req.body) {
    let min = Math.min(
      ...recommended.map(function(x) {
        return x.val;
      })
    );
    console.log(min);
    if (req.body.recommended.val > min) {
      for (let i = 0; i < recommended.length; ++i) {
        if (
          recommended[i].keyword == req.body.recommended.keyword &&
          recommended[i].selection == req.body.recommended.selection
        ) {
          res.status(200).send();
          return;
        }
      }
      let idx = recommended
        .map(function(x) {
          return x.val;
        })
        .indexOf(min);
      recommended[idx] = req.body.recommended;
      console.log(idx);
      console.log(recommended);
      process.env.RECOMMEND_LIST = JSON.stringify(recommended);
    }
    res.status(200).send();
  }
};
const query = async function(req, res) {
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications where id = "pub.1123731914" return publications[concepts] limit 1000`
  };
  request.post(options, (error, res) => {
    console.log(res);
    let data = JSON.parse(res.body);
    let countryNames = [];
    //fs.writeFileSync("concept.json", JSON.stringify(data));
  });
};
const getCountryTotalPapers = async function(req, resp) {
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications where research_org_country_names="${req.body.country}" and year=${req.body.year} return publications`
  };
  await checkKey();
  return new Promise(function(resolve, reject) {
    request.post(options, (error, res) => {
      if (error) {
        console.error(error);
        reject(error);
      }
      resolve(res.body);
    });
  });
};
const getRecommendedList = async function(req, res) {
  res.status(200).send(recommended);
};

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function getCountries() {
  const currentIndex = Object.keys(countryTotals).length - 1;
  for (let i = currentIndex; i < countryNames.length; ++i) {
    countryTotals[countryNames[i]] = {};
    console.log(countryNames[i], i, countryNames.length);
    for (let j = 1950; j <= 2020; ++j) {
      let data = await getCountryTotalPapers({
        body: { country: countryNames[i], year: j }
      });
      await sleep(2000);
      data = JSON.parse(data);
      countryTotals[countryNames[i]][j] = data._stats.total_count;
      fs.writeFileSync(
        "./server/resources/countryTotals.json",
        JSON.stringify(countryTotals)
      );
    }
  }
  fs.writeFileSync(
    "./server/resources/countryTotals.json",
    JSON.stringify(countryTotals)
  );
}

module.exports = {
  queryDimensions,
  queryNotCanada,
  queryCanada,
  queryCategory,
  queryInstituteCitationsCan,
  queryInstituteCitationsNotCan,
  queryCanadaFunding,
  queryFunding,
  recommendedList,
  getRecommendedList
};
